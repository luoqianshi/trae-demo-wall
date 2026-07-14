# Docker 容器化

## Dockerfile
定义镜像构建步骤：

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

## docker-compose
编排多个容器：

```yaml
services:
  web:
    build: .
    ports:
      - "3000:3000"
  db:
    image: mysql
```

## 网络
Bridge, Host, None 网络模式。

## 数据卷
挂载本地目录到容器。