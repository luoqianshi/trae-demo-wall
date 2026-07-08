FROM golang:1.24-alpine AS builder

WORKDIR /app

# 先复制依赖描述，利用 Docker 层缓存
COPY go.mod go.sum ./
RUN go mod download

# 复制源码并编译
COPY . .
RUN CGO_ENABLED=0 go build -o traecoin .

FROM alpine:3.20

WORKDIR /app

# 复制编译产物
COPY --from=builder /app/traecoin .

# 暴露 Web 服务端口
EXPOSE 8080

# 设置默认节点ID
ENV NODE_ID=3000

# 默认启动 Web 服务器
CMD ["./traecoin", "webserver", "-port", "8080"]
