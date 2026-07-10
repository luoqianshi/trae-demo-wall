import type { SnowballStage } from './snowball-score';

export type StoryScene =
  | 'dailyQuestion'
  | 'celebration'
  | 'challengeJoin'
  | 'challengeComplete'
  | 'taskEmptyBig'
  | 'taskEmptyHabit'
  | 'taskEmptyQuick'
  | 'taskEmptyGoalGroup'
  | 'taskEmptyNormal'
  | 'taskEmptyList'
  | 'taskEmptyKanbanPending'
  | 'taskEmptyKanbanDone'
  | 'taskEmptyQuadrant'
  | 'sidebarBigTaskEmpty'
  | 'sidebarTodoEmpty'
  | 'sidebarTodoAllDone'
  | 'recordEmpty'
  | 'recordLoading';

export interface StoryText {
  main: string;
  sub: string;
}

const SNOWBALL_STORY_TEXT: Record<StoryScene, Record<SnowballStage, StoryText>> = {
  dailyQuestion: {
    snowflake: { main: '嘿，你来啦！我还在等你呢~', sub: '快告诉我你今天的小故事吧 ✨' },
    small_ball: { main: '嘿嘿，我又长大了一点点~', sub: '你今天有什么想跟我说的吗？' },
    ball: { main: '我围上围巾啦，暖不暖？', sub: '来聊聊今天发生了什么吧 ⛄' },
  },
  celebration: {
    snowflake: { main: '哇！你做到了！我超开心！', sub: '我又长大了一丢丢~' },
    small_ball: { main: '太棒啦！我又圆了一点点！', sub: '继续加油，我越来越可爱了~' },
    ball: { main: '嘿嘿，谢谢你让我变强！', sub: '每完成一个，我就更厉害一点~' },
  },
  challengeJoin: {
    snowflake: { main: '我陪你一起挑战！', sub: '' },
    small_ball: { main: '挑战开始！我会为你加油的~', sub: '' },
    ball: { main: '放马过来！我给你力量！', sub: '' },
  },
  challengeComplete: {
    snowflake: { main: '我们做到了！我好开心~', sub: '' },
    small_ball: { main: '太厉害了！我又长大了！', sub: '' },
    ball: { main: '我们赢了！我越来越强了~', sub: '' },
  },
  taskEmptyBig: {
    snowflake: { main: '我还没有长任务可以追呢~', sub: '创建一个长任务，让我有方向地滚吧！' },
    small_ball: { main: '我还没有长任务可以追呢~', sub: '创建一个长任务，让我有方向地滚吧！' },
    ball: { main: '我还没有长任务可以追呢~', sub: '创建一个长任务，让我有方向地滚吧！' },
  },
  taskEmptyHabit: {
    snowflake: { main: '还没有习惯可以打卡~', sub: '养成一个好习惯，我每天陪你坚持！' },
    small_ball: { main: '还没有习惯可以打卡~', sub: '养成一个好习惯，我每天陪你坚持！' },
    ball: { main: '还没有习惯可以打卡~', sub: '养成一个好习惯，我每天陪你坚持！' },
  },
  taskEmptyQuick: {
    snowflake: { main: '没有快速任务呢~', sub: '随手记一件小事，我也能长大一点！' },
    small_ball: { main: '没有快速任务呢~', sub: '随手记一件小事，我也能长大一点！' },
    ball: { main: '没有快速任务呢~', sub: '随手记一件小事，我也能长大一点！' },
  },
  taskEmptyGoalGroup: {
    snowflake: { main: '这个目标下还没有任务~', sub: '为它添加任务，让我朝着目标滚！' },
    small_ball: { main: '这个目标下还没有任务~', sub: '为它添加任务，让我朝着目标滚！' },
    ball: { main: '这个目标下还没有任务~', sub: '为它添加任务，让我朝着目标滚！' },
  },
  taskEmptyNormal: {
    snowflake: { main: '没有普通任务呢~', sub: '给我安排点事情做吧，我闲得发慌！' },
    small_ball: { main: '没有普通任务呢~', sub: '给我安排点事情做吧，我闲得发慌！' },
    ball: { main: '没有普通任务呢~', sub: '给我安排点事情做吧，我闲得发慌！' },
  },
  taskEmptyList: {
    snowflake: { main: '这里空空的，我好无聊~', sub: '给我添加点任务吧，我想帮你完成！' },
    small_ball: { main: '这里空空的，我好无聊~', sub: '给我添加点任务吧，我想帮你完成！' },
    ball: { main: '这里空空的，我好无聊~', sub: '给我添加点任务吧，我想帮你完成！' },
  },
  taskEmptyKanbanPending: {
    snowflake: { main: '待办列空空的~', sub: '添加任务让我有事可做！' },
    small_ball: { main: '待办列空空的~', sub: '添加任务让我有事可做！' },
    ball: { main: '待办列空空的~', sub: '添加任务让我有事可做！' },
  },
  taskEmptyKanbanDone: {
    snowflake: { main: '还没有完成的任务~', sub: '完成一个任务，我就会在这里庆祝！' },
    small_ball: { main: '还没有完成的任务~', sub: '完成一个任务，我就会在这里庆祝！' },
    ball: { main: '还没有完成的任务~', sub: '完成一个任务，我就会在这里庆祝！' },
  },
  taskEmptyQuadrant: {
    snowflake: { main: '四象限里什么都没有~', sub: '给我安排点事情做吧，我闲得发慌！' },
    small_ball: { main: '四象限里什么都没有~', sub: '给我安排点事情做吧，我闲得发慌！' },
    ball: { main: '四象限里什么都没有~', sub: '给我安排点事情做吧，我闲得发慌！' },
  },
  sidebarBigTaskEmpty: {
    snowflake: { main: '我还没有长任务可以追~', sub: '设定一个目标，陪我一起成长吧！' },
    small_ball: { main: '我还没有长任务可以追~', sub: '设定一个目标，陪我一起成长吧！' },
    ball: { main: '我还没有长任务可以追~', sub: '设定一个目标，陪我一起成长吧！' },
  },
  sidebarTodoEmpty: {
    snowflake: { main: '今天没有待办呢~', sub: '要么休息一下，要么给我找点事做！' },
    small_ball: { main: '今天没有待办呢~', sub: '要么休息一下，要么给我找点事做！' },
    ball: { main: '今天没有待办呢~', sub: '要么休息一下，要么给我找点事做！' },
  },
  sidebarTodoAllDone: {
    snowflake: { main: '今天的任务都做完啦！', sub: '我好开心！你是最棒的~' },
    small_ball: { main: '今天的任务都做完啦！', sub: '我好开心！你是最棒的~' },
    ball: { main: '今天的任务都做完啦！', sub: '我好开心！你是最棒的~' },
  },
  recordEmpty: {
    snowflake: { main: '我还很小，需要你的记录来长大~', sub: '写下今天的小成功，让我变得更强吧！' },
    small_ball: { main: '我已经不小了，但还想继续长~', sub: '每一条记录都让我更圆更可爱！' },
    ball: { main: '我戴上围巾了，但成长不停~', sub: '继续记录，我会越来越厉害的！' },
  },
  recordLoading: {
    snowflake: { main: '正在把你的故事卷进来~', sub: '我马上就长大一点点 ✨' },
    small_ball: { main: '咕噜咕噜…我在努力吸收！', sub: '你的故事让我越来越圆~' },
    ball: { main: '滚啊滚，把你的记录卷进来！', sub: '等我一下，马上就好~ ⛄' },
  },
};

export function getStoryText(scene: StoryScene, stage: SnowballStage): StoryText {
  return SNOWBALL_STORY_TEXT[scene]?.[stage] || SNOWBALL_STORY_TEXT[scene]?.snowflake || { main: '', sub: '' };
}
