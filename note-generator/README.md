# 有料note ジェネレーター

テーマと立場を入力すると、note(有料記事プラットフォーム)向けの下書き(タイトル案・無料部分・有料部分・タグ)を生成するツールです。

## 構成

- `src/` — Vite + React のフロントエンド(UIコンポーネントは `PaidNoteGenerator.jsx`)
- `api/generate.js` — Anthropic API へのサーバーサイド・プロキシ(Vercel Serverless Function)

Claude API キーはブラウザに一切渡らず、`api/generate.js` の中でのみ使われます。フロントエンドは `/api/generate` を呼び出すだけです。

## セットアップ

```bash
cd note-generator
npm install
cp .env.example .env
# .env に ANTHROPIC_API_KEY を設定
```

## ローカル開発

API関数を含めて動かすには [Vercel CLI](https://vercel.com/docs/cli) を使います(`vite` 単体では `/api` は動きません)。

```bash
npm install -g vercel
vercel dev
```

## デプロイ(Vercel)

1. このディレクトリ(`note-generator/`)をプロジェクトルートとして Vercel にインポート
2. 環境変数 `ANTHROPIC_API_KEY` をVercelのプロジェクト設定に追加
3. デプロイ

他のサーバーレス環境(Netlify Functions など)を使う場合は、`api/generate.js` のロジックをそのプラットフォームの関数形式に合わせて移植してください。
