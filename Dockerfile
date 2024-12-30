# 第一阶段：安装依赖并构建应用
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 安装必要的系统依赖
RUN apk add --no-cache libc6-compat

# 复制依赖定义文件
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./

# 安装依赖项
# 设置超时时间
ENV YARN_TIMEOUT=600000

# 安装依赖项
RUN \
  if [ -f yarn.lock ]; then \
    yarn config set registry https://registry.npmmirror.com && \
    yarn install --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm install; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm install; \
  else echo "Lockfile not found." && exit 1; \
  fi

# 复制项目源代码到构建阶段
COPY . .

# 运行构建命令
RUN \
  if [ -f yarn.lock ]; then \
    yarn config set registry https://registry.npmmirror.com && \
    yarn install --verbose --network-timeout 100000 --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm install --verbose; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm install --verbose; \
  else echo "Lockfile not found." && exit 1; \
  fi

# 可选调试步骤：验证 'next' 是否存在
# RUN ls -la node_modules/.bin

# 第二阶段：创建最终运行时镜像
FROM node:18-alpine AS runner

WORKDIR /app

# 复制已安装的依赖项和构建产物
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package.json ./package.json

# 添加用户和组以提高安全性
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

USER nextjs

# 声明构建参数（仅保留需要的）
ARG STEPFUN_API_KEY
ARG NODE_ENV

# 设置运行时环境变量
ENV STEPFUN_API_KEY=${STEPFUN_API_KEY}
ENV STEPFUN_API_URL=https://api.stepfun.com/v1
ENV NODE_ENV=${NODE_ENV}

# 暴露端口
EXPOSE 3000

# 启动应用程序，使用 'yarn start' 或 'npm start'
CMD ["yarn", "start"]