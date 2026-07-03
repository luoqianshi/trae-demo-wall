# 第一阶段：构建前端
FROM node:20-alpine AS frontend-builder
WORKDIR /app

# 安装编译工具（better-sqlite3需要）
RUN apk add --no-cache python3 make g++

COPY package.json ./
RUN npm install
COPY . .
RUN npm run build

# 第二阶段：运行环境
FROM node:20-alpine
WORKDIR /app

# 安装编译工具（better-sqlite3需要）
RUN apk add --no-cache python3 make g++

# 安装生产依赖
COPY package.json ./
RUN npm install --omit=dev

# 清理编译工具（减小镜像体积）
RUN apk del python3 make g++

# 复制构建好的前端文件
COPY --from=frontend-builder /app/dist ./dist

# 复制后端代码
COPY api ./api
COPY shared ./shared
COPY tsconfig.json ./

# 创建数据目录
RUN mkdir -p /app/data

ENV PORT=3001
ENV NODE_ENV=production
ENV ADMIN_PASSWORD=admin123
ENV JWT_SECRET=tarot-secret-key-change-me
ENV DB_PATH=/app/data/tarot.db

EXPOSE 3001

CMD ["node", "--import", "tsx", "api/server.ts"]