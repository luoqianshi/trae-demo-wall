# -*- coding: utf-8 -*-
import os
import shutil
import sys
import json
import hashlib


def file_sha256(path):
    digest = hashlib.sha256()
    with open(path, "rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()

def main():
    # 获取项目根目录 (即当前脚本所在 scripts 目录的父目录)
    src_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

    # 自动探测并解析当前用户主目录，适配任何同事的 Windows 电脑环境
    user_home = os.path.expanduser("~")

    # 目标目录列表 (支持双系统及全局配置智能体技能加载路径)
    dst_roots = [
        os.path.join(user_home, ".trae-cn", "skills", "product-digital-handbook"),
        os.path.join(user_home, ".gemini", "config", "skills", "product-digital-handbook"),
        os.path.join(user_home, ".codex", "skills", "product-digital-handbook")
    ]

    print(f"[*] 开始以全新复制策略同步本地开发项目到系统技能目录中...")
    print(f"    源目录: {src_root}")

    skip_dirs = {'.git', '.scratch', '__pycache__', 'test_tmp'}

    expected_files = {}
    for root, dirs, files in os.walk(src_root):
        # 过滤掉以点开头的隐藏目录以及指定的排除目录
        dirs[:] = [d for d in dirs if d not in skip_dirs and not d.startswith('.')]
        for file in files:
            # 不复制 *.pyc
            if file.endswith('.pyc'):
                continue
            # 不复制 PROJECT_MEMORY.md
            if file == 'PROJECT_MEMORY.md':
                continue
            # 不复制其它残留 Thumbs.db
            if file.lower() in ('thumbs.db', '.ds_store'):
                continue
            # 不复制临时日志与临时生成物
            if file.endswith('.log') or file.endswith('.tmp'):
                continue

            src_file = os.path.join(root, file)
            rel_path = os.path.relpath(src_file, src_root).replace('\\', '/')
            expected_files[rel_path] = file_sha256(src_file)

    deployment_failed = False
    for dst_root in dst_roots:
        print(f"    正在部署到目标目录: {dst_root}")
        errors = []

        # 1. 物理删除目标旧目录
        if os.path.exists(dst_root):
            try:
                shutil.rmtree(dst_root, ignore_errors=True)
                # 再次确认并清理由于只读属性等原因残留的文件
                if os.path.exists(dst_root):
                    for root_d, dirs_d, files_d in os.walk(dst_root, topdown=False):
                        for f_d in files_d:
                            p_d = os.path.join(root_d, f_d)
                            try:
                                os.chmod(p_d, 0o777)
                                os.remove(p_d)
                            except Exception:
                                pass
                        for d_d in dirs_d:
                            p_d = os.path.join(root_d, d_d)
                            try:
                                os.chmod(p_d, 0o777)
                                os.rmdir(p_d)
                            except Exception:
                                pass
                    shutil.rmtree(dst_root, ignore_errors=True)
                if os.path.exists(dst_root):
                    raise IOError("目标旧目录无法被彻底删除，可能部分文件被占用。")
            except Exception as e:
                errors.append(f"清理旧目录失败: {e}")

        # 2. 全新复制正式文件
        count = 0
        for rel_path, expected_hash in expected_files.items():
            src_file = os.path.join(src_root, *rel_path.split('/'))
            dst_file = os.path.join(dst_root, *rel_path.split('/'))
            try:
                os.makedirs(os.path.dirname(dst_file), exist_ok=True)
                shutil.copy2(src_file, dst_file)
                if file_sha256(dst_file) != expected_hash:
                    raise IOError("复制后 SHA-256 校验不一致")
                count += 1
            except Exception as e:
                errors.append(f"{rel_path}: {e}")

        # 3. 写入部署清单
        if not errors:
            try:
                os.makedirs(dst_root, exist_ok=True)
                manifest_path = os.path.join(dst_root, '.pdh-deploy-manifest.json')
                with open(manifest_path, 'w', encoding='utf-8') as f:
                    json.dump({'files': expected_files}, f, ensure_ascii=False, indent=2)
            except Exception as e:
                errors.append(f"部署清单写入失败: {e}")

        if errors:
            deployment_failed = True
            print(f"    -> [FAIL] 部署不完整，共 {len(errors)} 个错误：")
            for error in errors:
                print(f"       - {error}")
        else:
            print(f"    -> [OK] 成功全新部署并校验 {count} 个文件。")

    if deployment_failed:
        print("[FAIL] 至少一个技能目录部署失败，未宣告全量同步成功。")
        sys.exit(1)
    print("[SUCCESS] 所有技能目录均已完成文件清单与 SHA-256 校验。")

if __name__ == '__main__':
    main()
