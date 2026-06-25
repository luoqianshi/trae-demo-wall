"""
File CRUD routes.
"""

import os
import shutil
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, Header, HTTPException

router = APIRouter(prefix="/api", tags=["file"])


@router.get("/files")
async def list_files(authorization: Optional[str] = Header(default=None), path: str = ""):
    router.state.check_auth(authorization)
    base = router.state.safe_cwd(path) if path else router.state.default_cwd
    if not os.path.isdir(base):
        raise HTTPException(status_code=404, detail="Directory not found")
    nodes = []
    try:
        for entry in sorted(os.scandir(base), key=lambda e: (not e.is_dir(), e.name.lower())):
            if entry.name.startswith('.'):
                continue
            nodes.append({
                "name": entry.name,
                "path": str(Path(entry.path)),
                "type": "directory" if entry.is_dir() else "file",
                "size": entry.stat().st_size if entry.is_file() else None,
            })
    except PermissionError:
        pass
    return {"files": nodes}


@router.get("/files/content")
async def read_file(authorization: Optional[str] = Header(default=None), path: str = ""):
    router.state.check_auth(authorization)
    safe_path = router.state.safe_cwd(path)
    if not os.path.isfile(safe_path):
        raise HTTPException(status_code=404, detail="File not found")
    try:
        with open(safe_path, 'r', encoding='utf-8', errors='replace') as f:
            return {"content": f.read(), "path": safe_path}
    except PermissionError:
        raise HTTPException(status_code=403, detail="Permission denied")


@router.post("/files")
async def create_file(
    authorization: Optional[str] = Header(default=None),
    path: str = "",
    is_directory: bool = False,
):
    router.state.check_auth(authorization)
    safe_path = router.state.safe_cwd(path)
    if os.path.exists(safe_path):
        raise HTTPException(status_code=409, detail="File already exists")
    try:
        if is_directory:
            os.makedirs(safe_path, exist_ok=True)
        else:
            os.makedirs(os.path.dirname(safe_path), exist_ok=True)
            Path(safe_path).touch()
        return {"success": True, "path": safe_path}
    except PermissionError:
        raise HTTPException(status_code=403, detail="Permission denied")


@router.put("/files")
async def update_file(
    authorization: Optional[str] = Header(default=None),
    path: str = "",
    content: str = "",
):
    router.state.check_auth(authorization)
    safe_path = router.state.safe_cwd(path)
    if not os.path.isfile(safe_path):
        raise HTTPException(status_code=404, detail="File not found")
    try:
        with open(safe_path, 'w', encoding='utf-8') as f:
            f.write(content)
        return {"success": True, "path": safe_path}
    except PermissionError:
        raise HTTPException(status_code=403, detail="Permission denied")


@router.delete("/files")
async def delete_file(authorization: Optional[str] = Header(default=None), path: str = ""):
    router.state.check_auth(authorization)
    safe_path = router.state.safe_cwd(path)
    if not os.path.exists(safe_path):
        raise HTTPException(status_code=404, detail="File not found")
    try:
        if os.path.isdir(safe_path):
            shutil.rmtree(safe_path)
        else:
            os.remove(safe_path)
        return {"success": True, "path": safe_path}
    except PermissionError:
        raise HTTPException(status_code=403, detail="Permission denied")


@router.post("/files/rename")
async def rename_file(
    authorization: Optional[str] = Header(default=None),
    old_path: str = "",
    new_path: str = "",
):
    router.state.check_auth(authorization)
    safe_old = router.state.safe_cwd(old_path)
    safe_new = router.state.safe_cwd(new_path)
    if not os.path.exists(safe_old):
        raise HTTPException(status_code=404, detail="Source not found")
    if os.path.exists(safe_new):
        raise HTTPException(status_code=409, detail="Destination already exists")
    try:
        os.makedirs(os.path.dirname(safe_new), exist_ok=True)
        shutil.move(safe_old, safe_new)
        return {"success": True, "path": safe_new}
    except PermissionError:
        raise HTTPException(status_code=403, detail="Permission denied")


@router.get("/files/search")
async def search_files(
    authorization: Optional[str] = Header(default=None),
    cwd: str = "",
    query: str = "",
    max_results: int = 50,
):
    router.state.check_auth(authorization)
    base = router.state.safe_cwd(cwd) if cwd else router.state.default_cwd
    if not query:
        raise HTTPException(status_code=400, detail="Query parameter required")
    results = []
    query_lower = query.lower()
    try:
        for root, dirs, files in os.walk(base):
            dirs[:] = [d for d in dirs if not d.startswith('.') and d not in ('node_modules', '__pycache__', 'dist', 'build')]
            for name in files + dirs:
                if query_lower in name.lower():
                    full = os.path.join(root, name)
                    results.append({
                        "name": name,
                        "path": full,
                        "type": "directory" if os.path.isdir(full) else "file",
                    })
                    if len(results) >= max_results:
                        break
            if len(results) >= max_results:
                break
    except PermissionError:
        pass
    return {"results": results}
