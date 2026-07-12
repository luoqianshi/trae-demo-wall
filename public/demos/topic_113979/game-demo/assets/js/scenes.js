// Workspace Switcher 游戏化交互 Demo —— 阶段定义（S3 软桌面模拟重构）
//
// 把流程切成 6 个阶段（phase），主交互是"一键触发 + 自动播放"：
//   preview    自动预览：显示器轮播 4 个桌面，按钮"打开工作区管理"
//   managing   工作区管理：弹出管理面板，选择释放目标并进入释放模式
//   releasing  释放资源（自动）：逐桌面记录 → 收起 → 干净桌面
//   clean            干净桌面：显示目标卡，点击托盘图标进入恢复管理
//   restore-managing 恢复管理：flyout 中选择恢复（与释放入口对称）
//   restoring        恢复工作区（自动）：逐桌面恢复 → 8/8 URL 归位
//   done             完成：证据条 + 可展开完整证据 + 重新演示
//
// 只有 preview / managing / clean / restore-managing / done 是"可点击推进"阶段；
// releasing / restoring 由 app.js 自动播放驱动，到达后自动进入下一阶段。
//
// 安全边界：本文件不调用任何真实系统 API。所有日志行均带 [SIMULATED] 标记。

window.SCENES = (function () {
  "use strict";

  var phases = [
    {
      id: "preview",
      label: "自动预览",
      labelEn: "Auto preview",
      statusText: "模拟显示器轮播中",
      description:
        "显示器正在自动轮播 4 个模拟桌面：开发、检索、文档、沟通。" +
        "这位用户同时开着多个工作区，资源被分散占用。打开工作区管理，开始释放与恢复演示。",
      hint: "点击下方按钮打开工作区管理面板。",
      actionLabel: "打开工作区管理"
    },
    {
      id: "managing",
      label: "工作区管理",
      labelEn: "Workspace management",
      statusText: "已打开工作区管理",
      description:
        "管理面板列出 4 个工作区。选择一个释放目标并进入重任务/游戏模式，" +
        "系统会自动记录每个桌面、收起窗口、释放资源，最终得到一个干净桌面。",
      hint: "选择释放目标后，系统会自动播放记录与收起过程。",
      actionLabel: "进入游戏 / 重任务模式"
    },
    {
      id: "releasing",
      label: "释放资源",
      labelEn: "Releasing",
      statusText: "正在记录并收起工作区",
      description:
        "自动播放中：逐个桌面记录快照，再把窗口收起，最终只剩一个干净桌面。" +
        "最小化窗口在记录时被排除，受管关闭目标会被清理并校验残留。",
      hint: "无需操作，等待自动播放完成。",
      actionLabel: null
    },
    {
      id: "clean",
      label: "干净桌面",
      labelEn: "Clean desktop",
      statusText: "资源已释放，桌面干净",
      description:
        "4 个工作区已收起，桌面恢复干净，CPU / GPU / 内存可以全部投入你选择的重任务或游戏。" +
        "工作状态已被安全记录，接下来一键恢复，看它原样回来。",
      hint: "点击下方按钮恢复之前的工作区。",
      actionLabel: "恢复工作区"
    },
    {
      id: "restore-managing",
      label: "恢复管理",
      labelEn: "Restore management",
      statusText: "已打开恢复管理",
      description:
        "工作区已被安全记录。从这里一键恢复，系统会按记录的位置逐桌面恢复窗口，" +
        "浏览器 URL 以 --new-window 隔离恢复，直到 8/8 全部归位。入口与释放流程对称。",
      hint: "点击恢复工作区，系统会按记录的位置原样恢复。",
      actionLabel: "恢复工作区"
    },
    {
      id: "restoring",
      label: "恢复工作区",
      labelEn: "Restoring",
      statusText: "正在恢复工作区",
      description:
        "自动播放中：逐个桌面按记录的位置恢复窗口，浏览器 URL 以 --new-window 隔离恢复，直到 8/8 全部归位。",
      hint: "无需操作，等待自动播放完成。",
      actionLabel: null
    },
    {
      id: "done",
      label: "完成",
      labelEn: "Done",
      statusText: "工作区已恢复",
      description:
        "4 个桌面与窗口已原样恢复，浏览器 URL 8/8 归位。下方是简洁证据条，" +
        "可展开查看完整实验指标与踩坑记录。真实执行能力由录屏、实验报告和截图证明。",
      hint: "可展开完整证据，或重新演示一次。",
      actionLabel: "重新演示"
    }
  ];

  function byId(id) {
    for (var i = 0; i < phases.length; i++) {
      if (phases[i].id === id) return phases[i];
    }
    return null;
  }

  function indexOf(id) {
    for (var i = 0; i < phases.length; i++) {
      if (phases[i].id === id) return i;
    }
    return -1;
  }

  return {
    phases: phases,
    byId: byId,
    indexOf: indexOf
  };
})();
