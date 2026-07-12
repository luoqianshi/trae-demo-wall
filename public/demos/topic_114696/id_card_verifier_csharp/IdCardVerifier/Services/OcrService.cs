using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Text;
using PaddleOCRSharp;

namespace IdCardVerifier.Services;

public class OcrService : IDisposable
{
    private PaddleOCREngine? _ocrEngine;
    private bool _disposed;
    private readonly StringBuilder _logBuilder;

    public OcrService(StringBuilder logBuilder)
    {
        _logBuilder = logBuilder;
    }

    public bool Initialize()
    {
        try
        {
            Log("正在初始化OCR引擎...");

            var parameter = new OCRParameter();

            // 先尝试使用本地模型，但出错时回退到内置模型
            try
            {
                string baseDir = AppDomain.CurrentDomain.BaseDirectory;
                string modelsDir = FindModelsDir(baseDir);

                if (!string.IsNullOrEmpty(modelsDir))
                {
                    var config = new OCRModelConfig();
                    config.det_infer = Path.Combine(modelsDir, "det");
                    config.rec_infer = Path.Combine(modelsDir, "rec");

                    string clsPath = Path.Combine(modelsDir, "cls");
                    if (Directory.Exists(clsPath))
                        config.cls_infer = clsPath;

                    string keysPath = Path.Combine(modelsDir, "ppocr_keys.txt");
                    if (File.Exists(keysPath))
                        config.keys = keysPath;

                    Log($"尝试使用本地模型: {modelsDir}");
                    _ocrEngine = new PaddleOCREngine(config, parameter);
                    Log("本地模型初始化成功");
                }
                else
                {
                    // 使用内置轻量版模型
                    Log("使用内置轻量版PP-OCRv4模型");
                    _ocrEngine = new PaddleOCREngine(null, parameter);
                }
            }
            catch (Exception localException)
            {
                Log($"本地模型初始化失败: {localException.Message}");
                Log("回退到内置轻量版模型");
                _ocrEngine = new PaddleOCREngine(null, parameter);
            }

            Log("OCR引擎初始化完成");
            return true;
        }
        catch (Exception ex)
        {
            Log($"OCR引擎初始化失败: {ex.Message}");
            return false;
        }
    }

    private string? FindModelsDir(string baseDir)
    {
        var candidates = new[]
        {
            Path.Combine(baseDir, "models"),
            Path.Combine(baseDir, "orc"),
            Path.GetFullPath(Path.Combine(baseDir, "..", "models")),
            Path.GetFullPath(Path.Combine(baseDir, "..", "orc")),
            Path.GetFullPath(Path.Combine(baseDir, "..", "..", "..", "models")),
            Path.GetFullPath(Path.Combine(baseDir, "..", "..", "..", "orc"))
        };

        foreach (var dir in candidates)
        {
            if (Directory.Exists(Path.Combine(dir, "det")) && Directory.Exists(Path.Combine(dir, "rec")))
                return dir;
        }
        return null;
    }

    public (List<string> ids, string text, bool isFront) RecognizeIdCard(string imagePath)
    {
        var ids = new List<string>();
        string text = "";
        bool isFront = false;

        try
        {
            Log($"\n处理文件: {Path.GetFileName(imagePath)}");

            if (_ocrEngine == null)
            {
                if (!Initialize())
                    return (ids, text, isFront);
            }

            string tempImagePath = imagePath;
            bool isTempFile = false;

            if (imagePath.ToLower().EndsWith(".gif"))
            {
                tempImagePath = ConvertGifToPng(imagePath);
                isTempFile = true;
            }

            var result = _ocrEngine.DetectText(tempImagePath);

            if (result != null && result.TextBlocks != null && result.TextBlocks.Count > 0)
            {
                var fullText = new StringBuilder();
                var ocrResultLog = new StringBuilder();
                ocrResultLog.AppendLine("\n--- OCR完整识别结果 ---");

                int index = 1;
                foreach (var block in result.TextBlocks)
                {
                    fullText.AppendLine(block.Text);
                    ocrResultLog.AppendLine($"[{index}] '{block.Text}' (置信度: {block.Score:F2})");
                    index++;
                }

                ocrResultLog.AppendLine("--------------------------");
                Log(ocrResultLog.ToString());

                text = fullText.ToString();
                isFront = Utils.IdCardValidator.IsIdCardFront(text);
                Log($"是否为身份证正面: {(isFront ? "是" : "否")}");

                if (isFront)
                {
                    ids = Utils.IdCardValidator.ExtractIds(text, prioritizeLabel: true);
                    if (ids.Count > 0)
                        Log($"从'公民身份号码'标签提取到: {string.Join(", ", ids)}");
                }
                else
                {
                    ids = Utils.IdCardValidator.ExtractIds(text, prioritizeLabel: false);
                }

                Log($"提取到的身份证号码: {(ids.Count > 0 ? string.Join(", ", ids) : "无")}");
            }
            else
            {
                Log("\n--- OCR识别结果: 未检测到文本 ---");
            }

            if (isTempFile && File.Exists(tempImagePath))
                File.Delete(tempImagePath);
        }
        catch (Exception ex)
        {
            Log($"图片OCR识别失败: {imagePath}, 错误: {ex.Message}");
        }

        return (ids, text, isFront);
    }

    private string ConvertGifToPng(string gifPath)
    {
        string tempPath = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString("N") + ".png");
        using (var ms = new MemoryStream())
        {
            using (var gif = Image.FromFile(gifPath))
                gif.Save(ms, ImageFormat.Png);
            File.WriteAllBytes(tempPath, ms.ToArray());
        }
        return tempPath;
    }

    private void Log(string message) => _logBuilder.AppendLine(message);

    #region Dispose

    ~OcrService() { Dispose(false); }
    public void Dispose() { Dispose(true); GC.SuppressFinalize(this); }
    protected virtual void Dispose(bool disposing)
    {
        if (_disposed) return;
        if (disposing) _ocrEngine?.Dispose();
        _disposed = true;
    }

    #endregion
}
