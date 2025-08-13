# 仕様解説
## ゲーム全体の仕様
画面の左右の大きな画面枠(スロット)に「モジュール」と呼ばれる、様々な種類の楽器的特徴を持ったリズムモードがそれぞれセットされ、楽曲内で切り替わりながら演奏する。
モジュールは一部左枠もしくは右枠のみセットされるものがある。また、左右両枠にセット可能なモジュールは同時に左右両枠にセットされる場合もある。
様々な入力方法を想定しているが、展示デモ環境ではBeatmania IIDX用コントローラーを2台使う。
## 各モジュールの仕様
### Type:K
左右両枠。キーボードがモチーフ、3つのレーンを3つのボタンで演奏する。ノーツは短押しとロングノーツの2種類
### Type:R
(旧名Type:D)左右両枠。ドラムパットがモチーフ、単一レーンを7ボタン全てで演奏する。(どのボタンを押しても良い)短押しノーツのみ
### Type:S(廃止)
左右両枠。スクラッチがモチーフ、単一レーンをターンテーブルの回転で演奏する。ノーツが来た瞬間にターンテーブルを回す(はじく)短ノーツとノーツが来ている間は一定方向に回し続けるロングノーツの2種類
### Type:C
左枠専用。コードやベース演奏のイメージ、5つのレーンを3つの白鍵ボタンと2つの黒鍵ボタンで演奏する。ノーツはロングノーツのみ。
### Type:L
右枠専用。ストリングスやボーカルのリード要素、もしくはフェーダーがモチーフ。無段階の連続した左右に移動するロングノーツが降ってきて、ターンテーブルを操作してカーソルを左右に移動させなぞるように演奏する。(Trombone Champとほぼ同じイメージ)
### None
そのスロットに何もモジュールがセットされいない状態。プレイヤーは操作する必要はない。
## 譜面フォーマット仕様
譜面ファイルは、3つのトップレベルキーを持つ単一のJSONオブジェクトです。
```
{
  "meta": { ... },
  "timing": { ... },
  "notes": [ ... ]
}
```
### metaオブジェクト
譜面情報を記したヘッダーのようなものです。
キー/型/説明
title/String/楽曲のタイトル
artist/String/アーティスト名
charter/String/譜面制作者名
audioFileName/String/音声ファイル名 (例: "song.ogg")
initialDifficulty/Int/譜面の難易度名に対応する難易度ID
### timingオブジェクト
BPM・拍子の変化、モジュールの切り替え情報を記述します。
キー/型/説明
initialBpm/Float/曲開始時のBPM
initialBeatRate/Float/曲開始時の拍子レート(4/4拍子→4，6/8拍子→3，2/2拍子→4)
initialOffsetMs/Float/音声ファイルの再生開始オフセット（ミリ秒）
changes/Array/BPMや拍子の変更イベントを格納する配列。詳細は以下の各イベントを参照。
#### changesイベント：bpmChange
BPM変化イベントを記述します。
キー/型/説明
type/String/"bpmChange"で固定
timing/Float/秒数で指定
changedBpm/Float/変更後のBPM
#### changesイベント：beatRateChange
拍子変化イベントを記述します。
キー/型/説明
type/String/"beatRateChange"で固定
timing/Float/秒数で指定
changedBeatRate/Float/変更後の拍子レート
#### changesイベント：moduleChange
モジュール変化イベントを記述します。
キー/型/説明
type/String/"moduleChange"で固定
timing/Float/秒数で指定
leftModule/Int/変更後の左枠のモジュールID
rightModule/Int/変更後の右枠のモジュールID
### notes配列
ノーツ情報をオブジェクトで記した配列です。
#### Type:K
キー/型/説明
moduleType/int/Type:KのIDで固定
timing/Float/秒数で指定
side/String/"Left"か"Right"で指定
notesType/String/ノーツの種類("TapかLongで指定")
lane/Int/レーン番号を左から0~2で指定
longDuration/Float/ロングノーツの持続時間を秒数で指定(notesType=Longの場合のみ記述)
#### Type:D
キー/型/説明
moduleType/int/Type:DのIDで固定
timing/Float/秒数で指定
side/String/"Left"か"Right"で指定
#### Type:S
キー/型/説明
moduleType/int/Type:SのIDで固定
timing/Float/秒数で指定
side/String/"Left"か"Right"で指定
notesType/String/ノーツの種類("TapかLongで指定")
longDuration/Float/ロングノーツの持続時間を秒数で指定(notesType=Longの場合のみ記述)
#### Type:C
キー/型/説明
moduleType/int/Type:CのIDで固定
timing/Float/秒数で指定
side/String/"Left"で固定
lane/Int/レーン番号を左から0~4で指定
longDuration/Float/ロングノーツの持続時間を秒数で指定
#### Type:L
キー/型/説明
moduleType/int/Type:RのIDで固定
timing/Float/秒数で指定
side/String/"Right"で固定
longDuration/Float/1セクションごとの持続時間を秒数で指定
anchorPoint/Array/セクション内の変化点を指定する。詳細は下記を参照。
##### Type:L/anchorPoint
キー/型/説明
timing/Float/秒数で指定
lane/Float/0~1の実数でレーン位置を指定
easingType/String/レーン位置変化時の曲線補完モード
## 譜面エディタでの注意点
- Type:Lでのレーン位置指定は、譜面データでは0~1のFloat型だが、譜面エディタでは任意の数に分割したレーンで扱い、出力時にFloatに変換する
- ロングノーツは、譜面データでは始点と持続時間で指定するが、譜面エディタでは始点と終点でしていする。これも出力時に変換する。
- 時間指定は、譜面データではFloatの秒数での指定だが、譜面エディタでは拍子とBPMを利用した、拍子数とn分音符を活用できるシステムにすること。
- BPMの変化によって譜面スクロール速度は変化しない。拍子の変化は実際のゲーム内では拍子線の描画にのみ用いること。
## 各種IDの対応表
- 譜面難易度
  - 0:Intro
  - 1:Casual
  - 2:Advanced
  - 3:Maestro
  - 4:Encore
- モジュール
  - 0:Type:K
  - 1:Type:D
  - 2:Type:S
  - 3:Type:C
  - 4:Type:L
  - 9:None