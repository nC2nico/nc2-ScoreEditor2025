const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // 開発中のViteサーバーからのリクエストを許可
app.use(express.json()); // JSONリクエストボディをパース

// API Routes (将来の拡張用)
// 例: app.post('/api/charts', (req, res) => { /* 譜面保存処理 */ });
// 例: app.get('/api/charts/:id', (req, res) => { /* 譜面読込処理 */ });

// 本番環境では、ビルドされたVueアプリを配信
if (process.env.NODE_ENV === 'production') {
  // 静的ファイル (HTML, CSS, JS) の配信
  app.use(express.static(path.join(__dirname, '../client/dist')));

  // 全てのルートでVueアプリのエントリーポイントを返す
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
