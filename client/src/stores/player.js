import { ref } from 'vue';

/**
 * 音声再生関連の状態管理
 * オーディオコンテキスト、再生状態、時間管理を担当
 */

// オーディオ関連の状態
export const audioContext = ref(null);
export const audioBuffer = ref(null);
export const isPlaying = ref(false);
export const currentTime = ref(0);
export const audioDuration = ref(0);

/**
 * オーディオ状態をリセットする
 */
export const resetAudioState = () => {
  isPlaying.value = false;
  currentTime.value = 0;
  audioDuration.value = 0;
  audioBuffer.value = null;
  // audioContextは明示的に閉じる必要がある場合のみリセット
};

/**
 * 再生時間を設定する
 * @param {number} time - 設定する時間（秒）
 */
export const setCurrentTime = (time) => {
  currentTime.value = Math.max(0, Math.min(time, audioDuration.value));
};

/**
 * 再生状態を切り替える
 */
export const togglePlayback = () => {
  isPlaying.value = !isPlaying.value;
};

/**
 * 再生を停止する
 */
export const stopPlayback = () => {
  isPlaying.value = false;
  currentTime.value = 0;
};
