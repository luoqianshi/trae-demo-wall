namespace IdCardVerifier;

partial class MainForm
{
    private System.ComponentModel.IContainer components = null;

    protected override void Dispose(bool disposing)
    {
        if (disposing && (components != null))
        {
            components.Dispose();
        }
        base.Dispose(disposing);
    }

    #region Windows Form Designer generated code

    private void InitializeComponent()
    {
        this.lblPdfFiles = new System.Windows.Forms.Label();
        this.pdfListBox = new System.Windows.Forms.ListBox();
        this.btnAddPdf = new System.Windows.Forms.Button();
        this.btnRemovePdf = new System.Windows.Forms.Button();
        this.lblVerifyFiles = new System.Windows.Forms.Label();
        this.verifyListBox = new System.Windows.Forms.ListBox();
        this.btnAddVerify = new System.Windows.Forms.Button();
        this.btnRemoveVerify = new System.Windows.Forms.Button();
        this.chkValidateId = new System.Windows.Forms.CheckBox();
        this.chkCheckNames = new System.Windows.Forms.CheckBox();
        this.btnStart = new System.Windows.Forms.Button();
        this.btnClearAll = new System.Windows.Forms.Button();
        this.progressBar = new System.Windows.Forms.ProgressBar();
        this.txtResult = new System.Windows.Forms.TextBox();
        this.pnlPdf = new System.Windows.Forms.Panel();
        this.pnlVerify = new System.Windows.Forms.Panel();
        this.pnlButtons = new System.Windows.Forms.Panel();
        this.pnlPdf.SuspendLayout();
        this.pnlVerify.SuspendLayout();
        this.pnlButtons.SuspendLayout();
        this.SuspendLayout();
        // 
        // lblPdfFiles
        // 
        this.lblPdfFiles.AutoSize = true;
        this.lblPdfFiles.Location = new System.Drawing.Point(12, 15);
        this.lblPdfFiles.Name = "lblPdfFiles";
        this.lblPdfFiles.Size = new System.Drawing.Size(83, 17);
        this.lblPdfFiles.TabIndex = 0;
        this.lblPdfFiles.Text = "请求书PDF文件";
        // 
        // pdfListBox
        // 
        this.pdfListBox.AllowDrop = true;
        this.pdfListBox.Anchor = ((System.Windows.Forms.AnchorStyles)((((System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Bottom) 
            | System.Windows.Forms.AnchorStyles.Left) 
            | System.Windows.Forms.AnchorStyles.Right)));
        this.pdfListBox.FormattingEnabled = true;
        this.pdfListBox.HorizontalScrollbar = true;
        this.pdfListBox.ItemHeight = 17;
        this.pdfListBox.Location = new System.Drawing.Point(3, 3);
        this.pdfListBox.Name = "pdfListBox";
        this.pdfListBox.SelectionMode = System.Windows.Forms.SelectionMode.MultiExtended;
        this.pdfListBox.Size = new System.Drawing.Size(389, 123);
        this.pdfListBox.TabIndex = 1;
        // 
        // btnAddPdf
        // 
        this.btnAddPdf.Anchor = ((System.Windows.Forms.AnchorStyles)((System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Right)));
        this.btnAddPdf.Location = new System.Drawing.Point(398, 3);
        this.btnAddPdf.Name = "btnAddPdf";
        this.btnAddPdf.Size = new System.Drawing.Size(100, 30);
        this.btnAddPdf.TabIndex = 2;
        this.btnAddPdf.Text = "添加PDF文件";
        this.btnAddPdf.UseVisualStyleBackColor = true;
        this.btnAddPdf.Click += new System.EventHandler(this.btnAddPdf_Click);
        // 
        // btnRemovePdf
        // 
        this.btnRemovePdf.Anchor = ((System.Windows.Forms.AnchorStyles)((System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Right)));
        this.btnRemovePdf.Location = new System.Drawing.Point(398, 39);
        this.btnRemovePdf.Name = "btnRemovePdf";
        this.btnRemovePdf.Size = new System.Drawing.Size(100, 30);
        this.btnRemovePdf.TabIndex = 3;
        this.btnRemovePdf.Text = "删除选中";
        this.btnRemovePdf.UseVisualStyleBackColor = true;
        this.btnRemovePdf.Click += new System.EventHandler(this.btnRemovePdf_Click);
        // 
        // lblVerifyFiles
        // 
        this.lblVerifyFiles.AutoSize = true;
        this.lblVerifyFiles.Location = new System.Drawing.Point(12, 170);
        this.lblVerifyFiles.Name = "lblVerifyFiles";
        this.lblVerifyFiles.Size = new System.Drawing.Size(119, 17);
        this.lblVerifyFiles.TabIndex = 4;
        this.lblVerifyFiles.Text = "核实材料(支持图片/压缩包)";
        // 
        // verifyListBox
        // 
        this.verifyListBox.AllowDrop = true;
        this.verifyListBox.Anchor = ((System.Windows.Forms.AnchorStyles)((((System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Bottom) 
            | System.Windows.Forms.AnchorStyles.Left) 
            | System.Windows.Forms.AnchorStyles.Right)));
        this.verifyListBox.FormattingEnabled = true;
        this.verifyListBox.HorizontalScrollbar = true;
        this.verifyListBox.ItemHeight = 17;
        this.verifyListBox.Location = new System.Drawing.Point(3, 3);
        this.verifyListBox.Name = "verifyListBox";
        this.verifyListBox.SelectionMode = System.Windows.Forms.SelectionMode.MultiExtended;
        this.verifyListBox.Size = new System.Drawing.Size(389, 123);
        this.verifyListBox.TabIndex = 5;
        // 
        // btnAddVerify
        // 
        this.btnAddVerify.Anchor = ((System.Windows.Forms.AnchorStyles)((System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Right)));
        this.btnAddVerify.Location = new System.Drawing.Point(398, 3);
        this.btnAddVerify.Name = "btnAddVerify";
        this.btnAddVerify.Size = new System.Drawing.Size(100, 30);
        this.btnAddVerify.TabIndex = 6;
        this.btnAddVerify.Text = "添加核实材料";
        this.btnAddVerify.UseVisualStyleBackColor = true;
        this.btnAddVerify.Click += new System.EventHandler(this.btnAddVerify_Click);
        // 
        // btnRemoveVerify
        // 
        this.btnRemoveVerify.Anchor = ((System.Windows.Forms.AnchorStyles)((System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Right)));
        this.btnRemoveVerify.Location = new System.Drawing.Point(398, 39);
        this.btnRemoveVerify.Name = "btnRemoveVerify";
        this.btnRemoveVerify.Size = new System.Drawing.Size(100, 30);
        this.btnRemoveVerify.TabIndex = 7;
        this.btnRemoveVerify.Text = "删除选中";
        this.btnRemoveVerify.UseVisualStyleBackColor = true;
        this.btnRemoveVerify.Click += new System.EventHandler(this.btnRemoveVerify_Click);
        // 
        // chkValidateId
        // 
        this.chkValidateId.Anchor = ((System.Windows.Forms.AnchorStyles)((System.Windows.Forms.AnchorStyles.Bottom | System.Windows.Forms.AnchorStyles.Left)));
        this.chkValidateId.AutoSize = true;
        this.chkValidateId.Checked = true;
        this.chkValidateId.CheckState = System.Windows.Forms.CheckState.Checked;
        this.chkValidateId.Location = new System.Drawing.Point(12, 325);
        this.chkValidateId.Name = "chkValidateId";
        this.chkValidateId.Size = new System.Drawing.Size(144, 21);
        this.chkValidateId.TabIndex = 8;
        this.chkValidateId.Text = "校验身份证号码(验证校验位)";
        this.chkValidateId.UseVisualStyleBackColor = true;
        // 
        // chkCheckNames
        // 
        this.chkCheckNames.Anchor = ((System.Windows.Forms.AnchorStyles)((System.Windows.Forms.AnchorStyles.Bottom | System.Windows.Forms.AnchorStyles.Left)));
        this.chkCheckNames.AutoSize = true;
        this.chkCheckNames.Checked = true;
        this.chkCheckNames.CheckState = System.Windows.Forms.CheckState.Checked;
        this.chkCheckNames.Location = new System.Drawing.Point(12, 352);
        this.chkCheckNames.Name = "chkCheckNames";
        this.chkCheckNames.Size = new System.Drawing.Size(108, 21);
        this.chkCheckNames.TabIndex = 9;
        this.chkCheckNames.Text = "同时核对姓名";
        this.chkCheckNames.UseVisualStyleBackColor = true;
        // 
        // btnStart
        // 
        this.btnStart.Anchor = ((System.Windows.Forms.AnchorStyles)((System.Windows.Forms.AnchorStyles.Bottom | System.Windows.Forms.AnchorStyles.Right)));
        this.btnStart.Location = new System.Drawing.Point(3, 3);
        this.btnStart.Name = "btnStart";
        this.btnStart.Size = new System.Drawing.Size(100, 30);
        this.btnStart.TabIndex = 10;
        this.btnStart.Text = "开始核对";
        this.btnStart.UseVisualStyleBackColor = true;
        this.btnStart.Click += new System.EventHandler(this.btnStart_Click);
        // 
        // btnClearAll
        // 
        this.btnClearAll.Anchor = ((System.Windows.Forms.AnchorStyles)((System.Windows.Forms.AnchorStyles.Bottom | System.Windows.Forms.AnchorStyles.Right)));
        this.btnClearAll.Location = new System.Drawing.Point(109, 3);
        this.btnClearAll.Name = "btnClearAll";
        this.btnClearAll.Size = new System.Drawing.Size(100, 30);
        this.btnClearAll.TabIndex = 11;
        this.btnClearAll.Text = "清空全部";
        this.btnClearAll.UseVisualStyleBackColor = true;
        this.btnClearAll.Click += new System.EventHandler(this.btnClearAll_Click);
        // 
        // progressBar
        // 
        this.progressBar.Anchor = ((System.Windows.Forms.AnchorStyles)(((System.Windows.Forms.AnchorStyles.Bottom | System.Windows.Forms.AnchorStyles.Left) 
            | System.Windows.Forms.AnchorStyles.Right)));
        this.progressBar.Location = new System.Drawing.Point(12, 379);
        this.progressBar.Name = "progressBar";
        this.progressBar.Size = new System.Drawing.Size(500, 23);
        this.progressBar.TabIndex = 12;
        // 
        // txtResult
        // 
        this.txtResult.Anchor = ((System.Windows.Forms.AnchorStyles)((((System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Bottom) 
            | System.Windows.Forms.AnchorStyles.Left) 
            | System.Windows.Forms.AnchorStyles.Right)));
        this.txtResult.Location = new System.Drawing.Point(12, 408);
        this.txtResult.Multiline = true;
        this.txtResult.Name = "txtResult";
        this.txtResult.ReadOnly = true;
        this.txtResult.ScrollBars = System.Windows.Forms.ScrollBars.Vertical;
        this.txtResult.Size = new System.Drawing.Size(500, 240);
        this.txtResult.TabIndex = 13;
        // 
        // pnlPdf
        // 
        this.pnlPdf.Anchor = ((System.Windows.Forms.AnchorStyles)(((System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Left) 
            | System.Windows.Forms.AnchorStyles.Right)));
        this.pnlPdf.Controls.Add(this.pdfListBox);
        this.pnlPdf.Controls.Add(this.btnAddPdf);
        this.pnlPdf.Controls.Add(this.btnRemovePdf);
        this.pnlPdf.Location = new System.Drawing.Point(12, 35);
        this.pnlPdf.Name = "pnlPdf";
        this.pnlPdf.Size = new System.Drawing.Size(500, 129);
        this.pnlPdf.TabIndex = 14;
        // 
        // pnlVerify
        // 
        this.pnlVerify.Anchor = ((System.Windows.Forms.AnchorStyles)(((System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Left) 
            | System.Windows.Forms.AnchorStyles.Right)));
        this.pnlVerify.Controls.Add(this.verifyListBox);
        this.pnlVerify.Controls.Add(this.btnAddVerify);
        this.pnlVerify.Controls.Add(this.btnRemoveVerify);
        this.pnlVerify.Location = new System.Drawing.Point(12, 190);
        this.pnlVerify.Name = "pnlVerify";
        this.pnlVerify.Size = new System.Drawing.Size(500, 129);
        this.pnlVerify.TabIndex = 15;
        // 
        // pnlButtons
        // 
        this.pnlButtons.Anchor = ((System.Windows.Forms.AnchorStyles)((System.Windows.Forms.AnchorStyles.Bottom | System.Windows.Forms.AnchorStyles.Right)));
        this.pnlButtons.Controls.Add(this.btnStart);
        this.pnlButtons.Controls.Add(this.btnClearAll);
        this.pnlButtons.Location = new System.Drawing.Point(302, 340);
        this.pnlButtons.Name = "pnlButtons";
        this.pnlButtons.Size = new System.Drawing.Size(210, 36);
        this.pnlButtons.TabIndex = 16;
        // 
        // MainForm
        // 
        this.AutoScaleDimensions = new System.Drawing.SizeF(7F, 17F);
        this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
        this.ClientSize = new System.Drawing.Size(524, 660);
        this.Controls.Add(this.pnlButtons);
        this.Controls.Add(this.pnlVerify);
        this.Controls.Add(this.pnlPdf);
        this.Controls.Add(this.txtResult);
        this.Controls.Add(this.progressBar);
        this.Controls.Add(this.chkCheckNames);
        this.Controls.Add(this.chkValidateId);
        this.Controls.Add(this.lblVerifyFiles);
        this.Controls.Add(this.lblPdfFiles);
        this.MinimumSize = new System.Drawing.Size(540, 700);
        this.Name = "MainForm";
        this.StartPosition = System.Windows.Forms.FormStartPosition.CenterScreen;
        this.Text = "身份证号码核对工具 v2.5";
        this.pnlPdf.ResumeLayout(false);
        this.pnlVerify.ResumeLayout(false);
        this.pnlButtons.ResumeLayout(false);
        this.ResumeLayout(false);
        this.PerformLayout();
    }

    #endregion

    private System.Windows.Forms.Label lblPdfFiles;
    private System.Windows.Forms.ListBox pdfListBox;
    private System.Windows.Forms.Button btnAddPdf;
    private System.Windows.Forms.Button btnRemovePdf;
    private System.Windows.Forms.Label lblVerifyFiles;
    private System.Windows.Forms.ListBox verifyListBox;
    private System.Windows.Forms.Button btnAddVerify;
    private System.Windows.Forms.Button btnRemoveVerify;
    private System.Windows.Forms.CheckBox chkValidateId;
    private System.Windows.Forms.CheckBox chkCheckNames;
    private System.Windows.Forms.Button btnStart;
    private System.Windows.Forms.Button btnClearAll;
    private System.Windows.Forms.ProgressBar progressBar;
    private System.Windows.Forms.TextBox txtResult;
    private System.Windows.Forms.Panel pnlPdf;
    private System.Windows.Forms.Panel pnlVerify;
    private System.Windows.Forms.Panel pnlButtons;
}
