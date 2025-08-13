<template>
  <!-- 中央パネル: 譜面エディタ -->
  <main class="flex-grow flex flex-col overflow-hidden bg-gray-900">
    <!-- 上部コントロール -->
    <div class="flex-shrink-0 bg-gray-800 p-2 flex justify-center items-center space-x-4 z-40">
      <button @click="togglePlay" class="control-button text-2xl">{{ isPlaying ? '■' : '▶' }}</button>
      <div class="flex items-center space-x-2">
        <span class="text-sm">{{ formatTime(currentTime) }}</span>
        <input type="range" class="w-64" :value="currentTime" @input="seek(parseFloat($event.target.value))" min="0" :max="audioDuration">
        <span class="text-sm">{{ formatTime(audioDuration) }}</span>
      </div>
      <div class="flex items-center space-x-2">
        <label for="zoom" class="text-sm">ズーム:</label>
        <input type="range" id="zoom" min="20" max="400" v-model.number="pixelsPerSecond" class="w-32">
      </div>
    </div>
    
    <!-- タイムライン -->
    <div id="editor-container" ref="editorContainer" class="flex-grow bg-gray-900 overflow-auto relative" @scroll="handleScroll">
      <!-- Sticky Module Display -->
      <div class="flex-shrink-0 grid grid-cols-2 text-center sticky top-0 z-30">
        <div class="p-1" :class="getModuleInfo(visibleModule.left).color">
          <span class="font-bold" :class="getModuleInfo(visibleModule.left).textColor">{{ getModuleInfo(visibleModule.left).name }}</span>
        </div>
        <div class="p-1" :class="getModuleInfo(visibleModule.right).color">
          <span class="font-bold" :class="getModuleInfo(visibleModule.right).textColor">{{ getModuleInfo(visibleModule.right).name }}</span>
        </div>
      </div>

      <div class="relative flex">
        <!-- 時間/小節数表示 -->
        <div class="w-32 flex-shrink-0 text-right pr-2 pt-1">
          <div class="relative" :style="{ height: timelineHeight + 'px' }">
            <template v-for="marker in gridMarkers.filter(m => m.isMeasure)" :key="'time-marker-' + marker.measure">
               <div class="absolute -top-2 right-2 text-xs" :style="{ top: marker.y + 'px' }">
                <div class="text-gray-200 font-bold text-sm">#{{ marker.measure }}</div>
                <div class="text-gray-500">{{ formatTime(marker.time, true) }}</div>
                <div v-if="timingEventsMap.has(marker.time)" class="text-yellow-400 text-xs mt-1">
                  <template v-if="timingEventsMap.get(marker.time).type === 'bpmChange'">
                    BPM: {{ timingEventsMap.get(marker.time).changedBpm.toFixed(1) }}
                  </template>
                  <template v-if="timingEventsMap.get(marker.time).type === 'beatRateChange'">
                    {{ timingEventsMap.get(marker.time).changedBeatRate }}/4
                  </template>
                </div>
              </div>
            </template>
          </div>
        </div>

        <!-- レーンエリア -->
        <div id="timeline" 
             class="relative flex-grow" 
             :style="{ height: timelineHeight + 'px' }" 
             @mousedown="handleTimelineMousedown" 
             @mousemove="handleTimelineMousemove">
          <!-- 再生カーソル -->
          <div class="absolute w-full h-0.5 bg-red-500 z-30" :style="{ top: timeToY(currentTime) + 'px' }">
            <div class="absolute -left-2 -top-2 text-red-500 text-xs">▶</div>
          </div>

          <!-- グリッド線 -->
          <div class="absolute w-full h-full top-0 left-0 pointer-events-none z-10">
            <!-- 小節線と拍線 -->
            <template v-for="marker in gridMarkers" :key="'grid-' + marker.time">
              <div 
                class="absolute w-full border-t"
                :style="{ top: marker.y + 'px' }"
                :class="marker.isMeasure ? 'border-white/30 border-solid' : 'border-white/10 border-dashed'"
              ></div>
            </template>
            <!-- スナップ線 -->
            <template v-for="marker in snapMarkers" :key="'snap-' + marker.y">
              <div 
                class="absolute w-full border-t border-gray-600 border-dashed"
                :style="{ top: marker.y + 'px' }"
              ></div>
            </template>
          </div>

          <!-- レーン背景 -->
          <div class="absolute w-full h-full top-0 left-0 flex z-0">
            <template v-for="(segment, index) in moduleSegments" :key="'segment-' + index">
              <div class="absolute w-full flex" :style="{ top: timeToY(segment.startTime) + 'px', height: timeToY(segment.endTime) - timeToY(segment.startTime) + 'px' }">
                <div class="w-1/2 h-full relative flex" :class="getModuleInfo(segment.leftModule).color">
                  <template v-if="segment.leftModule === 3" v-for="i in 5" :key="'left-lane-c-' + i">
                    <div
                      :style="{
                        width: [24, 14, 24, 14, 24][i-1] + '%',
                        left: [0, 24, 38, 62, 76][i-1] + '%',
                        position: 'absolute',
                        background: i % 2 === 0 ? 'rgba(40,0,60,0.7)' : 'rgba(80,0,120,0.3)'
                      }"
                      class="h-full border-r border-gray-700/50"
                    ></div>
                  </template>
                  <template v-else v-for="i in getLaneCount(segment.leftModule)" :key="'left-lane-other-' + i">
                    <div class="flex-1 h-full border-r border-gray-700/50"></div>
                  </template>
                </div>
                <div class="w-1/2 h-full relative flex" :class="getModuleInfo(segment.rightModule).color">
                  <template v-if="segment.rightModule === 3" v-for="i in 5" :key="'right-lane-c-' + i">
                    <div
                      :style="{
                        width: [16, 12, 16, 12, 16][i-1] + '%',
                        background: i % 2 === 0 ? 'rgba(40,0,60,0.7)' : 'rgba(80,0,120,0.3)',
                        marginLeft: i === 1 ? '0%' : '0%',
                        marginRight: '0%'
                      }"
                      class="h-full border-r border-gray-700/50"
                    ></div>
                  </template>
                  <template v-else v-for="i in getLaneCount(segment.rightModule)" :key="'right-lane-other-' + i">
                    <div class="flex-1 h-full border-r border-gray-700/50"></div>
                  </template>
                </div>
              </div>
            </template>
          </div>

          <!-- ノーツ描画 -->
          <div class="absolute w-full h-full top-0 left-0 z-20 pointer-events-none">
            <!-- 既存ノーツ -->
            <template v-for="(noteList, moduleId) in chart.notes" :key="moduleId">
              <div v-for="note in noteList" 
                    :key="note.id"
                    class="note pointer-events-auto"
                    :class="{ 'note-selected': selectedNote && selectedNote.id === note.id }"
                    :style="getNoteStyle(note)"
                    @mousedown.stop="selectNote(note)">
              </div>
            </template>
            <!-- ロングノーツプレビュー -->
            <div v-if="longNotePreview"
                 class="note note-preview"
                 :style="getNoteStyle(longNotePreview)">
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref } from 'vue';
import { chart } from '../stores/chart.js';
import { 
  audioDuration, 
  isPlaying, 
  currentTime 
} from '../stores/player.js';
import { 
  selectedNote, 
  pixelsPerSecond 
} from '../stores/editor.js';
import { useAudio } from '../composables/useAudio.js';
import { useTimeline } from '../composables/useTimeline.js';
import { useTiming } from '../composables/useTiming.js';
import { useNoteEditor } from '../composables/useNoteEditor.js';
import { getModuleInfo as getModuleInfoUtil, getLaneCount as getLaneCountUtil } from '../utils/moduleUtils.js';
import { timeToY } from '../utils/timelineConverter.js';

// DOM要素
const editorContainer = ref(null);

// Composables
const { togglePlay, updateCurrentTime } = useAudio();
const { timelineHeight, seek, handleScroll } = useTimeline(editorContainer);
const { 
  getBpmAt, getModuleAt,
  gridMarkers, snapMarkers, visibleModule, moduleSegments,
  timingEventsMap,
  snapTimeToBeat
} = useTiming();
const { 
  longNotePreview, getNoteStyle, selectNote, 
  handleTimelineMousedown, handleTimelineMousemove
} = useNoteEditor(editorContainer, getBpmAt, getModuleAt, snapTimeToBeat);

// メソッド
const getModuleInfo = (moduleId) => getModuleInfoUtil(moduleId);
const getLaneCount = (moduleId) => getLaneCountUtil(moduleId);

const formatTime = (seconds, short = false) => {
  if (isNaN(seconds) || seconds < 0) return short ? '00:00' : "00:00.000";
  const min = Math.floor(seconds / 60).toString().padStart(2, '0');
  const sec = Math.floor(seconds % 60).toString().padStart(2, '0');
  if (short) return `${min}:${sec}`;
  const ms = (seconds % 1).toFixed(3).substring(2);
  return `${min}:${sec}.${ms}`;
};

// Expose editorContainer to parent
defineExpose({
  editorContainer
});
</script>
