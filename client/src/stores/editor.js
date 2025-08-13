import { ref } from 'vue';

/**
 * エディタ関連の状態管理
 * ツール選択、表示設定、選択状態、UI状態を管理
 */

// エディタの表示・編集設定
export const pixelsPerSecond = ref(100); // ズームレベル
export const gridSnap = ref(16); // スナップ設定
export const scrollTop = ref(0); // スクロール位置

// ツールと選択状態
export const currentTool = ref('tap'); // 現在選択中のツール
export const selectedNote = ref(null); // 選択中のノーツ

// UI状態
export const showTimingEditor = ref(false); // タイミングエディタの表示状態

/**
 * 利用可能なツールの一覧
 */
export const AVAILABLE_TOOLS = ['select', 'tap', 'long', 'erase'];

/**
 * 利用可能なスナップ設定の一覧
 */
export const AVAILABLE_SNAP_VALUES = [4, 8, 12, 16, 24, 32];

/**
 * ツールを設定する
 * @param {string} tool - 設定するツール名
 */
export const setCurrentTool = (tool) => {
  if (AVAILABLE_TOOLS.includes(tool)) {
    currentTool.value = tool;
  } else {
    console.warn(`Unknown tool: ${tool}`);
  }
};

/**
 * スナップ値を設定する
 * @param {number} snap - 設定するスナップ値
 */
export const setGridSnap = (snap) => {
  if (AVAILABLE_SNAP_VALUES.includes(snap)) {
    gridSnap.value = snap;
  } else {
    console.warn(`Invalid snap value: ${snap}`);
  }
};

/**
 * ノーツの選択状態をクリアする
 */
export const clearSelection = () => {
  selectedNote.value = null;
};

/**
 * ノーツを選択する
 * @param {Object} note - 選択するノーツオブジェクト
 */
export const selectNote = (note) => {
  selectedNote.value = note;
};

/**
 * ズームレベルを設定する
 * @param {number} zoom - ズームレベル（20-400）
 */
export const setZoom = (zoom) => {
  pixelsPerSecond.value = Math.max(20, Math.min(400, zoom));
};

/**
 * エディタ状態をリセットする
 */
export const resetEditorState = () => {
  currentTool.value = 'tap';
  selectedNote.value = null;
  showTimingEditor.value = false;
  pixelsPerSecond.value = 100;
  gridSnap.value = 16;
  scrollTop.value = 0;
};
