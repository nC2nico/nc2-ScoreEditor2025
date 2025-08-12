import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  // ビルド設定を追加して、デバッグをしやすくする
  build: {
    sourcemap: true, // ビルド時にもソースマップを生成
  },
  // 開発サーバーの設定を追加
  server: {
    sourcemap: 'inline', // 開発時にインラインソースマップを使用
  }
})