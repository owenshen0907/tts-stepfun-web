# TTS Azure Web

[简体中文](./README_CN.md) / English

**Owen's Cats TTS Web** is a StepFun text-to-speech (TTS) web application. It can run locally or be deployed with your StepFun Key in just one click.

### Key Features:

- Supports selecting gender and voice character.
- Adjustable speed and volume.
- Audio output download supported.
- One-click deployment locally or on the cloud.

This project is designed for users who want to fully experience the features of StepFun TTS with minimal setup efforts.

**Online Demo**: [https://tts.xjiojio.cn](https://tts.xjiojio.cn)

---

## Getting Started

### Obtain Your API Key

1. You need a valid phone number.
2. Visit [StepFun Official Website](https://platform.stepfun.com/) and register using your phone number.
3. Go to [User Center - Account Management - API Key](https://platform.stepfun.com/interface-key) to copy your key.
4. Upon successful registration, you will receive a default bonus of 15 CNY credits.

---

## One-Click Deployment on Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/owenshen0907/tts-stepfun-web&env=STEPFUN_API_KEY&env=STEPFUN_API_URL&project-name=tts-stepfun-web&repository-name=tts-stepfun-web)

---
## Before starting development, create a new .env.local file in the project root directory and input your StepFun API key and URL:

```bash
# Stepfun API Key and URL
STEPFUN_API_KEY=YOUR_STEPFUN_APIKEY
STEPFUN_API_URL=https://api.stepfun.com/v1
```

## docker Deployment
```bash
##
docker build -t tts-stepfun-web .
docker run -d -p 3600:3600 --name tts-stepfun-web tts-stepfun-web
```


## One-Click Local Deployment

```bash
# Install yarn
npm i -g yarn
# Install dependencies
yarn
# Build for production
yarn build
# Run production server
PORT=3600 yarn start
```


Run the development server locally:

```bash
# Install yarn
npm i -g yarn
# Install dependencies
yarn
# Run the development server
yarn dev - 3600
```

Open http://localhost:3600 in your browser to view the results.

## Git Commit Guidelines

- `feat` Add new business features.
- `fix` Fix business issues/bugs.
- `perf` Optimize performance.
- `style` Code style changes that don’t affect the runtime result.
- `refactor` Refactor the code.
- `revert` Revert changes.
- `test` Changes related to testing, no business logic changes.
- `docs` Documentation and comments related changes.
- `chore` Miscellaneous tasks like updating dependencies or modifying build scripts.
- `ci` Continuous integration-related changes.
