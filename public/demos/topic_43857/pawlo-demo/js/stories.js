/**
 * Pawlo Stories (兔佩洛) — 故事数据
 * 面向 3-7 岁孩子的 AI 互动睡前故事
 * 家长在选项里替孩子选分支,故事由 AI 实时生成,并织入孩子的名字和兴趣。
 *
 * trait 取值:
 *   empathy(同理心) curiosity(好奇心) courage(勇气)
 *   imagination(想象力) cooperation(合作) creativity(创造力) persistence(坚持)
 */

const STORIES = [
  /* ============================================================
   * 故事 1 · 露娜和丢失的月亮角
   * ============================================================ */
  {
    id: "luna-and-the-moon",
    title: "露娜和丢失的月亮角",
    synopsis: "月亮缺了一角,小狐狸露娜出发去寻找它。",
    emoji: "🦊",
    coverImage: "story-luna-and-the-moon.jpg",
    opening: {
      text: "夜晚的月光森林,亮晶晶的。小狐狸露娜抬头一看——咦,今晚的月亮缺了一个角!\"是谁把月亮的一角弄丢了呢?\"露娜决定去找一找。走着走着,她来到了一个岔路口……",
      scenePrompt: "moon fox crescent forest"
    },
    choicePoints: [
      {
        id: "cp1",
        prompt: "故事往哪边走?",
        options: [
          {
            id: "o_help",
            label: "先去帮帮被树根卡住的小刺猬",
            hint: "停下来帮助朋友",
            trait: "empathy",
            scenePrompt: "fox hedgehog tree roots",
            text: "露娜轻轻扒开树根,把小刺猬救了出来。\"谢谢你!\"小刺猬抖了抖身上的刺,\"我看见月亮的碎片往这边落下去啦——我陪你一起去!\"于是,一狐一猬肩并肩,踏着月光,一起往森林深处走去。"
          },
          {
            id: "o_follow",
            label: "跟着萤火虫走进树林深处",
            hint: "追着线索看一看",
            trait: "curiosity",
            scenePrompt: "fox fireflies glowing path",
            text: "萤火虫们排成一条发光的小路。露娜跟着光,走进树林深处,经过银色的蕨草和打着瞌睡的小花。小亮点们好像很清楚该往哪儿走,一闪一闪地带着她往前。\"我猜你们是在给我带路吧!\"露娜小声说,继续跟着它们走。"
          },
          {
            id: "o_climb",
            label: "爬上大石头看清整片森林",
            hint: "登高望远找方向",
            trait: "courage",
            scenePrompt: "fox on big rock valley view",
            text: "露娜手脚并用,呼哧呼哧地爬上了大石头。从高处望出去,整片森林都铺在脚下!远处有一点银光一闪一闪。\"找到啦!碎片就在那边!\"她蹦蹦跳跳地爬下来,朝着那点光跑去。"
          }
        ]
      },
      {
        id: "cp2",
        prompt: "前面的路被一条宽宽的月光小河挡住了。怎么过河呢?",
        options: [
          {
            id: "m_stones",
            label: "踩着滑滑的石头跳过去",
            hint: "勇敢地一跳",
            trait: "courage",
            scenePrompt: "fox hopping stepping stones river",
            text: "露娜看了看水里露出来的圆石头。\"我们可以的——一次跳一块!\"她从一块石头蹦到另一块,尾巴一甩一甩保持平衡,小伙伴紧跟在后面。跳、跳、跳——过河啦!对岸,一点柔柔的银光就在前方闪着。"
          },
          {
            id: "m_turtle",
            label: "请老乌龟驮大家过河",
            hint: "朋友帮朋友",
            trait: "cooperation",
            scenePrompt: "fox friends on turtle back river",
            text: "一只年纪很大的乌龟正在水边打盹。\"打扰一下,\"露娜有礼貌地说,\"您能帮我们过河吗?\"乌龟慢慢地、温柔地笑了:\"上来吧,小家伙们。\"大家爬上他宽宽的、长着青苔的背,他稳稳地把大家划到了对岸,那儿有一点银光正等着。"
          },
          {
            id: "m_log",
            label: "沿着河边找一座倒下的独木桥",
            hint: "耐心又稳当",
            trait: "persistence",
            scenePrompt: "fox crossing fallen log bridge",
            text: "\"我们沿着河边找找看,\"露娜说。他们走啊走,正当小脚有点累的时候——看!一根大大的倒木横在河上,像一座桥。一步一步,小心地走,他们终于到了对岸,旁边一点柔柔的银光闪着。"
          }
        ]
      },
      {
        id: "cp3",
        prompt: "就在那儿——月亮碎片在草丛里闪着光!怎么把它送回天上呢?",
        options: [
          {
            id: "e_sing",
            label: "轻轻唱一首歌,请月亮自己来取",
            hint: "温柔的办法",
            trait: "imagination",
            scenePrompt: "fox singing to full moon silver ribbon",
            text: "露娜坐在闪光的碎片旁边,对着天空轻轻地唱。歌声像一条软软的银丝带,飘呀飘。月亮听见了,弯下腰,像妈妈一样把碎片轻轻接了回去。森林里洒满了完整的月光,每一片叶子都在闪闪发亮。"
          },
          {
            id: "e_tower",
            label: "叫上朋友们,搭一座高高的朋友塔",
            hint: "大家一起来",
            trait: "cooperation",
            scenePrompt: "forest animals stacked friendly tower moon",
            text: "小熊驮着小鹿,小鹿驮着兔子,兔子顶着露娜……大家搭起一座摇摇晃晃、又稳稳当当的朋友塔!露娜踮起脚尖,把碎片轻轻放回月亮的怀里。\"我们一起做到啦!\"森林里响起了欢呼声。"
          },
          {
            id: "e_dandelion",
            label: "用蒲公英做小降落伞,让碎片飘上去",
            hint: "奇思妙想",
            trait: "creativity",
            scenePrompt: "moon piece floating dandelion parachute",
            text: "露娜摘来最大的一朵蒲公英,把碎片系在绒毛伞下,然后深深吸一口气——呼!蒲公英伞带着碎片慢悠悠地飘上天,正好落进月亮缺角的地方。月亮眨眨眼,把最亮的一束光送给了露娜。"
          }
        ]
      }
    ],
    consequences: {
      cp1: {
        o_help: "因为露娜停下脚步帮助了小刺猬,她多了一位一起赶路的好朋友;",
        o_follow: "因为露娜跟着好奇心一路走,小亮点正好把她带到了该去的地方;",
        o_climb: "因为露娜鼓起勇气爬上高处,她一眼就望见了该往哪边走;"
      },
      cp3: {
        e_sing: "最后,一首温柔的歌让月亮重新变圆了。",
        e_tower: "最后,大家齐心协力,把月亮重新变圆了。",
        e_dandelion: "最后,一个奇思妙想让月亮重新变圆了。"
      }
    },
    talk: {
      e_sing: "如果让你对月亮唱一首歌,你想唱哪一首呀?",
      e_tower: "大家一起搭了朋友塔——如果是你,你想叫上谁来帮忙?",
      e_dandelion: "除了蒲公英,还有什么东西也能飘上天呢?"
    }
  },

  /* ============================================================
   * 故事 2 · 爱打喷嚏的云朵
   * ============================================================ */
  {
    id: "the-sneezing-cloud",
    title: "爱打喷嚏的云朵",
    synopsis: "一朵小云朵一直打喷嚏、下棉花糖雨,小狐狸露娜出发去帮它。",
    emoji: "☁️",
    coverImage: "story-the-sneezing-cloud.jpg",
    opening: {
      text: "月光森林的上空,飘来一朵胖乎乎的小云朵——然后……\"啊……啊……阿嚏!\"哗啦啦,落下一阵软软的、粉粉的棉花糖雨!\"哎呀,\"小狐狸露娜说,\"这朵小云朵感冒打喷嚏啦。\"她赶紧穿过草地,去看看能帮上什么忙。",
      scenePrompt: "fluffy cloud sneezing cotton candy rain fox"
    },
    choicePoints: [
      {
        id: "cp1",
        prompt: "怎样靠近小云朵,跟它打个招呼呢?",
        options: [
          {
            id: "o_gentle",
            label: "轻轻地爬上小山坡,慢慢靠近它",
            hint: "温柔地慢慢来",
            trait: "empathy",
            scenePrompt: "fox tiptoeing up grassy hill toward cloud",
            text: "露娜踮着脚,一步一步爬上软软的草坡。她离小云朵越来越近,轻声说:\"你好呀,小云朵,你是不是不舒服?\"小云朵揉揉眼睛,委屈地点了点头,鼻尖红红的。"
          },
          {
            id: "o_watch",
            label: "先在下面看一会儿,猜猜它怎么了",
            hint: "先观察一下",
            trait: "curiosity",
            scenePrompt: "fox watching cloud from below curious",
            text: "露娜坐在草地上,仰着头仔细看。小云朵每打一个喷嚏,就掉下一团棉花糖。\"它好像在发抖呢,\"露娜想,\"是不是着凉了?\"她决定爬上去,好好看看。"
          },
          {
            id: "o_call",
            label: "大声喊\"你好\",让云朵听见",
            hint: "勇敢地打招呼",
            trait: "courage",
            scenePrompt: "fox calling up to cloud loudly",
            text: "露娜深吸一口气,朝天上大声喊:\"小云朵——你好呀!\"声音穿过草地,小云朵吓了一跳,低头一看,发现了露娜。\"你……阿嚏!你是来帮我的吗?\"它小声问。"
          }
        ]
      },
      {
        id: "cp2",
        prompt: "原来是一根小羽毛粘在云朵鼻子上,一直痒痒的!怎么帮忙呢?",
        options: [
          {
            id: "o_bird",
            label: "请路过的小鸟帮忙把羽毛叼走",
            hint: "请朋友帮忙",
            trait: "cooperation",
            scenePrompt: "bird plucking feather from cloud nose",
            text: "露娜抬头招呼路过的小鸟。\"能帮个忙吗?\"小鸟扑棱着翅膀飞过去,轻轻一叼,就把羽毛衔走了。小云朵鼻子一松,舒服地叹了口气:\"谢谢你——还有你的小鸟朋友!\""
          },
          {
            id: "o_dandelion",
            label: "用蒲公英绒毛把羽毛粘下来",
            hint: "奇思妙想",
            trait: "creativity",
            scenePrompt: "fox using dandelion fluff on cloud nose",
            text: "露娜摘来一朵毛茸茸的蒲公英,在云朵鼻子前轻轻一晃。\"呼——\"羽毛被绒毛粘走了,蒲公英的种子却软软地留下,一点也不痒。小云朵咯咯笑了起来:\"好痒,但是好舒服!\""
          },
          {
            id: "o_pat",
            label: "轻轻地一下一下拍云朵的背",
            hint: "耐心地照顾",
            trait: "persistence",
            scenePrompt: "fox gently patting cloud back",
            text: "露娜爬上云朵软软的背,轻轻地、有节奏地拍着。\"没事的,没事的。\"一下,两下,三下……慢慢地,小云朵不打喷嚏了,鼻子也不痒了。它回过头,感激地蹭了蹭露娜。"
          }
        ]
      },
      {
        id: "cp3",
        prompt: "小云朵舒服啦,该怎样和它道一声晚安呢?",
        options: [
          {
            id: "o_blanket",
            label: "给云朵盖一床星光被子",
            hint: "想象一个温暖的办法",
            trait: "imagination",
            scenePrompt: "starlight blanket over sleeping cloud",
            text: "露娜对着天空轻轻吹了口气,满天的星星落下来,变成一床闪闪发光的被子,盖在小云朵身上。\"晚安,小云朵,做个甜甜的梦。\"云朵裹紧被子,安心地闭上了眼睛。"
          },
          {
            id: "o_lullaby",
            label: "轻轻唱一首摇篮曲陪它入睡",
            hint: "用歌声陪伴",
            trait: "empathy",
            scenePrompt: "fox singing lullaby to cloud moonlight",
            text: "露娜坐在云朵旁边,轻轻地哼起一首摇篮曲。歌声软软的,像月光一样。小云朵听着听着,身体慢慢放松下来,飘得更低、更稳,最后轻轻地睡着了。"
          },
          {
            id: "o_goodnight",
            label: "叫上森林里的朋友一起说晚安",
            hint: "大家一起道晚安",
            trait: "cooperation",
            scenePrompt: "forest animals saying goodnight to cloud",
            text: "露娜招呼小刺猬、小鹿和小鸟都过来。大家围成一圈,齐声说:\"晚安,小云朵!\"小云朵被这么多朋友围着,脸都红了。它甜甜地笑了,飘进夜空,变成一朵安静的、睡着的云。"
          }
        ]
      }
    ],
    consequences: {
      cp1: {
        o_gentle: "因为露娜轻轻地靠近,小云朵觉得安心,愿意把不舒服告诉它;",
        o_watch: "因为露娜先观察了一会儿,她发现小云朵在发抖,猜到它可能着凉了;",
        o_call: "因为露娜勇敢地大声打招呼,小云朵很快发现了她,主动开口求助;"
      },
      cp3: {
        o_blanket: "最后,一床星光被子让小云朵暖暖地睡着了,天上多了一朵安静的云。",
        o_lullaby: "最后,一首摇篮曲让小云朵安心入睡,月光森林的夜晚又安静又温柔。",
        o_goodnight: "最后,在所有朋友的晚安声里,小云朵甜甜地睡去了,梦里一定有棉花糖。"
      }
    },
    talk: {
      o_blanket: "如果让你给小云朵盖被子,你想用什么做被子呢?",
      o_lullaby: "你会唱哪首摇篮曲给小云朵听呀?",
      o_goodnight: "你想和谁一起说晚安呢?"
    }
  },

  /* ============================================================
   * 故事 3 · 蘑菇邮局的信
   * ============================================================ */
  {
    id: "the-mushroom-post",
    title: "蘑菇邮局的信",
    synopsis: "露娜在蘑菇邮局捡到一封没有地址的信,出发去把它送到。",
    emoji: "🍄",
    coverImage: "story-the-mushroom-post.jpg",
    opening: {
      text: "月光森林的深处,有一间舒舒服服的小邮局,就藏在一朵巨大的红蘑菇里。今晚,小狐狸露娜在门口捡到一封信——可是它上面既没有名字,也没有地址!\"这是要送给谁的呢?\"她好奇地想。尾巴开心地一甩,她出发了,要自己弄清楚、把信送到。",
      scenePrompt: "post office inside red mushroom fox holding letter"
    },
    choicePoints: [
      {
        id: "cp1",
        prompt: "怎样弄清楚这封信是给谁的呢?",
        options: [
          {
            id: "o_read",
            label: "小心地打开信,看看里面写了什么",
            hint: "看看信里有什么",
            trait: "curiosity",
            scenePrompt: "fox opening letter with drawing inside",
            text: "露娜轻轻地拆开信封。里面是一张画——画着一棵大橡树,树下有一只小松鼠,旁边写着\"谢谢你陪我\"。\"原来这封信是送给小松鼠的!\"露娜高兴地说。"
          },
          {
            id: "o_snail",
            label: "去问问邮局的老蜗牛爷爷",
            hint: "向长辈请教",
            trait: "empathy",
            scenePrompt: "fox asking old snail at mushroom post office",
            text: "露娜推开蘑菇门,找到正在整理信件的老蜗牛。\"蜗牛爷爷,这封信没有地址,您知道是谁的吗?\"老蜗牛推了推眼镜:\"哦,这好像是松鼠妈妈寄的,她住在大橡树那边。\""
          },
          {
            id: "o_smell",
            label: "闻闻信封上的气味,顺着味道找",
            hint: "勇敢地当小侦探",
            trait: "courage",
            scenePrompt: "fox sniffing letter envelope detective",
            text: "露娜把信封凑到鼻子前,闻了闻。\"有松果的味道,还有一点点橡树叶的清香!\"她信心满满地抬起头,\"我猜,这封信和住在橡树下的朋友有关!\""
          }
        ]
      },
      {
        id: "cp2",
        prompt: "找到线索啦——信好像和大橡树下的松鼠家有关。接下来怎么做呢?",
        options: [
          {
            id: "o_follow",
            label: "顺着松果小路,一直走到大橡树",
            hint: "坚持走到目的地",
            trait: "persistence",
            scenePrompt: "fox walking pinecone path to big oak tree",
            text: "露娜沿着松果铺成的小路,一步一步往前走。路有点长,小脚有点酸,但她没有停下来。终于,一棵好大好大的橡树出现在眼前,树洞里透出暖暖的光。"
          },
          {
            id: "o_friends",
            label: "请路上的小动物们帮忙指路",
            hint: "大家一起帮忙",
            trait: "cooperation",
            scenePrompt: "fox with rabbit and hedgehog asking directions",
            text: "露娜遇到了小兔子和小刺猬。\"请问,大橡树怎么走呀?\"\"跟我来!\"小兔子蹦蹦跳跳地带路,小刺猬在后面帮忙看着信。大家一起,很快就到了大橡树下。"
          },
          {
            id: "o_map",
            label: "用树皮画一张地图,自己找过去",
            hint: "自己动脑筋",
            trait: "creativity",
            scenePrompt: "fox drawing map on bark",
            text: "露娜捡起一片树皮,用小爪子画了一张地图。\"先经过蘑菇圈,再过小石桥,然后……\"她一边画一边想,把路线记得清清楚楚。带着地图,她出发了,一步一步,找得又准又快。"
          }
        ]
      },
      {
        id: "cp3",
        prompt: "到了大橡树下的松鼠家,怎样把信送进去呢?",
        options: [
          {
            id: "o_knock",
            label: "轻轻敲门,亲手交给小松鼠",
            hint: "温暖地送达",
            trait: "empathy",
            scenePrompt: "fox knocking door delivering letter to squirrel",
            text: "露娜轻轻敲了敲门。\"咚咚咚。\"小松鼠打开门,眼睛还揉着。\"给你的信!\"露娜把信递过去。小松鼠拆开一看,是妈妈的画,她一下子笑了:\"谢谢你,露娜!我好想妈妈。\""
          },
          {
            id: "o_window",
            label: "把信折成纸鹤,让它飞进窗户",
            hint: "想象一个魔法办法",
            trait: "imagination",
            scenePrompt: "letter folded as paper crane flying to window",
            text: "露娜把信折成一只纸鹤,对着它轻轻吹了口气。纸鹤扑扇着翅膀,飞了起来,穿过窗户,落在小松鼠的枕头边。小松鼠惊喜地捡起来:\"哇,会飞的信!\""
          },
          {
            id: "o_sing",
            label: "在窗外唱一首歌,告诉松鼠有信",
            hint: "勇敢地唱出来",
            trait: "courage",
            scenePrompt: "fox singing outside squirrel window with letter",
            text: "露娜站在窗外,轻轻唱起一首关于信的歌。小松鼠探出头来:\"是给我的吗?\"\"对呀!\"露娜笑着把信递上去。小松鼠抱着信,开心地转了一个圈。"
          }
        ]
      }
    ],
    consequences: {
      cp1: {
        o_read: "因为露娜打开了信,她发现里面是一幅画,猜到信是给小松鼠的;",
        o_snail: "因为露娜请教了老蜗牛,她知道了信是松鼠妈妈寄的,住在橡树那边;",
        o_smell: "因为露娜闻出了松果和橡叶的味道,她猜到信和橡树下的朋友有关;"
      },
      cp3: {
        o_knock: "最后,露娜亲手把信交给了小松鼠,小松鼠抱着妈妈的画,甜甜地笑了。",
        o_window: "最后,一只会飞的纸鹤把信送到了小松鼠窗前,给了她一个大大的惊喜。",
        o_sing: "最后,露娜用歌声把信送到了,小松鼠抱着信开心地转圈圈。"
      }
    },
    talk: {
      o_knock: "如果你收到一封信,你最希望是谁寄给你的呀?",
      o_window: "除了纸鹤,你还想让信变成什么样子飞过来呢?",
      o_sing: "如果要唱一首歌送信,你想唱什么歌呀?"
    }
  },

  /* ============================================================
   * 故事 4 · 会唱歌的小溪
   * ============================================================ */
  {
    id: "the-singing-brook",
    title: "会唱歌的小溪",
    synopsis: "每晚给森林唱歌的小溪忽然不唱了,小狐狸露娜沿着溪边出发,帮它找回自己的声音。",
    emoji: "🎶",
    coverImage: "story-the-singing-brook.jpg",
    opening: {
      text: "长满青苔的石头旁,小溪每天晚上都会唱起咕嘟咕嘟的歌。可是今晚,溪水悄悄地流过,一点声音也没有——小溪不唱歌了。\"真奇怪,\"小狐狸露娜竖起耳朵,轻轻地说,\"森林的夜晚,可不能少了摇篮曲呀。\"她沿着溪边,轻手轻脚地去看看发生了什么。",
      scenePrompt: "quiet stream mossy stones fox listening"
    },
    choicePoints: [
      {
        id: "cp1",
        prompt: "从哪里开始找,小溪为什么不唱歌了呢?",
        options: [
          {
            id: "o_upstream",
            label: "往上游走,看看溪水的源头",
            hint: "追根溯源",
            trait: "curiosity",
            scenePrompt: "fox walking upstream to spring source",
            text: "露娜沿着小溪往上游走。水越来越浅,她发现源头的小泉眼被一堆落叶堵住了。\"原来是这样!水被堵住啦。\"露娜蹲下来,仔细看了看那堆叶子。"
          },
          {
            id: "o_listen",
            label: "蹲下来,静静地听小溪想说什么",
            hint: "用心倾听",
            trait: "empathy",
            scenePrompt: "fox crouching listening to stream",
            text: "露娜在溪边蹲下来,把耳朵贴近水面。\"嘘——\"她静静地听。好像,小溪在轻轻地叹气。\"它好像很难过,\"露娜想,\"是不是有什么东西卡住了?\"她决定顺着水流找一找。"
          },
          {
            id: "o_downstream",
            label: "往下游走,勇敢地探一探",
            hint: "勇敢地往前走",
            trait: "courage",
            scenePrompt: "fox walking downstream tall grass",
            text: "露娜卷起裤脚,往下游走去。下游的草又高又密,有点黑,但她不怕。走了一会儿,她发现水流被一块大石头挡住了,水积成了一小洼。\"找到啦!\"她高兴地说。"
          }
        ]
      },
      {
        id: "cp2",
        prompt: "找到原因啦——小溪被堵住了。怎么帮它呢?",
        options: [
          {
            id: "o_clear",
            label: "一片一片地把落叶捞开",
            hint: "耐心地清理",
            trait: "persistence",
            scenePrompt: "fox clearing leaves from spring",
            text: "露娜弯下腰,把落叶一片一片捞出来。叶子湿湿的、滑滑的,但她不嫌麻烦。一片,两片,三片……慢慢地,泉眼露出来了,水又开始咕嘟咕嘟地冒。"
          },
          {
            id: "o_push",
            label: "叫上小熊一起推开大石头",
            hint: "大家一起用力",
            trait: "cooperation",
            scenePrompt: "fox and bear pushing big stone in stream",
            text: "露娜一个人推不动大石头。\"小熊,快来帮帮忙!\"小熊跑过来,和露娜一起,嘿哟嘿哟地推。石头咕噜噜滚到一边,溪水哗啦一下冲了出来,又开始唱歌啦!"
          },
          {
            id: "o_channel",
            label: "用小树枝给溪水挖一条新水道",
            hint: "动脑筋想办法",
            trait: "creativity",
            scenePrompt: "fox digging new stream channel with sticks",
            text: "露娜找来几根小树枝,在石头旁边挖了一条弯弯的小水道。\"这样水就能绕过去啦!\"溪水顺着新水道流了过去,叮叮咚咚,好像在唱一首新歌。"
          }
        ]
      },
      {
        id: "cp3",
        prompt: "小溪又唱歌啦!怎样结束这个美好的夜晚呢?",
        options: [
          {
            id: "o_dance",
            label: "和小溪的歌声一起跳一支舞",
            hint: "想象和音乐起舞",
            trait: "imagination",
            scenePrompt: "fox dancing to stream song fireflies",
            text: "露娜闭上眼睛,跟着溪水的歌声,轻轻地转圈、摇摆。萤火虫围过来,像一盏盏小灯。\"这是我听过最好听的摇篮曲!\"露娜说。小溪哗啦啦地唱着,好像在说晚安。"
          },
          {
            id: "o_thank",
            label: "对小溪说一声\"谢谢你\"",
            hint: "感恩地告别",
            trait: "empathy",
            scenePrompt: "fox thanking stream water splashes",
            text: "露娜蹲在溪边,轻轻地说:\"小溪,谢谢你每天晚上给我们唱歌。\"溪水好像听懂了,咕嘟咕嘟地回应着,溅起几朵小水花,像在说\"不客气\"。露娜笑着挥挥手,踏着月光回家。"
          },
          {
            id: "o_lullaby",
            label: "和森林里的朋友一起哼摇篮曲",
            hint: "大家一起唱",
            trait: "cooperation",
            scenePrompt: "forest animals humming lullaby by stream",
            text: "露娜招呼小鹿、小兔和小鸟过来。大家围在小溪边,一起轻轻地哼起摇篮曲。小溪的歌声和大家的声音混在一起,整片森林都安静下来,甜甜地睡着了。"
          }
        ]
      }
    ],
    consequences: {
      cp1: {
        o_upstream: "因为露娜往上游走,她发现泉眼被落叶堵住了,找到了原因;",
        o_listen: "因为露娜用心倾听,她感觉到小溪很难过,决定顺着水流找一找;",
        o_downstream: "因为露娜勇敢地往下游走,她发现大石头挡住了水流;"
      },
      cp3: {
        o_dance: "最后,露娜和小溪的歌声一起跳了支舞,萤火虫围着她们闪闪发亮。",
        o_thank: "最后,露娜对小溪说了谢谢,小溪溅起水花回应她,月光森林安静又温柔。",
        o_lullaby: "最后,大家和小溪一起哼起了摇篮曲,整片森林甜甜地睡着了。"
      }
    },
    talk: {
      o_dance: "如果和小溪的歌声一起跳舞,你想怎么跳呀?",
      o_thank: "你想对小溪说什么感谢的话呢?",
      o_lullaby: "你会哼哪首摇篮曲,和小溪一起唱呀?"
    }
  },

  /* ============================================================
   * 故事 5 · 星星灯塔
   * ============================================================ */
  {
    id: "the-star-lighthouse",
    title: "星星灯塔",
    synopsis: "山丘灯塔里给大家照亮回家路的小星星熄灭了,小狐狸露娜爬上山去,帮它重新亮起来。",
    emoji: "🌟",
    coverImage: "story-the-star-lighthouse.jpg",
    opening: {
      text: "月光森林最高的山丘上,立着一座小小的灯塔。灯塔里住着一颗小星星,每天晚上亮闪闪的,给萤火虫和夜鸟们照亮回家的路。可是今晚,星光眨了眨……又眨了眨……熄灭了。\"不好,\"小狐狸露娜说,\"没有星光,大家会找不到回家的路的。\"她顺着弯弯的小路,朝灯塔跑去。",
      scenePrompt: "lighthouse on hill dark star fox path"
    },
    choicePoints: [
      {
        id: "cp1",
        prompt: "怎样爬上山丘,去到小灯塔那里呢?",
        options: [
          {
            id: "o_path",
            label: "沿着弯弯的小路,一步一步走上去",
            hint: "稳稳地坚持走",
            trait: "persistence",
            scenePrompt: "fox walking winding path up hill",
            text: "露娜沿着弯弯曲曲的小路,一步一步往上走。路有点陡,她的小腿有点酸,但她没有停下来。\"快到了,快到了。\"她给自己加油,终于走到了灯塔门口。"
          },
          {
            id: "o_shortcut",
            label: "走一条又陡又短的草坡小路",
            hint: "勇敢地抄近路",
            trait: "courage",
            scenePrompt: "fox climbing steep grassy slope",
            text: "露娜看到一条直直的草坡,又短又快。\"走这条!\"她手脚并用,呼哧呼哧地爬了上去。草有点滑,但她抓得紧紧的。不一会儿,她就站在了灯塔前面。"
          },
          {
            id: "o_ride",
            label: "请小鹿驮自己跑上山",
            hint: "请朋友帮忙",
            trait: "cooperation",
            scenePrompt: "fox riding deer up hill",
            text: "露娜遇到了小鹿。\"能带我上山吗?\"\"上来吧!\"小鹿驮着露娜,哒哒哒地跑上山丘。风在耳边呼呼地吹,不一会儿,灯塔就在眼前了。"
          }
        ]
      },
      {
        id: "cp2",
        prompt: "到了灯塔,原来小星星是太累了,光变得暗暗的。怎么帮忙呢?",
        options: [
          {
            id: "o_hug",
            label: "轻轻地抱抱小星星,给它力量",
            hint: "温暖地陪伴",
            trait: "empathy",
            scenePrompt: "fox hugging tired little star",
            text: "露娜轻轻地抱住小星星。\"你辛苦啦,每天晚上都给大家照亮。\"小星星靠在露娜怀里,慢慢地,光又亮了一点点。\"谢谢你,我觉得好多了。\"它小声说。"
          },
          {
            id: "o_sing",
            label: "唱一首歌,让星星想起发光的感觉",
            hint: "用歌声唤醒",
            trait: "imagination",
            scenePrompt: "fox singing to dim star lighthouse",
            text: "露娜对着小星星轻轻唱起一首关于夜空的歌。\"一闪一闪亮晶晶……\"小星星听着听着,想起了自己发光的样子。慢慢地,它的光一点一点亮了起来,越来越温暖。"
          },
          {
            id: "o_polish",
            label: "用月光把星星擦得亮亮的",
            hint: "奇思妙想",
            trait: "creativity",
            scenePrompt: "fox polishing star with moonlight",
            text: "露娜捧起一把月光,像擦玻璃一样,轻轻地擦小星星。擦一擦,亮一点;再擦一擦,又亮一点。最后,小星星闪闪发光,比以前还要亮!\"哇,我好亮呀!\"它开心地转了一圈。"
          }
        ]
      },
      {
        id: "cp3",
        prompt: "星星又亮啦!怎样和小星星道一声晚安呢?",
        options: [
          {
            id: "o_wave",
            label: "对星星挥挥手,说\"晚安,明天见\"",
            hint: "温暖地告别",
            trait: "empathy",
            scenePrompt: "fox waving goodbye to bright star",
            text: "露娜站在灯塔门口,朝小星星挥挥手。\"晚安,小星星,明天见!\"小星星眨眨眼,洒下一束柔柔的光,像在说\"晚安,露娜\"。露娜踏着星光,安心地往家走。"
          },
          {
            id: "o_wish",
            label: "对着星星许一个愿望",
            hint: "想象一个美好的愿望",
            trait: "imagination",
            scenePrompt: "fox making wish to bright star",
            text: "露娜闭上眼睛,对着亮闪闪的小星星许了一个愿望。\"希望每个晚上,大家都能找到回家的路。\"小星星好像听见了,闪了三下,把愿望藏进了光里。露娜笑着,安心地回家。"
          },
          {
            id: "o_lullaby",
            label: "和灯塔里的星星一起唱晚安歌",
            hint: "大家一起唱",
            trait: "cooperation",
            scenePrompt: "fox and star singing goodnight song lighthouse",
            text: "露娜和小星星一起,轻轻地唱起晚安歌。歌声飘下山丘,萤火虫和夜鸟都听见了,一只一只地回家去了。\"晚安,大家。\"露娜说,踏着月光,慢慢地走下山。"
          }
        ]
      }
    ],
    consequences: {
      cp1: {
        o_path: "因为露娜一步一步坚持走,她稳稳当当地到了灯塔,一点也不累坏;",
        o_shortcut: "因为露娜勇敢地抄了近路,她很快就到了灯塔,节省了时间;",
        o_ride: "因为露娜请小鹿帮忙,她们又快又开心地到了灯塔;"
      },
      cp3: {
        o_wave: "最后,露娜挥挥手说了晚安,小星星洒下柔光,照亮她回家的路。",
        o_wish: "最后,露娜许了一个愿望,小星星把愿望藏进光里,照亮每个回家的夜晚。",
        o_lullaby: "最后,露娜和星星一起唱了晚安歌,萤火虫和夜鸟都安心地回家了。"
      }
    },
    talk: {
      o_wave: "你想对小星星说什么晚安的话呀?",
      o_wish: "如果对着星星许愿,你会许什么愿望呢?",
      o_lullaby: "你会唱什么晚安歌,和小星星一起唱呀?"
    }
  },

  /* ============================================================
   * 故事 6 · 露娜和迷路的小萤火虫
   * ============================================================ */
  {
    id: "luna-and-the-lost-firefly",
    title: "露娜和迷路的小萤火虫",
    synopsis: "一只小萤火虫的光忽明忽暗、找不到回家的路。小狐狸露娜陪它一起,顺着月光把它送回家。",
    emoji: "✨",
    coverImage: "story-luna-and-the-lost-firefly.jpg",
    opening: {
      text: "月光森林里,一闪一闪的萤火虫们正准备回家睡觉。可有一只小萤火虫的光忽明忽暗,怎么也找不到回家的路,急得快哭出来。小狐狸露娜轻轻伸出爪子:\"别怕,我陪你一起找。我们顺着月光走,一定能把你送回家。\"小萤火虫落在露娜的耳朵尖上,一狐一虫,出发啦……",
      scenePrompt: "firefly pond fox lost night"
    },
    choicePoints: [
      {
        id: "cp1",
        prompt: "天色越来越暗,小萤火虫的光也越来越弱。先从哪里开始找回家的路呢?",
        options: [
          {
            id: "o_pond",
            label: "去萤火虫池塘问问大家有没有见过它的家",
            hint: "打听一下线索",
            trait: "curiosity",
            scenePrompt: "firefly pond fox asking",
            text: "露娜带着小萤火虫来到森林深处的萤火池塘。好多萤火虫正在水面上跳舞!\"请问,你们认识这只小萤火虫吗?\"露娜轻声问。一只老萤火虫飞过来:\"哦,它住在池塘对面的芦苇丛里!我给你们带路。\""
          },
          {
            id: "o_owl",
            label: "请树上的猫头鹰爷爷帮忙指路",
            hint: "向长辈请教",
            trait: "cooperation",
            scenePrompt: "owl tree night fox",
            text: "露娜抬头喊:\"猫头鹰爷爷,您能帮我们指个路吗?\"猫头鹰爷爷推了推眼镜:\"小萤火虫的家呀?沿着这条月光小路一直走,过了三棵弯弯的树就到啦。\"露娜谢过猫头鹰,带着小萤火虫出发了。"
          },
          {
            id: "o_trail",
            label: "顺着地上微弱的光点痕迹往前走",
            hint: "勇敢地当小侦探",
            trait: "courage",
            scenePrompt: "moon trail dark forest",
            text: "露娜蹲下来仔细看——地上有一串微弱的光点,像小萤火虫走过时留下的脚印。\"跟我来!\"露娜鼓起勇气,沿着光点走进了有点暗的树林深处。小萤火虫紧紧趴在她耳朵上,一闪一闪地给她壮胆。"
          }
        ]
      },
      {
        id: "cp2",
        prompt: "走着走着,小萤火虫的光越来越暗,它害怕得发抖。怎么帮它呢?",
        options: [
          {
            id: "o_sing",
            label: "轻轻唱一首歌,让它不那么害怕",
            hint: "用歌声陪伴",
            trait: "imagination",
            scenePrompt: "fox singing lullaby night",
            text: "露娜轻轻哼起一首歌:\"一闪一闪小亮亮,别怕别怕我在身旁……\"歌声软软的,像月光一样。小萤火虫听着听着,不再发抖了,身上的光也一点点亮了起来。\"谢谢你,露娜,\"它小声说,\"你的歌好温暖。\""
          },
          {
            id: "o_warm",
            label: "把小萤火虫捧在爪心里暖一暖",
            hint: "温暖地照顾",
            trait: "empathy",
            scenePrompt: "fox cupping firefly warm paws",
            text: "露娜小心翼翼地把小萤火虫捧在两只爪子中间。\"别怕,我帮你暖暖。\"她轻轻呵了口气,暖暖的。小萤火虫靠在她爪心里,慢慢地,光又亮了一点点。\"好暖和呀,\"它开心地说,\"我觉得又有力气了!\""
          },
          {
            id: "o_dandelion",
            label: "用蒲公英绒毛做一盏小灯笼给它照亮",
            hint: "奇思妙想",
            trait: "creativity",
            scenePrompt: "dandelion fluff soft light",
            text: "露娜摘了一朵毛茸茸的蒲公英,把绒毛轻轻缠在小萤火虫身边,做了一盏软软的小灯笼。\"看,现在你有两盏灯啦!\"小萤火虫在蒲公英灯笼里一闪一闪,光变得又柔又亮。\"好漂亮!谢谢你,露娜!\""
          }
        ]
      },
      {
        id: "cp3",
        prompt: "终于到了萤火虫的家!好多萤火虫家人围过来,一闪一闪地欢迎它。怎样结束这个美好的夜晚呢?",
        options: [
          {
            id: "o_dance",
            label: "和萤火虫们一起在月光下跳一支舞",
            hint: "想象和光一起跳舞",
            trait: "imagination",
            scenePrompt: "fireflies dance moonlight pond",
            text: "露娜和萤火虫们一起,在月光下轻轻转圈、摇摆。萤火虫们围着她飞来飞去,像一条闪闪发光的河流。\"这是我跳过最漂亮的舞!\"露娜笑着说。萤火虫们一闪一闪,好像在说\"晚安,露娜\"。"
          },
          {
            id: "o_thank",
            label: "对小萤火虫说一声\"你真勇敢\"",
            hint: "温暖地鼓励",
            trait: "empathy",
            scenePrompt: "fox thanking firefly",
            text: "露娜蹲下来,轻轻对小萤火虫说:\"你真勇敢,一个人走了那么远的路。\"小萤火虫的眼睛亮了一下,飞到露娜鼻尖上轻轻碰了一下。\"谢谢你陪我,\"它说,\"晚安,露娜!\"然后飞进了家人中间,一闪一闪地睡着了。"
          },
          {
            id: "o_lullaby",
            label: "和所有萤火虫一起哼一首晚安曲",
            hint: "大家一起唱",
            trait: "cooperation",
            scenePrompt: "fireflies lullaby forest",
            text: "露娜坐在萤火虫池塘边,和所有的萤火虫一起,轻轻地哼起晚安曲。歌声和萤火虫的光交织在一起,整片森林都安静下来,像盖了一层软软的、闪闪的被子。\"晚安,小萤火虫们。\"露娜轻声说,踏着月光回家去了。"
          }
        ]
      }
    ],
    consequences: {
      cp1: {
        o_pond: "因为露娜去萤火虫池塘打听,一只老萤火虫主动带路,她们很快知道了方向;",
        o_owl: "因为露娜请猫头鹰爷爷帮忙,她们得到了清楚的路线,沿着月光小路出发了;",
        o_trail: "因为露娜鼓起勇气顺着光点走,她们穿过暗暗的树林,离小萤火虫的家越来越近;"
      },
      cp3: {
        o_dance: "最后,露娜和萤火虫们在月光下跳了一支舞,闪闪的光河照亮了整个池塘。",
        o_thank: "最后,露娜夸小萤火虫勇敢,小萤火虫碰了碰她的鼻尖,安心地飞回了家人身边。",
        o_lullaby: "最后,露娜和所有萤火虫一起哼了晚安曲,整片森林在闪闪的光里甜甜地睡着了。"
      }
    },
    talk: {
      o_dance: "如果和萤火虫一起跳舞,你想怎么跳呀?",
      o_thank: "你想对小萤火虫说什么鼓励的话呢?",
      o_lullaby: "你会哼哪首晚安曲,和萤火虫一起唱呀?"
    }
  },

  /* ============================================================
   * 故事 7 · 佩洛和第一颗星
   * ============================================================ */
  {
    id: "pawlo-and-the-first-star",
    title: "佩洛和第一颗星",
    synopsis: "每晚都是小兔子佩洛点亮第一颗星,大家才知道该听睡前故事啦。可今晚,第一颗小星怎么也亮不起来——佩洛出发去看看它需要什么。",
    emoji: "🐰",
    coverImage: "story-pawlo-and-the-first-star.jpg",
    opening: {
      text: "天慢慢黑下来,月光森林安安静静的。小兔子佩洛踮起脚尖,准备点亮今晚的第一颗星——这样大家就知道:讲睡前故事的时间到咯!可是今晚,那颗小小的星星眨呀眨,怎么也亮不起来。\"别担心,\"佩洛轻声说,\"我们一起来想想办法。\"他背起小小的星光灯笼,走进了亮晶晶的森林……",
      scenePrompt: "bunny lantern star forest night"
    },
    choicePoints: [
      {
        id: "cp1",
        prompt: "佩洛刚走进月光森林,手里的小星灯笼忽明忽暗。他要怎样开始,去弄明白第一颗星为什么不亮呢?",
        options: [
          {
            id: "o_climb",
            label: "爬上最高的那棵松树,离星星近一点",
            hint: "勇敢地爬上去",
            trait: "courage",
            scenePrompt: "bunny climbing tall pine tree",
            text: "佩洛手脚并用,呼哧呼哧地爬上了森林里最高的松树。风在耳边呼呼吹,他踮起脚尖,离天空好近好近!\"小星星,你怎么啦?\"他轻声问。小星星眨了眨,好像很累的样子。"
          },
          {
            id: "o_ask",
            label: "去问问萤火虫们有没有注意到什么",
            hint: "大家一起想办法",
            trait: "cooperation",
            scenePrompt: "bunny meets firefly friends",
            text: "佩洛来到萤火虫池塘,轻声问:\"你们有没有发现,今晚的第一颗星不太对劲?\"萤火虫们七嘴八舌地说:\"我们看到了!小星星好像在打瞌睡,怎么叫都不醒!\"佩洛点点头:\"那我们一起去叫醒它吧!\""
          },
          {
            id: "o_lantern",
            label: "举着星光灯笼,沿着星星的光路慢慢走",
            hint: "耐心地找过去",
            trait: "persistence",
            scenePrompt: "lantern path forest night",
            text: "佩洛举起小星灯笼,沿着地上隐隐约约的星光痕迹,一步一步往前走。路有点长,灯笼的光也忽明忽暗,但他没有停下来。\"快到了,快到了。\"他给自己打气。终于,他来到了小星星的正下方。"
          }
        ]
      },
      {
        id: "cp2",
        prompt: "到了小星星跟前,原来它是太累了,光变得暗暗的。怎么帮忙呢?",
        options: [
          {
            id: "o_hug",
            label: "轻轻地抱抱小星星,给它力量",
            hint: "温暖地陪伴",
            trait: "empathy",
            scenePrompt: "bunny hugging star",
            text: "佩洛踮起脚,轻轻地抱住小星星。\"你辛苦啦,每天晚上第一个亮起来,给大家信号。\"小星星靠在佩洛怀里,慢慢地,光又亮了一点点。\"谢谢你,佩洛,\"它小声说,\"我觉得暖和多了。\""
          },
          {
            id: "o_sing",
            label: "唱一首关于夜空的歌,让星星想起发光的感觉",
            hint: "用歌声唤醒",
            trait: "imagination",
            scenePrompt: "singing to star night",
            text: "佩洛对着小星星轻轻唱起来:\"一闪一闪亮晶晶,满天都是小星星……\"小星星听着听着,想起了自己发光的样子。慢慢地,它的光一点一点亮了起来,越来越温暖。\"我想起来了!\"小星星开心地说。"
          },
          {
            id: "o_polish",
            label: "用月光把星星擦得亮亮的",
            hint: "奇思妙想",
            trait: "creativity",
            scenePrompt: "bunny polishing star moonlight",
            text: "佩洛捧起一把月光,像擦玻璃一样,轻轻地擦小星星。擦一擦,亮一点;再擦一擦,又亮一点。最后,小星星闪闪发光,比以前还要亮!\"哇,我好亮呀!\"它开心地转了一圈,洒下一片星光。"
          }
        ]
      },
      {
        id: "cp3",
        prompt: "星星又亮啦!第一颗星亮起来,大家就知道该听睡前故事了。怎样和小星星道一声晚安呢?",
        options: [
          {
            id: "o_wave",
            label: "对星星挥挥手,说\"晚安,明天见\"",
            hint: "温暖地告别",
            trait: "empathy",
            scenePrompt: "bunny waving to star",
            text: "佩洛站在树下,朝小星星挥挥手。\"晚安,小星星,明天见!\"小星星眨眨眼,洒下一束柔柔的光,像在说\"晚安,佩洛\"。佩洛踏着星光,安心地往家走。"
          },
          {
            id: "o_wish",
            label: "对着星星许一个愿望",
            hint: "想象一个美好的愿望",
            trait: "imagination",
            scenePrompt: "wishing on star moon",
            text: "佩洛闭上眼睛,对着亮闪闪的小星星许了一个愿望。\"希望每个晚上,大家都能听到好听的故事。\"小星星好像听见了,闪了三下,把愿望藏进了光里。佩洛笑着,安心地回家。"
          },
          {
            id: "o_lullaby",
            label: "和星星一起唱一首晚安歌",
            hint: "大家一起唱",
            trait: "cooperation",
            scenePrompt: "singing goodnight star",
            text: "佩洛和小星星一起,轻轻地唱起晚安歌。歌声飘过森林,萤火虫和夜鸟都听见了,一只一只地回家去了。\"晚安,大家。\"佩洛说,踏着月光,慢慢地走回家。"
          }
        ]
      }
    ],
    consequences: {
      cp1: {
        o_climb: "因为佩洛勇敢地爬上最高的松树,他离星星最近,最先发现了它的问题;",
        o_ask: "因为佩洛请教了萤火虫们,大家一起想办法,很快知道了小星星在打瞌睡;",
        o_lantern: "因为佩洛坚持沿着星光痕迹走,他稳稳当当地来到了小星星的正下方;"
      },
      cp3: {
        o_wave: "最后,佩洛挥挥手说了晚安,小星星洒下柔光,照亮他回家的路。",
        o_wish: "最后,佩洛许了一个愿望,小星星把愿望藏进光里,照亮每个听故事的夜晚。",
        o_lullaby: "最后,佩洛和星星一起唱了晚安歌,萤火虫和夜鸟都安心地回家了。"
      }
    },
    talk: {
      o_wave: "你想对小星星说什么晚安的话呀?",
      o_wish: "如果对着星星许愿,你会许什么愿望呢?",
      o_lullaby: "你会唱什么晚安歌,和小星星一起唱呀?"
    }
  },

  /* ============================================================
   * 故事 8 · 皮普和害羞的小海龟
   * ============================================================ */
  {
    id: "pip-and-the-shy-turtle",
    title: "皮普和害羞的小海龟",
    synopsis: "小金鱼皮普遇到一只缩在壳里不敢出来的小海龟,决定帮它交到朋友、变得勇敢。",
    emoji: "🐢",
    coverImage: "story-pip-and-the-shy-turtle.jpg",
    opening: {
      text: "蔚蓝的大海里,小金鱼皮普正吐着泡泡游来游去。忽然,他看到一只小海龟缩在壳里,一动不动。\"你好呀!\"皮普吐了个泡泡打招呼。可小海龟只是把壳缩得更紧了。原来,它太害羞了,不敢出来交朋友。皮普决定帮帮它……",
      scenePrompt: "fish sea turtle shell ocean"
    },
    choicePoints: [
      {
        id: "cp1",
        prompt: "小海龟缩在壳里不出来。皮普怎样跟它打招呼呢?",
        options: [
          {
            id: "o_gentle",
            label: "慢慢地游过去,轻声说\"你好\"",
            hint: "温柔地慢慢来",
            trait: "empathy",
            scenePrompt: "sea turtle shell gentle",
            text: "皮普慢慢地、轻轻地游过去,生怕吓到小海龟。\"你好呀,我叫皮普。\"他小声说,\"你不用害怕,我想和你做朋友。\"等了好一会儿,小海龟悄悄探出一点点头,小声说:\"你……你好。\""
          },
          {
            id: "o_show",
            label: "吐一串漂亮的泡泡,逗它开心",
            hint: "奇思妙想逗它笑",
            trait: "creativity",
            scenePrompt: "coral reef colorful",
            text: "皮普深吸一口气,吐出一串又大又圆的泡泡。泡泡飘呀飘,有一个正好落在小海龟的壳上,\"啵\"地破了。小海龟忍不住探出头,好奇地看着泡泡。\"好漂亮!\"它小声说,嘴角弯了弯。"
          },
          {
            id: "o_wait",
            label: "安静地待在旁边,等它自己出来",
            hint: "耐心地等待",
            trait: "persistence",
            scenePrompt: "sea turtle waiting",
            text: "皮普没有急着靠近,而是安静地待在小海龟旁边,偶尔吐个小泡泡。一分钟,两分钟……他耐心地等着。终于,小海龟慢慢探出头:\"你……你怎么不走呀?\"\"因为我想等你出来呀。\"皮普笑着说。"
          }
        ]
      },
      {
        id: "cp2",
        prompt: "小海龟出来了,但还是有点害羞。怎么帮它变得更勇敢呢?",
        options: [
          {
            id: "o_sing",
            label: "唱一首勇敢的小海歌",
            hint: "用歌声打气",
            trait: "imagination",
            scenePrompt: "singing lullaby sea",
            text: "皮普轻轻唱起一首海里的歌:\"小小海龟慢慢游,大海是你好朋友……\"歌声随着水波飘开,软软的、暖暖的。小海龟听着听着,眼睛亮了起来。\"我也想学这首歌!\"它说,声音比刚才大了一点点。"
          },
          {
            id: "o_friend",
            label: "带它去认识其他海洋朋友",
            hint: "大家一起玩",
            trait: "cooperation",
            scenePrompt: "fish introducing turtle to friends",
            text: "皮普带着小海龟游到珊瑚礁旁边。\"这是小螃蟹,那是海马!\"皮普一一介绍。小螃蟹挥挥钳子:\"你好呀!\"海马也点点头。小海龟发现大家都很友善,胆子大了一点:\"你们好,我叫小海龟。\""
          },
          {
            id: "o_explore",
            label: "邀请它一起去探索一个美丽的珊瑚洞穴",
            hint: "好奇地探险",
            trait: "curiosity",
            scenePrompt: "coral cave exploration",
            text: "\"我带你去一个特别漂亮的地方!\"皮普说。他们一起游进一个闪闪发光的珊瑚洞穴。洞壁上长满了五颜六色的珊瑚,像彩虹一样。\"哇——\"小海龟睁大了眼睛,开心地转了一圈,完全忘了害羞。"
          }
        ]
      },
      {
        id: "cp3",
        prompt: "小海龟交到了好多新朋友,开心极了!怎样结束这个美好的海底夜晚呢?",
        options: [
          {
            id: "o_lullaby",
            label: "大家一起唱一首海底摇篮曲",
            hint: "大家一起唱",
            trait: "cooperation",
            scenePrompt: "singing goodnight sea",
            text: "皮普、小海龟、小螃蟹和海马围在一起,轻轻地哼起海底摇篮曲。歌声随着水波飘远,大海慢慢安静下来。\"晚安,大海。\"小海龟说,第一次笑着和大家道晚安。"
          },
          {
            id: "o_thank",
            label: "对小海龟说\"你今天真勇敢\"",
            hint: "温暖地鼓励",
            trait: "empathy",
            scenePrompt: "glow turtle brave",
            text: "皮普游到小海龟身边,认真地说:\"你今天真勇敢,交了这么多朋友!\"小海龟的脸红了,但笑得好开心。\"谢谢你,皮普,\"它说,\"是你让我知道,交朋友一点也不可怕。\""
          },
          {
            id: "o_wish",
            label: "看着海面上的月亮,一起许个愿",
            hint: "想象一个美好的愿望",
            trait: "imagination",
            scenePrompt: "wave moon sea wish",
            text: "皮普和小海龟浮到海面上,一起看月亮。月光洒在海面上,一闪一闪的。\"我们许个愿吧!\"皮普说。他们闭上眼睛。小海龟许的愿望是:\"希望明天还能和朋友们一起玩。\""
          }
        ]
      }
    ],
    consequences: {
      cp1: {
        o_gentle: "因为皮普轻轻地靠近,小海龟觉得安心,愿意探出头来说话;",
        o_show: "因为皮普吐了漂亮的泡泡,小海龟好奇地探出头,露出了笑容;",
        o_wait: "因为皮普耐心地等待,小海龟被他的诚意打动,自己走了出来;"
      },
      cp3: {
        o_lullaby: "最后,大家一起哼了海底摇篮曲,大海安静下来,小海龟第一次笑着道了晚安。",
        o_thank: "最后,皮普夸小海龟勇敢,小海龟笑着说交朋友一点也不可怕。",
        o_wish: "最后,他们看着月亮许了愿,小海龟的愿望是明天还能和朋友们一起玩。"
      }
    },
    talk: {
      o_lullaby: "如果要唱一首海底摇篮曲,你想怎么唱呀?",
      o_thank: "你想对哪个朋友说\"你真勇敢\"呢?",
      o_wish: "看着月亮许愿的话,你会许什么愿望呀?"
    }
  },

  /* ============================================================
   * 故事 9 · 露娜和蒲公英的愿望
   * ============================================================ */
  {
    id: "luna-and-the-dandelion-wish",
    title: "露娜和蒲公英的愿望",
    synopsis: "小狐狸露娜遇到一朵会说话的愿望蒲公英,帮它找到回家的路,换来一个珍贵的愿望。",
    emoji: "🌼",
    coverImage: "story-luna-and-the-dandelion-wish.jpg",
    opening: {
      text: "月光森林的草地上,开满了毛茸茸的蒲公英。小狐狸露娜正散步呢,忽然听到一个细细的声音:\"嘿,你愿意听我说个秘密吗?\"露娜左看右看——原来是一朵特别大、特别亮的蒲公英!\"我是愿望蒲公英,\"它小声说,\"如果你帮我找到回家的路,我就送你一个愿望。\"露娜的耳朵竖了起来:\"好呀,我帮你!\"",
      scenePrompt: "fox dandelion meadow moon"
    },
    choicePoints: [
      {
        id: "cp1",
        prompt: "愿望蒲公英说,它的家在月光森林的另一头。先从哪里开始找呢?",
        options: [
          {
            id: "o_meadow",
            label: "穿过开满花的月光草地,仔细找找",
            hint: "好奇地四处看",
            trait: "curiosity",
            scenePrompt: "fox meadow dandelion flowers",
            text: "露娜带着愿望蒲公英,穿过一片开满小花的草地。月光下,白色的花瓣闪着柔柔的光。\"好漂亮呀!\"露娜东看看西看看。忽然,她发现了一条被蒲公英种子铺成的小路——\"看,这一定是通往你家的小路!\""
          },
          {
            id: "o_wind",
            label: "跟着风走,风吹向哪边就去哪边",
            hint: "想象风的方向",
            trait: "imagination",
            scenePrompt: "fox following wind moon",
            text: "露娜闭上眼睛,感受风的方向。\"风往哪边吹,我们就往哪边走!\"她举起蒲公英,一阵微风吹来,把蒲公英的种子吹向前方。\"跟上风!\"露娜开心地跑起来,跟着飘飞的种子一路向前。"
          },
          {
            id: "o_ask",
            label: "去问问草地上的蝴蝶",
            hint: "请朋友帮忙",
            trait: "cooperation",
            scenePrompt: "fox asking butterflies moon",
            text: "露娜看到一群蝴蝶在花丛中飞舞。\"请问,你们知道愿望蒲公英的家在哪里吗?\"蝴蝶们互相看了看:\"我们知道!沿着这条小溪走,过了蘑菇石桥就到啦!\"露娜谢过蝴蝶们,带着蒲公英出发了。"
          }
        ]
      },
      {
        id: "cp2",
        prompt: "走着走着,前面出现了一条小溪,桥断了。怎么过去呢?",
        options: [
          {
            id: "o_lily",
            label: "踩着水面上的睡莲叶子跳过去",
            hint: "勇敢地一跳",
            trait: "courage",
            scenePrompt: "fox jumping lily pads brook",
            text: "露娜看了看水面上的睡莲叶子,一片一片排得很近。\"我们可以跳过去!\"她深吸一口气,从一片叶子跳到另一片。水花溅起来,凉凉的,但她一点也不怕。跳、跳、跳——过啦!"
          },
          {
            id: "o_fish",
            label: "请水里的小鱼帮忙推一片叶子当船",
            hint: "朋友帮朋友",
            trait: "cooperation",
            scenePrompt: "fox leaf boat brook",
            text: "露娜弯下腰:\"小鱼小鱼,能帮我们过河吗?\"一条好心的鱼儿推来一片大大的睡莲叶子。\"上来吧!\"露娜和蒲公英坐在叶子上,小鱼推着他们,稳稳地过了河。\"谢谢你!\""
          },
          {
            id: "o_boat",
            label: "用树皮做一只小船划过去",
            hint: "自己动脑筋",
            trait: "creativity",
            scenePrompt: "fox bark boat brook",
            text: "露娜找来一块大大的树皮,折成一只小船的形状。\"上来吧,蒲公英!\"她把蒲公英放在船头,自己用小树枝当桨,划呀划。小船摇摇晃晃,但稳稳地到了对岸。\"我们到啦!\""
          }
        ]
      },
      {
        id: "cp3",
        prompt: "终于到了愿望蒲公英的家——一片开满蒲公英的金色山坡!蒲公英说:\"谢谢你,露娜,现在你可以许一个愿望了。\"许什么愿望呢?",
        options: [
          {
            id: "o_friend",
            label: "许愿交到一个最好的朋友",
            hint: "温暖的心愿",
            trait: "empathy",
            scenePrompt: "fox wishing for friend dandelion hill",
            text: "露娜闭上眼睛:\"我希望……能交到一个最好的朋友。\"话音刚落,一只小兔子从山坡那边蹦了过来。\"你好呀!我叫佩洛!\"露娜笑了——原来,最好的愿望,就是多了一个好朋友。"
          },
          {
            id: "o_fly",
            label: "许愿能飞上天空,摸摸星星",
            hint: "想象飞上天空",
            trait: "imagination",
            scenePrompt: "fox flying moon stars",
            text: "露娜闭上眼睛:\"我希望……能飞上天空,摸摸星星!\"蒲公英的种子变成了无数小伞,托着露娜慢慢飞了起来。她飞过树梢,飞过云朵,碰到了一颗小星星。\"你好呀,小星星!\"露娜开心地笑了。"
          },
          {
            id: "o_help",
            label: "许愿能帮助更多需要帮助的人",
            hint: "勇敢的心愿",
            trait: "courage",
            scenePrompt: "fox wishing to help others dandelion",
            text: "露娜闭上眼睛:\"我希望……能帮助更多需要帮助的朋友。\"蒲公英闪了闪光:\"真是一个勇敢的愿望。从今天起,你每帮助一个朋友,就会多一颗星星为你亮着。\"露娜笑了,心里暖暖的。"
          }
        ]
      }
    ],
    consequences: {
      cp1: {
        o_meadow: "因为露娜穿过草地仔细观察,她发现了蒲公英种子铺成的小路;",
        o_wind: "因为露娜跟着风走,蒲公英的种子带她找到了正确的方向;",
        o_ask: "因为露娜请教了蝴蝶,她得到了清楚的路线,沿着小溪出发了;"
      },
      cp3: {
        o_friend: "最后,露娜许愿交到好朋友,一只叫佩洛的小兔子蹦了过来,她笑了。",
        o_fly: "最后,露娜许愿飞上天空,蒲公英种子托着她飞过树梢,碰到了小星星。",
        o_help: "最后,露娜许愿帮助更多人,蒲公英告诉她每帮一个朋友就会多亮一颗星。"
      }
    },
    talk: {
      o_friend: "如果可以许愿交一个朋友,你想交什么样的朋友呀?",
      o_fly: "如果能飞上天空,你想去摸摸什么呢?",
      o_help: "你最近帮助过谁呀?帮完之后心里是什么感觉?"
    }
  },

  /* ============================================================
   * 故事 10 · 莫莫和最温暖的拥抱
   * ============================================================ */
  {
    id: "momo-and-the-warmest-hug",
    title: "莫莫和最温暖的拥抱",
    synopsis: "小熊莫莫想知道世界上最温暖的拥抱是什么样的,他走进雪地森林去寻找答案。",
    emoji: "🐻",
    coverImage: "story-momo-and-the-warmest-hug.jpg",
    opening: {
      text: "雪花飘飘的冬天,小熊莫莫坐在暖暖的树洞里,望着窗外发呆。\"妈妈说,世界上最温暖的东西是一个拥抱,\"莫莫想,\"可是,什么样的拥抱才是最温暖的呢?\"他围上小围巾,决定出门去找一找。",
      scenePrompt: "bear snowy forest winter"
    },
    choicePoints: [
      {
        id: "cp1",
        prompt: "莫莫走出树洞,外面白茫茫一片。从哪里开始找最温暖的拥抱呢?",
        options: [
          {
            id: "o_forest",
            label: "穿过雪地森林,慢慢找",
            hint: "坚持走下去",
            trait: "persistence",
            scenePrompt: "walking snowy forest search",
            text: "莫莫一步一步走进雪地森林。雪有点深,走起来有点累,但他没有停下。\"最温暖的拥抱一定在某个地方等着我。\"他给自己加油,继续往前走。走着走着,他看到了一串小小的脚印。"
          },
          {
            id: "o_friends",
            label: "去问问森林里的朋友们",
            hint: "大家一起找",
            trait: "cooperation",
            scenePrompt: "helper friends snow",
            text: "莫莫敲开了小松鼠的门。\"你知道什么样的拥抱最温暖吗?\"小松鼠想了想:\"我不太确定,但小鹿可能知道!\"莫莫又去找小鹿,小鹿说:\"我也不太确定,但我们一起找吧!\""
          },
          {
            id: "o_follow",
            label: "顺着雪地里的脚印走,看看是谁留下的",
            hint: "好奇地追一追",
            trait: "curiosity",
            scenePrompt: "following footprints snow",
            text: "莫莫蹲下来看雪地里的脚印——小小的,一串一串,通向森林深处。\"这是谁的呢?\"莫莫好奇地跟着脚印走。脚印绕过大石头,穿过灌木丛,最后停在一棵大松树下。"
          }
        ]
      },
      {
        id: "cp2",
        prompt: "顺着脚印,莫莫找到了一只冻得发抖的小雪兔。它迷路了!怎么帮它呢?",
        options: [
          {
            id: "o_help",
            label: "先帮小雪兔找到回家的路",
            hint: "温暖地帮忙",
            trait: "empathy",
            scenePrompt: "helping rabbit snow helper",
            text: "莫莫蹲下来,轻声说:\"别怕,我帮你回家。\"小雪兔抖了抖耳朵,小声说:\"我找不到家了……\"莫莫把自己的围巾解下来,围在小雪兔身上。\"走,我陪你找。\"小雪兔靠在莫莫身边,觉得暖和了一点。"
          },
          {
            id: "o_carry",
            label: "把小雪兔抱起来,一起走",
            hint: "大家一起走",
            trait: "cooperation",
            scenePrompt: "carrying rabbit snow",
            text: "\"来,我抱你走!\"莫莫把小雪兔轻轻抱起来,放在自己暖暖的怀里。小雪兔靠在莫莫毛茸茸的胸口,不再发抖了。\"谢谢你,\"它小声说。莫莫笑着,抱着小雪兔,顺着脚印往回走。"
          },
          {
            id: "o_brave",
            label: "鼓励小雪兔勇敢一点,一起走",
            hint: "勇敢地往前走",
            trait: "courage",
            scenePrompt: "brave rabbit carry snow",
            text: "莫莫握住小雪兔的爪子:\"别怕,我们一起走,一定找得到家!\"小雪兔看着莫莫坚定的眼神,鼓起了勇气。\"好!\"它们手拉手,踩着雪地里的脚印,一步一步往前走。"
          }
        ]
      },
      {
        id: "cp3",
        prompt: "莫莫帮小雪兔找到了家!雪兔妈妈跑出来,紧紧抱住了小雪兔。然后,她转向莫莫,张开双臂……",
        options: [
          {
            id: "o_hug",
            label: "接受雪兔妈妈的拥抱",
            hint: "温暖地接受",
            trait: "empathy",
            scenePrompt: "bear hugging rabbit mother",
            text: "莫莫愣了一下,然后张开双臂,接住了雪兔妈妈的拥抱。好暖好暖呀!像阳光照在身上,像热可可喝进肚子里。\"谢谢你,莫莫,\"雪兔妈妈说,\"你救了我的宝贝。\"莫莫的眼眶有点湿——原来,这就是最温暖的拥抱。"
          },
          {
            id: "o_share",
            label: "叫上所有帮忙的朋友一起拥抱",
            hint: "大家一起抱",
            trait: "cooperation",
            scenePrompt: "bear group hug friends snow",
            text: "莫莫叫来了一路帮忙的小松鼠和小鹿。\"来,大家一起!\"他们围成一圈,紧紧地抱在一起。小松鼠的尾巴软软的,小鹿的毛暖暖的,小雪兔在中间咯咯笑。\"原来,和朋友一起抱,才是最温暖的!\"莫莫开心地说。"
          },
          {
            id: "o_lullaby",
            label: "在温暖的拥抱里,轻轻哼一首歌",
            hint: "想象温暖的歌声",
            trait: "imagination",
            scenePrompt: "snowball home lullaby",
            text: "莫莫在雪兔妈妈的拥抱里,轻轻哼起一首歌:\"雪花飘呀飘,抱抱暖呀暖……\"小雪兔听着歌,靠在妈妈怀里,慢慢地闭上了眼睛。莫莫也觉得好困好暖和。\"原来,最温暖的拥抱,是在你帮助了别人之后,别人抱住你的那一下。\""
          }
        ]
      }
    ],
    consequences: {
      cp1: {
        o_forest: "因为莫莫坚持穿过雪地森林,他发现了雪地里的小脚印,找到了线索;",
        o_friends: "因为莫莫请朋友们帮忙,小松鼠和小鹿一起加入,大家一起找;",
        o_follow: "因为莫莫好奇地跟着脚印走,他找到了一只迷路的小雪兔;"
      },
      cp3: {
        o_hug: "最后,莫莫接受了雪兔妈妈的拥抱,发现这就是世界上最温暖的拥抱。",
        o_share: "最后,莫莫和所有朋友抱在一起,发现和朋友一起抱才是最温暖的。",
        o_lullaby: "最后,莫莫在拥抱里哼起了歌,明白了最温暖的拥抱来自帮助别人之后。"
      }
    },
    talk: {
      o_hug: "你觉得什么样的拥抱最温暖呀?",
      o_share: "你想和谁一起抱一抱呢?",
      o_lullaby: "如果在拥抱里唱一首歌,你想唱什么呀?"
    }
  }
];

/* ------------------------------------------------------------
 * 关卡信息:用于关卡选择列表
 * ------------------------------------------------------------ */
const LEVELS = [
  { id: "luna-and-the-moon",            emoji: "🦊", title: "露娜和丢失的月亮角", sub: "帮月亮找回缺掉的一角" },
  { id: "the-sneezing-cloud",           emoji: "☁️", title: "爱打喷嚏的云朵",     sub: "照顾一朵感冒的小云朵" },
  { id: "the-mushroom-post",            emoji: "🍄", title: "蘑菇邮局的信",       sub: "送一封没有地址的信" },
  { id: "the-singing-brook",            emoji: "🎶", title: "会唱歌的小溪",       sub: "帮小溪找回歌声" },
  { id: "the-star-lighthouse",          emoji: "🌟", title: "星星灯塔",           sub: "让熄灭的星星重新亮起来" },
  { id: "luna-and-the-lost-firefly",    emoji: "✨", title: "露娜和迷路的小萤火虫", sub: "送迷路的小萤火虫回家" },
  { id: "pawlo-and-the-first-star",     emoji: "🐰", title: "佩洛和第一颗星",     sub: "帮第一颗星重新亮起来" },
  { id: "pip-and-the-shy-turtle",       emoji: "🐢", title: "皮普和害羞的小海龟", sub: "帮害羞的小海龟交朋友" },
  { id: "luna-and-the-dandelion-wish",  emoji: "🌼", title: "露娜和蒲公英的愿望", sub: "帮愿望蒲公英找到家" },
  { id: "momo-and-the-warmest-hug",     emoji: "🐻", title: "莫莫和最温暖的拥抱", sub: "寻找世界上最温暖的拥抱" }
];

window.STORIES = STORIES;
window.LEVELS = LEVELS;
