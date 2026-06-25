# DouMa 评测框架 · 生产镜像（对外发布 · 完全干净版）
# 一个镜像锁死四套语言工具链（python/clang++/rustc/go），保证判分跨机器可复现。
# 题库与代码一并打包，分发后 `docker run` 即起服务、浏览器直达界面。
#
# 【生产/干净版约定】
# 1. 基础镜像用公共 python:3.12-slim-bookworm，任何人都能拉取构建。
# 2. 不打包 config.volc.yaml（内含内网 endpoint + 默认 5 选手），因此首次启动
#    选手库为空，界面无任何预置模型，由使用者自行在「管理选手」页添加。
# 3. 镜像内零密钥：API key 一律运行期通过环境变量注入，构建产物不含任何 key。
#
# 测试/内网验证请使用 Dockerfile.test（内网基础镜像 + 默认 5 选手）。
FROM python:3.12-slim-bookworm

# APT 镜像源可通过 --build-arg APT_MIRROR=... 覆盖，默认官方源（对外发布通用）
# 国内构建加速示例：--build-arg APT_MIRROR=mirrors.tuna.tsinghua.edu.cn
ARG APT_MIRROR=deb.debian.org

# —— 判分工具链：C++(clang) / Rust(rustc) / Go ——
# 版本由 Debian bookworm 软件源固定，保证同一镜像判分位级一致。
RUN set -eux; \
    if [ "$APT_MIRROR" != "deb.debian.org" ]; then \
        sed -i "s|deb.debian.org|${APT_MIRROR}|g" /etc/apt/sources.list.d/debian.sources; \
    fi; \
    apt-get update; \
    apt-get install -y --no-install-recommends clang rustc golang-go; \
    rm -rf /var/lib/apt/lists/*

# Go 执行器用 GO111MODULE=off 离线编译；预置可写缓存目录避免运行期报错
ENV GO111MODULE=off \
    GOCACHE=/tmp/gocache \
    GOPATH=/tmp/gopath \
    PYTHONUNBUFFERED=1

WORKDIR /app

# 先装依赖再拷源码，最大化利用构建缓存
# PIP 镜像源可通过 --build-arg PIP_INDEX_URL=... 覆盖（默认官方 PyPI）
ARG PIP_INDEX_URL=https://pypi.org/simple
COPY requirements.txt .
RUN pip install --no-cache-dir -i ${PIP_INDEX_URL} -r requirements.txt

# 拷入应用代码与题库（题库随镜像分发，开箱即用）
# 干净版只带 mock 示例配置，绝不打包 config.volc.yaml（含内网 endpoint 与默认选手）。
COPY douma ./douma
COPY tasks ./tasks
COPY config.example.yaml ./

EXPOSE 8010

# 监听 0.0.0.0 以便容器外访问；API key 通过环境变量在运行期注入
CMD ["python", "-m", "douma.cli", "serve", "--host", "0.0.0.0", "--port", "8010", "--tasks", "tasks"]
