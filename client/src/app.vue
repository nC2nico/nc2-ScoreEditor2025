<template>
  <div class="flex h-screen">

    <!-- 左パネル: ツールボックス -->
    <aside class="w-48 bg-gray-800 p-4 flex-shrink-0 flex flex-col space-y-6">
      <h1 class="text-2xl font-bold text-white mb-4">DualSessionEditor</h1>
      <div>
        <h2 class="font-bold mb-2 text-purple-300">ツール</h2>
        <div class="space-y-2">
          <button @click="currentTool = 'select'" :class="{'tool-active': currentTool === 'select'}" class="tool-button">選択</button>
          <button @click="currentTool = 'tap'" :class="{'tool-active': currentTool === 'tap'}" class="tool-button">Tap</button>
          <button @click="currentTool = 'long'" :class="{'tool-active': currentTool === 'long'}" class="tool-button">Long</button>
          <button @click="currentTool = 'erase'" :class="{'tool-active': currentTool === 'erase'}" class="tool-button">消しゴム</button>
        </div>
      </div>
      
      <div>
        <h2 class="font-bold mb-2 text-purple-300">BPM / 拍子</h2>
        <div class="text-center p-2 bg-gray-900 rounded-md">
          <span class="text-3xl font-bold">{{ currentBpm.toFixed(1) }}</span>
          <span class="text-lg ml-2">BPM</span>
        </div>
        <div class="text-center p-2 bg-gray-900 rounded-md mt-2">
          <span class="text-3xl font-bold">{{ currentBeatSignature.num }} / {{ currentBeatSignature.den }}</span>
        </div>
      </div>
      <div>
        <h2 class="font-bold mb-2 text-purple-300">スナップ</h2>
        <select id="grid-snap" v-model.number="gridSnap" class="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-sm">
          <option value="4">1/4</option>
          <option value="8">1/8</option>
          <option value="12">1/12 (3連符)</option>
          <option value="16">1/16</option>
          <option value="24">1/24</option>
          <option value="32">1/32</option>
        </select>
      </div>
    </aside>

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
                    <template v-for="i in getLaneCount(segment.leftModule)" :key="'left-lane-' + i">
                      <div class="flex-1 h-full border-r border-gray-700/50"></div>
                    </template>
                  </div>
                  <div class="w-1/2 h-full relative flex" :class="getModuleInfo(segment.rightModule).color">
                    <template v-for="i in getLaneCount(segment.rightModule)" :key="'right-lane-' + i">
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

    <!-- 右パネル: 情報 -->
    <aside class="w-64 bg-gray-800 p-4 flex-shrink-0 flex flex-col space-y-4">
      <div class="info-panel">
        <h2 class="info-panel-title">基本情報</h2>
        <div><label class="block text-sm">タイトル</label><input v-model="chart.meta.title" class="info-input"></div>
        <div><label class="block text-sm">アーティスト</label><input v-model="chart.meta.artist" class="info-input"></div>
        <div><label class="block text-sm">譜面制作者</label><input v-model="chart.meta.charter" class="info-input"></div>
        <div>
          <label class="block text-sm">難易度</label>
          <select v-model.number="chart.meta.initialDifficulty" class="info-input">
            <option v-for="(name, id) in difficultyMap" :value="id" :key="id">{{ name }}</option>
          </select>
        </div>
      </div>
      <div class="info-panel">
        <h2 class="info-panel-title">音楽情報</h2>
        <label class="w-full text-center button-primary-hollow cursor-pointer block">
          <span>{{ chart.meta.audioFileName || '音声ファイルを選択' }}</span>
          <input type="file" @change="loadAudio" accept="audio/*" class="hidden">
        </label>
        <div><label class="block text-sm">オフセット(ms)</label><input type="number" v-model.number="chart.timing.initialOffsetMs" class="info-input"></div>
      </div>
      <div class="info-panel">
        <h2 class="info-panel-title">タイミング・モジュール</h2>
        <button @click="showTimingEditor = true" class="w-full button-primary-hollow">編集</button>
      </div>
      <div class="info-panel">
        <h2 class="info-panel-title">ファイル</h2>
        <div class="grid grid-cols-2 gap-2">
          <label class="button-primary-hollow cursor-pointer text-center">
            <span>インポート</span>
            <input type="file" @change="importChart" accept=".json" class="hidden">
          </label>
          <button @click="exportChart" class="button-primary">エクスポート</button>
        </div>
      </div>
    </aside>

    <!-- タイミングエディタモーダル -->
    <div v-if="showTimingEditor" class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50" @click.self="cancelTimingEventEdit(); showTimingEditor = false">
      <div class="bg-gray-800 p-6 rounded-lg w-3/4 max-w-4xl h-3/4 flex flex-col">
        <h2 class="text-xl mb-4 font-bold">タイミング・モジュール編集</h2>

        <!-- イベントリスト -->
        <div v-if="!showTimingEventForm" class="flex-grow overflow-y-auto">
          <table class="w-full text-left table-fixed">
            <thead class="sticky top-0 bg-gray-800">
              <tr>
                <th class="w-1/4 p-2">時間 (秒)</th>
                <th class="w-1/4 p-2">タイプ</th>
                <th class="w-1/2 p-2">値</th>
                <th class="w-24 p-2"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="event in sortedTimingChanges" :key="event.id" class="border-b border-gray-700 hover:bg-gray-700/50">
                <td class="p-2">{{ event.timing.toFixed(4) }}</td>
                <td class="p-2">{{ event.type }}</td>
                <td class="p-2 text-xs">
                  <div v-if="event.type === 'bpmChange'">BPM: {{ event.changedBpm }}</div>
                  <div v-if="event.type === 'beatRateChange'">拍子: {{ event.changedBeatRate.toFixed(2) }}</div>
                  <div v-if="event.type === 'moduleChange'">
                    L: {{ getModuleInfo(event.leftModule).name }}, R: {{ getModuleInfo(event.rightModule).name }}
                  </div>
                </td>
                <td class="p-2 text-right">
                  <button @click="openEditTimingEventForm(event)" class="text-blue-400 hover:text-blue-300 mr-2">編集</button>
                  <button @click="deleteTimingEvent(event.id)" class="text-red-400 hover:text-red-300">削除</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- イベント追加・編集フォーム -->
        <div v-if="showTimingEventForm" class="flex-grow overflow-y-auto">
          <h3 class="text-lg font-semibold mb-3">{{ editingEvent.id != null ? 'イベント編集' : 'イベント追加' }}</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-bold mb-1">小節番号</label>
              <input type="number" v-model.number="editingEvent.measure" class="info-input w-full" min="1">
            </div>
            <div>
              <label class="block text-sm font-bold mb-1">タイプ</label>
              <select v-model="editingEvent.type" class="info-input w-full" :disabled="editingEvent.id != null">
                <option value="bpmChange">BPM変更</option>
                <option value="beatRateChange">拍子変更</option>
                <option value="moduleChange">モジュール変更</option>
              </select>
            </div>
            <!-- BPM変更 -->
            <div v-if="editingEvent.type === 'bpmChange'">
              <label class="block text-sm font-bold mb-1">変更後BPM</label>
              <input type="number" v-model.number="editingEvent.changedBpm" class="info-input w-full">
            </div>
            <!-- 拍子変更 -->
            <div v-if="editingEvent.type === 'beatRateChange'" class="flex items-center gap-2">
              <label class="block text-sm font-bold">変更後拍子</label>
              <input type="number" v-model.number="editingEvent.numerator" class="info-input w-20">
              <span>/</span>
              <input type="number" v-model.number="editingEvent.denominator" class="info-input w-20">
            </div>
            <!-- モジュール変更 -->
            <div v-if="editingEvent.type === 'moduleChange'" class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-bold mb-1">左モジュール</label>
                <select v-model.number="editingEvent.leftModule" class="info-input w-full">
                  <option v-for="(info, id) in MODULE_INFO" :value="parseInt(id)">{{ info.name }}</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-bold mb-1">右モジュール</label>
                <select v-model.number="editingEvent.rightModule" class="info-input w-full">
                  <option v-for="(info, id) in MODULE_INFO" :value="parseInt(id)">{{ info.name }}</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- フッターボタン -->
        <div class="flex-shrink-0 pt-4 text-right">
          <div v-if="!showTimingEventForm">
            <button @click="openAddTimingEventForm" class="button-primary mr-2">新規追加</button>
            <button @click="showTimingEditor = false" class="button-secondary">閉じる</button>
          </div>
          <div v-else>
            <button @click="saveTimingEvent" class="button-primary mr-2">保存</button>
            <button @click="cancelTimingEventEdit" class="button-secondary">キャンセル</button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onBeforeUnmount, watch } from 'vue';
import { 
  chart, audioDuration, isPlaying, currentTime, 
  selectedNote, showTimingEditor, gridSnap, pixelsPerSecond,
  currentTool // <<< 修正点: currentTool をインポート
} from './store.js';
import { MODULE_INFO, difficultyMap } from './constants.js';
import { useAudio } from './composables/useAudio.js';
import { useTimeline } from './composables/useTimeline.js';
import { useTiming } from './composables/useTiming.js';
import { useNoteEditor } from './composables/useNoteEditor.js';
import { useChartIO } from './composables/useChartIO.js';
import { getModuleInfo as getModuleInfoUtil, getLaneCount as getLaneCountUtil } from './utils/moduleUtils.js';
import { timeToY } from './utils/timelineConverter.js';

// --- DOM要素 ---
const editorContainer = ref(null);

// --- Composablesのセットアップ ---
const { loadAudio, togglePlay, updateCurrentTime, closeAudioContext } = useAudio();
const { timelineHeight, seek, handleScroll } = useTimeline(editorContainer);
const { 
  getBpmAt, getModuleAt, currentBpm, currentBeatSignature, 
  gridMarkers, snapMarkers, visibleModule, moduleSegments, sortedTimingChanges,
  timingEventsMap, measureToTime, timeToMeasure,
  snapTimeToBeat // <<< 修正点: snapTimeToBeat を useTiming から受け取る
} = useTiming();
const { 
  longNotePreview, getNoteStyle, selectNote, 
  handleTimelineMousedown, handleTimelineMousemove
} = useNoteEditor(editorContainer, getBpmAt, getModuleAt, snapTimeToBeat);
const { importChart, exportChart } = useChartIO();


// --- UI固有の状態 ---
const showTimingEventForm = ref(false);
const editingEvent = ref(null);


// --- メソッド ---
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

// --- タイミングイベント編集 ---
const openAddTimingEventForm = () => {
  const sig = currentBeatSignature.value;
  editingEvent.value = {
    measure: timeToMeasure(currentTime.value), // Convert current time to measure
    type: 'bpmChange',
    changedBpm: currentBpm.value,
    numerator: sig.num,
    denominator: sig.den,
    leftModule: visibleModule.value.left,
    rightModule: visibleModule.value.right,
  };
  showTimingEventForm.value = true;
};

const openEditTimingEventForm = (event) => {
  const eventCopy = JSON.parse(JSON.stringify(event));
  eventCopy.measure = timeToMeasure(event.timing); // Convert time to measure for editing

  if (eventCopy.type === 'beatRateChange') {
    const rate = eventCopy.changedBeatRate;
    if (rate === 3) { eventCopy.numerator = 6; eventCopy.denominator = 8; }
    else if (rate === 6) { eventCopy.numerator = 3; eventCopy.denominator = 2; }
    else { eventCopy.numerator = rate; eventCopy.denominator = 4; }
  }
  editingEvent.value = eventCopy;
  showTimingEventForm.value = true;
};

const cancelTimingEventEdit = () => {
  editingEvent.value = null;
  showTimingEventForm.value = false;
};

const saveTimingEvent = () => {
  const eventToSave = { ...editingEvent.value };
  
  // Convert measure back to time before saving
  eventToSave.timing = measureToTime(eventToSave.measure);

  const cleanEvent = {
    type: eventToSave.type,
    timing: eventToSave.timing,
  };

  // タイプに応じて必要なプロパティのみをコピー
  if (eventToSave.type === 'bpmChange') {
    cleanEvent.changedBpm = eventToSave.changedBpm;
  } else if (eventToSave.type === 'beatRateChange') {
    if (eventToSave.denominator > 0) {
      cleanEvent.changedBeatRate = (eventToSave.numerator / eventToSave.denominator) * 4;
    }
  } else if (eventToSave.type === 'moduleChange') {
    cleanEvent.leftModule = eventToSave.leftModule;
    cleanEvent.rightModule = eventToSave.rightModule;
  }
  
  // 編集の場合
  if (eventToSave.id != null) {
    const index = chart.timing.changes.findIndex((_, i) => i === eventToSave.id);
    if (index > -1) {
      // 時間が0のイベントを編集して別の時間になった場合、元のイベントを削除して新しいイベントを追加
      if (chart.timing.changes[index].timing === 0 && cleanEvent.timing !== 0) {
         chart.timing.changes.splice(index, 1);
         chart.timing.changes.push(cleanEvent);
      } else {
        chart.timing.changes[index] = cleanEvent;
      }
    }
  } else { // 新規追加の場合
    // 時間が0のイベントは初期値を更新
    if (cleanEvent.timing === 0) {
      if (cleanEvent.type === 'bpmChange') {
        chart.timing.initialBpm = cleanEvent.changedBpm;
      } else if (cleanEvent.type === 'beatRateChange') {
        chart.timing.initialBeatRate = cleanEvent.changedBeatRate;
      } else {
        // 時間0のモジュール変更は通常ありえないが、念のため配列に追加
        chart.timing.changes.push(cleanEvent);
      }
    } else {
       chart.timing.changes.push(cleanEvent);
    }
  }

  cancelTimingEventEdit();
};

const deleteTimingEvent = (id) => {
  if (confirm('このイベントを削除しますか？')) {
    chart.timing.changes = chart.timing.changes.filter((_, i) => i !== id);
  }
};

// --- ライフサイクル ---
let animationFrameId;
const animationLoop = () => {
  if (!isPlaying.value) return;
  
  updateCurrentTime();

  // Auto-scroll
  if (editorContainer.value) {
    const newScrollTop = timeToY(currentTime.value) - editorContainer.value.clientHeight / 2;
    editorContainer.value.scrollTop = newScrollTop;
  }

  if (currentTime.value >= audioDuration.value) {
    togglePlay(); // Stop playback
    currentTime.value = 0;
  } else {
    animationFrameId = requestAnimationFrame(animationLoop);
  }
};

watch(isPlaying, (newVal) => {
  if (newVal) {
    animationLoop();
  } else {
    cancelAnimationFrame(animationFrameId);
  }
});

onBeforeUnmount(() => {
  cancelAnimationFrame(animationFrameId);
  closeAudioContext();
});

</script>
