"""视频相关数据模型。"""

from datetime import datetime
from enum import Enum
from pathlib import Path

from pydantic import BaseModel, Field


class Platform(str, Enum):
    """支持的视频平台。"""
    DOUYIN = "douyin"
    KUAISHOU = "kuaishou"
    UNKNOWN = "unknown"


class VideoSource(BaseModel):
    """解析后的视频源信息。"""
    url: str = Field(description="视频原始分享链接")
    video_url: str = Field(default="", description="真实视频下载地址")
    cover_url: str = Field(default="", description="封面图地址")
    title: str = Field(default="", description="视频标题")
    description: str = Field(default="", description="视频描述")
    tags: list[str] = Field(default_factory=list, description="标签列表")
    duration: float = Field(default=0, description="视频时长（秒）")
    platform: Platform = Field(default=Platform.UNKNOWN)
    author: str = Field(default="", description="作者名")


class VideoTaskStatus(str, Enum):
    """视频处理任务状态。"""
    PENDING = "pending"
    DOWNLOADING = "downloading"
    DOWNLOADED = "downloaded"
    PROCESSING = "processing"
    PROCESSED = "processed"
    PUBLISHING = "publishing"
    PUBLISHED = "published"
    FAILED = "failed"


class VideoTask(BaseModel):
    """视频处理任务。"""
    id: str = Field(description="任务唯一 ID")
    source: VideoSource
    status: VideoTaskStatus = VideoTaskStatus.PENDING
    local_path: str = Field(default="", description="下载后的本地路径")
    output_path: str = Field(default="", description="去重处理后的输出路径")
    error_message: str = Field(default="")
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    started_at: datetime | None = Field(default=None, description="任务开始执行时间")
    completed_at: datetime | None = Field(default=None, description="任务完成时间")
    publish_result: dict = Field(default_factory=dict, description="发布结果")

    def update_status(self, status: VideoTaskStatus, error: str = "") -> None:
        self.status = status
        self.error_message = error
        self.updated_at = datetime.now()
        if status == VideoTaskStatus.DOWNLOADING and self.started_at is None:
            self.started_at = datetime.now()
        if status in (VideoTaskStatus.PROCESSED, VideoTaskStatus.PUBLISHED, VideoTaskStatus.FAILED):
            if self.completed_at is None:
                self.completed_at = datetime.now()
