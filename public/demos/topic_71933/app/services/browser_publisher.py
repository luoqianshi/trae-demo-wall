"""快手浏览器自动化发布服务（v3 — Playwright headed login + headless publish）。

流程：
1. 首次：启动有头 Playwright 浏览器 → 用户扫码登录快手 → Cookie 自动保存到 persistent context
2. 后续：复用 saved cookies 以无头模式自动登录 → 自动上传发布
"""

import asyncio
import json
from datetime import datetime
from pathlib import Path
import shutil

from loguru import logger

from app.core.config import get_settings


CREATOR_URL = "https://cp.kuaishou.com/article/publish/video"
LOGIN_URL = "https://cp.kuaishou.com/"


class BrowserPublisher:
    """快手浏览器自动化发布器。"""

    def __init__(self):
        self.settings = get_settings()
        self.browser_data_dir = Path(self.settings.storage_dir) / "pw_browser_data"
        self._pw = None
        self.browser = None
        self.context = None
        self.page = None
        self._headless = True

    @property
    def accounts_root(self) -> Path:
        return Path(self.settings.storage_dir) / "pw_browser_accounts"

    @property
    def current_account_id(self) -> str:
        try:
            parent = self.browser_data_dir.parent.resolve()
            if parent == self.accounts_root.resolve():
                return self.browser_data_dir.name
        except Exception:
            pass
        return ""

    async def start(self, headless: bool = True):
        """启动 Playwright 浏览器。"""
        # 先清理旧实例
        if self.context or self._pw:
            try:
                if self.page:
                    _ = self.page.url  # 检查是否还有效
                    if not self._headless and headless:
                        # 从有头切到无头，不需要重启
                        return
                    return
            except Exception:
                pass
            await self.stop()

        from playwright.async_api import async_playwright
        try:
            self._pw = await async_playwright().start()
        except Exception as e:
            logger.error("Playwright 启动失败: {}", e)
            self._pw = None
            raise

        self._headless = headless
        self.browser_data_dir.mkdir(parents=True, exist_ok=True)

        try:
            self.context = await self._pw.chromium.launch_persistent_context(
                str(self.browser_data_dir),
                headless=headless,
                viewport={"width": 1280, "height": 800},
                user_agent=(
                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/125.0.0.0 Safari/537.36"
                ),
                args=["--disable-blink-features=AutomationControlled"],
            )
            self.page = self.context.pages[0] if self.context.pages else await self.context.new_page()
            logger.info("浏览器启动 headless={}", headless)
        except Exception as e:
            logger.error("浏览器启动失败: {}", e)
            await self._pw.stop()
            self._pw = None
            self.context = None
            self.page = None
            raise

    async def stop(self):
        """关闭浏览器。"""
        try:
            if self.context:
                await self.context.close()
        except Exception:
            pass
        try:
            if self._pw:
                await self._pw.stop()
        except Exception:
            pass
        self.context = None
        self.page = None
        self._pw = None
        self.page = None
        self._pw = None
        logger.info("浏览器已关闭")

    async def set_account(self, account_id: str = "") -> None:
        """切换当前账号的数据目录。"""
        if account_id:
            self.browser_data_dir = self.accounts_root / account_id
        else:
            self.browser_data_dir = Path(self.settings.storage_dir) / "pw_browser_data"
        self.browser_data_dir.mkdir(parents=True, exist_ok=True)
        await self.stop()
        logger.info("已切换账号数据目录: {}", self.browser_data_dir)

    async def remove_account(self, account_id: str) -> dict:
        """删除指定账号数据目录。"""
        target_dir = self.accounts_root / account_id
        if target_dir.exists():
            if self.current_account_id == account_id:
                await self.stop()
                self.browser_data_dir = Path(self.settings.storage_dir) / "pw_browser_data"
            shutil.rmtree(target_dir, ignore_errors=True)
            logger.info("已删除账号数据目录: {}", target_dir)
            return {"success": True, "message": "账号已删除", "account_id": account_id}

        # 账号无独立目录（cookies 在默认目录中），清除默认目录
        default_dir = Path(self.settings.storage_dir) / "pw_browser_data"
        if default_dir.exists():
            await self.stop()
            shutil.rmtree(default_dir, ignore_errors=True)
            default_dir.mkdir(parents=True, exist_ok=True)
            logger.info("账号无独立目录，已清除默认浏览器数据: {}", default_dir)
            return {"success": True, "message": "账号已删除", "account_id": account_id}

        return {"success": True, "message": "无数据可删除"}

    async def _safe_screenshot(self, path: str) -> str:
        """安全截图，page 为 None 时不崩溃。"""
        try:
            if self.page:
                await self.page.screenshot(path=path)
                return path
        except Exception as e:
            logger.debug("截图失败: {}", e)
        return ""


    async def check_login(self) -> dict:
        """检查快手创作者平台登录状态。"""
        # 确保浏览器正在运行
        try:
            if not self.context or not self.page:
                raise Exception("no context")
            _ = self.page.url  # 验证页面还活着
        except Exception:
            logger.info("浏览器不可用，自动重启...")
            await self.stop()
            try:
                await self.start(headless=True)
            except Exception as e:
                return {"logged_in": False, "error": f"浏览器启动失败: {e}"}

        try:
            await self.page.goto(CREATOR_URL, wait_until="domcontentloaded", timeout=20000)
            await asyncio.sleep(5)

            url = self.page.url
            html = await self.page.content()

            body_text = ""
            try:
                body_text = await self.page.locator("body").inner_text()
            except Exception:
                pass
            
            has_user_account = any(kw in body_text for kw in ["退出", "812女装"]) or "退出" in html
            has_file_input = await self.page.locator('input[type="file"]').count() > 0
            has_login_modal = any(kw in html for kw in ["账号登录", "扫码登录", "手机号登录", "快手APP登录"])
            is_login_page = "login" in url.lower() or "passport" in url.lower()

            logged_in = (has_user_account or has_file_input) and not has_login_modal and not is_login_page

            if not logged_in:
                ss = str(self.settings.storage_dir / "login_check.png")
                await self.page.screenshot(path=ss)
                logger.info("未登录，截图保存: {}", ss)

            return {"logged_in": logged_in, "url": url}

        except Exception as e:
            logger.error("检查登录异常: {}，尝试重建浏览器", e)
            # 页面导航失败，可能是 context 被关了，重建
            await self.stop()
            try:
                await self.start(headless=True)
            except Exception:
                pass
            return {"logged_in": False, "error": str(e)}

    async def login_with_qrcode(self) -> dict:
        """启动有头浏览器让用户扫码登录。"""
        # 如果当前是无头模式，先关闭再用有头模式启动
        if self.context and self._headless:
            await self.stop()

        if not self.context:
            await self.start(headless=False)

        try:
            # 先导航到创作者平台（会自动重定向到登录页）
            await self.page.goto(CREATOR_URL, wait_until="domcontentloaded", timeout=20000)
            await asyncio.sleep(3)

            html = await self.page.content()
            
            # 如果页面有"立即登录"按钮，点击它
            if "立即登录" in html:
                logger.info("检测到「立即登录」按钮，点击...")
                try:
                    login_btn = self.page.locator('text=立即登录').first
                    if await login_btn.count() > 0:
                        await login_btn.click()
                        await asyncio.sleep(3)
                except Exception as e:
                    logger.debug("点击立即登录失败: {}", e)

            # 如果有扫码登录选项，点击切换到扫码
            html = await self.page.content()
            if "扫码登录" in html:
                try:
                    qr_tab = self.page.locator('text=扫码登录').first
                    if await qr_tab.count() > 0:
                        await qr_tab.click()
                        await asyncio.sleep(2)
                except Exception:
                    pass

            screenshot_path = str(self.settings.storage_dir / "login_qrcode.png")
            await self.page.screenshot(path=screenshot_path)
            logger.info("登录页面截图: {}", screenshot_path)

            return {
                "success": True,
                "message": "浏览器已打开，请在弹出的浏览器窗口中扫码登录快手",
                "screenshot": screenshot_path,
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def wait_for_login(self, timeout: int = 180) -> dict:
        """等待用户扫码登录完成。"""
        try:
            start = datetime.now()
            while (datetime.now() - start).seconds < timeout:
                await asyncio.sleep(3)
                url = self.page.url
                html = await self.page.content()

                # 检查是否已经跳转到创作者平台（非登录页）
                if "cp.kuaishou.com" in url and "login" not in url.lower():
                    # 进一步确认页面有用户账号或文件上传（真正的已登录标志）
                    body_text = ""
                    try:
                        body_text = await self.page.locator("body").inner_text()
                    except Exception:
                        pass
                    has_user_account = any(kw in body_text for kw in ["退出"]) or "退出" in html
                    has_file_input = await self.page.locator('input[type="file"]').count() > 0
                    has_login_modal = any(kw in html for kw in ["账号登录", "扫码登录", "立即登录"])
                    
                    if (has_user_account or has_file_input) and not has_login_modal:
                        logger.info("登录成功！检测到上传区域")
                        # 确保 cookies 被保存
                        try:
                            await self.context.storage_state()
                        except Exception:
                            pass
                        return {"success": True, "message": "登录成功"}

            return {"success": False, "error": f"登录超时（{timeout}秒）"}

        except Exception as e:
            return {"success": False, "error": str(e)}

    async def publish_video(self, video_path: Path, title: str = "", tags: list[str] | None = None) -> dict:
        """自动上传并发布视频。"""
        # 确保浏览器和页面可用
        if not self.context or not self.page:
            try:
                await self.stop()
            except Exception:
                pass
            await self.start(headless=True)
        else:
            # 验证页面还活着
            try:
                _ = self.page.url
            except Exception:
                logger.info("页面已失效，重新启动浏览器")
                try:
                    await self.stop()
                except Exception:
                    pass
                await self.start(headless=True)

        return await self._do_publish(video_path, title, tags or [])

    async def _do_publish(self, video_path: Path, title: str, tags: list[str], retry: bool = False) -> dict:
        """实际发布逻辑（基于快手真实 DOM 结构）。"""
        try:
            # 1. 打开发布页并检查登录
            logger.info("打开发布页...")
            await self.page.goto(CREATOR_URL, wait_until="domcontentloaded", timeout=30000)
            await asyncio.sleep(5)

            html = await self.page.content()
            has_login = any(kw in html for kw in ["账号登录", "扫码登录", "手机号登录", "快手APP登录", "立即登录"])
            if has_login or "login" in self.page.url.lower():
                ss = str(self.settings.storage_dir / "need_login.png")
                await self.page.screenshot(path=ss)
                return {"success": False, "error": "未登录", "screenshot": ss}

            # 2. 关闭草稿弹窗（主文档中的按钮，不是 Shadow DOM）
            try:
                abandon = self.page.locator('button._renounce-btn_1788x_79:has-text("放弃")')
                if await abandon.count() > 0 and await abandon.is_visible():
                    await abandon.click()
                    logger.info("已关闭草稿弹窗")
                    await asyncio.sleep(2)
            except Exception:
                # 备选：用文字匹配
                try:
                    btns = self.page.locator('button')
                    count = await btns.count()
                    for i in range(count):
                        text = await btns.nth(i).inner_text()
                        if '放弃' in text and await btns.nth(i).is_visible():
                            await btns.nth(i).click()
                            logger.info("已关闭草稿弹窗（备选）")
                            await asyncio.sleep(2)
                            break
                except Exception:
                    pass

            # 3. 上传视频 — 使用 file_chooser 方式（最可靠）
            logger.info("上传视频: {}", video_path.name)
            upload_triggered = False
            
            # 方法1: 通过点击上传按钮触发 file chooser
            try:
                upload_btn = self.page.locator('button:has-text("上传视频"), [class*="upload-btn"], [class*="_upload-btn"]').first
                if await upload_btn.count() > 0 and await upload_btn.is_visible():
                    async with self.page.expect_file_chooser(timeout=10000) as fc_info:
                        await upload_btn.click()
                    file_chooser = await fc_info.value
                    await file_chooser.set_files(str(video_path))
                    upload_triggered = True
                    logger.info("通过 file_chooser + 按钮上传")
            except Exception as e:
                logger.debug("file_chooser 方式1失败: {}", e)
            
            # 方法2: 直接找 input[type=file] 并设置
            if not upload_triggered:
                try:
                    fi = self.page.locator('input[type="file"]').first
                    if await fi.count() > 0:
                        await fi.set_input_files(str(video_path))
                        upload_triggered = True
                        logger.info("通过 input[type=file] set_input_files 上传")
                except Exception as e:
                    logger.debug("input[type=file] 方式失败: {}", e)
            
            # 方法3: 通过 JS 注入触发 file chooser
            if not upload_triggered:
                try:
                    async with self.page.expect_file_chooser(timeout=10000) as fc_info:
                        await self.page.evaluate("""() => {
                            const input = document.querySelector('input[type="file"]');
                            if (input) input.click();
                        }""")
                    file_chooser = await fc_info.value
                    await file_chooser.set_files(str(video_path))
                    upload_triggered = True
                    logger.info("通过 JS click + file_chooser 上传")
                except Exception as e:
                    logger.debug("JS click 方式失败: {}", e)
            
            if not upload_triggered:
                ss = str(self.settings.storage_dir / "upload_failed.png")
                await self.page.screenshot(path=ss)
                return {"success": False, "error": "无法触发视频上传", "screenshot": ss}

            # 4. 等待上传完成 + 填写描述（同步进行）
            logger.info("等待上传完成并填写描述...")
            upload_done = False
            desc_filled = False
            
            for i in range(180):
                await asyncio.sleep(2)
                elapsed = i * 2
                
                state = await self.page.evaluate("""() => {
                    const body = document.body.innerText || '';
                    const result = {upload: 'waiting', hasTitleField: false, titleValue: '', error: null};
                    
                    for (const kw of ['上传失败', '文件格式不支持', '文件过大']) {
                        if (body.includes(kw)) { result.error = kw; return result; }
                    }
                    for (const kw of ['重新上传', '封面设置', '预览封面', '智能推荐封面', '更改封面']) {
                        if (body.includes(kw)) { result.upload = 'done'; result.signal = kw; break; }
                    }
                    const tas = document.querySelectorAll('textarea');
                    for (const ta of tas) {
                        if (ta.placeholder && (ta.placeholder.includes('标题') || ta.placeholder.includes('描述')) && ta.offsetWidth > 0) {
                            result.hasTitleField = true;
                            result.titleValue = ta.value || '';
                            break;
                        }
                    }
                    return result;
                }""")
                
                if state.get('error'):
                    ss = str(self.settings.storage_dir / "upload_error.png")
                    await self.page.screenshot(path=ss)
                    return {"success": False, "error": f"上传失败: {state['error']}", "screenshot": ss}
                
                if state['upload'] == 'done' and not upload_done:
                    upload_done = True
                    logger.info("上传完成: {} ({}s)", state.get('signal', ''), elapsed)
                    
                    if title:
                        try:
                            filled = await self.page.evaluate("""(title) => {
                                const tas = document.querySelectorAll('textarea');
                                for (const ta of tas) {
                                    if (ta.placeholder && (ta.placeholder.includes('标题') || ta.placeholder.includes('描述')) && ta.offsetWidth > 0) {
                                        ta.value = title;
                                        ta.dispatchEvent(new Event('input', {bubbles: true}));
                                        ta.dispatchEvent(new Event('change', {bubbles: true}));
                                        return true;
                                    }
                                }
                                return false;
                            }""", title)
                            if filled: logger.info("标题已填写")
                        except Exception as e:
                            logger.warning("填写标题失败: {}", e)
                    
                    if tags:
                        try:
                            await self.page.evaluate("""(tags) => {
                                let tagInput = null;
                                for (const sel of ['input[placeholder*="标签"]', 'input[placeholder*="话题"]', 'input[placeholder*="#"]']) {
                                    const els = document.querySelectorAll(sel);
                                    for (const el of els) { if (el.offsetWidth > 0) { tagInput = el; break; } }
                                    if (tagInput) break;
                                }
                                if (!tagInput) return;
                                for (const tag of tags.slice(0, 5)) {
                                    tagInput.value = tag;
                                    tagInput.dispatchEvent(new Event('input', {bubbles: true}));
                                    tagInput.dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter', keyCode: 13, bubbles: true}));
                                    tagInput.dispatchEvent(new KeyboardEvent('keyup', {key: 'Enter', keyCode: 13, bubbles: true}));
                                }
                            }""", tags)
                            logger.info("标签已填写")
                        except Exception as e:
                            logger.warning("填写标签失败: {}", e)
                    
                    await asyncio.sleep(1)
                
                if upload_done and state.get('hasTitleField') and not desc_filled:
                    desc_filled = True
                    logger.info("描述字段已就绪")
                
                if upload_done and desc_filled:
                    logger.info("上传+描述均完成 ({}s)", elapsed)
                    break
                
                if upload_done and elapsed > 15:
                    logger.info("上传完成，描述字段等待超时，继续发布")
                    break
                
                if not upload_done and elapsed % 30 == 0 and elapsed > 0:
                    logger.info("上传进行中... ({}s)", elapsed)
            
            if not upload_done:
                ss = str(self.settings.storage_dir / "upload_timeout.png")
                await self.page.screenshot(path=ss)
                return {"success": False, "error": "视频上传超时", "screenshot": ss}

            # 5. 移除 Joyride 引导蒙层
            try:
                await self.page.evaluate("""() => {
                    const p = document.getElementById('react-joyride-portal');
                    if (p) p.remove();
                    document.querySelectorAll('[class*="joyride"]').forEach(el => el.remove());
                    document.body.style.overflow = '';
                }""")
            except Exception:
                pass

            # 6. 截图确认
            await self.page.screenshot(path=str(self.settings.storage_dir / "publish_preview.png"))

            # 7. 点击发布按钮（用 JS 点击，避免 DOM 重渲染导致元素脱离）
            logger.info("点击发布...")
            try:
                clicked = await self.page.evaluate("""() => {
                    // 找表单底部的发布按钮
                    const btns = document.querySelectorAll('[class*="_button-primary"]');
                    for (const btn of btns) {
                        if (btn.innerText?.includes('发布') && btn.offsetWidth > 0) {
                            btn.scrollIntoView();
                            btn.click();
                            return true;
                        }
                    }
                    // 备选：找所有包含"发布"的可点击 div
                    const divs = document.querySelectorAll('div');
                    for (const div of divs) {
                        const text = div.innerText?.trim();
                        const rect = div.getBoundingClientRect();
                        if (text === '发布' && rect.width > 20 && rect.height > 15 && rect.width < 150) {
                            div.scrollIntoView();
                            div.click();
                            return true;
                        }
                    }
                    return false;
                }""")
                if clicked:
                    logger.info("已点击发布按钮（JS）")
                else:
                    return {"success": False, "error": "未找到发布按钮"}
            except Exception as e:
                return {"success": False, "error": f"点击发布失败: {e}"}

            # 8. 处理确认弹窗 + 遮罩层
            await asyncio.sleep(2)
            try:
                confirmed = await self.page.evaluate("""() => {
                    // 先移除所有遮罩层
                    document.querySelectorAll('[class*="joyride"], [class*="overlay"], [class*="mask"]').forEach(el => {
                        if (el.style) el.style.display = 'none';
                    });
                    document.getElementById('react-joyride-portal')?.remove();
                    
                    // 找确认按钮
                    for (const sel of ['button.el-button--primary', 'button.ant-btn-primary', '.el-message-box__btns button', '.ant-modal-confirm-btns button']) {
                        for (const btn of document.querySelectorAll(sel)) {
                            const t = btn.innerText?.trim();
                            if ((t === '确认' || t === '确定' || t === 'OK' || t === '我知道了') && btn.offsetWidth > 0) { btn.click(); return t; }
                        }
                    }
                    for (const btn of document.querySelectorAll('button')) {
                        const t = btn.innerText?.trim();
                        if ((t === '确认' || t === '确定' || t === '我知道了') && btn.offsetWidth > 0) { btn.click(); return t; }
                    }
                    return null;
                }""")
                if confirmed:
                    logger.info("已点击确认: {}", confirmed)
                    await asyncio.sleep(1)
            except Exception:
                pass

            # 9. 等待发布结果
            logger.info("等待发布结果...")
            for i in range(30):
                await asyncio.sleep(2)
                try:
                    body = await self.page.locator("body").inner_text()
                    url = self.page.url
                    
                    for indicator in ["发布成功", "已发布", "审核中", "作品已发布", "发布完成", "提交成功"]:
                        if indicator in body:
                            result_ss = str(self.settings.storage_dir / "publish_success.png")
                            await self.page.screenshot(path=result_ss)
                            return {"success": True, "message": indicator, "screenshot": result_ss}
                    
                    for err_kw in ["发布失败", "上传失败", "内容违规", "审核不通过", "请重新", "系统错误"]:
                        if err_kw in body:
                            result_ss = str(self.settings.storage_dir / "publish_error.png")
                            await self.page.screenshot(path=result_ss)
                            return {"success": False, "error": f"发布失败: {err_kw}", "screenshot": result_ss}
                    
                    if ("work" in url.lower() or "content" in url.lower() or "manage" in url.lower()) and "login" not in url.lower() and "publish" not in url.lower():
                        result_ss = str(self.settings.storage_dir / "publish_success.png")
                        await self.page.screenshot(path=result_ss)
                        return {"success": True, "message": "已发布（页面跳转）", "screenshot": result_ss}
                    
                    if i % 5 == 0 and i > 0:
                        logger.info("等待发布结果... ({}s)", i * 2)
                except Exception:
                    pass

            result_ss = str(self.settings.storage_dir / "publish_timeout.png")
            await self.page.screenshot(path=result_ss)
            return {"success": False, "error": "发布结果确认超时", "screenshot": result_ss}

        except Exception as e:
            logger.error("自动发布失败: {}", e)
            return {"success": False, "error": str(e)}


# 全局实例
_browser_publisher: BrowserPublisher | None = None


async def get_browser_publisher() -> BrowserPublisher:
    global _browser_publisher
    if _browser_publisher is None:
        _browser_publisher = BrowserPublisher()
    return _browser_publisher
