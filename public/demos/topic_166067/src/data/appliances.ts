export interface ApplianceStep {
  id: string;
  title: string;
  instruction: string;
  highlightButton?: string;
  voiceText: string;
}

export interface ApplianceTask {
  id: string;
  title: string;
  description: string;
  steps: ApplianceStep[];
}

export interface Appliance {
  id: string;
  name: string;
  icon: string;
  description: string;
  safetyTips: string[];
  tasks: ApplianceTask[];
}

export const appliances: Appliance[] = [
  {
    id: 'washing-machine',
    name: '滚筒洗衣机',
    icon: '🧺',
    description: '全自动滚筒洗衣机，操作简单方便',
    safetyTips: ['请确认洗衣机门已经关好', '请不要放入过多衣物', '洗衣过程中请勿打开机门'],
    tasks: [
      {
        id: 'wash-daily',
        title: '洗日常衣服',
        description: '清洗日常穿的衣物',
        steps: [
          { id: 'step-1', title: '放入衣服', instruction: '请打开洗衣机门，把衣服放进去，不要超过桶的一半。', highlightButton: '机门', voiceText: '第一步，请打开洗衣机门，把衣服放进去，不要超过桶的一半。' },
          { id: 'step-2', title: '倒入洗衣液', instruction: '请拉开左上角的洗涤盒，把洗衣液倒入主洗格。', highlightButton: '洗涤盒', voiceText: '第二步，请拉开左上角的洗涤盒，把洗衣液倒入主洗格。' },
          { id: 'step-3', title: '关好机门', instruction: '请把洗衣机门关紧，听到咔哒一声就可以了。', highlightButton: '机门', voiceText: '第三步，请把洗衣机门关紧，听到咔哒一声就可以了。' },
          { id: 'step-4', title: '打开电源', instruction: '请按一下电源键，屏幕亮起表示已经开机。', highlightButton: '电源键', voiceText: '第四步，请按一下电源键，屏幕亮起表示已经开机。' },
          { id: 'step-5', title: '选择标准洗', instruction: '请按模式键，选择标准洗或日常洗。', highlightButton: '模式键', voiceText: '第五步，请按模式键，选择标准洗或日常洗。' },
          { id: 'step-6', title: '开始洗衣', instruction: '请按启动键。屏幕开始倒计时，说明洗衣机已经开始工作。', highlightButton: '启动键', voiceText: '第六步，请按启动键。屏幕开始倒计时，说明洗衣机已经开始工作。' }
        ]
      },
      {
        id: 'wash-sheets',
        title: '洗被单',
        description: '清洗床单被套',
        steps: [
          { id: 'step-1', title: '放入被单', instruction: '请打开洗衣机门，把被单放进去，注意不要塞太满。', highlightButton: '机门', voiceText: '第一步，请打开洗衣机门，把被单放进去，注意不要塞太满。' },
          { id: 'step-2', title: '倒入洗衣液', instruction: '请拉开左上角的洗涤盒，倒入适量洗衣液。', highlightButton: '洗涤盒', voiceText: '第二步，请拉开左上角的洗涤盒，倒入适量洗衣液。' },
          { id: 'step-3', title: '关好机门', instruction: '请把洗衣机门关紧，听到咔哒一声。', highlightButton: '机门', voiceText: '第三步，请把洗衣机门关紧，听到咔哒一声。' },
          { id: 'step-4', title: '打开电源', instruction: '请按一下电源键，屏幕亮起表示已经开机。', highlightButton: '电源键', voiceText: '第四步，请按一下电源键，屏幕亮起表示已经开机。' },
          { id: 'step-5', title: '选择大件洗', instruction: '请按模式键，选择大件洗或家纺模式。', highlightButton: '模式键', voiceText: '第五步，请按模式键，选择大件洗或家纺模式。' },
          { id: 'step-6', title: '开始洗衣', instruction: '请按启动键。洗衣机开始工作，大约需要1小时。', highlightButton: '启动键', voiceText: '第六步，请按启动键。洗衣机开始工作，大约需要1小时。' }
        ]
      },
      {
        id: 'spin-only',
        title: '单独脱水',
        description: '只脱水不洗涤',
        steps: [
          { id: 'step-1', title: '放入衣物', instruction: '请打开洗衣机门，把需要脱水的衣物放进去。', highlightButton: '机门', voiceText: '第一步，请打开洗衣机门，把需要脱水的衣物放进去。' },
          { id: 'step-2', title: '关好机门', instruction: '请把洗衣机门关紧。', highlightButton: '机门', voiceText: '第二步，请把洗衣机门关紧。' },
          { id: 'step-3', title: '打开电源', instruction: '请按一下电源键。', highlightButton: '电源键', voiceText: '第三步，请按一下电源键。' },
          { id: 'step-4', title: '选择脱水', instruction: '请按模式键，选择脱水或单甩模式。', highlightButton: '模式键', voiceText: '第四步，请按模式键，选择脱水或单甩模式。' },
          { id: 'step-5', title: '开始脱水', instruction: '请按启动键。洗衣机开始高速旋转脱水。', highlightButton: '启动键', voiceText: '第五步，请按启动键。洗衣机开始高速旋转脱水。' }
        ]
      },
      {
        id: 'clean-machine',
        title: '清洁洗衣机',
        description: '清洗洗衣机内部',
        steps: [
          { id: 'step-1', title: '清空滚筒', instruction: '请确保洗衣机滚筒内没有任何衣物。', voiceText: '第一步，请确保洗衣机滚筒内没有任何衣物。' },
          { id: 'step-2', title: '倒入清洁剂', instruction: '请把洗衣机专用清洁剂倒入洗涤盒或直接放入滚筒。', highlightButton: '洗涤盒', voiceText: '第二步，请把洗衣机专用清洁剂倒入洗涤盒或直接放入滚筒。' },
          { id: 'step-3', title: '关好机门', instruction: '请把洗衣机门关紧。', highlightButton: '机门', voiceText: '第三步，请把洗衣机门关紧。' },
          { id: 'step-4', title: '打开电源', instruction: '请按一下电源键。', highlightButton: '电源键', voiceText: '第四步，请按一下电源键。' },
          { id: 'step-5', title: '选择自清洁', instruction: '请按模式键，选择自清洁或筒清洁模式。', highlightButton: '模式键', voiceText: '第五步，请按模式键，选择自清洁或筒清洁模式。' },
          { id: 'step-6', title: '开始清洁', instruction: '请按启动键。洗衣机开始自动清洁程序。', highlightButton: '启动键', voiceText: '第六步，请按启动键。洗衣机开始自动清洁程序。' }
        ]
      }
    ]
  },
  {
    id: 'air-conditioner',
    name: '空调',
    icon: '❄️',
    description: '壁挂式空调，制冷制热都可以',
    safetyTips: ['使用前请确保门窗关闭', '不要长时间直吹身体', '定期清洗过滤网'],
    tasks: [
      {
        id: 'cool-on',
        title: '打开制冷',
        description: '开启空调制冷模式',
        steps: [
          { id: 'step-1', title: '找到遥控器', instruction: '请拿起空调遥控器，对准空调。', voiceText: '第一步，请拿起空调遥控器，对准空调。' },
          { id: 'step-2', title: '打开电源', instruction: '请按一下遥控器上的电源键，空调屏幕亮起。', highlightButton: '电源键', voiceText: '第二步，请按一下遥控器上的电源键，空调屏幕亮起。' },
          { id: 'step-3', title: '选择模式', instruction: '请按模式键，直到屏幕显示雪花图标或制冷。', highlightButton: '模式键', voiceText: '第三步，请按模式键，直到屏幕显示雪花图标或制冷。' },
          { id: 'step-4', title: '设定温度', instruction: '请按温度减键，把温度调到26度左右。', highlightButton: '温度减键', voiceText: '第四步，请按温度减键，把温度调到26度左右。' },
          { id: 'step-5', title: '调整风速', instruction: '请按风速键，选择合适的风速，建议用中风。', highlightButton: '风速键', voiceText: '第五步，请按风速键，选择合适的风速，建议用中风。' },
          { id: 'step-6', title: '完成', instruction: '空调已经开始制冷，等待几分钟房间就凉快了。', voiceText: '第六步，空调已经开始制冷，等待几分钟房间就凉快了。' }
        ]
      },
      {
        id: 'temp-up',
        title: '调高温度',
        description: '把空调温度调高',
        steps: [
          { id: 'step-1', title: '拿起遥控器', instruction: '请拿起空调遥控器，对准空调。', voiceText: '第一步，请拿起空调遥控器，对准空调。' },
          { id: 'step-2', title: '按温度加键', instruction: '请按遥控器上的温度加键，每按一次温度升高1度。', highlightButton: '温度加键', voiceText: '第二步，请按遥控器上的温度加键，每按一次温度升高1度。' },
          { id: 'step-3', title: '完成', instruction: '温度已经调高，空调会按照新温度运行。', voiceText: '第三步，温度已经调高，空调会按照新温度运行。' }
        ]
      },
      {
        id: 'temp-down',
        title: '调低温度',
        description: '把空调温度调低',
        steps: [
          { id: 'step-1', title: '拿起遥控器', instruction: '请拿起空调遥控器，对准空调。', voiceText: '第一步，请拿起空调遥控器，对准空调。' },
          { id: 'step-2', title: '按温度减键', instruction: '请按遥控器上的温度减键，每按一次温度降低1度。', highlightButton: '温度减键', voiceText: '第二步，请按遥控器上的温度减键，每按一次温度降低1度。' },
          { id: 'step-3', title: '完成', instruction: '温度已经调低，房间会变得更凉快。', voiceText: '第三步，温度已经调低，房间会变得更凉快。' }
        ]
      },
      {
        id: 'turn-off',
        title: '关闭空调',
        description: '关闭空调',
        steps: [
          { id: 'step-1', title: '拿起遥控器', instruction: '请拿起空调遥控器，对准空调。', voiceText: '第一步，请拿起空调遥控器，对准空调。' },
          { id: 'step-2', title: '按电源键', instruction: '请按一下遥控器上的电源键，空调屏幕熄灭。', highlightButton: '电源键', voiceText: '第二步，请按一下遥控器上的电源键，空调屏幕熄灭。' },
          { id: 'step-3', title: '完成', instruction: '空调已经关闭，请记得拔掉插头省电。', voiceText: '第三步，空调已经关闭，请记得拔掉插头省电。' }
        ]
      }
    ]
  },
  {
    id: 'microwave',
    name: '微波炉',
    icon: '🥘',
    description: '家用微波炉，加热食物方便快捷',
    safetyTips: ['不要加热金属容器', '不要加热密封的罐头', '加热时间不要过长'],
    tasks: [
      {
        id: 'heat-rice',
        title: '热米饭',
        description: '加热剩米饭',
        steps: [
          { id: 'step-1', title: '放入米饭', instruction: '请把要加热的米饭放入微波炉专用碗中。', voiceText: '第一步，请把要加热的米饭放入微波炉专用碗中。' },
          { id: 'step-2', title: '加少量水', instruction: '请在米饭上撒少量水，这样加热后不会太干。', voiceText: '第二步，请在米饭上撒少量水，这样加热后不会太干。' },
          { id: 'step-3', title: '盖上盖子', instruction: '请盖上微波炉专用盖子或保鲜膜，记得留个小口透气。', voiceText: '第三步，请盖上微波炉专用盖子或保鲜膜，记得留个小口透气。' },
          { id: 'step-4', title: '放入微波炉', instruction: '请打开微波炉门，把碗放进去，关好门。', highlightButton: '机门', voiceText: '第四步，请打开微波炉门，把碗放进去，关好门。' },
          { id: 'step-5', title: '设定时间', instruction: '请按数字键，设定加热时间，一碗饭大约需要2分钟。', highlightButton: '数字键', voiceText: '第五步，请按数字键，设定加热时间，一碗饭大约需要2分钟。' },
          { id: 'step-6', title: '开始加热', instruction: '请按启动键，微波炉开始工作。', highlightButton: '启动键', voiceText: '第六步，请按启动键，微波炉开始工作。' },
          { id: 'step-7', title: '取出食物', instruction: '听到叮的一声后，请打开微波炉门，小心烫手。', highlightButton: '机门', voiceText: '第七步，听到叮的一声后，请打开微波炉门，小心烫手。' }
        ]
      },
      {
        id: 'heat-soup',
        title: '热汤',
        description: '加热汤类食物',
        steps: [
          { id: 'step-1', title: '放入汤碗', instruction: '请把要加热的汤倒入微波炉专用碗中。', voiceText: '第一步，请把要加热的汤倒入微波炉专用碗中。' },
          { id: 'step-2', title: '盖上盖子', instruction: '请盖上微波炉专用盖子或保鲜膜，留个小口透气。', voiceText: '第二步，请盖上微波炉专用盖子或保鲜膜，留个小口透气。' },
          { id: 'step-3', title: '放入微波炉', instruction: '请打开微波炉门，把碗放进去，关好门。', highlightButton: '机门', voiceText: '第三步，请打开微波炉门，把碗放进去，关好门。' },
          { id: 'step-4', title: '设定时间', instruction: '请按数字键，一碗汤大约需要3分钟。', highlightButton: '数字键', voiceText: '第四步，请按数字键，一碗汤大约需要3分钟。' },
          { id: 'step-5', title: '开始加热', instruction: '请按启动键，微波炉开始工作。', highlightButton: '启动键', voiceText: '第五步，请按启动键，微波炉开始工作。' },
          { id: 'step-6', title: '取出搅拌', instruction: '听到叮声后取出，搅拌一下再加热1分钟会更均匀。', voiceText: '第六步，听到叮声后取出，搅拌一下再加热1分钟会更均匀。' }
        ]
      },
      {
        id: 'defrost',
        title: '解冻食物',
        description: '解冻冷冻食品',
        steps: [
          { id: 'step-1', title: '选择解冻', instruction: '请按微波炉上的解冻键或选择解冻模式。', highlightButton: '解冻键', voiceText: '第一步，请按微波炉上的解冻键或选择解冻模式。' },
          { id: 'step-2', title: '设定重量', instruction: '请按数字键输入食物重量，单位是克。', highlightButton: '数字键', voiceText: '第二步，请按数字键输入食物重量，单位是克。' },
          { id: 'step-3', title: '放入食物', instruction: '请把冷冻食物放入微波炉专用容器，关好机门。', highlightButton: '机门', voiceText: '第三步，请把冷冻食物放入微波炉专用容器，关好机门。' },
          { id: 'step-4', title: '开始解冻', instruction: '请按启动键，微波炉开始解冻。', highlightButton: '启动键', voiceText: '第四步，请按启动键，微波炉开始解冻。' },
          { id: 'step-5', title: '完成', instruction: '解冻完成后，食物已经变软，可以开始烹饪了。', voiceText: '第五步，解冻完成后，食物已经变软，可以开始烹饪了。' }
        ]
      },
      {
        id: 'safety',
        title: '安全注意事项',
        description: '微波炉使用安全指南',
        steps: [
          { id: 'step-1', title: '不要加热金属', instruction: '金属容器、锡纸、金属餐具都不能放入微波炉。', voiceText: '第一条，金属容器、锡纸、金属餐具都不能放入微波炉。' },
          { id: 'step-2', title: '不要加热密封罐头', instruction: '密封的罐头和带壳的鸡蛋不能加热，会爆炸。', voiceText: '第二条，密封的罐头和带壳的鸡蛋不能加热，会爆炸。' },
          { id: 'step-3', title: '加热时间不要太长', instruction: '少量食物加热时间不要超过3分钟，防止起火。', voiceText: '第三条，少量食物加热时间不要超过3分钟，防止起火。' },
          { id: 'step-4', title: '小心烫手', instruction: '加热后的食物和容器会很烫，请用隔热手套取出。', voiceText: '第四条，加热后的食物和容器会很烫，请用隔热手套取出。' },
          { id: 'step-5', title: '保持通风', instruction: '加热时请保持微波炉周围通风，不要堵住散热口。', voiceText: '第五条，加热时请保持微波炉周围通风，不要堵住散热口。' }
        ]
      }
    ]
  }
];

export const getApplianceById = (id: string): Appliance | undefined => {
  return appliances.find(a => a.id === id);
};

export const getTaskById = (applianceId: string, taskId: string): ApplianceTask | undefined => {
  const appliance = getApplianceById(applianceId);
  return appliance?.tasks.find(t => t.id === taskId);
};
