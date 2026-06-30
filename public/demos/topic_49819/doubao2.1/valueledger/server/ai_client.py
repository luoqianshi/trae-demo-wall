import json
import urllib.request
import urllib.error
from valueledger.config import DEEPSEEK_API_KEY, DEEPSEEK_API_URL, DEEPSEEK_MODEL


SYSTEM_PROMPT = """你是一个专业的代码评审专家，请对以下Python代码从四个维度进行评分和评价：
1. 功能正确性（30分）：代码是否正确实现了功能
2. 代码质量（25分）：可读性、命名规范、结构清晰
3. 健壮性（25分）：异常处理、边界情况考虑
4. 性能与最佳实践（20分）：是否符合Python最佳实践

请严格按照以下JSON格式返回，不要返回其他内容，不要markdown代码块：
{"score": 0-100的整数, "comment": "你的评价，200字以内，指出优点和不足"}"""


def review_code(code_content):
    data = {
        "model": DEEPSEEK_MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"请评审以下Python代码：\n```python\n{code_content}\n```"}
        ],
        "temperature": 0.3,
        "max_tokens": 500
    }

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {DEEPSEEK_API_KEY}"
    }

    req = urllib.request.Request(
        DEEPSEEK_API_URL,
        data=json.dumps(data).encode("utf-8"),
        headers=headers,
        method="POST"
    )

    try:
        with urllib.request.urlopen(req, timeout=60) as response:
            result = json.loads(response.read().decode("utf-8"))
            ai_content = result["choices"][0]["message"]["content"].strip()

            if ai_content.startswith("```"):
                lines = ai_content.split("\n")
                lines = [l for l in lines if not l.startswith("```")]
                ai_content = "\n".join(lines).strip()

            parsed = json.loads(ai_content)
            score = float(parsed.get("score", 60))
            comment = parsed.get("comment", "AI评审完成。")

            score = max(0, min(100, score))
            return score, comment
    except Exception as e:
        print(f"AI评审调用失败: {e}")
        return 60.0, f"AI评审暂时不可用，给默认分60分。错误信息：{str(e)}"
