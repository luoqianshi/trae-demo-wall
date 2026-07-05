"""浏览器自动化 API 路由。"""

from pathlib import Path

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.core.config import get_settings
from app.services.browser_publisher import get_browser_publisher

router = APIRouter(prefix="/api/v1/browser")


class LoginResponse(BaseModel):
    success: bool
    message: str = ""
    screenshot: str = ""
    error: str = ""


class PublishRequest(BaseModel):
    task_id: str = Field(description="已处理的任务 ID")
    title: str = Field(default="", description="发布标题")
    tags: list[str] = Field(default_factory=list, description="标签列表")
    account_id: str = Field(default="", description="账号 ID")


class PublishResponse(BaseModel):
    success: bool
    message: str = ""
    screenshot: str = ""
    error: str = ""


class AccountRequest(BaseModel):
    account_id: str = Field(default="", description="账号 ID")


@router.get("/status")
async def browser_status():
    """检查浏览器和登录状态。"""
    publisher = await get_browser_publisher()
    if not publisher.context:
        user_data = publisher.browser_data_dir
        has_cookies = user_data.exists() and any(user_data.iterdir()) if user_data.exists() else False
        return {
            "running": False,
            "logged_in": False,
            "has_cookies": has_cookies,
            "current_account": publisher.current_account_id,
        }
    try:
        status = await publisher.check_login()
        return {"running": True, "current_account": publisher.current_account_id, **status}
    except Exception as e:
        return {"running": True, "logged_in": False, "current_account": publisher.current_account_id, "error": str(e)}


@router.post("/start")
async def start_browser(headless: bool = True):
    """启动浏览器（headless=true 无头模式）。"""
    publisher = await get_browser_publisher()
    if publisher.context:
        status = await publisher.check_login()
        return {"message": "浏览器已在运行", **status}
    await publisher.start(headless=headless)
    status = await publisher.check_login()
    return {"message": "浏览器已启动", **status}


@router.post("/login/qrcode")
async def login_qrcode():
    """打开有头浏览器，显示快手登录页供用户扫码。"""
    try:
        publisher = await get_browser_publisher()
        result = await publisher.login_with_qrcode()
        return result
    except Exception as e:
        return {"success": False, "error": str(e)}


@router.post("/login/wait")
async def login_wait(timeout: int = 180):
    """等待扫码登录完成（默认180秒超时）。"""
    try:
        publisher = await get_browser_publisher()
        result = await publisher.wait_for_login(timeout=timeout)
        return result
    except Exception as e:
        return {"success": False, "error": str(e)}


@router.post("/publish")
async def browser_publish(req: PublishRequest):
    """通过浏览器自动发布视频到快手。"""
    from app.services.task_manager import task_manager
    from app.models.video import VideoTaskStatus

    task = task_manager.get_task(req.task_id)
    if not task:
        raise HTTPException(404, f"任务不存在: {req.task_id}")
    if task.status not in (VideoTaskStatus.DOWNLOADED, VideoTaskStatus.PROCESSED, VideoTaskStatus.PUBLISHED):
        raise HTTPException(400, f"任务状态不允许发布: {task.status.value}")

    video_path = Path(task.output_path or task.local_path)
    if not video_path.exists():
        raise HTTPException(400, f"视频文件不存在: {video_path}")

    publisher = await get_browser_publisher()
    title = req.title or task.source.title
    tags = req.tags or task.source.tags

    # 切换账号
    if req.account_id:
        from app.services.task_manager import task_manager as tm
        await publisher.set_account(req.account_id)
        # 确保浏览器重新启动
        if not publisher.context:
            await publisher.start(headless=True)

    task_manager.update_status(req.task_id, VideoTaskStatus.PUBLISHING)
    result = await publisher.publish_video(video_path, title=title, tags=tags)
    if result.get("success"):
        task_manager.update_status(req.task_id, VideoTaskStatus.PUBLISHED)
        task_manager.update_task(req.task_id, publish_result=result)
    else:
        task_manager.update_status(req.task_id, VideoTaskStatus.FAILED, result.get("error", "发布失败"))
    return result


@router.post("/switch-account")
async def switch_account(req: AccountRequest):
    """切换浏览器数据目录。"""
    publisher = await get_browser_publisher()
    await publisher.set_account(req.account_id)
    return {"success": True, "account_id": publisher.current_account_id}


@router.post("/remove-account")
async def remove_account(req: AccountRequest):
    """删除指定账号数据目录。"""
    if not req.account_id:
        raise HTTPException(400, "缺少 account_id")
    publisher = await get_browser_publisher()
    return await publisher.remove_account(req.account_id)


@router.post("/stop")
async def stop_browser():
    """关闭浏览器。"""
    publisher = await get_browser_publisher()
    await publisher.stop()
    return {"message": "浏览器已关闭"}
