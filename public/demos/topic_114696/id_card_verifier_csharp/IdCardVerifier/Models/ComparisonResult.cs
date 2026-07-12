using System;
using System.Collections.Generic;

namespace IdCardVerifier.Models;

/// <summary>
/// 单组比对结果
/// </summary>
public class ComparisonResult
{
    public int GroupIndex { get; set; }
    public List<string> PdfIds { get; set; } = new List<string>();
    public List<string> FileIds { get; set; } = new List<string>();
    public List<string> PdfNames { get; set; } = new List<string>();
    public List<string> FileNames { get; set; } = new List<string>();
    public List<string> FailureReasons { get; set; } = new List<string>();
}

/// <summary>
/// 整体比对结果
/// </summary>
public class OverallResult
{
    public int SuccessCount { get; set; }
    public int FailureCount { get; set; }
    public List<ComparisonResult> GroupResults { get; set; } = new List<ComparisonResult>();
    public string LogContent { get; set; } = "";
}
