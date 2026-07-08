import { Scenario } from '@/types';

export const mockScenario: Scenario = {
  title: '地铁站台上',
  theme: '地铁',
  scene: '🚇',
  sceneIcon: '🚇',
  description:
    '地铁到站了，你站在站台边等下一班列车。旁边一位阿姨笑着问你："小朋友，你也喜欢地铁吗？你知道这条线路经过哪些站吗？"',
  question: '面对阿姨的提问，你会怎么做？',
  options: [
    {
      id: 'A',
      text: '低头不看她，专心看地铁',
      feedback:
        '有时候我们想安静地待着，这很正常。不过，有时候也可以试试对她笑笑，或者点点头，慢慢你会发现，和别人打个招呼并没有那么难。',
      feedbackTone: 'supportive',
      icon: '🤫',
    },
    {
      id: 'B',
      text: '"对！我最喜欢地铁了，我还知道2号线经过哪些站……"',
      feedback:
        '你愿意和别人分享你喜欢的东西，这真的很棒！当你愿意开口，就是让别人走进你世界的好方法。你做得很好！',
      feedbackTone: 'gentle',
      icon: '😊',
    },
    {
      id: 'C',
      text: '转身走到另一边站台',
      feedback:
        '有时候换个地方待着会让我们更舒服，这也是一种照顾自己的方式。如果下次想留在原地，也可以试试对阿姨笑一笑，或者轻轻说一句"你好"。',
      feedbackTone: 'supportive',
      icon: '🚶',
    },
  ],
  skillTag: '情绪识别',
  socialRule: '有人主动跟你说话，点头、微笑或说一句话，都是在说"我听到你了"。',
  parentTip: '平时在站台、公园遇到熟人打招呼，帮孩子想一句简短的"默认回复"，练得多了就不紧张。',
};