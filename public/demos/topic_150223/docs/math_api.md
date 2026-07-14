# TraeGeo 全局数学接口规范文档

## 1. 向量接口 (Vec3)

### 1.1 数据结构

**Rust**:
```rust
#[repr(C)]
pub struct Vec3 {
    pub x: f64,
    pub y: f64,
    pub z: f64,
}
```

**C++**:
```cpp
struct Vec3 {
    double x;
    double y;
    double z;
};
```

**C API**:
```c
typedef struct {
    double x;
    double y;
    double z;
} trae_geo_vec3_t;
```

### 1.2 核心方法

| 方法 | 数学公式 | 功能描述 |
|------|----------|----------|
| `dot(v)` | a·b = ax*bx + ay*by + az*bz | 点积 |
| `cross(v)` | a×b = (ay*bz-az*by, az*bx-ax*bz, ax*by-ay*bx) | 叉积 |
| `length()` | \|a\| = sqrt(ax²+ay²+az²) | 向量长度 |
| `length_squared()` | \|a\|² = ax²+ay²+az² | 向量长度平方 |
| `normalize()` | a/\|a\| | 单位化 |
| `distance(v)` | \|a-b\| | 两点距离 |
| `distance_squared(v)` | \|a-b\|² | 两点距离平方 |
| `angle(v)` | arccos(a·b/(|a||b|)) | 向量夹角 |
| `lerp(v, t)` | a + (b-a)*t | 线性插值 |
| `min(v)` | (min(ax,bx), min(ay,by), min(az,bz)) | 逐分量最小值 |
| `max(v)` | (max(ax,bx), max(ay,by), max(az,bz)) | 逐分量最大值 |
| `abs()` | (\|ax\|, \|ay\|, \|az\|) | 逐分量绝对值 |

### 1.3 运算符

| 运算符 | 功能 |
|--------|------|
| `+` | 向量加法 |
| `-` | 向量减法 |
| `*` (scalar) | 数乘 |
| `/` (scalar) | 数除 |
| `-` (unary) | 取反 |

### 1.4 常量

| 常量 | 值 |
|------|-----|
| `ZERO` | (0, 0, 0) |
| `UNIT_X` | (1, 0, 0) |
| `UNIT_Y` | (0, 1, 0) |
| `UNIT_Z` | (0, 0, 1) |

---

## 2. 矩阵接口 (Mat4)

### 2.1 数据结构

**Rust**:
```rust
#[repr(C)]
pub struct Mat4 {
    pub m: [[f64; 4]; 4],
}
```

**C++**:
```cpp
struct Mat4 {
    double m[4][4];
};
```

**C API**:
```c
typedef struct {
    double m[4][4];
} trae_geo_mat4_t;
```

### 2.2 核心方法

| 方法 | 功能描述 |
|------|----------|
| `transpose()` | 矩阵转置 |
| `determinant()` | 计算行列式 |
| `inverse()` | 计算逆矩阵 |
| `try_inverse(&mut result)` | 安全计算逆矩阵 |
| `transform_point(p)` | 变换点（齐次坐标） |
| `transform_vector(v)` | 变换向量（忽略平移） |

### 2.3 工厂方法

| 方法 | 数学公式 | 功能描述 |
|------|----------|----------|
| `translate(v)` | 4×4 平移矩阵 | 平移变换 |
| `scale(v)` | 4×4 缩放矩阵 | 缩放变换 |
| `rotate_x(angle)` | 绕 X 轴旋转 | 旋转变换 |
| `rotate_y(angle)` | 绕 Y 轴旋转 | 旋转变换 |
| `rotate_z(angle)` | 绕 Z 轴旋转 | 旋转变换 |

### 2.4 常量

| 常量 | 说明 |
|------|------|
| `ZERO` | 零矩阵 |
| `IDENTITY` | 单位矩阵 |

---

## 3. 变换接口 (Transform)

### 3.1 数据结构

**Rust**:
```rust
#[repr(C)]
pub struct Transform {
    pub matrix: Mat4,
    pub inverse: Mat4,
}
```

### 3.2 核心方法

| 方法 | 功能描述 |
|------|----------|
| `transform_point(p)` | 变换点 |
| `transform_vector(v)` | 变换向量 |
| `inverse_transform_point(p)` | 逆变换点 |
| `inverse_transform_vector(v)` | 逆变换向量 |
| `compose(other)` | 变换组合 |
| `invert()` | 取逆变换 |

### 3.3 工厂方法

| 方法 | 功能描述 |
|------|----------|
| `translation(v)` | 创建平移变换 |
| `scaling(v)` | 创建缩放变换 |
| `rotation_x(angle)` | 创建 X 轴旋转变换 |
| `rotation_y(angle)` | 创建 Y 轴旋转变换 |
| `rotation_z(angle)` | 创建 Z 轴旋转变换 |
| `rotation(axis, angle)` | 创建任意轴旋转变换 |
| `look_at(eye, center, up)` | 创建视图变换 |
| `perspective(fov, aspect, near, far)` | 创建透视投影 |
| `orthographic(left, right, bottom, top, near, far)` | 创建正交投影 |

---

## 4. 精度控制接口

### 4.1 全局参数

| 参数 | 默认值 | 范围 | 用途 |
|------|--------|------|------|
| `epsilon()` | 1e-8 | [1e-15, 1e-3] | 浮点相等判断容差 |
| `tolerance()` | 1e-6 | [1e-15, 1e-1] | 几何计算容差 |
| `angle_tolerance()` | 1e-4 | [1e-10, 1e-1] | 角度计算容差 |
| `curve_tolerance()` | 1e-5 | [1e-15, 1e-2] | 曲线逼近容差 |
| `surface_tolerance()` | 1e-5 | [1e-15, 1e-2] | 曲面逼近容差 |

### 4.2 精度比较函数

| 函数 | 数学条件 | 功能描述 |
|------|----------|----------|
| `is_zero(value)` | \|value\| <= epsilon | 判断是否为零 |
| `is_equal(a, b)` | \|a-b\| <= tolerance | 判断是否相等 |
| `is_less_or_equal(a, b)` | a <= b + tolerance | 小于等于（带容差） |
| `is_greater_or_equal(a, b)` | a >= b - tolerance | 大于等于（带容差） |

### 4.3 数值工具函数

| 函数 | 功能描述 |
|------|----------|
| `clamp(value, min, max)` | 钳制到范围 [min, max] |
| `lerp(a, b, t)` | 线性插值 a + (b-a)*t |
| `normalize_angle(angle)` | 角度归一化到 [0, 2π) |

---

## 5. 几何基础接口

### 5.1 曲线类型

| 类型 | 数据结构 | 参数域 |
|------|----------|--------|
| `Line` | start, end | [0, 1] |
| `Circle` | center, normal, radius | [0, 1] (周期) |
| `Arc` | center, normal, radius, start_angle, end_angle | [0, 1] |
| `BezierCurve` | degree, control_points[] | [0, 1] |
| `NurbsCurve` | degree, control_points[], weights[], knots[] | [knot[0], knot[n-1]] |

### 5.2 曲线方法

| 方法 | 功能描述 |
|------|----------|
| `point_at(t)` | 在参数 t 处求值 |
| `tangent_at(t)` | 在参数 t 处求切向量 |
| `length()` | 曲线长度 |
| `direction()` | 曲线方向（仅直线） |

### 5.3 曲面类型

| 类型 | 数据结构 | 参数域 |
|------|----------|--------|
| `Plane` | origin, normal, u_dir, v_dir | (-∞, ∞) × (-∞, ∞) |
| `Cylinder` | origin, axis, radius | [0, 1] × (-∞, ∞) |
| `Sphere` | center, radius | [0, 1] × [0, 1] |
| `Cone` | origin, axis, angle, height | [0, 1] × [0, 1] |
| `Torus` | center, normal, major_radius, minor_radius | [0, 1] × [0, 1] |
| `BezierSurface` | u_degree, v_degree, control_points[][] | [0, 1] × [0, 1] |
| `NurbsSurface` | u_degree, v_degree, control_points[][], weights[][], u_knots[], v_knots[] | [u0, u1] × [v0, v1] |

### 5.4 曲面方法

| 方法 | 功能描述 |
|------|----------|
| `point_at(u, v)` | 在参数 (u, v) 处求值 |
| `normal_at(u, v)` | 在参数 (u, v) 处求法向量 |
| `distance_to_point(p)` | 点到曲面的有符号距离（仅平面） |

---

## 6. Brep 拓扑接口

### 6.1 拓扑元素

| 元素 | 数据结构 | 描述 |
|------|----------|------|
| `Vertex` | handle, point, tolerance | 顶点 |
| `Edge` | handle, curve, start_vertex, end_vertex, reversed, tolerance | 边 |
| `Loop` | handle, face, edges[], num_edges, outer | 环 |
| `Face` | handle, surface, loops[], num_loops, outer_loop, orientation, tolerance | 面 |
| `Shell` | handle, faces[], num_faces, orientation | 壳 |
| `Solid` | handle, shells[], num_shells, outer_shell | 实体 |
| `Compound` | handle, children[], num_children | 复合实体 |

### 6.2 拓扑关系

```
Compound
    └── Solid[]
            └── Shell[]
                    └── Face[]
                            └── Loop[]
                                    └── Edge[]
                                            └── Vertex
```

### 6.3 BrepModel 方法

| 方法 | 功能描述 |
|------|----------|
| `add_vertex(point, tolerance)` | 添加顶点，返回 Handle |
| `add_edge(curve, start_v, end_v, reversed, tolerance)` | 添加边，返回 Handle |
| `add_loop(face, edges[], outer)` | 添加环，返回 Handle |
| `add_face(surface, loops[], outer_loop, orientation, tolerance)` | 添加面，返回 Handle |
| `add_shell(faces[], orientation)` | 添加壳，返回 Handle |
| `add_solid(shells[], outer_shell)` | 添加实体，返回 Handle |
| `add_compound(children[])` | 添加复合实体，返回 Handle |
| `get_vertex(handle)` | 获取顶点 |
| `get_edge(handle)` | 获取边 |
| `get_face(handle)` | 获取面 |
| `get_solid(handle)` | 获取实体 |

---

## 7. 包围盒接口 (BoundingBox)

### 7.1 数据结构

```rust
#[repr(C)]
pub struct BoundingBox {
    pub min: Vec3,
    pub max: Vec3,
}
```

### 7.2 方法

| 方法 | 数学公式 | 功能描述 |
|------|----------|----------|
| `center()` | (min+max)/2 | 包围盒中心 |
| `size()` | max-min | 包围盒尺寸 |
| `volume()` | (max.x-min.x)*(max.y-min.y)*(max.z-min.z) | 包围盒体积 |
| `union(other)` | (min(min, other.min), max(max, other.max)) | 包围盒合并 |
| `intersects(other)` | AABB 相交检测 | 判断是否相交 |
| `contains_point(p)` | min <= p <= max | 判断点是否在盒内 |

---

## 8. 错误处理接口

### 8.1 错误枚举

```rust
#[repr(C)]
pub enum TraeGeoError {
    Ok = 0,
    NumericalSingularity = 1,
    TopologyCorrupted = 2,
    InvalidInput = 3,
    MemoryOverflow = 4,
    NotImplemented = 5,
    IntersectionFailure = 6,
    BooleanFailure = 7,
    MeshGenerationFailure = 8,
    OutOfBounds = 9,
    InvalidParameter = 10,
    DegenerateGeometry = 11,
    OperationCanceled = 12,
    FileIOError = 13,
    LicenseError = 14,
    InternalError = 15,
}
```

### 8.2 错误转换

| 方法 | 功能描述 |
|------|----------|
| `to_str()` | 将错误枚举转换为描述字符串 |

---

## 9. 内存管理规范

### 9.1 Rust 所有权模型

- `BrepModel` 拥有所有拓扑元素的所有权
- 拓扑元素通过 `Handle` (u64) 引用
- 禁止裸指针跨层传递

### 9.2 C++ 临时副本

- C++ 算法层仅持有临时拓扑副本
- 运算完成后结果序列化回 Rust 层
- 临时副本在运算结束后立即销毁

### 9.3 C API 生命周期

- 使用 `trae_geo_delete_entity(handle)` 显式释放对象
- 网格数据使用 `trae_geo_free_mesh_data()` 释放
- 字符串使用 `trae_geo_free_string()` 释放