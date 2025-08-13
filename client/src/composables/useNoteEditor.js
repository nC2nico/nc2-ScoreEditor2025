import { ref } from 'vue';
import { chart } from '../stores/chart.js';
import { currentTool, gridSnap, selectedNote } from '../stores/editor.js';
import { yToTime, timeToY } from '../utils/timelineConverter.js';
import { MODULE_LANE_COUNT } from '../constants.js';

// snapTimeToBeat は useNoteEditor の呼び出し元 (app.vue) から渡すように変更
export function useNoteEditor(editorContainer, getBpmAt, getModuleAt, snapTimeToBeat) {

  const longNoteStart = ref(null);
  const longNotePreview = ref(null);

  // TimeConverter の定義が存在しないため、この行を削除
  // const timeConverter = computed(() => new TimeConverter(chart.timing));

  const getLaneCount = (moduleId) => MODULE_LANE_COUNT[moduleId] ?? 0;

  const getNoteStyle = (note) => {
    const moduleAtNoteTime = getModuleAt(note.timing);
    const activeSideModule = note.side === 'Left' ? moduleAtNoteTime.left : moduleAtNoteTime.right;

    if (note.moduleType !== activeSideModule) {
      return { display: 'none' };
    }

    const totalLanes = getLaneCount(note.moduleType);
    if (totalLanes === 0) return {};

    const laneWidth = note.moduleType === 3 ? [12, 7, 12, 7, 12][note.lane] : 50 / totalLanes;
    const leftOffset = note.side === 'Left' ? 0 : 50;
    const notesLaneOffset = note.moduleType === 3 ? [0, 12, 19, 31, 38][note.lane] : note.lane * laneWidth;
    
    const startY = timeToY(note.timing);
    
    let height;
    if (note.notesType === 'Long' && note.longDuration) {
      height = timeToY(note.timing + note.longDuration) - startY;
    } else {
      height = 16; // Fixed height for tap notes
    }
    return {
      top: `${startY}px`,
      left: `${leftOffset + notesLaneOffset}%`,
      width: `${laneWidth}%`,
      height: `${Math.max(2, height)}px`,
      minHeight: '2px'
    };
  };

const addNote = (noteData) => {
    // 修正: ノーツの重複チェックを追加
    const isOverlapping = chart.notes[noteData.moduleType]?.some(note => 
        note.timing === noteData.timing && 
        note.lane === noteData.lane && 
        note.side === noteData.side
    );

    if (isOverlapping) {
      console.warn("Note placement failed: A note already exists at this position.");
      return; // 重複している場合は処理を中断
    }

    const newNote = {
        id: Date.now() + Math.random(),
        moduleType: noteData.moduleType,
        timing: noteData.timing,
        side: noteData.side,
    };
    
    const getSnapDuration = () => {
        const bpm = getBpmAt(noteData.timing);
        return (60 / bpm) / (gridSnap.value / 4);
    };

    switch(noteData.moduleType) {
        case 0: case 2: // Type:K, Type:S
            newNote.notesType = noteData.notesType || 'Tap';
            newNote.lane = noteData.lane;
            if (newNote.notesType === 'Long') newNote.longDuration = noteData.longDuration || getSnapDuration();
            break;
        case 1: // Type:R
            newNote.notesType = 'Tap'; // Explicitly set for Type:R
            newNote.lane = 0;
            break;
        case 3: // Type:C
            newNote.notesType = 'Long';
            newNote.lane = noteData.lane;
            newNote.longDuration = noteData.longDuration || getSnapDuration();
            break;
        case 4: // Type:L
            newNote.notesType = 'Long';
            newNote.lane = noteData.lane;
            newNote.longDuration = noteData.longDuration || getSnapDuration();
            newNote.anchorPoint = [
                { timing: noteData.timing, lane: noteData.lane / getLaneCount(4), easingType: "linear" },
                { timing: noteData.timing + newNote.longDuration, lane: noteData.lane / getLaneCount(4), easingType: "linear" }
            ];
            break;
    }
    
    if ( (noteData.moduleType === 3 && noteData.side === 'Right') || (noteData.moduleType === 4 && noteData.side === 'Left')) {
        //alert("このモジュールは指定されたサイドに配置できません。"); return;
    }
    if (chart.notes[noteData.moduleType]) {
      chart.notes[noteData.moduleType].push(newNote);
    }
  };

  const selectNote = (note) => {
    if (currentTool.value === 'erase') {
      if (chart.notes[note.moduleType]) {
        chart.notes[note.moduleType] = chart.notes[note.moduleType].filter(n => n.id !== note.id);
      }
      selectedNote.value = null;
    } else {
      currentTool.value = 'select';
      selectedNote.value = note;
    }
  };

  // この snapTimeToBeat の再定義を削除し、useTiming.js からインポートしたものを直接使う
  /*
  const snapTimeToBeat = (time) => {
    const beat = timeConverter.value.secondsToBeat(time);
    const snapUnit = 4 / gridSnap.value;
    const snappedBeat = Math.round(beat / snapUnit) * snapUnit;
    return timeConverter.value.beatToSeconds(snappedBeat);
  };
  */

  const handleTimelineMousedown = (event) => {
    if (event.button !== 0) return;

    const timelineRect = event.currentTarget.getBoundingClientRect();
    const y = event.clientY - timelineRect.top; // 修正: スクロール量を加算
    const time = yToTime(y);
    const snappedTime = snapTimeToBeat(time);

    const side = (event.clientX - timelineRect.left) / timelineRect.width < 0.5 ? 'Left' : 'Right';
    const moduleAtTime = getModuleAt(snappedTime);
    const moduleType = side === 'Left' ? moduleAtTime.left : moduleAtTime.right;
    const laneCount = getLaneCount(moduleType);
    if (laneCount === 0 || moduleType === 9) return;

    const sideX = side === 'Left' ? (event.clientX - timelineRect.left) : (event.clientX - timelineRect.left) - (timelineRect.width / 2);
    const lane = Math.floor(sideX / (timelineRect.width / 2 / laneCount));

    if (currentTool.value === 'erase') {
        const noteToDelete = chart.notes[moduleType]?.find(n => 
            n.side === side && n.lane === lane && Math.abs(n.timing - snappedTime) < 0.05
        );
        if (noteToDelete) {
            chart.notes[moduleType] = chart.notes[moduleType].filter(n => n.id !== noteToDelete.id);
            selectedNote.value = null;
        }
    } else if (currentTool.value === 'tap') {
        addNote({ timing: snappedTime, side, moduleType, lane });
    } else if (currentTool.value === 'long') {
        if (!longNoteStart.value) {
            longNoteStart.value = { timing: snappedTime, side, moduleType, lane };
        } else {
            if (longNoteStart.value.side === side && longNoteStart.value.lane === lane && snappedTime > longNoteStart.value.timing) {
                const start = longNoteStart.value;
                addNote({
                    timing: start.timing,
                    side: start.side,
                    moduleType: start.moduleType,
                    lane: start.lane,
                    notesType: 'Long',
                    longDuration: snappedTime - start.timing
                });
            }
            longNoteStart.value = null;
            longNotePreview.value = null;
        }
    }
  };

  const handleTimelineMousemove = (event) => {
    if (!longNoteStart.value) return;

    const timelineRect = event.currentTarget.getBoundingClientRect();
    const y = event.clientY - timelineRect.top; // 修正: スクロール量を加算
    const time = yToTime(y);
    const snappedTime = snapTimeToBeat(time);

    const side = (event.clientX - timelineRect.left) / timelineRect.width < 0.5 ? 'Left' : 'Right';
    const laneCount = getLaneCount(longNoteStart.value.moduleType);
    const sideX = side === 'Left' ? (event.clientX - timelineRect.left) : (event.clientX - timelineRect.left) - (timelineRect.width / 2);
    const lane = Math.floor(sideX / (timelineRect.width / 2 / laneCount));

    if (longNoteStart.value.side === side && longNoteStart.value.lane === lane && snappedTime > longNoteStart.value.timing) {
      longNotePreview.value = {
        ...longNoteStart.value,
        notesType: 'Long',
        longDuration: snappedTime - longNoteStart.value.timing,
      };
    } else {
      longNotePreview.value = null;
    }
  };

  return { 
    longNoteStart,
    longNotePreview, 
    getNoteStyle, 
    selectNote, 
    handleTimelineMousedown, 
    handleTimelineMousemove 
  };
}