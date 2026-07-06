import os
import sys
import uuid


def clear_screen():
    os.system("cls" if os.name == "nt" else "clear")


def print_header(title):
    print("\n" + "=" * 60)
    print(f"  {title}")
    print("=" * 60)


def print_menu(options):
    print()
    for i, opt in enumerate(options, 1):
        print(f"  {i}. {opt}")
    print()


def get_choice(prompt="请选择: ", max_choice=None):
    while True:
        try:
            choice = input(prompt).strip()
            if choice == "":
                return None
            num = int(choice)
            if max_choice and (num < 1 or num > max_choice):
                print(f"请输入 1-{max_choice} 之间的数字")
                continue
            return num
        except ValueError:
            print("请输入有效数字")


def get_input(prompt, default=None, required=False):
    while True:
        result = input(prompt).strip()
        if result == "" and default is not None:
            return default
        if required and not result:
            print("此项不能为空")
            continue
        return result


def get_mac_address():
    mac = uuid.getnode()
    return ":".join(("%012X" % mac)[i:i+2] for i in range(0, 12, 2))


def read_file_content(filepath):
    if not os.path.exists(filepath):
        return None
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            return f.read()
    except Exception as e:
        print(f"读取文件失败: {e}")
        return None


def pause():
    input("\n按回车键继续...")
