# 有料note ジェネレーター

テーマと立場を入力すると、note(有料記事プラットフォーム)向けの下書き(タイトル案・無料部分・有料部分・タグ)を生成するツールです。

## 構成

完全に静的なフロントエンドのみのアプリです(サーバー・バックエンドなし)。

- `src/AccessGate.jsx` — ①アクセスコード入力 → ②Claude APIキー入力、の2段階ゲート
- `src/PaidNoteGenerator.jsx` — 本体のUI。入力されたAPIキーでブラウザから直接 Anthropic API を呼び出す

**利用者ごとに自分のAnthropic APIキーを使う方式**です。あなた(販売者)のAPIキーはコードのどこにも登場しません。APIキーはブラウザの `localStorage` にのみ保存され、Anthropic以外のどこにも送信されません。

## アクセスコードについて(重要な注意点)

`VITE_ACCESS_CODE` はビルド時にJSバンドルへ埋め込まれる値です。ブラウザの開発者ツールでバンドルのソースを見れば読める、という前提の**簡易的な入場チェック**であり、暗号的に安全な仕組みではありません。

- URLだけでなくコードも知らないとツールを開けない、という程度の抑止力です
- コードが広まってしまった場合は、値を変更して再デプロイすれば無効化できます
- 定期的にコードをローテーションする運用を推奨します

## セットアップ

```bash
cd note-generator
npm install
cp .env.example .env
# .env の VITE_ACCESS_CODE に、note有料部分に書くコードを設定
npm run dev
```

## デプロイ

Vite製の静的サイトなので、Vercel / Netlify / GitHub Pages などどこでもデプロイできます。

```bash
npm run build
# dist/ を任意の静的ホスティングにアップロード
```

Vercel/Netlifyにデプロイする場合は、管理画面の環境変数に `VITE_ACCESS_CODE` を設定してからビルドしてください。

## noteでの販売の流れ

1. 上記の手順でアプリをデプロイし、公開URLを取得する
2. noteで有料記事を作成し、**無料部分**にはツールの説明・できることを書く
3. **有料部分**(購入者だけが見られる箇所)に、アプリの公開URLと `VITE_ACCESS_CODE` に設定したアクセスコードを記載する
4. 購入者はURLにアクセスし、アクセスコード→自分のAnthropic APIキーの順に入力してツールを使う

利用者は各自のAnthropic APIキーが必要です(Anthropic Consoleで取得: https://console.anthropic.com/)。API利用料は利用者自身の負担になるため、あなたのAPIコストは発生しません。
