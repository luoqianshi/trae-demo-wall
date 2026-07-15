"""命令行设置 MiniMax API Key

用法:
    python -m readmate.set_key YOUR_API_KEY
    python -m readmate.set_key                # 查看当前 Key
"""
import sys

from .core.config import get_config


def main():
    cfg = get_config()

    if len(sys.argv) < 2:
        current = cfg.get("minimax_api_key", "")
        if current:
            masked = current[:8] + "..." if len(current) > 8 else "(过短)"
            print(f"当前 Key: {masked}")
        else:
            print("当前 Key: (未设置)")
        print("用法: python -m readmate.set_key YOUR_API_KEY")
        sys.exit(0)

    key = sys.argv[1].strip()
    if not key:
        print("错误: API Key 不能为空")
        sys.exit(1)

    cfg.set("minimax_api_key", key)
    cfg.save()

    masked = key[:6] + "..." + key[-4:] if len(key) > 10 else "(过短)"
    print(f"API Key 已保存: {masked}")
    print("现在可以运行: python run.py")


if __name__ == "__main__":
    main()
