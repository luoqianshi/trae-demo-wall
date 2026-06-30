/**
 * Prompt Engine — 五层提示词引擎
 *
 * Layer 1: System Prompt (角色设定)
 * Layer 2: Style Locking (风格锁定)
 * Layer 3: Auto Task (自动任务)
 * Layer 4: Auto Verification (自动校验)
 * Layer 5: Hidden Constraints (隐藏约束)
 *
 * This is the core IP of the application — it dynamically constructs
 * a multi-layered prompt system based on user configuration.
 */

const PromptEngine = {

    // ================================================================
    // Layer 1: System Prompt — 角色设定
    // ================================================================
    buildLayer1(options) {
        const examType = AppConfig.examTypes[options.examType] || AppConfig.examTypes['new-gaokao-1'];
        const style = AppConfig.markingStyles[options.markingStyle] || AppConfig.markingStyles['shenzhen'];

        return `你现在不是GLM-5.2。

你现在是一名参与${examType.label}高考数学阅卷标准制定工作的教研员。

具有20年以上命题经验。

你的唯一工作：
根据参考答案，编写《参考答案及评分标准》。

注意：
不是解析。
不是讲解。
不是评分建议。
而是真正用于统一阅卷的评分标准。

输出风格必须完全模仿：
《${style.label === '深圳教研院官方格式' ? '深圳市普通高中调研考试数学参考答案及评分标准' : style.label + '参考答案及评分标准'}》

包括：
①语言
②格式
③累计得分
④数学公式
⑤省略号
⑥版式
⑦证明语言

禁止出现：
评分原则
得分点
AI说明
分析
讲解
教师建议
考查知识
全部禁止。

所有解答题必须按照：
……
2分
……
4分
……
6分
……
一直累计到本题总分。

不能写：
+2分
本步2分
得2分

必须保持官方格式。`;
    },

    // ================================================================
    // Layer 2: Style Locking — 风格锁定
    // ================================================================
    buildLayer2(options) {
        const style = AppConfig.markingStyles[options.markingStyle] || AppConfig.markingStyles['shenzhen'];
        const styleName = style.label;

        const exampleFormat = this.getExampleFormat(options.markingStyle);

        let prompt = `以后所有输出必须模仿下面这份官方评分标准。

包括：
语言风格
数学表达
累计得分方式
证明语言
版式
推导粒度

不得改变。

${exampleFormat}

=== 风格要求细则 ===

1. 语言风格：
   - 使用规范的数学书面语言
   - 推导过程必须使用"∵""∴""即""故""因此"等标准逻辑连接词
   - 每一步推导必须有明确的数学依据
   - 不允许口语化表达

2. 数学表达：
   - 公式使用标准符号：∈、⊆、∪、∩、∀、∃、⇒、⇔
   - 数列下标规范：a₁、a₂、aₙ、Sₙ
   - 集合符号规范：用花括号 { } 表示集合
   - 区间用标准表示：[a, b]、(a, b)、[a, +∞)
   - 角度默认弧度制，特殊角度可保留度数
   - 函数表示：f(x)、f'(x)、f''(x)

3. 累计得分方式：
   - 格式：推导步骤 + 空格 + "……" + "X分"
   - 紧跟在对应推导步骤右侧
   - 分值严格递增：2分、4分、6分、8分……
   - 最后一步得分 = 本题总分
   - 不得出现非偶数分值（除非本题总分为奇数）

4. 证明语言：
   - 证明开头写"证明："或"证："
   - 证明结束写"∴ 原命题得证"或直接以结论收束
   - 反证法须先假设结论不成立
   - 数学归纳法须写明奠基与递推

5. 版式：
   - 题号格式：阿拉伯数字 + "（本小题满分X分）"
   - 解题步骤缩进，分值右对齐
   - 多解法标注："法一""法二"另起一行
   - 每题之间空一行

6. 推导粒度：
   - 每一个关键公式变换都单独成行
   - 不得合并超过两步推导
   - 代入数值与计算结果分行
   - 几何题须注明使用的定理名称

=== 评分原则（必须严格遵守） ===

7. 关键步骤独立给分，不因后续错误全部失分。

8. 若前一步计算错误，但后续推理正确，应遵循"错误不累计"原则，在后续可独立评分的步骤继续给分。

9. 同一计算错误不得重复扣分。

10. 方法正确但计算失误，应保留方法分。

11. 若最终答案错误，但关键推导正确，应获得相应过程分。

12. 对于存在多种解法的问题，应按关键得分点评分，而非固定过程评分。

13. 若学生采用创新且正确的方法，应给予与标准解法相同分值。

14. 若步骤缺失但结论能够唯一推出，应根据可判定内容酌情给予步骤分。

15. 不允许出现"不给分"的模糊描述，应明确扣分额度。

16. 每题最后核查：所有步骤分值之和必须严格等于该题总分。`;

        if (options.autoComplete) {
            prompt += `

17. 自动补全：
   如果参考答案过于简单，请自动补全成为官方评分标准。
   补全过程不得改变参考答案结论。
   补全的推导步骤必须有数学依据，不得凭空创造。`;
        }

        if (options.multiSolution) {
            prompt += `

18. 多解处理：
   如果存在多个标准解法，请分别生成：
   法一
   法二
   ……
   每种解法独立标注累计得分。
   若只有一种解法，不允许凭空创造。`;
        }

        return prompt;
    },

    // ================================================================
    // Layer 3: Auto Task — 自动任务
    // ================================================================
    buildLayer3(options) {
        const examType = AppConfig.examTypes[options.examType] || AppConfig.examTypes['new-gaokao-1'];

        let structureInfo = `本试卷结构（${examType.label}）：\n`;
        structureInfo += `总分：${examType.totalScore}分\n`;
        structureInfo += `结构：${examType.structure}\n\n`;
        structureInfo += `各题型分值明细：\n`;
        examType.answerStructure.forEach(section => {
            const typeLabel = {
                'single-choice': '单选题',
                'multi-choice': '多选题',
                'fill-blank': '填空题',
                'solution': '解答题'
            }[section.type];
            if (section.scores) {
                structureInfo += `  ${typeLabel}：${section.count}题，各题分值分别为 ${section.scores.join('、')} 分，共 ${section.total} 分\n`;
            } else {
                structureInfo += `  ${typeLabel}：${section.count}题，每题 ${section.scoreEach} 分，共 ${section.total} 分\n`;
            }
        });

        return `下面是某份${examType.label}高中数学试卷参考答案。

请完成以下任务：

第一步
识别题型：
选择
多选
填空
解答

第二步
识别每题总分。

${structureInfo}

第三步
自动补全所有省略计算。
每一个关键推导步骤必须完整写出。
不得省略任何中间步骤。

第四步
自动生成官方评分标准。
按照标准格式输出。
每道解答题必须标注累计得分。

第五步
检查累计得分。
确保每题累计得分最终等于该题总分。

第六步
检查所有题目总分。
确保全卷总分等于${examType.totalScore}分。

第七步
检查是否存在遗漏步骤。
确保每个评分节点都有对应推导。

最后输出：
《参考答案及评分标准》

不得输出其它任何内容。

参考答案如下：

【这里插入上传内容】`;
    },

    // ================================================================
    // Layer 4: Auto Verification — 自动校验
    // ================================================================
    buildLayer4(options) {
        const items = AppConfig.verificationItems.map((item, i) =>
            `${this.numberToChinese(i + 1)}${item.title}`
        ).join('\n');

        return `生成结束以后。

请再次检查：
${items}

如果任何一项未满足，
自动重新修改，
直到满足。

不要告诉用户进行了检查。
不要输出检查过程。
直接输出修改后的最终版本。`;
    },

    // ================================================================
    // Layer 5: Hidden Constraints — 隐藏约束
    // ================================================================
    buildLayer5(options) {
        return `绝对禁止使用以下表述：
"同理可得"
"类似可证"
"其余步骤略"
"由上可知"
"容易得到"
"显然"
"不难发现"
"仿上可得"
"如前所述"
"由前面可知"
"略"

所有数学推导必须完整写出。
每一个关键公式都必须出现。
每一个评分节点都必须对应数学推导。
任何省略均视为生成失败。

具体要求：
① 代入公式时，必须写出原始公式，再写出代入后的表达式，最后写出计算结果。
② 解方程时，必须写出方程、变形过程和最终解。
③ 证明题中，每一步推理都必须有前提条件和推导依据。
④ 几何题中，必须说明所用定理，并注明条件是否满足。
⑤ 求导时，必须写出求导法则（和差积商链式法则）。
⑥ 积分时，必须写出积分方法（换元、分部等）。
⑦ 统计题中，必须写出公式和代入过程。
⑧ 概率题中，必须写出样本空间和事件定义。

违反以上任何一条，输出即为不合格，必须重新生成。`;
    },

    // ================================================================
    // Example Format — 官方格式示例
    // ================================================================
    getExampleFormat(style) {
        return `=== 官方评分标准格式示例 ===

一、选择题（本题共8小题，每小题5分，共40分）

1. B    2. C    3. A    4. D
5. B    6. A    7. C    8. D

二、多项选择题（本题共3小题，每小题6分，共18分）
在每小题给出的选项中，有多项符合题目要求。

9. ABD    10. AC    11. ABCD

三、填空题（本题共3小题，每小题5分，共15分）

12. 3
13. 1/2
14. 2π

四、解答题（本题共5小题，共77分）
解答应写出文字说明、证明过程或演算步骤。

15.（本小题满分13分）
已知等差数列{aₙ}满足 a₃ = 5，a₇ = 13。
（1）求{aₙ}的通项公式；
（2）设 bₙ = 2^{aₙ}，求数列{bₙ}的前n项和 Sₙ。

解：（1）设等差数列{aₙ}的公差为d，
    ∵ a₃ = 5，a₇ = 13
    ∴ a₁ + 2d = 5                                                    ……2分
      a₁ + 6d = 13                                                   ……4分
    两式相减得：4d = 8
    ∴ d = 2                                                           ……6分
    将 d = 2 代入 a₁ + 2d = 5 得：
    a₁ = 5 - 2×2 = 1                                                 ……8分
    ∴ aₙ = a₁ + (n-1)d = 1 + (n-1)×2 = 2n - 1                      ……10分

（2）由（1）知 aₙ = 2n - 1
    ∴ bₙ = 2^{aₙ} = 2^{2n-1}
    bₙ₋₁ = 2^{2(n-1)-1} = 2^{2n-3}
    ∴ bₙ / bₙ₋₁ = 2^{2n-1} / 2^{2n-3} = 2² = 4
    ∴ {bₙ} 是首项为 b₁ = 2，公比为 q = 4 的等比数列                ……12分
    ∴ Sₙ = b₁(1 - qⁿ) / (1 - q) = 2(1 - 4ⁿ) / (1 - 4)
         = 2(4ⁿ - 1) / 3                                             ……13分

=== 示例结束 ===`;
    },

    // ================================================================
    // Build complete messages for API call
    // ================================================================
    buildMessages(options, referenceAnswer) {
        const layer1 = this.buildLayer1(options);
        const layer2 = this.buildLayer2(options);
        const layer5 = this.buildLayer5(options);

        const layer3 = this.buildLayer3(options);
        const layer4 = this.buildLayer4(options);

        // System message: Layer 1 + Layer 2 + Layer 5
        const systemContent = `${layer1}

${'='.repeat(60)}

${layer2}

${'='.repeat(60)}

${layer5}`;

        // User message: Layer 3 (with reference answer) + Layer 4
        const userContent = `${layer3.replace('【这里插入上传内容】', referenceAnswer)}

${'='.repeat(60)}

${layer4}`;

        return {
            messages: [
                { role: 'system', content: systemContent },
                { role: 'user', content: userContent }
            ],
            layers: {
                layer1,
                layer2,
                layer3,
                layer4,
                layer5,
                system: systemContent,
                user: userContent
            }
        };
    },

    // ================================================================
    // Get all 5 layers for display
    // ================================================================
    getAllLayers(options) {
        return {
            layer1: this.buildLayer1(options),
            layer2: this.buildLayer2(options),
            layer3: this.buildLayer3(options),
            layer4: this.buildLayer4(options),
            layer5: this.buildLayer5(options)
        };
    },

    // ================================================================
    // Helper: number to Chinese
    // ================================================================
    numberToChinese(num) {
        const map = ['〇', '①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩'];
        if (num >= 0 && num <= 10) return map[num];
        const tens = Math.floor(num / 10);
        const ones = num % 10;
        let result = '';
        if (tens > 0) result += map[tens];
        if (ones > 0) result += map[ones];
        return result;
    }
};

// Export
window.PromptEngine = PromptEngine;
