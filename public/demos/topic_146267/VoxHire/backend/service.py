from __future__ import annotations

from uuid import uuid4

from .models import DIMENSIONS, DimensionScore, InterviewReport, SessionCreate, SessionCreated, SessionStage, TranscriptEntry


class InterviewService:
    """Keeps only active interview context in memory; no files or audio are persisted."""

    def __init__(self) -> None:
        self._sessions: dict[str, dict[str, object]] = {}

    def create_session(self, data: SessionCreate) -> SessionCreated:
        session_id = uuid4().hex
        questions = self._questions_for(data)
        instructions = self._instructions_for(data, questions)
        self._sessions[session_id] = {"setup": data, "entries": []}
        return SessionCreated(
            session_id=session_id,
            gateway_instructions=instructions,
            questions=questions,
            stage=SessionStage.INTERVIEW,
        )

    def add_entries(self, session_id: str, entries: list[TranscriptEntry]) -> None:
        session = self._get(session_id)
        cast_entries: list[TranscriptEntry] = session["entries"]  # type: ignore[assignment]
        cast_entries.extend(entries)

    def build_report(self, session_id: str, client_entries: list[TranscriptEntry] | None = None) -> InterviewReport:
        session = self._get(session_id)
        entries: list[TranscriptEntry] = list(session["entries"])  # type: ignore[arg-type]
        if client_entries:
            entries.extend(client_entries)
        user_answers = [entry.text for entry in entries if entry.role == "user"]
        answer_text = " ".join(user_answers)
        answer_count = len(user_answers)
        detail_bonus = min(3, len(answer_text) // 240)
        scores: list[DimensionScore] = []
        for index, (key, label) in enumerate(DIMENSIONS):
            score = min(10, max(4, 5 + detail_bonus + (1 if answer_count >= 4 else 0) - (1 if index == 3 and answer_count < 4 else 0)))
            evidence = "已完成模拟回答，能够围绕问题展开说明。" if answer_count else "尚未记录有效回答，建议完成一场真实模拟面试。"
            suggestion = self._suggestion(key)
            scores.append(DimensionScore(key=key, label=label, score=score, evidence=evidence, suggestion=suggestion))
        overall = round(sum(item.score for item in scores) / len(scores) * 10)
        return InterviewReport(
            session_id=session_id,
            overall_score=overall,
            recommendation="建议针对得分较低维度进行一次专项复练。",
            summary=f"本次共分析 {answer_count} 段候选人回答，报告依据回答内容与表达完整度生成。",
            dimensions=scores,
        )

    def _get(self, session_id: str) -> dict[str, object]:
        if session_id not in self._sessions:
            raise KeyError(session_id)
        return self._sessions[session_id]

    @staticmethod
    def _questions_for(data: SessionCreate) -> list[str]:
        primary_skill = data.skills[0]
        return [
            f"请用两分钟介绍你自己，并说明为什么想应聘 {data.role}。",
            f"在 {primary_skill} 开发中，你认为最容易被忽视、但会影响线上质量的环节是什么？",
            f"请解释一次你如何定位并解决复杂技术问题，重点描述你的分析过程。",
            "请选择简历中的一个代表项目，说明你的个人贡献、关键取舍和最终结果。",
            "假设业务流量增长十倍，你会如何设计系统来保障性能、稳定性和可维护性？",
        ]

    @staticmethod
    def _instructions_for(data: SessionCreate, questions: list[str]) -> str:
        material = ""
        if data.resume_text:
            material += f"简历摘要：{data.resume_text[:2000]}\n"
        if data.job_description:
            material += f"职位描述：{data.job_description[:2000]}\n"
        question_list = "\n".join(f"{index + 1}. {question}" for index, question in enumerate(questions))
        return (
            "你是 VoxHire 的中文技术面试官。保持专业、克制、友善。"
            f"候选岗位：{data.role}；经验：{data.experience_years} 年；技术栈：{', '.join(data.skills)}。\n"
            f"{material}"
            "首次回复先简短欢迎候选人，并发起第一题自我介绍；严格按以下五题推进，一次只问一题；候选人回答后先简短追问或确认，再继续下一题。"
            "不要给出标准答案，不要在面试过程中评分。\n"
            f"题目：\n{question_list}"
        )

    @staticmethod
    def _suggestion(key: str) -> str:
        suggestions = {
            "technical_accuracy": "回答时补充原理、边界条件和具体技术依据。",
            "project_depth": "明确个人职责、挑战、取舍和可量化结果。",
            "problem_analysis": "用现象、假设、验证、结论的顺序组织排障过程。",
            "system_design": "从容量、可用性、数据一致性和监控四方面展开。",
            "communication_clarity": "先给结论，再补充关键依据，避免铺陈过长。",
            "collaboration": "说明如何与产品、测试或其他工程师对齐目标和风险。",
            "improvement": "选择一个薄弱维度复练，并在下一次回答中使用具体案例。",
        }
        return suggestions[key]
