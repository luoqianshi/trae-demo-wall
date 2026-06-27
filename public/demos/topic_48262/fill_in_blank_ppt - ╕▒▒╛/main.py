"""填空题PPT生成器 - 主入口

使用方法:
  # 生成模式：从文本生成挖空PPT
  python main.py                          # 用默认配置运行
  python main.py --input input.txt        # 指定输入文件
  python main.py --output output.pptx     # 指定输出文件
  python main.py --mode manual            # 纯手动标记模式
  python main.py --mode ai                # 纯AI模式
  python main.py --mode mixed             # 混合模式（默认）
  python main.py --resume 3               # 从步骤3恢复

  # 提取模式：从PPT逆向提取挖空文本
  python main.py --extract input.pptx     # 从PPT提取挖空文本
  python main.py --extract input.pptx -o output.txt
"""
import argparse
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config import CONFIG
from loop_engine import run_loop


def main():
    parser = argparse.ArgumentParser(description='填空题PPT生成器')

    subparsers = parser.add_subparsers(dest='command', help='子命令')

    # 生成子命令
    gen_parser = subparsers.add_parser('generate', help='从文本生成挖空PPT')
    gen_parser.add_argument('--input', '-i', help='输入文档路径')
    gen_parser.add_argument('--output', '-o', help='输出PPT路径')
    gen_parser.add_argument('--mode', '-m', choices=['manual', 'ai', 'mixed'],
                            default='mixed', help='挖空模式（默认mixed）')
    gen_parser.add_argument('--resume', '-r', type=int, help='从指定步骤恢复（1-5）')
    gen_parser.add_argument('--max-retries', type=int, default=3,
                            help='验证失败最大重试次数（默认3）')
    gen_parser.add_argument('--chars-per-page', type=int, default=160,
                            help='每页字符数上限（默认160）')

    # 提取子命令
    ext_parser = subparsers.add_parser('extract', help='从PPT逆向提取挖空文本')
    ext_parser.add_argument('pptx', help='PPT文件路径')
    ext_parser.add_argument('--output', '-o', help='输出文本路径（可选）')

    # 兼容旧版无子命令的调用方式
    parser.add_argument('--input', '-i', help='输入文档路径')
    parser.add_argument('--output', '-o', help='输出PPT路径')
    parser.add_argument('--mode', '-m', choices=['manual', 'ai', 'mixed'],
                        default='mixed', help='挖空模式')
    parser.add_argument('--resume', '-r', type=int, help='从指定步骤恢复')
    parser.add_argument('--max-retries', type=int, default=3)
    parser.add_argument('--chars-per-page', type=int, default=160)
    parser.add_argument('--extract', help='从PPT提取挖空文本')

    args = parser.parse_args()

    # 提取模式
    if args.command == 'extract' or args.extract:
        from modules.ppt_extractor import extract_blanks_from_pptx
        pptx_path = args.pptx if args.command == 'extract' else args.extract
        output = args.output if hasattr(args, 'output') and args.output else None
        extract_blanks_from_pptx(pptx_path, output)
        sys.exit(0)

    # 生成模式
    config = CONFIG.copy()

    if args.input:
        config["input_doc"] = os.path.abspath(args.input)
    if args.output:
        config["output_path"] = os.path.abspath(args.output)
    if args.mode:
        config["ai_mode"] = args.mode
    if args.resume:
        config["resume_from"] = args.resume
    if args.max_retries is not None:
        config["max_retries"] = args.max_retries
    if args.chars_per_page:
        config["chars_per_page"] = args.chars_per_page

    print("="*60)
    print("填空题PPT生成器")
    print("="*60)
    print(f"输入文档: {config['input_doc']}")
    print(f"输出PPT:  {config['output_path']}")
    print(f"挖空模式: {config['ai_mode']}")
    print(f"模板PPT:  {config['template_ppt']}")
    print(f"每页字符: {config['chars_per_page']}")
    print(f"最大重试: {config['max_retries']}")
    print("="*60)

    success = run_loop(config)

    if success:
        print("\n生成完成！请在 PowerPoint/WPS 中打开查看效果。")
        sys.exit(0)
    else:
        print("\n生成失败，请检查错误信息。")
        sys.exit(1)


if __name__ == '__main__':
    main()
