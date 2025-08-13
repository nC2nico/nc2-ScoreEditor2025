<template>
  <div class="flex h-screen">

    <!-- 左パネル: ツールボックス -->
    <ToolboxPanel />

    <!-- 中央パネル: 譜面エディタ -->
    <ScoreEditor ref="scoreEditor" />

    <!-- 右パネル: 情報 -->
    <InfoPanel @openTimingEditor="showTimingEditor = true" />

    <!-- タイミングイベント編集モーダル -->
    <TimingEventModal 
      :showTimingEditor="showTimingEditor" 
      @update:showTimingEditor="showTimingEditor = $event" 
    />

  </div>
</template>

<script setup>
import { ref, onBeforeUnmount, watch } from 'vue';
import { 
  isPlaying, 
  currentTime 
} from './stores/player.js';
import { 
  showTimingEditor 
} from './stores/editor.js';
import { useAudio } from './composables/useAudio.js';
import { timeToY } from './utils/timelineConverter.js';
import TimingEventModal from './components/TimingEventModal.vue';
import ToolboxPanel from './components/ToolboxPanel.vue';
import ScoreEditor from './components/ScoreEditor.vue';
import InfoPanel from './components/InfoPanel.vue';

// --- DOM要素 ---
const scoreEditor = ref(null);

// --- Composablesのセットアップ ---
const { updateCurrentTime, closeAudioContext } = useAudio();

// --- UI固有の状態 ---
// (各コンポーネントに移動済み)

// --- メソッド ---
// (各コンポーネントに移動済み)

// --- タイミングイベント編集 ---
// (TimingEventModal.vue に移動)

// --- ライフサイクル ---
let animationFrameId;
const animationLoop = () => {
  if (!isPlaying.value) return;
  
  updateCurrentTime();

  // Auto-scroll
  if (scoreEditor.value?.editorContainer) {
    const newScrollTop = timeToY(currentTime.value) - scoreEditor.value.editorContainer.clientHeight / 2;
    scoreEditor.value.editorContainer.scrollTop = newScrollTop;
  }

  // 再生停止条件の判定は各コンポーネントに移譲
  animationFrameId = requestAnimationFrame(animationLoop);
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
