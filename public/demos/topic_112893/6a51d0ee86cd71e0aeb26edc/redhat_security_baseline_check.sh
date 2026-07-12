#!/bin/bash
#==============================================================================
# 脚本名称: redhat_security_baseline_check.sh
# 功能描述: RedHat/CentOS/RHEL 系统安全基线检测脚本
# 适用系统: RHEL 7/8/9, CentOS 7/8, Rocky Linux, AlmaLinux
# 使用方法: chmod +x redhat_security_baseline_check.sh && ./redhat_security_baseline_check.sh
# 输出说明: [PASS] 合规  [FAIL] 不合规  [WARN] 需关注  [INFO] 信息提示
#==============================================================================

#---------------------- 全局变量与初始化 ----------------------
readonly SCRIPT_VERSION="1.0"
readonly REPORT_DIR="/tmp/security_report_$$"
readonly REPORT_FILE="${REPORT_DIR}/security_baseline_report.txt"

PASS_COUNT=0
FAIL_COUNT=0
WARN_COUNT=0
INFO_COUNT=0

# 检测是否为 root 用户
if [ "$(id -u)" -ne 0 ]; then
    echo "[错误] 本脚本需要 root 权限运行,请使用 sudo 或切换到 root 用户。"
    exit 1
fi

# 创建报告目录
mkdir -p "${REPORT_DIR}"

#---------------------- 输出与统计函数 ----------------------
# 统一输出格式并记录到报告文件
log_result() {
    local status="$1"
    local check_item="$2"
    local detail="$3"
    local line

    case "${status}" in
        PASS) PASS_COUNT=$((PASS_COUNT + 1)); line="$(printf '[\033[32mPASS\033[0m] %-40s %s' "${check_item}" "${detail}")" ;;
        FAIL) FAIL_COUNT=$((FAIL_COUNT + 1)); line="$(printf '[\033[31mFAIL\033[0m] %-40s %s' "${check_item}" "${detail}")" ;;
        WARN) WARN_COUNT=$((WARN_COUNT + 1)); line="$(printf '[\033[33mWARN\033[0m] %-40s %s' "${check_item}" "${detail}")" ;;
        INFO) INFO_COUNT=$((INFO_COUNT + 1)); line="$(printf '[\033[36mINFO\033[0m] %-40s %s' "${check_item}" "${detail}")" ;;
        *)    line="$(printf '[    ] %-40s %s' "${check_item}" "${detail}")" ;;
    esac

    echo -e "${line}"
    # 写入文件时去除颜色码
    echo "${line}" | sed 's/\x1b\[[0-9;]*m//g' >> "${REPORT_FILE}"
}

# 分节标题
print_section() {
    local title="$1"
    echo ""
    echo "================================================================"
    echo "  ${title}"
    echo "================================================================"
    echo "" >> "${REPORT_FILE}"
    echo "================================================================" >> "${REPORT_FILE}"
    echo "  ${title}" >> "${REPORT_FILE}"
    echo "================================================================" >> "${REPORT_FILE}"
}

#---------------------- 1. 系统信息采集 ----------------------
print_section "1. 系统信息"

OS_RELEASE=$(cat /etc/redhat-release 2>/dev/null || cat /etc/os-release 2>/dev/null | grep PRETTY_NAME | cut -d= -f2 | tr -d '"')
KERNEL_VERSION=$(uname -r)
HOSTNAME=$(hostname)
IP_ADDR=$(hostname -I 2>/dev/null | awk '{print $1}')
CURRENT_TIME=$(date "+%Y-%m-%d %H:%M:%S")

log_result INFO "操作系统" "${OS_RELEASE}"
log_result INFO "内核版本" "${KERNEL_VERSION}"
log_result INFO "主机名"   "${HOSTNAME}"
log_result INFO "IP地址"   "${IP_ADDR:-未获取}"
log_result INFO "检测时间" "${CURRENT_TIME}"
log_result INFO "脚本版本" "v${SCRIPT_VERSION}"

#---------------------- 2. 用户与账户安全 ----------------------
print_section "2. 用户与账户安全"

# 2.1 检查空密码账户
EMPTY_PW_USERS=$(awk -F: '($2 == "" || $2 == "!") {print $1}' /etc/shadow 2>/dev/null)
if [ -z "${EMPTY_PW_USERS}" ]; then
    log_result PASS "空密码账户检查" "未发现空密码账户"
else
    log_result FAIL "空密码账户检查" "存在空密码账户: ${EMPTY_PW_USERS}"
fi

# 2.2 检查 UID 为 0 的账户(除 root)
ROOT_UID_USERS=$(awk -F: '($3 == 0) {print $1}' /etc/passwd | grep -v "^root$")
if [ -z "${ROOT_UID_USERS}" ]; then
    log_result PASS "UID为0账户检查" "仅 root 用户 UID 为 0"
else
    log_result FAIL "UID为0账户检查" "存在其他 UID=0 账户: ${ROOT_UID_USERS}"
fi

# 2.3 检查密码最小长度
PASS_MIN_LEN=$(awk -F: '($1 == "PASS_MIN_LEN") {print $2}' /etc/login.defs 2>/dev/null | tr -d ' ' | tail -1)
if [ -n "${PASS_MIN_LEN}" ] && [ "${PASS_MIN_LEN}" -ge 8 ]; then
    log_result PASS "密码最小长度" "PASS_MIN_LEN=${PASS_MIN_LEN} (要求>=8)"
else
    log_result FAIL "密码最小长度" "当前=${PASS_MIN_LEN:-未设置}, 建议>=8"
fi

# 2.4 检查密码最长有效期
PASS_MAX_DAYS=$(awk -F: '($1 == "PASS_MAX_DAYS") {print $2}' /etc/login.defs 2>/dev/null | tr -d ' ' | tail -1)
if [ -n "${PASS_MAX_DAYS}" ] && [ "${PASS_MAX_DAYS}" -le 90 ]; then
    log_result PASS "密码最长有效期" "PASS_MAX_DAYS=${PASS_MAX_DAYS} (要求<=90)"
else
    log_result FAIL "密码最长有效期" "当前=${PASS_MAX_DAYS:-未设置}, 建议<=90"
fi

# 2.5 检查密码最短使用期限
PASS_MIN_DAYS=$(awk -F: '($1 == "PASS_MIN_DAYS") {print $2}' /etc/login.defs 2>/dev/null | tr -d ' ' | tail -1)
if [ -n "${PASS_MIN_DAYS}" ] && [ "${PASS_MIN_DAYS}" -ge 1 ]; then
    log_result PASS "密码最短使用期" "PASS_MIN_DAYS=${PASS_MIN_DAYS} (要求>=1)"
else
    log_result WARN "密码最短使用期" "当前=${PASS_MIN_DAYS:-未设置}, 建议>=1"
fi

# 2.6 检查密码过期警告天数
PASS_WARN_AGE=$(awk -F: '($1 == "PASS_WARN_AGE") {print $2}' /etc/login.defs 2>/dev/null | tr -d ' ' | tail -1)
if [ -n "${PASS_WARN_AGE}" ] && [ "${PASS_WARN_AGE}" -ge 7 ]; then
    log_result PASS "密码过期警告" "PASS_WARN_AGE=${PASS_WARN_AGE} (要求>=7)"
else
    log_result WARN "密码过期警告" "当前=${PASS_WARN_AGE:-未设置}, 建议>=7"
fi

# 2.7 检查账户锁定策略 (pam_faillock / pam_tally2)
if grep -Eq "pam_faillock" /etc/pam.d/system-auth /etc/pam.d/password-auth 2>/dev/null; then
    log_result PASS "账户锁定策略" "已配置 pam_faillock 模块"
elif grep -Eq "pam_tally2" /etc/pam.d/system-auth /etc/pam.d/password-auth 2>/dev/null; then
    log_result PASS "账户锁定策略" "已配置 pam_tally2 模块"
else
    log_result FAIL "账户锁定策略" "未配置账户锁定策略,建议启用 pam_faillock"
fi

# 2.8 检查密码复杂度策略
if grep -Eq "pam_pwquality|pam_cracklib" /etc/pam.d/system-auth 2>/dev/null; then
    log_result PASS "密码复杂度策略" "已配置密码复杂度模块"
else
    log_result FAIL "密码复杂度策略" "未配置 pam_pwquality,建议设置密码复杂度"
fi

# 2.9 检查默认账户是否存在危险账户
DANGER_USERS=""
for u in lp sync shutdown halt news uucp operator games gopher ftp; do
    if id "${u}" >/dev/null 2>&1; then
        # 检查该账户是否有有效 shell
        shell=$(awk -F: -v user="${u}" '($1==user){print $7}' /etc/passwd)
        if [ -n "${shell}" ] && [ "${shell}" != "/sbin/nologin" ] && [ "${shell}" != "/bin/false" ]; then
            DANGER_USERS="${DANGER_USERS} ${u}"
        fi
    fi
done
if [ -z "${DANGER_USERS}" ]; then
    log_result PASS "危险默认账户" "无异常默认账户"
else
    log_result WARN "危险默认账户" "存在可用 shell 的默认账户:${DANGER_USERS}"
fi

# 2.10 检查 root 直接远程登录(在 SSH 部分统一处理)

# 2.11 检查历史命令记录条数
HISTSIZE=$(awk -F= '($1 == "HISTSIZE") {print $2}' /etc/profile 2>/dev/null | tr -d ' ' | tail -1)
if [ -n "${HISTSIZE}" ] && [ "${HISTSIZE}" -le 1000 ]; then
    log_result PASS "历史命令条数" "HISTSIZE=${HISTSIZE}"
else
    log_result WARN "历史命令条数" "当前=${HISTSIZE:-未设置}, 建议<=1000"
fi

# 2.12 检查是否记录历史命令时间戳
if grep -Eq "HISTTIMEFORMAT" /etc/profile /etc/bashrc 2>/dev/null; then
    log_result PASS "历史命令时间戳" "已配置 HISTTIMEFORMAT"
else
    log_result WARN "历史命令时间戳" "未配置 HISTTIMEFORMAT,建议记录时间戳"
fi

#---------------------- 3. 文件与权限安全 ----------------------
print_section "3. 文件与权限安全"

# 3.1 检查关键文件权限
check_file_perm() {
    local file="$1"
    local expect_perm="$2"
    local desc="$3"
    local actual_perm

    if [ -e "${file}" ]; then
        actual_perm=$(stat -c "%a" "${file}")
        if [ "${actual_perm}" = "${expect_perm}" ]; then
            log_result PASS "${desc}" "${file} 权限=${actual_perm}"
        else
            log_result FAIL "${desc}" "${file} 权限=${actual_perm}, 应为 ${expect_perm}"
        fi
    fi
}

check_file_perm "/etc/passwd" "644" "/etc/passwd 权限"
check_file_perm "/etc/shadow" "000" "/etc/shadow 权限"
check_file_perm "/etc/group"  "644" "/etc/group 权限"
check_file_perm "/etc/gshadow" "000" "/etc/gshadow 权限"
check_file_perm "/etc/hosts"  "644" "/etc/hosts 权限"
check_file_perm "/etc/sysctl.conf" "644" "/etc/sysctl.conf 权限"

# 3.2 检查 /etc/passwd 中是否存在 UID 重复
DUP_UID=$(awk -F: '{print $3}' /etc/passwd | sort | uniq -d)
if [ -z "${DUP_UID}" ]; then
    log_result PASS "UID重复检查" "无重复 UID"
else
    log_result FAIL "UID重复检查" "存在重复 UID: ${DUP_UID}"
fi

# 3.3 检查关键目录的粘滞位
for dir in /tmp /var/tmp; do
    if [ -d "${dir}" ]; then
        perm=$(stat -c "%a" "${dir}")
        if [ "${perm}" = "1777" ]; then
            log_result PASS "粘滞位检查" "${dir} 权限=${perm}"
        else
            log_result FAIL "粘滞位检查" "${dir} 权限=${perm}, 应为 1777"
        fi
    fi
done

# 3.4 检查是否存在可疑 SUID 文件(非标准)
STANDARD_SUID="/bin/su|/bin/ping|/bin/mount|/bin/umount|/usr/bin/sudo|/usr/bin/passwd|/usr/bin/chsh|/usr/bin/chfn|/usr/bin/newgrp|/usr/bin/gpasswd|/usr/libexec/dbus-1/dbus-daemon-launch-helper|/usr/sbin/pam_timestamp_check|/usr/sbin/unix_chkpwd|/usr/sbin/userhelper|/usr/sbin/usernetctl"
SUSPICIOUS_SUID=$(find / -xdev -type f -perm -4000 2>/dev/null | grep -Ev "${STANDARD_SUID}")
if [ -z "${SUSPICIOUS_SUID}" ]; then
    log_result PASS "SUID文件检查" "无非标准 SUID 文件"
else
    log_result WARN "SUID文件检查" "发现非标准 SUID 文件,请人工核查"
    echo "${SUSPICIOUS_SUID}" | sed 's/^/        -> /' >> "${REPORT_FILE}"
fi

# 3.5 检查是否存在可疑 SGID 文件
SGID_FILES=$(find / -xdev -type f -perm -2000 2>/dev/null)
SGID_COUNT=$(echo "${SGID_FILES}" | grep -c .)
log_result INFO "SGID文件检查" "发现 ${SGID_COUNT} 个 SGID 文件(详见报告)"

# 3.6 检查任何人可写目录(无粘滞位)
WORLD_WRITABLE=$(find / -xdev -type d -perm -0002 ! -perm -1000 2>/dev/null | head -20)
if [ -z "${WORLD_WRITABLE}" ]; then
    log_result PASS "可写目录检查" "无异常可写目录"
else
    log_result WARN "可写目录检查" "发现无粘滞位可写目录,请人工核查"
fi

# 3.7 检查 .rhosts 和 hosts.equiv 文件
RHOSTS_FILES=$(find / -name ".rhosts" -o -name "hosts.equiv" 2>/dev/null)
if [ -z "${RHOSTS_FILES}" ]; then
    log_result PASS "rhosts文件检查" "未发现 .rhosts / hosts.equiv"
else
    log_result FAIL "rhosts文件检查" "存在不安全文件: ${RHOSTS_FILES}"
fi

# 3.8 检查 root 家目录权限
ROOT_HOME_PERM=$(stat -c "%a" /root 2>/dev/null)
if [ "${ROOT_HOME_PERM}" = "700" ]; then
    log_result PASS "root家目录权限" "/root 权限=700"
else
    log_result FAIL "root家目录权限" "/root 权限=${ROOT_HOME_PERM}, 应为 700"
fi

#---------------------- 4. SSH 服务安全 ----------------------
print_section "4. SSH 服务安全"

SSHD_CONFIG="/etc/ssh/sshd_config"

# 4.1 检查 SSH 协议版本
SSH_PROTOCOL=$(awk -F' ' 'tolower($1)=="protocol" {print $2; exit}' "${SSHD_CONFIG}" 2>/dev/null)
if [ -z "${SSH_PROTOCOL}" ] || [ "${SSH_PROTOCOL}" = "2" ]; then
    log_result PASS "SSH协议版本" "使用协议版本 2"
else
    log_result FAIL "SSH协议版本" "当前=${SSH_PROTOCOL}, 应为 2"
fi

# 4.2 检查是否禁止 root 直接登录
PERMIT_ROOT=$(awk -F' ' 'tolower($1)=="permitrootlogin" {print $2; exit}' "${SSHD_CONFIG}" 2>/dev/null)
if [ "${PERMIT_ROOT}" = "no" ]; then
    log_result PASS "禁止root登录" "PermitRootLogin=no"
else
    log_result FAIL "禁止root登录" "当前=${PERMIT_ROOT:-默认yes}, 应设为 no"
fi

# 4.3 检查是否禁止空密码登录
PERMIT_EMPTY=$(awk -F' ' 'tolower($1)=="permitemptypasswords" {print $2; exit}' "${SSHD_CONFIG}" 2>/dev/null)
if [ "${PERMIT_EMPTY}" = "no" ]; then
    log_result PASS "禁止空密码登录" "PermitEmptyPasswords=no"
else
    log_result FAIL "禁止空密码登录" "当前=${PERMIT_EMPTY:-默认no}, 应设为 no"
fi

# 4.4 检查 MaxAuthTries
MAX_AUTH_TRIES=$(awk -F' ' 'tolower($1)=="maxauthtries" {print $2; exit}' "${SSHD_CONFIG}" 2>/dev/null)
if [ -n "${MAX_AUTH_TRIES}" ] && [ "${MAX_AUTH_TRIES}" -le 4 ]; then
    log_result PASS "SSH认证次数" "MaxAuthTries=${MAX_AUTH_TRIES} (要求<=4)"
else
    log_result FAIL "SSH认证次数" "当前=${MAX_AUTH_TRIES:-6}, 应<=4"
fi

# 4.5 检查 X11 转发
X11_FORWARD=$(awk -F' ' 'tolower($1)=="x11forwarding" {print $2; exit}' "${SSHD_CONFIG}" 2>/dev/null)
if [ "${X11_FORWARD}" = "no" ]; then
    log_result PASS "X11转发" "X11Forwarding=no"
else
    log_result WARN "X11转发" "当前=${X11_FORWARD:-默认yes}, 建议设为 no"
fi

# 4.6 检查是否禁用 DNS 反向解析
USE_DNS=$(awk -F' ' 'tolower($1)=="usedns" {print $2; exit}' "${SSHD_CONFIG}" 2>/dev/null)
if [ "${USE_DNS}" = "no" ]; then
    log_result PASS "SSH反向DNS" "UseDNS=no"
else
    log_result WARN "SSH反向DNS" "当前=${USE_DNS:-默认yes}, 建议设为 no"
fi

# 4.7 检查登录超时 (ClientAliveInterval / ClientAliveCountMax)
CLIENT_ALIVE_INT=$(awk -F' ' 'tolower($1)=="clientaliveinterval" {print $2; exit}' "${SSHD_CONFIG}" 2>/dev/null)
if [ -n "${CLIENT_ALIVE_INT}" ] && [ "${CLIENT_ALIVE_INT}" -le 600 ]; then
    log_result PASS "SSH登录超时" "ClientAliveInterval=${CLIENT_ALIVE_INT}"
else
    log_result WARN "SSH登录超时" "当前=${CLIENT_ALIVE_INT:-未设置}, 建议<=600"
fi

# 4.8 检查是否限制 SSH 访问用户
ALLOW_USERS=$(awk -F' ' 'tolower($1)=="allowusers" {$1=""; print; exit}' "${SSHD_CONFIG}" 2>/dev/null)
ALLOW_GROUPS=$(awk -F' ' 'tolower($1)=="allowgroups" {$1=""; print; exit}' "${SSHD_CONFIG}" 2>/dev/null)
if [ -n "${ALLOW_USERS}" ] || [ -n "${ALLOW_GROUPS}" ]; then
    log_result PASS "SSH访问限制" "已限制可登录用户/组"
else
    log_result WARN "SSH访问限制" "未限制可登录用户,建议配置 AllowUsers/AllowGroups"
fi

# 4.9 检查是否禁用不安全的认证方式
RSA_AUTH=$(awk -F' ' 'tolower($1)=="rsaauthentication" {print $2; exit}' "${SSHD_CONFIG}" 2>/dev/null)
PUBKEY_AUTH=$(awk -F' ' 'tolower($1)=="pubkeyauthentication" {print $2; exit}' "${SSHD_CONFIG}" 2>/dev/null)
if [ "${PUBKEY_AUTH}" = "yes" ] || [ -z "${PUBKEY_AUTH}" ]; then
    log_result PASS "公钥认证" "PubkeyAuthentication=yes (默认)"
else
    log_result WARN "公钥认证" "PubkeyAuthentication=${PUBKEY_AUTH}, 建议启用"
fi

# 4.10 检查 SSH 默认端口
SSH_PORT=$(awk -F' ' 'tolower($1)=="port" {print $2; exit}' "${SSHD_CONFIG}" 2>/dev/null)
if [ -z "${SSH_PORT}" ]; then
    log_result WARN "SSH端口" "使用默认端口 22,建议修改"
else
    log_result PASS "SSH端口" "Port=${SSH_PORT}"
fi

# 4.11 检查 sshd 配置文件权限
SSHD_PERM=$(stat -c "%a" "${SSHD_CONFIG}" 2>/dev/null)
if [ "${SSHD_PERM}" = "600" ] || [ "${SSHD_PERM}" = "644" ]; then
    log_result PASS "sshd配置文件权限" "${SSHD_CONFIG} 权限=${SSHD_PERM}"
else
    log_result FAIL "sshd配置文件权限" "权限=${SSHD_PERM}, 应为 600/644"
fi

#---------------------- 5. 服务与进程安全 ----------------------
print_section "5. 服务与进程安全"

# 检测 systemd 还是 sysvinit
if command -v systemctl >/dev/null 2>&1; then
    SVC_CMD="systemctl is-enabled"
    SVC_ACTIVE="systemctl is-active"
else
    SVC_CMD="chkconfig --list 2>/dev/null | grep"
    SVC_ACTIVE="service"
fi

# 5.1 检查危险服务是否启用 (telnet, rsh, rlogin, rexec, talk, tftp, chargen, daytime, discard, echo, time)
DANGER_SERVICES="telnet.socket telnet rsh.socket rlogin.socket rexec.socket talk.socket tftp.socket chargen-dgram chargen-stream daytime-dgram daytime-stream discard-dgram discard-stream echo-dgram echo-stream time-dgram time-stream"
DANGER_RUNNING=""
for svc in ${DANGER_SERVICES}; do
    if systemctl is-enabled "${svc}" >/dev/null 2>&1; then
        DANGER_RUNNING="${DANGER_RUNNING} ${svc}"
    fi
done
if [ -z "${DANGER_RUNNING}" ]; then
    log_result PASS "危险服务检查" "未启用 telnet/rsh/tftp 等危险服务"
else
    log_result FAIL "危险服务检查" "已启用危险服务:${DANGER_RUNNING}"
fi

# 5.2 检查 xinetd 服务
if [ -f /etc/xinetd.d ]; then
    XINETD_ENABLED=$(grep -r "disable.*=.*no" /etc/xinetd.d/ 2>/dev/null)
    if [ -z "${XINETD_ENABLED}" ]; then
        log_result PASS "xinetd服务检查" "xinetd 下无启用服务"
    else
        log_result WARN "xinetd服务检查" "xinetd 下存在启用服务,请核查"
    fi
fi

# 5.3 检查 avahi-daemon / cups / dhcp 等非必要服务
NONESSENTIAL_SERVICES="avahi-daemon cups dhcpd smb nfs-server rpcbind vsftpd named httpd dovecot postfix"
for svc in ${NONESSENTIAL_SERVICES}; do
    if systemctl is-active "${svc}" >/dev/null 2>&1; then
        log_result WARN "非必要服务" "${svc} 正在运行,请确认是否需要"
    fi
done

# 5.4 检查防火墙状态 (firewalld 或 iptables)
if systemctl is-active firewalld >/dev/null 2>&1; then
    log_result PASS "防火墙状态" "firewalld 已启用"
elif systemctl is-active iptables >/dev/null 2>&1 || systemctl is-active nftables >/dev/null 2>&1; then
    log_result PASS "防火墙状态" "iptables/nftables 已启用"
else
    log_result FAIL "防火墙状态" "未启用任何防火墙,建议启用 firewalld"
fi

# 5.5 检查 SELinux 状态
SELINUX_STATUS=$(getenforce 2>/dev/null)
if [ "${SELINUX_STATUS}" = "Enforcing" ]; then
    log_result PASS "SELinux状态" "Enforcing"
elif [ "${SELINUX_STATUS}" = "Permissive" ]; then
    log_result WARN "SELinux状态" "Permissive,建议设为 Enforcing"
else
    log_result WARN "SELinux状态" "Disabled,建议启用 SELinux"
fi

#---------------------- 6. 网络与内核参数 ----------------------
print_section "6. 网络与内核参数"

# 6.1 检查 IP 转发
IP_FORWARD=$(sysctl -n net.ipv4.ip_forward 2>/dev/null)
if [ "${IP_FORWARD}" = "0" ]; then
    log_result PASS "IP转发" "net.ipv4.ip_forward=0"
else
    log_result WARN "IP转发" "net.ipv4.ip_forward=${IP_FORWARD}, 非路由器应为 0"
fi

# 6.2 检查 SYN Cookie
SYN_COOKIES=$(sysctl -n net.ipv4.tcp_syncookies 2>/dev/null)
if [ "${SYN_COOKIES}" = "1" ]; then
    log_result PASS "SYN Cookie" "net.ipv4.tcp_syncookies=1"
else
    log_result FAIL "SYN Cookie" "net.ipv4.tcp_syncookies=${SYN_COOKIES}, 应为 1"
fi

# 6.3 检查 ICMP 重定向接受
ICMP_REDIRECT=$(sysctl -n net.ipv4.conf.all.accept_redirects 2>/dev/null)
if [ "${ICMP_REDIRECT}" = "0" ]; then
    log_result PASS "ICMP重定向" "accept_redirects=0"
else
    log_result FAIL "ICMP重定向" "accept_redirects=${ICMP_REDIRECT}, 应为 0"
fi

# 6.4 检查源路由
SRC_ROUTE=$(sysctl -n net.ipv4.conf.all.accept_source_route 2>/dev/null)
if [ "${SRC_ROUTE}" = "0" ]; then
    log_result PASS "源路由" "accept_source_route=0"
else
    log_result FAIL "源路由" "accept_source_route=${SRC_ROUTE}, 应为 0"
fi

# 6.5 检查反向路径过滤
RP_FILTER=$(sysctl -n net.ipv4.conf.all.rp_filter 2>/dev/null)
if [ "${RP_FILTER}" = "1" ]; then
    log_result PASS "反向路径过滤" "rp_filter=1"
else
    log_result WARN "反向路径过滤" "rp_filter=${RP_FILTER}, 建议为 1"
fi

# 6.6 检查 ICMP 广播忽略
ICMP_ECHO_IGNORE_BROADCASTS=$(sysctl -n net.ipv4.icmp_echo_ignore_broadcasts 2>/dev/null)
if [ "${ICMP_ECHO_IGNORE_BROADCASTS}" = "1" ]; then
    log_result PASS "忽略ICMP广播" "icmp_echo_ignore_broadcasts=1"
else
    log_result WARN "忽略ICMP广播" "icmp_echo_ignore_broadcasts=${ICMP_ECHO_IGNORE_BROADCASTS}, 建议为 1"
fi

# 6.7 检查 IPv6 是否禁用(如不使用)
IPV6_DISABLED=$(sysctl -n net.ipv6.conf.all.disable_ipv6 2>/dev/null)
if [ "${IPV6_DISABLED}" = "1" ]; then
    log_result INFO "IPv6状态" "已禁用 IPv6"
else
    log_result INFO "IPv6状态" "IPv6 已启用(如不使用建议禁用)"
fi

# 6.8 检查 secure ICMP 重定向
SECURE_REDIRECTS=$(sysctl -n net.ipv4.conf.all.secure_redirects 2>/dev/null)
if [ "${SECURE_REDIRECTS}" = "0" ]; then
    log_result PASS "安全ICMP重定向" "secure_redirects=0"
else
    log_result WARN "安全ICMP重定向" "secure_redirects=${SECURE_REDIRECTS}, 建议为 0"
fi

# 6.9 检查日志欺骗保护
LOG_MARTIANS=$(sysctl -n net.ipv4.conf.all.log_martians 2>/dev/null)
if [ "${LOG_MARTIANS}" = "1" ]; then
    log_result PASS "日志欺骗保护" "log_martians=1"
else
    log_result WARN "日志欺骗保护" "log_martians=${LOG_MARTIANS}, 建议为 1"
fi

# 6.10 检查 TCP SYN Backlog
if command -v sysctl >/dev/null 2>&1; then
    SYN_BACKLOG=$(sysctl -n net.ipv4.tcp_max_syn_backlog 2>/dev/null)
    log_result INFO "SYN Backlog" "tcp_max_syn_backlog=${SYN_BACKLOG}"
fi

#---------------------- 7. 日志与审计 ----------------------
print_section "7. 日志与审计"

# 7.1 检查 rsyslog 服务
if systemctl is-active rsyslog >/dev/null 2>&1; then
    log_result PASS "rsyslog服务" "rsyslog 正在运行"
else
    log_result FAIL "rsyslog服务" "rsyslog 未运行,建议启用"
fi

# 7.2 检查日志文件权限
LOG_FILES="/var/log/messages /var/log/secure /var/log/audit/audit.log /var/log/cron /var/log/maillog"
for logf in ${LOG_FILES}; do
    if [ -f "${logf}" ]; then
        perm=$(stat -c "%a" "${logf}")
        owner=$(stat -c "%U" "${logf}")
        if echo "${perm}" | grep -Eq "^[46]00$|^[46]40$"; then
            log_result PASS "日志文件权限" "${logf} 权限=${perm} 属主=${owner}"
        else
            log_result WARN "日志文件权限" "${logf} 权限=${perm},建议<=640"
        fi
    fi
done

# 7.3 检查 auditd 服务
if systemctl is-active auditd >/dev/null 2>&1; then
    log_result PASS "auditd审计服务" "auditd 正在运行"
else
    log_result FAIL "auditd审计服务" "auditd 未运行,建议启用审计服务"
fi

# 7.4 检查 auditd 是否开机自启
if systemctl is-enabled auditd >/dev/null 2>&1; then
    log_result PASS "auditd自启" "auditd 已设置开机自启"
else
    log_result FAIL "auditd自启" "auditd 未设置开机自启"
fi

# 7.5 检查审计规则数量
AUDIT_RULES_COUNT=$(auditctl -l 2>/dev/null | grep -c .)
if [ "${AUDIT_RULES_COUNT}" -ge 5 ]; then
    log_result PASS "审计规则" "已配置 ${AUDIT_RULES_COUNT} 条审计规则"
else
    log_result WARN "审计规则" "仅 ${AUDIT_RULES_COUNT} 条规则,建议完善审计规则"
fi

# 7.6 检查日志保留策略
LOG_ROTATE_CONF="/etc/logrotate.conf"
if [ -f "${LOG_ROTATE_CONF}" ]; then
    ROTATE_COUNT=$(awk -F' ' 'tolower($1)=="rotate" {print $2; exit}' "${LOG_ROTATE_CONF}")
    if [ -n "${ROTATE_COUNT}" ] && [ "${ROTATE_COUNT}" -ge 4 ]; then
        log_result PASS "日志保留" "rotate=${ROTATE_COUNT}"
    else
        log_result WARN "日志保留" "rotate=${ROTATE_COUNT:-未设置}, 建议>=4"
    fi
fi

# 7.7 检查 /var/log 空间
LOG_SPACE=$(df -h /var/log 2>/dev/null | awk 'NR==2 {print $5 " (剩余 " $4 ")"}')
log_result INFO "日志空间" "/var/log 使用率: ${LOG_SPACE:-未知}"

#---------------------- 8. 系统更新与补丁 ----------------------
print_section "8. 系统更新与补丁"

# 8.1 检查 yum 是否配置
if command -v yum >/dev/null 2>&1 || command -v dnf >/dev/null 2>&1; then
    log_result PASS "包管理器" "已安装 yum/dnf"
else
    log_result WARN "包管理器" "未找到 yum/dnf"
fi

# 8.2 检查是否有可用安全更新(快速检测,不实际更新)
if command -v dnf >/dev/null 2>&1; then
    SECURITY_UPDATES=$(dnf check-update --security --quiet 2>/dev/null | grep -c "." || echo 0)
    if [ "${SECURITY_UPDATES}" = "0" ]; then
        log_result PASS "安全补丁" "无待安装安全更新"
    else
        log_result WARN "安全补丁" "有 ${SECURITY_UPDATES} 个安全更新待安装"
    fi
elif command -v yum >/dev/null 2>&1; then
    log_result INFO "安全补丁" "建议运行 yum updateinfo list security all 检查"
fi

# 8.3 检查是否禁用了不必要仓库
if [ -f /etc/yum.repos.d/redhat.repo ]; then
    log_result INFO "yum仓库" "已配置 RedHat 仓库"
fi

#---------------------- 9. 其他安全配置 ----------------------
print_section "9. 其他安全配置"

# 9.1 检查 cron 服务
if systemctl is-active crond >/dev/null 2>&1 || systemctl is-active cron >/dev/null 2>&1; then
    log_result PASS "cron服务" "crond 正在运行"
else
    log_result WARN "cron服务" "crond 未运行"
fi

# 9.2 检查 cron 目录权限
CRON_DIRS="/etc/cron.d /etc/cron.daily /etc/cron.hourly /etc/cron.monthly /etc/cron.weekly /var/spool/cron"
CRON_PERM_ISSUE=""
for d in ${CRON_DIRS}; do
    if [ -d "${d}" ]; then
        perm=$(stat -c "%a" "${d}")
        if [ "${perm}" != "700" ] && [ "${perm}" != "750" ]; then
            CRON_PERM_ISSUE="${CRON_PERM_ISSUE} ${d}=${perm}"
        fi
    fi
done
if [ -z "${CRON_PERM_ISSUE}" ]; then
    log_result PASS "cron目录权限" "权限配置正常"
else
    log_result WARN "cron目录权限" "${CRON_PERM_ISSUE}"
fi

# 9.3 检查 at 服务
if systemctl is-enabled atd >/dev/null 2>&1; then
    log_result INFO "atd服务" "atd 已启用(如不需要可禁用)"
fi

# 9.4 检查时间同步服务
if systemctl is-active chronyd >/dev/null 2>&1; then
    log_result PASS "时间同步" "chronyd 正在运行"
elif systemctl is-active ntpd >/dev/null 2>&1; then
    log_result PASS "时间同步" "ntpd 正在运行"
else
    log_result WARN "时间同步" "未运行时间同步服务,建议启用 chronyd"
fi

# 9.5 检查 /etc/motd 和 /etc/issue 警告信息
if [ -s /etc/issue.net ] && grep -Eq "Authorized|授权|禁止|prohibited|unauthorized" /etc/issue.net 2>/dev/null; then
    log_result PASS "登录警告标语" "/etc/issue.net 已配置警告信息"
else
    log_result WARN "登录警告标语" "建议在 /etc/issue.net 配置未授权访问警告"
fi

# 9.6 检查 umask 默认值
SYSTEM_UMASK=$(grep -E "^umask" /etc/profile /etc/bashrc 2>/dev/null | head -1 | awk '{print $2}' | sed 's/^0*//')
if [ "${SYSTEM_UMASK}" = "027" ] || [ "${SYSTEM_UMASK}" = "077" ]; then
    log_result PASS "默认umask" "umask=${SYSTEM_UMASK}"
else
    log_result WARN "默认umask" "当前=${SYSTEM_UMASK:-022}, 建议 027"
fi

# 9.7 检查 core dump 是否禁用
if ulimit -c 2>/dev/null | grep -Eq "^0$"; then
    log_result PASS "core dump" "当前 shell 已禁用 core dump"
else
    log_result WARN "core dump" "建议在 /etc/security/limits.conf 设置 * soft core 0"
fi

LIMITS_CORE=$(grep -E "^[^#]*core" /etc/security/limits.conf 2>/dev/null | grep -v "^$")
if [ -n "${LIMITS_CORE}" ]; then
    log_result PASS "core dump配置" "limits.conf 已配置 core 限制"
else
    log_result WARN "core dump配置" "limits.conf 未配置 core 限制"
fi

# 9.8 检查 /etc/sysctl.conf 是否包含安全设置
if [ -f /etc/sysctl.d/99-security.conf ] || [ -f /etc/sysctl.conf ]; then
    log_result INFO "sysctl配置" "存在 sysctl 配置文件"
fi

# 9.9 检查 sudo 配置
if [ -f /etc/sudoers ]; then
    SUDO_PERM=$(stat -c "%a" /etc/sudoers)
    if [ "${SUDO_PERM}" = "440" ]; then
        log_result PASS "sudoers权限" "/etc/sudoers 权限=440"
    else
        log_result FAIL "sudoers权限" "/etc/sudoers 权限=${SUDO_PERM}, 应为 440"
    fi
fi

# 9.10 检查启动参数中的审计设置
if [ -f /etc/default/grub ]; then
    if grep -Eq "audit=1" /etc/default/grub 2>/dev/null; then
        log_result PASS "GRUB审计" "GRUB 已配置 audit=1"
    else
        log_result WARN "GRUB审计" "建议在 GRUB 配置中添加 audit=1"
    fi
fi

# 9.11 检查 GRUB 密码保护
if grep -Eq "password|passwd" /etc/grub2.cfg /boot/grub2/grub.cfg 2>/dev/null; then
    log_result PASS "GRUB密码保护" "GRUB 已设置密码保护"
else
    log_result WARN "GRUB密码保护" "GRUB 未设置密码保护"
fi

# 9.12 检查单用户模式密码保护
if [ -f /etc/sysconfig/init ]; then
    SINGLE_PARAM=$(grep -E "^SINGLE" /etc/sysconfig/init 2>/dev/null)
    if echo "${SINGLE_PARAM}" | grep -q "=/sbin/sulogin"; then
        log_result PASS "单用户模式" "已配置 sulogin 保护"
    else
        log_result WARN "单用户模式" "建议配置 SINGLE=/sbin/sulogin"
    fi
fi

#---------------------- 10. 资源限制 ----------------------
print_section "10. 资源限制"

# 10.1 检查文件描述符限制
if grep -Eq "^[^#]*nofile" /etc/security/limits.conf 2>/dev/null; then
    log_result PASS "文件描述符限制" "limits.conf 已配置 nofile"
else
    log_result INFO "文件描述符限制" "未自定义配置(使用默认值)"
fi

# 10.2 检查进程数限制
if grep -Eq "^[^#]*nproc" /etc/security/limits.conf 2>/dev/null; then
    log_result PASS "进程数限制" "limits.conf 已配置 nproc"
else
    log_result INFO "进程数限制" "未自定义配置(使用默认值)"
fi

#---------------------- 汇总报告 ----------------------
print_section "检测汇总"

TOTAL=$((PASS_COUNT + FAIL_COUNT + WARN_COUNT + INFO_COUNT))
SUMMARY="
  ╔════════════════════════════════════════╗
  ║          安全基线检测汇总报告          ║
  ╠════════════════════════════════════════╣
  ║  检测项目总数:  ${TOTAL}                 ║
  ║  合规 [PASS]:   ${PASS_COUNT}                 ║
  ║  不合规 [FAIL]: ${FAIL_COUNT}                 ║
  ║  关注 [WARN]:   ${WARN_COUNT}                 ║
  ║  信息 [INFO]:   ${INFO_COUNT}                 ║
  ╠════════════════════════════════════════╣
  ║  合规率: $(awk -v p=${PASS_COUNT} -v f=${FAIL_COUNT} -v w=${WARN_COUNT} 'BEGIN{t=p+f+w; if(t>0) printf "%.2f%%", p*100/t; else print "N/A"}')                        ║
  ╚════════════════════════════════════════╝
"
echo -e "\033[36m${SUMMARY}\033[0m"
echo "${SUMMARY}" >> "${REPORT_FILE}"

# 合规率建议
if [ "${FAIL_COUNT}" -gt 0 ]; then
    echo "  [!] 检测到 ${FAIL_COUNT} 项不合规,建议优先处理 FAIL 项。" | tee -a "${REPORT_FILE}"
fi
if [ "${WARN_COUNT}" -gt 0 ]; then
    echo "  [!] 检测到 ${WARN_COUNT} 项需关注,建议评估后处理 WARN 项。" | tee -a "${REPORT_FILE}"
fi

echo ""
echo "  详细报告已保存至: ${REPORT_FILE}"
echo "  报告目录: ${REPORT_DIR}"
echo ""

# 退出码: 有 FAIL 项返回 1,否则返回 0
if [ "${FAIL_COUNT}" -gt 0 ]; then
    exit 1
else
    exit 0
fi
