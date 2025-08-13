# ストア構造の改善

このドキュメントでは、`store.js`から分割された新しいストア構造について説明します。

## 新しいストア構造

### 1. `stores/chart.js` - 譜面データ管理
譜面の中核となるデータを管理します。

**状態:**
- `chart` - 譜面の全データ（メタデータ、タイミング、ノーツ）

**ヘルパー関数:**
- `resetChart()` - 譜面データをリセット
- `setChart(newChart)` - 譜面データを設定

### 2. `stores/player.js` - 音声再生管理
音声の再生状態と制御を管理します。

**状態:**
- `audioContext` - Web Audio APIのコンテキスト
- `audioBuffer` - 読み込まれた音声データ
- `isPlaying` - 再生状態
- `currentTime` - 現在の再生時間
- `audioDuration` - 音声の総時間

**ヘルパー関数:**
- `resetAudioState()` - 音声状態をリセット
- `setCurrentTime(time)` - 再生時間を設定
- `togglePlayback()` - 再生状態を切り替え
- `stopPlayback()` - 再生を停止

### 3. `stores/editor.js` - エディタ状態管理
エディタのツール選択、表示設定、UI状態を管理します。

**状態:**
- `pixelsPerSecond` - ズームレベル
- `gridSnap` - スナップ設定
- `scrollTop` - スクロール位置
- `currentTool` - 現在選択中のツール
- `selectedNote` - 選択中のノーツ
- `showTimingEditor` - タイミングエディタの表示状態

**定数:**
- `AVAILABLE_TOOLS` - 利用可能なツールの一覧
- `AVAILABLE_SNAP_VALUES` - 利用可能なスナップ値の一覧

**ヘルパー関数:**
- `setCurrentTool(tool)` - ツールを設定
- `setGridSnap(snap)` - スナップ値を設定
- `clearSelection()` - 選択状態をクリア
- `selectNote(note)` - ノーツを選択
- `setZoom(zoom)` - ズームレベルを設定
- `resetEditorState()` - エディタ状態をリセット

## 使用方法

### 基本的な使用方法

```javascript
// 個別のストアから必要な状態のみをインポート
import { chart } from '../stores/chart.js';
import { isPlaying, currentTime } from '../stores/player.js';
import { currentTool, selectedNote } from '../stores/editor.js';
```

### 後方互換性

既存のコードは引き続き動作します：

```javascript
// 従来の方法（後方互換性のため利用可能）
import { chart, isPlaying, currentTool } from '../store.js';
```

ただし、新しいコードでは個別のストアファイルからの直接インポートを推奨します。

## 利点

1. **関心の分離**: 各ストアが特定のドメインに責任を持つ
2. **インポートの最適化**: 必要な状態のみをインポート可能
3. **型安全性の向上**: TypeScript導入時により良い型推論
4. **テスタビリティ**: 各ドメインを独立してテスト可能
5. **スケーラビリティ**: 新機能追加時の影響範囲を限定

## 移行ガイド

新しいコードを書く際は、以下のパターンに従ってください：

### ❌ 避けるべきパターン
```javascript
import { chart, isPlaying, currentTool, selectedNote } from '../store.js';
```

### ✅ 推奨パターン
```javascript
import { chart } from '../stores/chart.js';
import { isPlaying } from '../stores/player.js';
import { currentTool, selectedNote } from '../stores/editor.js';
```

これにより、コードの依存関係が明確になり、保守性が向上します。
