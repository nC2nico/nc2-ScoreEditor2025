import { ref, computed } from 'vue';
import { chart } from '../stores/chart.js';
import { pixelsPerSecond, gridSnap } from '../stores/editor.js';
import { timeToY } from '../utils/timelineConverter.js';
import { useTiming } from './useTiming.js';

export function useTimeline(editorContainer) {
  const scrollY = ref(0);
  const timelineHeight = computed(() => {
    if (!chart.value || !chart.value.timing || chart.value.timing.length === 0) return 2000;
    const lastTimingEvent = chart.value.timing.changes.slice(-1)[0];
    const lastTime = lastTimingEvent ? lastTimingEvent.timing + 10 : 120; // 譜面の長さを推定
    return timeToY(lastTime) + editorContainer.value?.clientHeight * 2;
  });

  const handleScroll = () => {
    scrollY.value = editorContainer.value.scrollTop;
  };

  const seek = (time) => {
    if (editorContainer.value) {
      editorContainer.value.scrollTop = timeToY(time) - editorContainer.value.clientHeight / 2;
    }
  };

  const { currentBeatSignature, sortedTimingChanges, measureToTime } = useTiming();

  const gridMarkers = computed(() => {
    if (!currentBeatSignature.value) return [];
    const markers = [];
    const beatDuration = 60 / sortedTimingChanges.value.find(t => t.type === 'bpmChange')?.bpm;
    if (!beatDuration) return [];

    const firstVisibleTime = timeToY.invert(scrollY.value);
    const lastVisibleTime = timeToY.invert(scrollY.value + editorContainer.value?.clientHeight);

    let currentMeasure = Math.floor(sortedTimingChanges.value.find(t => t.type === 'bpmChange')?.measure || 0);
    let currentTime = measureToTime(currentMeasure) || 0;

    let drawCount = 0;
    const maxDrawCount = 500; // 描画数の上限
    let intervalMultiplier = 1;

    while (currentTime <= lastVisibleTime && drawCount < maxDrawCount) {
      const yPos = timeToY(currentTime);
      if (yPos >= scrollY.value - 5 && yPos <= scrollY.value + editorContainer.value.clientHeight + 5) {
        markers.push({ top: `${yPos}px`, type: 'measure' });
        drawCount++;
      }

      const beatsPerMeasure = currentBeatSignature.value.num;
      currentTime += beatDuration * beatsPerMeasure;
      currentMeasure++;

      // 描画数が上限を超えそうな場合は間隔を広げる
      if (drawCount > maxDrawCount * 0.8) {
        intervalMultiplier *= 2;
        currentTime = measureToTime(Math.floor(currentMeasure / intervalMultiplier) * intervalMultiplier);
        currentMeasure = Math.floor(currentMeasure / intervalMultiplier) * intervalMultiplier;
      }
    }
    return markers;
  });

  const snapMarkers = computed(() => {
    const markers = [];
    const snapDivisions = gridSnap.value;
    const firstVisibleTime = timeToY.invert(scrollY.value);
    const lastVisibleTime = timeToY.invert(scrollY.value + editorContainer.value?.clientHeight);

    for (const timingEvent of sortedTimingChanges.value) {
      if (timingEvent.type === 'bpmChange') {
        const bpm = timingEvent.bpm;
        const beatDuration = 60 / bpm;
        const measureTime = measureToTime(timingEvent.measure);
        const beatsPerMeasure = currentBeatSignature.value?.num || 4;

        let currentTime = measureTime;
        let beatInMeasure = 0;

        let drawCount = 0;
        const maxDrawCount = 20; // スナップマーカーの描画上限
        let intervalMultiplier = 1;

        while (currentTime < (sortedTimingChanges.value.find((t, i) => i > sortedTimingChanges.value.indexOf(timingEvent) && t.type === 'bpmChange')?.timing ?? lastVisibleTime + 1) && drawCount < maxDrawCount) {
          for (let i = 1; i < snapDivisions; i++) {
            const snapTime = currentTime + (beatDuration / snapDivisions) * i;
            if (snapTime >= firstVisibleTime && snapTime <= lastVisibleTime) {
              markers.push({ top: `${timeToY(snapTime)}px`, type: 'snap' });
              drawCount++;
            }
          }
          currentTime += beatDuration;
          beatInMeasure++;
          if (beatInMeasure >= beatsPerMeasure) {
            beatInMeasure = 0;
          }

          // 描画数が上限を超えそうな場合は間隔を広げる
          if (drawCount > maxDrawCount * 0.8) {
            intervalMultiplier *= 2;
            // 次の描画基準点を調整 (簡易的な間引き処理)
            currentTime += beatDuration * (beatsPerMeasure * (intervalMultiplier - 1));
          }

          if (currentTime > lastVisibleTime) break;
        }
      }
    }
    return markers;
  });

  return { scrollY, timelineHeight, handleScroll, seek, gridMarkers, snapMarkers };
}