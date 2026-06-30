import json
import urllib.request
import urllib.error
from valueledger.client.utils import get_mac_address


class APIClient:
    def __init__(self, base_url):
        self.base_url = base_url.rstrip("/")
        self.token = None
        self.current_user = None
        self.mac_address = get_mac_address()

    def _request(self, method, path, data=None):
        url = self.base_url + path
        headers = {"Content-Type": "application/json; charset=utf-8"}
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"

        body = None
        if data is not None:
            body = json.dumps(data, ensure_ascii=False).encode("utf-8")

        req = urllib.request.Request(url, data=body, headers=headers, method=method)

        try:
            with urllib.request.urlopen(req, timeout=30) as response:
                result = json.loads(response.read().decode("utf-8"))
                return True, result
        except urllib.error.HTTPError as e:
            try:
                error_data = json.loads(e.read().decode("utf-8"))
                return False, error_data
            except:
                return False, {"error": f"HTTP错误 {e.code}"}
        except Exception as e:
            return False, {"error": f"网络错误: {str(e)}"}

    def register(self, username, password):
        success, result = self._request("POST", "/api/register", {
            "username": username,
            "password": password,
            "mac_address": self.mac_address
        })
        if success:
            self.token = result["token"]
            self.current_user = result["user"]
        return success, result

    def login(self, username, password):
        success, result = self._request("POST", "/api/login", {
            "username": username,
            "password": password,
            "mac_address": self.mac_address
        })
        if success:
            self.token = result["token"]
            self.current_user = result["user"]
        return success, result

    def has_users(self):
        return self._request("GET", "/api/has-users")

    def get_me(self):
        return self._request("GET", "/api/me")

    def create_project(self, name, description):
        return self._request("POST", "/api/projects", {
            "name": name,
            "description": description
        })

    def get_projects(self):
        return self._request("GET", "/api/projects")

    def create_task(self, project_id, title, description, assignee_id):
        return self._request("POST", "/api/tasks", {
            "project_id": project_id,
            "title": title,
            "description": description,
            "assignee_id": assignee_id
        })

    def get_project_tasks(self, project_id):
        return self._request("GET", f"/api/projects/{project_id}/tasks")

    def get_my_tasks(self):
        return self._request("GET", "/api/my/tasks")

    def submit_code(self, task_id, filename, code_content):
        return self._request("POST", f"/api/tasks/{task_id}/submit", {
            "filename": filename,
            "code_content": code_content
        })

    def confirm_submission(self, sub_id, final_score, final_comment):
        return self._request("POST", f"/api/submissions/{sub_id}/confirm", {
            "final_score": final_score,
            "final_comment": final_comment
        })

    def get_my_submissions(self):
        return self._request("GET", "/api/my/submissions")

    def get_all_users(self):
        return self._request("GET", "/api/users")

    def change_password(self, old_password, new_password):
        return self._request("POST", "/api/change-password", {
            "old_password": old_password,
            "new_password": new_password
        })

    def get_boss_projects(self):
        return self._request("GET", "/api/boss/projects")

    def get_boss_contributions(self):
        return self._request("GET", "/api/boss/contributions")

    def update_user_role(self, user_id, role):
        return self._request("POST", f"/api/boss/users/{user_id}/role", {
            "role": role
        })

    def dismiss_user(self, user_id):
        return self._request("POST", f"/api/boss/users/{user_id}/dismiss")

    def restore_user(self, user_id):
        return self._request("POST", f"/api/boss/users/{user_id}/restore")

    def logout(self):
        self.token = None
        self.current_user = None
