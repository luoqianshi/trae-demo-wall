import type { LightExercise } from '@/types'

export const lightExercises: LightExercise[] = [
  {
    id: 'ex_neck',
    name: '颈部放松操',
    description: '缓解颈椎酸痛，预防颈椎病',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=elderly%20chinese%20neck%20stretching%20exercise%20relaxation%20warm%20indoor&image_size=landscape_4_3',
    emoji: '🧘',
    duration: '3 分钟',
    steps: [
      '坐直身体，两手放在膝盖上',
      '慢慢低头，下巴贴胸口，保持 5 秒',
      '慢慢抬头，眼睛看天花板，保持 5 秒',
      '头向左歪，左耳靠左肩，保持 5 秒',
      '头向右歪，右耳靠右肩，保持 5 秒',
      '以上动作重复 5 遍，全程动作要慢'
    ]
  },
  {
    id: 'ex_eye',
    name: '远眺护眼操',
    description: '缓解眼疲劳，保护视力',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=elderly%20person%20looking%20out%20window%20green%20plants%20eye%20relax%20peaceful&image_size=landscape_4_3',
    emoji: '👀',
    duration: '2 分钟',
    steps: [
      '放下手机，站起来',
      '走到窗边或户外',
      '闭眼深呼吸 3 次',
      '睁眼看向 5 米以外的绿色植物',
      '保持 20 秒，放松眼球',
      '再闭眼 10 秒，重复 3 遍'
    ]
  },
  {
    id: 'ex_shoulder',
    name: '肩部拍打操',
    description: '疏通肩部经络，缓解肩周炎',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=elderly%20chinese%20shoulder%20exercise%20stretching%20home%20fitness%20warm&image_size=landscape_4_3',
    emoji: '💪',
    duration: '4 分钟',
    steps: [
      '双脚与肩同宽站立',
      '右手空心掌，拍打左肩 30 下',
      '左手空心掌，拍打右肩 30 下',
      '双手交替拍打对侧肩膀，各 50 下',
      '动作可以稍用力，以肩膀微微发热为好',
      '最后双手画圆转动肩膀各 10 圈'
    ]
  },
  {
    id: 'ex_waist',
    name: '腰部扭转操',
    description: '活动腰部，强肾健体',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=elderly%20chinese%20waist%20twist%20exercise%20indoor%20fitness%20healthy&image_size=landscape_4_3',
    emoji: '🌿',
    duration: '3 分钟',
    steps: [
      '双脚站稳，两手叉腰',
      '腰部向左转，保持 3 秒',
      '腰部向右转，保持 3 秒',
      '再顺时针转腰 10 圈',
      '逆时针转腰 10 圈',
      '动作轻缓，幅度由小到大'
    ]
  },
  {
    id: 'ex_knee',
    name: '膝关节保养操',
    description: '保护膝关节，远离老寒腿',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=elderly%20chinese%20knee%20exercise%20massage%20health%20care%20home&image_size=landscape_4_3',
    emoji: '🦵',
    duration: '5 分钟',
    steps: [
      '双手掌心搓热',
      '两手敷在膝盖上，打圈揉按 30 圈',
      '点按膝盖两侧的膝眼，各 1 分钟',
      '手扶椅背，单腿抬起画圆，左右各 10 圈',
      '最后双脚踮脚尖-下蹲 10 次',
      '如膝盖有疼痛，立即停止'
    ]
  },
  {
    id: 'ex_breath',
    name: '腹式深呼吸',
    description: '增加肺活量，宁心安神',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=elderly%20person%20meditation%20breathing%20exercise%20peaceful%20sunset%20calm&image_size=landscape_4_3',
    emoji: '🌬️',
    duration: '3 分钟',
    steps: [
      '找一个舒服的姿势坐下或躺下',
      '一手放胸口，一手放腹部',
      '用鼻子慢慢吸气，心里默数 1~4',
      '感受腹部慢慢鼓起来，胸部不动',
      '用嘴巴慢慢呼气，默数 1~6',
      '感受腹部收回去，重复 10 次'
    ]
  }
]
