"""API 请求/响应数据模型。"""

from pydantic import BaseModel, Field

from app.models.video import VideoTaskStatus


class FilterInfo(BaseModel):
    key: str
    name: str
    weight: int


class FilterListResponse(BaseModel):
    filters: list[FilterInfo]


class ParseRequest(BaseModel):
    url: str = Field(description="视频分享链接")


class ParseResponse(BaseModel):
    platform: str
    title: str
    video_url: str
    cover_url: str
    duration: float
    author: str
    tags: list[str]


class TaskCreateRequest(BaseModel):
    url: str = Field(description="视频分享链接")
    dedup: bool = Field(default=True, description="是否执行去重处理")
    speed_min: float = Field(default=0.95, description="最小变速倍率")
    speed_max: float = Field(default=1.05, description="最大变速倍率")
    change_framerate: bool = Field(default=False, description="帧率微调")
    change_resolution: bool = Field(default=False, description="分辨率微调")
    custom_filters: list[str] = Field(default=["color_shift", "padding_shift", "audio_pitch", "bitrate_shift", "crop_zoom", "gop_restructure"], description="去重滤镜列表（默认推荐组合：调色微调+画面偏移+音频微调+码率微调+裁剪缩放+帧结构重排）")
    filter_level: str = Field(default="medium", description="滤镜强度: light/medium/heavy")


class TaskResponse(BaseModel):
    id: str
    url: str
    platform: str
    title: str
    status: str
    local_path: str
    output_path: str
    error_message: str
    publish_result: dict = {}
    created_at: str
    updated_at: str
    started_at: str = ""
    completed_at: str = ""
    queue_status: str = ""
    queue_position: int = 0


class TaskListResponse(BaseModel):
    total: int
    tasks: list[TaskResponse]


class PublishRequest(BaseModel):
    task_id: str = Field(description="已完成去重的任务 ID")
    platform: str = Field(default="kuaishou", description="发布平台")
    title: str = Field(default="", description="发布标题")
    tags: list[str] = Field(default_factory=list, description="标签列表")


class PublishResponse(BaseModel):
    success: bool
    photo_id: str = ""
    export_dir: str = ""
    error: str = ""


class ErrorResponse(BaseModel):
    detail: str


class BatchCreateRequest(BaseModel):
    urls: list[str] = Field(description="视频链接列表")
    dedup: bool = Field(default=True)
    speed_min: float = Field(default=0.95)
    speed_max: float = Field(default=1.05)
    change_framerate: bool = Field(default=False)
    change_resolution: bool = Field(default=False)
    custom_filters: list[str] = Field(default=["color_shift", "padding_shift", "audio_pitch", "bitrate_shift", "crop_zoom", "gop_restructure"])
    filter_level: str = Field(default="medium")
