import { reactive } from 'vue';

/**
 * 譜面データの状態管理
 * メタデータ、タイミング情報、ノーツデータを管理
 */

// 譜面の中核データオブジェクト
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

/**
 * 譜面データをリセットする
 */
export const resetChart = () => {
  chart.meta.title = "新しい曲";
  chart.meta.artist = "アーティスト";
  chart.meta.charter = "譜面制作者";
  chart.meta.audioFileName = "";
  chart.meta.initialDifficulty = 1;
  
  chart.timing.initialBpm = 120.0;
  chart.timing.initialBeatRate = 4.0;
  chart.timing.initialOffsetMs = 0.0;
  chart.timing.changes = [];
  
  // すべてのモジュールのノーツをクリア
  Object.keys(chart.notes).forEach(moduleId => {
    chart.notes[moduleId] = [];
  });
};

/**
 * 譜面データを設定する
 * @param {Object} newChart - 新しい譜面データ
 */
export const setChart = (newChart) => {
  Object.assign(chart.meta, newChart.meta);
  Object.assign(chart.timing, newChart.timing);
  Object.assign(chart.notes, newChart.notes);
};
