"""语言执行器：在隔离工作区跑三类测试并判分。

registry/strategy 模式：新增语言 = 注册一个 Executor，引擎零改动。
判分隔离：工作区只包含模型产出的代码 + 题目的 tests，绝不含 reference/。
"""
from __future__ import annotations

import shutil
import subprocess
import sys
import tempfile
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Callable

from .models import Task, TestPhaseResult

# 语言执行器注册表：language -> Executor 工厂
_REGISTRY: dict[str, Callable[[], "LanguageExecutor"]] = {}


def register_executor(language: str) -> Callable[[type], type]:
    """注册语言执行器的装饰器。"""

    def decorator(cls: type) -> type:
        _REGISTRY[language] = cls
        return cls

    return decorator


def get_executor(language: str) -> "LanguageExecutor":
    """按语言获取执行器实例。"""
    if language not in _REGISTRY:
        raise ValueError(f"未注册的语言执行器：{language}（已注册：{list(_REGISTRY)}）")
    return _REGISTRY[language]()


# 三类测试的逻辑阶段名（顺序即报告顺序）
PHASE_NAMES = ["functional", "regression", "edge"]

# Python 阶段名 -> 测试文件
_PY_TEST_FILES = {
    "functional": "test_functional.py",
    "regression": "test_regression.py",
    "edge": "test_edge.py",
}


class LanguageExecutor(ABC):
    """语言执行器抽象基类。"""

    @abstractmethod
    def run(self, task: Task, fixed_code: str) -> list[TestPhaseResult]:
        """在隔离工作区写入修复代码并跑三类测试，返回各类结果。"""
        raise NotImplementedError


@register_executor("python")
class PythonExecutor(LanguageExecutor):
    """Python / pytest 执行器。"""

    def run(self, task: Task, fixed_code: str) -> list[TestPhaseResult]:
        # 创建隔离临时工作区：仅放模型代码 + 题目 tests
        with tempfile.TemporaryDirectory(prefix="douma_") as tmp:
            workspace = Path(tmp)
            self._prepare_workspace(task, fixed_code, workspace)
            return [
                self._run_phase(name, _PY_TEST_FILES[name], workspace)
                for name in PHASE_NAMES
            ]

    def _prepare_workspace(self, task: Task, fixed_code: str, workspace: Path) -> None:
        """准备隔离工作区：写入修复代码、展开只读支撑文件、拷贝 tests（不含 reference）。"""
        # buggy 根目录下的相对路径（entry_file 形如 "buggy/solution.py"）
        entry_rel = Path(task.entry_file).relative_to("buggy").as_posix()

        # 模型产出代码写到 buggy 相对位置（保持包内 import 路径一致）
        entry_dst = workspace / entry_rel
        entry_dst.parent.mkdir(parents=True, exist_ok=True)
        entry_dst.write_text(fixed_code, encoding="utf-8")

        # 把 entry_file 也平铺到工作区根，方便测试以模块名直接 import
        (workspace / Path(entry_rel).name).write_text(fixed_code, encoding="utf-8")

        # 展开只读支撑文件（跨文件题的其它模块）到工作区，保持相对结构
        for rel, content in task.support_files.items():
            dst = workspace / rel
            dst.parent.mkdir(parents=True, exist_ok=True)
            dst.write_text(content, encoding="utf-8")

        tests_src = task.directory / "tests"
        if tests_src.is_dir():
            shutil.copytree(tests_src, workspace / "tests", dirs_exist_ok=True)

    def _run_phase(self, name: str, test_file: str, workspace: Path) -> TestPhaseResult:
        """跑单类测试；测试文件缺失视为通过（该题不考察此维度）。"""
        test_path = workspace / "tests" / test_file
        if not test_path.exists():
            return TestPhaseResult(name=name, passed=True, output="(无该类测试，跳过)")

        try:
            proc = subprocess.run(
                [sys.executable, "-m", "pytest", "-q", str(test_path)],
                cwd=str(workspace),
                capture_output=True,
                text=True,
                timeout=60,
            )
            passed = proc.returncode == 0
            output = (proc.stdout + proc.stderr).strip()
        except subprocess.TimeoutExpired:
            passed, output = False, "测试执行超时（>60s）"
        return TestPhaseResult(name=name, passed=passed, output=output)


class CompiledExecutor(LanguageExecutor):
    """编译型语言执行器基类（模板方法）：每类测试编译为独立可执行并运行，返回码 0 即通过。

    子类只需提供类属性（源文件名/测试文件名/临时前缀/超时/二进制后缀）
    和编译、运行命令两个钩子；run()/_run_phase() 骨架在此统一实现。
    """

    # 子类需覆盖的类属性
    solution_filename: str = ""          # 模型产出代码写入的源文件名
    test_files: dict[str, str] = {}      # 阶段名 -> 测试源文件名
    tmp_prefix: str = "douma_"        # 临时工作区前缀
    binary_suffix: str = ""              # 二进制名后缀（{name}{suffix}）
    compile_timeout: int = 60            # 编译超时（秒）
    run_timeout: int = 30                # 运行超时（秒）

    @abstractmethod
    def _compile_cmd(self, test_path: Path, binary_path: Path) -> list[str]:
        """构造编译命令。"""
        raise NotImplementedError

    @abstractmethod
    def _run_cmd(self, binary_path: Path) -> list[str]:
        """构造运行命令。"""
        raise NotImplementedError

    def run(self, task: Task, fixed_code: str) -> list[TestPhaseResult]:
        with tempfile.TemporaryDirectory(prefix=self.tmp_prefix) as tmp:
            workspace = Path(tmp)
            # 写入模型产出代码，并平铺只读支撑文件
            (workspace / self.solution_filename).write_text(fixed_code, encoding="utf-8")
            for rel, content in task.support_files.items():
                (workspace / Path(rel).name).write_text(content, encoding="utf-8")
            tests_src = task.directory / "tests"
            return [self._run_phase(name, tests_src, workspace) for name in PHASE_NAMES]

    def _run_phase(self, name: str, tests_src: Path, workspace: Path) -> TestPhaseResult:
        """编译并运行单类测试；测试文件缺失视为通过（该题不考察此维度）。"""
        test_file = tests_src / self.test_files[name]
        if not test_file.exists():
            return TestPhaseResult(name=name, passed=True, output="(无该类测试，跳过)")
        local_test = workspace / self.test_files[name]
        local_test.write_text(test_file.read_text(encoding="utf-8"), encoding="utf-8")
        binary = workspace / f"{name}{self.binary_suffix}"

        # 编译阶段：含超时捕获（病态代码可能让编译器卡死，不能拖垮整批评测）
        try:
            compile_proc = subprocess.run(
                self._compile_cmd(local_test, binary),
                cwd=str(workspace), capture_output=True, text=True,
                timeout=self.compile_timeout,
            )
        except subprocess.TimeoutExpired:
            return TestPhaseResult(name=name, passed=False,
                                   output=f"编译超时（>{self.compile_timeout}s）")
        if compile_proc.returncode != 0:
            return TestPhaseResult(name=name, passed=False,
                                   output="编译失败:\n" + (compile_proc.stderr or "")[:2000])

        # 运行阶段：含超时捕获，输出统一截断避免死循环喂回巨量文本
        try:
            run_proc = subprocess.run(self._run_cmd(binary), cwd=str(workspace),
                                      capture_output=True, text=True,
                                      timeout=self.run_timeout)
            passed = run_proc.returncode == 0
            output = (run_proc.stdout + run_proc.stderr).strip()[:2000]
        except subprocess.TimeoutExpired:
            passed, output = False, f"运行超时（>{self.run_timeout}s，疑似死锁）"
        return TestPhaseResult(name=name, passed=passed, output=output)


@register_executor("cpp")
class CppExecutor(CompiledExecutor):
    """C++ / clang++ 执行器：每类测试编译为独立可执行并运行，返回码 0 即通过。"""

    solution_filename = "solution.cpp"
    test_files = {
        "functional": "test_functional.cpp",
        "regression": "test_regression.cpp",
        "edge": "test_edge.cpp",
    }
    tmp_prefix = "douma_cpp_"
    binary_suffix = ".out"
    compile_timeout = 60
    run_timeout = 30

    def _compile_cmd(self, test_path: Path, binary_path: Path) -> list[str]:
        return ["clang++", "-std=c++17", "-pthread", "-O1",
                str(test_path), "-o", str(binary_path)]

    def _run_cmd(self, binary_path: Path) -> list[str]:
        return [str(binary_path)]


@register_executor("rust")
class RustExecutor(CompiledExecutor):
    """Rust / rustc --test 执行器：离线编译测试可执行并运行。"""

    solution_filename = "solution.rs"
    test_files = {
        "functional": "test_functional.rs",
        "regression": "test_regression.rs",
        "edge": "test_edge.rs",
    }
    tmp_prefix = "douma_rs_"
    binary_suffix = "_test"
    compile_timeout = 120
    run_timeout = 30

    def _compile_cmd(self, test_path: Path, binary_path: Path) -> list[str]:
        return ["rustc", "--test", "--edition", "2021", "-O",
                str(test_path), "-o", str(binary_path)]

    def _run_cmd(self, binary_path: Path) -> list[str]:
        return [str(binary_path), "--test-threads", "4"]


@register_executor("go")
class GoExecutor(CompiledExecutor):
    """Go 执行器：solution.go 与测试文件同属 package main，
    用 go build 把二者一起编译为单个可执行（GO111MODULE=off 离线、不依赖 go.mod），
    测试文件含 main() 并以 os.Exit(0/1) 表达通过/失败，返回码 0 即通过。

    假设：solution 为单文件（solution.go）。编译输入只取 solution.go + 当前阶段
    测试文件，不纳入 support_files；如需跨文件 Go 题需另行扩展编译输入。"""

    solution_filename = "solution.go"
    test_files = {
        "functional": "test_functional.go",
        "regression": "test_regression.go",
        "edge": "test_edge.go",
    }
    tmp_prefix = "douma_go_"
    binary_suffix = ".gobin"
    compile_timeout = 120
    run_timeout = 30

    def _compile_cmd(self, test_path: Path, binary_path: Path) -> list[str]:
        # 用 env 前缀注入 GO111MODULE=off 实现离线编译；
        # 显式只取 solution.go + 当前阶段测试文件，避免多个含 main() 的 test_*.go 冲突
        return ["env", "GO111MODULE=off",
                "go", "build", "-o", str(binary_path),
                str(test_path.parent / self.solution_filename), str(test_path)]

    def _run_cmd(self, binary_path: Path) -> list[str]:
        return [str(binary_path)]
