// Linux 常用指令集模块
class LinuxCmdModule {
    constructor() {
        this.title = 'Linux 指令集';
        this.commands = this.initCommands();
    }

    initCommands() {
        return [
            {
                category: '📁 文件与目录',
                items: [
                    { name: 'ls', desc: '列出目录内容', example: 'ls -la /home', syntax: 'ls [选项] [文件]', options: '-l 长格式, -a 显示隐藏, -h 人类可读, -t 按时间排序' },
                    { name: 'cd', desc: '切换目录', example: 'cd /var/log', syntax: 'cd [目录]', options: '.. 返回上级, ~ 到家目录, / 到根目录' },
                    { name: 'pwd', desc: '显示当前目录', example: 'pwd', syntax: 'pwd', options: '' },
                    { name: 'mkdir', desc: '创建目录', example: 'mkdir -p a/b/c', syntax: 'mkdir [选项] 目录', options: '-p 递归创建, -m 设置权限' },
                    { name: 'rm', desc: '删除文件或目录', example: 'rm -rf temp/', syntax: 'rm [选项] 文件', options: '-r 递归, -f 强制, -i 交互' },
                    { name: 'cp', desc: '复制文件或目录', example: 'cp -r src/ dest/', syntax: 'cp [选项] 源 目标', options: '-r 递归, -v 详细, -i 交互' },
                    { name: 'mv', desc: '移动或重命名', example: 'mv old.txt new.txt', syntax: 'mv 源 目标', options: '-i 交互, -f 强制, -v 详细' },
                    { name: 'touch', desc: '创建空文件或更新时间', example: 'touch newfile.txt', syntax: 'touch 文件', options: '' },
                    { name: 'find', desc: '查找文件', example: 'find / -name "*.log"', syntax: 'find [路径] [选项]', options: '-name 按名称, -type f/d, -size, -mtime' },
                    { name: 'chmod', desc: '修改文件权限', example: 'chmod 755 script.sh', syntax: 'chmod [模式] 文件', options: '644 文件, 755 可执行, -R 递归' },
                    { name: 'chown', desc: '修改文件所有者', example: 'chown user:group file', syntax: 'chown [用户[:组]] 文件', options: '-R 递归' },
                    { name: 'ln', desc: '创建链接', example: 'ln -s target link', syntax: 'ln [选项] 目标 链接', options: '-s 软链接, 无则硬链接' }
                ]
            },
            {
                category: '📄 文件内容查看',
                items: [
                    { name: 'cat', desc: '查看文件内容', example: 'cat file.txt', syntax: 'cat [选项] 文件', options: '-n 显示行号, -A 显示特殊字符' },
                    { name: 'more', desc: '分页查看', example: 'more largefile.log', syntax: 'more 文件', options: '空格翻页, q 退出, /搜索' },
                    { name: 'less', desc: '增强分页查看', example: 'less access.log', syntax: 'less 文件', options: 'G 末尾, g 开头, q 退出' },
                    { name: 'head', desc: '查看文件开头', example: 'head -n 20 file.txt', syntax: 'head [选项] 文件', options: '-n 行数, -c 字节数' },
                    { name: 'tail', desc: '查看文件末尾', example: 'tail -f access.log', syntax: 'tail [选项] 文件', options: '-n 行数, -f 实时跟踪' },
                    { name: 'grep', desc: '文本搜索', example: 'grep "error" log.txt', syntax: 'grep [选项] 模式 文件', options: '-i 忽略大小写, -r 递归, -n 行号, -v 反向' },
                    { name: 'wc', desc: '统计字数、行数', example: 'wc -l file.txt', syntax: 'wc [选项] 文件', options: '-l 行数, -w 单词, -c 字节' },
                    { name: 'sort', desc: '排序文件内容', example: 'sort names.txt', syntax: 'sort [选项] 文件', options: '-n 数字排序, -r 反向, -u 去重' },
                    { name: 'uniq', desc: '去重相邻行', example: 'sort list.txt | uniq', syntax: 'uniq [选项] 文件', options: '-c 计数, -d 仅重复, -u 仅唯一' },
                    { name: 'diff', desc: '比较两个文件差异', example: 'diff a.txt b.txt', syntax: 'diff [选项] 文件1 文件2', options: '-u unified, -N 空文件处理' }
                ]
            },
            {
                category: '🗜️ 压缩与归档',
                items: [
                    { name: 'tar', desc: '归档工具', example: 'tar -czvf pack.tar.gz files/', syntax: 'tar [选项] 文件', options: '-c 创建, -x 提取, -z gzip, -v 详细, -f 指定文件' },
                    { name: 'gzip', desc: 'Gzip 压缩', example: 'gzip file.txt', syntax: 'gzip [选项] 文件', options: '-d 解压, -9 最大压缩' },
                    { name: 'unzip', desc: '解压 ZIP', example: 'unzip archive.zip', syntax: 'unzip [选项] 文件.zip', options: '-d 目标目录, -l 列出内容' },
                    { name: 'zip', desc: '创建 ZIP', example: 'zip -r arc.zip folder/', syntax: 'zip [选项] 文件.zip 源', options: '-r 递归, -e 加密' },
                    { name: '7z', desc: '7-zip 压缩', example: '7z x file.7z', syntax: '7z [选项] 文件', options: 'x 解压, a 添加, -p 加密' }
                ]
            },
            {
                category: '🌐 网络相关',
                items: [
                    { name: 'ping', desc: '测试网络连通性', example: 'ping google.com', syntax: 'ping [选项] 主机', options: '-c 次数, -i 间隔, -t ttl' },
                    { name: 'curl', desc: '发送 HTTP 请求', example: 'curl https://api.example.com', syntax: 'curl [选项] URL', options: '-X 方法, -H 头, -d 数据, -o 保存, -I 仅头' },
                    { name: 'wget', desc: '下载文件', example: 'wget http://url.com/file.zip', syntax: 'wget [选项] URL', options: '-O 指定名, -c 断点续传, -r 递归' },
                    { name: 'ifconfig', desc: '查看网络接口', example: 'ifconfig eth0', syntax: 'ifconfig [接口]', options: 'eth0, lo, -a 所有' },
                    { name: 'ip', desc: '新一代网络工具', example: 'ip addr show', syntax: 'ip [选项] 对象 命令', options: 'addr 地址, route 路由, link 接口' },
                    { name: 'netstat', desc: '查看网络连接', example: 'netstat -tulnp', syntax: 'netstat [选项]', options: '-t TCP, -u UDP, -l 监听, -n 数字, -p 进程' },
                    { name: 'ss', desc: '查看套接字 (替代netstat)', example: 'ss -tulnp', syntax: 'ss [选项]', options: '-t TCP, -u UDP, -l 监听, -n 数字' },
                    { name: 'tcpdump', desc: '抓包工具', example: 'tcpdump -i any port 80', syntax: 'tcpdump [选项]', options: '-i 接口, -w 保存, -r 读取' },
                    { name: 'nslookup', desc: 'DNS 查询', example: 'nslookup example.com', syntax: 'nslookup [域名]', options: '' },
                    { name: 'traceroute', desc: '路由追踪', example: 'traceroute google.com', syntax: 'traceroute 主机', options: '-n 不解析' },
                    { name: 'nc', desc: 'Netcat 网络瑞士军刀', example: 'nc -zv host 80', syntax: 'nc [选项] 主机 端口', options: '-l 监听, -z 扫描, -v 详细' },
                    { name: 'scp', desc: '安全复制文件', example: 'scp file.txt user@host:/path/', syntax: 'scp [选项] 源 目标', options: '-r 递归, -P 端口' },
                    { name: 'ssh', desc: '远程登录', example: 'ssh user@host', syntax: 'ssh [选项] user@host', options: '-p 端口, -i 私钥, -L 端口转发' }
                ]
            },
            {
                category: '⚙️ 进程与服务',
                items: [
                    { name: 'ps', desc: '查看进程', example: 'ps aux | grep nginx', syntax: 'ps [选项]', options: 'aux 全用户, -ef 全格式' },
                    { name: 'top', desc: '实时进程监控', example: 'top', syntax: 'top [选项]', options: 'q 退出, k 杀进程, 1 显示各CPU' },
                    { name: 'htop', desc: '增强版 top', example: 'htop', syntax: 'htop [选项]', options: 'F5 树状, F9 杀进程' },
                    { name: 'kill', desc: '终止进程', example: 'kill -9 1234', syntax: 'kill [信号] PID', options: '-9 SIGKILL, -15 SIGTERM, -l 信号列表' },
                    { name: 'killall', desc: '按名称终止进程', example: 'killall nginx', syntax: 'killall 进程名', options: '-9 强制, -v 详细' },
                    { name: 'pkill', desc: '按模式终止进程', example: 'pkill -f "python script"', syntax: 'pkill 模式', options: '-f 匹配完整命令行' },
                    { name: 'systemctl', desc: '系统服务管理', example: 'systemctl status nginx', syntax: 'systemctl [命令] 服务', options: 'start/stop/restart/status/enable/disable' },
                    { name: 'service', desc: '旧版服务管理', example: 'service nginx restart', syntax: 'service 服务 命令', options: 'start/stop/restart/status' },
                    { name: 'nohup', desc: '后台运行不受断连影响', example: 'nohup ./script.sh &', syntax: 'nohup 命令 &', options: '输出到 nohup.out' },
                    { name: '&', desc: '后台运行命令', example: 'sleep 100 &', syntax: '命令 &', options: 'jobs 查看, fg 前台' },
                    { name: 'jobs', desc: '查看后台任务', example: 'jobs -l', syntax: 'jobs [选项]', options: '-l 显示PID, -r 仅运行, -s 仅停止' },
                    { name: 'fg', desc: '后台任务切前台', example: 'fg %1', syntax: 'fg [%作业号]', options: '' },
                    { name: 'bg', desc: '暂停任务继续后台', example: 'bg %1', syntax: 'bg [%作业号]', options: '' },
                    { name: 'nice', desc: '设置进程优先级', example: 'nice -n 10 command', syntax: 'nice [级别] 命令', options: '-20 最高, 19 最低' },
                    { name: 'renice', desc: '调整已有进程优先级', example: 'renice -5 -p 1234', syntax: 'renice 级别 -p PID', options: '' },
                    { name: 'pstree', desc: '进程树显示', example: 'pstree -p', syntax: 'pstree [选项]', options: '-p 显示PID, -u 用户' }
                ]
            },
            {
                category: '💾 磁盘与性能',
                items: [
                    { name: 'df', desc: '查看磁盘使用', example: 'df -h', syntax: 'df [选项]', options: '-h 人类可读, -T 显示类型' },
                    { name: 'du', desc: '查看目录大小', example: 'du -sh /var/log', syntax: 'du [选项] [目录]', options: '-s 汇总, -h 可读, -a 所有' },
                    { name: 'free', desc: '查看内存使用', example: 'free -h', syntax: 'free [选项]', options: '-h 可读, -m MB, -g GB' },
                    { name: 'vmstat', desc: '虚拟内存统计', example: 'vmstat 1 5', syntax: 'vmstat [延迟] [次数]', options: '' },
                    { name: 'iostat', desc: 'IO 统计', example: 'iostat -x 1', syntax: 'iostat [选项]', options: '-x 扩展, -d 仅磁盘' },
                    { name: 'top', desc: '实时资源监控', example: 'top -bn1 | head -20', syntax: 'top [选项]', options: '-b 批处理, -n 次数' },
                    { name: 'htop', desc: '增强版top', example: 'htop', syntax: 'htop', options: '' },
                    { name: 'iotop', desc: 'IO 实时监控', example: 'iotop -o', syntax: 'iotop [选项]', options: '-o 仅显示有IO的' },
                    { name: 'uptime', desc: '查看系统运行时间', example: 'uptime', syntax: 'uptime', options: '' },
                    { name: 'sar', desc: '系统活动报告', example: 'sar -u 1 3', syntax: 'sar [选项]', options: '-u CPU, -r 内存, -n 网络' },
                    { name: 'lsof', desc: '查看打开的文件', example: 'lsof -i :80', syntax: 'lsof [选项]', options: '-i 网络, -u 用户, -p PID' },
                    { name: 'mount', desc: '挂载文件系统', example: 'mount /dev/sdb1 /mnt', syntax: 'mount [选项] 设备 挂载点', options: '-a 全挂载, -t 类型' },
                    { name: 'umount', desc: '卸载文件系统', example: 'umount /mnt', syntax: 'umount 挂载点', options: '' },
                    { name: 'blkid', desc: '查看块设备信息', example: 'blkid /dev/sda1', syntax: 'blkid [设备]', options: '' },
                    { name: 'lsblk', desc: '列出块设备', example: 'lsblk', syntax: 'lsblk [选项]', options: '-f 显示文件系统' }
                ]
            },
            {
                category: '👥 用户与权限',
                items: [
                    { name: 'whoami', desc: '显示当前用户', example: 'whoami', syntax: 'whoami', options: '' },
                    { name: 'su', desc: '切换用户', example: 'su - root', syntax: 'su [选项] 用户', options: '- 登录shell, -c 执行命令' },
                    { name: 'sudo', desc: '以root执行', example: 'sudo apt update', syntax: 'sudo 命令', options: '-u 指定用户, -i 登录' },
                    { name: 'useradd', desc: '添加用户', example: 'useradd -m newuser', syntax: 'useradd [选项] 用户', options: '-m 创建家目录, -s 指定shell' },
                    { name: 'userdel', desc: '删除用户', example: 'userdel -r username', syntax: 'userdel [选项] 用户', options: '-r 删除家目录' },
                    { name: 'passwd', desc: '修改密码', example: 'passwd username', syntax: 'passwd [用户]', options: '' },
                    { name: 'groupadd', desc: '添加组', example: 'groupadd devops', syntax: 'groupadd 组名', options: '' },
                    { name: 'usermod', desc: '修改用户属性', example: 'usermod -aG docker user', syntax: 'usermod [选项] 用户', options: '-aG 添加到组, -s shell' },
                    { name: 'id', desc: '查看用户ID信息', example: 'id username', syntax: 'id [用户]', options: '' },
                    { name: 'groups', desc: '查看用户所属组', example: 'groups username', syntax: 'groups [用户]', options: '' },
                    { name: 'chmod', desc: '修改权限', example: 'chmod 755 file.sh', syntax: 'chmod 模式 文件', options: 'u+x, g-w, o+r, 755, 644' },
                    { name: 'chown', desc: '修改所有者', example: 'chown -R user:grp /dir', syntax: 'chown 用户[:组] 文件', options: '-R 递归' },
                    { name: 'chgrp', desc: '修改组', example: 'chgrp -R team /dir', syntax: 'chgrp 组 文件', options: '-R 递归' },
                    { name: 'umask', desc: '设置默认权限掩码', example: 'umask 022', syntax: 'umask [掩码]', options: '022 默认755, 077 默认700' },
                    { name: 'visudo', desc: '编辑sudo配置', example: 'visudo', syntax: 'visudo', options: '安全编辑/etc/sudoers' }
                ]
            },
            {
                category: '📦 包管理',
                items: [
                    { name: 'apt (Debian/Ubuntu)', desc: 'Debian 系包管理', example: 'apt update && apt install nginx', syntax: 'apt 命令 [包]', options: 'update/upgrade/install/remove/search' },
                    { name: 'apt-get', desc: '老版本 apt', example: 'apt-get install vim', syntax: 'apt-get 命令 [包]', options: '同apt' },
                    { name: 'yum (CentOS/RHEL)', desc: 'RedHat 系包管理', example: 'yum install nginx', syntax: 'yum 命令 [包]', options: 'install/remove/list/info' },
                    { name: 'dnf', desc: '新一代 yum', example: 'dnf update', syntax: 'dnf 命令 [包]', options: '同yum' },
                    { name: 'pacman (Arch)', desc: 'Arch Linux 包管理', example: 'pacman -S vim', syntax: 'pacman [选项]', options: '-S 安装, -R 移除, -Syu 全更新' },
                    { name: 'dnf5', desc: '最新包管理', example: 'dnf5 install httpd', syntax: 'dnf5 命令 [包]', options: '' },
                    { name: 'rpm', desc: 'RPM 包管理', example: 'rpm -ivh pkg.rpm', syntax: 'rpm [选项]', options: '-i 安装, -e 移除, -qa 所有' },
                    { name: 'dpkg', desc: 'Debian 包管理', example: 'dpkg -i pkg.deb', syntax: 'dpkg [选项]', options: '-i 安装, -r 移除, -l 列出' },
                    { name: 'snap', desc: 'Ubuntu 包管理', example: 'snap install code', syntax: 'snap 命令', options: 'install/remove/list' },
                    { name: 'brew (Mac)', desc: 'Homebrew 包管理', example: 'brew install node', syntax: 'brew 命令', options: 'install/remove/list/info/update' }
                ]
            },
            {
                category: '🔐 系统与安全',
                items: [
                    { name: 'uname', desc: '查看系统信息', example: 'uname -a', syntax: 'uname [选项]', options: '-a 全部, -r 内核, -m 架构' },
                    { name: 'hostname', desc: '查看主机名', example: 'hostname', syntax: 'hostname', options: '' },
                    { name: 'cat /etc/os-release', desc: '查看发行版信息', example: 'cat /etc/os-release', syntax: '', options: '' },
                    { name: 'dmesg', desc: '查看内核消息', example: 'dmesg | tail -20', syntax: 'dmesg [选项]', options: '-T 人类可读时间' },
                    { name: 'journalctl', desc: '查看systemd日志', example: 'journalctl -u nginx -f', syntax: 'journalctl [选项]', options: '-u 服务, -f 跟踪, -xe 错误' },
                    { name: 'date', desc: '查看/设置时间', example: 'date -s "2025-06-17 10:00:00"', syntax: 'date [选项]', options: '-s 设置, +%F 日期, +%T 时间' },
                    { name: 'timedatectl', desc: '时区管理', example: 'timedatectl set-timezone Asia/Shanghai', syntax: 'timedatectl 命令', options: 'status/set-timezone/list-timezones' },
                    { name: 'history', desc: '命令历史', example: 'history | grep curl', syntax: 'history [选项]', options: '-c 清除, -w 保存, !n 执行第n条' },
                    { name: 'cron', desc: '定时任务', example: 'crontab -e', syntax: 'crontab [选项]', options: '-e 编辑, -l 查看, -r 删除' },
                    { name: 'systemctl', desc: '系统服务', example: 'systemctl list-units --type=service', syntax: 'systemctl [命令]', options: 'status/start/stop/enable/disable/daemon-reload' },
                    { name: 'firewall-cmd', desc: '防火墙管理', example: 'firewall-cmd --add-port=8080/tcp --permanent', syntax: 'firewall-cmd [选项]', options: '--permanent, --list-all, --reload' },
                    { name: 'ufw', desc: '简化防火墙', example: 'ufw allow 22/tcp', syntax: 'ufw 命令', options: 'allow/deny/limit/enable/disable/status' },
                    { name: 'iptables', desc: 'iptables 防火墙', example: 'iptables -L -n', syntax: 'iptables [选项]', options: '-L 列表, -A 添加, -D 删除' },
                    { name: 'selinux', desc: 'SELinux 管理', example: 'getenforce', syntax: 'getenforce/setenforce', options: '0 宽容, 1 强制' },
                    { name: 'auditd', desc: '审计日志', example: 'auditctl -l', syntax: 'auditctl [选项]', options: '-l 列表, -a 添加规则' },
                    { name: 'getent', desc: '查询名称服务', example: 'getent passwd root', syntax: 'getent 数据库 键', options: 'passwd, group, hosts, services' }
                ]
            },
            {
                category: '🛠️ 实用文本与其他',
                items: [
                    { name: 'sed', desc: '流编辑器', example: "sed 's/old/new/g' file.txt", syntax: 'sed [选项] 脚本 文件', options: '-i 就地编辑, -n 静默, s///替换' },
                    { name: 'awk', desc: '文本处理', example: "awk '{print $1}' file.txt", syntax: 'awk 程序 文件', options: '-F 分隔符, $0 整行, $1 第一列' },
                    { name: 'cut', desc: '截取文本列', example: "cut -d',' -f1 file.csv", syntax: 'cut [选项] 文件', options: '-d 分隔符, -f 字段, -c 字符' },
                    { name: 'tr', desc: '字符转换/删除', example: "tr 'a-z' 'A-Z' < file", syntax: 'tr [选项] 源集 目标集', options: '-d 删除, -s 压缩' },
                    { name: 'paste', desc: '合并文件列', example: 'paste a.txt b.txt', syntax: 'paste 文件1 文件2', options: '-d 自定义分隔符' },
                    { name: 'join', desc: '按字段合并', example: 'join a.txt b.txt', syntax: 'join [选项] 文件1 文件2', options: '-1 指定字段, -2 指定字段' },
                    { name: 'tee', desc: '同时输出到屏幕和文件', example: 'ls | tee out.txt', syntax: 'tee [选项] 文件', options: '-a 追加, -i 忽略中断' },
                    { name: 'xargs', desc: '参数传递', example: 'find . -name "*.log" | xargs rm', syntax: 'xargs [选项] 命令', options: '-n 每批数量, -I {} 占位' },
                    { name: 'date', desc: '日期时间', example: 'date +%Y-%m-%d_%H:%M:%S', syntax: 'date +格式', options: '%Y 年, %m 月, %d 日, %H 时, %M 分, %S 秒' },
                    { name: 'sleep', desc: '延时', example: 'sleep 5', syntax: 'sleep 秒数', options: 's 秒, m 分, h 时' },
                    { name: 'echo', desc: '输出文本', example: 'echo "Hello $USER"', syntax: 'echo [选项] 文本', options: '-n 不换行, -e 解析转义' },
                    { name: 'printf', desc: '格式化输出', example: "printf 'name: %s\\n' 'Alice'", syntax: 'printf 格式 参数', options: '%s 字符串, %d 数字, %f 浮点' },
                    { name: 'yes', desc: '反复输出字符串', example: 'yes | command', syntax: 'yes [文本]', options: '' },
                    { name: 'which', desc: '查找命令位置', example: 'which python3', syntax: 'which 命令', options: '' },
                    { name: 'whereis', desc: '查找二进制/源码/手册', example: 'whereis nginx', syntax: 'whereis 命令', options: '' },
                    { name: 'alias', desc: '设置别名', example: "alias ll='ls -la'", syntax: 'alias 名=命令', options: '存到 ~/.bashrc 永久' },
                    { name: 'source', desc: '执行脚本到当前shell', example: 'source ~/.bashrc', syntax: 'source 文件', options: '或使用 . 文件名' },
                    { name: 'env', desc: '查看/设置环境变量', example: 'env | grep PATH', syntax: 'env [变量=值] 命令', options: '' },
                    { name: 'export', desc: '导出环境变量', example: 'export PATH=$PATH:/opt/bin', syntax: 'export 变量=值', options: '' }
                ]
            }
        ];
    }

    render(container) {
        container.innerHTML = `
            <div style="display:grid;gap:16px;">
                <div style="padding:12px;background:var(--bg-card);border-radius:8px;">
                    <input type="text" id="cmd-search" placeholder="🔍 搜索指令名称或关键词..." style="width:100%;padding:10px 14px;background:var(--bg-sidebar);border:1px solid var(--border);border-radius:6px;color:var(--text-primary);font-size:14px;">
                </div>
                <div id="cmd-list" style="display:grid;gap:16px;"></div>
            </div>
        `;

        setTimeout(() => {
            this.renderList('');
            const searchEl = document.getElementById('cmd-search');
            if (searchEl) {
                searchEl.addEventListener('input', (e) => {
                    this.renderList(e.target.value.toLowerCase());
                });
                searchEl.focus();
            }
        }, 100);
    }

    renderList(keyword) {
        const listEl = document.getElementById('cmd-list');
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
        const id = `cmd-${catIdx}-${itemIdx}`;
        return `
            <div style="padding:10px 12px;background:var(--bg-sidebar);border-radius:6px;cursor:pointer;" onclick="(function(){var d=document.getElementById('${id}-detail');d.style.display=d.style.display==='none'?'block':'none';})()">
                <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;">
                    <div style="display:flex;align-items:center;gap:10px;flex:1;min-width:0;">
                        <code style="color:var(--success);font-size:14px;font-weight:600;white-space:nowrap;">${item.name}</code>
                        <span style="color:var(--text-secondary);font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${item.desc}</span>
                    </div>
                    <button class="btn btn-secondary" onclick="event.stopPropagation();app.modules.linuxcmd.copy('${item.example.replace(/'/g, "\\'")}')" style="padding:3px 10px;font-size:11px;">复制示例</button>
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
