using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;

namespace IdCardVerifier.Utils;

/// <summary>
/// 姓名提取工具类
/// </summary>
public static class NameExtractor
{
    // 姓名提取正则表达式
    private static readonly Regex[] NamePatterns =
    {
        new Regex(@"姓名[：:\s]*([\u4e00-\u9fa5]{2,4})", RegexOptions.Compiled | RegexOptions.IgnoreCase),
        new Regex(@"名字[：:\s]*([\u4e00-\u9fa5]{2,4})", RegexOptions.Compiled | RegexOptions.IgnoreCase)
    };

    /// <summary>
    /// 从文本中提取姓名
    /// </summary>
    public static List<string> ExtractNames(string text)
    {
        var names = new HashSet<string>();

        if (string.IsNullOrWhiteSpace(text))
            return names.ToList();

        foreach (var pattern in NamePatterns)
        {
            var matches = pattern.Matches(text);
            foreach (Match match in matches)
            {
                if (match.Groups.Count > 1)
                {
                    string name = match.Groups[1].Value;
                    if (!IsHiddenName(name))
                    {
                        names.Add(name);
                    }
                }
            }
        }

        return names.ToList();
    }

    /// <summary>
    /// 判断是否为隐藏姓名（包含*、×或"不公布"）
    /// </summary>
    public static bool IsHiddenName(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
            return true;

        return name.Contains('*') || name.Contains('×') || name.Contains("不公布");
    }

    /// <summary>
    /// 过滤隐藏姓名
    /// </summary>
    public static List<string> FilterHiddenNames(List<string> names)
    {
        return names.Where(n => !IsHiddenName(n)).ToList();
    }
}
