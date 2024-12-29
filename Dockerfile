FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps

WORKDIR /app

# 安装必要的依赖
RUN apk add --no-cache libc6-compat

# 配置 Yarn 和 NPM 使用国内的 cnpm 镜像源
RUN yarn config set registry https://registry.cnpmjs.org/ && \
    npm config set registry https://registry.cnpmjs.org/

# 复制依赖定义文件
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./

# 安装依赖项，并实现重试逻辑
RUN \
  if [ -f yarn.lock ]; then \
    n=0; \
    until [ $n -ge 5 ]; do \
      yarn --frozen-lockfile && break || n=$((n+1)) && echo "Yarn install 失败，正在重试... ($n)"; \
    done; \
    if [ $n -ge 5 ]; then echo "Yarn install 在 5 次尝试后失败"; exit 1; fi \
  elif [ -f package-lock.json ]; then \
    n=0; \
    until [ $n -ge 5 ]; do \
      npm ci && break || n=$((n+1)) && echo "NPM install 失败，正在重试... ($n)"; \
    done; \
    if [ $n -ge 5 ]; then echo "NPM install 在 5 次尝试后失败"; exit 1; fi \
  elif [ -f pnpm-lock.yaml ]; then \
    corepack enable pnpm && \
    n=0; \
    until [ $n -ge 5 ]; do \
      pnpm install --frozen-lockfile && break || n=$((n+1)) && echo "PNPM install 失败，正在重试... ($n)"; \
    done; \
    if [ $n -ge 5 ]; then echo "PNPM install 在 5 次尝试后失败"; exit 1; fi \
  else \
    echo "未找到锁文件。" && exit 1; \
  fi

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
# ENV NEXT_TELEMETRY_DISABLED 1

RUN \
  if [ -f yarn.lock ]; then yarn run build; \
  elif [ -f package-lock.json ]; then npm run build; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm run build; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
# Uncomment the following line in case you want to disable telemetry during runtime.
# ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3600

ENV PORT 3600

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
CMD HOSTNAME="0.0.0.0" node server.js
