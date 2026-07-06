export const COURSES_DATA = {
  en: {
    code: 'en',
    name: '英语 / English',
    flag: '🇬🇧',
    description: '全球通用语言，从基础到流利的系统化学习路径。',
    color: '#1e40af',
    levels: [
      {
        id: 'en-1',
        name: 'A1 入门级',
        description: '日常问候与基本交流',
        lessons: [
          {
            id: 'en-l1',
            title: '问候与介绍',
            type: 'vocabulary',
            words: [
              { word: 'Hello', phonetic: '/həˈloʊ/', meaning: '你好', example: 'Hello, my name is Tom.' },
              { word: 'Goodbye', phonetic: '/ɡʊdˈbaɪ/', meaning: '再见', example: 'Goodbye, see you tomorrow.' },
              { word: 'Thank you', phonetic: '/θæŋk juː/', meaning: '谢谢', example: 'Thank you for your help.' },
              { word: 'Please', phonetic: '/pliːz/', meaning: '请', example: 'Please pass the salt.' },
              { word: 'Sorry', phonetic: '/ˈsɒri/', meaning: '对不起', example: 'I am sorry for being late.' },
            ],
            grammar: {
              title: 'be 动词的基本用法',
              content: 'be 动词有三种基本形式：am (I), is (he/she/it), are (you/we/they)。',
              examples: ['I am a student.', 'She is my teacher.', 'We are friends.'],
              quiz: [
                { question: 'He ___ my brother.', options: ['am', 'is', 'are'], answer: 'is' },
                { question: 'They ___ students.', options: ['am', 'is', 'are'], answer: 'are' },
                { question: 'I ___ Chinese.', options: ['am', 'is', 'are'], answer: 'am' },
              ],
            },
            listening: [
              { text: 'Hello, my name is Alice.', translation: '你好，我叫爱丽丝。' },
              { text: 'Nice to meet you.', translation: '很高兴见到你。' },
              { text: 'Goodbye and thank you.', translation: '再见，谢谢你。' },
            ],
            speaking: [
              { text: 'Hello, my name is...', hint: '介绍自己的名字' },
              { text: 'Nice to meet you.', hint: '表达见面的喜悦' },
            ],
          },
          {
            id: 'en-l2',
            title: '数字与时间',
            type: 'vocabulary',
            words: [
              { word: 'One', phonetic: '/wʌn/', meaning: '一', example: 'I have one apple.' },
              { word: 'Two', phonetic: '/tuː/', meaning: '二', example: 'Two cats are sleeping.' },
              { word: 'Three', phonetic: '/θriː/', meaning: '三', example: 'Please give me three books.' },
              { word: 'Morning', phonetic: '/ˈmɔːrnɪŋ/', meaning: '早晨', example: 'Good morning!' },
              { word: 'Afternoon', phonetic: '/ˌɑːftərˈnuːn/', meaning: '下午', example: 'Good afternoon.' },
            ],
            grammar: {
              title: '疑问词 what / when / where',
              content: 'what 询问内容，when 询问时间，where 询问地点。',
              examples: ['What is your name?', 'When do you wake up?', 'Where do you live?'],
              quiz: [
                { question: '___ is your name?', options: ['What', 'When', 'Where'], answer: 'What' },
                { question: '___ do you go to school?', options: ['What', 'When', 'Where'], answer: 'When' },
                { question: '___ is the library?', options: ['What', 'When', 'Where'], answer: 'Where' },
              ],
            },
            listening: [
              { text: 'I wake up at seven in the morning.', translation: '我早上七点起床。' },
              { text: 'The meeting is at three in the afternoon.', translation: '会议在下午三点。' },
            ],
            speaking: [
              { text: 'I wake up at seven o\'clock.', hint: '描述起床时间' },
            ],
          },
        ],
      },
      {
        id: 'en-2',
        name: 'A2 初级',
        description: '日常生活与简单对话',
        lessons: [
          {
            id: 'en-l3',
            title: '日常活动',
            type: 'vocabulary',
            words: [
              { word: 'Breakfast', phonetic: '/ˈbrekfəst/', meaning: '早餐', example: 'I have breakfast at 7am.' },
              { word: 'Work', phonetic: '/wɜːrk/', meaning: '工作', example: 'I work in an office.' },
              { word: 'Study', phonetic: '/ˈstʌdi/', meaning: '学习', example: 'I study English every day.' },
              { word: 'Exercise', phonetic: '/ˈeksərsaɪz/', meaning: '锻炼', example: 'I exercise every morning.' },
              { word: 'Dinner', phonetic: '/ˈdɪnər/', meaning: '晚餐', example: 'We have dinner at 7pm.' },
            ],
            grammar: {
              title: '一般现在时',
              content: '一般现在时表达习惯性动作。第三人称单数动词加 -s 或 -es。',
              examples: ['I drink coffee every morning.', 'She works in a hospital.', 'He watches TV every night.'],
              quiz: [
                { question: 'She ___ to school every day.', options: ['go', 'goes', 'going'], answer: 'goes' },
                { question: 'I ___ English every morning.', options: ['study', 'studies', 'studying'], answer: 'study' },
                { question: 'He ___ football on weekends.', options: ['play', 'plays', 'playing'], answer: 'plays' },
              ],
            },
            listening: [
              { text: 'I have breakfast at seven o\'clock every day.', translation: '我每天七点吃早餐。' },
              { text: 'She studies English in the evening.', translation: '她晚上学习英语。' },
            ],
            speaking: [
              { text: 'I study English every day.', hint: '表达每日学习习惯' },
              { text: 'I have breakfast at seven o\'clock.', hint: '描述早晨习惯' },
            ],
          },
        ],
      },
      {
        id: 'en-3',
        name: 'B1 中级',
        description: '流利表达与复杂话题',
        lessons: [
          {
            id: 'en-l4',
            title: '旅行与文化',
            type: 'vocabulary',
            words: [
              { word: 'Airport', phonetic: '/ˈɛərpɔːrt/', meaning: '机场', example: 'I will meet you at the airport.' },
              { word: 'Passport', phonetic: '/ˈpæspɔːrt/', meaning: '护照', example: 'Don\'t forget your passport!' },
              { word: 'Adventure', phonetic: '/ədˈvɛntʃər/', meaning: '冒险', example: 'Traveling is an adventure.' },
              { word: 'Culture', phonetic: '/ˈkʌltʃər/', meaning: '文化', example: 'I love learning about different cultures.' },
              { word: 'Language', phonetic: '/ˈlæŋɡwɪdʒ/', meaning: '语言', example: 'Language is a bridge between cultures.' },
            ],
            grammar: {
              title: '现在完成时',
              content: 'have/has + 过去分词，表示过去发生对现在有影响的动作。',
              examples: ['I have visited Paris three times.', 'She has never been to Japan.', 'Have you seen this movie?'],
              quiz: [
                { question: 'I ___ visited Paris three times.', options: ['have', 'has', 'had'], answer: 'have' },
                { question: 'She ___ never been to Japan.', options: ['have', 'has', 'had'], answer: 'has' },
                { question: '___ you seen this movie?', options: ['Have', 'Has', 'Had'], answer: 'Have' },
              ],
            },
            listening: [
              { text: 'I have always wanted to travel around the world.', translation: '我一直想环游世界。' },
              { text: 'Learning about different cultures is very interesting.', translation: '了解不同文化非常有趣。' },
            ],
            speaking: [
              { text: 'I have visited many beautiful places.', hint: '分享旅行经历' },
              { text: 'I love learning about different cultures.', hint: '表达对文化的热爱' },
            ],
          },
        ],
      },
    ],
  },
  ja: {
    code: 'ja',
    name: '日语 / 日本語',
    flag: '🇯🇵',
    description: '从五十音图起步，感受日本文化的语言魅力。',
    color: '#c2185b',
    levels: [
      {
        id: 'ja-1',
        name: 'N5 入门',
        description: '五十音图与基础表达',
        lessons: [
          {
            id: 'ja-l1',
            title: 'あ行 五十音',
            type: 'vocabulary',
            words: [
              { word: 'あ', phonetic: 'a', meaning: '啊（语气词）', example: 'あ、そうだ。' },
              { word: 'い', phonetic: 'i', meaning: '好的（方言）', example: 'いいですね。' },
              { word: 'う', phonetic: 'u', meaning: 'う（语气词）', example: 'う、分かった。' },
              { word: 'え', phonetic: 'e', meaning: '诶（惊讶）', example: 'え、本当？' },
              { word: 'お', phonetic: 'o', meaning: '御（敬语）', example: 'おはよう。' },
              { word: 'こんにちは', phonetic: 'kon-ni-chi-wa', meaning: '你好', example: 'こんにちは、田中さん。' },
              { word: 'ありがとう', phonetic: 'a-ri-ga-tou', meaning: '谢谢', example: 'どうもありがとう。' },
            ],
            grammar: {
              title: 'です / ます 礼貌体',
              content: 'です接在名词和形容词后，ます接在动词后，构成礼貌的表达形式。',
              examples: ['私は学生です。', 'これは本です。', '毎日勉強します。'],
              quiz: [
                { question: '私は学生___。', options: ['です', 'ます', 'だ'], answer: 'です' },
                { question: '毎日日本語を勉強___。', options: ['です', 'します', 'ました'], answer: 'します' },
                { question: 'これ___ペンです。', options: ['は', 'が', 'を'], answer: 'は' },
              ],
            },
            listening: [
              { text: 'こんにちは、はじめまして。', translation: '你好，初次见面。' },
              { text: 'どうぞよろしくお願いします。', translation: '请多关照。' },
            ],
            speaking: [
              { text: 'こんにちは、はじめまして。', hint: '初次见面的问候' },
              { text: 'どうぞよろしくお願いします。', hint: '请多关照' },
            ],
          },
        ],
      },
      {
        id: 'ja-2',
        name: 'N4 初级',
        description: '简单对话与日常场景',
        lessons: [
          {
            id: 'ja-l2',
            title: '日常问候',
            type: 'vocabulary',
            words: [
              { word: 'おはよう', phonetic: 'o-ha-yo-u', meaning: '早上好', example: 'おはよう、今日もいい天気だね。' },
              { word: 'こんばんは', phonetic: 'kon-ban-wa', meaning: '晚上好', example: 'こんばんは、お元気ですか。' },
              { word: 'さようなら', phonetic: 'sa-yo-u-na-ra', meaning: '再见', example: 'では、さようなら。' },
              { word: 'すみません', phonetic: 'su-mi-ma-sen', meaning: '对不起/不好意思', example: 'すみません、遅れました。' },
              { word: 'はじめまして', phonetic: 'ha-ji-me-ma-shi-te', meaning: '初次见面', example: 'はじめまして、田中です。' },
            ],
            grammar: {
              title: '助词 は / が / を',
              content: 'は提示主题，が强调主语，を提示动作对象。',
              examples: ['私は学生です。', '雨が降ります。', 'ご飯を食べます。'],
              quiz: [
                { question: '私___学生です。', options: ['は', 'が', 'を'], answer: 'は' },
                { question: 'りんご___食べます。', options: ['は', 'が', 'を'], answer: 'を' },
                { question: '犬___います。', options: ['は', 'が', 'を'], answer: 'が' },
              ],
            },
            listening: [
              { text: 'おはようございます。今日はいい天気ですね。', translation: '早上好。今天天气真好啊。' },
              { text: 'すみません、これはいくらですか。', translation: '请问，这个多少钱？' },
            ],
            speaking: [
              { text: 'おはようございます。', hint: '正式的早上好' },
              { text: 'ありがとうございます。', hint: '非常感谢' },
            ],
          },
        ],
      },
      {
        id: 'ja-3',
        name: 'N3 中级',
        description: '较复杂的表达与文化理解',
        lessons: [
          {
            id: 'ja-l3',
            title: '描述过去的事情',
            type: 'vocabulary',
            words: [
              { word: '昨日', phonetic: 'ki-no-u', meaning: '昨天', example: '昨日、映画を見ました。' },
              { word: '先週', phonetic: 'sen-shuu', meaning: '上周', example: '先週、東京へ行きました。' },
              { word: '楽しい', phonetic: 'ta-no-shii', meaning: '快乐的', example: 'とても楽しい一日でした。' },
              { word: '疲れる', phonetic: 'tsu-ka-re-ru', meaning: '疲倦', example: '仕事で疲れました。' },
              { word: '旅行', phonetic: 'ryo-kou', meaning: '旅行', example: '日本旅行に行きました。' },
            ],
            grammar: {
              title: '过去式 ました / でした',
              content: '动词过去式用ました，名词/形容词过去式用でした。',
              examples: ['昨日、映画を見ました。', 'とても楽しかったです。', '学生でした。'],
              quiz: [
                { question: '昨日、映画を___。', options: ['見ます', '見ました', '見て'], answer: '見ました' },
                { question: 'とても___です。', options: ['楽しい', '楽しかった', '楽しく'], answer: '楽しかった' },
                { question: '私は学生___。', options: ['です', 'でした', 'だ'], answer: 'でした' },
              ],
            },
            listening: [
              { text: '先週、友達と一緒に映画を見ました。', translation: '上周和朋友一起看了电影。' },
              { text: 'とても楽しい旅行でした。', translation: '是一次非常愉快的旅行。' },
            ],
            speaking: [
              { text: '昨日、日本語を勉強しました。', hint: '描述昨天的学习' },
              { text: 'とても楽しかったです。', hint: '表达愉快的感受' },
            ],
          },
        ],
      },
    ],
  },
  ko: {
    code: 'ko',
    name: '韩语 / 한국어',
    flag: '🇰🇷',
    description: '从韩文字母开始，领略 K-culture 的语言之美。',
    color: '#00695c',
    levels: [
      {
        id: 'ko-1',
        name: '初级',
        description: '韩文字母与基础问候',
        lessons: [
          {
            id: 'ko-l1',
            title: '基础问候',
            type: 'vocabulary',
            words: [
              { word: '안녕하세요', phonetic: 'an-nyeong-ha-se-yo', meaning: '你好', example: '안녕하세요, 저는 학생입니다.' },
              { word: '감사합니다', phonetic: 'gam-sa-ham-ni-da', meaning: '谢谢', example: '도와주셔서 감사합니다.' },
              { word: '안녕히 가세요', phonetic: 'an-nyeong-hi ga-se-yo', meaning: '再见（客人走时）', example: '안녕히 가세요, 내일 봐요.' },
              { word: '미안합니다', phonetic: 'mi-an-ham-ni-da', meaning: '对不起', example: '늦어서 미안합니다.' },
              { word: '만나서 반갑습니다', phonetic: 'man-na-seo ban-gap-seum-ni-da', meaning: '很高兴见到你', example: '만나서 반갑습니다, 친구예요.' },
            ],
            grammar: {
              title: '입니다 / 에요 敬语结尾',
              content: '입니다是正式的名词结尾，에요是较为口语的结尾。',
              examples: ['저는 학생입니다.', '이것은 책이에요.', '친구예요.'],
              quiz: [
                { question: '저는 학생___.', options: ['입니다', '있어요', '했어요'], answer: '입니다' },
                { question: '이것은 책___.', options: ['입니다', '이에요', '이었어요'], answer: '이에요' },
                { question: '오늘은 월요일___.', options: ['입니다', '있어요', '했어요'], answer: '입니다' },
              ],
            },
            listening: [
              { text: '안녕하세요, 만나서 반갑습니다.', translation: '你好，很高兴见到你。' },
              { text: '감사합니다, 안녕히 가세요.', translation: '谢谢，再见。' },
            ],
            speaking: [
              { text: '안녕하세요, 만나서 반갑습니다.', hint: '问候语' },
              { text: '감사합니다.', hint: '感谢' },
            ],
          },
        ],
      },
      {
        id: 'ko-2',
        name: '中级',
        description: '日常对话与表达',
        lessons: [
          {
            id: 'ko-l2',
            title: '日常活动',
            type: 'vocabulary',
            words: [
              { word: '아침', phonetic: 'a-chim', meaning: '早晨/早餐', example: '아침을 먹어요.' },
              { word: '공부', phonetic: 'gong-bu', meaning: '学习', example: '한국어를 공부해요.' },
              { word: '일', phonetic: 'il', meaning: '工作/事情', example: '회사에 일해요.' },
              { word: '친구', phonetic: 'chin-gu', meaning: '朋友', example: '친구를 만나요.' },
              { word: '영화', phonetic: 'yeong-hwa', meaning: '电影', example: '영화를 봐요.' },
            ],
            grammar: {
              title: '아요 / 어요 现在时',
              content: '动词/形容词词干+아요或어요，构成口语化的现在时。',
              examples: ['한국어를 공부해요.', '친구를 만나요.', '맛있어요.'],
              quiz: [
                { question: '한국어를___.', options: ['공부해요', '공부했다', '공부할'], answer: '공부해요' },
                { question: '친구를___.', options: ['만나요', '만났어요', '만날'], answer: '만나요' },
                { question: '이 음식은 정말___.', options: ['맛있어요', '맛있었다', '맛있을'], answer: '맛있어요' },
              ],
            },
            listening: [
              { text: '매일 아침에 한국어를 공부해요.', translation: '每天早晨学习韩语。' },
              { text: '주말에 친구를 만나요.', translation: '周末见朋友。' },
            ],
            speaking: [
              { text: '저는 한국어를 공부해요.', hint: '描述学习韩语' },
              { text: '주말에 친구를 만나요.', hint: '描述周末安排' },
            ],
          },
        ],
      },
      {
        id: 'ko-3',
        name: '高级',
        description: '流利表达与文化理解',
        lessons: [
          {
            id: 'ko-l3',
            title: '表达想法与感受',
            type: 'vocabulary',
            words: [
              { word: '생각', phonetic: 'saeng-gak', meaning: '想法', example: '좋은 생각이에요.' },
              { word: '기분', phonetic: 'gi-bun', meaning: '心情', example: '기분이 좋아요.' },
              { word: '희망', phonetic: 'hui-mang', meaning: '希望', example: '희망을 갖고 있어요.' },
              { word: '여행', phonetic: 'yeo-haeng', meaning: '旅行', example: '한국 여행을 갔어요.' },
              { word: '문화', phonetic: 'mun-hwa', meaning: '文化', example: '한국 문화를 배워요.' },
            ],
            grammar: {
              title: '过去式与将来时',
              content: '过去式用었어요/았어요，将来式用(으)ㄹ 거예요。',
              examples: ['어제 친구를 만났어요.', '내일 한국에 갈 거예요.', '재미있었어요.'],
              quiz: [
                { question: '어제 한국어를___.', options: ['공부했어요', '공부해요', '공부할'], answer: '공부했어요' },
                { question: '내일 영화를___.', options: ['봤어요', '볼 거예요', '봐요'], answer: '볼 거예요' },
                { question: '정말 재미___.', options: ['있어요', '있었어요', '있을'], answer: '있었어요' },
              ],
            },
            listening: [
              { text: '작년에 한국 여행을 갔어요.', translation: '去年去韩国旅行了。' },
              { text: '한국 문화는 정말 흥미로워요.', translation: '韩国文化非常有趣。' },
            ],
            speaking: [
              { text: '작년에 한국에 갔어요.', hint: '描述去年的旅行' },
              { text: '한국 문화를 배우고 싶어요.', hint: '表达学习文化的愿望' },
            ],
          },
        ],
      },
    ],
  },
  de: {
    code: 'de',
    name: '德语 / Deutsch',
    flag: '🇩🇪',
    description: '严谨优美的语言，开启欧洲文化之旅。',
    color: '#5d4037',
    levels: [
      {
        id: 'de-1',
        name: 'A1 入门',
        description: '基础表达与简单对话',
        lessons: [
          {
            id: 'de-l1',
            title: '问候与自我介绍',
            type: 'vocabulary',
            words: [
              { word: 'Hallo', phonetic: '/ˈhalo/', meaning: '你好', example: 'Hallo, ich bin Tom.' },
              { word: 'Guten Tag', phonetic: '/ˈguːtn taːk/', meaning: '日安/你好', example: 'Guten Tag, Herr Schmidt.' },
              { word: 'Danke', phonetic: '/ˈdaŋkə/', meaning: '谢谢', example: 'Danke schön!' },
              { word: 'Bitte', phonetic: '/ˈbɪtə/', meaning: '请/不客气', example: 'Bitte sehr.' },
              { word: 'Auf Wiedersehen', phonetic: '/aʊf ˈviːdərzeːən/', meaning: '再见', example: 'Auf Wiedersehen, bis morgen!' },
              { word: 'Ich heiße', phonetic: '/ɪç ˈhaɪsə/', meaning: '我叫', example: 'Ich heiße Anna.' },
            ],
            grammar: {
              title: 'sein 动词',
              content: 'sein（是）的变位：ich bin, du bist, er/sie/es ist, wir sind, ihr seid, sie sind。',
              examples: ['Ich bin Student.', 'Er ist Lehrer.', 'Wir sind Freunde.'],
              quiz: [
                { question: 'Ich ___ Student.', options: ['bin', 'ist', 'sind'], answer: 'bin' },
                { question: 'Er ___ Lehrer.', options: ['bin', 'ist', 'sind'], answer: 'ist' },
                { question: 'Wir ___ Freunde.', options: ['bin', 'ist', 'sind'], answer: 'sind' },
              ],
            },
            listening: [
              { text: 'Hallo, ich bin Anna. Ich komme aus China.', translation: '你好，我叫安娜。我来自中国。' },
              { text: 'Guten Tag, Herr Schmidt. Wie geht es Ihnen?', translation: '您好，施密特先生。您最近怎样？' },
            ],
            speaking: [
              { text: 'Hallo, ich bin Anna.', hint: '自我介绍' },
              { text: 'Ich komme aus China.', hint: '说明来自哪里' },
            ],
          },
        ],
      },
      {
        id: 'de-2',
        name: 'A2 初级',
        description: '日常生活与工作表达',
        lessons: [
          {
            id: 'de-l2',
            title: '日常生活',
            type: 'vocabulary',
            words: [
              { word: 'Frühstück', phonetic: '/ˈfryːʃtʏk/', meaning: '早餐', example: 'Ich esse Frühstück um 7 Uhr.' },
              { word: 'Arbeit', phonetic: '/ˈaʁbaɪt/', meaning: '工作', example: 'Ich gehe zur Arbeit.' },
              { word: 'Lernen', phonetic: '/ˈlɛʁnən/', meaning: '学习', example: 'Ich lerne Deutsch jeden Tag.' },
              { word: 'Familie', phonetic: '/faˈmiːliə/', meaning: '家庭', example: 'Meine Familie ist groß.' },
              { word: 'Freund', phonetic: '/fʁɔʏnt/', meaning: '朋友', example: 'Er ist mein guter Freund.' },
            ],
            grammar: {
              title: '定冠词 der / die / das',
              content: '阳性名词用 der，阴性用 die，中性用 das。复数统一用 die。',
              examples: ['der Mann (男人)', 'die Frau (女人)', 'das Kind (孩子)', 'die Bücher (书)'],
              quiz: [
                { question: '___ Mann ist groß.', options: ['Der', 'Die', 'Das'], answer: 'Der' },
                { question: '___ Frau ist freundlich.', options: ['Der', 'Die', 'Das'], answer: 'Die' },
                { question: '___ Kind ist glücklich.', options: ['Der', 'Die', 'Das'], answer: 'Das' },
              ],
            },
            listening: [
              { text: 'Ich lerne Deutsch jeden Morgen.', translation: '我每天早上学习德语。' },
              { text: 'Meine Familie lebt in Berlin.', translation: '我家住在柏林。' },
            ],
            speaking: [
              { text: 'Ich lerne Deutsch jeden Tag.', hint: '表达每日学习' },
              { text: 'Meine Familie ist groß.', hint: '描述家庭' },
            ],
          },
        ],
      },
      {
        id: 'de-3',
        name: 'B1 中级',
        description: '流利表达与复杂话题',
        lessons: [
          {
            id: 'de-l3',
            title: '旅行与经历',
            type: 'vocabulary',
            words: [
              { word: 'Reise', phonetic: '/ˈʁaɪzə/', meaning: '旅行', example: 'Ich mache eine Reise nach Deutschland.' },
              { word: 'Flughafen', phonetic: '/ˈfluːkhaːfn̩/', meaning: '机场', example: 'Der Flughafen ist sehr groß.' },
              { word: 'Erlebnis', phonetic: '/ɛʁˈleːpnɪs/', meaning: '经历/体验', example: 'Das war ein tolles Erlebnis!' },
              { word: 'Kultur', phonetic: '/kʊlˈtuːɐ̯/', meaning: '文化', example: 'Die deutsche Kultur ist interessant.' },
              { word: 'Geschichte', phonetic: '/ɡəˈʃɪçtə/', meaning: '历史/故事', example: 'Ich lese die Geschichte.' },
            ],
            grammar: {
              title: '现在完成时 haben / sein',
              content: '大多数动词用haben作助动词，移动和状态变化动词用sein。',
              examples: ['Ich habe Deutsch gelernt.', 'Ich bin nach Berlin gefahren.', 'Er hat einen Roman gelesen.'],
              quiz: [
                { question: 'Ich ___ Deutsch gelernt.', options: ['habe', 'bin', 'hat'], answer: 'habe' },
                { question: 'Ich ___ nach Berlin gefahren.', options: ['habe', 'bin', 'bist'], answer: 'bin' },
                { question: 'Er ___ einen Roman gelesen.', options: ['hat', 'ist', 'habe'], answer: 'hat' },
              ],
            },
            listening: [
              { text: 'Letztes Jahr habe ich eine Reise nach Deutschland gemacht.', translation: '去年我去德国旅行了。' },
              { text: 'Das war ein wunderbares Erlebnis!', translation: '那是一次美妙的经历！' },
            ],
            speaking: [
              { text: 'Ich habe Deutsch gelernt.', hint: '表达已学过德语' },
              { text: 'Die deutsche Kultur ist interessant.', hint: '描述德国文化' },
            ],
          },
        ],
      },
    ],
  },
};
