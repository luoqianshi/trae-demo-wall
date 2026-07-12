using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using UglyToad.PdfPig;
using UglyToad.PdfPig.Content;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;
using SharpCompress.Archives;
using SharpCompress.Archives.Zip;
using SharpCompress.Archives.Rar;
using SharpCompress.Archives.SevenZip;
using SharpCompress.Common;

namespace IdCardVerifier.Services;

/// <summary>
/// 文档处理服务
/// </summary>
public class DocumentService
{
    private readonly OcrService _ocrService;
    private readonly StringBuilder _logBuilder;

    public DocumentService(OcrService ocrService, StringBuilder logBuilder)
    {
        _ocrService = ocrService;
        _logBuilder = logBuilder;
    }

    /// <summary>
    /// 从PDF提取文本
    /// </summary>
    public string ExtractTextFromPdf(string pdfPath)
    {
        try
        {
            using (var pdf = PdfDocument.Open(pdfPath))
            {
                var text = new StringBuilder();
                int pageNum = 0;
                foreach (var page in pdf.GetPages())
                {
                    pageNum++;
                    string pageText = page.Text;
                    text.AppendLine(pageText);
                    Log($"PDF第{pageNum}页文本长度: {pageText.Length} 字符");
                    if (pageText.Length > 0)
                    {
                        Log($"PDF第{pageNum}页预览: {pageText.Substring(0, Math.Min(200, pageText.Length))}...");
                    }
                }
                return text.ToString();
            }
        }
        catch (Exception ex)
        {
            Log($"提取PDF文本失败: {pdfPath}, 错误: {ex.Message}");
            return "";
        }
    }

    /// <summary>
    /// 从Word文档提取文本 (使用DocumentFormat.OpenXml, 微软官方免费库)
    /// </summary>
    public string ExtractTextFromWord(string docxPath)
    {
        try
        {
            using (var wordDoc = WordprocessingDocument.Open(docxPath, false))
            {
                var body = wordDoc.MainDocumentPart?.Document?.Body;
                if (body == null)
                    return "";

                var text = new StringBuilder();
                
                foreach (var paragraph in body.Descendants<Paragraph>())
                {
                    text.AppendLine(paragraph.InnerText);
                }
                
                foreach (var table in body.Descendants<Table>())
                {
                    foreach (var row in table.Descendants<TableRow>())
                    {
                        foreach (var cell in row.Descendants<TableCell>())
                        {
                            text.AppendLine(cell.InnerText);
                        }
                    }
                }
                
                return text.ToString();
            }
        }
        catch (Exception ex)
        {
            Log($"提取Word文本失败: {docxPath}, 错误: {ex.Message}");
            return "";
        }
    }

    /// <summary>
    /// 从文本文件读取
    /// </summary>
    public string ExtractTextFromTextFile(string txtPath)
    {
        try
        {
            try
            {
                return File.ReadAllText(txtPath, Encoding.UTF8);
            }
            catch
            {
                return File.ReadAllText(txtPath, Encoding.GetEncoding("GBK"));
            }
        }
        catch (Exception ex)
        {
            Log($"读取文本文件失败: {txtPath}, 错误: {ex.Message}");
            return "";
        }
    }

    /// <summary>
    /// 解压压缩包并返回文件列表
    /// </summary>
    public (List<string> files, string? error) ExtractArchive(string archivePath, string tempDir)
    {
        var files = new List<string>();
        string? error = null;

        try
        {
            string extractDir = Path.Combine(tempDir, "extracted");
            Directory.CreateDirectory(extractDir);

            string lowerPath = archivePath.ToLower();

            if (lowerPath.EndsWith(".zip"))
            {
                using (var archive = ZipArchive.Open(archivePath))
                {
                    foreach (var entry in archive.Entries.Where(e => !e.IsDirectory))
                    {
                        string targetPath = Path.GetFullPath(Path.Combine(extractDir, entry.Key));
                        if (!targetPath.StartsWith(extractDir, StringComparison.Ordinal))
                        {
                            Log($"检测到不安全的文件路径: {entry.Key}");
                            error = "压缩包包含不安全的文件路径";
                            return (files, error);
                        }

                        entry.WriteToFile(targetPath, new ExtractionOptions { ExtractFullPath = true, Overwrite = true });
                    }
                }
            }
            else if (lowerPath.EndsWith(".rar"))
            {
                try
                {
                    using (var archive = RarArchive.Open(archivePath))
                    {
                        foreach (var entry in archive.Entries.Where(e => !e.IsDirectory))
                        {
                            string targetPath = Path.GetFullPath(Path.Combine(extractDir, entry.Key));
                            if (!targetPath.StartsWith(extractDir, StringComparison.Ordinal))
                            {
                                Log($"检测到不安全的文件路径: {entry.Key}");
                                error = "压缩包包含不安全的文件路径";
                                return (files, error);
                            }

                            entry.WriteToFile(targetPath, new ExtractionOptions { ExtractFullPath = true, Overwrite = true });
                        }
                    }
                }
                catch (Exception ex)
                {
                    Log($"RAR解压失败，尝试其他方法...");
                    Log($"错误详情: {ex.Message}");
                    Log("RAR格式需要安装WinRAR或使用替代方案");
                    Log("💡 建议方案:");
                    Log("  1. 请用户在本地电脑安装 WinRAR: https://www.win-rar.com/download.html");
                    Log("  2. 或者将 RAR 文件转换为 ZIP 格式再使用");
                    Log("  3. 或者直接在压缩软件中将身份证图片提取出来再使用");
                    error = "RAR格式需要WinRAR，请安装WinRAR或转换为ZIP格式";
                    return (files, error);
                }
            }
            else if (lowerPath.EndsWith(".7z"))
            {
                using (var archive = SevenZipArchive.Open(archivePath))
                {
                    foreach (var entry in archive.Entries.Where(e => !e.IsDirectory))
                    {
                        string targetPath = Path.GetFullPath(Path.Combine(extractDir, entry.Key));
                        if (!targetPath.StartsWith(extractDir, StringComparison.Ordinal))
                        {
                            Log($"检测到不安全的文件路径: {entry.Key}");
                            error = "压缩包包含不安全的文件路径";
                            return (files, error);
                        }

                        entry.WriteToFile(targetPath, new ExtractionOptions { ExtractFullPath = true, Overwrite = true });
                    }
                }
            }

            files = Directory.GetFiles(extractDir, "*.*", SearchOption.AllDirectories).ToList();
            Log($"解压成功: {archivePath} -> 共找到 {files.Count} 个文件");
            foreach (var file in files)
            {
                Log($"发现文件: {file}");
            }
        }
        catch (Exception ex)
        {
            Log($"解压文件失败: {archivePath}, 错误: {ex.Message}");
            error = $"解压失败: {ex.Message}";
        }

        return (files, error);
    }

    /// <summary>
    /// 从文件中提取身份证号码和姓名
    /// </summary>
    public (List<string> ids, List<string> names) ExtractIdsAndNamesFromFile(string filePath)
    {
        return ExtractIdsAndNamesFromFile(filePath, validateId: true);
    }

    /// <summary>
    /// 从文件中提取身份证号码和姓名（可配置校验）
    /// </summary>
    public (List<string> ids, List<string> names) ExtractIdsAndNamesFromFile(string filePath, bool validateId)
    {
        var ids = new List<string>();
        var names = new List<string>();

        string lowerPath = filePath.ToLower();
        var imageExtensions = new[] { ".png", ".jpg", ".jpeg", ".bmp", ".tiff", ".gif" };

        if (imageExtensions.Contains(Path.GetExtension(lowerPath)))
        {
            var (imageIds, text, _) = _ocrService.RecognizeIdCard(filePath);
            if (validateId)
            {
                ids.AddRange(imageIds.Where(Utils.IdCardValidator.Validate));
            }
            else
            {
                ids.AddRange(imageIds);
            }
            names.AddRange(Utils.NameExtractor.ExtractNames(text));
        }
        else if (lowerPath.EndsWith(".pdf"))
        {
            string text = ExtractTextFromPdf(filePath);
            var extractedIds = Utils.IdCardValidator.ExtractIds(text, validate: validateId);
            Log($"从PDF提取到身份证号码: {string.Join(", ", extractedIds)}");
            ids.AddRange(extractedIds);
            names.AddRange(Utils.NameExtractor.ExtractNames(text));
        }
        else if (lowerPath.EndsWith(".docx"))
        {
            string text = ExtractTextFromWord(filePath);
            ids.AddRange(Utils.IdCardValidator.ExtractIds(text, validate: validateId));
            names.AddRange(Utils.NameExtractor.ExtractNames(text));
        }
        else if (lowerPath.EndsWith(".txt"))
        {
            string text = ExtractTextFromTextFile(filePath);
            ids.AddRange(Utils.IdCardValidator.ExtractIds(text, validate: validateId));
            names.AddRange(Utils.NameExtractor.ExtractNames(text));
        }

        ids = ids.Distinct().ToList();
        names = names.Distinct().ToList();

        return (ids, names);
    }

    /// <summary>
    /// 添加公开的Log方法供外部调用
    /// </summary>
    public void Log(string message)
    {
        _logBuilder.AppendLine(message);
    }
}
