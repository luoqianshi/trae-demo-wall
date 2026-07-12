using System;
using System.Text;
using System.Windows.Forms;

namespace IdCardVerifier;

static class Program
{
    [STAThread]
    static void Main()
    {
        // 注册编码提供程序以支持GBK等编码
        Encoding.RegisterProvider(CodePagesEncodingProvider.Instance);
        
        Application.SetHighDpiMode(HighDpiMode.SystemAware);
        Application.EnableVisualStyles();
        Application.SetCompatibleTextRenderingDefault(false);
        Application.Run(new MainForm());
    }
}
