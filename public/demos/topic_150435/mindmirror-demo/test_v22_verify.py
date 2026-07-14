"""验证 v22：页面加载 + 模拟不同情绪的声学特征测试识别准确性"""
import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()
        page = await context.new_page()

        errors = []
        page.on("pageerror", lambda err: errors.append(str(err)))

        await page.goto("http://localhost:8765", wait_until="networkidle", timeout=15000)
        await page.wait_for_timeout(2000)

        print("=== 页面错误检查 ===")
        if errors:
            for e in errors:
                print(f"  ERROR: {e}")
        else:
            print("  无错误")

        # 检查 JS 版本
        src = await page.evaluate("document.querySelector('script[src*=\"app.js\"]')?.src")
        print(f"app.js: {src}")

        # 直接测试 inferVoiceEmotionFromStats 的逻辑
        # 模拟不同情绪的 stats
        test_cases = await page.evaluate("""() => {
            // 模拟 computeVoiceStats 的输出
            const results = [];

            // 1. 快乐：中高能量 + 基频偏高 + 低抖动
            const happyStats = {
                energyMean: 0.2, energyMax: 0.4, energyRange: 0.2,
                pitchMean: 180, pitchStd: 12, pitchRange: 30,
                pitchDelta: 0.15, activity: 0.3, baseline: 155,
                validPitchCount: 40, voicedRatio: 0.7
            };

            // 2. 愤怒：高能量 + 高抖动
            const angryStats = {
                energyMean: 0.4, energyMax: 0.6, energyRange: 0.3,
                pitchMean: 200, pitchStd: 30, pitchRange: 80,
                pitchDelta: 0.2, activity: 0.6, baseline: 167,
                validPitchCount: 40, voicedRatio: 0.7
            };

            // 3. 悲伤：低能量 + 低活跃
            const sadStats = {
                energyMean: 0.05, energyMax: 0.08, energyRange: 0.03,
                pitchMean: 110, pitchStd: 5, pitchRange: 10,
                pitchDelta: -0.1, activity: 0.08, baseline: 122,
                validPitchCount: 30, voicedRatio: 0.5
            };

            // 4. 惊讶：基频骤高 + 大范围
            const surprisedStats = {
                energyMean: 0.2, energyMax: 0.35, energyRange: 0.15,
                pitchMean: 230, pitchStd: 25, pitchRange: 60,
                pitchDelta: 0.4, activity: 0.5, baseline: 164,
                validPitchCount: 35, voicedRatio: 0.6
            };

            // 5. 恐惧：基频偏高 + 能量低
            const fearfulStats = {
                energyMean: 0.1, energyMax: 0.15, energyRange: 0.05,
                pitchMean: 200, pitchStd: 15, pitchRange: 30,
                pitchDelta: 0.25, activity: 0.25, baseline: 160,
                validPitchCount: 30, voicedRatio: 0.5
            };

            // 6. 焦虑：高活跃 + 中低能量
            const anxiousStats = {
                energyMean: 0.12, energyMax: 0.2, energyRange: 0.1,
                pitchMean: 170, pitchStd: 20, pitchRange: 50,
                pitchDelta: 0.05, activity: 0.35, baseline: 162,
                validPitchCount: 35, voicedRatio: 0.6
            };

            // 7. 中性：中等能量 + 基频接近基线
            const neutralStats = {
                energyMean: 0.15, energyMax: 0.25, energyRange: 0.1,
                pitchMean: 160, pitchStd: 8, pitchRange: 15,
                pitchDelta: 0.0, activity: 0.15, baseline: 160,
                validPitchCount: 40, voicedRatio: 0.7
            };

            // 逐个测试
            for (const [name, stats] of [
                ['happy', happyStats], ['angry', angryStats], ['sad', sadStats],
                ['surprised', surprisedStats], ['fearful', fearfulStats],
                ['anxious', anxiousStats], ['neutral', neutralStats]
            ]) {
                if (typeof inferVoiceEmotionFromStats === 'function') {
                    const result = inferVoiceEmotionFromStats(stats);
                    results.push({
                        input: name,
                        output: result.label,
                        confidence: result.confidence.toFixed(2),
                        intensity: result.intensity.toFixed(2),
                        scores: Object.fromEntries(
                            Object.entries(result.scores).map(([k,v]) => [k, v.toFixed(3)])
                        )
                    });
                } else {
                    results.push({ input: name, error: 'inferVoiceEmotionFromStats not found' });
                }
            }
            return results;
        }""")

        print("\n=== 情绪识别测试 ===")
        for tc in test_cases:
            if 'error' in tc:
                print(f"  {tc['input']}: ERROR - {tc['error']}")
            else:
                correct = "✓" if tc['input'] == tc['output'] else "✗"
                print(f"  {correct} 输入:{tc['input']:12s} → 输出:{tc['output']:12s} 置信度:{tc['confidence']} 强度:{tc['intensity']}")
                if tc['input'] != tc['output']:
                    print(f"    scores: {tc['scores']}")

        await browser.close()

asyncio.run(main())
