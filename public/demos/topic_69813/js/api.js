// API配置和调用封装
const API_CONFIG = {
    // 讯飞方言识别API
    XUNFEI: {
        appId: '', // 从localStorage加载
        apiKey: '', // 从localStorage加载
        url: 'wss://iat-api.xfyun.cn/v2/iat'
    },
    // 大模型API（豆包/通义千问/DeepSeek）
    LLM: {
        apiKey: '', // 从localStorage加载
        url: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions' // 豆包API
    },
    // AI绘图API（通义万相）
    IMAGE: {
        apiKey: '', // 从localStorage加载
        url: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis'
    }
};

// 加载API配置
function loadApiConfigFromStorage() {
    const saved = localStorage.getItem('xiangyin_api_config');
    if (saved) {
        const config = JSON.parse(saved);
        API_CONFIG.XUNFEI.appId = config.xunfeiAppId || '';
        API_CONFIG.XUNFEI.apiKey = config.xunfeiKey || '';
        API_CONFIG.LLM.apiKey = config.llmKey || '';
        API_CONFIG.IMAGE.apiKey = config.imageKey || '';
    }
}

// 检查API是否已配置
function isApiConfigured(type) {
    switch(type) {
        case 'xunfei':
            return API_CONFIG.XUNFEI.appId && API_CONFIG.XUNFEI.apiKey;
        case 'llm':
            return API_CONFIG.LLM.apiKey;
        case 'image':
            return API_CONFIG.IMAGE.apiKey;
        default:
            return false;
    }
}

// 方言识别API调用
async function recognizeDialect(audioBlob, dialect) {
    console.log('识别方言:', dialect, '音频大小:', audioBlob.size);
    
    // 检查是否配置了讯飞API
    if (isApiConfigured('xunfei')) {
        try {
            // TODO: 接入讯飞方言识别API
            // 讯飞语音听写API文档: https://www.xfyun.cn/doc/iat/lfasr/API.html
            // 需要实现WebSocket连接和音频流传输
            console.log('使用讯飞API进行方言识别...');
            
            // 这里预留真实API调用位置
            // const result = await callXunfeiAPI(audioBlob, dialect);
            // return result;
        } catch (error) {
            console.error('讯飞API调用失败:', error);
            showToast('API调用失败，使用演示数据', 'error');
        }
    }
    
    // 使用演示数据
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 每个方言提供多个mock故事，随机选择
    const mockResults = {
        cantonese: [
            '从前有个月亮婆婆，佢每晚都会出嚟同细路仔讲故事。有一晚，佢讲咗一个关于星星嘅故事，话星星其实系天上嘅灯笼，入面住住好多好多嘅小精灵。',
            '我细个嗰阵，阿嫲成日同我讲，海边有个水晶宫，入面住着龙王。每逢台风嚟之前，龙王就会托梦畀渔民，叫佢哋唔好出海。',
            '听老人家讲，以前有个放牛嘅细路，佢喺山上执到一只受伤嘅白鹤。佢细心照顾白鹤，后来白鹤变成咗一个靓女，同佢做咗夫妻。'
        ],
        minnan: [
            '古早时阵，有一只龙女，伊真水真善良。每日暝时，伊都会来到海边，听渔人唱歌。有一工，伊听到一个少年耶的歌声，真动听，伊就决定去见伊。',
            '阿公讲过，早期咱庄头有一棵大榕树，树下有土地公庙。每年元宵，全村的人都会来拜拜，求平安。',
            '小时候，阿嬷都会讲古，讲说海边有一个仙岛，岛上有会唱歌的石头，每到月夜就会发出美妙的声音。'
        ],
        sichuan: [
            '我们那个山里头哦，有个老猎人，打了一辈子的猎。他跟我说，山里有只白虎，通灵的，见了好几次都没打到。后来我才晓得，那是山神变的，护到我们的。',
            '我们坝坝头有个张婆婆，她讲的龙门阵多得很。她说以前嘉陵江里有只大乌龟，背上能跑马，每到涨水天就出来救人。',
            '小时候听爷爷摆龙门阵，说峨眉山上有只灵猴，会帮采药的人带路，但是心肠不好的人永远找不到它。'
        ],
        shanghai: [
            '小时候，弄堂里向有个老爷爷，伊会讲老多老多个故事。有趟伊讲，从前有个小人，伊有一只会飞个鞋子，穿着就可以飞到天浪去。',
            '阿拉弄堂里有个王阿婆，伊讲外滩以前是一片滩涂，有个渔伢儿救了一只海龟，海龟就送伊一颗夜明珠。',
            '我记得小时候，外婆讲黄浦江里有一条神龙，每逢下雨天就会飞出来，保佑上海滩平平安安。'
        ],
        zhejiang: [
            '阿拉浙江有个老底子个故事，讲西湖边上有条白蛇，修炼了千年，变成个漂亮姑娘。有一天，伊碰到个放牛个小伙子，两个一眼就认得嘞。',
            '我奶奶讲过，绍兴有个酿酒师傅，伊酿个酒香得连天上个神仙都馋。后来神仙下凡来偷学手艺，被师傅发现嘞。',
            '小时候爷爷讲，钱塘江潮水里头有条龙，每年八月十八出来翻跟斗，所以潮水才会介大。'
        ],
        dongbei: [
            '咱那疙瘩有个老猎人，打了一辈子猎。他说山里有只白虎，可神了，见了好几回都没打着。后来我才知道，那是山神变的，护着咱们的。',
            '我们屯子里有个老萨满，他说长白山上有个天池，池子里住着龙王爷。每到冬天，龙王爷就变成白胡子老头下山串门。',
            '我奶奶讲，松花江里有条大鱼，得有房子那么大。每到月圆夜，它就浮上来唱歌，歌声能传十里地。'
        ],
        other: [
            '从前有座山，山里有座庙，庙里有个老和尚给小和尚讲故事。',
            '我们村头有棵老槐树，据说有几百年的历史。老人们说，树下埋着一口古井，井水能治百病。',
            '小时候听老人讲，村后的山洞里住着一位仙人，他有一面宝镜，能照见千里之外发生的事情。'
        ]
    };
    
    // 随机选择一个故事
    const dialectStories = mockResults[dialect] || mockResults.other;
    const randomIndex = Math.floor(Math.random() * dialectStories.length);
    
    return {
        success: true,
        text: dialectStories[randomIndex],
        dialect: dialect
    };
}

// 大模型故事润色
async function polishStory(rawText, dialect) {
    console.log('润色故事:', rawText.substring(0, 50) + '...');
    
    // 检查是否配置了大模型API
    if (isApiConfigured('llm')) {
        try {
            // TODO: 接入真实大模型API
            // 豆包API示例:
            // const response = await fetch(API_CONFIG.LLM.url, {
            //     method: 'POST',
            //     headers: {
            //         'Content-Type': 'application/json',
            //         'Authorization': `Bearer ${API_CONFIG.LLM.apiKey}`
            //     },
            //     body: JSON.stringify({
            //         model: 'doubao-pro-32k',
            //         messages: [{
            //             role: 'system',
            //             content: '你是一位专业的民间故事编辑。请将以下方言口述内容润色为一个优美的故事，包含标题和正文。正文用\\n\\n分段。'
            //         }, {
            //             role: 'user',
            //             content: rawText
            //         }]
            //     })
            // });
            // const data = await response.json();
            // const content = data.choices[0].message.content;
            // const titleMatch = content.match(/标题[：:]\s*(.+)/);
            // const contentMatch = content.replace(/标题[：:].+\n/, '');
            // return { title: titleMatch ? titleMatch[1] : '方言故事', content: contentMatch };
            console.log('使用大模型API润色故事...');
        } catch (error) {
            console.error('大模型API调用失败:', error);
            showToast('API调用失败，使用演示数据', 'error');
        }
    }
    
    // 使用演示数据
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 根据用户输入动态生成故事
    const dialectNames = {
        cantonese: '粤语',
        minnan: '闽南语',
        sichuan: '四川话',
        shanghai: '上海话',
        zhejiang: '浙江话',
        dongbei: '东北话',
        other: '方言'
    };
    
    // 故事模板库（每个方言多个模板，随机选择）
    const storyTemplates = {
        cantonese: [
            {
                title: '月亮婆婆的故事',
                content: '在很久很久以前，天上住着一位慈祥的月亮婆婆。每当夜幕降临，她就会提着银色的灯笼，缓缓走过天际，为大地洒下柔和的光芒。\n\n月亮婆婆最喜欢做的事情，就是给地上的孩子们讲故事。她的声音温柔而悠远，像是从很远很远的地方传来，却又清晰地落在每个孩子的耳边。\n\n有一个夏夜，月亮婆婆讲起了星星的故事。她说，每一颗星星里都住着一个小精灵，他们提着小小的灯笼，在夜空中飞舞。当孩子们仰望星空时，那些小精灵就会眨眨眼睛，和他们打招呼。\n\n从那以后，每当孩子们看到星星闪烁，就知道那是小精灵在向他们问好。而月亮婆婆的故事，也一代一代地传了下来，成为了最美丽的民间传说。'
            },
            {
                title: '水晶宫的传说',
                content: '在南海的深处，有一座水晶宫，里面住着龙王和他的子民。龙王有个美丽的女儿，她最喜欢听渔人们的歌声。\n\n每当月圆之夜，龙女就会浮出水面，静静地听着岸上的歌声。她的眼睛像星星一样闪亮，她的笑容比月光还要温柔。\n\n有一天，一位年轻的渔人唱起了歌，他的歌声清澈动人，像海风拂过琴弦。龙女被这歌声深深吸引，决定现身与这位渔人相见。\n\n从那以后，每当月圆之夜，海边就会响起两人的歌声。渔人们说，那是龙女在守护着这片海，守护着每一个善良的人。'
            },
            {
                title: '白鹤姑娘',
                content: '从前有个放牛的细路，他心地善良，总是帮助弱小。有一天，他在山上发现了一只受伤的白鹤。\n\n细路细心照顾白鹤，给它喂食，为它包扎伤口。白鹤渐渐康复，但它没有飞走，而是留在了细路身边。\n\n日子一天天过去，白鹤变成了一个美丽的姑娘。她说她是天上的仙女，因为犯错被贬下凡，是细路的善良救了她。\n\n后来，白鹤姑娘和细路成了夫妻，他们一起帮助村里的人，过着幸福的生活。这个故事告诉我们，善良的心会得到最好的回报。'
            }
        ],
        minnan: [
            {
                title: '龙女的传说',
                content: '在古老的年代，海边住着一位美丽的龙女。她有着银色的鳞片和温柔的眼眸，每天夜晚都会来到海边，静静地听着渔人们的歌声。\n\n龙女的心地善良，她会在风暴来临前，用歌声警告渔人不要出海；会在鱼群稀少时，悄悄引导鱼群回到渔场。渔人们虽然看不到她，却都感受到她的守护。\n\n有一天，龙女听到了一位年轻渔人的歌声。那歌声清澈而动人，像海风拂过琴弦。龙女被这歌声深深吸引，决定现身与这位渔人相见。\n\n当月光洒在海面上，龙女从水中缓缓升起。渔人看到她的瞬间，忘记了呼吸。从那以后，每当月圆之夜，海边就会响起两人的歌声，成为了当地最美的传说。'
            },
            {
                title: '大榕树的守护',
                content: '早期咱庄头有一棵大榕树，树下有土地公庙。这棵树已经有几百年的历史了，它的根深深扎进土里，枝叶茂盛，像一把巨大的伞。\n\n每年元宵，全村的人都会来拜拜，求平安。老人们说，这棵榕树有灵性，它会保护村里的人。\n\n有一年台风来袭，狂风暴雨，很多房子都被吹倒了。但奇怪的是，榕树周围的房子都安然无恙。人们说，是土地公和榕树一起守护了大家。\n\n从那以后，人们对这棵榕树更加敬重。每逢节日，都会在树下点灯，感谢它的守护。'
            },
            {
                title: '会唱歌的石头',
                content: '小时候，阿嬷都会讲古，讲说海边有一个仙岛，岛上有会唱歌的石头。\n\n据说，这些石头平时看起来和普通的石头没什么两样。但每到月夜，当月光照在它们身上时，它们就会发出美妙的声音。\n\n那声音像海浪，像风声，像天上仙乐的合奏。听到这声音的人，都会感到心里平静，所有的烦恼都会消失。\n\n有人说，这些石头是天上掉下来的星星变的。也有人说，它们是海底龙宫的音乐盒。但没有人真正见过它们唱歌的样子。\n\n阿嬷说，只有心地纯净的人，才能在月夜听到那美妙的歌声。'
            }
        ],
        sichuan: [
            {
                title: '山里的老猎人',
                content: '在我们那片深山里，住着一位老猎人。他打了一辈子的猎，对每一座山头、每一条溪流都了如指掌。\n\n老猎人常跟我说，山里有一只白虎，通灵的。他说见过好几次，可每次都没打到。那白虎像是知道他在哪里，总能巧妙地避开。\n\n后来我才明白，那白虎是山神变的。它守护着这片山林，守护着山里的生灵。老猎人知道后，放下了猎枪，成了山林的守护者。\n\n他常对年轻人说："山有山的规矩，人有人的本分。我们靠山吃山，也要护山爱山。"这句话，成了山里人世世代代的信条。'
            },
            {
                title: '嘉陵江的大乌龟',
                content: '我们坝坝头有个张婆婆，她讲的龙门阵多得很。她说以前嘉陵江里有只大乌龟，背上能跑马，每到涨水天就出来救人。\n\n有一年发大水，江水暴涨，很多房子都被淹了。就在这时候，大乌龟出现了。它让落水的人爬到它背上，然后把他们送到安全的地方。\n\n张婆婆说，那只大乌龟是江神变的，专门保护江边的人。后来人们为了感谢它，在江边修了一座庙，供奉着乌龟神。\n\n每逢涨水天，人们都会去庙里烧香，求江神保佑。这个传说一直传到现在，成了我们坝坝头最出名的故事。'
            },
            {
                title: '峨眉山的灵猴',
                content: '小时候听爷爷摆龙门阵，说峨眉山上有只灵猴，会帮采药的人带路，但是心肠不好的人永远找不到它。\n\n爷爷说，那只灵猴通体雪白，眼睛像两颗红宝石。它知道山上所有的草药在哪里，也会分辨哪些是救人的药，哪些是害人的毒草。\n\n有一次，一个好心的人上山采药，迷了路。灵猴出现了，带着他找到了最珍贵的草药。但如果是坏人上山，灵猴就会把他引到悬崖边，让他摔个跟头。\n\n爷爷说，灵猴是山神的使者，专门考验人心。只有心地善良的人，才能得到它的帮助。'
            }
        ],
        shanghai: [
            {
                title: '会飞的鞋子',
                content: '小时候，弄堂里有个老爷爷，他讲的故事比天上的星星还多。每次我们围坐在他身边，他都会讲一个神奇的故事。\n\n有一回，他讲了一个关于会飞的鞋子的故事。从前有个小人，他有一双神奇的鞋子，穿上它就能飞到天上去。\n\n小人穿着这双鞋子，飞过了高楼大厦，飞过了黄浦江，飞到了云朵上面。他在云里穿梭，和鸟儿一起唱歌，和风儿一起跳舞。\n\n后来，小人用这双鞋子帮助了很多需要帮助的人。他飞到高楼上救下被困的小猫，飞到江对岸送去紧急的药品，飞到云朵上收集雨水给干旱的田地。\n\n老爷爷说，其实每个人心里都有一双会飞的鞋子，只要你愿意帮助别人，那双鞋子就会带你飞起来。'
            },
            {
                title: '外滩的夜明珠',
                content: '阿拉弄堂里有个王阿婆，伊讲外滩以前是一片滩涂，有个渔伢儿救了一只海龟，海龟就送伊一颗夜明珠。\n\n那颗夜明珠可神奇了，晚上会发出柔和的光，把整个弄堂都照亮了。渔伢儿用这颗珠子帮助了很多穷人，让他们在黑暗中找到路。\n\n后来，夜明珠的光越来越亮，连天上的星星都嫉妒它。月亮婆婆就派了星星下凡，想把夜明珠偷走。\n\n但是渔伢儿把夜明珠藏得很好，星星们找不到，只好回去了。王阿婆说，那颗夜明珠现在还藏在滩涂下面，等着有缘人来发现它。\n\n每次经过外滩，我都会想，那颗夜明珠是不是还在发光呢？'
            },
            {
                title: '黄浦江的神龙',
                content: '我记得小时候，外婆讲黄浦江里有一条神龙，每逢下雨天就会飞出来，保佑上海滩平平安安。\n\n外婆说，那条神龙是金色的，它的鳞片像金子一样闪闪发光。每当暴雨来临，它就会从江里飞出来，用身体挡住洪水，保护岸上的人。\n\n有一年发大水，江水暴涨，眼看就要淹没整个上海滩。就在这时候，神龙出现了。它张开大嘴，把洪水都吞了进去，然后化作一道金光，消失在云端。\n\n从那以后，上海滩就再也没有发过大水。人们说，是神龙在天上守护着我们。每逢下雨天，外婆都会对着天空说："谢谢神龙保佑。"'
            }
        ],
        zhejiang: [
            {
                title: '白蛇传',
                content: '阿拉浙江有个老底子个故事，讲西湖边上有条白蛇，修炼了千年，变成个漂亮姑娘。\n\n有一天，白姑娘在断桥边碰到个放牛个小伙子。两个一眼就认得嘞，后来就成了一对。\n\n但是有个和尚说，白姑娘是蛇精变的，要害小伙子。他就用个金钵把白姑娘压在雷峰塔底下。\n\n小伙子天天在塔边哭，他的真心感动了天上的神仙。神仙就派了只仙鹤，把白姑娘救了出来。\n\n后来，白姑娘和小伙子又在一起了，他们在西湖边过着幸福的日子。这个故事告诉我们，真心相爱的人，总会在一起的。'
            },
            {
                title: '绍兴酿酒师傅',
                content: '我奶奶讲过，绍兴有个酿酒师傅，伊酿个酒香得连天上个神仙都馋。\n\n有一天，一个白胡子老头来买酒，喝了一碗又一碗，就是不给钱。师傅也不生气，还给他添酒。\n\n老头喝醉了，就说："我是天上的酒仙，你的酒太好了，我想偷学你的手艺。"\n\n师傅笑着说："手艺可以教，但你得答应我，酿出来的酒要先给穷人喝。"\n\n酒仙答应了，就教了师傅一个秘方。从那以后，师傅酿的酒更好喝了，而且他总是给穷人留一半。\n\n奶奶说，那个酒仙后来经常来，和师傅成了好朋友。'
            },
            {
                title: '钱塘江的龙',
                content: '小时候爷爷讲，钱塘江潮水里头有条龙，每年八月十八出来翻跟斗，所以潮水才会介大。\n\n爷爷说，那条龙是东海龙王的儿子，它最喜欢看人间的美景。钱塘江的风景太好了，它就决定住在这里。\n\n每年八月十八，龙太子就会在江里翻跟斗，掀起大浪。人们说，这是龙太子在向大家问好。\n\n有一年，龙太子生病了，潮水变得很小。渔民们都很着急，因为潮水小了，鱼就少了。\n\n大家就在江边烧香，求龙太子快点好起来。龙太子感受到了大家的真心，病就好了，潮水又变得很大了。\n\n从那以后，每年八月十八，大家都会去江边看潮，感谢龙太子。'
            }
        ],
        dongbei: [
            {
                title: '山神白虎',
                content: '在咱那疙瘩的深山里，有个老猎人，打了一辈子猎。他对这片山林熟得很，哪座山有啥野兽，哪条沟有啥野兽，他都门儿清。\n\n老猎人跟我说，山里有只白虎，可神了。他说见了好几回，可每回都没打着。那白虎像是能未卜先知，总能躲开他的枪口。\n\n后来我才知道，那白虎是山神变的。它守着这片山林，护着山里的生灵。老猎人知道后，放下了猎枪，成了山林的守护者。\n\n他常跟年轻人说："咱靠山吃山，也得护山爱山。山有山的规矩，人有人的本分。"这话，成了山里人世世代代的规矩。'
            },
            {
                title: '天池的龙王爷',
                content: '我们屯子里有个老萨满，他说长白山上有个天池，池子里住着龙王爷。\n\n老萨满说，龙王爷是个白胡子老头，每到冬天就会下山串门。他会变成普通人的样子，到屯子里喝酒聊天。\n\n有一年冬天，一个白胡子老头来屯子里，和大家都处得很好。他讲了很多山里的故事，还教大家怎么保护山林。\n\n后来大家才知道，那个老头就是龙王爷。他看到大家心地善良，就特意来和大家交朋友。\n\n从那以后，每年冬天，龙王爷都会来屯子里住几天。大家也不害怕，反而很高兴，因为龙王爷会带来好运气。'
            },
            {
                title: '松花江的大鱼',
                content: '我奶奶讲，松花江里有条大鱼，得有房子那么大。每到月圆夜，它就浮上来唱歌，歌声能传十里地。\n\n奶奶说，那条鱼是江神的宠物，它的歌声能让人忘记烦恼，心里变得平静。\n\n有一年大旱，松花江的水都快干了。渔民们都很着急，因为没水就没鱼，没鱼就没饭吃。\n\n大家就在江边唱歌，求江神帮忙。那条大鱼听到了，就浮上来，用它的歌声唤来了雨水。\n\n从那以后，每逢月圆夜，大家都会去江边听大鱼唱歌。奶奶说，那是江神在保佑我们。'
            }
        ],
        other: [
            {
                title: '山里的小故事',
                content: '从前有座山，山里有座庙，庙里有个老和尚给小和尚讲故事。\n\n老和尚说，这座山已经有几百年的历史了。山上的每一棵树，每一块石头，都有自己的故事。\n\n小和尚问："师父，那您能给我讲讲吗？"\n\n老和尚笑着说："好啊，那得从很久很久以前说起……"\n\n就这样，一个故事接着一个故事，从日出讲到日落，从月升讲到月落。小和尚听得入了迷，原来这座看似普通的山，竟然藏着这么多神奇的传说。\n\n从那以后，小和尚也学会了讲故事。每当有新来的小和尚，他就会坐在庙前的老槐树下，把这些故事一代一代地传下去。'
            },
            {
                title: '老槐树的秘密',
                content: '我们村头有棵老槐树，据说有几百年的历史。老人们说，树下埋着一口古井，井水能治百病。\n\n但是，这口井只有在月圆之夜才会显现。而且，只有心地纯净的人才能看到它。\n\n有一年，村里闹瘟疫，很多人都病了。一个善良的年轻人决定去寻找那口古井。\n\n他在月圆之夜来到老槐树下，诚心祈祷。突然，地面裂开，一口古井出现在他面前。\n\n年轻人用井水治好了村里的人。从那以后，大家都更加敬重这棵老槐树，也明白了善良的力量。'
            },
            {
                title: '仙人的宝镜',
                content: '小时候听老人讲，村后的山洞里住着一位仙人，他有一面宝镜，能照见千里之外发生的事情。\n\n仙人用这面宝镜帮助了很多需要帮助的人。他会提前告诉渔民哪里有大鱼，告诉农民什么时候下雨，告诉人们哪里有危险。\n\n但是，宝镜也有一个限制：它只能照见善良的事情。如果是坏事，宝镜就会变得模糊不清。\n\n有一天，一个坏人想偷走宝镜，用它来做坏事。但是当他拿起宝镜时，宝镜突然消失了。\n\n仙人说，宝镜只属于心地善良的人。从那以后，再也没人敢打宝镜的主意了。'
            }
        ]
    };
    
    // 根据方言获取故事模板
    const templates = storyTemplates[dialect] || storyTemplates.other;
    
    // 如果用户输入了具体内容，尝试匹配关键词
    let selectedStory;
    if (rawText && rawText.length > 10) {
        // 根据输入内容选择最相关的故事
        const keywords = rawText.toLowerCase();
        
        // 简单的关键词匹配
        if (keywords.includes('月亮') || keywords.includes('星星')) {
            selectedStory = templates[0];
        } else if (keywords.includes('海') || keywords.includes('龙') || keywords.includes('渔')) {
            selectedStory = templates[1] || templates[0];
        } else if (keywords.includes('山') || keywords.includes('猎') || keywords.includes('虎')) {
            selectedStory = templates[0];
        } else {
            // 随机选择一个
            selectedStory = templates[Math.floor(Math.random() * templates.length)];
        }
    } else {
        // 随机选择一个
        selectedStory = templates[Math.floor(Math.random() * templates.length)];
    }
    
    return selectedStory;
}

// AI绘图生成
async function generateIllustration(text, style) {
    console.log('生成插图:', text.substring(0, 30) + '...', '风格:', style);
    
    // 检查是否配置了AI绘图API
    if (isApiConfigured('image')) {
        try {
            // TODO: 接入真实AI绘图API
            // 通义万相API示例:
            // const response = await fetch(API_CONFIG.IMAGE.url, {
            //     method: 'POST',
            //     headers: {
            //         'Content-Type': 'application/json',
            //         'Authorization': `Bearer ${API_CONFIG.IMAGE.apiKey}`
            //     },
            //     body: JSON.stringify({
            //         model: 'wanx-v1',
            //         input: {
            //             prompt: `${style} style illustration: ${text.substring(0, 100)}`
            //         },
            //         parameters: {
            //             size: '1024*1024',
            //             n: 1
            //         }
            //     })
            // });
            // const data = await response.json();
            // return { success: true, imageUrl: data.output.results[0].url };
            console.log('使用AI绘图API生成插图...');
        } catch (error) {
            console.error('AI绘图API调用失败:', error);
            showToast('API调用失败，使用演示数据', 'error');
        }
    }
    
    // 使用演示数据
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    const styleEmojis = {
        ink: ['🏔️', '🌙', '🎋', '🏯', '🌸'],
        newyear: ['🧧', '🎊', '🎏', '🏮', '🎎'],
        children: ['🌈', '⭐', '🎨', '🦋', '🌺'],
        watercolor: ['🌊', '🌸', '☁️', '🌿', '🕊️']
    };
    
    const emojis = styleEmojis[style] || styleEmojis.children;
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    
    return {
        success: true,
        emoji: randomEmoji,
        placeholder: true
    };
}

// 页面加载时初始化API配置
loadApiConfigFromStorage();

// 导出API函数
window.API = {
    recognizeDialect,
    polishStory,
    generateIllustration
};
