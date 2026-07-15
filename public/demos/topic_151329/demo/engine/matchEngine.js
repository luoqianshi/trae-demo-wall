/**
 * 匹配引擎 - 快速模式真实算法
 * 移植自 SmartMatchApp/Services/MatchEngine.cs
 *
 * 支持语法：
 * - 逻辑运算：& (与) | (或) ! (非) () (括号优先级)
 * - 精确匹配：=A 表示文本完全等于A
 * - 通配符：* 任意多字符，? 单字符
 * - 正则表达式：regex: 前缀
 * - 边界匹配：` 反引号标记边界（`321 左边界，321` 右边界，`321` 双边界）
 * - 全角归一化：３２１ → 321
 * - 同义词展开：$[组名] → (主词|同义词1|...)
 */
window.MatchEngine = (function() {

    // ========== 全角数字/字母归一化 ==========

    /**
     * 全角数字/字母归一化为半角
     * 全角数字 ０-９ (U+FF10-FF19) → 0-9
     * 全角大写 Ａ-Ｚ (U+FF21-FF3A) → A-Z
     * 全角小写 ａ-ｚ (U+FF41-FF5A) → a-z
     */
    function normalizeFullWidth(text) {
        if (!text) return '';
        var result = '';
        for (var i = 0; i < text.length; i++) {
            var code = text.charCodeAt(i);
            if (code >= 0xFF10 && code <= 0xFF19) {
                // 全角数字 → 半角
                result += String.fromCharCode(code - 0xFF10 + 0x0030);
            } else if (code >= 0xFF21 && code <= 0xFF3A) {
                // 全角大写 → 半角大写
                result += String.fromCharCode(code - 0xFF21 + 0x0041);
            } else if (code >= 0xFF41 && code <= 0xFF5A) {
                // 全角小写 → 半角小写
                result += String.fromCharCode(code - 0xFF41 + 0x0061);
            } else {
                result += text[i];
            }
        }
        return result;
    }

    // ========== 边界感知匹配 ==========

    /**
     * 边界感知匹配：用反引号 ` 标记关键字边界
     * `321   → 左边界：关键字前一个字符不能是数字或字母
     * 321`   → 右边界：关键字后一个字符不能是数字或字母
     * `321`  → 双边界
     * 无反引号 → 普通包含
     *
     * @param {string} keyword - 可能含反引号标记的关键字
     * @param {string} text - 待匹配文本
     * @returns {boolean}
     */
    function smartContains(keyword, text) {
        if (!keyword || !text) return false;

        var hasLeftBoundary = keyword.charAt(0) === '`';
        var hasRightBoundary = keyword.charAt(keyword.length - 1) === '`';

        // 去掉反引号标记，得到实际关键字
        var actualKeyword = keyword;
        if (hasLeftBoundary) actualKeyword = actualKeyword.substring(1);
        if (hasRightBoundary) actualKeyword = actualKeyword.substring(0, actualKeyword.length - 1);

        if (actualKeyword.length === 0) return false;

        // 不带边界 → 普通包含
        if (!hasLeftBoundary && !hasRightBoundary) {
            return text.indexOf(actualKeyword) >= 0;
        }

        // 查找所有出现位置，检查边界
        var searchPos = 0;
        while (true) {
            var foundPos = text.indexOf(actualKeyword, searchPos);
            if (foundPos < 0) return false;

            var leftOk = true;
            var rightOk = true;

            // 左边界检查：前一个字符不能是数字或字母
            if (hasLeftBoundary && foundPos > 0) {
                var prevChar = text.charAt(foundPos - 1);
                if (/[0-9A-Za-z]/.test(prevChar)) {
                    leftOk = false;
                }
            }

            // 右边界检查：后一个字符不能是数字或字母
            if (hasRightBoundary) {
                var afterPos = foundPos + actualKeyword.length;
                if (afterPos < text.length) {
                    var nextChar = text.charAt(afterPos);
                    if (/[0-9A-Za-z]/.test(nextChar)) {
                        rightOk = false;
                    }
                }
            }

            if (leftOk && rightOk) return true;

            // 继续查找下一个出现位置
            searchPos = foundPos + 1;
            if (searchPos >= text.length) return false;
        }
    }

    // ========== 通配符匹配 ==========

    /**
     * 通配符匹配：* → 任意多字符，? → 单个字符
     * @param {string} pattern - 含通配符的模式
     * @param {string} text - 待匹配文本
     * @returns {boolean}
     */
    function wildcardMatch(pattern, text) {
        if (!pattern) return false;

        // 将通配符模式转为正则表达式
        var regexStr = '';
        for (var i = 0; i < pattern.length; i++) {
            var ch = pattern[i];
            if (ch === '*') {
                regexStr += '.*';
            } else if (ch === '?') {
                regexStr += '.';
            } else {
                // 转义正则特殊字符
                regexStr += ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            }
        }
        // 通配符是"包含"语义，不是"完全匹配"，所以不加 ^ $
        try {
            var regex = new RegExp(regexStr);
            return regex.test(text);
        } catch (e) {
            return false;
        }
    }

    // ========== 正则匹配 ==========

    /**
     * 正则匹配：regex: 前缀后的内容作为正则表达式
     * @param {string} pattern - "regex:" 开头的模式
     * @param {string} text - 待匹配文本
     * @returns {boolean}
     */
    function regexMatch(pattern, text) {
        if (!pattern) return false;
        // 去掉 regex: 前缀
        var regexStr = pattern;
        if (regexStr.startsWith('regex:')) {
            regexStr = regexStr.substring(6);
        }
        try {
            var regex = new RegExp(regexStr);
            return regex.test(text);
        } catch (e) {
            return false;
        }
    }

    // ========== 原子条件匹配 ==========

    /**
     * 单个原子条件匹配
     * 判断条件类型并调用对应方法：
     * - = 开头 → 精确匹配
     * - regex: 开头 → 正则匹配
     * - 含 * 或 ? → 通配符匹配
     * - 含反引号 ` → 边界匹配
     * - 其他 → 普通包含
     *
     * @param {string} condition - 单个条件（不含逻辑运算符）
     * @param {string} text - 待匹配文本
     * @returns {boolean}
     */
    function matchAtom(condition, text) {
        if (!condition || !text) return false;
        condition = condition.trim();
        if (condition.length === 0) return false;

        // 精确匹配：= 开头
        if (condition.charAt(0) === '=') {
            var exactValue = condition.substring(1);
            return text === exactValue;
        }

        // 正则匹配：regex: 开头
        if (condition.startsWith('regex:')) {
            return regexMatch(condition, text);
        }

        // 边界匹配：含反引号
        if (condition.indexOf('`') >= 0) {
            return smartContains(condition, text);
        }

        // 通配符匹配：含 * 或 ?
        if (condition.indexOf('*') >= 0 || condition.indexOf('?') >= 0) {
            return wildcardMatch(condition, text);
        }

        // 普通包含
        return text.indexOf(condition) >= 0;
    }

    // ========== 递归下降解析器 ==========

    /**
     * 解析器状态
     * 将条件表达式解析为 AST
     *
     * AST 节点类型：
     * - {type:'atom', value:'条件文本'}
     * - {type:'not', child:AST}
     * - {type:'and', left:AST, right:AST}
     * - {type:'or', left:AST, right:AST}
     */
    function Parser(input) {
        this.input = input;
        this.pos = 0;
    }

    /**
     * 跳过空白字符
     */
    Parser.prototype.skipWhitespace = function() {
        while (this.pos < this.input.length && /\s/.test(this.input[this.pos])) {
            this.pos++;
        }
    };

    /**
     * 查看当前字符
     */
    Parser.prototype.peek = function() {
        if (this.pos >= this.input.length) return null;
        return this.input[this.pos];
    };

    /**
     * 读取一个字符
     */
    Parser.prototype.consume = function() {
        if (this.pos >= this.input.length) return null;
        return this.input[this.pos++];
    };

    /**
     * 读取原子条件文本
     * 原子文本读取到下一个 & | ) 或字符串末尾
     * 特殊处理：regex: 后的内容作为一个整体，不被 & | 拆分
     */
    Parser.prototype.readAtomText = function() {
        this.skipWhitespace();
        var text = '';

        while (this.pos < this.input.length) {
            var ch = this.input[this.pos];

            // 遇到逻辑运算符或右括号，停止读取
            if (ch === '&' || ch === '|' || ch === ')') {
                break;
            }

            // 检查是否是 regex: 开头
            if (text === '' && this.input.substring(this.pos, this.pos + 6) === 'regex:') {
                // 读取整个正则表达式，直到遇到未在括号内的 & | 或字符串末尾
                text = 'regex:';
                this.pos += 6;
                // 正则内容读取到下一个 & | 或末尾（不处理括号嵌套，简化处理）
                while (this.pos < this.input.length) {
                    var regexCh = this.input[this.pos];
                    if (regexCh === '&' || regexCh === '|') {
                        break;
                    }
                    text += regexCh;
                    this.pos++;
                }
                return text.trim();
            }

            text += ch;
            this.pos++;
        }

        return text.trim();
    };

    /**
     * 解析入口：expr → orExpr
     */
    Parser.prototype.parseExpr = function() {
        return this.parseOr();
    };

    /**
     * 解析或表达式：orExpr → andExpr ('|' andExpr)*
     */
    Parser.prototype.parseOr = function() {
        var left = this.parseAnd();
        this.skipWhitespace();

        while (this.peek() === '|') {
            this.consume(); // 消费 |
            var right = this.parseAnd();
            left = { type: 'or', left: left, right: right };
            this.skipWhitespace();
        }
        return left;
    };

    /**
     * 解析与表达式：andExpr → notExpr ('&' notExpr)*
     */
    Parser.prototype.parseAnd = function() {
        var left = this.parseNot();
        this.skipWhitespace();

        while (this.peek() === '&') {
            this.consume(); // 消费 &
            var right = this.parseNot();
            left = { type: 'and', left: left, right: right };
            this.skipWhitespace();
        }
        return left;
    };

    /**
     * 解析非表达式：notExpr → '!' notExpr | atom
     */
    Parser.prototype.parseNot = function() {
        this.skipWhitespace();

        if (this.peek() === '!') {
            this.consume(); // 消费 !
            var child = this.parseNot();
            return { type: 'not', child: child };
        }

        return this.parseAtom();
    };

    /**
     * 解析原子：atom → '(' expr ')' | conditionText
     */
    Parser.prototype.parseAtom = function() {
        this.skipWhitespace();

        if (this.peek() === '(') {
            this.consume(); // 消费 (
            var expr = this.parseExpr();
            this.skipWhitespace();
            if (this.peek() === ')') {
                this.consume(); // 消费 )
            }
            return expr;
        }

        // 读取条件文本
        var text = this.readAtomText();
        if (text.length === 0) {
            return { type: 'atom', value: '' };
        }
        return { type: 'atom', value: text };
    };

    // ========== AST 评估 ==========

    /**
     * 递归评估 AST
     * @param {Object} ast - AST 节点
     * @param {string} text - 待匹配文本
     * @returns {boolean}
     */
    function evaluate(ast, text) {
        if (!ast) return false;

        switch (ast.type) {
            case 'atom':
                return matchAtom(ast.value, text);

            case 'not':
                // 非运算：子节点为 false 时返回 true
                return !evaluate(ast.child, text);

            case 'and':
                // 与运算：左右都为 true
                return evaluate(ast.left, text) && evaluate(ast.right, text);

            case 'or':
                // 或运算：左右任一为 true
                return evaluate(ast.left, text) || evaluate(ast.right, text);

            default:
                return false;
        }
    }

    // ========== 完整条件匹配 ==========

    /**
     * 完整条件匹配（包含+排除）
     * @param {string} includeCondition - 包含条件表达式
     * @param {string} excludeCondition - 排除条件表达式（可选）
     * @param {string} text - 待匹配文本
     * @param {Array} synonymGroups - 同义词组（可选）
     * @returns {boolean} 匹配成功返回 true
     */
    function matchCondition(includeCondition, excludeCondition, text, synonymGroups) {
        if (!includeCondition || !text) return false;

        // 1. 全角归一化文本
        text = normalizeFullWidth(text);

        // 2. 同义词展开（如果有）
        var expandedCondition = includeCondition;
        if (synonymGroups && synonymGroups.length > 0) {
            expandedCondition = window.SynonymExpander.expand(includeCondition, synonymGroups);
        }

        // 3. 全角归一化条件
        expandedCondition = normalizeFullWidth(expandedCondition);

        // 4. 解析包含条件为 AST
        var parser = new Parser(expandedCondition);
        var ast = parser.parseExpr();

        // 5. 评估包含条件
        var includeResult = evaluate(ast, text);
        if (!includeResult) return false;

        // 6. 如果有排除条件，评估排除条件
        if (excludeCondition && excludeCondition.trim().length > 0) {
            var expandedExclude = excludeCondition;
            if (synonymGroups && synonymGroups.length > 0) {
                expandedExclude = window.SynonymExpander.expand(excludeCondition, synonymGroups);
            }
            expandedExclude = normalizeFullWidth(expandedExclude);
            var excludeParser = new Parser(expandedExclude);
            var excludeAst = excludeParser.parseExpr();
            var excludeResult = evaluate(excludeAst, text);
            // 排除条件命中 → 不匹配
            if (excludeResult) return false;
        }

        return true;
    }

    // ========== 批量匹配 ==========

    /**
     * 批量匹配：对每行数据执行所有启用的规则
     * @param {Array} rows - 数据行 [{rowIndex, mergedText, ...}]
     * @param {Array} rules - 规则列表 [{id, name, includeCondition, excludeCondition, returnValue, caseSensitive, isEnabled}]
     * @param {Array} synonymGroups - 同义词组列表（可选）
     * @returns {Array} 匹配结果 [{rowIndex, ruleId, ruleName, returnValue, matched}]
     */
    function batchMatch(rows, rules, synonymGroups) {
        var results = [];
        if (!rows || !rules) return results;

        // 过滤启用的规则
        var activeRules = rules.filter(function(r) { return r.isEnabled !== false; });

        for (var i = 0; i < rows.length; i++) {
            var row = rows[i];
            var text = row.mergedText || '';

            for (var j = 0; j < activeRules.length; j++) {
                var rule = activeRules[j];
                var matched = matchCondition(
                    rule.includeCondition,
                    rule.excludeCondition,
                    text,
                    synonymGroups
                );

                results.push({
                    rowIndex: row.rowIndex,
                    ruleId: rule.id,
                    ruleName: rule.name,
                    returnValue: matched ? (rule.returnValue || '') : '',
                    matched: matched
                });
            }
        }

        return results;
    }

    // ========== 公开 API ==========

    return {
        normalizeFullWidth: normalizeFullWidth,
        smartContains: smartContains,
        wildcardMatch: wildcardMatch,
        regexMatch: regexMatch,
        matchAtom: matchAtom,
        parse: function(condition) {
            var parser = new Parser(condition);
            return parser.parseExpr();
        },
        evaluate: evaluate,
        matchCondition: matchCondition,
        batchMatch: batchMatch
    };
})();
