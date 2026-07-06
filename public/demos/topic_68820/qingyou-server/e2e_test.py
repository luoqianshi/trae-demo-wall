"""端到端测试：验证前端调用后端 API 的完整交互流程

新输入模型（必填三件套 + 选填增强）：
- 必填：出发地 city + 人数构成 group + 时间预算 days/depart_time/return_time
- 选填：兴趣 interests / 心情 mood / 体力 energy / 预算上限 budget_ceiling / 交通方式 transport
"""
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

URL = "http://127.0.0.1:5000/"
SHOT_DIR = Path(__file__).parent / "e2e_shots"
SHOT_DIR.mkdir(exist_ok=True)


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 900})

        # 收集控制台与网络错误
        console_msgs = []
        page.on("console", lambda m: console_msgs.append(f"[{m.type}] {m.text}"))
        page.on("pageerror", lambda e: console_msgs.append(f"[pageerror] {e}"))

        print(">> 1. 访问首页")
        page.goto(URL, wait_until="networkidle")
        page.wait_for_selector("#group-grid .group-card", timeout=10000)
        page.screenshot(path=str(SHOT_DIR / "01_loaded.png"), full_page=True)

        # 验证元数据已加载
        group_count = page.locator("#group-grid .group-card").count()
        transport_count = page.locator("#transport-row .transport-card").count()
        mood_count = page.locator("#mood-grid .mood-card").count()
        interest_count = page.locator("#interest-tags .tag").count()
        print(f"   groups={group_count}, transports={transport_count}, moods={mood_count}, interests={interest_count}")
        assert group_count > 0 and mood_count > 0 and interest_count > 0, "元数据未加载"

        print(">> 2. 选择人数构成（必填 - 带长辈）")
        page.locator("#group-grid .group-card").nth(2).click()
        page.wait_for_timeout(200)
        selected_group = page.locator("#group-grid .group-card.selected")
        assert selected_group.count() == 1, "人数构成未选中"
        print(f"   已选人群: {selected_group.get_attribute('data-group')}")

        print(">> 3. 设置出发地（必填 - 上海）")
        page.fill("#city-input", "上海")
        page.wait_for_timeout(400)
        match_text = page.locator("#city-match").inner_text()
        print(f"   城市匹配: {match_text}")
        assert "已匹配" in match_text, "城市未匹配"

        print(">> 4. 选择兴趣（选填 - 前两个标签）")
        page.locator("#interest-tags .tag").nth(0).click()
        page.locator("#interest-tags .tag").nth(1).click()
        page.wait_for_timeout(200)
        sel_tags = page.locator("#interest-tags .tag.selected")
        print(f"   已选兴趣数: {sel_tags.count()}")
        assert sel_tags.count() == 2, "兴趣未选中"

        print(">> 5. 选择心情（选填 - 第一张卡片）")
        page.locator("#mood-grid .mood-card").first.click()
        page.wait_for_timeout(200)
        selected_mood = page.locator("#mood-grid .mood-card.selected")
        assert selected_mood.count() == 1, "心情未选中"
        print(f"   已选心情: {selected_mood.get_attribute('data-mood')}")

        print(">> 6. 设置预算上限（选填 - 200 元）")
        page.fill("#budget-input", "200")
        page.wait_for_timeout(200)

        print(">> 7. 点击生成按钮")
        gen_btn = page.locator("#gen-btn")
        assert not gen_btn.is_disabled(), "生成按钮仍处于禁用状态"
        gen_btn.click()

        # 等待"AI 思考中"动画 + API 返回
        print("   等待方案生成…")
        page.wait_for_selector("#plan-output.show", timeout=20000)
        page.wait_for_timeout(500)
        page.screenshot(path=str(SHOT_DIR / "02_plan_generated.png"), full_page=True)

        # 验证方案内容
        ov_text = page.locator("#overview").inner_text()
        print(f"   总览: {ov_text.replace(chr(10), ' | ')}")
        assert "¥" in ov_text and "活动总数" in ov_text, "方案总览未渲染"

        day_tabs = page.locator("#day-tabs .day-tab").count()
        tl_items = page.locator(".tl-item").count()
        print(f"   日页签数={day_tabs}, 时间轴活动数={tl_items}")
        assert day_tabs >= 1 and tl_items > 0, "时间轴未渲染活动"

        tips_text = page.locator("#tips-card").inner_text()
        assert "避坑" in tips_text, "避坑提示未渲染"
        print(f"   tips 字符数: {len(tips_text)}")

        print(">> 8. 保存方案")
        save_btn = page.locator("#save-btn")
        save_btn.click()
        # 等待 toast 出现
        page.wait_for_selector("#toast.show", timeout=10000)
        toast_text = page.locator("#toast").inner_text()
        print(f"   toast: {toast_text}")
        assert "已保存" in toast_text and "ID" in toast_text, "保存未成功"
        page.screenshot(path=str(SHOT_DIR / "03_saved.png"), full_page=True)

        print(">> 9. 验证后端数据库记录（GET /api/plans）")
        plans = page.evaluate("""async () => {
            const r = await fetch('/api/plans');
            return await r.json();
        }""")
        print(f"   /api/plans 返回 {len(plans)} 条记录")
        assert isinstance(plans, list) and len(plans) >= 1, "数据库无方案记录"
        latest = plans[0]  # 后端按 created_at desc 排序，第一条为最新
        print(f"   最新记录: id={latest.get('id')}, city={latest.get('city')}, "
              f"group={latest.get('group')}, mood={latest.get('mood')}, "
              f"budget_ceiling={latest.get('budget_ceiling')}, days={latest.get('days')}")
        assert latest.get('city') == '上海', "最新记录出发地不匹配"
        assert latest.get('group') == '带长辈', "最新记录人数构成不匹配"
        assert latest.get('mood') == '愉悦', "最新记录心情不匹配"
        assert latest.get('budget_ceiling') == 200, "最新记录预算上限不匹配"

        # 打印控制台消息（诊断用）
        if console_msgs:
            print("\n--- 浏览器控制台消息 ---")
            for m in console_msgs:
                print(m)

        browser.close()
        print("\n✓ 端到端测试全部通过！")
        print(f"  截图保存于: {SHOT_DIR}")


if __name__ == "__main__":
    try:
        main()
    except AssertionError as e:
        print(f"\n✗ 断言失败: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"\n✗ 测试异常: {type(e).__name__}: {e}", file=sys.stderr)
        sys.exit(2)
