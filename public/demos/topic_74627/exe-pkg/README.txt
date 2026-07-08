CodeMaster 跨平台编译产物
===========================
JavaScript -> C# (4.0/9.0) / C++23 智能代码转换器

目录结构
--------
windows/
    codemaster.exe   - Windows x86_64 可执行文件（GUI 子系统，无控制台黑框）
                       纯静态编译，无需任何 DLL 依赖
                       双击即可运行（Windows 7 SP1 及以上 / Windows 10/11）

linux/
    codemaster       - Linux x86_64 可执行文件
                       FLTK 已静态链接，只需系统 X11 库（任何 Linux 桌面都自带）
                       运行方式：./codemaster

编译信息
--------
- 编译器：mingw-w64 (gcc 13.2.0) / g++ 13
- C++ 标准：C++17
- FLTK 版本：1.3.8（静态链接）
- 优化级别：-O2
- 链接方式：静态链接（-static-libgcc -static-libstdc++）

功能特性
--------
1. 三目标版本转换：C# 4.0、C# 9.0、C++23
2. AST 语法树可视化（点击「语法树」按钮）
3. 极度混淆/压缩 JS 容错（ASI 自动分号插入）
4. 完整表达式优先级链（14 级）
5. 支持：箭头函数、模板串、扩展运算符、三元、try/catch、switch、
        可选链 ?.、空合并 ??、async/await、IIFE、解构等
6. 5 个内置示例（Hello World / 函数 / 类 / 数组 / 循环）
7. 深色主题 GUI（双栏对照布局）

使用说明
--------
1. 启动程序后，左侧编辑器输入 JavaScript 代码
2. 顶部选择「目标语言」(C++/C#) 和「版本」
3. 点击「转换 ->」按钮，右侧显示目标代码
4. 点击「语法树」按钮，右侧显示 AST 树形结构
5. 点击「复制输出」按钮，把结果复制到剪贴板
6. 点击「清空」按钮，清空两侧编辑器

文件校验
--------
windows/codemaster.exe  - PE32+ GUI x86-64, 3.6 MB
linux/codemaster        - ELF 64-bit x86-64, 2.1 MB
