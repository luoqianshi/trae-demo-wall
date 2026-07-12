# 身份证号码核对工具 v2.5 (C# 版本)

## 简介

这是一个使用 C# + WinForms + PaddleOCR 开发的身份证号码核对工具，解决了 Python 版本打包为 EXE 时的兼容性问题。

## 功能特性

- ✅ 支持身份证正面检测（关键词匹配）
- ✅ 优先提取"公民身份号码"标签后的号码
- ✅ 身份证校验位验证（可选）
- ✅ 姓名提取与核对
- ✅ 支持 PDF/Word/图片/压缩包
- ✅ 文件拖拽功能
- ✅ 多组批量比对
- ✅ 完整的日志记录（自动保存到桌面）
- ✅ Zip Slip 安全防护
- ✅ 完整的 Dispose 资源管理

## 系统要求

- Windows 7 及以上
- .NET 6.0 Runtime（可从 Microsoft 官网下载）

## 编译说明

### 前置要求

1. 安装 [.NET 6.0 SDK](https://dotnet.microsoft.com/download/dotnet/6.0)
2. 确保可以访问 NuGet

### 编译步骤

```bash
cd IdCardVerifier
dotnet build -c Release
```

### 发布为单文件 EXE

```bash
dotnet publish -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true
```

生成的文件位于: `bin/Release/net6.0-windows/win-x64/publish/`

## 使用说明

1. 运行程序
2. 添加 PDF 文件（请求书）
3. 添加核实材料（可以是图片、PDF、Word、压缩包）
4. （可选）勾选"校验身份证号码"进行校验位验证
5. （可选）勾选"同时核对姓名"进行姓名比对
6. 点击"开始核对"
7. 查看比对结果
8. 日志自动保存到桌面 `IdCardVerifier_Logs` 文件夹

## 依赖库

- `PaddleOCRSharp` - OCR识别
- `PdfPig` - PDF文本提取
- `DocumentFormat.OpenXml` - Word文档处理（微软官方，免费）
- `SharpCompress` - 压缩包处理
- `System.Drawing.Common` - 图像处理
- `System.Text.Encoding.CodePages` - 中文编码支持

## 项目结构

```
IdCardVerifier/
├── Models/
│   └── ComparisonResult.cs    # 数据模型
├── Services/
│   ├── OcrService.cs          # OCR服务
│   ├── DocumentService.cs     # 文档处理服务
│   └── ResultComparer.cs      # 结果比较服务
├── Utils/
│   ├── IdCardValidator.cs     # 身份证校验
│   └── NameExtractor.cs       # 姓名提取
├── MainForm.cs                # 主窗体
├── MainForm.Designer.cs       # 窗体设计
├── Program.cs                 # 程序入口
└── IdCardVerifier.csproj      # 项目文件
```

## 更新记录

### v2.5.1
- 修复身份证校验选项实现
- 替换 Word 处理库为微软官方免费 DocumentFormat.OpenXml
- 添加 GBK 编码支持
- 实现完整的 Dispose 资源管理模式
- 添加日志持久化功能（自动保存到桌面）
- 完善结果比较逻辑
- 添加 Zip Slip 安全防护

