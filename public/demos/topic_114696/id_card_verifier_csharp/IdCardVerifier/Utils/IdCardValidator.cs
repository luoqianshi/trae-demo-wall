using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;

namespace IdCardVerifier.Utils;

/// <summary>
/// 身份证号码校验工具类
/// </summary>
public static class IdCardValidator
{
    // 加权因子
    private static readonly int[] WeightingFactors = { 7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2 };
    
    // 校验码对应值
    private static readonly char[] CheckCodes = { '1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2' };

    // 身份证号码正则表达式（18位）- 不带^和$，用于在文本中搜索
    private static readonly Regex IdCardRegex = new Regex(
        @"[1-9]\d{5}(?:18|19|20)\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])\d{3}[\dXx]",
        RegexOptions.Compiled);

    // "公民身份号码"标签优先匹配
    private static readonly Regex CitizenIdLabelRegex = new Regex(
        @"公民身份号码[：:]\s*([1-9]\d{5}(?:18|19|20)\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])\d{3}[\dXx])",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);

    // 身份证完整格式校验正则（带^和$，仅用于校验）
    private static readonly Regex IdCardFullRegex = new Regex(
        @"^[1-9]\d{5}(?:18|19|20)\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])\d{3}[\dXx]$",
        RegexOptions.Compiled);

    /// <summary>
    /// 校验身份证号码
    /// </summary>
    public static bool Validate(string idCard)
    {
        if (string.IsNullOrWhiteSpace(idCard) || idCard.Length != 18)
            return false;

        idCard = idCard.ToUpper();

        if (!IdCardFullRegex.IsMatch(idCard))
            return false;

        // 计算校验位
        int sum = 0;
        for (int i = 0; i < 17; i++)
        {
            sum += (idCard[i] - '0') * WeightingFactors[i];
        }

        return CheckCodes[sum % 11] == idCard[17];
    }

    /// <summary>
    /// 从文本中提取所有身份证号码
    /// </summary>
    public static List<string> ExtractIds(string text, bool prioritizeLabel = false, bool validate = true)
    {
        var ids = new HashSet<string>();

        if (string.IsNullOrWhiteSpace(text))
            return ids.ToList();

        // 优先提取"公民身份号码"标签后的号码
        if (prioritizeLabel)
        {
            var labelMatches = CitizenIdLabelRegex.Matches(text);
            foreach (Match match in labelMatches)
            {
                if (match.Groups.Count > 1)
                {
                    string id = match.Groups[1].Value.ToUpper();
                    if (!validate || Validate(id))
                    {
                        ids.Add(id);
                    }
                }
            }
        }

        // 提取所有符合格式的身份证号码
        var matches = IdCardRegex.Matches(text);
        foreach (Match match in matches)
        {
            string id = match.Value.ToUpper();
            if (!validate || Validate(id))
            {
                ids.Add(id);
            }
        }

        return ids.ToList();
    }

    /// <summary>
    /// 判断文本是否包含身份证正面关键词
    /// </summary>
    public static bool IsIdCardFront(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
            return false;

        string lowerText = text.ToLower();
        var frontKeywords = new[] { "公民", "身份", "号码", "姓名", "性别", "民族", "出生", "住址" };
        var backKeywords = new[] { "签发", "机关", "有效期", "有效期限" };

        int frontScore = frontKeywords.Count(kw => lowerText.Contains(kw));
        int backScore = backKeywords.Count(kw => lowerText.Contains(kw));

        return frontScore >= 3 && backScore < 2;
    }
}
