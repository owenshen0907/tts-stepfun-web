# TTS Azure Web

[English](./README.md) / 简体中文

Owen`s Cats TTS Web 是一个 StepFun 文本转语音（TTS）网页应用。可以在本地运行或使用你的 StepFun Key 一键部署。

主要特性：

- 支持选择性别和角色音色
- 支持语速、音量的调节
- 支持输出音频下载
- 本地和云端一键部署。

该项目适合那些希望在体验 StepFun TTS 全功能的同时最小化设置工作的用户。

在线演示： [https://tts.xjiojio.cn](https://tts.xjiojio.cn)

## 入门指南

获取你的 API 密钥

- 需要一张电话卡
- 访问 [阶跃星辰官网](https://platform.stepfun.com/) 通过手机号注册
- 访问 [用户中心-账户管理-接口密钥](https://platform.stepfun.com/interface-key)复制你的密钥
- 注册成功后，默认赠送15元代金券

## 在 Vercel 上一键部署

[![使用 Vercel 部署](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/owenshen0907/tts-stepfun-web&env=STEPFUN_API_KEY&env=STEPFUN_API_URL&project-name=tts-stepfun-web&repository-name=tts-stepfun-web)

## 在本地一键部署

```bash
# 安装 yarn
npm i -g yarn
# 安装依赖
yarn
# 构建生产环境
yarn build
# 运行生产环境服务
yarn start
```

## 开发

在开始开发之前，必须在项目根目录创建一个新的 `.env.local` 文件，并输入你的 Azure Key 和对应的地区：

```bash
# Stepfun API Key and URL
STEPFUN_API_KEY=YOUR_STEPFUN_APIKEY
STEPFUN_API_URL=https://api.stepfun.com/v1
```

本地运行开发服务器：

```bash
# 安装 yarn
npm i -g yarn
# 安装依赖
yarn
# 运行服务器
yarn dev
```

使用浏览器打开 [http://localhost:3001](http://localhost:3001/) 查看结果。

## Git 提交规范参考

- `feat` 增加新的业务功能
- `fix` 修复业务问题/BUG
- `perf` 优化性能
- `style` 更改代码风格, 不影响运行结果
- `refactor` 重构代码
- `revert` 撤销更改
- `test` 测试相关, 不涉及业务代码的更改
- `docs` 文档和注释相关
- `chore` 更新依赖/修改脚手架配置等琐事
- `ci` 持续集成相关
