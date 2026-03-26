# Hover Video Controls Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ビデオエリアにカーソルが重なったときのみ、音量バーとフルスクリーンボタンをオーバーレイ表示する。

**Architecture:** `<video controls>` を削除しカスタムオーバーレイに置き換える。`video-wrapper` への `onMouseEnter`/`onMouseLeave` で `isHovered` を管理し、CSS opacity トランジションで表示切替。音量・ミュート状態は `localStorage` に保存。

**Tech Stack:** React 19, TypeScript, CSS (依存追加なし)

---

## File Map

- Modify: `src/App.tsx` — state/refs 追加、controls-overlay JSX 追加、イベントハンドラ追加
- Modify: `src/App.css` — `.controls-overlay`、`.volume-icon`、`.volume-slider`、`.fullscreen-btn` スタイル追加

---

### Task 1: `<video>` から controls を削除し、state と ref を追加

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: videoWrapperRef を追加**

`App.tsx` の `videoRef` の直下に以下を追加する：

```typescript
const videoWrapperRef = useRef<HTMLDivElement>(null);
```

- [ ] **Step 2: isHovered / volume / isMuted の state を追加**

`currentTime` の state の下に追加する：

```typescript
const [isHovered, setIsHovered] = useState(false);
const [volume, setVolume] = useState(() => {
  const saved = localStorage.getItem("epg-player-volume");
  return saved !== null ? parseFloat(saved) : 1;
});
const [isMuted, setIsMuted] = useState(() => {
  return localStorage.getItem("epg-player-muted") === "true";
});
const [isFullscreen, setIsFullscreen] = useState(false);
```

- [ ] **Step 3: 音量・ミュートを video 要素に反映する useEffect を追加**

`currentTime` の useEffect の下に追加する：

```typescript
useEffect(() => {
  if (videoRef.current) {
    videoRef.current.volume = volume;
    videoRef.current.muted = isMuted;
  }
}, [volume, isMuted]);
```

- [ ] **Step 4: fullscreenchange イベントリスナーを追加**

上記 useEffect の直下に追加する：

```typescript
useEffect(() => {
  const handleFullscreenChange = () => {
    setIsFullscreen(!!document.fullscreenElement);
  };
  document.addEventListener("fullscreenchange", handleFullscreenChange);
  return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
}, []);
```

- [ ] **Step 5: イベントハンドラを追加**

`switchChannel` 関数の下に追加する：

```typescript
const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
  const val = parseFloat(e.target.value);
  setVolume(val);
  setIsMuted(false);
  localStorage.setItem("epg-player-volume", String(val));
  localStorage.setItem("epg-player-muted", "false");
}, []);

const handleMuteToggle = useCallback(() => {
  setIsMuted((prev) => {
    const next = !prev;
    localStorage.setItem("epg-player-muted", String(next));
    return next;
  });
}, []);

const handleFullscreenToggle = useCallback(() => {
  if (!document.fullscreenElement) {
    videoWrapperRef.current?.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
}, []);
```

- [ ] **Step 6: `<video>` の `controls` 属性を削除**

JSX 内の `<video ref={videoRef} autoPlay controls />` を以下に変更する：

```tsx
<video ref={videoRef} autoPlay />
```

- [ ] **Step 7: video-wrapper に ref とイベントハンドラを追加し、controls-overlay を追加**

JSX の `<div className="video-wrapper">` を以下に置き換える：

```tsx
<div
  className="video-wrapper"
  ref={videoWrapperRef}
  onMouseEnter={() => setIsHovered(true)}
  onMouseLeave={() => setIsHovered(false)}
>
  <video ref={videoRef} autoPlay />
  <div className={`controls-overlay${isHovered ? " visible" : ""}`}>
    <div className="controls-left">
      <button className="volume-icon" onClick={handleMuteToggle}>
        {isMuted || volume === 0 ? "🔇" : "🔊"}
      </button>
      <input
        className="volume-slider"
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={isMuted ? 0 : volume}
        onChange={handleVolumeChange}
      />
    </div>
    <div className="controls-right">
      <button className="fullscreen-btn" onClick={handleFullscreenToggle}>
        {isFullscreen ? "⊡" : "⛶"}
      </button>
    </div>
  </div>
</div>
```

- [ ] **Step 8: アプリを起動して video-wrapper が表示されることを確認**

```bash
bun tauri dev
```

ビデオが再生され、コントロールバーが表示されないことを確認する（ホバー前）。

- [ ] **Step 9: コミット**

```bash
git add src/App.tsx
git commit -m "feat: ネイティブcontrols削除・カスタムオーバーレイ用state/ref/ハンドラ追加"
```

---

### Task 2: CSS でオーバーレイスタイルを追加

**Files:**
- Modify: `src/App.css`

- [ ] **Step 1: controls-overlay のスタイルを追加**

`App.css` の末尾に追加する：

```css
.controls-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  opacity: 0;
  transition: opacity 0.2s ease;
  pointer-events: none;
}

.controls-overlay.visible {
  opacity: 1;
  pointer-events: auto;
}

.controls-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.controls-right {
  display: flex;
  align-items: center;
}

.volume-icon {
  background: none;
  border: none;
  color: #fff;
  font-size: 20px;
  cursor: pointer;
  padding: 4px;
  line-height: 1;
}

.volume-icon:hover {
  color: #9fa8da;
}

.volume-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 80px;
  height: 4px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.3);
  outline: none;
  cursor: pointer;
}

.volume-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #9fa8da;
  cursor: pointer;
}

.volume-slider::-webkit-slider-thumb:hover {
  background: #fff;
}

.fullscreen-btn {
  background: none;
  border: none;
  color: #fff;
  font-size: 20px;
  cursor: pointer;
  padding: 4px;
  line-height: 1;
}

.fullscreen-btn:hover {
  color: #9fa8da;
}
```

- [ ] **Step 2: 動作確認**

`bun tauri dev` でアプリを起動し、以下を確認する：
- ビデオエリアにカーソルを乗せると、下部にオーバーレイが現れる
- カーソルを外すとフェードアウトする
- 🔊 をクリックすると 🔇 に切り替わり、ミュートになる
- スライダーで音量が変わる
- フルスクリーンボタンでフルスクリーンになる
- アプリを再起動しても音量・ミュート状態が復元される

- [ ] **Step 3: コミット**

```bash
git add src/App.css
git commit -m "feat: ホバー表示カスタムビデオコントロールのCSSを追加"
```

---

## 完了条件

- [ ] ビデオエリア外ではコントロールが非表示
- [ ] ビデオエリア内ではコントロールが 0.2s でフェードイン
- [ ] 音量スライダーが機能し、localStorage に保存される
- [ ] ミュートボタンが機能し、localStorage に保存される
- [ ] フルスクリーンボタンが機能する
- [ ] アプリ再起動後も音量・ミュート状態が復元される
