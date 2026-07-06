import json
import uuid
import re
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from valueledger.server import db
from valueledger.server.utils import (
    parse_json_request, send_json_response, 
    validate_username, hash_code, get_host_ip
)
from valueledger.server.ai_client import review_code


class APIHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        print(f"[SERVER] {args[0]}")

    def get_current_user(self):
        auth_header = self.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return None
        token = auth_header[7:]
        return db.get_user_by_token(token)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if path == "/api/has-users":
            send_json_response(self, 200, {"has_users": db.has_users()})
            return

        user = self.get_current_user()

        routes = {
            "/api/me": self.handle_me,
            "/api/projects": self.handle_get_projects,
            "/api/my/tasks": self.handle_my_tasks,
            "/api/my/submissions": self.handle_my_submissions,
            "/api/users": self.handle_get_users,
            "/api/boss/projects": self.handle_boss_projects,
            "/api/boss/contributions": self.handle_boss_contributions,
        }

        project_task_match = re.match(r"^/api/projects/(\d+)/tasks$", path)
        if project_task_match:
            self.handle_get_project_tasks(int(project_task_match.group(1)), user)
            return

        if path in routes:
            routes[path](user)
        else:
            send_json_response(self, 404, {"error": "Not found"})

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path
        data = parse_json_request(self)
        user = self.get_current_user()

        routes = {
            "/api/register": self.handle_register,
            "/api/login": self.handle_login,
            "/api/projects": self.handle_create_project,
            "/api/tasks": self.handle_create_task,
            "/api/change-password": self.handle_change_password,
        }

        role_match = re.match(r"^/api/boss/users/(\d+)/role$", path)
        if role_match:
            self.handle_update_role(int(role_match.group(1)), data, user)
            return

        dismiss_match = re.match(r"^/api/boss/users/(\d+)/dismiss$", path)
        if dismiss_match:
            self.handle_dismiss_user(int(dismiss_match.group(1)), user)
            return

        restore_match = re.match(r"^/api/boss/users/(\d+)/restore$", path)
        if restore_match:
            self.handle_restore_user(int(restore_match.group(1)), user)
            return

        submit_match = re.match(r"^/api/tasks/(\d+)/submit$", path)
        if submit_match:
            self.handle_submit_code(int(submit_match.group(1)), data, user)
            return

        confirm_match = re.match(r"^/api/submissions/(\d+)/confirm$", path)
        if confirm_match:
            self.handle_confirm_submission(int(confirm_match.group(1)), data, user)
            return

        if path in routes:
            routes[path](data, user)
        else:
            send_json_response(self, 404, {"error": "Not found"})

    def handle_register(self, data, user):
        username = data.get("username", "").strip()
        password = data.get("password", "").strip()
        client_ip = self.client_address[0]
        client_mac = data.get("mac_address", "")

        if not validate_username(username):
            send_json_response(self, 400, {"error": "用户名格式不正确，2-20位字母数字中文下划线"})
            return

        if len(password) < 6:
            send_json_response(self, 400, {"error": "密码至少6位"})
            return

        existing = db.get_user_by_username(username)
        if existing:
            send_json_response(self, 400, {"error": "用户名已存在"})
            return

        ip = client_ip
        mac = client_mac if client_mac else ""
        new_user = db.create_user(username, password, ip, mac)

        token = str(uuid.uuid4())
        db.create_session(token, new_user["id"])

        del new_user["password"]
        send_json_response(self, 200, {"user": new_user, "token": token})

    def handle_login(self, data, user):
        username = data.get("username", "").strip()
        password = data.get("password", "").strip()
        client_mac = data.get("mac_address", "")

        user = db.verify_user(username, password)
        if not user:
            existing_user = db.get_user_by_username(username)
            if existing_user and existing_user.get("status") == "dismissed":
                send_json_response(self, 403, {"error": "该账号已被免职，无法登录"})
                return
            send_json_response(self, 401, {"error": "用户名或密码错误"})
            return

        token = str(uuid.uuid4())
        db.create_session(token, user["id"])

        del user["password"]
        send_json_response(self, 200, {"user": user, "token": token})

    def handle_me(self, user):
        if not user:
            send_json_response(self, 401, {"error": "未登录"})
            return
        del user["password"]
        send_json_response(self, 200, {"user": user})

    def handle_create_project(self, data, user):
        if not user or user["role"] not in ["manager", "boss"]:
            send_json_response(self, 403, {"error": "权限不足，只有manager可以创建项目"})
            return

        name = data.get("name", "").strip()
        description = data.get("description", "").strip()

        if not name:
            send_json_response(self, 400, {"error": "项目名称不能为空"})
            return

        project = db.create_project(name, description, user["id"])
        send_json_response(self, 200, {"project": project})

    def handle_get_projects(self, user):
        if not user:
            send_json_response(self, 401, {"error": "未登录"})
            return
        projects = db.get_all_projects()
        send_json_response(self, 200, {"projects": projects})

    def handle_create_task(self, data, user):
        if not user or user["role"] not in ["manager", "boss"]:
            send_json_response(self, 403, {"error": "权限不足，只有manager可以创建任务"})
            return

        project_id = data.get("project_id")
        title = data.get("title", "").strip()
        description = data.get("description", "").strip()
        assignee_id = data.get("assignee_id")

        if not project_id or not title or not assignee_id:
            send_json_response(self, 400, {"error": "project_id、title、assignee_id不能为空"})
            return

        project = db.get_project_by_id(project_id)
        if not project:
            send_json_response(self, 400, {"error": "项目不存在"})
            return

        assignee = db.get_user_by_id(assignee_id)
        if not assignee or assignee["role"] not in ["usr", "manager", "boss"]:
            send_json_response(self, 400, {"error": "被分配人不存在"})
            return

        task = db.create_task(project_id, title, description, assignee_id, user["id"])
        send_json_response(self, 200, {"task": task})

    def handle_get_project_tasks(self, project_id, user):
        if not user:
            send_json_response(self, 401, {"error": "未登录"})
            return
        tasks = db.get_project_tasks(project_id)
        send_json_response(self, 200, {"tasks": tasks})

    def handle_my_tasks(self, user):
        if not user:
            send_json_response(self, 401, {"error": "未登录"})
            return
        tasks = db.get_user_tasks(user["id"])
        send_json_response(self, 200, {"tasks": tasks})

    def handle_submit_code(self, task_id, data, user):
        if not user:
            send_json_response(self, 401, {"error": "未登录"})
            return

        filename = data.get("filename", "main.py")
        code_content = data.get("code_content", "")

        if not code_content.strip():
            send_json_response(self, 400, {"error": "代码内容不能为空"})
            return

        task = db.get_task_by_id(task_id)
        if not task:
            send_json_response(self, 400, {"error": "任务不存在"})
            return

        if task["assignee_id"] != user["id"]:
            send_json_response(self, 403, {"error": "这不是你的任务"})
            return

        code_hash = hash_code(code_content)
        print(f"[AI] 正在评审代码，任务ID: {task_id}，用户: {user['username']}")
        ai_score, ai_comment = review_code(code_content)
        print(f"[AI] 评审完成，得分: {ai_score}")

        submission = db.create_code_submission(
            task_id, user["id"], filename, code_content,
            ai_score, ai_comment, code_hash
        )
        send_json_response(self, 200, {"submission": submission})

    def handle_confirm_submission(self, sub_id, data, user):
        if not user:
            send_json_response(self, 401, {"error": "未登录"})
            return

        submission = db.get_submission_by_id(sub_id)
        if not submission:
            send_json_response(self, 400, {"error": "提交记录不存在"})
            return

        if submission["user_id"] != user["id"]:
            send_json_response(self, 403, {"error": "这不是你的提交"})
            return

        if submission["confirmed_at"]:
            send_json_response(self, 400, {"error": "该提交已确认，不能重复确认"})
            return

        final_score = float(data.get("final_score", submission["ai_score"]))
        final_comment = data.get("final_comment", submission["ai_comment"]).strip()

        final_score = max(0, min(100, final_score))
        if not final_comment:
            final_comment = submission["ai_comment"]

        confirmed = db.confirm_submission(sub_id, final_score, final_comment)
        send_json_response(self, 200, {"submission": confirmed})

    def handle_my_submissions(self, user):
        if not user:
            send_json_response(self, 401, {"error": "未登录"})
            return
        submissions = db.get_user_submissions(user["id"])
        for s in submissions:
            s["code_content"] = s["code_content"][:200] + "..." if len(s["code_content"]) > 200 else s["code_content"]
        send_json_response(self, 200, {"submissions": submissions})

    def handle_boss_projects(self, user):
        if not user or user["role"] != "boss":
            send_json_response(self, 403, {"error": "权限不足，只有boss可以查看"})
            return
        projects = db.get_all_projects()
        send_json_response(self, 200, {"projects": projects})

    def handle_boss_contributions(self, user):
        if not user or user["role"] != "boss":
            send_json_response(self, 403, {"error": "权限不足，只有boss可以查看"})
            return
        contributions = db.get_all_contributions()
        send_json_response(self, 200, {"contributions": contributions})

    def handle_update_role(self, user_id, data, user):
        if not user or user["role"] != "boss":
            send_json_response(self, 403, {"error": "权限不足，只有boss可以任免"})
            return

        new_role = data.get("role", "").strip()
        if new_role not in ["usr", "manager"]:
            send_json_response(self, 400, {"error": "角色只能是usr或manager"})
            return

        target_user = db.get_user_by_id(user_id)
        if not target_user:
            send_json_response(self, 400, {"error": "用户不存在"})
            return

        if target_user["role"] == "boss":
            send_json_response(self, 400, {"error": "不能修改boss的角色"})
            return

        updated = db.update_user_role(user_id, new_role)
        del updated["password"]
        send_json_response(self, 200, {"user": updated})

    def handle_dismiss_user(self, user_id, user):
        if not user or user["role"] != "boss":
            send_json_response(self, 403, {"error": "权限不足，只有boss可以免职用户"})
            return

        target_user = db.get_user_by_id(user_id)
        if not target_user:
            send_json_response(self, 400, {"error": "用户不存在"})
            return

        if target_user["role"] == "boss":
            send_json_response(self, 400, {"error": "不能免职boss"})
            return

        if target_user.get("status") == "dismissed":
            send_json_response(self, 400, {"error": "该用户已被免职"})
            return

        updated = db.set_user_status(user_id, "dismissed")
        del updated["password"]
        send_json_response(self, 200, {"user": updated, "message": "免职成功"})

    def handle_restore_user(self, user_id, user):
        if not user or user["role"] != "boss":
            send_json_response(self, 403, {"error": "权限不足，只有boss可以复职用户"})
            return

        target_user = db.get_user_by_id(user_id)
        if not target_user:
            send_json_response(self, 400, {"error": "用户不存在"})
            return

        if target_user.get("status") != "dismissed":
            send_json_response(self, 400, {"error": "该用户未被免职"})
            return

        updated = db.set_user_status(user_id, "active")
        del updated["password"]
        send_json_response(self, 200, {"user": updated, "message": "复职成功"})

    def handle_get_users(self, user):
        if not user:
            send_json_response(self, 401, {"error": "未登录"})
            return
        users = db.get_all_users()
        for u in users:
            del u["password"]
        send_json_response(self, 200, {"users": users})

    def handle_change_password(self, data, user):
        if not user:
            send_json_response(self, 401, {"error": "未登录"})
            return
        old_password = data.get("old_password", "")
        new_password = data.get("new_password", "")
        if len(new_password) < 6:
            send_json_response(self, 400, {"error": "新密码长度至少6位"})
            return
        success, msg = db.change_password(user["id"], old_password, new_password)
        if not success:
            send_json_response(self, 400, {"error": msg})
            return
        send_json_response(self, 200, {"message": msg})
