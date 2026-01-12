# EPG Proxy

EPG Station からのテレビストリームを視聴するための Tauri デスクトップアプリケーション。

## 技術スタック

### フロントエンド
- React 19
- TypeScript
- Vite 7
- mpegts.js (MPEG-TS ストリーム再生)

### バックエンド
- Rust
- Tauri 2
- hyper (HTTP プロキシサーバー)
- reqwest (HTTP クライアント)

## プロジェクト構造

```
epg-proxy/
├── src/                    # フロントエンド (React)
│   ├── App.tsx            # メインコンポーネント
│   ├── App.css            # スタイル
│   └── main.tsx           # エントリーポイント
├── src-tauri/             # バックエンド (Rust)
│   ├── src/
│   │   └── lib.rs         # Tauri コマンド & HTTP プロキシ
│   └── Cargo.toml
└── package.json
```

## 開発コマンド

```bash
# 依存関係のインストール
pnpm install

# 開発モードで起動
pnpm tauri dev

# ビルド
pnpm tauri build
```

## アーキテクチャ

### ストリーミングフロー
1. フロントエンドがチャンネル一覧を Tauri IPC 経由で取得 (`fetch_schedules`)
2. チャンネル選択時、ローカルプロキシ URL を取得 (`get_stream_url`)
3. Rust の HTTP プロキシサーバー (port 13000) が EPG Station からストリームを中継
4. mpegts.js がストリームを再生

### Tauri コマンド
- `fetch_schedules`: 現在放送中の番組一覧を取得
- `get_stream_url`: チャンネルIDに対応するストリームURLを返す

### 設定
- EPG Station API: `http://optiplex-pc:8888` (`src-tauri/src/lib.rs` の `API_BASE`)
- プロキシポート: 13000 (`PROXY_PORT`)

## localStorage キー
- `epg-player-muted`: ミュート状態
- `epg-player-volume`: 音量レベル
