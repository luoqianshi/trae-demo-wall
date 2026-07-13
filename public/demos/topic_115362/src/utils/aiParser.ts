import type { Control, ControlType } from "@/types";
import { CONTROL_LIBRARY } from "@/constants/controls";

// 关键词 -> 控件类型 映射
const KEYWORD_RULES: { keywords: string[]; type: ControlType; labelHint?: string }[] = [
  // 附件/图片优先匹配，避免被「图片」等拆成输入
  { keywords: ["附件", "图片", "头像", "文件", "上传", "照片", "logo", "icon"], type: "upload" },
  { keywords: ["描述", "备注", "详情", "简介", "说明", "长文本", "内容", "地址"], type: "textarea" },
  { keywords: ["日期时间", "创建时间", "更新时间", "注册时间", "时间戳", "datetime"], type: "datetime" },
  { keywords: ["日期", "生日", "出生", "date"], type: "date" },
  { keywords: ["时间", "时刻"], type: "time" },
  { keywords: ["年龄", "数量", "金额", "价格", "数字", "编号", "排序", "次数", "积分", "余额", "工资", "数量"], type: "number" },
  { keywords: ["状态", "类型", "级别", "等级", "分类", "下拉", "性别", "民族", "部门", "角色", "职位"], type: "select" },
  { keywords: ["是否", "开关", "启用", "禁用", "激活", "开关"], type: "switch" },
  { keywords: ["邮箱", "email", "邮件"], type: "input", labelHint: "邮箱" },
  { keywords: ["手机", "电话", "联系方式"], type: "input", labelHint: "手机号" },
  { keywords: ["密码", "password"], type: "input" },
  { keywords: ["名称", "标题", "名字", "用户名", "账号", "昵称", "姓名", "标题", "主题", "关键字", "标签", "编码", "代码", "路径", "链接", "url"], type: "input" },
];

// 中文数字转阿拉伯
const CN_NUM: Record<string, number> = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10 };

// 把中文描述拆成字段片段
function splitFields(input: string): string[] {
  // 按常见分隔符拆分
  const parts = input
    .replace(/[，,、；;。.\n]/g, "|")
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);
  return parts;
}

// 从片段提取字段标签
function extractLabel(part: string): string {
  // 去掉「包含」「有」「需要」等引导词
  let s = part.replace(/^(包含|包括|有|需要|要|加|添加|一个|一项|字段|属性)\s*/g, "").trim();
  // 去掉末尾的「字段」「控件」
  s = s.replace(/(字段|控件|项)$/g, "").trim();
  return s || part;
}

// 生成字段名（拼音映射简化为 field+序号，含语义后缀）
function genField(label: string, type: ControlType, index: number): string {
  const hintMap: Record<string, string> = {
    用户名: "userName", 账号: "account", 姓名: "realName", 名字: "name", 名称: "name",
    标题: "title", 主题: "topic", 手机: "phone", 电话: "phone", 邮箱: "email", 密码: "password",
    年龄: "age", 金额: "amount", 价格: "price", 数量: "count", 余额: "balance", 积分: "score",
    状态: "status", 类型: "type", 级别: "level", 等级: "grade", 分类: "category", 性别: "gender",
    部门: "dept", 角色: "role", 职位: "position", 日期: "date", 生日: "birthday", 时间: "time",
    创建时间: "createTime", 更新时间: "updateTime", 注册时间: "registerTime",
    描述: "description", 备注: "remark", 详情: "detail", 简介: "intro", 地址: "address",
    附件: "attachment", 图片: "image", 头像: "avatar", 文件: "file", 照片: "photo",
    是否: "flag", 启用: "enabled",
  };
  const mapped = hintMap[label];
  if (mapped) return mapped;
  // 兜底
  return `field${index}`;
}

export function parseAiInput(input: string, startIndex: number): Control[] {
  const parts = splitFields(input);
  const controls: Control[] = [];
  let idx = startIndex;

  for (const part of parts) {
    const label = extractLabel(part);
    // 匹配规则
    let matched: { type: ControlType; labelHint?: string } | null = null;
    for (const rule of KEYWORD_RULES) {
      if (rule.keywords.some((kw) => label.includes(kw) || part.includes(kw))) {
        matched = rule;
        break;
      }
    }
    if (!matched) {
      // 默认当成输入框
      matched = { type: "input" };
    }

    const meta = CONTROL_LIBRARY.find((c) => c.type === matched!.type)!;
    idx += 1;
    const finalLabel = matched.labelHint ?? label;
    const field = genField(label, matched.type, idx);
    const ctrl: Control = {
      id: `${matched.type}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      type: matched.type,
      field,
      label: finalLabel,
      placeholder: `请输入${finalLabel}`,
      required: false,
      defaultValue: "",
      dbType: meta.defaultDbType,
      javaType: meta.defaultJavaType,
      length: meta.defaultLength,
      width: 24,
      options: meta.hasOptions
        ? [
            { label: "选项一", value: "1" },
            { label: "选项二", value: "2" },
          ]
        : undefined,
    };
    // 手机/邮箱加校验提示
    if (matched.labelHint === "手机号") ctrl.placeholder = "请输入手机号";
    if (matched.labelHint === "邮箱") ctrl.placeholder = "请输入邮箱";
    controls.push(ctrl);
  }

  return controls;
}
