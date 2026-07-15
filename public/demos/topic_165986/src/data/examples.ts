import type { EntryKind } from "@/types";

export interface Example {
  id: string;
  kind: EntryKind;
  title: string;
  content: string;
}

export const examples: Record<string, Example> = {
  work: {
    id: "work",
    kind: "mood",
    title: "今天工作让我很累",
    content: "今天工作让我很累，但我想弄清楚真正消耗我的是什么。\n\n表面上是事情太多，但我怀疑更深处是：我一直在努力证明自己值得被信任。",
  },
  meaning: {
    id: "meaning",
    kind: "question",
    title: "人生意义要怎么建立？",
    content: "我最近总在想：如果没有确定答案，人生意义要怎么建立？\n\n我不想要鸡汤，也不想要太抽象的哲学定义。我想知道一个普通人可以怎样慢慢活出自己的意义。",
  },
  physics: {
    id: "physics",
    kind: "study",
    title: "物理怎么入门？",
    content: "物理入门不要先讲公式，先帮我理解力、能量和时间的直觉。\n\n如果可以，请给我一个适合零基础的学习路径。",
  },
};

export const kindTemplates: Record<EntryKind, { label: string; defaultTitle: string; content: string }> = {
  free: {
    label: "自由写",
    defaultTitle: "",
    content: "",
  },
  mood: {
    label: "心情整理",
    defaultTitle: "今天的心情",
    content: "现在最明显的感受是：\n它可能和这件事有关：\n我真正希望被理解的是：",
  },
  question: {
    label: "长期问题",
    defaultTitle: "一个长期问题",
    content: "我想长期探索的问题是：\n我现在已经知道的是：\n我还不确定的是：",
  },
  study: {
    label: "学习探索",
    defaultTitle: "学习探索",
    content: "我想入门的主题是：\n请先用直觉解释，不要一开始堆术语。\n我目前卡在：",
  },
  letter: {
    label: "写给自己",
    defaultTitle: "写给未来的自己",
    content: "亲爱的我：\n现在的我想告诉你：\n如果你以后再看到这段话，请记得：",
  },
};
