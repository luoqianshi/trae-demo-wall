/**
 * 同义词展开器
 * 移植自 SmartMatchApp/Services/MatchEngine.cs 的同义词展开逻辑
 *
 * 功能：将规则中的 $[组名] 语法展开为 (主词|同义词1|同义词2|...)
 * 限制：仅展开1层，不递归展开嵌套引用
 */
window.SynonymExpander = {
    /**
     * 展开 $[组名] 引用
     * @param {string} condition - 条件表达式，可能含 $[组名]
     * @param {Array} groups - 同义词组列表 [{name, mainWord, synonyms:[]}]
     * @returns {string} 展开后的条件表达式
     *
     * 示例：
     *   condition = "$[钢管] & DN50"
     *   groups = [{name:'钢管', mainWord:'钢管', synonyms:['无缝钢管','焊接钢管']}]
     *   返回 "(钢管|无缝钢管|焊接钢管) & DN50"
     */
    expand: function(condition, groups) {
        if (!condition || !groups || groups.length === 0) return condition;

        var result = condition;
        // 用正则匹配 $[组名] 语法
        result = result.replace(/\$\[([^\]]+)\]/g, function(match, groupName) {
            // 查找对应的同义词组
            var group = null;
            for (var i = 0; i < groups.length; i++) {
                if (groups[i].name === groupName) {
                    group = groups[i];
                    break;
                }
            }
            if (!group) return match; // 未找到组，保持原样

            // 拼接主词 + 同义词列表
            var allWords = [group.mainWord];
            if (group.synonyms && group.synonyms.length > 0) {
                allWords = allWords.concat(group.synonyms);
            }
            return '(' + allWords.join('|') + ')';
        });
        return result;
    }
};
