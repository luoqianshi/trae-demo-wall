"""检查页面控制台错误和面部/语音识别功能状态"""
import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()
        page = await context.new_page()

        errors = []
        console_msgs = []
        page.on("console", lambda msg: console_msgs.append(f"[{msg.type}] {msg.text}"))
        page.on("pageerror", lambda err: errors.append(str(err)))

        await page.goto("http://localhost:8765", wait_until="networkidle", timeout=15000)
        await page.wait_for_timeout(3000)

        # 检查关键 DOM 元素是否存在
        face_section = await page.query_selector('#face-section, .panel-left, [class*="face"]')
        btn_camera = await page.query_selector('#btn-camera')
        btn_mic = await page.query_selector('#btn-mic')
        face_emotion_label = await page.query_selector('#face-emotion-label')
        voice_emotion_label = await page.query_selector('#voice-emotion-label')

        print("=== DOM 元素检查 ===")
        print(f"btn-camera 存在: {btn_camera is not None}")
        print(f"btn-mic 存在: {btn_mic is not None}")
        print(f"face-emotion-label 存在: {face_emotion_label is not None}")
        print(f"voice-emotion-label 存在: {voice_emotion_label is not None}")

        if btn_camera:
            text = await btn_camera.text_content()
            print(f"btn-camera 文本: {text}")
        if face_emotion_label:
            text = await face_emotion_label.text_content()
            print(f"face-emotion-label 文本: {text}")
        if voice_emotion_label:
            text = await voice_emotion_label.text_content()
            print(f"voice-emotion-label 文本: {text}")

        # 检查 MediaPipe 是否加载
        mp_loaded = await page.evaluate("""() => {
            return {
                FaceMesh: typeof FaceMesh !== 'undefined',
                Camera: typeof Camera !== 'undefined',
                drawConnectors: typeof drawConnectors !== 'undefined',
                drawLandmarks: typeof drawLandmarks !== 'undefined'
            }
        }""")
        print(f"\n=== MediaPipe 加载状态 ===\n{mp_loaded}")

        # 检查 JS 版本
        app_js_src = await page.evaluate("document.querySelector('script[src*=app.js]')?.src")
        print(f"app.js src: {app_js_src}")

        print(f"\n=== 页面错误 ({len(errors)}) ===")
        for e in errors:
            print(f"  {e}")

        print(f"\n=== 控制台消息 ({len(console_msgs)}) ===")
        for m in console_msgs[-20:]:
            print(f"  {m}")

        await browser.close()

asyncio.run(main())
