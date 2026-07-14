# TraeGeo 几何引擎架构设计文档

## 1. 项目概述

TraeGeo 是一套完全自主可控的原生 CAD 几何内核，基于 Rust + C++ 混合开发，全程零依赖商用几何内核（OpenCASCADE、Parasolid、ACIS 等）。项目致力于提供高性能、跨平台、安全可靠的几何计算能力。

### 1.1 项目代号

TraeGeo

### 1.2 版本

0.1.0

### 1.3 核心特性

- 完全自研几何算法，无第三方几何内核依赖
- Rust 内存安全 + C++ 高性能计算混合架构
- 四层分层架构，单向依赖无循环耦合
- 跨平台支持：Windows、Linux、WebAssembly
- 统一 C API 对外接口

---

## 2. 四层分层架构

### 2.1 架构总览

```
┌─────────────────────────────────────────────────────────┐
│                  可视化适配层                           │
│           (Visualization Adaptation Layer)             │
│  ┌─────────────────────────────────────────────────┐   │
│  │  C API Interface  ·  Scene Management          │   │
│  │  Render Data Output · Cross-platform Memory    │   │
│  └─────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────┤
│                    网格剖分层                           │
│              (Mesh Generation Layer)                  │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Triangle/Quad Mesh  ·  Mesh Simplification    │   │
│  │  Subdivision Surface  ·  Normal/UV Generation   │   │
│  │  STL Export                                    │   │
│  └─────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────┤
│                    几何运算层                           │
│           (Geometric Operations Layer)                │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Intersection  ·  Boolean Operations           │   │
│  │  Offset  ·  Fillet/Chamfer  ·  Stitch          │   │
│  │  Distance Calculation  ·  Topology Repair      │   │
│  └─────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────┤
│                    几何底层层                           │
│           (Geometry Foundation Layer)                 │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Points/Vectors  ·  Curves (Line/Circle/Arc)    │   │
│  │  Surfaces (Plane/Cylinder/Sphere/NURBS)         │   │
│  │  BRep Topology (Vertex/Edge/Loop/Face/Shell)    │   │
│  │  Precision Control · Error Handling             │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### 2.2 层间依赖规则

| 层级 | 依赖方向 | 允许访问 | 禁止访问 |
|------|----------|----------|----------|
| 可视化适配层 | ↓ | 网格层、运算层、底层层 | 无 |
| 网格剖分层 | ↓ | 运算层、底层层 | 可视化层 |
| 几何运算层 | ↓ | 底层层 | 网格层、可视化层 |
| 几何底层层 | - | 无 | 所有上层 |

---

## 3. 各层详细设计

### 3.1 几何底层层

**职责**：基础几何数据存储、拓扑关系管理、数值精度控制

**核心模块**：

| 模块 | 文件路径 | 功能描述 |
|------|----------|----------|
| 数学模块 | `rust/src/math/` | 向量、矩阵、变换 |
| 曲线模块 | `rust/src/geometry/curves.rs` | 直线、圆弧、贝塞尔、NURBS 曲线 |
| 曲面模块 | `rust/src/geometry/surfaces.rs` | 平面、柱面、球面、NURBS 曲面 |
| Brep 拓扑 | `rust/src/geometry/brep.rs` | 顶点、边、环、面、壳、实体、复合实体 |
| 精度控制 | `rust/src/utils/precision.rs` | 全局容差 Epsilon 配置 |
| 错误处理 | `rust/src/utils/error.rs` | 统一错误枚举 |

**数据结构设计原则**：

- 使用 `#[repr(C)]` 确保与 C++ ABI 兼容
- 使用 `bytemuck::Pod/Zeroable` 确保内存布局安全
- 拓扑结构使用 u64 Handle 引用，避免裸指针跨层传递

### 3.2 几何运算层

**职责**：核心几何算法实现，性能敏感计算

**核心模块**：

| 模块 | 文件路径 | 功能描述 |
|------|----------|----------|
| 求交运算 | `cpp/include/trae_geo_cpp/operations/Intersection.h` | 线-面、面-面、线-体等求交 |
| 布尔运算 | `cpp/include/trae_geo_cpp/operations/Boolean.h` | 并/差/交/分割 |
| 偏移运算 | `cpp/include/trae_geo_cpp/operations/Offset.h` | 实体/面/边偏移 |
| 圆角倒角 | `cpp/include/trae_geo_cpp/operations/Fillet.h` | 等半径/变半径圆角、倒角 |
| 缝合运算 | `cpp/include/trae_geo_cpp/operations/Stitch.h` | 边缝合、面缝合 |
| 距离计算 | `cpp/include/trae_geo_cpp/operations/Distance.h` | 点-点、点-面、面-面距离 |

**算法设计原则**：

- C++ 实现核心算法，支持 SIMD 优化
- 使用 Result<T> 模式处理错误
- 运算完成后结果序列化回 Rust 层管理所有权

### 3.3 网格剖分层

**职责**：Brep 实体离散化输出

**核心模块**：

| 模块 | 文件路径 | 功能描述 |
|------|----------|----------|
| 网格生成 | `cpp/include/trae_geo_cpp/mesh/Mesh.h` | 自适应三角/四边形网格 |
| 网格简化 | `cpp/include/trae_geo_cpp/mesh/Simplification.h` | QEM、边折叠简化 |
| 细分曲面 | `cpp/include/trae_geo_cpp/mesh/Subdivision.h` | Loop、Catmull-Clark 细分 |
| STL 输出 | `cpp/include/trae_geo_cpp/mesh/STLExport.h` | 二进制/ASCII STL 导出 |

### 3.4 可视化适配层

**职责**：统一 C API 对外接口，跨平台适配

**核心模块**：

| 模块 | 文件路径 | 功能描述 |
|------|----------|----------|
| C API | `cpp/include/trae_geo_c_api/trae_geo.h` | 统一对外 C 接口 |
| C API 实现 | `cpp/src/c_api/trae_geo.cpp` | C API 到 C++ 的桥接 |

**接口设计原则**：

- 统一前缀 `trae_geo_`
- 纯 C 兼容，无 C++ 语法
- 所有函数返回 `trae_geo_error_t`
- Handle 模式管理对象生命周期

---

## 4. 语言分工规范

### 4.1 Rust 层职责

- 几何底层层主体实现
- 内存安全管理、所有权托管
- FFI 导出接口给 C++ 调用
- 数据结构定义与序列化

### 4.2 C++ 层职责

- 性能敏感核心算法（求交、布尔、网格）
- SIMD 优化
- 临时拓扑副本运算
- C API 桥接实现

### 4.3 FFI 数据流模式

```
Rust Layer                          C++ Layer
┌────────────────────────┐          ┌────────────────────────┐
│                        │          │                        │
│   BrepModel (Owned)    │          │   Temp Topology Copy   │
│                        │          │                        │
│   serialize() ────────>│          │<────── deserialize()    │
│                        │          │                        │
│                        │          │   performOperation()   │
│                        │          │                        │
│   deserialize() <──────│          │─────── serialize()      │
│                        │          │                        │
│   Update Owned Data    │          │   Discard Temp Copy    │
│                        │          │                        │
└────────────────────────┘          └────────────────────────┘
```

---

## 5. 线程安全规则

### 5.1 全局状态

- `Precision` 配置：非线程安全，需外部同步
- `Error` 枚举：只读，线程安全

### 5.2 对象级别

- `BrepModel`：非线程安全，单个对象同一时刻只能被一个线程访问
- `Mesh`：非线程安全，生成过程中独占访问
- 几何运算：无状态，线程安全

### 5.3 FFI 边界

- Rust → C++ 传递不可变引用
- C++ → Rust 传递序列化数据
- 禁止跨线程共享 Handle

---

## 6. 数值精度体系

### 6.1 全局精度参数

| 参数 | 默认值 | 范围 | 用途 |
|------|--------|------|------|
| Epsilon | 1e-8 | [1e-15, 1e-3] | 浮点比较容差 |
| Tolerance | 1e-6 | [1e-15, 1e-1] | 几何比较容差 |
| AngleTolerance | 1e-4 | [1e-10, 1e-1] | 角度比较容差 |
| CurveTolerance | 1e-5 | [1e-15, 1e-2] | 曲线逼近容差 |
| SurfaceTolerance | 1e-5 | [1e-15, 1e-2] | 曲面逼近容差 |

### 6.2 精度控制 API

```rust
// 设置全局精度
set_epsilon(1e-8);
set_tolerance(1e-6);

// 获取全局精度
let eps = epsilon();
let tol = tolerance();

// 精度比较函数
is_zero(value);       // |value| <= epsilon
is_equal(a, b);       // |a - b| <= tolerance
is_less_or_equal(a, b);
is_greater_or_equal(a, b);
```

---

## 7. 错误体系

### 7.1 错误分类

| 类别 | 错误码 | 描述 |
|------|--------|------|
| 数值奇异 | 1 | 数值计算奇异（除零、NaN、溢出） |
| 拓扑破损 | 2 | 拓扑数据不一致 |
| 输入非法 | 3 | 输入参数无效 |
| 内存溢出 | 4 | 内存分配失败 |
| 未实现 | 5 | 功能未实现 |
| 求交失败 | 6 | 几何求交失败 |
| 布尔失败 | 7 | 布尔运算失败 |
| 网格失败 | 8 | 网格生成失败 |
| 越界访问 | 9 | 索引越界 |
| 参数错误 | 10 | 参数值超出范围 |
| 退化几何 | 11 | 退化几何检测（零长度边、共面顶点等） |
| 操作取消 | 12 | 操作被用户取消 |
| 文件错误 | 13 | 文件读写错误 |
| 许可错误 | 14 | 许可验证失败 |
| 内部错误 | 15 | 内部逻辑错误 |

---

## 8. 跨平台编译配置

### 8.1 编译目标

| 平台 | 工具链 | 输出格式 |
|------|--------|----------|
| Windows x64 | MSVC | .dll |
| Linux x64 | GCC | .so |
| WebAssembly | Emscripten | .wasm |

### 8.2 编译选项

```bash
# Windows
cmake -S . -B build -G "Visual Studio 17 2022" -A x64
cmake --build build --config Release

# Linux
cmake -S . -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build

# WebAssembly
cmake -S . -B build_wasm -DBUILD_WASM=ON
cmake --build build_wasm
```

---

## 9. 项目目录结构

```
trae_geo/
├── cmake/                    # CMake 配置模板
│   └── trae_geoConfig.cmake.in
├── cpp/                      # C++ 核心代码
│   ├── include/
│   │   ├── trae_geo_c_api/   # C API 头文件
│   │   └── trae_geo_cpp/     # C++ 头文件
│   └── src/                  # C++ 源文件
├── docs/                     # 文档
│   ├── architecture.md       # 架构设计文档
│   ├── dependency_graph.mmd  # 依赖图
│   └── math_api.md          # 数学接口规范
├── examples/                 # 使用示例
│   ├── c/                    # C 语言示例
│   ├── rust/                 # Rust 示例
│   └── wasm/                 # WebAssembly 示例
├── rust/                     # Rust 底层代码
│   └── src/
│       ├── math/             # 数学模块
│       ├── geometry/         # 几何模块
│       ├── ffi/              # FFI 桥接
│       └── utils/            # 工具模块
├── wasm/                     # WebAssembly 配置
│   └── toolchain.cmake
├── build/                    # 编译输出
├── CMakeLists.txt            # 主 CMake 配置
└── README.md
```

---

## 10. 命名规范

### 10.1 C++ 命名

| 类型 | 规范 | 示例 |
|------|------|------|
| 类 | 大驼峰 | `Intersection`, `MeshGenerator` |
| 函数 | 小驼峰 | `pointAt()`, `generateMesh()` |
| 变量 | 小驼峰 | `maxEdgeLength`, `tolerance` |
| 宏 | 全大写 | `TRAE_GEO_API`, `INVALID_HANDLE` |
| 枚举 | 大驼峰 | `CurveType`, `BooleanOperation` |

### 10.2 Rust 命名

| 类型 | 规范 | 示例 |
|------|------|------|
| 结构体 | 大驼峰 | `Vec3`, `BrepModel` |
| 枚举 | 大驼峰 | `CurveType`, `TraeGeoError` |
| 函数 | 蛇形 | `point_at()`, `generate_mesh()` |
| 变量 | 蛇形 | `max_edge_length`, `tolerance` |
| 常量 | 蛇形 | `INVALID_HANDLE`, `DEFAULT_EPSILON` |

### 10.3 C API 命名

| 类型 | 规范 | 示例 |
|------|------|------|
| 函数 | `trae_geo_` + 蛇形 | `trae_geo_create_box()` |
| 类型 | `trae_geo_` + 蛇形 + `_t` | `trae_geo_vec3_t` |
| 错误码 | `TRAE_GEO_ERROR_` + 大写 | `TRAE_GEO_ERROR_INVALID_INPUT` |
| 宏 | `TRAE_GEO_` + 大写 | `TRAE_GEO_INVALID_HANDLE` |