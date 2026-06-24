"""
Git routes.
"""

import subprocess
from typing import Optional
from fastapi import APIRouter, Header, HTTPException

router = APIRouter(prefix="/api", tags=["git"])


def _run_git(cwd: str, *args) -> subprocess.CompletedProcess:
    return subprocess.run(
        ["git"] + list(args),
        cwd=cwd,
        capture_output=True,
        text=True,
        timeout=10,
    )


@router.get("/git/status")
async def git_status(authorization: Optional[str] = Header(default=None), cwd: str = ""):
    router.state.check_auth(authorization)
    base = router.state.safe_cwd(cwd) if cwd else router.state.default_cwd
    result = _run_git(base, "status", "--porcelain=v1", "-b")
    if result.returncode != 0:
        return {"branch": None, "files": [], "isRepo": False}
    lines = result.stdout.strip().split('\n')
    branch = ""
    files = []
    for line in lines:
        if line.startswith("## "):
            branch = line[3:].split("...")[0]
            continue
        if len(line) >= 3:
            xy = line[:2]
            filepath = line[3:]
            status = "modified"
            if xy[0] == "?" or xy[1] == "?":
                status = "untracked"
            elif xy[0] == "A" or xy[1] == "A":
                status = "added"
            elif xy[0] == "D" or xy[1] == "D":
                status = "deleted"
            elif xy[0] == "R" or xy[1] == "R":
                status = "renamed"
            staged = xy[0] != " " and xy[0] != "?"
            files.append({"path": filepath, "status": status, "staged": staged})
    return {"branch": branch, "files": files, "isRepo": True}


@router.get("/git/log")
async def git_log(authorization: Optional[str] = Header(default=None), cwd: str = "", limit: int = 20):
    router.state.check_auth(authorization)
    base = router.state.safe_cwd(cwd) if cwd else router.state.default_cwd
    result = _run_git(base, "log", f"--max-count={limit}", "--format=%H|%s|%an|%ar|%h")
    if result.returncode != 0:
        return {"commits": []}
    commits = []
    for line in result.stdout.strip().split('\n'):
        if "|" not in line:
            continue
        parts = line.split("|", 4)
        commits.append({
            "hash": parts[0][:12],
            "shortHash": parts[4] if len(parts) > 4 else parts[0][:7],
            "message": parts[1],
            "author": parts[2],
            "date": parts[3],
        })
    return {"commits": commits}


@router.get("/git/diff")
async def git_diff(authorization: Optional[str] = Header(default=None), cwd: str = "", target: str = ""):
    router.state.check_auth(authorization)
    base = router.state.safe_cwd(cwd) if cwd else router.state.default_cwd
    if target:
        result = _run_git(base, "diff", "--", target)
    else:
        result = _run_git(base, "diff")
    if result.returncode != 0:
        return {"diff": "", "files": []}
    diff_lines = result.stdout
    files_changed = []
    for line in diff_lines.split('\n'):
        if line.startswith('diff --git '):
            parts = line.split(' b/')
            if len(parts) > 1:
                files_changed.append(parts[-1])
    return {"diff": diff_lines, "files": files_changed}


@router.get("/git/diff/staged")
async def git_diff_staged(authorization: Optional[str] = Header(default=None), cwd: str = ""):
    router.state.check_auth(authorization)
    base = router.state.safe_cwd(cwd) if cwd else router.state.default_cwd
    result = _run_git(base, "diff", "--cached")
    return {"diff": result.stdout}


@router.post("/git/add")
async def git_add(authorization: Optional[str] = Header(default=None), cwd: str = "", file: str = ""):
    router.state.check_auth(authorization)
    base = router.state.safe_cwd(cwd) if cwd else router.state.default_cwd
    result = _run_git(base, "add", file)
    if result.returncode != 0:
        raise HTTPException(status_code=400, detail=result.stderr)
    return {"success": True}


@router.post("/git/reset")
async def git_reset(authorization: Optional[str] = Header(default=None), cwd: str = "", file: str = ""):
    router.state.check_auth(authorization)
    base = router.state.safe_cwd(cwd) if cwd else router.state.default_cwd
    result = _run_git(base, "reset", "HEAD", file)
    if result.returncode != 0:
        raise HTTPException(status_code=400, detail=result.stderr)
    return {"success": True}


@router.post("/git/commit")
async def git_commit(authorization: Optional[str] = Header(default=None), cwd: str = "", message: str = ""):
    router.state.check_auth(authorization)
    if not message:
        raise HTTPException(status_code=400, detail="Commit message required")
    base = router.state.safe_cwd(cwd) if cwd else router.state.default_cwd
    result = _run_git(base, "commit", "-m", message)
    if result.returncode != 0:
        raise HTTPException(status_code=400, detail=result.stderr)
    return {"success": True, "message": message}


@router.post("/git/checkout")
async def git_checkout(
    authorization: Optional[str] = Header(default=None),
    cwd: str = "",
    target: str = "",
    create_branch: bool = False,
):
    router.state.check_auth(authorization)
    base = router.state.safe_cwd(cwd) if cwd else router.state.default_cwd
    if create_branch:
        result = _run_git(base, "checkout", "-b", target)
    else:
        result = _run_git(base, "checkout", target)
    if result.returncode != 0:
        raise HTTPException(status_code=400, detail=result.stderr)
    return {"success": True}


@router.get("/git/branches")
async def git_branches(authorization: Optional[str] = Header(default=None), cwd: str = ""):
    router.state.check_auth(authorization)
    base = router.state.safe_cwd(cwd) if cwd else router.state.default_cwd
    result = _run_git(base, "branch", "-a", "--format=%(refname:short)|%(HEAD)")
    if result.returncode != 0:
        return {"branches": []}
    branches = []
    for line in result.stdout.strip().split('\n'):
        if '|' not in line:
            continue
        name, head = line.split('|', 1)
        branches.append({"name": name, "current": head == "*"})
    return {"branches": branches}
