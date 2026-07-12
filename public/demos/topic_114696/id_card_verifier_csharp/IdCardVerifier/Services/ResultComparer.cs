using System;
using System.Collections.Generic;
using System.Linq;

namespace IdCardVerifier.Services;

/// <summary>
/// 身份证号码和姓名比较结果
/// </summary>
public class CompareResult
{
    public List<string> MatchedIds { get; set; } = new List<string>();
    public List<string> PdfOnlyIds { get; set; } = new List<string>();
    public List<string> FileOnlyIds { get; set; } = new List<string>();
    public List<string> MatchedNames { get; set; } = new List<string>();
    public List<string> PdfOnlyNames { get; set; } = new List<string>();
    public List<string> FileOnlyNames { get; set; } = new List<string>();
}

/// <summary>
/// 身份证和姓名比较服务
/// </summary>
public static class ResultComparer
{
    /// <summary>
    /// 比较两组身份证号码和姓名
    /// </summary>
    public static CompareResult Compare(
        List<string> pdfIds, 
        List<string> fileIds, 
        List<string> pdfNames, 
        List<string> fileNames, 
        bool validateId = true)
    {
        var result = new CompareResult();

        var pdfIdSet = new HashSet<string>(pdfIds);
        var fileIdSet = new HashSet<string>(fileIds);

        foreach (var id in pdfIdSet.Intersect(fileIdSet))
        {
            result.MatchedIds.Add(id);
        }

        foreach (var id in pdfIdSet.Except(fileIdSet))
        {
            result.PdfOnlyIds.Add(id);
        }

        foreach (var id in fileIdSet.Except(pdfIdSet))
        {
            result.FileOnlyIds.Add(id);
        }

        var pdfNameSet = new HashSet<string>(pdfNames);
        var fileNameSet = new HashSet<string>(fileNames);

        foreach (var name in pdfNameSet.Intersect(fileNameSet))
        {
            result.MatchedNames.Add(name);
        }

        foreach (var name in pdfNameSet.Except(fileNameSet))
        {
            result.PdfOnlyNames.Add(name);
        }

        foreach (var name in fileNameSet.Except(pdfNameSet))
        {
            result.FileOnlyNames.Add(name);
        }

        return result;
    }
}
