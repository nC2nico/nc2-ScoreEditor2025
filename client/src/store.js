import { reactive, ref } from 'vue';

// --- Global State ---

// The core chart data object
export const chart = reactive({
  meta: {
    title: "新しい曲",
    artist: "アーティスト",
    charter: "譜面制作者",
    audioFileName: "",
    initialDifficulty: 1,
  },
  timing: {
    initialBpm: 120.0,
    initialBeatRate: 4.0,
    initialOffsetMs: 0.0,
    changes: [],
  },
  notes: {
    0: [], 1: [], 2: [], 3: [], 4: []
  },
});

// Audio and playback state
export const audioContext = ref(null);
export const audioBuffer = ref(null);
export const isPlaying = ref(false);
export const currentTime = ref(0);
export const audioDuration = ref(0);

// Editor state
export const pixelsPerSecond = ref(100); // Zoom level
export const gridSnap = ref(16);
export const currentTool = ref('tap');
export const selectedNote = ref(null);
export const scrollTop = ref(0);

// UI state
export const showTimingEditor = ref(false);
