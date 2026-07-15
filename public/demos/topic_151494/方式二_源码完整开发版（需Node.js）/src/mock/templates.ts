import type { CreationTemplate } from '@/types'

export const creationTemplates: CreationTemplate[] = [
  {
    id: 'tpl_square_dance',
    category: 'square-dance',
    name: '广场舞合集',
    emoji: '💃',
    coverPreview: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20elderly%20square%20dance%20performance%20colorful%20happy%20group%20park&image_size=portrait_4_3',
    bgGradient: 'from-pink-400 via-rose-400 to-orange-400',
    bgmOptions: [
      { name: '最炫民族风', url: '' },
      { name: '套马杆', url: '' },
      { name: '小苹果', url: '' },
      { name: '映山红', url: '' }
    ],
    titleSamples: [
      '最美夕阳红，《映山红》广场舞跳起来',
      '大妈舞团精彩演绎《最炫民族风》，活力满满'
    ],
    hashtagSamples: ['#广场舞', '#老年人生活', '#运动健身', '#快乐晚年', '#经典老歌', '#姐妹团']
  },
  {
    id: 'tpl_countryside',
    category: 'countryside',
    name: '田园日常',
    emoji: '🌾',
    coverPreview: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20rural%20countryside%20farm%20peaceful%20warm%20sunset%20village%20harvest&image_size=portrait_4_3',
    bgGradient: 'from-emerald-400 via-lime-400 to-yellow-300',
    bgmOptions: [
      { name: '在希望的田野上', url: '' },
      { name: '乡间小路', url: '' },
      { name: '外婆的澎湖湾', url: '' },
      { name: '走在乡间的小路上', url: '' }
    ],
    titleSamples: [
      '乡下菜园大丰收，这才是真正的田园生活',
      '老家的院子，种满了瓜果和回忆'
    ],
    hashtagSamples: ['#田园生活', '#农村日常', '#我的老家', '#丰收的喜悦', '#菜园日记', '#乡愁']
  },
  {
    id: 'tpl_cooking',
    category: 'cooking',
    name: '家常菜',
    emoji: '🍲',
    coverPreview: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20elderly%20grandmother%20cooking%20kitchen%20homemade%20delicious%20warm%20family&image_size=portrait_4_3',
    bgGradient: 'from-amber-400 via-orange-400 to-red-400',
    bgmOptions: [
      { name: '人间烟火', url: '' },
      { name: '甜蜜蜜', url: '' },
      { name: '前门情思大碗茶', url: '' },
      { name: '难忘今宵', url: '' }
    ],
    titleSamples: [
      '老妈拿手红烧肉，肥而不腻入口即化',
      '地道北方手擀面，配上卤子太香了'
    ],
    hashtagSamples: ['#家常菜', '#厨房日记', '#美食分享', '#今天吃什么', '#妈妈的味道', '#老年人美食']
  },
  {
    id: 'tpl_family',
    category: 'family',
    name: '家庭纪实',
    emoji: '👨‍👩‍👧',
    coverPreview: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20happy%20family%20grandparents%20grandchildren%20reunion%20together%20love%20warm&image_size=portrait_4_3',
    bgGradient: 'from-sky-400 via-indigo-400 to-purple-400',
    bgmOptions: [
      { name: '常回家看看', url: '' },
      { name: '时间都去哪儿了', url: '' },
      { name: '当你老了', url: '' },
      { name: '相亲相爱一家人', url: '' }
    ],
    titleSamples: [
      '全家福来了，一家人整整齐齐最重要',
      '孙子孙女回家，爷爷奶奶笑得合不拢嘴'
    ],
    hashtagSamples: ['#家庭日常', '#一家老小', '#祖孙乐', '#幸福时光', '#难忘的回忆', '#我爱我家']
  }
]
