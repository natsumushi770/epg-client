# Hover Video Controls Design

**Date:** 2026-03-26
**Status:** Approved

## Overview

ビデオプレイヤーにカーソルが重なったときのみ、音量バーとフルスクリーンボタンを表示するカスタムオーバーレイを実装する。ネイティブの `controls` 属性は削除し、独自の UI に置き換える。

## Component Structure

`video-wrapper` 内に `controls-overlay` を追加する。

```
.video-wrapper
  <video>                  ← controls 属性を削除
  .controls-overlay        ← isHovered が true のとき opacity: 1
    .controls-left
      .volume-icon         ← クリックでミュート切替（Unicode 文字: 🔊 / 🔇）
      .volume-slider       ← <input type="range" min=0 max=1 step=0.01>
    .controls-right
      .fullscreen-btn      ← クリックでフルスクリーン切替
```

## State

App.tsx に以下の state を追加する（既存の localStorage キーを流用）：

| State | 型 | 初期値 | 永続化 |
|---|---|---|---|
| `isHovered` | `boolean` | `false` | なし |
| `volume` | `number` (0–1) | `localStorage["epg-player-volume"]` or `1` | あり |
| `isMuted` | `boolean` | `localStorage["epg-player-muted"]` or `false` | あり |

## Behavior

### ホバー制御
- `video-wrapper` の `onMouseEnter` で `isHovered = true`
- `video-wrapper` の `onMouseLeave` で `isHovered = false`
- `.controls-overlay` の `opacity` を `isHovered` で切替（CSS transition 0.2s ease）

### 音量制御
- スライダー変更時: `videoRef.current.volume = value`、`isMuted = false`、localStorage 保存
- ミュートアイコンクリック: `isMuted` トグル、`videoRef.current.muted` に反映
- 初期化時: `videoRef.current.volume` と `videoRef.current.muted` に localStorage 値を適用

### フルスクリーン制御
- `videoWrapperRef` を追加し、`videoWrapperRef.current.requestFullscreen()` を呼ぶ
- `document.fullscreenElement` の有無で現在状態を判定
- `fullscreenchange` イベントをリッスンしてボタン表示を更新

## CSS

`.controls-overlay` はビデオ下部に絶対配置（`position: absolute; bottom: 0`）。背景は半透明グラデーション (`rgba(0,0,0,0.6)`)。テーマカラーは既存の `#5c6bc0` / `#3949ab` に合わせる。

## Files Changed

- `src/App.tsx` — state 追加、controls-overlay JSX 追加、イベントハンドラ追加
- `src/App.css` — `.controls-overlay`、`.volume-slider`、`.fullscreen-btn` スタイル追加
