<template>
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
      <button @click="$emit('openTimingEditor')" class="w-full button-primary-hollow">編集</button>
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
</template>

<script setup>
import { chart } from '../stores/chart.js';
import { difficultyMap } from '../constants.js';
import { useAudio } from '../composables/useAudio.js';
import { useChartIO } from '../composables/useChartIO.js';

// Emits
defineEmits(['openTimingEditor']);

// Composables
const { loadAudio } = useAudio();
const { importChart, exportChart } = useChartIO();
</script>
