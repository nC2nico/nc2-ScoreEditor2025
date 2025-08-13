import { ref } from 'vue';
import { 
  audioContext, 
  audioBuffer, 
  audioDuration, 
  isPlaying, 
  currentTime 
} from '../stores/player.js';
import { chart } from '../stores/chart.js';

export function useAudio() {
  const audioSource = ref(null);
  const startTime = ref(0);
  const startOffset = ref(0);

  const loadAudio = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    chart.meta.audioFileName = file.name;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (!audioContext.value) {
        audioContext.value = new (window.AudioContext || window.webkitAudioContext)();
      }
      audioContext.value.decodeAudioData(e.target.result, (buffer) => {
        audioBuffer.value = buffer;
        audioDuration.value = buffer.duration;
      });
    };
    reader.readAsArrayBuffer(file);
  };

  const togglePlay = () => {
    if (!audioBuffer.value) return;

    if (isPlaying.value) {
      audioSource.value?.stop();
      isPlaying.value = false;
    } else {
      audioSource.value = audioContext.value.createBufferSource();
      audioSource.value.buffer = audioBuffer.value;
      audioSource.value.connect(audioContext.value.destination);
      
      startOffset.value = currentTime.value;
      startTime.value = audioContext.value.currentTime;
      audioSource.value.start(0, startOffset.value);
      
      isPlaying.value = true;
    }
  };

  const updateCurrentTime = () => {
    if (!isPlaying.value) return;
    currentTime.value = startOffset.value + (audioContext.value.currentTime - startTime.value);
  };

  const closeAudioContext = () => {
    audioContext.value?.close();
  };

  return { loadAudio, togglePlay, updateCurrentTime, closeAudioContext };
}
