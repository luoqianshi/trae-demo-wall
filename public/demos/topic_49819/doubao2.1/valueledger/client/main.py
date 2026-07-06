import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from valueledger.config import DEFAULT_SERVER_URL
from valueledger.client.api_client import APIClient
from valueledger.client.utils import (
    clear_screen, print_header, print_menu, get_choice,
    get_input, read_file_content, pause
)

client = None


def login_menu():
    clear_screen()
    print_header("ValueLedger 创值账本")
    print("  让项目事实自动生长，让每一份真实贡献被看见")

    print_menu(["注册新账号", "登录已有账号", "设置服务端地址", "退出"])

    choice = get_choice("请选择: ", 4)
    if choice == 1:
        do_register()
    elif choice == 2:
        do_login()
    elif choice == 3:
        set_server_url()
    elif choice == 4:
        print("再见！")
        sys.exit(0)


def set_server_url():
    global client
    print_header("设置服务端地址")
    url = get_input(f"请输入服务端地址 (默认: {DEFAULT_SERVER_URL}): ", default=DEFAULT_SERVER_URL)
    client = APIClient(url)
    print(f"服务端地址已设置为: {url}")
    pause()


def do_register():
    print_header("用户注册")
    username = get_input("请输入用户名 (2-20位): ", required=True)
    password = get_input("请输入密码 (至少6位): ", required=True)
    password2 = get_input("请再次输入密码: ", required=True)

    if password != password2:
        print("两次密码输入不一致！")
        pause()
        return

    success, result = client.register(username, password)
    if success:
        print(f"\n注册成功！欢迎 {username}！")
        role = result["user"]["role"]
        if role == "boss":
            print("恭喜！您是第一个注册的用户，已自动成为 BOSS。")
        pause()
    else:
        print(f"\n注册失败: {result.get('error', '未知错误')}")
        pause()


def do_login():
    print_header("用户登录")
    username = get_input("用户名: ", required=True)
    password = get_input("密码: ", required=True)

    success, result = client.login(username, password)
    if success:
        print(f"\n登录成功！欢迎回来 {username}！")
        print(f"您的角色是: {result['user']['role']}")
        pause()
    else:
        print(f"\n登录失败: {result.get('error', '未知错误')}")
        pause()


def role_dispatch():
    role = client.current_user["role"]
    if role == "usr":
        usr_menu()
    elif role == "manager":
        manager_menu()
    elif role == "boss":
        boss_menu()


def usr_menu():
    while True:
        clear_screen()
        user = client.current_user
        print_header(f"价值创造者工作台 - {user['username']}")
        print_menu([
            "查看我的任务",
            "提交代码并获取AI评价",
            "确认/修正AI评价",
            "查看我的提交历史",
            "退出登录"
        ])

        choice = get_choice("请选择: ", 5)
        if choice == 1:
            show_my_tasks()
        elif choice == 2:
            submit_code()
        elif choice == 3:
            confirm_submission()
        elif choice == 4:
            show_my_submissions()
        elif choice == 5:
            client.logout()
            break


def show_my_tasks():
    print_header("我的任务列表")
    success, result = client.get_my_tasks()
    if not success:
        print(f"获取任务失败: {result.get('error')}")
        pause()
        return

    tasks = result.get("tasks", [])
    if not tasks:
        print("目前没有分配给你的任务。")
        pause()
        return

    for i, t in enumerate(tasks, 1):
        status_map = {"todo": "待开始", "doing": "进行中", "submitted": "待确认", "confirmed": "已完成"}
        status = status_map.get(t["status"], t["status"])
        print(f"\n  [{i}] {t['title']}")
        print(f"      项目: {t['project_name']}")
        print(f"      状态: {status}")
        if t["description"]:
            print(f"      描述: {t['description'][:50]}..." if len(t["description"]) > 50 else f"      描述: {t['description']}")

    pause()


def submit_code():
    print_header("提交代码")
    success, result = client.get_my_tasks()
    if not success:
        print(f"获取任务失败: {result.get('error')}")
        pause()
        return

    tasks = [t for t in result.get("tasks", []) if t["status"] in ["todo", "doing", "submitted"]]
    if not tasks:
        print("没有可提交代码的任务。")
        pause()
        return

    print("请选择要提交代码的任务:")
    for i, t in enumerate(tasks, 1):
        print(f"  {i}. {t['title']} (项目: {t['project_name']})")

    choice = get_choice("\n请选择任务编号: ", len(tasks))
    if not choice:
        return
    task = tasks[choice - 1]

    filepath = get_input("请输入Python文件路径: ", required=True)
    code_content = read_file_content(filepath)
    if not code_content:
        print("无法读取文件，请检查路径是否正确。")
        pause()
        return

    filename = os.path.basename(filepath)
    print(f"\n正在提交 {filename}，AI正在评审代码，请稍候...")
    success, result = client.submit_code(task["id"], filename, code_content)
    if not success:
        print(f"提交失败: {result.get('error')}")
        pause()
        return

    sub = result["submission"]
    print("\n" + "-" * 50)
    print("  AI 评审完成！")
    print(f"  AI评分: {sub['ai_score']} 分")
    print(f"  AI评价: {sub['ai_comment']}")
    print("-" * 50)
    print("\n提示: 你可以在菜单中选择「确认/修正AI评价」来接受或修改这个结果。")
    pause()


def confirm_submission():
    print_header("确认/修正AI评价")
    success, result = client.get_my_submissions()
    if not success:
        print(f"获取提交记录失败: {result.get('error')}")
        pause()
        return

    subs = [s for s in result.get("submissions", []) if not s["confirmed_at"]]
    if not subs:
        print("没有待确认的提交记录。")
        pause()
        return

    print("待确认的提交:")
    for i, s in enumerate(subs, 1):
        print(f"\n  [{i}] 任务: {s['task_title']}")
        print(f"      文件: {s['filename']}")
        print(f"      AI评分: {s['ai_score']}")
        print(f"      AI评价: {s['ai_comment'][:60]}...")

    choice = get_choice("\n请选择要确认的提交编号: ", len(subs))
    if not choice:
        return
    sub = subs[choice - 1]

    print(f"\nAI原始评分: {sub['ai_score']}")
    print(f"AI原始评价: {sub['ai_comment']}")
    print("\n直接回车表示接受AI的结果，或者输入新的评分/评价进行修改:")

    score_input = get_input(f"请输入最终评分 (0-100，默认接受 {sub['ai_score']}): ", default=str(sub["ai_score"]))
    try:
        final_score = float(score_input)
        final_score = max(0, min(100, final_score))
    except:
        final_score = sub["ai_score"]

    final_comment = get_input(f"请输入最终评价 (默认接受AI评价): ", default=sub["ai_comment"])

    success, result = client.confirm_submission(sub["id"], final_score, final_comment)
    if not success:
        print(f"确认失败: {result.get('error')}")
    else:
        confirmed = result["submission"]
        if confirmed["is_modified"]:
            print("\n确认成功！你修改了AI评价，修改痕迹已记录。")
        else:
            print("\n确认成功！你接受了AI的评价结果。")
    pause()


def show_my_submissions():
    print_header("我的提交历史")
    success, result = client.get_my_submissions()
    if not success:
        print(f"获取提交记录失败: {result.get('error')}")
        pause()
        return

    subs = result.get("submissions", [])
    if not subs:
        print("还没有提交记录。")
        pause()
        return

    for i, s in enumerate(subs, 1):
        status = "已确认" if s["confirmed_at"] else "待确认"
        modified = " (已修改)" if s["is_modified"] else ""
        score = s["final_score"] if s["final_score"] is not None else s["ai_score"]
        comment = s["final_comment"] if s["final_comment"] is not None else s["ai_comment"]

        print(f"\n  [{i}] {s['task_title']}")
        print(f"      项目: {s['project_name']}")
        print(f"      文件: {s['filename']}")
        print(f"      状态: {status}{modified}")
        print(f"      最终得分: {score}")
        print(f"      评价: {comment[:80]}..." if len(comment) > 80 else f"      评价: {comment}")
        print(f"      提交时间: {s['submitted_at']}")

    pause()


def manager_menu():
    while True:
        clear_screen()
        user = client.current_user
        print_header(f"管理者工作台 - {user['username']}")
        print_menu([
            "创建新项目",
            "查看所有项目",
            "为项目创建任务并分配",
            "查看项目任务列表",
            "退出登录"
        ])

        choice = get_choice("请选择: ", 5)
        if choice == 1:
            create_project()
        elif choice == 2:
            show_all_projects()
        elif choice == 3:
            create_task()
        elif choice == 4:
            view_project_tasks()
        elif choice == 5:
            client.logout()
            break


def create_project():
    print_header("创建新项目")
    name = get_input("项目名称: ", required=True)
    description = get_input("项目描述: ", default="")
    success, result = client.create_project(name, description)
    if success:
        print(f"\n项目「{name}」创建成功！项目ID: {result['project']['id']}")
    else:
        print(f"\n创建失败: {result.get('error')}")
    pause()


def show_all_projects():
    print_header("所有项目")
    success, result = client.get_projects()
    if not success:
        print(f"获取项目失败: {result.get('error')}")
        pause()
        return

    projects = result.get("projects", [])
    if not projects:
        print("还没有创建任何项目。")
        pause()
        return

    for i, p in enumerate(projects, 1):
        print(f"\n  [{i}] {p['name']}")
        print(f"      描述: {p['description'] or '无'}")
        print(f"      进度: {p['completed_tasks']}/{p['total_tasks']} 任务完成 ({p['progress']}%)")
        print(f"      创建时间: {p['created_at']}")

    pause()


def create_task():
    print_header("创建任务")

    success, result = client.get_projects()
    if not success:
        print(f"获取项目失败: {result.get('error')}")
        pause()
        return
    projects = result.get("projects", [])
    if not projects:
        print("请先创建项目！")
        pause()
        return

    print("选择项目:")
    for i, p in enumerate(projects, 1):
        print(f"  {i}. {p['name']} (ID: {p['id']})")
    p_choice = get_choice("\n请选择项目: ", len(projects))
    if not p_choice:
        return
    project = projects[p_choice - 1]

    title = get_input("任务标题: ", required=True)
    description = get_input("任务描述: ", default="")

    success_u, users_result = client.get_all_users()
    if not success_u:
        print(f"获取用户列表失败: {users_result.get('error')}")
        pause()
        return
    all_users = users_result.get("users", [])
    if not all_users:
        print("系统中还没有用户，请先让其他用户注册！")
        pause()
        return

    print("\n选择要分配给哪个用户:")
    for i, u in enumerate(all_users, 1):
        role_map = {"usr": "开发者", "manager": "管理者", "boss": "BOSS"}
        role_name = role_map.get(u["role"], u["role"])
        print(f"  {i}. [ID:{u['id']}] {u['username']} ({role_name})")

    u_choice = get_choice("\n请选择用户: ", len(all_users))
    if not u_choice:
        return
    assignee = all_users[u_choice - 1]

    success, result = client.create_task(project["id"], title, description, assignee["id"])
    if success:
        print(f"\n任务「{title}」创建成功！已分配给 {assignee['username']}，任务ID: {result['task']['id']}")
    else:
        print(f"\n创建失败: {result.get('error')}")
    pause()


def view_project_tasks():
    print_header("查看项目任务")
    success, result = client.get_projects()
    if not success:
        print(f"获取项目失败: {result.get('error')}")
        pause()
        return
    projects = result.get("projects", [])
    if not projects:
        print("还没有项目。")
        pause()
        return

    print("选择项目:")
    for i, p in enumerate(projects, 1):
        print(f"  {i}. {p['name']}")
    p_choice = get_choice("\n请选择项目: ", len(projects))
    if not p_choice:
        return
    project = projects[p_choice - 1]

    success, result = client.get_project_tasks(project["id"])
    if not success:
        print(f"获取任务失败: {result.get('error')}")
        pause()
        return

    tasks = result.get("tasks", [])
    if not tasks:
        print("该项目还没有任务。")
        pause()
        return

    status_map = {"todo": "待开始", "doing": "进行中", "submitted": "待确认", "confirmed": "已完成"}
    for i, t in enumerate(tasks, 1):
        status = status_map.get(t["status"], t["status"])
        print(f"\n  [{i}] {t['title']}")
        print(f"      分配给: {t['assignee_name']}")
        print(f"      状态: {status}")
        if t["description"]:
            print(f"      描述: {t['description']}")

    pause()


def boss_menu():
    while True:
        clear_screen()
        user = client.current_user
        print_header(f"BOSS工作台 - {user['username']}")
        print_menu([
            "查看所有项目进度",
            "查看人员贡献度排行",
            "管理用户角色（任免manager）",
            "查看所有用户列表",
            "退出登录"
        ])

        choice = get_choice("请选择: ", 5)
        if choice == 1:
            boss_view_projects()
        elif choice == 2:
            boss_view_contributions()
        elif choice == 3:
            manage_roles()
        elif choice == 4:
            show_all_users()
        elif choice == 5:
            client.logout()
            break


def boss_view_projects():
    print_header("所有项目进度")
    success, result = client.get_boss_projects()
    if not success:
        print(f"获取项目失败: {result.get('error')}")
        pause()
        return

    projects = result.get("projects", [])
    if not projects:
        print("还没有项目。")
        pause()
        return

    for i, p in enumerate(projects, 1):
        print(f"\n  [{i}] {p['name']}")
        print(f"      描述: {p['description'] or '无'}")
        print(f"      进度: {p['completed_tasks']}/{p['total_tasks']} 任务完成")
        if p["total_tasks"] > 0:
            bar_len = 30
            filled = int(bar_len * p["progress"] / 100)
            bar = "█" * filled + "░" * (bar_len - filled)
            print(f"      [{bar}] {p['progress']}%")
        print(f"      创建时间: {p['created_at']}")

    pause()


def boss_view_contributions():
    print_header("人员贡献度排行")
    success, result = client.get_boss_contributions()
    if not success:
        print(f"获取贡献度失败: {result.get('error')}")
        pause()
        return

    contributions = result.get("contributions", [])
    if not contributions:
        print("还没有贡献数据。")
        pause()
        return

    print(f"  {'排名':<4} {'用户名':<15} {'提交数':<8} {'完成任务':<8} {'平均分':<8}")
    print("  " + "-" * 50)
    for i, c in enumerate(contributions, 1):
        avg_score = f"{c['avg_score']:.1f}" if c["avg_score"] is not None else "N/A"
        print(f"  {i:<4} {c['username']:<15} {c['submission_count']:<8} {c['completed_tasks']:<8} {avg_score:<8}")

    pause()


def show_all_users():
    print_header("所有用户列表")

    print("说明: 下面列出所有用户，供任免manager时参考")
    success, result = client.get_all_users()
    if not success:
        print(f"获取用户列表失败: {result.get('error')}")
        pause()
        return

    users = result.get("users", [])
    role_map = {"usr": "价值创造者(开发者)", "manager": "管理者", "boss": "BOSS"}
    for u in users:
        role_name = role_map.get(u["role"], u["role"])
        print(f"\n  ID: {u['id']:>3}  {u['username']:<15} 角色: {role_name}")
        print(f"        注册IP: {u['ip_address']}  MAC: {u['mac_address']}")
        print(f"        注册时间: {u['created_at']}")

    print("\n提示: usr角色可以被任免为manager，boss角色不可修改")
    pause()


def manage_roles():
    print_header("管理用户角色")
    user_id = get_input("请输入要修改角色的用户ID: ", required=True)
    try:
        user_id = int(user_id)
    except:
        print("用户ID必须是数字")
        pause()
        return

    print("\n可以设置的角色:")
    print("  1. usr (普通开发者/价值创造者)")
    print("  2. manager (管理者)")
    choice = get_choice("请选择角色: ", 2)
    if choice == 1:
        new_role = "usr"
    elif choice == 2:
        new_role = "manager"
    else:
        return

    success, result = client.update_user_role(user_id, new_role)
    if success:
        print(f"\n用户 {result['user']['username']} 的角色已更新为 {new_role}")
    else:
        print(f"\n更新失败: {result.get('error')}")
    pause()


def main():
    global client
    client = APIClient(DEFAULT_SERVER_URL)

    while True:
        if client.current_user:
            role_dispatch()
        else:
            login_menu()


if __name__ == "__main__":
    main()
