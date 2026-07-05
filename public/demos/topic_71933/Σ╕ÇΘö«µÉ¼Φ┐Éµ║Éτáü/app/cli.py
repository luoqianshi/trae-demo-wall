"""CLI 命令行入口 — 提供快速操作命令。"""

import asyncio
import sys

import click
from rich.console import Console
from rich.table import Table

console = Console()


@click.group()
def main():
    """🎬 一键搬运 — 短视频解析、去重、分发工具"""
    pass


@main.command()
@click.argument("url")
def parse(url: str):
    """解析视频链接，显示源信息。"""
    from app.services.downloader import VideoDownloader

    async def _run():
        dl = VideoDownloader()
        try:
            source = await dl.parse_url(url)
            table = Table(title="视频信息")
            table.add_column("字段", style="cyan")
            table.add_column("值", style="green")
            table.add_row("平台", source.platform.value)
            table.add_row("标题", source.title)
            table.add_row("作者", source.author)
            table.add_row("时长", f"{source.duration:.1f}s")
            table.add_row("标签", ", ".join(source.tags) if source.tags else "无")
            table.add_row("视频地址", source.video_url[:80] + "..." if len(source.video_url) > 80 else source.video_url)
            console.print(table)
        except Exception as e:
            console.print(f"[red]解析失败: {e}[/red]")
        finally:
            await dl.close()

    asyncio.run(_run())


@main.command()
@click.argument("url")
@click.option("--no-dedup", is_flag=True, help="跳过去重处理")
@click.option("--speed-min", default=0.95, help="最小变速倍率")
@click.option("--speed-max", default=1.05, help="最大变速倍率")
def download(url: str, no_dedup: bool, speed_min: float, speed_max: float):
    """下载视频并可选执行去重处理。"""
    from app.services.downloader import VideoDownloader
    from app.services.deduplicator import DedupConfig, VideoDeduplicator

    async def _run():
        dl = VideoDownloader()
        try:
            console.print(f"[cyan]解析链接...[/cyan]")
            source = await dl.parse_url(url)
            console.print(f"[green]✓ 平台: {source.platform.value} | 标题: {source.title}[/green]")

            console.print(f"[cyan]下载中...[/cyan]")
            path = await dl.download(source)
            console.print(f"[green]✓ 已下载: {path}[/green]")

            if not no_dedup:
                console.print(f"[cyan]去重处理中...[/cyan]")
                config = DedupConfig(
                    change_speed=True,
                    speed_min=speed_min,
                    speed_max=speed_max,
                )
                dedup = VideoDeduplicator(config)
                result = dedup.process(path)
                if result.success:
                    console.print(f"[green]✓ 去重完成: {result.output_path}[/green]")
                    console.print(f"  操作: {', '.join(result.operations)}")
                    console.print(f"  MD5: {result.original_md5[:12]} → {result.output_md5[:12]}")
                else:
                    console.print(f"[red]✗ 去重失败: {result.error}[/red]")

        except Exception as e:
            console.print(f"[red]错误: {e}[/red]")
        finally:
            await dl.close()

    asyncio.run(_run())


@main.command()
@click.option("--host", default="0.0.0.0", help="监听地址")
@click.option("--port", default=8000, type=int, help="监听端口")
@click.option("--reload", is_flag=True, development_default=True, help="热重载")
def serve(host: str, port: int, reload: bool):
    """启动 Web API 服务。"""
    import uvicorn
    console.print(f"[green]🚀 启动服务: http://{host}:{port}[/green]")
    console.print(f"[cyan]📖 API 文档: http://{host}:{port}/docs[/cyan]")
    uvicorn.run("app.main:app", host=host, port=port, reload=reload)


@main.command()
def info():
    """显示环境信息。"""
    import shutil
    from app.core.config import get_settings

    settings = get_settings()

    table = Table(title="环境信息")
    table.add_column("项目", style="cyan")
    table.add_column("值", style="green")
    table.add_row("应用名", settings.app_name)
    table.add_row("环境", settings.app_env)
    table.add_row("存储目录", str(settings.storage_dir))
    table.add_row("FFmpeg", shutil.which("ffmpeg") or "[red]未安装[/red]")
    table.add_row("快手 APP ID", settings.kuaishou_app_id or "[yellow]未配置[/yellow]")
    console.print(table)


if __name__ == "__main__":
    main()
