# TTS stepfun Web

[English](./README.md) / 简体中文

Owen`s Cats TTS Web 是一个 StepFun 文本转语音（TTS）网页应用。可以在本地运行或使用你的 StepFun Key 一键部署。

主要特性：

- 支持选择性别和角色音色
- 支持语速、音量的调节
- 支持输出音频下载
- 本地和云端一键部署。

该项目适合那些希望在体验 StepFun TTS 全功能的同时最小化设置工作的用户。

在线演示： [http://tts.xjiojio.cn](http://tts.xjiojio.cn)

## 入门指南

获取你的 API 密钥

- 需要一张电话卡
- 访问 [阶跃星辰官网](https://platform.stepfun.com/) 通过手机号注册
- 访问 [用户中心-账户管理-接口密钥](https://platform.stepfun.com/interface-key)复制你的密钥
- 注册成功后，默认赠送15元代金券

## 在 Vercel 上一键部署

[![使用 Vercel 部署](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/owenshen0907/tts-stepfun-web&env=STEPFUN_API_KEY&env=STEPFUN_API_URL&project-name=tts-stepfun-web&repository-name=tts-stepfun-web)

## 设置环境变量
### 在项目根目录创建一个新的 `.env.local` 文件，并输入你的 stepfun 获取的apikey及API_URL：

```bash
# Stepfun API Key and URL
STEPFUN_API_KEY=YOUR_STEPFUN_APIKEY
STEPFUN_API_URL=https://api.stepfun.com/v1
```

## docker部署
```bash
#注意先配置环境变量
#创建镜像
docker build -t tts-stepfun-web --build-arg STEPFUN_API_KEY=YOUR_STEPFUN_APIKEY --build-arg NODE_ENV=production .
#创建容器
docker run -d -p 3600:3000 --name tts-stepfun-web-container \
  tts-stepfun-web
#启动后访问地址：http://localhost:3600/
```

## 在本地一键部署

```bash
# 安装 yarn
npm i -g yarn
# 安装依赖
yarn
# 构建生产环境
yarn build
# 运行生产环境服务
PORT=3600 yarn start
```

## 本地运行开发服务器：

```bash
# 安装 yarn
npm i -g yarn
# 安装依赖
yarn
# 运行服务器
PORT=3600 yarn dev
```

使用浏览器打开 [http://localhost:3001](http://localhost:3600/) 查看结果。

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
```markdown
tts-stepfun-web/
├── app/                         
│   ├── [lang]/                   # 多语言动态路由
│   │   ├── ui/                   # 界面相关文件
│   │   │   ├── nav.tsx           # 导航栏组件
│   │   │   ├── components/       # 可复用组件
│   │   │   │   ├── IconButton.tsx            # 图标按钮
│   │   │   │   ├── ThemeToggle.tsx           # 主题切换
│   │   │   │   ├── MicButton.tsx             # 麦克风按钮，打开音色克隆页面
│   │   │   │   ├── voice-clone/              # 音色克隆功能相关组件
│   │   │   │   │   ├── VoiceCloneModal.tsx   # 音色克隆主页面
│   │   │   │   │   ├── AudioPlayer.tsx       # 音频播放器
│   │   │   │   │   ├── Recorder.tsx          # 录音功能
│   │   │   │   │   ├── FileUploader.tsx      # 文件上传
│   │   │   │   │   ├── TextOutput.tsx        # 文本输出框
│   │   │   │   │   ├── ToneGeneratorButton.tsx # 生成音色按钮
│   │   │   │   ├── VoiceCard.tsx             # 音色选择组件
│   │   ├── generate-voice/                   # 生产音频
│   │   │   ├── page.tsx                      # 
│   │   ├── voice-clone/                      # 音色克隆
│   │   ├── usage-case/                       # 案例
│   │   ├── layout.tsx                        # 定义页面的整体布局结构
│   │   ├── overlay-scrollbar.tsx             #
│   │   ├── page.tsx                          # 
│   │   ├── providers.tsx                     #
│   ├── api/                    # 后端 API 逻辑
│   │   ├── audio/              # 音频相关 API
│   │   │   ├── route.ts                 # 现有音频生成逻辑
│   │   │   ├── cloneTone.ts             # 音色克隆接口
│   ├── lib/                    # 工具类和类型定义
│   │   ├── constants.ts        # 常量定义
│   │   ├── types.ts            # 类型定义
│   │   ├── i18n/               # 国际化配置
├── public/                     # 静态资源文件夹
│   ├── audio/                  # 示例音频文件
├── styles/                     # 样式文件夹（如果有全局样式需求）
├── next.config.js              # Next.js 配置文件
├── package.json                # 项目依赖定义
└── README.md                   # 项目说明文档
```