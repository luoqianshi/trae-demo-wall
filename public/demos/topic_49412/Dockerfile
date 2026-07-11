# Kindchat Dockerfile
# 构建: docker build -t kindchat .
# 运行: docker run -p 12345:12345 kindchat

FROM node:20-alpine AS builder

WORKDIR /app

# 复制依赖文件
COPY package.json package-lock.json* ./
COPY client/package.json client/
COPY server/package.json server/

# 安装依赖
RUN npm install --production=false
RUN cd client && npm install --production=false
RUN cd server && npm install --production=false

# 复制源码
COPY . .

# 构建
RUN npm run build

# 生产阶段
FROM node:20-alpine

WORKDIR /app

# 复制生产依赖
COPY --from=builder /app/server/package.json /app/server/package-lock.json* ./server/
COPY --from=builder /app/server/node_modules ./server/node_modules

# 复制构建产物
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/client/dist ./client/dist

# 暴露端口
EXPOSE 12345

# 启动
CMD ["node", "server/dist/index.js"]