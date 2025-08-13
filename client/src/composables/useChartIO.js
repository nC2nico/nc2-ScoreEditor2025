import { chart } from '../stores/chart.js';

export function useChartIO() {

  const importChart = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        // Deep merge is not happening here, just replacing top-level keys.
        Object.assign(chart.meta, data.meta);
        Object.assign(chart.timing, data.timing);
        
        // Clear existing notes and add imported ones
        Object.keys(chart.notes).forEach(key => chart.notes[key] = []);
        for (const note of data.notes) {
          if (chart.notes[note.moduleType]) {
            // Add a unique ID for reactivity, as the imported one might not have it
            chart.notes[note.moduleType].push({ ...note, id: Date.now() + Math.random() });
          }
        }

        alert("譜面をインポートしました。");
      } catch (error) {
        alert("譜面ファイルの読み込みに失敗しました。");
        console.error(error);
      }
    };
    reader.readAsText(file);
  };

  const exportChart = () => {
    // Flatten all note arrays into one, then sort by timing
    const flattenedNotes = Object.values(chart.notes).flat().sort((a, b) => a.timing - b.timing);

    // Remove the temporary 'id' field used for Vue's reactivity
    const exportableNotes = flattenedNotes.map(n => {
      const { id, ...rest } = n;
  // As per spec, lane is not needed for Type:R
  if (rest.moduleType === 1) delete rest.lane;
      return rest;
    });

    const dataToExport = { 
      meta: chart.meta, 
      timing: chart.timing, 
      notes: exportableNotes 
    };

    const jsonString = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${chart.meta.title.replace(/\s/g, '_') || 'chart'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return { importChart, exportChart };
}
