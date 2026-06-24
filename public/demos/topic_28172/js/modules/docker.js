// Docker 指令集模块
class DockerModule {
    constructor() {
        this.title = 'Docker 指令集';
        this.commands = this.initCommands();
    }

    initCommands() {
        return [
            {
                category: '🖼️ 镜像管理',
                items: [
                    { name: 'docker images', desc: '列出本地镜像', example: 'docker images', syntax: 'docker images [选项]', options: '-a 显示所有, -q 仅ID, --digests 显示摘要, --format 格式化' },
                    { name: 'docker pull', desc: '拉取镜像', example: 'docker pull nginx:latest', syntax: 'docker pull [选项] 镜像[:标签]', options: '-a 所有标签, --platform 指定平台' },
                    { name: 'docker push', desc: '推送镜像', example: 'docker push myrepo/myimage:v1', syntax: 'docker push [选项] 镜像[:标签]', options: '--all-tags 所有标签' },
                    { name: 'docker build', desc: '构建镜像', example: 'docker build -t myapp:v1 .', syntax: 'docker build [选项] 路径', options: '-t 标签, -f Dockerfile路径, --no-cache 不用缓存, --build-arg 参数' },
                    { name: 'docker rmi', desc: '删除镜像', example: 'docker rmi nginx:latest', syntax: 'docker rmi [选项] 镜像', options: '-f 强制删除, --no-prune 不删除父镜像' },
                    { name: 'docker tag', desc: '标记镜像', example: 'docker tag myapp:v1 myrepo/myapp:v1', syntax: 'docker tag 源镜像 目标镜像', options: '' },
                    { name: 'docker save', desc: '导出镜像为tar', example: 'docker save -o myimage.tar myimage:v1', syntax: 'docker save [选项] 镜像', options: '-o 输出文件' },
                    { name: 'docker load', desc: '从tar导入镜像', example: 'docker load -i myimage.tar', syntax: 'docker load [选项]', options: '-i 输入文件' },
                    { name: 'docker import', desc: '从tar创建镜像', example: 'docker import myimage.tar myimage:v1', syntax: 'docker import 文件 [镜像[:标签]]', options: '' },
                    { name: 'docker export', desc: '导出容器为tar', example: 'docker export container > container.tar', syntax: 'docker export 容器', options: '' },
                    { name: 'docker history', desc: '查看镜像历史', example: 'docker history nginx:latest', syntax: 'docker history [选项] 镜像', options: '-H 人类可读, --no-trunc 不截断' },
                    { name: 'docker search', desc: '搜索镜像', example: 'docker search nginx', syntax: 'docker search [选项] 关键词', options: '--limit 结果数, --filter 过滤' },
                    { name: 'docker inspect', desc: '查看镜像详情', example: 'docker inspect nginx:latest', syntax: 'docker inspect [选项] 镜像/容器', options: '-f 格式化输出' }
                ]
            },
            {
                category: '📦 容器管理',
                items: [
                    { name: 'docker ps', desc: '列出容器', example: 'docker ps -a', syntax: 'docker ps [选项]', options: '-a 所有容器, -q 仅ID, -l 最新, -s 显示大小, --format 格式化' },
                    { name: 'docker run', desc: '运行容器', example: 'docker run -d -p 80:80 --name web nginx', syntax: 'docker run [选项] 镜像 [命令]', options: '-d 后台, -p 端口映射, -v 卷挂载, -e 环境变量, --name 名称, -it 交互, --rm 自动删除, --network 网络' },
                    { name: 'docker create', desc: '创建容器但不启动', example: 'docker create --name mycontainer nginx', syntax: 'docker create [选项] 镜像', options: '同docker run' },
                    { name: 'docker start', desc: '启动容器', example: 'docker start container_id', syntax: 'docker start [选项] 容器', options: '-a 附加, -i 交互' },
                    { name: 'docker stop', desc: '停止容器', example: 'docker stop container_id', syntax: 'docker stop [选项] 容器', options: '-t 等待秒数(默认10)' },
                    { name: 'docker restart', desc: '重启容器', example: 'docker restart container_id', syntax: 'docker restart [选项] 容器', options: '-t 等待秒数' },
                    { name: 'docker kill', desc: '强制停止容器', example: 'docker kill container_id', syntax: 'docker kill [选项] 容器', options: '-s 信号(默认SIGKILL)' },
                    { name: 'docker rm', desc: '删除容器', example: 'docker rm -f container_id', syntax: 'docker rm [选项] 容器', options: '-f 强制, -v 删除卷, -l 删除链接' },
                    { name: 'docker pause', desc: '暂停容器', example: 'docker pause container_id', syntax: 'docker pause 容器', options: '' },
                    { name: 'docker unpause', desc: '恢复容器', example: 'docker unpause container_id', syntax: 'docker unpause 容器', options: '' },
                    { name: 'docker rename', desc: '重命名容器', example: 'docker rename old_name new_name', syntax: 'docker rename 旧名 新名', options: '' },
                    { name: 'docker update', desc: '更新容器配置', example: 'docker update --memory 512m container', syntax: 'docker update [选项] 容器', options: '--memory 内存, --cpus CPU数, --restart 重启策略' },
                    { name: 'docker wait', desc: '等待容器停止', example: 'docker wait container_id', syntax: 'docker wait 容器', options: '返回退出码' },
                    { name: 'docker exec', desc: '在容器中执行命令', example: 'docker exec -it container bash', syntax: 'docker exec [选项] 容器 命令', options: '-i 交互, -t 终端, -d 后台, -u 用户, -e 环境变量' },
                    { name: 'docker attach', desc: '附加到容器', example: 'docker attach container_id', syntax: 'docker attach [选项] 容器', options: '--no-stdin 不附加stdin' },
                    { name: 'docker logs', desc: '查看容器日志', example: 'docker logs -f --tail 100 container', syntax: 'docker logs [选项] 容器', options: '-f 跟踪, --tail 行数, --since 时间, --until 时间, -t 时间戳' },
                    { name: 'docker cp', desc: '复制文件', example: 'docker cp file.txt container:/app/', syntax: 'docker cp 源 目标', options: '容器路径格式: 容器:路径' },
                    { name: 'docker port', desc: '查看端口映射', example: 'docker port container 80', syntax: 'docker port 容器 [端口]', options: '' },
                    { name: 'docker top', desc: '查看容器进程', example: 'docker top container', syntax: 'docker top 容器', options: '' },
                    { name: 'docker stats', desc: '查看容器资源使用', example: 'docker stats --no-stream', syntax: 'docker stats [选项] [容器]', options: '--no-stream 单次, -a 所有' },
                    { name: 'docker diff', desc: '查看容器文件变更', example: 'docker diff container', syntax: 'docker diff 容器', options: 'A 添加, C 修改, D 删除' },
                    { name: 'docker commit', desc: '将容器保存为镜像', example: 'docker commit container myimage:v1', syntax: 'docker commit [选项] 容器 [镜像[:标签]]', options: '-a 作者, -m 消息, --change Dockerfile指令' }
                ]
            },
            {
                category: '🌐 网络管理',
                items: [
                    { name: 'docker network ls', desc: '列出网络', example: 'docker network ls', syntax: 'docker network ls', options: '-q 仅ID' },
                    { name: 'docker network create', desc: '创建网络', example: 'docker network create -d bridge mynet', syntax: 'docker network create [选项] 名称', options: '-d 驱动(bridge/overlay), --subnet 子网, --gateway 网关' },
                    { name: 'docker network rm', desc: '删除网络', example: 'docker network rm mynet', syntax: 'docker network rm 网络', options: '' },
                    { name: 'docker network connect', desc: '连接容器到网络', example: 'docker network connect mynet container', syntax: 'docker network connect [选项] 网络 容器', options: '--ip 指定IP, --alias 别名' },
                    { name: 'docker network disconnect', desc: '断开容器网络', example: 'docker network disconnect mynet container', syntax: 'docker network disconnect 网络 容器', options: '' },
                    { name: 'docker network inspect', desc: '查看网络详情', example: 'docker network inspect bridge', syntax: 'docker network inspect [选项] 网络', options: '-f 格式化' },
                    { name: 'docker network prune', desc: '删除未使用网络', example: 'docker network prune', syntax: 'docker network prune [选项]', options: '-f 强制' }
                ]
            },
            {
                category: '💾 卷管理',
                items: [
                    { name: 'docker volume ls', desc: '列出卷', example: 'docker volume ls', syntax: 'docker volume ls [选项]', options: '-q 仅名称, -f 过滤' },
                    { name: 'docker volume create', desc: '创建卷', example: 'docker volume create myvolume', syntax: 'docker volume create [选项] 名称', options: '-d 驱动, --opt 选项' },
                    { name: 'docker volume rm', desc: '删除卷', example: 'docker volume rm myvolume', syntax: 'docker volume rm [选项] 卷', options: '-f 强制' },
                    { name: 'docker volume inspect', desc: '查看卷详情', example: 'docker volume inspect myvolume', syntax: 'docker volume inspect [选项] 卷', options: '-f 格式化' },
                    { name: 'docker volume prune', desc: '删除未使用卷', example: 'docker volume prune', syntax: 'docker volume prune [选项]', options: '-f 强制, -a 所有' }
                ]
            },
            {
                category: '📋 Docker Compose',
                items: [
                    { name: 'docker-compose up', desc: '启动服务', example: 'docker-compose up -d', syntax: 'docker-compose up [选项]', options: '-d 后台, --build 构建, --force-recreate 强制重建, --no-deps 不启动依赖' },
                    { name: 'docker-compose down', desc: '停止并删除服务', example: 'docker-compose down -v', syntax: 'docker-compose down [选项]', options: '-v 删除卷, --rmi 删除镜像, --remove-orphans 删除孤立容器' },
                    { name: 'docker-compose ps', desc: '列出服务', example: 'docker-compose ps', syntax: 'docker-compose ps [选项]', options: '-q 仅ID' },
                    { name: 'docker-compose logs', desc: '查看日志', example: 'docker-compose logs -f web', syntax: 'docker-compose logs [选项] [服务]', options: '-f 跟踪, --tail 行数' },
                    { name: 'docker-compose start', desc: '启动服务', example: 'docker-compose start web', syntax: 'docker-compose start [服务]', options: '' },
                    { name: 'docker-compose stop', desc: '停止服务', example: 'docker-compose stop web', syntax: 'docker-compose stop [服务]', options: '-t 等待秒数' },
                    { name: 'docker-compose restart', desc: '重启服务', example: 'docker-compose restart web', syntax: 'docker-compose restart [选项] [服务]', options: '-t 等待秒数' },
                    { name: 'docker-compose exec', desc: '执行命令', example: 'docker-compose exec web bash', syntax: 'docker-compose exec [选项] 服务 命令', options: '-d 后台, -T 不分配TTY, -u 用户' },
                    { name: 'docker-compose run', desc: '运行一次性命令', example: 'docker-compose run web python manage.py migrate', syntax: 'docker-compose run [选项] 服务 [命令]', options: '-d 后台, --rm 自动删除, --name 名称' },
                    { name: 'docker-compose build', desc: '构建服务镜像', example: 'docker-compose build --no-cache', syntax: 'docker-compose build [选项] [服务]', options: '--no-cache, --parallel 并行' },
                    { name: 'docker-compose pull', desc: '拉取服务镜像', example: 'docker-compose pull', syntax: 'docker-compose pull [选项] [服务]', options: '--ignore-pull-failures' },
                    { name: 'docker-compose push', desc: '推送服务镜像', example: 'docker-compose push', syntax: 'docker-compose push [选项] [服务]', options: '' },
                    { name: 'docker-compose config', desc: '验证并查看配置', example: 'docker-compose config', syntax: 'docker-compose config [选项]', options: '-q 验证, --services 列出服务, --volumes 列出卷' },
                    { name: 'docker-compose scale', desc: '调整服务数量', example: 'docker-compose scale web=3', syntax: 'docker-compose scale 服务=数量', options: '(已弃用,用up --scale)' },
                    { name: 'docker-compose top', desc: '查看服务进程', example: 'docker-compose top', syntax: 'docker-compose top [服务]', options: '' },
                    { name: 'docker-compose port', desc: '查看端口映射', example: 'docker-compose port web 80', syntax: 'docker-compose port [选项] 服务 端口', options: '--protocol tcp/udp' },
                    { name: 'docker-compose kill', desc: '强制停止服务', example: 'docker-compose kill web', syntax: 'docker-compose kill [选项] [服务]', options: '-s 信号' },
                    { name: 'docker-compose rm', desc: '删除停止的容器', example: 'docker-compose rm -f', syntax: 'docker-compose rm [选项] [服务]', options: '-f 强制, -v 删除卷' },
                    { name: 'docker-compose pause', desc: '暂停服务', example: 'docker-compose pause web', syntax: 'docker-compose pause [服务]', options: '' },
                    { name: 'docker-compose unpause', desc: '恢复服务', example: 'docker-compose unpause web', syntax: 'docker-compose unpause [服务]', options: '' }
                ]
            },
            {
                category: '⚙️ 系统与信息',
                items: [
                    { name: 'docker info', desc: '查看Docker系统信息', example: 'docker info', syntax: 'docker info [选项]', options: '-f 格式化' },
                    { name: 'docker version', desc: '查看Docker版本', example: 'docker version', syntax: 'docker version [选项]', options: '-f 格式化' },
                    { name: 'docker system df', desc: '查看磁盘使用', example: 'docker system df -v', syntax: 'docker system df [选项]', options: '-v 详细' },
                    { name: 'docker system prune', desc: '清理未使用资源', example: 'docker system prune -a -f', syntax: 'docker system prune [选项]', options: '-a 所有, -f 强制, --volumes 删除卷' },
                    { name: 'docker events', desc: '实时事件流', example: 'docker events --filter container=id', syntax: 'docker events [选项]', options: '--filter 过滤, --since/--until 时间' },
                    { name: 'docker login', desc: '登录镜像仓库', example: 'docker login registry.example.com', syntax: 'docker login [选项] [仓库]', options: '-u 用户, -p 密码' },
                    { name: 'docker logout', desc: '登出镜像仓库', example: 'docker logout registry.example.com', syntax: 'docker logout [仓库]', options: '' },
                    { name: 'docker trust', desc: '镜像信任管理', example: 'docker trust sign myimage:v1', syntax: 'docker trust 命令', options: 'sign/inspect/key/revoke' },
                    { name: 'docker manifest', desc: '镜像清单管理', example: 'docker manifest inspect nginx:latest', syntax: 'docker manifest 命令', options: 'inspect/create/push' },
                    { name: 'docker plugin', desc: '插件管理', example: 'docker plugin ls', syntax: 'docker plugin 命令', options: 'ls/install/rm/enable/disable' },
                    { name: 'docker context', desc: '上下文管理', example: 'docker context ls', syntax: 'docker context 命令', options: 'ls/create/use/show/rm' },
                    { name: 'docker daemon', desc: '查看守护进程配置', example: 'cat /etc/docker/daemon.json', syntax: '配置文件方式', options: '重启: systemctl restart docker' }
                ]
            },
            {
                category: '🔧 Swarm 集群',
                items: [
                    { name: 'docker swarm init', desc: '初始化Swarm集群', example: 'docker swarm init --advertise-addr 192.168.1.1', syntax: 'docker swarm init [选项]', options: '--advertise-addr 地址, --listen-addr 监听地址' },
                    { name: 'docker swarm join', desc: '加入Swarm集群', example: 'docker swarm join --token TOKEN HOST:PORT', syntax: 'docker swarm join [选项]', options: '--token 令牌, --advertise-addr 地址' },
                    { name: 'docker swarm leave', desc: '离开Swarm集群', example: 'docker swarm leave --force', syntax: 'docker swarm leave [选项]', options: '--force 强制' },
                    { name: 'docker swarm join-token', desc: '获取加入令牌', example: 'docker swarm join-token worker', syntax: 'docker swarm join-token [角色]', options: 'worker/manager, --rotate 更新令牌' },
                    { name: 'docker node ls', desc: '列出Swarm节点', example: 'docker node ls', syntax: 'docker node ls [选项]', options: '-q 仅ID, -f 过滤' },
                    { name: 'docker node inspect', desc: '查看节点详情', example: 'docker node inspect node_id', syntax: 'docker node inspect [选项] 节点', options: '-f 格式化' },
                    { name: 'docker node update', desc: '更新节点属性', example: 'docker node update --availability active node_id', syntax: 'docker node update [选项] 节点', options: '--availability active/pause/drain, --role manager/worker' },
                    { name: 'docker node rm', desc: '删除节点', example: 'docker node rm node_id --force', syntax: 'docker node rm [选项] 节点', options: '--force 强制' },
                    { name: 'docker service create', desc: '创建服务', example: 'docker service create --name web --replicas 3 nginx', syntax: 'docker service create [选项] 镜像', options: '--name 名称, --replicas 数量, --network 网络, --mount 挂载, --env 环境变量' },
                    { name: 'docker service ls', desc: '列出服务', example: 'docker service ls', syntax: 'docker service ls [选项]', options: '-q 仅ID, -f 过滤' },
                    { name: 'docker service ps', desc: '列出服务任务', example: 'docker service ps web', syntax: 'docker service ps [选项] 服务', options: '-q 仅ID, -f 过滤' },
                    { name: 'docker service inspect', desc: '查看服务详情', example: 'docker service inspect web', syntax: 'docker service inspect [选项] 服务', options: '-f 格式化' },
                    { name: 'docker service update', desc: '更新服务', example: 'docker service update --replicas 5 web', syntax: 'docker service update [选项] 服务', options: '--replicas, --image, --env-add, --mount-add' },
                    { name: 'docker service scale', desc: '调整服务规模', example: 'docker service scale web=5', syntax: 'docker service scale 服务=数量', options: '' },
                    { name: 'docker service rm', desc: '删除服务', example: 'docker service rm web', syntax: 'docker service rm 服务', options: '' },
                    { name: 'docker service logs', desc: '查看服务日志', example: 'docker service logs -f web', syntax: 'docker service logs [选项] 服务', options: '-f 跟踪, --tail 行数' },
                    { name: 'docker stack deploy', desc: '部署Stack', example: 'docker stack deploy -c compose.yml mystack', syntax: 'docker stack deploy [选项] STACK', options: '-c compose文件, --with-registry-auth' },
                    { name: 'docker stack ls', desc: '列出Stack', example: 'docker stack ls', syntax: 'docker stack ls', options: '' },
                    { name: 'docker stack ps', desc: '列出Stack任务', example: 'docker stack ps mystack', syntax: 'docker stack ps [选项] STACK', options: '-q 仅ID' },
                    { name: 'docker stack services', desc: '列出Stack服务', example: 'docker stack services mystack', syntax: 'docker stack services [选项] STACK', options: '-q 仅ID' },
                    { name: 'docker stack rm', desc: '删除Stack', example: 'docker stack rm mystack', syntax: 'docker stack rm STACK', options: '' }
                ]
            },
            {
                category: '💡 常用组合命令',
                items: [
                    { name: '清理所有停止容器', desc: '删除所有已停止的容器', example: 'docker container prune -f', syntax: 'docker container prune -f', options: '' },
                    { name: '清理所有未用镜像', desc: '删除所有未被容器使用的镜像', example: 'docker image prune -a -f', syntax: 'docker image prune -a -f', options: '' },
                    { name: '完全清理', desc: '清理容器、镜像、网络、构建缓存', example: 'docker system prune -a -f --volumes', syntax: 'docker system prune -a -f --volumes', options: '' },
                    { name: '批量停止容器', desc: '停止所有运行容器', example: 'docker stop $(docker ps -q)', syntax: 'docker stop $(docker ps -q)', options: '' },
                    { name: '批量删除容器', desc: '删除所有停止容器', example: 'docker rm $(docker ps -aq)', syntax: 'docker rm $(docker ps -aq)', options: '' },
                    { name: '批量删除镜像', desc: '删除所有镜像', example: 'docker rmi $(docker images -q)', syntax: 'docker rmi $(docker images -q)', options: '' },
                    { name: '查看容器IP', desc: '获取容器IP地址', example: 'docker inspect -f "{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}" container', syntax: 'docker inspect -f ...', options: '' },
                    { name: '进入运行容器', desc: '交互式进入容器', example: 'docker exec -it container bash', syntax: 'docker exec -it 容器 bash', options: '或用 sh' },
                    { name: '查看容器日志实时', desc: '实时跟踪容器日志', example: 'docker logs -f --tail 100 container', syntax: 'docker logs -f --tail N 容器', options: '' },
                    { name: '导出导入镜像', desc: '镜像迁移', example: 'docker save -o image.tar image:v1 && docker load -i image.tar', syntax: 'save + load', options: '' },
                    { name: '查看Docker资源占用', desc: '磁盘使用统计', example: 'docker system df -v', syntax: 'docker system df -v', options: '' },
                    { name: '查看容器资源使用', desc: 'CPU/内存实时监控', example: 'docker stats --no-stream', syntax: 'docker stats --no-stream', options: '' },
                    { name: '构建并运行', desc: '构建镜像后立即运行', example: 'docker build -t app:v1 . && docker run -d -p 80:80 app:v1', syntax: 'build + run', options: '' },
                    { name: 'Compose完整部署', desc: '构建并启动所有服务', example: 'docker-compose up -d --build', syntax: 'docker-compose up -d --build', options: '' },
                    { name: '查看镜像层', desc: '查看镜像构建历史', example: 'docker history --no-trunc --human image:v1', syntax: 'docker history 镜像', options: '' }
                ]
            }
        ];
    }

    render(container) {
        container.innerHTML = `
            <div style="display:grid;gap:16px;">
                <div style="padding:12px;background:var(--bg-card);border-radius:8px;">
                    <input type="text" id="docker-search" placeholder="🔍 搜索 Docker 指令名称或关键词..." style="width:100%;padding:10px 14px;background:var(--bg-sidebar);border:1px solid var(--border);border-radius:6px;color:var(--text-primary);font-size:14px;">
                </div>
                <div id="docker-list" style="display:grid;gap:16px;"></div>
            </div>
        `;

        setTimeout(() => {
            this.renderList('');
            const searchEl = document.getElementById('docker-search');
            if (searchEl) {
                searchEl.addEventListener('input', (e) => {
                    this.renderList(e.target.value.toLowerCase());
                });
                searchEl.focus();
            }
        }, 100);
    }

    renderList(keyword) {
        const listEl = document.getElementById('docker-list');
        if (!listEl) return;

        let html = '';
        let totalMatch = 0;

        this.commands.forEach((cat, catIdx) => {
            const matched = cat.items.filter(item => {
                if (!keyword) return true;
                return item.name.toLowerCase().includes(keyword) ||
                       item.desc.toLowerCase().includes(keyword) ||
                       item.example.toLowerCase().includes(keyword);
            });

            if (matched.length === 0) return;
            totalMatch += matched.length;

            html += `
                <div style="padding:14px 16px;background:var(--bg-card);border-radius:8px;">
                    <div style="font-size:14px;font-weight:600;color:var(--accent);margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid var(--border);">
                        ${cat.category} <span style="font-size:11px;color:var(--text-secondary);font-weight:400;">(${matched.length})</span>
                    </div>
                    <div style="display:grid;gap:8px;">
                        ${matched.map((item, idx) => this.renderItem(item, catIdx, idx)).join('')}
                    </div>
                </div>
            `;
        });

        if (totalMatch === 0) {
            html = '<div style="padding:30px;text-align:center;color:var(--text-secondary);font-size:13px;">未找到匹配的命令，请尝试其他关键词</div>';
        }

        listEl.innerHTML = html;
    }

    renderItem(item, catIdx, itemIdx) {
        const id = `docker-${catIdx}-${itemIdx}`;
        return `
            <div style="padding:10px 12px;background:var(--bg-sidebar);border-radius:6px;cursor:pointer;" onclick="(function(){var d=document.getElementById('${id}-detail');d.style.display=d.style.display==='none'?'block':'none';})()">
                <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;">
                    <div style="display:flex;align-items:center;gap:10px;flex:1;min-width:0;">
                        <code style="color:var(--success);font-size:14px;font-weight:600;white-space:nowrap;">${item.name}</code>
                        <span style="color:var(--text-secondary);font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${item.desc}</span>
                    </div>
                    <button class="btn btn-secondary" onclick="event.stopPropagation();app.modules.docker.copy('${item.example.replace(/'/g, "\\'")}')" style="padding:3px 10px;font-size:11px;">复制示例</button>
                </div>
                <div id="${id}-detail" style="margin-top:10px;padding-top:10px;border-top:1px dashed var(--border);display:none;">
                    <div style="display:grid;gap:6px;font-size:12px;line-height:1.7;">
                        <div><span style="color:var(--text-secondary);">📖 语法:</span> <code style="color:var(--text-primary);">${item.syntax}</code></div>
                        <div><span style="color:var(--text-secondary);">💡 示例:</span> <code style="color:var(--text-primary);">${item.example}</code></div>
                        ${item.options ? `<div><span style="color:var(--text-secondary);">⚙️ 选项:</span> <span style="color:var(--text-primary);">${item.options}</span></div>` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    copy(text) {
        app.copyText(text);
    }
}