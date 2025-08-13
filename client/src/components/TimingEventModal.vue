<template>
  <!-- タイミングエディタモーダル -->
  <div v-if="showTimingEditor" class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50" @click.self="cancelTimingEventEdit(); $emit('update:showTimingEditor', false)">
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
          <button @click="$emit('update:showTimingEditor', false)" class="button-secondary">閉じる</button>
        </div>
        <div v-else>
          <button @click="saveTimingEvent" class="button-primary mr-2">保存</button>
          <button @click="cancelTimingEventEdit" class="button-secondary">キャンセル</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { chart } from '../stores/chart.js';
import { currentTime } from '../stores/player.js';
import { showTimingEditor } from '../stores/editor.js';
import { MODULE_INFO } from '../constants.js';
import { useTiming } from '../composables/useTiming.js';
import { getModuleInfo as getModuleInfoUtil } from '../utils/moduleUtils.js';

// Props
defineProps({
  showTimingEditor: {
    type: Boolean,
    required: true
  }
});

// Emits
defineEmits(['update:showTimingEditor']);

// Composables
const { 
  currentBpm, currentBeatSignature, 
  sortedTimingChanges, visibleModule,
  measureToTime, timeToMeasure
} = useTiming();

// UI固有の状態
const showTimingEventForm = ref(false);
const editingEvent = ref(null);

// メソッド
const getModuleInfo = (moduleId) => getModuleInfoUtil(moduleId);

// タイミングイベント編集
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
</script>
