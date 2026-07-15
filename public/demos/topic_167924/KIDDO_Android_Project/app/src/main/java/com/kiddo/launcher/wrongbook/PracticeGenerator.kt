package com.kiddo.launcher.wrongbook

object PracticeGenerator {
    fun originalFor(itemId: String, prompt: String, answer: String, reason: String): PracticeQuestion {
        return PracticeQuestion(
            id = "$itemId-original",
            prompt = prompt,
            answer = answer,
            hint = "先把题目中的已知条件圈出来，再写出第一步算式。",
            analysis = reason,
            stage = ChallengeStage.Original,
        )
    }

    fun generate(item: WrongItem, stage: ChallengeStage, serial: Int): PracticeQuestion {
        val seed = serial + item.challengeCount + item.aiHelpCount + 2
        return when {
            item.knowledgePoint.contains("分数") -> fractionPractice(item.id, stage, seed)
            item.knowledgePoint.contains("面积") -> areaPractice(item.id, stage, seed)
            else -> generalPractice(item, stage, seed)
        }
    }

    private fun fractionPractice(itemId: String, stage: ChallengeStage, seed: Int): PracticeQuestion {
        val numerator = seed + 1
        val denominator = (seed + 1) * 2
        val prompt = when (stage) {
            ChallengeStage.Original -> "重新完成原题，并写出第一步算式。"
            ChallengeStage.VariantOne -> "同类题：$numerator/$denominator × 1/2 = ____。"
            ChallengeStage.VariantTwo -> "同类题：把 $numerator/$denominator 个蛋糕平均分给 2 人，每人得到多少个？"
            ChallengeStage.Integrated -> "综合题：先取 $numerator/$denominator 个蛋糕的一半，再把结果约分。"
        }
        return PracticeQuestion(
            id = "$itemId-${stage.name.lowercase()}-$seed",
            prompt = prompt,
            answer = "1/2",
            hint = "分数乘 1/2 可以理解为取它的一半，最后别忘了约分。",
            analysis = "$numerator/$denominator 可以约分成 1/2；继续取一半时要用乘法表达。",
            stage = stage,
        )
    }

    private fun areaPractice(itemId: String, stage: ChallengeStage, seed: Int): PracticeQuestion {
        val width = seed + 3
        val height = seed + 2
        return PracticeQuestion(
            id = "$itemId-${stage.name.lowercase()}-$seed",
            prompt = when (stage) {
                ChallengeStage.Original -> "重新完成原题，并标出长和宽。"
                ChallengeStage.VariantOne -> "同类题：长方形长 ${width}cm，宽 ${height}cm，面积是多少？"
                ChallengeStage.VariantTwo -> "同类题：一个长方形面积是 ${width * height}cm²，宽 ${height}cm，长是多少？"
                ChallengeStage.Integrated -> "综合题：长方形长 ${width}cm，宽 ${height}cm，周长和面积分别是多少？"
            },
            answer = if (stage == ChallengeStage.VariantTwo) "${width}" else "${width * height}",
            hint = "面积看长×宽；如果已知面积和宽，就用面积÷宽。",
            analysis = "长方形面积公式是长×宽，反求边长时使用除法。",
            stage = stage,
        )
    }

    private fun generalPractice(item: WrongItem, stage: ChallengeStage, seed: Int): PracticeQuestion {
        return PracticeQuestion(
            id = "${item.id}-${stage.name.lowercase()}-$seed",
            prompt = when (stage) {
                ChallengeStage.Original -> item.originalQuestion
                ChallengeStage.VariantOne -> "同知识点变式：换一个数字后，重新判断解题第一步。"
                ChallengeStage.VariantTwo -> "同知识点变式：换一种题干表述，独立写出答案。"
                ChallengeStage.Integrated -> "综合题：把这个知识点和前一节内容一起应用。"
            },
            answer = item.correctAnswer,
            hint = "先说出知识点，再写答案。",
            analysis = item.wrongReason,
            stage = stage,
        )
    }
}
