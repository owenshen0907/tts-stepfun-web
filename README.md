# StepFun TTS Web

日本語 / [English](./README_EN.md) / [简体中文](./README_CN.md)

`StepFun TTS Web` は、StepFun の音声生成 API をローカルですばやく試せる Next.js ベースの Web アプリです。
最新版では、通常の TTS に加えて、音声クローン、音色一覧取得、履歴保存、試聴・書き出しまでを一通りブラウザ上で扱えます。

## 主な機能

- 最新の StepFun TTS モデルと公式音色に対応
- `voice_label` の `language / emotion / style` を切り替え可能
- 生成履歴をブラウザに一時保存し、再利用・再生・書き出しが可能
- 音声クローンを最新フローに合わせて簡略化
- ローカル実行、Vercel デプロイ、Docker 実行に対応

## 現在のデフォルト言語

- アプリのデフォルト言語は `日本語 (/jp)` です
- 既存の言語 Cookie がある場合はその設定を優先します
- ルートアクセス時は未設定なら日本語へリダイレクトします

## 必要な環境変数

プロジェクトルートに `.env.local` を作成して設定してください。

```bash
STEPFUN_API_KEY=YOUR_STEPFUN_API_KEY
STEPFUN_API_URL=https://api.stepfun.ai/v1
```

## ローカル開発

```bash
npm i -g yarn
yarn
yarn dev --port 3600 --hostname 127.0.0.1
```

ブラウザで以下を開きます。

- TTS 生成: [http://127.0.0.1:3600/jp/generate-voice](http://127.0.0.1:3600/jp/generate-voice)
- 音声クローン: [http://127.0.0.1:3600/jp/voice-clone](http://127.0.0.1:3600/jp/voice-clone)

## 本番ビルド

```bash
yarn build
PORT=3600 yarn start
```

## Docker 実行

```bash
docker build -t tts-stepfun-web \
  --build-arg STEPFUN_API_KEY=YOUR_STEPFUN_API_KEY \
  --build-arg NODE_ENV=production .

docker run -d -p 3600:3000 --name tts-stepfun-web-container tts-stepfun-web
```

## Vercel デプロイ

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/owenshen0907/tts-stepfun-web&env=STEPFUN_API_KEY&env=STEPFUN_API_URL&project-name=tts-stepfun-web&repository-name=tts-stepfun-web)

## 最新の構成メモ

- `app/[lang]/generate-voice/`: 音声生成ページ
- `app/[lang]/voice-clone/`: 音声クローンページ
- `app/api/audio/tts/route.ts`: TTS API プロキシ
- `app/api/audio/clone/route.ts`: 音声クローン API プロキシ
- `app/api/audio/voices/route.ts`: 利用可能な音色一覧取得
- `app/api/file/upload/route.ts`: 音声サンプルのアップロード

## 今後も改善しやすいポイント

- 音声クローン結果に「そのまま生成ページへ引き継ぐ」導線をさらに強化する
- 音色一覧や履歴に検索・フィルタを追加する
- README の多言語版を機能追加のたびに同期しやすい構成にする
- 生成結果やクローン結果のエラーメッセージをさらにユーザー向けに整える
