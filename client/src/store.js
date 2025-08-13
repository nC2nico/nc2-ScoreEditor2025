/**
 * 統合ストア - 後方互換性のため
 * 新しいコードでは個別のストアファイルを直接インポートすることを推奨
 */

// 分割されたストアから状態をre-export
export { 
  chart, 
  resetChart, 
  setChart 
} from './stores/chart.js';

export { 
  audioContext, 
  audioBuffer, 
  isPlaying, 
  currentTime, 
  audioDuration,
  resetAudioState,
  setCurrentTime,
  togglePlayback,
  stopPlayback
} from './stores/player.js';

export { 
  pixelsPerSecond, 
  gridSnap, 
  currentTool, 
  selectedNote, 
  scrollTop,
  showTimingEditor,
  AVAILABLE_TOOLS,
  AVAILABLE_SNAP_VALUES,
  setCurrentTool,
  setGridSnap,
  clearSelection,
  selectNote,
  setZoom,
  resetEditorState
} from './stores/editor.js';
