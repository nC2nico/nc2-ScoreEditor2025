import { createApp } from 'vue'
import './style.css' // Tailwind CSS とカスタムCSSをインポート
import App from './app.vue'

const app = createApp(App)

// グローバルエラーハンドラを追加
app.config.errorHandler = (err, instance, info) => {
  console.error("Vue-level error:", err);
  console.error("Error occurred in component:", instance);
  console.error("Vue-specific error info:", info);
};

app.mount('#app')
