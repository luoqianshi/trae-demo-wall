using System;
using System.Collections.Generic;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using IdCardVerifier.Models;
using IdCardVerifier.Services;
using IdCardVerifier.Utils;

namespace IdCardVerifier;

public partial class MainForm : Form
{
    private readonly List<string> _pdfFiles = new List<string>();
    private readonly List<string> _verifyFiles = new List<string>();
    private bool _isProcessing = false;

    public MainForm()
    {
        InitializeComponent();
        InitializeDragDrop();
    }

    private void InitializeDragDrop()
    {
        pdfListBox.AllowDrop = true;
        verifyListBox.AllowDrop = true;

        pdfListBox.DragEnter += (s, e) =>
        {
            if (e.Data?.GetDataPresent(DataFormats.FileDrop) == true)
                e.Effect = DragDropEffects.Copy;
        };

        pdfListBox.DragDrop += (s, e) =>
        {
            if (e.Data?.GetData(DataFormats.FileDrop) is string[] files)
            {
                AddPdfFiles(files.Where(f => f.ToLower().EndsWith(".pdf")));
            }
        };

        verifyListBox.DragEnter += (s, e) =>
        {
            if (e.Data?.GetDataPresent(DataFormats.FileDrop) == true)
                e.Effect = DragDropEffects.Copy;
        };

        verifyListBox.DragDrop += (s, e) =>
        {
            if (e.Data?.GetData(DataFormats.FileDrop) is string[] files)
            {
                AddVerifyFiles(files);
            }
        };
    }

    private void AddPdfFiles(IEnumerable<string> files)
    {
        foreach (var file in files)
        {
            if (!_pdfFiles.Contains(file))
            {
                _pdfFiles.Add(file);
                pdfListBox.Items.Add(file);
            }
        }
    }

    private void AddVerifyFiles(IEnumerable<string> files)
    {
        var allowedExtensions = new[] { ".zip", ".rar", ".7z", ".png", ".jpg", ".jpeg", ".bmp", ".tiff", ".gif", ".pdf", ".docx", ".txt" };

        foreach (var file in files)
        {
            string ext = Path.GetExtension(file).ToLower();
            if (allowedExtensions.Contains(ext) && !_verifyFiles.Contains(file))
            {
                _verifyFiles.Add(file);
                verifyListBox.Items.Add(file);
            }
        }
    }

    private void btnAddPdf_Click(object sender, EventArgs e)
    {
        using var dialog = new OpenFileDialog
        {
            Filter = "PDF文件|*.pdf|所有文件|*.*",
            Multiselect = true,
            Title = "选择PDF文件"
        };

        if (dialog.ShowDialog() == DialogResult.OK)
        {
            AddPdfFiles(dialog.FileNames);
        }
    }

    private void btnAddVerify_Click(object sender, EventArgs e)
    {
        using var dialog = new OpenFileDialog
        {
            Filter = "所有文件|*.*|图片文件|*.png;*.jpg;*.jpeg;*.bmp;*.tiff;*.gif|压缩文件|*.zip;*.rar;*.7z",
            Multiselect = true,
            Title = "选择核实材料"
        };

        if (dialog.ShowDialog() == DialogResult.OK)
        {
            AddVerifyFiles(dialog.FileNames);
        }
    }

    private void btnRemovePdf_Click(object sender, EventArgs e)
    {
        while (pdfListBox.SelectedIndices.Count > 0)
        {
            int index = pdfListBox.SelectedIndices[0];
            _pdfFiles.RemoveAt(index);
            pdfListBox.Items.RemoveAt(index);
        }
    }

    private void btnRemoveVerify_Click(object sender, EventArgs e)
    {
        while (verifyListBox.SelectedIndices.Count > 0)
        {
            int index = verifyListBox.SelectedIndices[0];
            _verifyFiles.RemoveAt(index);
            verifyListBox.Items.RemoveAt(index);
        }
    }

    private void btnClearAll_Click(object sender, EventArgs e)
    {
        _pdfFiles.Clear();
        _verifyFiles.Clear();
        pdfListBox.Items.Clear();
        verifyListBox.Items.Clear();
        txtResult.Clear();
        progressBar.Value = 0;
    }

    private async void btnStart_Click(object sender, EventArgs e)
    {
        if (_isProcessing) return;

        if (_pdfFiles.Count == 0 || _verifyFiles.Count == 0)
        {
            MessageBox.Show("请先添加PDF文件和核实材料！", "提示", MessageBoxButtons.OK, MessageBoxIcon.Warning);
            return;
        }

        if (_pdfFiles.Count != _verifyFiles.Count)
        {
            MessageBox.Show("PDF文件和核实材料数量不匹配！", "提示", MessageBoxButtons.OK, MessageBoxIcon.Warning);
            return;
        }

        _isProcessing = true;
        btnStart.Enabled = false;
        btnClearAll.Enabled = false;
        txtResult.Clear();
        progressBar.Value = 0;

        try
        {
            var result = await Task.Run(() => ProcessComparison());
            DisplayResult(result);
            SaveLogToFile(result.LogContent);
        }
        catch (Exception ex)
        {
            txtResult.AppendText($"\n处理过程中发生错误: {ex.Message}\n");
        }
        finally
        {
            _isProcessing = false;
            btnStart.Enabled = true;
            btnClearAll.Enabled = true;
        }
    }

    private OverallResult ProcessComparison()
    {
        var result = new OverallResult();
        var logBuilder = new StringBuilder();
        var tempDir = Path.Combine(Path.GetTempPath(), "IdCardVerifier_" + Guid.NewGuid().ToString("N"));

        try
        {
            Directory.CreateDirectory(tempDir);
            logBuilder.AppendLine($"开始处理, 共 {_pdfFiles.Count} 组");

            using var ocrService = new OcrService(logBuilder);
            var docService = new DocumentService(ocrService, logBuilder);

            for (int i = 0; i < _pdfFiles.Count; i++)
            {
                int progress = (int)((i / (double)_pdfFiles.Count) * 100);
                UpdateProgress(progress, $"正在处理第 {i + 1}/{_pdfFiles.Count} 组...");
                logBuilder.AppendLine($"处理第 {i + 1} 组: PDF={_pdfFiles[i]}, 材料={_verifyFiles[i]}");

                var groupResult = new ComparisonResult { GroupIndex = i + 1 };
                var failureReasons = new List<string>();

                try
                {
                    bool validateId = chkValidateId.Checked;

                    logBuilder.AppendLine("正在提取PDF内容...");
                    string pdfText = docService.ExtractTextFromPdf(_pdfFiles[i]);
                    groupResult.PdfIds = IdCardValidator.ExtractIds(pdfText, validate: validateId);
                    if (chkCheckNames.Checked)
                    {
                        groupResult.PdfNames = NameExtractor.ExtractNames(pdfText);
                    }

                    logBuilder.AppendLine("正在处理核实材料...");
                    var (materialIds, materialNames, materialError) = ProcessVerifyMaterial(
                        _verifyFiles[i], docService, ocrService, tempDir, validateId);

                    if (!string.IsNullOrEmpty(materialError))
                    {
                        failureReasons.Add(materialError);
                    }

                    groupResult.FileIds = materialIds;
                    if (chkCheckNames.Checked)
                    {
                        groupResult.FileNames = materialNames;
                    }

                    if (groupResult.PdfIds.Count == 0)
                    {
                        failureReasons.Add("PDF中未提取到身份证号码, 可能是扫描件或格式不支持");
                    }
                    if (groupResult.FileIds.Count == 0 && !failureReasons.Any())
                    {
                        failureReasons.Add("核实材料中未识别到身份证号码, 请检查图片是否清晰");
                    }

                    groupResult.FailureReasons = failureReasons;
                    result.GroupResults.Add(groupResult);

                    if (groupResult.PdfIds.Intersect(groupResult.FileIds).Any())
                    {
                        result.SuccessCount++;
                    }
                    else
                    {
                        result.FailureCount++;
                    }
                }
                catch (Exception ex)
                {
                    result.FailureCount++;
                    logBuilder.AppendLine($"处理第 {i + 1} 组时发生错误: {ex.Message}");
                    groupResult.FailureReasons.Add($"处理出错: {ex.Message}");
                    result.GroupResults.Add(groupResult);
                }
            }

            UpdateProgress(100, "处理完成");
            result.LogContent = logBuilder.ToString();
        }
        catch (Exception ex)
        {
            logBuilder.AppendLine($"处理过程中发生严重错误: {ex.Message}");
            result.LogContent = logBuilder.ToString();
        }
        finally
        {
            try
            {
                if (Directory.Exists(tempDir))
                {
                    Directory.Delete(tempDir, true);
                }
            }
            catch { }
        }

        return result;
    }

    private (List<string> ids, List<string> names, string? error) ProcessVerifyMaterial(
        string filePath, DocumentService docService, OcrService ocrService, string tempDir, bool validateId)
    {
        var ids = new List<string>();
        var names = new List<string>();
        string? error = null;

        string lowerPath = filePath.ToLower();
        var archiveExtensions = new[] { ".zip", ".rar", ".7z" };

        if (archiveExtensions.Contains(Path.GetExtension(lowerPath)))
        {
            var (extractedFiles, extractError) = docService.ExtractArchive(filePath, tempDir);
            if (!string.IsNullOrEmpty(extractError))
            {
                error = extractError;
            }
            else if (extractedFiles.Count == 0)
            {
                error = "核实材料解压后未找到任何文件";
            }
            else
            {
                foreach (var file in extractedFiles)
                {
                    var (fileIds, fileNames) = docService.ExtractIdsAndNamesFromFile(file, validateId);
                    ids.AddRange(fileIds);
                    names.AddRange(fileNames);
                }
            }
        }
        else
        {
            docService.Log($"直接处理文件: {filePath}");
            var (fileIds, fileNames) = docService.ExtractIdsAndNamesFromFile(filePath, validateId);
            ids.AddRange(fileIds);
            names.AddRange(fileNames);
        }

        ids = ids.Distinct().ToList();
        names = names.Distinct().ToList();

        return (ids, names, error);
    }

    private void DisplayResult(OverallResult result)
    {
        var sb = new StringBuilder();
        bool validateId = chkValidateId.Checked;

        foreach (var group in result.GroupResults)
        {
            sb.AppendLine($"\n{new string('=', 60)}");
            sb.AppendLine($"第 {group.GroupIndex} 组结果:");
            sb.AppendLine($"{new string('-', 60)}");
            sb.AppendLine($"【身份证号码】");
            sb.AppendLine($"  PDF中: {(group.PdfIds.Count > 0 ? string.Join(" | ", group.PdfIds) : "无")}");
            sb.AppendLine($"  材料中: {(group.FileIds.Count > 0 ? string.Join(" | ", group.FileIds) : "无")}");

            var compareResult = ResultComparer.Compare(
                group.PdfIds, group.FileIds, 
                group.PdfNames, group.FileNames, 
                validateId);

            sb.AppendLine($"\n【核对结果】");
            if (compareResult.MatchedIds.Count > 0)
            {
                foreach (var id in compareResult.MatchedIds)
                {
                    sb.AppendLine($"  ✓ 身份证号码匹配成功: {id}");
                }
            }
            if (compareResult.PdfOnlyIds.Count > 0)
            {
                foreach (var id in compareResult.PdfOnlyIds)
                {
                    sb.AppendLine($"  ✗ PDF独有身份证号码: {id}");
                }
            }
            if (compareResult.FileOnlyIds.Count > 0)
            {
                foreach (var id in compareResult.FileOnlyIds)
                {
                    sb.AppendLine($"  ✗ 材料独有身份证号码: {id}");
                }
            }
            if (group.PdfIds.Count == 0 && group.FileIds.Count == 0)
            {
                sb.AppendLine($"  ⚠ 未检测到身份证号码");
            }

            if (chkCheckNames.Checked)
            {
                var hiddenPdfNames = group.PdfNames.Where(NameExtractor.IsHiddenName).ToList();
                var hiddenFileNames = group.FileNames.Where(NameExtractor.IsHiddenName).ToList();
                var filteredPdfNames = NameExtractor.FilterHiddenNames(group.PdfNames);
                var filteredFileNames = NameExtractor.FilterHiddenNames(group.FileNames);

                sb.AppendLine($"\n【姓名】");
                sb.AppendLine($"  PDF中: {(group.PdfNames.Count > 0 ? string.Join(" | ", group.PdfNames) : "无")}");
                if (hiddenPdfNames.Count > 0)
                {
                    sb.AppendLine($"  (已过滤不公布: {string.Join(" | ", hiddenPdfNames)})");
                }
                sb.AppendLine($"  材料中: {(group.FileNames.Count > 0 ? string.Join(" | ", group.FileNames) : "无")}");
                if (hiddenFileNames.Count > 0)
                {
                    sb.AppendLine($"  (已过滤不公布: {string.Join(" | ", hiddenFileNames)})");
                }

                if (compareResult.MatchedNames.Count > 0)
                {
                    foreach (var name in compareResult.MatchedNames)
                    {
                        sb.AppendLine($"  ✓ 姓名匹配: {name}");
                    }
                }
                if (compareResult.PdfOnlyNames.Count > 0)
                {
                    foreach (var name in compareResult.PdfOnlyNames)
                    {
                        sb.AppendLine($"  ⚠ PDF独有姓名: {name}");
                    }
                }
                if (compareResult.FileOnlyNames.Count > 0)
                {
                    foreach (var name in compareResult.FileOnlyNames)
                    {
                        sb.AppendLine($"  ⚠ 材料独有姓名: {name}");
                    }
                }
            }

            if (group.FailureReasons.Count > 0)
            {
                sb.AppendLine($"\n【可能存在的问题】");
                foreach (var reason in group.FailureReasons)
                {
                    sb.AppendLine($"  ⚠ {reason}");
                }
            }
        }

        sb.AppendLine($"\n{new string('=', 60)}");
        sb.AppendLine($"处理完成! 成功: {result.SuccessCount}, 失败: {result.FailureCount}");
        if (result.SuccessCount > 0 && result.FailureCount == 0)
        {
            sb.AppendLine("🎉 所有组的身份证号码均已匹配!");
        }
        else if (result.SuccessCount > 0)
        {
            sb.AppendLine("⚠ 部分匹配成功, 请检查未匹配的项目.");
        }
        else
        {
            sb.AppendLine("✗ 未能匹配到任何身份证号码, 请检查材料是否正确.");
        }
        sb.AppendLine($"{new string('=', 60)}");

        txtResult.AppendText(sb.ToString());
    }

    private void SaveLogToFile(string logContent)
    {
        try
        {
            string logDir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Desktop), "IdCardVerifier_Logs");
            if (!Directory.Exists(logDir))
            {
                Directory.CreateDirectory(logDir);
            }

            string logFileName = $"IdCardVerifier_Log_" + DateTime.Now.ToString("yyyyMMdd_HHmmss") + ".txt";
            string logPath = Path.Combine(logDir, logFileName);

            File.WriteAllText(logPath, logContent, Encoding.UTF8);

            UpdateProgress(100, "\n日志已保存到: " + logPath);
        }
        catch (Exception ex)
        {
            UpdateProgress(100, "\n保存日志失败: " + ex.Message);
        }
    }

    private void UpdateProgress(int value, string message)
    {
        if (InvokeRequired)
        {
            Invoke(new Action(() =>
            {
                progressBar.Value = Math.Min(value, 100);
                txtResult.AppendText(message + "\n");
            }));
        }
        else
        {
            progressBar.Value = Math.Min(value, 100);
            txtResult.AppendText(message + "\n");
        }
    }
}