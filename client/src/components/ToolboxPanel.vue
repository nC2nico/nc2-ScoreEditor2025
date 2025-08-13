<template>
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
</template>

<script setup>
import { currentTool, gridSnap } from '../stores/editor.js';
import { useTiming } from '../composables/useTiming.js';

// Composables
const { currentBpm, currentBeatSignature } = useTiming();
</script>
