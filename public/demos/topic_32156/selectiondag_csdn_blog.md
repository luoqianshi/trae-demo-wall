# LLVM SelectionDAG 入门：从 IR 到机器指令到底发生了什么？

> 本文整理自 Justin M. Fargnoli 和 Alex E. MacLean 在 2024 LLVM Developers' Meeting 的分享《A Beginner's Guide to SelectionDAG》。原材料是一份 89 页的 PDF 幻灯片，我按 CSDN 读者更容易理解的方式重新组织了一遍。

## 1. 为什么要了解 SelectionDAG？

如果你写过 LLVM Pass，大概率比较熟悉 LLVM IR。但当 IR 进入后端，准备变成真正的机器指令时，事情会变复杂：

- 不同 CPU/GPU 支持的类型不一样；
- 同一个操作在不同目标上可能需要不同降级方式；
- 有些目标架构有特殊指令，比如把 `mul + add` 合成一条 `mad`；
- 最终生成代码的质量，很大程度取决于后端这一段如何处理。

SelectionDAG 就是 LLVM 后端中非常重要的一套指令选择框架。很多目标都使用它，例如 `X86`、`NVPTX`、`MIPS`、`Hexagon` 等。

一句话概括：

> SelectionDAG 是 LLVM 后端里介于 LLVM IR 和机器指令之间的一种 DAG 表示，用来完成类型合法化、操作合法化、DAG 优化、指令选择和调度等工作。

注意，LLVM 里还有另一个后端框架叫 `GlobalISel`，它可以看作 SelectionDAG 的替代方案之一，但本文只讨论 SelectionDAG。

## 2. SelectionDAG 在编译流程中的位置

LLVM 常见编译流程可以粗略理解成：

```text
Source Code
   |
Frontend
   |
LLVM IR
   |
opt
   |
LLVM IR
   |
llc
   |
Assembly / Machine Code
```

SelectionDAG 主要工作在 `llc` 阶段，也就是 LLVM IR 被送进后端之后。

在 SelectionDAG 视角里，后端大致会经历：

```text
LLVM IR
   |
SelectionDAG Construction
   |
Type Legalization
   |
Operation Legalization
   |
DAG Combiner
   |
Instruction Selection
   |
Instruction Scheduling
   |
MachineIR / MachineInstr
```

这里最核心的问题是：LLVM IR 很通用，但目标机器不通用。SelectionDAG 的工作就是把“通用表达”逐步变成“目标机器能接受的表达”。

## 3. SelectionDAG 的数据结构

SelectionDAG 不是一整份程序对应一个 DAG，而是：

> 每个基本块通常对应一个 SelectionDAG。

也就是说，一个函数里的多个 basic block，会被分别构造成多个 DAG。

### 3.1 MVT 和 EVT

理解 SelectionDAG，首先要理解它的类型系统。

`MVT` 是 `Machine Value Type`，表示机器值类型。它是一组 SelectionDAG 后端能讨论的基础类型，例如：

- 整数：`i1`、`i32`、`i128`
- 浮点：`f16`、`bf16`、`f80`
- 向量：`v2i32`、`v128bf16`
- 特殊类型：`Other`、`Glue`

但每个目标架构只支持其中一部分。比如某个目标可能支持 `i32`，但不支持 `i128`。

`EVT` 是 `Extended Value Type`，可以理解为 MVT 的扩展版。它包含：

- 所有 MVT；
- LLVM IR 中支持的整数、浮点、向量类型；
- 一些目标机器未必原生支持的奇怪类型，比如 `i3`、`v99i99`。

但 EVT 并不包含 LLVM IR 的所有类型，比如 `struct` 和 `array` 就不在 SelectionDAG 类型集合里。因此结构体相关操作在构建 DAG 时通常要被拆开。

### 3.2 SDNode：DAG 的节点

`SDNode` 是 SelectionDAG 的基本节点。每个节点通常包含：

- `Opcode`：说明这个节点做什么，例如 `ISD::ADD`、`ISD::MUL`、`ISD::Constant`；
- 一个或多个结果；
- 零个或多个操作数；
- 其他附加信息，例如常量值、flags、内存访问信息等。

比如下面这段 IR：

```llvm
%y = add i32 %a, 5
%z = mul i32 %y, 3
br label %join
```

在 DAG 中可能会出现：

- `ISD::Constant 5`
- `ISD::ADD`
- `ISD::Constant 3`
- `ISD::MUL`
- `ISD::BR`

### 3.3 SDValue：节点的输出

`SDValue` 表示某个 `SDNode` 的一个输出结果。

为什么不是一个节点只有一个输出？因为 SelectionDAG 里的节点可以有多个结果。比如一个节点可能同时产生：

- 一个普通值；
- 一个 chain；
- 一个 glue。

所以 `SDValue` 通常包含两件事：

- 它来自哪个 `SDNode`；
- 它是这个节点的第几个结果。

### 3.4 SDUse：节点的输入

`SDUse` 表示某个节点使用了另一个节点产生的值，也就是 DAG 边上的“输入关系”。

它包含：

- 被使用的 `SDValue`；
- 使用这个值的 `SDNode`；
- 这是用户节点的第几个 operand。

可以简单理解为：

```text
SDNode 产生 SDValue
SDUse 把 SDValue 接到另一个 SDNode 的输入上
```

## 4. DAG 里不只是数据依赖：还有 Chain 和 Glue

普通 DAG 边可以表达数据依赖，比如 `mul` 必须等 `add` 的结果。

但编译器还需要表达一些“不是普通数据值”的依赖。

### 4.1 跨基本块的数据流：CopyFromReg / CopyToReg

SelectionDAG 是按基本块构建的。那如果某个 SSA 值跨 basic block 使用怎么办？

SelectionDAG 使用：

- `CopyFromReg`：从寄存器读入一个在别处定义、当前块要用的值；
- `CopyToReg`：把当前块定义的值写到寄存器，供别处使用。

它们帮助 SelectionDAG 在基本块级别表示跨块数据流。

### 4.2 Chain：表达调度和副作用依赖

有些操作没有普通数据依赖，但顺序不能乱。例如：

- store 必须在某些 load/store 前后保持顺序；
- branch 通常要在基本块里的其他操作之后；
- call、volatile load/store 等带副作用操作不能随便重排。

这时 SelectionDAG 使用 `chain` 值来表示非数据依赖。

每个 basic block 的 DAG 通常会有一个 `EntryToken`，表示进入这个基本块的起点依赖。DAG 还会有一个 `root`，通常对应终结指令，例如 branch。

对于多个 chain 需要汇合的情况，会用 `ISD::TokenFactor` 把多个依赖合并起来。

### 4.3 MemSDNode：表达内存访问信息

对于 load/store，DAG 中会使用 `MemSDNode` 记录内存相关信息，比如：

- 访问大小；
- 对齐；
- 源 IR 指针；
- 是否 volatile；
- 读写关系。

这些信息对合法化、优化和调度都很重要。

## 5. 构建 SelectionDAG

SelectionDAG 构建阶段的目标是：

> 把每个 basic block 的 LLVM IR 转成 DAG 表示。

大多数 LLVM IR 指令和 SelectionDAG 节点之间有近似 1:1 的对应关系，但也有例外。

一个典型例外是结构体：

```llvm
%l = load {i32, i1}, ptr %p1, align 8
%v = extractvalue {i32, i1} %l, 0
```

SelectionDAG 不直接支持 struct 类型，所以这类操作会被拆成元素级别的操作。例如一个结构体 load 可能变成两个 load：一个读 `i32`，另一个读 `i1`。

还有一些操作目标相关性太强，无法完全由通用逻辑处理，例如函数调用约定。目标后端通常需要实现：

```cpp
SDValue TargetLowering::LowerCall(...);
SDValue TargetLowering::LowerFormalArgs(...);
SDValue TargetLowering::LowerReturn(...);
```

这些 hook 用来处理 call、函数参数和返回值。

## 6. 类型合法化：Type Legalization

LLVM IR 能表达很多类型，但目标机器不一定支持。

类型合法化的目标是：

> 把目标不支持的类型降级成目标支持的类型。

例如：

- 目标支持 `i32`，但不支持 `i24`；
- 目标支持 `i64`，但不支持 `i128`；
- 目标支持 `v4i8`，但不支持 `v3i8`。

目标后端通过 `addRegisterClass(MVT)` 告诉 SelectionDAG：哪些 MVT 对当前目标是合法的。

之后 SelectionDAG 会为各种类型建立一张 action 表，用不同策略处理非法类型。

常见策略包括：

| Action | 含义 |
| --- | --- |
| `TypeLegal` | 目标原生支持这个类型 |
| `TypePromoteInteger` | 把整数提升成更大的整数 |
| `TypeExpandInteger` | 把整数拆成两个更小的整数 |
| `TypeSoftenFloat` | 把浮点转换成同大小整数处理 |
| `TypePromoteFloat` | 把浮点提升成更大的浮点 |
| `TypeScalarizeVector` | 把单元素向量标量化 |
| `TypeSplitVector` | 把向量拆成两半 |
| `TypeWidenVector` | 把向量扩宽成更大的合法向量 |

举几个例子。

### 6.1 `i128` 加法拆成两个 `i64`

如果目标不支持 `i128`，但支持 `i64`，那么：

```text
i128 add
```

可能会被拆成：

```text
low 64-bit add
high 64-bit add with carry
```

SelectionDAG 不只是“改类型”，它会真的生成新的 DAG 节点。

### 6.2 `i24` 提升到 `i32`

如果目标不支持 `i24`，但支持 `i32`，可以把 `i24` 操作提升成 `i32` 操作。

但提升后要注意高位不能污染结果，所以 SelectionDAG 会通过 mask 等操作保留低 24 位。

### 6.3 `v3i8` 扩宽成 `v4i8`

某些目标更愿意用更宽的向量类型。例如 Hexagon 可以把 `v3i8` 扩宽成 `v4i8`，然后在合法向量类型上执行操作。

目标后端可以重写：

```cpp
LegalizeTypeAction getPreferredVectorAction(MVT);
```

来告诉 SelectionDAG 某个向量类型更适合怎么合法化。

## 7. 操作合法化：Operation Legalization

类型合法了，不代表操作也合法。

比如目标支持 `f16` 类型，但不一定支持 `f16` 上的除法。SelectionDAG 有 400 多个 opcode，不同目标不可能全部支持。

操作合法化的目标是：

> 把 SelectionDAG 中目标不支持的 opcode 或 opcode + type 组合，变成目标支持的操作。

目标后端通过：

```cpp
setOperationAction(Opcode, MVT, LegalizeAction);
```

告诉 SelectionDAG 某个操作该怎么处理。

常见 `LegalizeAction` 包括：

| Action | 含义 |
| --- | --- |
| `Legal` | 目标原生支持 |
| `Promote` | 用更大的类型执行 |
| `Expand` | 用其他合法操作模拟 |
| `Custom` | 调用目标后端自定义 hook |

### 7.1 Promote：用更大的类型做

NVPTX 示例中，`ISD::FDIV` 对 `f32` 是合法的，但对 `f16` 不合法。

可以这样告诉 SelectionDAG：

```cpp
setOperationAction(ISD::FDIV, MVT::f16, Promote);
```

于是 `f16` 除法可能会变成：

```text
f16 -> f32
f32 fdiv
f32 -> f16
```

### 7.2 Expand：用其他操作模拟

MIPS 示例中，如果 `ISD::BSWAP` 对 `i32` 不合法，可以：

```cpp
setOperationAction(ISD::BSWAP, MVT::i32, Expand);
```

然后用 shift、and、or 等合法操作模拟 byte swap。

### 7.3 Custom：交给目标后端自己降级

有时通用 Expand 不够，目标需要自定义逻辑。

这时可以：

```cpp
setOperationAction(Opcode, MVT, Custom);
```

SelectionDAG 遇到对应操作时会调用：

```cpp
LowerOperation()
```

例如：

- NVPTX 可以把某些 `VECTOR_SHUFFLE` 降成目标特定的 `NVPTXISD::PRMT`；
- X86 可以把 `ISD::ABS` 自定义降成目标特定节点。

## 8. DAGCombiner：SelectionDAG 里的 InstCombine

LLVM IR 层已经有很多优化，为什么 SelectionDAG 还要优化？

原因有两个：

1. 构建 DAG 和合法化过程中会引入新的冗余；
2. 有些优化只有在目标相关语境下才知道值不值得做。

`DAGCombiner` 可以理解为：

> SelectionDAG 版本的 InstCombine。

它会做通用 peephole，也会询问 `TargetLoweringInfo`，判断某些变换对当前目标是否划算。

例如：

```cpp
// fold (fadd A, (fneg B)) -> (fsub A, B)
if (SDValue NegN1 = TLI.getCheaperNegatedExpression(N1, DAG))
  return DAG.getNode(ISD::FSUB, VT, N0, NegN1);
```

目标也可以注册自己的 DAG combine：

```cpp
setTargetDAGCombine(Opcode);
```

然后实现：

```cpp
PerformDAGCombine()
```

典型用途包括：

- 减少寄存器压力；
- 利用目标特殊指令；
- 消除目标上代价较高的操作。

## 9. 指令选择：Instruction Selection

经过构建、合法化和 combine 之后，DAG 里很多节点仍然是通用节点，例如：

- `ISD::ADD`
- `ISD::MUL`
- `ISD::LOAD`

指令选择阶段的目标是：

> 把通用 SDNode 替换成目标机器节点。

机器节点使用的是目标相关的 `MachineInstruction Opcode`。

由于这件事高度目标相关，每个目标后端都要实现：

```cpp
virtual void Select(SDNode *N) = 0;
```

但如果所有匹配逻辑都手写，会非常痛苦。所以 LLVM 使用 TableGen 自动生成大量匹配代码。

### 9.1 TableGen 需要三类东西

TableGen 指令选择一般需要描述：

1. `SDPatternOperator`：要在 DAG 里匹配什么；
2. `Instruction`：要生成哪条机器指令；
3. `Pattern`：从 DAG 模式到机器指令的映射。

例如一个简化的 `add i32` 模式：

```tablegen
def add : SDNode<"ISD::ADD", SDTIntBinOp,
                 [SDNPCommutative, SDNPAssociative]>;

def ADDi32rr : NVPTXInst<
  (outs Int32Regs:$dst),
  (ins Int32Regs:$a, Int32Regs:$b),
  "add.s32 \t$dst, $a, $b;">;

def : Pattern<
  (set Int32Regs:$dst,
       (add (i32 Int32Regs:$a), (i32 Int32Regs:$b))),
  (ADDi32rr Int32Regs:$dst, Int32Regs:$a, Int32Regs:$b)>;
```

含义是：

```text
ISD::ADD(i32 a, i32 b)
   =>
NVPTX::ADDi32rr
```

目标后端也可以在 TableGen 匹配之前插入自定义逻辑：

```cpp
void NVPTXDAGToDAGISel::Select(SDNode *N) {
  // Custom logic here
  SelectCode(N); // TableGen based selection
}
```

SelectionDAG 指令选择会按拓扑顺序遍历 DAG。TableGen 模式之间也会按启发式排序，例如优先匹配更复杂的模式、优先生成更少指令等。

## 10. 指令调度：Instruction Scheduling

指令选择后，DAG 里已经基本是机器节点。

Instruction Scheduling 的输入是机器节点 DAG，输出是一条线性的机器指令序列。

也就是说，它要决定：

```text
DAG of machine nodes
   =>
linear sequence of machine instructions
```

本文重点不展开调度。实际深入时可以继续看 LLVM 的 scheduling model、machine scheduler 等内容。

## 11. 示例：为 PTX 支持 `mad` 指令

最后用 PDF 里的例子把流程串起来。

PTX 里有一条 `mad` 指令，语义是：

```text
mad(a, b, c) = a * b + c
```

如果 LLVM IR 是：

```llvm
define i32 @foo(i32 %0, i32 %1, i32 %2) {
  %mul = mul i32 %0, %1
  %add = add i32 %mul, %2
  ret i32 %add
}
```

我们希望后端不要生成普通的 `mul + add`，而是生成：

```ptx
mad.lo.s32 %r4, %r1, %r2, %r3;
```

为什么？因为一条 `mad` 通常比两条指令延迟更低，也能减少寄存器压力。

### 11.1 先判断要改哪里

这个例子里不需要改类型合法化，也不需要改操作合法化，因为：

- `mad` 支持的类型已经是合法类型；
- `ISD::ADD` 和 `ISD::MUL` 本身也是合法操作。

真正需要做的是两件事：

1. DAG Combine：把 `add(mul(a, b), c)` 折叠成目标特定节点 `NVPTXISD::IMAD`；
2. Instruction Selection：把 `NVPTXISD::IMAD` 选成机器指令 `NVPTX::MAD32rrr`。

### 11.2 注册目标特定 DAG Combine

因为我们想在看到 `ISD::ADD` 时检查它的第一个 operand 是不是 `ISD::MUL`，所以先注册：

```cpp
NVPTXTargetLowering::NVPTXTargetLowering() {
  ...
  setTargetDAGCombine(ISD::ADD);
  ...
}
```

然后在 `PerformDAGCombine()` 里分发：

```cpp
SDValue NVPTXTargetLowering::PerformDAGCombine(SDNode *N) {
  switch (N->getOpcode()) {
  case ISD::ADD:
    return PerformADDCombine(N);
  ...
  }
}
```

### 11.3 把 `add + mul` 合成 `IMAD`

简化后的 combine 逻辑如下：

```cpp
SDValue PerformADDCombine(SDNode *N) {
  if (N->getOperand(0).getOpcode() != ISD::MUL)
    return SDValue();

  if (N->getValueType() != MVT::i32)
    return SDValue();

  return DAG.getNode(NVPTXISD::IMAD, N->getValueType(),
                     N->getOperand(0).getOperand(0),
                     N->getOperand(0).getOperand(1),
                     N->getOperand(1));
}
```

它做的事情是：

```text
ISD::ADD(ISD::MUL(a, b), c)
   =>
NVPTXISD::IMAD(a, b, c)
```

### 11.4 在 TableGen 中声明节点和机器指令

先声明目标特定 SDNode：

```tablegen
def SDTIMAD : SDTypeProfile<1, 3,
  [SDTCisSameAs<0, 1>,
   SDTCisSameAs<0, 2>,
   SDTCisSameAs<0, 3>,
   SDTCisInt<0>]>;

def imad : SDNode<"NVPTXISD::IMAD", SDTIMAD>;
```

再声明机器指令：

```tablegen
def MAD32rrr : NVPTXInst<
  (outs Int32Regs:$dst),
  (ins Int32Regs:$a, Int32Regs:$b, Int32Regs:$c),
  "mad.lo.s32 \t$dst, $a, $b;">;
```

这里需要注意：幻灯片里的 assembly string 展示为 `$dst, $a, $b`，但 `mad(a, b, c)` 和后面的 pattern 都是三个输入。阅读时应以三输入语义和 pattern 为准。

### 11.5 建立 Selection Pattern

最后写 pattern，让 TableGen 知道如何从 `imad` 选到机器指令：

```tablegen
def : Pattern<
  (set Int32Regs:$dst,
       (imad (i32 Int32Regs:$a),
             (i32 Int32Regs:$b),
             (i32 Int32Regs:$c))),
  (MAD32rrr Int32Regs:$dst,
            Int32Regs:$a,
            Int32Regs:$b,
            Int32Regs:$c)>;
```

这样，整个路径就是：

```text
LLVM IR:
  add(mul(a, b), c)

SelectionDAG:
  ISD::ADD(ISD::MUL(a, b), c)

DAG Combine:
  NVPTXISD::IMAD(a, b, c)

Instruction Selection:
  NVPTX::MAD32rrr

PTX:
  mad.lo.s32
```

## 12. 调试 SelectionDAG 的常用参数

PDF 最后给了几个非常实用的 debug-only 参数：

```bash
-debug-only=isel
-debug-only=legalize-types
-debug-only=legalizedag
-debug-only=dagcombine
```

如果你在调 LLVM 后端，可以用这些参数观察：

- 指令选择发生了什么；
- 类型合法化做了什么；
- 操作合法化生成了哪些节点；
- DAG combine 是否触发。

## 13. 总结

SelectionDAG 可以按下面这条主线理解：

```text
把每个 basic block 的 LLVM IR 建成 DAG
   |
把目标不支持的类型变合法
   |
把目标不支持的操作变合法
   |
用 DAGCombiner 清理和做目标相关 peephole
   |
把通用 DAG 节点选择成机器节点
   |
调度成线性机器指令序列
```

它最难的地方不在某个单独 API，而在于“通用逻辑”和“目标相关逻辑”之间的边界。遇到问题时，建议先问自己三个问题：

1. 这是类型不合法，还是操作不合法？
2. 这是通用 lowering 能解决，还是必须目标自定义？
3. 我需要的是 legalization，DAG combine，还是 instruction selection？

如果能把问题放回这条流水线里，SelectionDAG 就会清晰很多。

## 参考

- Justin M. Fargnoli, Alex E. MacLean, NVIDIA, `A Beginner's Guide to SelectionDAG`, 2024 LLVM Developers' Meeting
- LLVM Target-Independent Code Generator 文档
- LLVM Instruction Selector 文档
- LLVM 后端 legalizations 相关文章
