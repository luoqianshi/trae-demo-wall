package com.kiddo.launcher.question.model

enum class QuestionType(val title: String) {
    Choice("选择题"),
    TrueFalse("判断题"),
    FillBlank("填空题"),
    Calculation("计算题"),
}

enum class AnswerResult {
    Idle,
    Correct,
    Wrong,
    AiAssistedNeedsPractice,
}

data class QuestionItem(
    val id: String,
    val type: QuestionType,
    val prompt: String,
    val options: List<String>,
    val answer: String,
    val hint: String,
    val explanation: String,
)

data class QuestionUiState(
    val current: QuestionItem = QuestionBank.seedQuestions.first(),
    val selectedType: QuestionType = QuestionType.Choice,
    val answerInput: String = "",
    val result: AnswerResult = AnswerResult.Idle,
    val aiTip: String = "先想想题目里的关键词，再决定用加法、乘法还是比较。",
    val aiAnalysisVisible: Boolean = false,
    val usedAiHelp: Boolean = false,
    val similarRound: Int = 0,
    val unresolvedWrongCount: Int = 0,
)

object QuestionBank {
    val seedQuestions = listOf(
        QuestionItem(
            id = "choice-fraction-01",
            type = QuestionType.Choice,
            prompt = "如果 2/3 个披萨再取其中的 1/2，最后是多少个完整披萨？",
            options = listOf("1/2", "1/3", "2/5", "3/4"),
            answer = "1/3",
            hint = "“取其中的一半”可以看作乘以 1/2。",
            explanation = "先写算式 2/3 x 1/2 = 2/6，再约分得到 1/3。",
        ),
        QuestionItem(
            id = "truefalse-fraction-01",
            type = QuestionType.TrueFalse,
            prompt = "判断：分数乘以 1/2，结果一定比原来的分数小。",
            options = listOf("正确", "错误"),
            answer = "错误",
            hint = "如果原来的分数是 0 呢？",
            explanation = "大多数正分数乘以 1/2 会变小，但 0 乘以 1/2 仍是 0，所以“一定”不成立。",
        ),
        QuestionItem(
            id = "fill-fraction-01",
            type = QuestionType.FillBlank,
            prompt = "填空：3/4 x 2 = ____。",
            options = emptyList(),
            answer = "3/2",
            hint = "整数可以写成分母为 1 的分数。",
            explanation = "3/4 x 2/1 = 6/4，约分后是 3/2。",
        ),
        QuestionItem(
            id = "calc-fraction-01",
            type = QuestionType.Calculation,
            prompt = "计算：5/6 x 3/5 = ?",
            options = emptyList(),
            answer = "1/2",
            hint = "先约分会更快：5 和 5 可以约掉，3 和 6 可以约掉。",
            explanation = "5/6 x 3/5 = 15/30 = 1/2。",
        ),
    )

    fun firstOf(type: QuestionType): QuestionItem = seedQuestions.first { it.type == type }

    fun similarFrom(source: QuestionItem, round: Int): QuestionItem {
        val suffix = round + 1
        return when (source.type) {
            QuestionType.Choice -> source.copy(
                id = "choice-similar-$suffix",
                prompt = "同类题：如果 3/5 个蛋糕再取其中的 1/3，最后是多少个完整蛋糕？",
                options = listOf("1/5", "1/3", "2/5", "3/8"),
                answer = "1/5",
                explanation = "3/5 x 1/3 = 3/15 = 1/5。",
            )
            QuestionType.TrueFalse -> source.copy(
                id = "truefalse-similar-$suffix",
                prompt = "同类题：判断：任何分数乘以 1，大小都不变。",
                answer = "正确",
                explanation = "乘以 1 表示取原来的全部，所以数值不变。",
            )
            QuestionType.FillBlank -> source.copy(
                id = "fill-similar-$suffix",
                prompt = "同类题：2/5 x 3 = ____。",
                answer = "6/5",
                explanation = "2/5 x 3/1 = 6/5。",
            )
            QuestionType.Calculation -> source.copy(
                id = "calc-similar-$suffix",
                prompt = "同类题：4/7 x 7/8 = ?",
                answer = "1/2",
                explanation = "4/7 x 7/8 先约掉 7，再约 4 和 8，得到 1/2。",
            )
        }
    }
}
