import { computed } from 'vue';
import { chart } from '../stores/chart.js';
import { currentTime, audioDuration } from '../stores/player.js';
import { scrollTop, gridSnap, pixelsPerSecond } from '../stores/editor.js';
import { timeToY, yToTime } from '../utils/timelineConverter.js';

export function useTiming() {

  const timingEvents = computed(() => {
    const events = [...chart.timing.changes];
    events.push({ type: 'bpmChange', timing: 0, changedBpm: chart.timing.initialBpm });
    events.push({ type: 'beatRateChange', timing: 0, changedBeatRate: chart.timing.initialBeatRate });
    return events.sort((a, b) => a.timing - b.timing);
  });

  const timingCache = computed(() => {
    const measureBoundaries = [];
    let time = 0;
    let beat = 0;
    let measure = 1;
    
    measureBoundaries.push({ time, beat, measure });

    const sortedChanges = timingEvents.value;
    let changeIndex = 0;
    let currentBpm = chart.timing.initialBpm;
    let currentBeatRate = chart.timing.initialBeatRate;

    while (time < (audioDuration.value || 300)) {
      let nextChangeTime = Infinity;
      if (changeIndex < sortedChanges.length) {
        nextChangeTime = sortedChanges[changeIndex].timing;
      }

      const secondsPerBeat = 60 / currentBpm;
      const beatsInMeasure = currentBeatRate;
      const timeToNextMeasure = (beatsInMeasure - (beat % beatsInMeasure)) * secondsPerBeat;
      
      const timeToEvent = nextChangeTime - time;

      if (timeToNextMeasure <= timeToEvent) {
        time += timeToNextMeasure;
        beat += beatsInMeasure - (beat % beatsInMeasure);
        measure++;
        measureBoundaries.push({ time, beat, measure });
      } else {
        time = nextChangeTime;
        beat += timeToEvent / secondsPerBeat;
        
        const change = sortedChanges[changeIndex];
        if (change.type === 'bpmChange') currentBpm = change.changedBpm;
        if (change.type === 'beatRateChange') currentBeatRate = change.changedBeatRate;
        
        changeIndex++;
      }
    }
    return { measureBoundaries };
  });

  const timeToBeat = (time) => {
    const boundary = [...timingCache.value.measureBoundaries].reverse().find(b => b.time <= time);
    if (!boundary) return 0;
    const bpm = getBpmAt(boundary.time);
    return boundary.beat + ((time - boundary.time) / 60) * bpm;
  };

  const beatToTime = (targetBeat) => {
    const boundary = [...timingCache.value.measureBoundaries].reverse().find(b => b.beat <= targetBeat);
    if (!boundary) return 0;
    const bpm = getBpmAt(boundary.time);
    return boundary.time + ((targetBeat - boundary.beat) * 60) / bpm;
  };
  
  const snapTimeToBeat = (time) => {
    const beat = timeToBeat(time);
    const snapUnit = 4 / gridSnap.value;
    const snappedBeat = Math.round(beat / snapUnit) * snapUnit;
    return beatToTime(snappedBeat);
  };

  const getBpmAt = (time) => {
    const lastBpmChange = timingEvents.value
        .filter(e => e.type === 'bpmChange' && e.timing <= time)
        .pop();
    return lastBpmChange ? lastBpmChange.changedBpm : chart.timing.initialBpm;
  };

  const getBeatRateAt = (time) => {
    const lastBeatRateChange = timingEvents.value
        .filter(e => e.type === 'beatRateChange' && e.timing <= time)
        .pop();
    return lastBeatRateChange ? lastBeatRateChange.changedBeatRate : chart.timing.initialBeatRate;
  };
  
  const gridMarkers = computed(() => {
    const markers = [];
    const minMeasureSeparation = 40; // 小節線間の最小描画間隔 (px)
    const minBeatSeparation = 15;     // 拍線間の最小描画間隔 (px)

    let lastMeasureY = -Infinity;

    for (const boundary of timingCache.value.measureBoundaries) {
      const measureY = timeToY(boundary.time);
      
      // ズームレベルに応じて小節線を間引く
      if (measureY - lastMeasureY < minMeasureSeparation / 2) {
        // 間隔が狭すぎる場合はスキップ
        continue;
      }

      markers.push({
        y: measureY,
        time: boundary.time,
        isMeasure: true,
        measure: boundary.measure,
        beat: 1,
      });
      lastMeasureY = measureY;
      
      const bpm = getBpmAt(boundary.time);
      const secondsPerBeat = 60 / bpm;
      const beatsPerMeasure = getBeatRateAt(boundary.time);
      const beatSeparationY = timeToY(secondsPerBeat);

      // 拍線が密集しすぎていない場合のみ描画
      if (beatSeparationY >= minBeatSeparation) {
        for (let i = 1; i < beatsPerMeasure; i++) {
          const time = boundary.time + i * secondsPerBeat;
          markers.push({
            y: timeToY(time),
            time: time,
            isMeasure: false,
            measure: boundary.measure,
            beat: i + 1,
          });
        }
      }
    }
    return markers;
  });

  const measureToTime = (measure) => {
    const boundary = timingCache.value.measureBoundaries.find(b => b.measure === measure);
    return boundary ? boundary.time : 0;
  };

  const timeToMeasure = (time) => {
    const boundary = [...timingCache.value.measureBoundaries].reverse().find(b => b.time <= time);
    return boundary ? boundary.measure : 1;
  };

  // The rest of the composable remains largely the same...
  const timingEventsMap = computed(() => {
    const map = new Map();
    chart.timing.changes.forEach(event => {
      map.set(event.timing, event);
    });
    return map;
  });

  const getModuleAt = (time) => {
    const lastModuleChange = timingEvents.value
      .filter(e => e.type === 'moduleChange' && e.timing <= time)
      .pop();
    if (!lastModuleChange) return { left: 0, right: 0 };
    return { left: lastModuleChange.leftModule, right: lastModuleChange.rightModule };
  };

  const currentBpm = computed(() => getBpmAt(currentTime.value));
  
  const currentBeatSignature = computed(() => {
      const rate = getBeatRateAt(currentTime.value);
      return { num: rate, den: 4 };
  });

  const snapMarkers = computed(() => {
    const markers = [];
    const minSnapSeparation = 10; // スナップ線間の最小描画間隔 (px)
    const divisions = gridSnap.value / 4;
    if (divisions <= 1) return []; // 1/4より細かいスナップがなければ描画しない

    for (const marker of gridMarkers.value) {
      // 拍線のみを対象とする（isMeasureがfalse）か、小節線間の距離が十分ある場合
      if (!marker.isMeasure || timeToY(60 / getBpmAt(marker.time)) > minSnapSeparation * divisions) {
        const segmentStartTime = marker.time;
        const bpm = getBpmAt(segmentStartTime);
        const beatDuration = 60 / bpm;
        const snapDuration = beatDuration / divisions;
        const snapSeparationY = timeToY(snapDuration);
        
        // スナップ線が密集しすぎていない場合のみ描画
        if (snapSeparationY >= minSnapSeparation) {
          for (let j = 1; j < divisions; j++) {
            const time = segmentStartTime + snapDuration * j;
            markers.push({ y: timeToY(time) });
          }
        }
      }
    }
    return markers;
  });

  const visibleModule = computed(() => getModuleAt(yToTime(scrollTop.value)));

  const moduleSegments = computed(() => {
    const segments = [];
    const changes = [...chart.timing.changes]
      .filter(c => c.type === 'moduleChange')
      .sort((a, b) => a.timing - b.timing);

    let lastTime = 0;
    let lastModules = getModuleAt(0);

    for (const change of changes) {
      if (change.timing > lastTime) {
        segments.push({
          startTime: lastTime,
          endTime: change.timing,
          leftModule: lastModules.left,
          rightModule: lastModules.right,
        });
      }
      lastTime = change.timing;
      lastModules = { left: change.leftModule, right: change.rightModule };
    }

    segments.push({
      startTime: lastTime,
      endTime: audioDuration.value || 300,
      leftModule: lastModules.left,
      rightModule: lastModules.right,
    });

    return segments;
  });

  const sortedTimingChanges = computed(() => {
    return chart.timing.changes
      .map((event, index) => ({ ...event, id: index }))
      .sort((a, b) => a.timing - b.timing);
  });

  return { 
    getBpmAt, 
    getBeatRateAt, 
    getModuleAt,
    currentBpm, 
    currentBeatSignature, 
    gridMarkers, 
    snapMarkers, 
    visibleModule, 
    moduleSegments,
    sortedTimingChanges,
    timingEventsMap,
    measureToTime,
    timeToMeasure,
    snapTimeToBeat,
  };
}

