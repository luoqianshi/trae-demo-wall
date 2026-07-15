import { childAPI, scheduleAPI, deviceAPI, rfidAPI, rewardAPI, clockAPI } from '../api/client';

export async function generateMockData(): Promise<string> {
  const steps: string[] = [];

  try {
    // 1. 创建模拟孩子（3个）
    const children = [
      { name: '小明', age: 8, gender: 'male', school: '阳光小学', class: '三年级二班' },
      { name: '小红', age: 8, gender: 'female', school: '阳光小学', class: '三年级二班' },
      { name: '小刚', age: 5, gender: 'male', school: '蓝天幼儿园', class: '大班' },
    ];
    const childResults = await Promise.all(
      children.map(c => childAPI.create(c).then(r => r.data))
    );
    steps.push(`✅ 创建了 ${children.length} 个孩子: ${children.map(c => c.name).join(', ')}`);

    // 2. 创建模拟设备
    const deviceRes = await deviceAPI.create({
      name: '儿童房CoreS3', device_type: 'multi', model: 'M5CoreS3',
      has_rfid: true, is_active: true, location: '儿童房床头柜',
    });
    const device = deviceRes.data;
    steps.push(`✅ 创建设备: ${device.name}`);

    // 3. 创建RFID绑定
    await Promise.all(
      childResults.map((child: any, i: number) =>
        rfidAPI.create({ child_id: child.id, rfid_uid: `MOCK-UID-${i + 1}`, label: `模拟卡-${children[i].name}` })
      )
    );
    steps.push('✅ 创建了 3 个RFID绑定');

    // 4. 创建作息模板（工作日：周一至周五=1-5, 周末：周六日=6,0）
    const weekdayTemplates = [
      { day_of_week: 1, start_time: '07:00', end_time: '07:30', activity: '起床', is_required: true, sort_order: 1 },
      { day_of_week: 2, start_time: '07:00', end_time: '07:30', activity: '起床', is_required: true, sort_order: 1 },
      { day_of_week: 3, start_time: '07:00', end_time: '07:30', activity: '起床', is_required: true, sort_order: 1 },
      { day_of_week: 4, start_time: '07:00', end_time: '07:30', activity: '起床', is_required: true, sort_order: 1 },
      { day_of_week: 5, start_time: '07:00', end_time: '07:30', activity: '起床', is_required: true, sort_order: 1 },
      { day_of_week: 1, start_time: '07:30', end_time: '08:00', activity: '早餐', is_required: true, sort_order: 2 },
      { day_of_week: 2, start_time: '07:30', end_time: '08:00', activity: '早餐', is_required: true, sort_order: 2 },
      { day_of_week: 3, start_time: '07:30', end_time: '08:00', activity: '早餐', is_required: true, sort_order: 2 },
      { day_of_week: 4, start_time: '07:30', end_time: '08:00', activity: '早餐', is_required: true, sort_order: 2 },
      { day_of_week: 5, start_time: '07:30', end_time: '08:00', activity: '早餐', is_required: true, sort_order: 2 },
      { day_of_week: 1, start_time: '16:00', end_time: '17:00', activity: '放学回家', is_required: false, sort_order: 3 },
      { day_of_week: 2, start_time: '16:00', end_time: '17:00', activity: '放学回家', is_required: false, sort_order: 3 },
      { day_of_week: 3, start_time: '16:00', end_time: '17:00', activity: '放学回家', is_required: false, sort_order: 3 },
      { day_of_week: 4, start_time: '16:00', end_time: '17:00', activity: '放学回家', is_required: false, sort_order: 3 },
      { day_of_week: 5, start_time: '16:00', end_time: '17:00', activity: '放学回家', is_required: false, sort_order: 3 },
      { day_of_week: 1, start_time: '19:00', end_time: '20:00', activity: '做作业', is_required: true, sort_order: 4 },
      { day_of_week: 2, start_time: '19:00', end_time: '20:00', activity: '做作业', is_required: true, sort_order: 4 },
      { day_of_week: 3, start_time: '19:00', end_time: '20:00', activity: '做作业', is_required: true, sort_order: 4 },
      { day_of_week: 4, start_time: '19:00', end_time: '20:00', activity: '做作业', is_required: true, sort_order: 4 },
      { day_of_week: 5, start_time: '19:00', end_time: '20:00', activity: '做作业', is_required: true, sort_order: 4 },
      { day_of_week: 1, start_time: '21:00', end_time: '07:00', activity: '睡觉', is_required: true, sort_order: 5 },
      { day_of_week: 2, start_time: '21:00', end_time: '07:00', activity: '睡觉', is_required: true, sort_order: 5 },
      { day_of_week: 3, start_time: '21:00', end_time: '07:00', activity: '睡觉', is_required: true, sort_order: 5 },
      { day_of_week: 4, start_time: '21:00', end_time: '07:00', activity: '睡觉', is_required: true, sort_order: 5 },
      { day_of_week: 5, start_time: '21:00', end_time: '07:00', activity: '睡觉', is_required: true, sort_order: 5 },
    ];
    const weekendTemplates = [
      { day_of_week: 6, start_time: '08:00', end_time: '09:00', activity: '起床', is_required: true, sort_order: 1 },
      { day_of_week: 0, start_time: '08:00', end_time: '09:00', activity: '起床', is_required: true, sort_order: 1 },
      { day_of_week: 6, start_time: '09:30', end_time: '11:00', activity: '兴趣班', is_required: false, sort_order: 2 },
      { day_of_week: 0, start_time: '09:30', end_time: '11:00', activity: '兴趣班', is_required: false, sort_order: 2 },
    ];
    const allTemplates = [...weekdayTemplates, ...weekendTemplates];
    await Promise.all(allTemplates.map(t => scheduleAPI.createTemplate(t)));
    steps.push(`✅ 创建了 ${allTemplates.length} 个作息模板`);

    // 5. 生成未来一周作息
    for (const child of childResults) {
      for (let i = 0; i < 7; i++) {
        const d = new Date(); d.setDate(d.getDate() + i);
        await scheduleAPI.generate(child.id, d.toISOString().slice(0, 10));
      }
    }
    steps.push('✅ 生成了未来一周作息安排');

    // 6. 创建奖惩规则
    const rules = [
      { name: '按时起床', type: 'reward', amount: 1, description: '早上按时起床并完成打卡' },
      { name: '自己收拾玩具', type: 'reward', amount: 2, description: '主动收拾好玩具和书籍' },
      { name: '打人骂人', type: 'punishment', amount: 5, description: '对家人或同学使用暴力语言' },
      { name: '完成作业', type: 'reward', amount: 1, description: '主动完成学校作业' },
      { name: '按时睡觉', type: 'reward', amount: 1, description: '在规定时间内上床睡觉' },
    ];
    await Promise.all(rules.map(r => rewardAPI.createRule(r)));
    steps.push('✅ 创建了 5 条奖惩规则');

    // 7. 创建7天打卡记录
    const today = new Date();
    let clockCount = 0;
    for (let d = 6; d >= 0; d--) {
      const date = new Date(today);
      date.setDate(date.getDate() - d);
      const dateStr = date.toISOString().slice(0, 10);
      for (const child of childResults) {
        if (Math.random() < 0.7) {
          await clockAPI.clockIn({
            child_id: child.id, device_id: device.id,
            event_type: 'morning_routine',
            timestamp: `${dateStr}T07:0${Math.floor(Math.random() * 5 + 1)}:00Z`,
          });
          clockCount++;
        }
      }
    }
    steps.push(`✅ 创建了 ${clockCount} 条打卡记录`);

    return steps.join('\n');
  } catch (err: any) {
    return `❌ 生成失败: ${err.message}`;
  }
}