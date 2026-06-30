/**
 * Exporter — 多格式导出模块
 *
 * Supports: Markdown, Word (.doc), PDF (print), LaTeX
 */

const Exporter = {

    /**
     * Export content in the specified format
     */
    async export(content, format, filename = '参考答案及评分标准') {
        switch (format) {
            case 'markdown':
                return this.exportMarkdown(content, filename);
            case 'word':
                return this.exportWord(content, filename);
            case 'pdf':
                return this.exportPDF(content, filename);
            case 'latex':
                return this.exportLaTeX(content, filename);
            default:
                throw new Error(`不支持的导出格式：${format}`);
        }
    },

    /**
     * Export as Markdown (.md)
     */
    exportMarkdown(content, filename) {
        const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
        this.download(blob, `${filename}.md`);
    },

    /**
     * Export as Word (.doc) — uses HTML format that Word can open
     */
    exportWord(content, filename) {
        const html = this.markdownToWordHTML(content);
        const blob = new Blob(['\ufeff' + html], { type: 'application/msword;charset=utf-8' });
        this.download(blob, `${filename}.doc`);
    },

    /**
     * Export as PDF — uses browser print
     */
    exportPDF(content, filename) {
        const html = this.markdownToPrintHTML(content, filename);
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            throw new Error('无法打开打印窗口，请检查浏览器弹窗设置');
        }

        printWindow.document.write(html);
        printWindow.document.close();

        // Wait for content to load, then print
        printWindow.onload = () => {
            setTimeout(() => {
                printWindow.print();
            }, 500);
        };
    },

    /**
     * Export as LaTeX (.tex)
     */
    exportLaTeX(content, filename) {
        const latex = this.markdownToLaTeX(content);
        const blob = new Blob([latex], { type: 'application/x-tex;charset=utf-8' });
        this.download(blob, `${filename}.tex`);
    },

    /**
     * Copy content to clipboard
     */
    async copyToClipboard(content) {
        try {
            await navigator.clipboard.writeText(content);
            return true;
        } catch (e) {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = content;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            const success = document.execCommand('copy');
            document.body.removeChild(textarea);
            return success;
        }
    },

    // ================================================================
    // Conversion helpers
    // ================================================================

    /**
     * Convert markdown to Word-compatible HTML
     */
    markdownToWordHTML(markdown) {
        const rendered = this.renderMarkdown(markdown);

        return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="UTF-8">
<title>参考答案及评分标准</title>
<style>
@page {
    size: A4;
    margin: 2.54cm 3.17cm 2.54cm 3.17cm;
}
body {
    font-family: "宋体", "SimSun", "Times New Roman", serif;
    font-size: 12pt;
    line-height: 1.8;
    color: #000;
}
h1 {
    font-size: 18pt;
    font-weight: bold;
    text-align: center;
    margin: 20pt 0 12pt;
    font-family: "黑体", "SimHei", sans-serif;
}
h2 {
    font-size: 14pt;
    font-weight: bold;
    margin: 16pt 0 8pt;
    font-family: "黑体", "SimHei", sans-serif;
    border-bottom: 1pt solid #000;
    padding-bottom: 4pt;
}
h3 {
    font-size: 12pt;
    font-weight: bold;
    margin: 12pt 0 6pt;
}
p {
    margin: 4pt 0;
    text-indent: 2em;
}
p:first-child, h1 + p, h2 + p, h3 + p {
    text-indent: 2em;
}
table {
    width: 100%;
    border-collapse: collapse;
    margin: 8pt 0;
}
td, th {
    border: 1pt solid #000;
    padding: 4pt 8pt;
    text-align: center;
}
th {
    background: #f0f0f0;
    font-weight: bold;
}
.score-line {
    color: #000;
    font-weight: bold;
}
ol, ul {
    margin: 4pt 0 4pt 2em;
}
hr {
    border: none;
    border-top: 1pt solid #000;
    margin: 12pt 0;
}
</style>
</head>
<body>
${rendered}
</body>
</html>`;
    },

    /**
     * Convert markdown to print-friendly HTML for PDF export
     */
    markdownToPrintHTML(markdown, title) {
        const rendered = this.renderMarkdown(markdown);

        return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>${title}</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
<script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"></script>
<style>
@page {
    size: A4;
    margin: 2.54cm 3.17cm 2.54cm 3.17cm;
}
body {
    font-family: "Georgia", "Songti SC", "SimSun", serif;
    font-size: 12pt;
    line-height: 2;
    color: #1a202c;
    max-width: 100%;
    padding: 20px;
}
h1 {
    font-size: 18pt;
    text-align: center;
    margin: 24pt 0 12pt;
    color: #1a365d;
}
h2 {
    font-size: 14pt;
    color: #1a365d;
    border-bottom: 2px solid #e2e8f0;
    padding-bottom: 6px;
    margin: 20pt 0 8pt;
}
h3 {
    font-size: 12pt;
    color: #1a365d;
    margin: 12pt 0 6pt;
}
p { margin: 6pt 0; }
table {
    width: 100%;
    border-collapse: collapse;
    margin: 12pt 0;
    font-size: 11pt;
}
td, th {
    border: 1px solid #666;
    padding: 6pt 8pt;
    text-align: center;
}
th { background: #f0f2f5; font-weight: bold; }
.score-line {
    color: #b7791f;
    font-weight: bold;
}
ol, ul { margin: 6pt 0 6pt 24pt; }
hr { border: none; border-top: 1px solid #ccc; margin: 16pt 0; }
.katex { font-size: 1.1em; }
.katex-display {
    margin: 8pt 0;
    overflow-x: auto;
    overflow-y: hidden;
}
.question-header {
    font-weight: bold;
    font-size: 12pt;
    color: #1a365d;
    padding: 6pt 10pt;
    background: #f7f8fa;
    border-left: 4px solid #1a365d;
    margin: 16pt 0 6pt;
}
.solution-label {
    font-weight: bold;
    color: #b7791f;
    margin: 8pt 0 4pt;
}
@media print {
    body { padding: 0; max-width: none; }
    .no-print { display: none; }
}
</style>
</head>
<body>
${rendered}
<script>
document.addEventListener('DOMContentLoaded', function() {
    if (typeof renderMathInElement !== 'undefined') {
        renderMathInElement(document.body, {
            delimiters: [
                {left: '$$', right: '$$', display: true},
                {left: '$', right: '$', display: false},
                {left: '\\[', right: '\\]', display: true},
                {left: '\\(', right: '\\)', display: false}
            ],
            throwOnError: false
        });
    }
});
</script>
</body>
</html>`;
    },

    /**
     * Convert markdown to LaTeX document
     */
    markdownToLaTeX(markdown) {
        let latex = markdown;

        // Document header
        let result = `\\documentclass[12pt,a4paper]{article}
\\usepackage[UTF8]{ctex}
\\usepackage{amsmath,amssymb,amsthm}
\\usepackage{geometry}
\\geometry{top=2.54cm,bottom=2.54cm,left=3.17cm,right=3.17cm}
\\usepackage{enumitem}
\\usepackage{booktabs}
\\usepackage{longtable}
\\usepackage{array}
\\usepackage{ulem}

\\begin{document}

`;

        // Convert headers
        latex = latex.replace(/^### (.+)$/gm, '\\subsubsection*{$1}');
        latex = latex.replace(/^## (.+)$/gm, '\\subsection*{$1}');
        latex = latex.replace(/^# (.+)$/gm, '\\section*{$1}');

        // Convert horizontal rules
        latex = latex.replace(/^---$/gm, '\\noindent\\rule{\\textwidth}{0.5pt}');

        // Convert bold
        latex = latex.replace(/\*\*(.+?)\*\*/g, '\\textbf{$1}');

        // Convert italic
        latex = latex.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '\\textit{$1}');

        // Convert display math ($$...$$)
        latex = latex.replace(/\$\$([\s\S]+?)\$\$/g, '\\[$1\\]');

        // Convert inline math ($...$)
        latex = latex.replace(/(?<!\$)\$(?!\$)(.+?)(?<!\$)\$(?!\$)/g, '\\($1\\)');

        // Convert lists
        latex = latex.replace(/^\d+\.\s+(.+)$/gm, '\\item $1');

        // Clean up extra whitespace
        latex = latex.replace(/\n{3,}/g, '\n\n');

        result += latex;
        result += '\n\n\\end{document}\n';

        return result;
    },

    /**
     * Render markdown to HTML (simplified, for preview)
     * Uses marked.js if available, otherwise basic conversion
     */
    renderMarkdown(markdown) {
        if (typeof marked !== 'undefined') {
            try {
                marked.setOptions({
                    breaks: true,
                    gfm: true
                });
                return marked.parse(markdown);
            } catch (e) {
                console.warn('Marked.js parse failed, using fallback:', e);
            }
        }

        // Fallback: basic markdown to HTML
        return this.basicMarkdownToHTML(markdown);
    },

    /**
     * Basic markdown to HTML conversion (fallback)
     */
    basicMarkdownToHTML(md) {
        let html = md;

        // Escape HTML
        html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

        // Headers
        html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
        html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
        html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

        // Horizontal rules
        html = html.replace(/^---$/gm, '<hr>');

        // Bold and italic
        html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

        // Line breaks
        html = html.replace(/\n/g, '<br>\n');

        // Paragraphs
        html = '<p>' + html + '</p>';
        html = html.replace(/<br><br>/g, '</p><p>');
        html = html.replace(/<h(\d)>(.+?)<\/h\1>/g, '</p><h$1>$2</h$1><p>');

        return html;
    },

    /**
     * Trigger download
     */
    download(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 100);
    }
};

// Export
window.Exporter = Exporter;
