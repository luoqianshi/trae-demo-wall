let DEMO_MODE = true;

const API_CONFIG = {
    BACKEND_URL: '/api',
    TIMEOUT: 15000
};

const aiService = {
    async healthConsult(userText) {
        if (DEMO_MODE) {
            return new Promise(resolve => {
                setTimeout(() => {
                    resolve("奶奶，您说的头疼问题，建议您先测一下血压，多休息，如果持续不适请去医院看看。");
                }, 1000);
            });
        }
        
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
            
            const response = await fetch(API_CONFIG.BACKEND_URL + '/health-consult', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ userText }),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error('HTTP error! status: ' + response.status);
            }
            
            const data = await response.json();
            return data.success ? data.content : data.content || "网络不太好，请稍后再试试。";
        } catch (error) {
            if (error.name === 'AbortError') {
                console.error('API调用超时:', error);
                return "网络有点慢，请稍后再试试。";
            }
            console.error('API调用失败:', error);
            return "网络不太好，请稍后再试试。";
        }
    },

    async generateScamQuestion() {
        if (DEMO_MODE) {
            return new Promise(resolve => {
                setTimeout(() => {
                    resolve({
                        id: Date.now(),
                        title: "电话欠费骗局",
                        description: "你接到一个电话，对方说：'你好，你的电话欠费了，已经停机。请尽快充值，否则将影响你的使用。'",
                        options: [
                            { text: "马上充值缴费", correct: false, feedback: "先别急！这可能是骗子的圈套。运营商不会这样电话催费。" },
                            { text: "挂断电话，自己去营业厅或官方APP查询", correct: true, feedback: "太棒了！这才是正确的做法。要通过官方渠道核实。" },
                            { text: "拨打对方提供的电话咨询", correct: false, feedback: "对方的电话是假的！要打运营商官方电话查询。" }
                        ]
                    });
                }, 1500);
            });
        }
        
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
            
            const response = await fetch(API_CONFIG.BACKEND_URL + '/generate-ai-quiz', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({}),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error('HTTP error! status: ' + response.status);
            }
            
            const data = await response.json();
            
            if (data.success) {
                let question = data.data;
                if (Array.isArray(data.data) && data.data.length > 0) {
                    question = data.data[0];
                }
                if (question && typeof question === 'object' && question.title) {
                    question.id = Date.now();
                    return question;
                }
            }
            return null;
        } catch (error) {
            console.error('AI生成题目失败:', error);
            return null;
        }
    },

    async imageRecognition(base64Image) {
        if (DEMO_MODE) {
            return new Promise(resolve => {
                setTimeout(() => {
                    resolve("识别结果：\n1. 药名：阿莫西林胶囊\n2. 用法：一次一粒，一日两次\n3. 注意：对青霉素过敏者禁用");
                }, 1500);
            });
        }
        
        try {
            const controller = new AbortController();
            const IMAGE_TIMEOUT = 60000;
            const timeoutId = setTimeout(() => controller.abort(), IMAGE_TIMEOUT);
            
            const response = await fetch(API_CONFIG.BACKEND_URL + '/image-recognition', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ base64Image }),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error('HTTP error! status: ' + response.status);
            }
            
            const data = await response.json();
            return data.success ? data.content : data.content || "图片识别失败，请重新拍照试试。";
        } catch (error) {
            if (error.name === 'AbortError') {
                console.error('图片识别超时:', error);
                return "图片识别时间较长，请稍后再试";
            }
            console.error('图片识别失败:', error);
            return "图片识别失败，请重新拍照试试。";
        }
    }
};

const dailyTips = [
    "真警察不会电话办案，更不会让你转账到安全账户。",
    "天上不会掉馅饼，免费的东西最贵。",
    "接到陌生电话说你中奖了，直接挂断就行。",
    "保健品不能治病，生病要去医院看医生。",
    "不要告诉陌生人你的银行卡号和密码。",
    "有人让你转钱，先问问家人或打110核实。",
    "公检法不会让你下载任何APP做笔录。",
    "扫码免费领东西，可能是要盗你的信息。",
    "陌生人说你家孩子出事了，先给孩子打电话确认。",
    "养老投资稳赚不赔的，都是骗人的。"
];

const scenarios = [
    {
        id: 1,
        title: "电话里的'警察'",
        description: "你接到一个电话，对方说：'你好，我是市公安局的，你的身份证被人冒用办了银行卡，涉嫌洗钱。现在需要你把钱转到安全账户配合调查。'",
        options: [
            { text: "马上把钱转到对方说的账户", correct: false, feedback: "真警察不会电话办案，更不会让你转账！这是典型的冒充公检法骗局。" },
            { text: "挂断电话，拨打110核实", correct: true, feedback: "太棒了！这才是正确的做法！先挂断再打110核实，真警察会支持你这样做的。" },
            { text: "问对方警号，然后转账", correct: false, feedback: "骗子也会报假警号！正确的做法是挂断后自己打110核实。" }
        ]
    },
    {
        id: 2,
        title: "孙子出事了",
        description: "你接到一个电话，对方哭着说：'奶奶/爷爷，我跟人打架被抓了，需要交保释金。你别告诉我爸妈，他们会打死我的。快转3万块到这个账号。'",
        options: [
            { text: "心疼孙子，马上去银行转账", correct: false, feedback: "先别急！这很可能是骗子冒充你孙子。声音像不代表就是本人。" },
            { text: "先给孙子的父母打电话确认", correct: true, feedback: "太棒了！遇到这种情况一定要先核实。骗子就是利用老人的心疼心理。" },
            { text: "让对方再说几句话听听声音", correct: false, feedback: "AI可以模仿声音，听声音也不保险。还是要打电话给家人核实。" }
        ]
    },
    {
        id: 3,
        title: "免费体检的诱惑",
        description: "你在小区门口遇到一个年轻人，说：'阿姨/叔叔，我们在做社区健康关爱活动，免费体检还专车接送，还有礼品送。您跟我去看看吧。'",
        options: [
            { text: "有免费体检，跟着去看看", correct: false, feedback: "免费体检往往是推销高价保健品的第一步，去了就会被忽悠买东西。" },
            { text: "拒绝并告诉对方'我不需要'", correct: true, feedback: "太棒了！真正的社区体检会通过居委会通知，不会在小区门口拉人。" },
            { text: "先记下对方电话，以后再去", correct: false, feedback: "不要留电话！他们会天天打电话骚扰你，直到你买保健品为止。" }
        ]
    },
    {
        id: 4,
        title: "中奖了！",
        description: "你收到一条短信：'恭喜您的手机号在XX公司抽奖中获得一等奖——10万元现金！请点击链接填写银行卡信息领取奖金。'",
        options: [
            { text: "点击链接填写信息领奖", correct: false, feedback: "这是钓鱼链接！点了可能会被盗取银行卡信息，钱没领到反被转走。" },
            { text: "删除短信，不予理会", correct: true, feedback: "太棒了！天上不会掉馅饼，没参加过的抽奖不可能中奖。" },
            { text: "回复短信询问详情", correct: false, feedback: "不要回复！回复后骗子就知道这个号码有人用，会变本加厉地骚扰你。" }
        ]
    },
    {
        id: 5,
        title: "上门换锁芯",
        description: "有人敲门说：'你好，我是社区的，最近小区盗窃案多发，政府安排统一更换防盗锁芯，补贴后只要200元。现在就给你换上。'",
        options: [
            { text: "让他进来换锁芯", correct: false, feedback: "不要让陌生人进门！政府补贴项目会通过居委会正式通知，不会直接上门。" },
            { text: "隔着门说'不需要'，然后打电话给物业确认", correct: true, feedback: "太棒了！先确认再决定，真正的社区服务不怕核实。" },
            { text: "开门看看对方有没有工作证", correct: false, feedback: "工作证可以伪造。不要给陌生人开门，隔着门问清楚就好。" }
        ]
    },
    {
        id: 6,
        title: "法院传票电话",
        description: "你接到一个电话，对方说：'你好，这里是市中级人民法院。你有一张传票未签收，涉及一起经济纠纷案件。请尽快缴纳保证金，否则将强制执行。'",
        options: [
            { text: "按照对方要求缴纳保证金", correct: false, feedback: "法院不会电话催缴保证金！这是骗子冒充法院的常用手段。" },
            { text: "挂断电话，自己拨打12368法院热线核实", correct: true, feedback: "太棒了！12368是法院官方热线，主动核实最安全。" },
            { text: "问对方案件编号，然后考虑是否缴纳", correct: false, feedback: "案件编号也能伪造！不要相信电话里说的，一定要自己去法院核实。" }
        ]
    },
    {
        id: 7,
        title: "社保卡停用通知",
        description: "你收到一条短信：'【社保局】您的社保卡已过期，请点击链接更新信息，否则将停止医保服务。'",
        options: [
            { text: "点击链接更新社保卡信息", correct: false, feedback: "这是钓鱼链接！社保局不会用短信发链接让你点击，点了可能被盗取信息。" },
            { text: "去社保局窗口或官方APP办理", correct: true, feedback: "太棒了！社保卡业务要去正规渠道办理，不要相信短信链接。" },
            { text: "拨打短信里的电话咨询", correct: false, feedback: "短信里的电话也是骗子的！要打12333官方热线咨询。" }
        ]
    },
    {
        id: 8,
        title: "神奇的保健品",
        description: "你在电视购物上看到一款保健品广告，主持人说：'这款神药能根治糖尿病、高血压，吃了就能停药！买十盒送五盒，仅限今天！'",
        options: [
            { text: "赶紧打电话订购，错过就没了", correct: false, feedback: "保健品不能治病！糖尿病高血压是慢性病，必须遵医嘱服药，不要相信夸大宣传。" },
            { text: "不买，有病去医院看医生", correct: true, feedback: "太棒了！保健品不是药品，不能替代药物治疗。生病了一定要去正规医院。" },
            { text: "买两盒试试效果", correct: false, feedback: "试了也没用！这些都是虚假宣传，浪费钱还可能耽误病情。" }
        ]
    },
    {
        id: 9,
        title: "健康讲座送鸡蛋",
        description: "小区里有人组织免费健康讲座，说听完讲座就能领鸡蛋、大米。去了之后，讲师说有一种神奇的理疗仪器，能治各种病，现在买只要3980元。",
        options: [
            { text: "买一台理疗仪器，为了健康值得", correct: false, feedback: "免费领东西是诱饵！高价理疗仪器大多是骗人的，根本治不了病。" },
            { text: "领完鸡蛋就走，不买任何东西", correct: true, feedback: "太棒了！这是典型的推销套路，领完礼品赶紧走，不要听他们忽悠。" },
            { text: "先交定金，等发工资再买", correct: false, feedback: "交了定金就麻烦了！他们会天天催你，直到你买为止。" }
        ]
    },
    {
        id: 10,
        title: "快递中奖",
        description: "你收到一个快递，里面有一张刮刮卡，刮开后显示中了二等奖——一台平板电脑！刮刮卡上写着：请拨打400电话支付运费和税费298元领取奖品。",
        options: [
            { text: "拨打400电话支付费用领奖", correct: false, feedback: "这是连环骗局！刮刮卡是假的，付了钱也拿不到奖品。" },
            { text: "直接扔掉，不予理会", correct: true, feedback: "太棒了！天上不会掉馅饼，这种中奖都是骗人的。" },
            { text: "先问问快递员是不是真的", correct: false, feedback: "快递员只负责送包裹，不知道里面的刮刮卡是真是假。" }
        ]
    },
    {
        id: 11,
        title: "购车退税",
        description: "你接到一个电话，对方说：'你好，我是税务局的。根据新政策，你之前买的车可以享受退税，请提供银行卡号，我们把钱退给你。'",
        options: [
            { text: "提供银行卡号让对方退税", correct: false, feedback: "税务局不会电话退税！这是骗子套取你银行卡信息的手段。" },
            { text: "挂断电话，去税务局窗口核实", correct: true, feedback: "太棒了！退税业务要去税务局大厅办理，不要相信电话通知。" },
            { text: "先问清楚退多少，再决定", correct: false, feedback: "不管退多少都是骗局！他们就是想骗你的银行卡信息。" }
        ]
    },
    {
        id: 12,
        title: "老同学借钱",
        description: "你收到一条微信消息，是多年没联系的老同学发来的：'老同学，我家里出事了，急需用钱，能不能借我5万块？回头一定还你。'",
        options: [
            { text: "老同学有难，马上转账帮忙", correct: false, feedback: "小心！微信号可能被盗了。多年不联系突然借钱，很可能是骗子。" },
            { text: "打电话确认是不是老同学本人", correct: true, feedback: "太棒了！一定要先打电话核实身份，确认后再决定要不要借。" },
            { text: "先借1万，不多借", correct: false, feedback: "借1万也是被骗！先确认身份最重要，不要轻易转账。" }
        ]
    },
    {
        id: 13,
        title: "领导催款",
        description: "你收到一条微信，头像和名字都是你单位领导，消息说：'小王，我在开会不方便打电话，你先转5万块到这个账户，急用！'",
        options: [
            { text: "领导急用，马上转账", correct: false, feedback: "领导微信可能被盗了！一定要打电话核实，不要仅凭微信消息转账。" },
            { text: "打电话给领导确认", correct: true, feedback: "太棒了！涉及金钱一定要当面或电话确认，不要相信紧急催款的消息。" },
            { text: "先转一部分，等领导回电", correct: false, feedback: "转多少都是被骗！骗子就是利用你不敢拒绝领导的心理。" }
        ]
    },
    {
        id: 14,
        title: "高收益理财",
        description: "有人拉你进一个微信群，群里天天发'投资XX项目，月收益20%，保本保息'的消息，还有很多人发转账截图说赚钱了。",
        options: [
            { text: "跟着大家一起投资，赚大钱", correct: false, feedback: "高收益必然高风险！月收益20%是不可能的，这是典型的庞氏骗局。" },
            { text: "不理会，不投资", correct: true, feedback: "太棒了！天上不会掉馅饼，正规理财收益不会这么高，不要被诱惑。" },
            { text: "先投一点试试水", correct: false, feedback: "投一点也会亏！庞氏骗局就是用新人的钱给老人返利，最后一定会崩盘。" }
        ]
    },
    {
        id: 15,
        title: "养老公寓投资",
        description: "有人向你推荐一个养老公寓项目，说：'花20万买一个床位，以后免费住养老院，还能每月领分红。'",
        options: [
            { text: "投资买床位，以后养老有保障", correct: false, feedback: "这很可能是非法集资！养老公寓投资要选正规机构，不要相信口头承诺。" },
            { text: "不投资，去正规养老院咨询", correct: true, feedback: "太棒了！养老问题要通过正规渠道解决，不要相信这种高风险投资。" },
            { text: "和家人商量一下再决定", correct: false, feedback: "家人也可能被忽悠！这种项目大多是骗局，最好的办法就是不参与。" }
        ]
    },
    {
        id: 16,
        title: "免费清洗油烟机",
        description: "有人敲门说：'你好，我们是XX家电公司的，现在搞活动免费清洗油烟机。让我进去帮你清洗一下吧。'",
        options: [
            { text: "让他进来免费清洗", correct: false, feedback: "免费清洗是幌子！进去后会说你的油烟机有问题，要高价维修。" },
            { text: "隔着门拒绝，说不需要", correct: true, feedback: "太棒了！不要让陌生人进门，真正的家电公司不会这样上门推销。" },
            { text: "让他在门口简单清洗一下", correct: false, feedback: "门口也不行！他们会找各种理由让你开门，或者偷走门口的东西。" }
        ]
    },
    {
        id: 17,
        title: "燃气安全检查",
        description: "有人敲门说：'你好，我是燃气公司的，来检查燃气安全。你家的燃气管老化了，需要更换，只要300元。'",
        options: [
            { text: "让他进来检查并更换", correct: false, feedback: "燃气公司会提前通知！不会突然上门收费更换。这很可能是骗子。" },
            { text: "隔着门问工号，然后打电话给燃气公司核实", correct: true, feedback: "太棒了！一定要先核实身份，燃气公司电话可以在账单上找到。" },
            { text: "讨价还价，便宜一点再换", correct: false, feedback: "再便宜也是被骗！他们换的东西质量很差，根本不安全。" }
        ]
    },
    {
        id: 18,
        title: "假网站钓鱼",
        description: "你收到一条短信：'【银行】您的银行卡在异地消费5000元，如有疑问请点击链接查看详情。'",
        options: [
            { text: "点击链接查看消费记录", correct: false, feedback: "这是钓鱼网站！点进去会让你输入银行卡密码，钱就会被转走。" },
            { text: "打银行官方电话核实", correct: true, feedback: "太棒了！银行官方电话在银行卡背面，不要相信短信里的链接。" },
            { text: "回复短信说不是自己消费的", correct: false, feedback: "回复后骗子就知道你在关注，会进一步骗你。" }
        ]
    },
    {
        id: 19,
        title: "App下载诈骗",
        description: "你接到一个电话，对方说：'你好，我是手机客服。你的手机需要更新系统，请点击短信里的链接下载安装。'",
        options: [
            { text: "点击链接下载安装", correct: false, feedback: "这是恶意App！下载后会窃取你的手机信息，包括银行密码。" },
            { text: "去手机官方应用商店更新", correct: true, feedback: "太棒了！手机系统更新要在设置里操作，不要相信短信链接。" },
            { text: "先下载看看是什么", correct: false, feedback: "看了就晚了！恶意软件一旦安装，你的个人信息就暴露了。" }
        ]
    },
    {
        id: 20,
        title: "黄昏恋陷阱",
        description: "你在网上认识了一位自称'李阿姨/王叔叔'的人，聊得很投缘。对方说自己在做一个投资项目，让你一起投钱，还说以后要和你一起过日子。",
        options: [
            { text: "相信对方，一起投资", correct: false, feedback: "这是情感诈骗！对方就是利用你的感情骗你的钱，根本不会和你过日子。" },
            { text: "不投资，保持警惕", correct: true, feedback: "太棒了！网上交友要谨慎，涉及金钱一定要提高警惕，不要轻易相信。" },
            { text: "先投一点，看看对方是不是真心的", correct: false, feedback: "投多少都会被骗！骗子就是用感情让你放下戒心，然后骗光你的钱。" }
        ]
    }
];

const app = {
    scamData: {
        '冒充公检法': [
            { scam: '你涉嫌洗钱，要把钱转到安全账户', counter: '好的，我先打110核实一下您的警号' },
            { scam: '你的医保卡被盗刷了', counter: '我马上打12393医保热线确认' },
            { scam: '你有一份法院传票未领取', counter: '请把传票寄到我家，我会找社区律师核实' },
            { scam: '你的身份证被冒用办了银行卡', counter: '我马上去派出所查一下，你警号多少？' },
            { scam: '你涉嫌拐卖儿童案件', counter: '我就在公安局门口，你让办案民警出来接我' }
        ],
        '保健品推销': [
            { scam: '这个药能治高血压糖尿病，三天见效', counter: '我先问社区医生再说' },
            { scam: '今天搞活动，买三送一最后一天', counter: '我不着急，等孩子回来商量' },
            { scam: '免费体检，专车接送', counter: '不去，天下没有免费的午餐' },
            { scam: '这个床垫能治腰疼，睡了就好', counter: '我先去医院拍个片子再说' },
            { scam: '量子能量杯，喝水治百病', counter: '真有这技术早拿诺贝尔奖了' }
        ],
        '中奖诈骗': [
            { scam: '恭喜你中了老年旅游团大奖', counter: '我没参加过抽奖，你打错了' },
            { scam: '扫码领鸡蛋，免费领', counter: '免费的不要，天上不会掉馅饼' },
            { scam: '你中了央视幸运观众大奖', counter: '我先打央视热线核实一下' },
            { scam: '点击链接领取养老金补贴', counter: '我让社区工作人员帮我操作' },
            { scam: '你的手机号中了10万元', counter: '直接打我卡上吧，扣完税剩下的给我' }
        ],
        '冒充熟人': [
            { scam: '奶奶我出车祸了，快转钱', counter: '你叫什么名字？我先给你爸妈打电话确认' },
            { scam: '我是你儿子的朋友，他出事了', counter: '让我儿子本人给我回电话' },
            { scam: '老同学，还记得我吗？借点钱周转', counter: '你说说我们班主任叫什么名字？' },
            { scam: '你孙子在我手里，快汇款', counter: '我先打110，让警察定位你的号码' },
            { scam: '我是你远方亲戚，来看你但路上钱包丢了', counter: '你在哪？我让孩子去接你' }
        ],
        '投资理财诈骗': [
            { scam: '稳赚不赔的养老理财产品', counter: '我先去银行问问理财经理' },
            { scam: '内部消息，这只股票明天涨停', counter: '真有内部消息你早发财了，还找我？' },
            { scam: '数字货币，投一万赚十万', counter: '我不懂的东西不碰，谢谢' },
            { scam: '以房养老，每月拿钱', counter: '我先把合同给律师看看再说' },
            { scam: '黄金期货，保本保息', counter: '我只存银行定期，其他不碰' }
        ],
        '上门服务诈骗': [
            { scam: '免费清洗油烟机/空调', counter: '不需要，我家孩子会弄' },
            { scam: '社区安排上门检查燃气安全', counter: '我先打物业电话确认一下' },
            { scam: '换防盗门锁芯，政府补贴', counter: '让我孩子回来再换' },
            { scam: '免费安装净水器', counter: '不需要，我家已经装了' },
            { scam: '上门检测甲醛，免费', counter: '你先把工作证从门缝塞进来我看看' }
        ]
    },

    scamCategoryColors: {
        '冒充公检法': '#FF6B6B',
        '保健品推销': '#FFD93D',
        '中奖诈骗': '#FF922B',
        '冒充熟人': '#E599F7',
        '投资理财诈骗': '#4ECDC4',
        '上门服务诈骗': '#6BCB77'
    },

    voices: [],
    recognition: null,

    init: function() {
        this.initVoices();
        this.initSpeechRecognition();
        this.bindEvents();
        this.startMedicationReminder();
        this.initDemoMode();
        this.showDailyTip();
        console.log('银发守护者应用已初始化');
    },

    showDailyTip: function() {
        const randomIndex = Math.floor(Math.random() * dailyTips.length);
        const tip = dailyTips[randomIndex];

        const modal = document.createElement('div');
        modal.className = 'daily-tip-modal';
        modal.innerHTML = `
            <div class="daily-tip-overlay">
                <div class="daily-tip-card">
                    <div class="daily-tip-icon">🛡️</div>
                    <h3 class="daily-tip-title">防骗小课堂</h3>
                    <p class="daily-tip-content">${tip}</p>
                    <button class="daily-tip-close-btn">知道了</button>
                </div>
            </div>
        `;

        document.body.style.overflow = 'hidden';
        document.body.appendChild(modal);

        const closeBtn = modal.querySelector('.daily-tip-close-btn');
        const overlay = modal.querySelector('.daily-tip-overlay');

        closeBtn.addEventListener('click', () => {
            this.closeDailyTip();
        });

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.closeDailyTip();
            }
        });
    },

    closeDailyTip: function() {
        const modal = document.querySelector('.daily-tip-modal');
        if (modal) {
            modal.remove();
        }
        document.body.style.overflow = '';
    },

    startScamGame: function() {
        this.scamScore = 0;
        this.scamCurrentIndex = 0;
        
        const shuffledScenarios = JSON.parse(JSON.stringify(scenarios));
        for (let i = shuffledScenarios.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledScenarios[i], shuffledScenarios[j]] = [shuffledScenarios[j], shuffledScenarios[i]];
        }
        
        this.scamGameScenarios = shuffledScenarios.slice(0, 5);
        
        this.scamGameScenarios.forEach(scenario => {
            scenario.options = this.shuffleOptions(scenario.options);
        });

        this.renderScamStartPage();
    },

    shuffleOptions: function(options) {
        const shuffled = [...options];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    },

    renderScamStartPage: function() {
        const content = `
            <div class="scam-game-start">
                <div class="scam-game-icon">🎮</div>
                <h2 class="scam-game-title">防骗情景模拟</h2>
                <button id="startBtn" class="scam-start-btn">开始挑战</button>
                <button id="aiGenerateBtn" class="scam-ai-btn">🤖 AI生成新题目</button>
                <div id="aiLoading" style="display:none; color: #666; margin-top: 10px;">
                    <span class="spinner"></span> AI正在生成新题目...
                </div>
            </div>
        `;
        this.switchPage('scam-game', '防骗情景模拟', content);
        
        this.setupScamGameEvents();
    },
    
    setupScamGameEvents: function() {
        const startBtn = document.getElementById('startBtn');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                this.startChallenge(this.getRandomQuestions());
            });
        }
        
        const aiGenerateBtn = document.getElementById('aiGenerateBtn');
        if (aiGenerateBtn) {
            aiGenerateBtn.addEventListener('click', async () => {
                const loading = document.getElementById('aiLoading');
                const btn = aiGenerateBtn;
                
                btn.disabled = true;
                loading.style.display = 'block';
                
                try {
                    const response = await fetch(API_CONFIG.BACKEND_URL + '/generate-ai-quiz', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    const result = await response.json();
                    
                    if (result.success && result.data && result.data.title) {
                        const question = {
                            ...result.data,
                            options: this.shuffleOptions(result.data.options)
                        };
                        this.startChallenge([question]);
                    } else {
                        console.warn('AI生成失败，使用本地题库');
                        this.startChallenge(this.getRandomQuestions());
                        alert('AI生成失败，已使用本地题库');
                    }
                } catch (error) {
                    console.error('AI请求失败:', error);
                    this.startChallenge(this.getRandomQuestions());
                    alert('AI生成失败，已使用本地题库');
                } finally {
                    btn.disabled = false;
                    loading.style.display = 'none';
                }
            });
        }
    },
    
    getRandomQuestions: function() {
        const shuffled = [...scenarios].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, 5).map(q => ({
            ...q,
            options: this.shuffleOptions(q.options)
        }));
    },
    
    startChallenge: function(questions) {
        console.log('开始挑战，题目数量:', questions.length);
        this.scamScore = 0;
        this.scamCurrentIndex = 0;
        this.scamGameScenarios = questions;
        this.renderScamQuestion();
    },

    async generateAndPlayAiQuestion() {
        const btn = document.querySelector('.scam-ai-btn');
        if (btn) {
            btn.textContent = '⏳ 生成中...';
            btn.disabled = true;
        }

        const question = await this.aiService.generateScamQuestion();
        
        if (question) {
            this.scamScore = 0;
            this.scamCurrentIndex = 0;
            this.scamGameScenarios = [question];
            this.renderScamQuestion();
        } else {
            if (btn) {
                btn.textContent = '🤖 AI生成新题目';
                btn.disabled = false;
            }
            this.showToast('生成题目失败，请稍后再试');
        }
    },

    renderScamQuestion: function() {
        const self = this;
        
        if (this.scamCurrentIndex >= this.scamGameScenarios.length) {
            this.renderScamResult();
            return;
        }

        const scenario = this.scamGameScenarios[this.scamCurrentIndex];

        let optionsHtml = '';
        scenario.options.forEach((option, index) => {
            optionsHtml += `
                <button class="scam-option-btn" data-index="${index}">
                    ${option.text}
                </button>
            `;
        });

        const content = `
            <div class="scam-question-container">
                <div class="scam-robot-emoji">🤔</div>
                <h3 class="scam-question-title">${scenario.title}</h3>
                <div class="scam-question-desc">${scenario.description}</div>
                <div class="scam-options">${optionsHtml}</div>
            </div>
        `;
        this.switchPage('scam-game', '防骗情景模拟', content);

        setTimeout(() => {
            const optionBtns = document.querySelectorAll('.scam-option-btn');
            optionBtns.forEach(btn => {
                btn.addEventListener('click', function(e) {
                    self.checkAnswer(e.target.dataset.index);
                });
            });
        }, 100);
    },

    checkAnswer: function(selectedIndex) {
        const self = this;
        const scenario = this.scamGameScenarios[this.scamCurrentIndex];
        const selectedOption = scenario.options[selectedIndex];
        const isCorrect = selectedOption.correct;

        if (isCorrect) {
            this.scamScore++;
        }

        const optionBtns = document.querySelectorAll('.scam-option-btn');
        optionBtns.forEach((btn, index) => {
            btn.disabled = true;
            if (scenario.options[index].correct) {
                btn.classList.add('scam-option-correct');
            } else if (index == selectedIndex && !isCorrect) {
                btn.classList.add('scam-option-wrong');
            }
        });

        this.showScamFeedback(isCorrect, selectedOption.feedback);
    },

    showScamFeedback: function(isCorrect, feedback) {
        const self = this;
        const feedbackDiv = document.createElement('div');
        feedbackDiv.className = 'scam-feedback';
        
        const icon = isCorrect ? '✅' : '❌';
        const title = isCorrect ? '太棒了！' : '差一点！';
        const robotEmoji = isCorrect ? '⭐🤖' : '😟';
        const colorClass = isCorrect ? 'scam-feedback-correct' : 'scam-feedback-wrong';
        
        feedbackDiv.innerHTML = `
            <div class="${colorClass}">
                <div class="scam-feedback-icon">${icon}</div>
                <div class="scam-feedback-title">${title}</div>
                <p class="scam-feedback-text">${feedback}</p>
                <div class="scam-feedback-robot">${robotEmoji}</div>
                <button class="scam-next-btn" onclick="app.goBack()">← 返回</button>
            </div>
        `;
        
        const container = document.querySelector('.scam-question-container');
        if (container) {
            container.appendChild(feedbackDiv);
        }
    },

    renderScamResult: function() {
        const total = this.scamGameScenarios.length;
        let title, subtitle, robotEmoji;
        
        if (this.scamScore === total) {
            title = '你是防骗达人！';
            subtitle = '全对！你已经掌握了基本的防骗知识！';
            robotEmoji = '⭐🤖';
        } else if (this.scamScore >= 3) {
            title = '不错，继续保持警惕！';
            subtitle = '答对了 ' + this.scamScore + '/' + total + ' 题，还要继续学习哦！';
            robotEmoji = '💪🤖';
        } else {
            title = '还要多学习防骗知识哦';
            subtitle = '答对了 ' + this.scamScore + '/' + total + ' 题，多看看防骗小课堂吧！';
            robotEmoji = '😟';
        }

        const content = `
            <div class="scam-result-container">
                <div class="scam-result-icon">${robotEmoji}</div>
                <h2 class="scam-result-title">${title}</h2>
                <p class="scam-result-score">答对 ${this.scamScore}/${total} 题</p>
                <p class="scam-result-subtitle">${subtitle}</p>
                <div class="scam-result-buttons">
                    <button class="scam-restart-btn" onclick="app.startScamGame()">🔄 再来一次</button>
                    <button class="scam-home-btn" onclick="app.goBack()">🏠 返回首页</button>
                </div>
            </div>
        `;
        this.switchPage('scam-game', '防骗情景模拟', content);
    },

    initDemoMode: function() {
        if (DEMO_MODE) {
            const badge = document.createElement('div');
            badge.className = 'demo-badge';
            badge.textContent = '演示模式';
            document.body.appendChild(badge);
        }
    },

    updateRobotEmotion: function(type) {
        const emotions = {
            normal: '🤖',
            sad: '😟',
            success: '⭐🤖',
            medicine: '💊🤖'
        };
        
        const robotIcons = document.querySelectorAll('.robot-icon');
        robotIcons.forEach(icon => {
            icon.textContent = emotions[type] || emotions.normal;
        });
        
        const robotContainers = document.querySelectorAll('.robot-icon-container');
        robotContainers.forEach(container => {
            container.textContent = emotions[type] || emotions.normal;
        });
    },

    createRipple: function(element, event) {
        const rect = element.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.style.width = ripple.style.height = '20px';
        
        element.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    },

    initVoices: function() {
        this.voices = window.speechSynthesis.getVoices();
        
        window.speechSynthesis.onvoiceschanged = () => {
            this.voices = window.speechSynthesis.getVoices();
            console.log('语音列表已更新:', this.voices.length);
        };
    },

    initSpeechRecognition: function() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            this.recognition = new SpeechRecognition();
            this.recognition.lang = 'zh-CN';
            this.recognition.continuous = false;
            this.recognition.interimResults = true;
        }
    },

    bindEvents: function() {
        const cards = document.querySelectorAll('.card');
        cards.forEach(card => {
            card.addEventListener('click', (e) => {
                this.createRipple(card, e);
                const feature = e.currentTarget.classList[1];
                this.handleCardClick(feature);
            });
        });

        const footerLink = document.querySelector('.footer-link');
        if (footerLink) {
            footerLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchPage('settings');
            });
        }

        document.addEventListener('click', (e) => {
            const replayBtn = e.target.closest('.replay-btn');
            if (replayBtn && replayBtn.dataset.text) {
                this.speakText(replayBtn.dataset.text);
            }

            const showTextBtn = e.target.closest('.show-text-btn');
            if (showTextBtn) {
                const content = showTextBtn.parentElement.querySelector('.ai-response-text');
                if (content) {
                    content.classList.toggle('hidden');
                    showTextBtn.textContent = content.classList.contains('hidden') ? '📝 显示文字' : '📝 收起文字';
                }
            }

            const manualSubmitBtn = e.target.closest('.manual-submit-btn');
            if (manualSubmitBtn) {
                const input = document.getElementById('manual-input');
                if (input && input.value.trim()) {
                    this.sendToAI(input.value.trim());
                }
            }
        });
    },

    handleCardClick: function(feature) {
        const featureNames = {
            'anti-fraud': 'AI防骗帮手',
            'voice-consult': '语音问诊',
            'image-ocr': '拍图认字',
            'medicine-reminder': '吃药提醒',
            'scam-game': '防骗情景模拟'
        };
        
        feature = feature.toString().trim();

        const name = featureNames[feature] || feature;
        console.log('进入' + name);
        
        if (feature === 'scam-game') {
            this.startScamGame();
        } else {
            this.switchPage(feature);
        }
    },

    switchPage: function(pageName, pageTitle, customContent) {
        console.log('切换页面:', pageName);
        const mainContent = document.querySelector('.main');
        const header = document.querySelector('.header');
        const footer = document.querySelector('.footer');

        if (!mainContent) return;

        let pageContent = '';
        
        if (customContent) {
            pageContent = `
                <div class="page-container">
                    <div class="page-header">
                        <button class="back-btn" onclick="app.goBack()">← 返回</button>
                        <h2 class="page-title">${pageTitle || this.getPageTitle(pageName)}</h2>
                    </div>
                    <div class="page-content" id="page-${pageName}">
                        ${customContent}
                    </div>
                </div>
            `;
        } else if (pageName === 'settings') {
            pageContent = this.renderSettingsPage();
        } else if (pageName === 'anti-fraud') {
            pageContent = this.renderAntiFraudCategories();
        } else if (pageName === 'voice-consult') {
            pageContent = this.renderVoiceConsultPage();
        } else if (pageName === 'image-ocr') {
            pageContent = this.renderImageOcrPage();
        } else if (pageName === 'medicine-reminder') {
            pageContent = this.renderMedicineReminderPage();
        } else if (pageName === 'add-medication-ai') {
            pageContent = this.renderAddMedicationAiPage();
        } else {
            pageContent = this.renderDefaultPage(pageName);
        }

        mainContent.classList.remove('page-transition');
        void mainContent.offsetWidth;
        
        mainContent.innerHTML = pageContent;
        mainContent.classList.add('page-transition');
        header.style.display = 'none';
        footer.style.display = 'none';

        this.addPageStyles();
    },

    renderVoiceConsultPage: function() {
        const isSupported = !!this.recognition;
        
        return `
            <div class="page-container">
                <div class="page-header">
                    <button class="back-btn" onclick="app.goBack()">← 返回</button>
                    <h2 class="page-title">语音问诊</h2>
                </div>
                <div class="page-content voice-consult-page" id="page-voice-consult">
                    
                    ${isSupported ? `
                        <div class="microphone-section">
                            <button class="mic-btn" id="mic-btn" onclick="app.startListening()">
                                🎤
                            </button>
                            <p class="mic-hint" id="mic-hint">点击开始说话</p>
                        </div>
                    ` : `
                        <div class="no-voice-warning">
                            <p>🔔 您的浏览器不支持语音，请手动输入问题</p>
                        </div>
                    `}
                    
                    <div class="input-section">
                        <h3>您说的话：</h3>
                        <div class="recognized-text" id="recognized-text">等待输入...</div>
                    </div>

                    <div class="manual-input-section ${isSupported ? 'hidden' : ''}">
                        <textarea id="manual-input" placeholder="请输入您的健康问题..."></textarea>
                        <button class="manual-submit-btn">发送</button>
                    </div>

                    <div class="ai-response-section hidden" id="ai-response-section">
                        <h3>AI医生回复：</h3>
                        <div class="ai-response-box">
                            <div class="ai-response-text hidden" id="ai-response-text"></div>
                            <div class="ai-response-buttons">
                                <button class="replay-btn" id="ai-replay-btn" data-text="">🔊 重新朗读</button>
                                <button class="show-text-btn">📝 显示文字</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    startListening: function() {
        if (!this.recognition) return;

        const micBtn = document.getElementById('mic-btn');
        const micHint = document.getElementById('mic-hint');
        const recognizedText = document.getElementById('recognized-text');

        micBtn.classList.add('listening');
        micHint.textContent = '正在聆听...';
        recognizedText.textContent = '正在识别...';

        this.recognition.onresult = (event) => {
            let finalTranscript = '';
            let interimTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }

            recognizedText.textContent = finalTranscript || interimTranscript;
        };

        this.recognition.onerror = (event) => {
            console.error('语音识别错误:', event.error);
            micBtn.classList.remove('listening');
            micHint.textContent = '点击开始说话';
            recognizedText.textContent = '没听清楚，请再说一遍';
        };

        this.recognition.onend = () => {
            micBtn.classList.remove('listening');
            micHint.textContent = '点击开始说话';
            
            const recognizedText = document.getElementById('recognized-text');
            if (recognizedText && recognizedText.textContent && recognizedText.textContent !== '正在识别...' && recognizedText.textContent !== '没听清楚，请再说一遍') {
                this.sendToAI(recognizedText.textContent);
            }
        };

        try {
            this.recognition.start();
        } catch (e) {
            console.error('启动语音识别失败:', e);
            micBtn.classList.remove('listening');
            micHint.textContent = '点击开始说话';
        }
    },

    sendToAI: async function(text) {
        const aiResponseSection = document.getElementById('ai-response-section');
        const aiResponseText = document.getElementById('ai-response-text');
        const aiReplayBtn = document.getElementById('ai-replay-btn');

        aiResponseSection.classList.remove('hidden');
        aiResponseText.textContent = '正在思考中...';
        aiResponseText.classList.remove('hidden');
        aiReplayBtn.dataset.text = '';

        const sadKeywords = ['难受', '疼', '不舒服', '痛', '不舒服', '难受了'];
        if (sadKeywords.some(keyword => text.includes(keyword))) {
            this.updateRobotEmotion('sad');
        }

        try {
            const response = await aiService.healthConsult(text);
            aiResponseText.textContent = response;
            aiReplayBtn.dataset.text = response;
            this.updateRobotEmotion('normal');
            this.speakText(response);
        } catch (error) {
            console.error('AI咨询失败:', error);
            aiResponseText.textContent = '网络有点问题，请稍后再试。';
            this.updateRobotEmotion('normal');
        }
    },

    speakText: function(text) {
        window.speechSynthesis.cancel();

        const paragraphs = text.length > 100 ? text.split(/[。！？]/).filter(p => p.trim()) : [text];
        
        let currentIndex = 0;
        
        const speakNext = () => {
            if (currentIndex >= paragraphs.length) return;

            const utterance = new SpeechSynthesisUtterance(paragraphs[currentIndex] + '。');
            utterance.lang = 'zh-CN';
            utterance.rate = 0.85;
            utterance.volume = 1.0;
            utterance.pitch = 1.0;

            utterance.onend = () => {
                currentIndex++;
                speakNext();
            };

            const chineseVoice = this.voices.find(v => 
                v.name.includes('Huihui') || 
                v.lang.includes('zh-CN') || 
                v.name.includes('Chinese')
            ) || this.voices.find(v => v.lang.includes('zh'));

            if (chineseVoice) {
                utterance.voice = chineseVoice;
            }

            window.speechSynthesis.speak(utterance);
        };

        speakNext();
    },

    renderImageOcrPage: function() {
        return `
            <div class="page-container">
                <div class="page-header">
                    <button class="back-btn" onclick="app.goBack()">← 返回</button>
                    <h2 class="page-title">拍图认字</h2>
                </div>
                <div class="page-content image-ocr-page" id="page-image-ocr">
                    
                    <div class="upload-area" onclick="app.triggerFileInput()">
                        <input type="file" id="ocr-file-input" accept="image/*" class="hidden" onchange="app.handleImageUpload(event)">
                        <div class="upload-icon">📷</div>
                        <p class="upload-text">点击上传药盒或说明书照片</p>
                    </div>

                    <div class="preview-section hidden" id="preview-section">
                        <h3>图片预览：</h3>
                        <img id="preview-image" src="" alt="预览图片">
                        <button class="reupload-btn" onclick="app.triggerFileInput()">重新上传</button>
                    </div>

                    <div class="loading-section hidden" id="loading-section">
                        <div class="loading-spinner"></div>
                        <p class="loading-text">正在识别...</p>
                    </div>

                    <div class="ocr-result-section hidden" id="ocr-result-section">
                        <h3>识别结果：</h3>
                        <div class="ocr-result-box" id="ocr-result-box"></div>
                        <button class="replay-btn" id="ocr-replay-btn" data-text="">🔊 重新朗读</button>
                    </div>
                </div>
            </div>
        `;
    },

    triggerFileInput: function() {
        const fileInput = document.getElementById('ocr-file-input');
        if (fileInput) {
            fileInput.click();
        }
    },

    handleImageUpload: function(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        
        reader.onload = (e) => {
            const previewImage = document.getElementById('preview-image');
            const previewSection = document.getElementById('preview-section');
            const loadingSection = document.getElementById('loading-section');
            const resultSection = document.getElementById('ocr-result-section');

            previewImage.src = e.target.result;
            previewSection.classList.remove('hidden');
            resultSection.classList.add('hidden');

            loadingSection.classList.remove('hidden');

            this.processOcr(e.target.result);
        };

        reader.readAsDataURL(file);
    },

    processOcr: async function(imageData) {
        try {
            const result = await aiService.imageRecognition(imageData);
            this.showOcrResult(result);
        } catch (error) {
            console.error('图片识别失败:', error);
            this.showOcrResult('图片识别失败，请重新拍照试试。');
        }
    },

    showOcrResult: function(result) {
        const loadingSection = document.getElementById('loading-section');
        const resultSection = document.getElementById('ocr-result-section');
        const resultBox = document.getElementById('ocr-result-box');
        const replayBtn = document.getElementById('ocr-replay-btn');

        loadingSection.classList.add('hidden');
        resultSection.classList.remove('hidden');

        const highlightedResult = this.highlightKeywords(result);
        resultBox.innerHTML = highlightedResult;

        replayBtn.dataset.text = result;
        this.speakText(result);

        this.showOcrConfirmModal(result);
    },

    showOcrConfirmModal: function(result) {
        const modal = document.createElement('div');
        modal.className = 'ocr-confirm-modal';
        modal.innerHTML = `
            <div class="ocr-confirm-overlay">
                <div class="ocr-confirm-card">
                    <h3 class="ocr-confirm-title">识别到药品信息</h3>
                    <div class="ocr-confirm-content">${this.highlightKeywords(result)}</div>
                    <div class="ocr-confirm-buttons">
                        <button class="ocr-add-btn">💊 添加吃药提醒</button>
                        <button class="ocr-cancel-btn">❌ 不用了</button>
                    </div>
                </div>
            </div>
        `;

        document.body.style.overflow = 'hidden';
        document.body.appendChild(modal);

        const addBtn = modal.querySelector('.ocr-add-btn');
        const cancelBtn = modal.querySelector('.ocr-cancel-btn');
        const overlay = modal.querySelector('.ocr-confirm-overlay');

        addBtn.addEventListener('click', () => {
            console.log('点击添加吃药提醒按钮', result);
            this.closeOcrConfirmModal();
            this.aiRecognitionResult = result;
            this.switchPage('add-medication-ai');
        });

        cancelBtn.addEventListener('click', () => {
            console.log('点击不用了按钮');
            this.closeOcrConfirmModal();
        });

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                console.log('点击遮罩关闭弹窗');
                this.closeOcrConfirmModal();
            }
        });
    },

    closeOcrConfirmModal: function() {
        const modal = document.querySelector('.ocr-confirm-modal');
        if (modal) {
            modal.remove();
        }
        document.body.style.overflow = '';
    },

    addMedicationFromOcr: function(result) {
        this.closeOcrConfirmModal();
        this.aiRecognitionResult = result;
        this.switchPage('add-medication-ai');
    },

    highlightKeywords: function(text) {
        const keywords = ['禁用', '慎用', '过敏', '警告', '注意', '禁忌'];
        let result = text.replace(/\n/g, '<br>');
        
        keywords.forEach(keyword => {
            const regex = new RegExp(keyword, 'g');
            result = result.replace(regex, `<span class="highlight-danger">${keyword}</span>`);
        });

        return result;
    },

    extractMedicineName: function(text) {
        const namePatterns = [
            /药品名称[：:]?\s*([^\n\r]+)/,
            /通用名称[：:]?\s*([^\n\r]+)/,
            /品名[：:]?\s*([^\n\r]+)/,
            /名称[：:]?\s*([^\n\r]+)/
        ];
        
        for (const pattern of namePatterns) {
            const match = text.match(pattern);
            if (match && match[1]) {
                return match[1].trim();
            }
        }
        
        return '';
    },

    getMedicineTime: function(mealType) {
        const mealSettings = this.getMealSettings();
        const mealTime = mealSettings[mealType];
        const duration = mealSettings.duration || 30;

        if (!mealTime) {
            return '08:00';
        }

        const [hour, minute] = mealTime.split(':').map(Number);
        const totalMinutes = hour * 60 + minute + duration;
        const newHour = Math.floor(totalMinutes / 60) % 24;
        const newMinute = totalMinutes % 60;

        return `${newHour.toString().padStart(2, '0')}:${newMinute.toString().padStart(2, '0')}`;
    },

    showMealTimeModal: function(onSaveCallback) {
        const mealSettings = this.getMealSettings();
        const modal = document.createElement('div');
        modal.className = 'universal-meal-modal';
        modal.innerHTML = `
            <div class="universal-meal-overlay">
                <div class="universal-meal-card">
                    <h3 class="universal-meal-title">设置用餐时间</h3>
                    <div class="universal-meal-form">
                        <div class="universal-meal-item">
                            <label>🥐 早饭时间</label>
                            <input type="time" id="meal-modal-breakfast" value="${mealSettings.breakfast}">
                        </div>
                        <div class="universal-meal-item">
                            <label>🍚 午饭时间</label>
                            <input type="time" id="meal-modal-lunch" value="${mealSettings.lunch}">
                        </div>
                        <div class="universal-meal-item">
                            <label>🍲 晚饭时间</label>
                            <input type="time" id="meal-modal-dinner" value="${mealSettings.dinner}">
                        </div>
                        <div class="universal-meal-item">
                            <label>⏱️ 吃饭时长（分钟）</label>
                            <input type="number" id="meal-modal-duration" value="${mealSettings.duration}" min="10" max="120">
                        </div>
                    </div>
                    <div class="universal-meal-buttons">
                        <button class="universal-meal-save-btn">✅ 保存</button>
                        <button class="universal-meal-cancel-btn">❌ 取消</button>
                    </div>
                </div>
            </div>
        `;

        document.body.style.overflow = 'hidden';
        document.body.appendChild(modal);

        const saveBtn = modal.querySelector('.universal-meal-save-btn');
        const cancelBtn = modal.querySelector('.universal-meal-cancel-btn');
        const overlay = modal.querySelector('.universal-meal-overlay');

        if (onSaveCallback) {
            modal.dataset.onSave = onSaveCallback;
        }

        saveBtn.addEventListener('click', () => {
            console.log('点击保存用餐时间按钮');
            this.saveMealTimeFromModal();
        });

        cancelBtn.addEventListener('click', () => {
            console.log('点击取消按钮');
            this.closeMealTimeModal();
        });

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                console.log('点击遮罩关闭用餐时间弹窗');
                this.closeMealTimeModal();
            }
        });
    },

    closeMealTimeModal: function() {
        const modal = document.querySelector('.universal-meal-modal');
        if (modal) {
            modal.remove();
        }
        document.body.style.overflow = '';
    },

    saveMealTimeFromModal: function() {
        const breakfast = document.getElementById('meal-modal-breakfast').value || '07:00';
        const lunch = document.getElementById('meal-modal-lunch').value || '12:00';
        const dinner = document.getElementById('meal-modal-dinner').value || '18:00';
        const durationInput = document.getElementById('meal-modal-duration');
        const duration = durationInput ? parseInt(durationInput.value) || 30 : 30;

        if (duration < 10 || duration > 120) {
            alert('吃饭时长请在10-120分钟之间');
            return;
        }

        const settings = { breakfast, lunch, dinner, duration };
        localStorage.setItem('mealSettings', JSON.stringify(settings));

        const modal = document.querySelector('.universal-meal-modal');
        const callbackName = modal ? modal.dataset.onSave : null;

        this.closeMealTimeModal();

        if (callbackName) {
            setTimeout(() => {
                if (typeof this[callbackName] === 'function') {
                    this[callbackName]();
                }
            }, 100);
        }
    },

    extractDosage: function(text) {
        const dosagePatterns = [
            /一次\s*([^\n\r次]+)/,
            /每\s*([^\n\r]+)\s*一次/,
            /用量[：:]?\s*([^\n\r]+)/
        ];
        
        for (const pattern of dosagePatterns) {
            const match = text.match(pattern);
            if (match && match[1]) {
                return match[1].trim();
            }
        }
        
        return '';
    },

    extractFrequency: function(text) {
        const freqPatterns = [
            /一日\s*([一二三四五六七八九十\d]+)\s*次/,
            /每日\s*([一二三四五六七八九十\d]+)\s*次/,
            /每\s*日\s*([一二三四五六七八九十\d]+)/
        ];
        
        const chineseToNum = { '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9, '十': 10 };
        
        for (const pattern of freqPatterns) {
            const match = text.match(pattern);
            if (match && match[1]) {
                const numStr = match[1];
                if (chineseToNum[numStr]) {
                    return chineseToNum[numStr];
                }
                const num = parseInt(numStr);
                if (!isNaN(num)) {
                    return num;
                }
            }
        }
        
        return 2;
    },

    analyzeTiming: function(text) {
        const timing = { afterMeal: [], beforeMeal: [], times: [] };
        
        if (text.includes('饭后') || text.includes('餐后')) {
            timing.afterMeal = ['breakfast', 'lunch', 'dinner'].filter(meal => 
                (meal === 'breakfast' && (text.includes('早饭') || text.includes('早餐') || text.includes('晨起'))) ||
                (meal === 'lunch' && (text.includes('午饭') || text.includes('午餐'))) ||
                (meal === 'dinner' && (text.includes('晚饭') || text.includes('晚餐') || text.includes('睡前')))
            );
            if (timing.afterMeal.length === 0) {
                timing.afterMeal = ['breakfast', 'lunch'];
            }
        } else if (text.includes('饭前') || text.includes('餐前')) {
            timing.beforeMeal = ['breakfast', 'lunch', 'dinner'].filter(meal => 
                (meal === 'breakfast' && (text.includes('早饭') || text.includes('早餐'))) ||
                (meal === 'lunch' && (text.includes('午饭') || text.includes('午餐'))) ||
                (meal === 'dinner' && (text.includes('晚饭') || text.includes('晚餐')))
            );
            if (timing.beforeMeal.length === 0) {
                timing.beforeMeal = ['breakfast', 'lunch'];
            }
        }
        
        return timing;
    },

    calculateMedicationTimes: function(timing, mealSettings) {
        const times = [];
        
        timing.afterMeal.forEach(meal => {
            const mealTime = mealSettings[meal];
            const duration = mealSettings.duration || 30;
            
            const [hour, minute] = mealTime.split(':').map(Number);
            const totalMinutes = hour * 60 + minute + duration;
            const newHour = Math.floor(totalMinutes / 60) % 24;
            const newMinute = totalMinutes % 60;
            
            times.push(`${newHour.toString().padStart(2, '0')}:${newMinute.toString().padStart(2, '0')}`);
        });
        
        timing.beforeMeal.forEach(meal => {
            const mealTime = mealSettings[meal];
            const duration = mealSettings.duration || 30;
            
            const [hour, minute] = mealTime.split(':').map(Number);
            const totalMinutes = hour * 60 + minute - 30;
            const newHour = totalMinutes >= 0 ? Math.floor(totalMinutes / 60) : 23;
            const newMinute = totalMinutes >= 0 ? totalMinutes % 60 : 60 + (totalMinutes % 60);
            
            times.push(`${newHour.toString().padStart(2, '0')}:${newMinute.toString().padStart(2, '0')}`);
        });
        
        return times.length > 0 ? times : ['08:00', '20:00'];
    },

    getNextReminderTime: function(times) {
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        let sortedTimes = times.map(time => {
            const [hour, minute] = time.split(':').map(Number);
            return { time, minutes: hour * 60 + minute };
        }).sort((a, b) => a.minutes - b.minutes);

        for (const t of sortedTimes) {
            if (t.minutes > currentMinutes) {
                return t.time;
            }
        }

        return sortedTimes[0] ? sortedTimes[0].time : '';
    },

    renderMedicineReminderPage: function() {
        this.medicationList = this.getMedicationList();
        const list = this.medicationList;

        let listHtml = '';
        if (list.length === 0) {
            listHtml = `
                <div class="no-medication-section">
                    <p class="no-medication-text">暂无药物提醒</p>
                    <button class="add-med-redirect-btn" onclick="app.switchPage('settings')">前往添加 →</button>
                </div>
            `;
        } else {
            listHtml = list.map((med) => {
                const nextTime = this.getNextReminderTime(med.times);
                return `
                    <div class="reminder-card">
                        <h3 class="reminder-card-name">${med.name}</h3>
                        <div class="reminder-card-body">
                            <div class="reminder-card-row">
                                <span class="reminder-card-label">用法用量</span>
                                <span class="reminder-card-value">一日${med.frequency}次，一次${med.dosage}</span>
                            </div>
                            ${nextTime ? `
                                <div class="reminder-next-time">
                                    <span class="reminder-next-label">下次提醒</span>
                                    <span class="reminder-next-value">${nextTime}</span>
                                </div>
                            ` : ''}
                            <div class="reminder-card-row">
                                <span class="reminder-card-label">提醒时间</span>
                                <span class="reminder-card-value">${med.times.join('、')}</span>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        return `
            <div class="page-container">
                <div class="page-header">
                    <button class="back-btn" onclick="app.goBack()">← 返回</button>
                    <h2 class="page-title">吃药提醒</h2>
                </div>
                <div class="page-content settings-page" id="page-medicine-reminder">
                    <div class="medication-list">
                        ${listHtml}
                    </div>
                </div>
            </div>
        `;
    },

    renderAddMedicationAiPage: function() {
        const result = this.aiRecognitionResult || '';
        const mealSettings = this.getMealSettings();
        const name = this.extractMedicineName(result);
        const dosage = this.extractDosage(result);
        const frequency = this.extractFrequency(result);
        const timing = this.analyzeTiming(result);
        const calculatedTimes = this.calculateMedicationTimes(timing, mealSettings);

        const timeInputs = [];
        for (let i = 0; i < frequency; i++) {
            const timeValue = calculatedTimes[i] || (i === 0 ? '08:00' : '20:00');
            const isHidden = i >= frequency;
            timeInputs.push(`
                <div class="setting-item ${isHidden ? 'hidden' : ''}" id="med-time-${i}-container">
                    <label>吃药时间${i + 1}</label>
                    <input type="time" id="med-time-${i}" class="time-input-lg" value="${timeValue}">
                </div>
            `);
        }

        return `
            <div class="page-container">
                <div class="page-header">
                    <button class="back-btn" onclick="app.switchPage('image-ocr')">← 返回</button>
                    <h2 class="page-title">添加吃药提醒</h2>
                </div>
                <div class="page-content settings-page" id="page-add-medication-ai">
                    <div class="ai-reference-box">
                        <h3 class="ai-reference-title">📷 AI识别参考</h3>
                        <div class="ai-reference-content">${this.highlightKeywords(result)}</div>
                    </div>
                    <div class="settings-form">
                        <div class="setting-item">
                            <label>药品名称</label>
                            <input type="text" id="med-name" class="med-name-input-lg" placeholder="请输入药品名称" value="${name}">
                        </div>
                        <div class="setting-item">
                            <label>一日几次</label>
                            <select id="med-frequency" class="frequency-select-lg">
                                <option value="1" ${frequency === 1 ? 'selected' : ''}>1次</option>
                                <option value="2" ${frequency === 2 ? 'selected' : ''}>2次</option>
                                <option value="3" ${frequency === 3 ? 'selected' : ''}>3次</option>
                            </select>
                        </div>
                        <div class="setting-item">
                            <label>一次几粒</label>
                            <input type="text" id="med-dosage" class="med-name-input-lg" placeholder="例如：1粒" value="${dosage}">
                        </div>
                        ${timeInputs.join('')}
                        <button class="save-med-btn-lg" onclick="app.addMedicationFromAi()">💾 保存</button>
                        <div class="save-status" id="save-status"></div>
                    </div>
                </div>
            </div>
        `;
    },

    addMedicationFromAi: function() {
        const name = document.getElementById('med-name').value.trim();
        const dosage = document.getElementById('med-dosage').value.trim();
        const frequency = parseInt(document.getElementById('med-frequency').value);

        if (!name) {
            const status = document.getElementById('save-status');
            status.textContent = '❌ 请输入药品名称';
            status.style.color = '#FF6B6B';
            status.style.fontSize = '36px';
            return;
        }

        const mealSettings = this.getMealSettings();
        const hasMealSettings = mealSettings.breakfast && mealSettings.lunch && mealSettings.dinner;

        if (!hasMealSettings) {
            this.showMealTimeModal('addMedicationFromAi');
            return;
        }

        const times = [];
        for (let i = 0; i < frequency; i++) {
            const time = document.getElementById(`med-time-${i}`).value;
            if (time) {
                times.push(time);
            }
        }

        const newMedication = {
            id: Date.now().toString(),
            name: name,
            dosage: dosage || '1粒',
            frequency: frequency,
            times: times,
            source: 'ai'
        };

        this.medicationList.push(newMedication);
        this.saveMedicationList();

        const status = document.getElementById('save-status');
        status.textContent = '✅ 药物提醒已添加';
        status.style.color = '#4CAF50';
        status.style.fontSize = '36px';

        setTimeout(() => {
            this.switchPage('medicine-reminder');
        }, 2000);
    },

    renderSettingsPage: function() {
        return `
            <div class="page-container">
                <div class="page-header">
                    <button class="back-btn" onclick="app.goBack()">← 返回</button>
                    <h2 class="page-title">长辈设置</h2>
                </div>
                <div class="page-content settings-page" id="page-settings">
                    <div class="settings-form">
                        <button class="setting-card-btn" onclick="app.showMealTimeModal()">
                            <span class="btn-icon">🕐</span>
                            <span class="btn-text">设置用餐时间</span>
                        </button>
                        <button class="setting-card-btn" onclick="app.renderAddMedicationPage()">
                            <span class="btn-icon">💊</span>
                            <span class="btn-text">增加药品提醒</span>
                        </button>
                        <button class="setting-card-btn" onclick="app.renderMedicationList()">
                            <span class="btn-icon">📋</span>
                            <span class="btn-text">现有药物</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    getMealSettings: function() {
        try {
            const saved = localStorage.getItem('mealSettings');
            return saved ? JSON.parse(saved) : {
                breakfast: '07:00',
                lunch: '12:00',
                dinner: '18:00',
                duration: 30
            };
        } catch (e) {
            return {
                breakfast: '07:00',
                lunch: '12:00',
                dinner: '18:00',
                duration: 30
            };
        }
    },

    renderMealSettingsPage: function() {
        const settings = this.getMealSettings();
        const mainContent = document.querySelector('.main');
        if (!mainContent) return;

        mainContent.classList.remove('page-transition');
        void mainContent.offsetWidth;

        mainContent.innerHTML = `
            <div class="page-container">
                <div class="page-header">
                    <button class="back-btn" onclick="app.switchPage('settings')">← 返回</button>
                    <h2 class="page-title">设置用餐时间</h2>
                </div>
                <div class="page-content settings-page" id="page-meal-settings">
                    <div class="settings-form">
                        <div class="setting-item">
                            <label>早饭时间</label>
                            <input type="time" id="meal-breakfast" class="time-input" value="${settings.breakfast}">
                        </div>
                        <div class="setting-item">
                            <label>午饭时间</label>
                            <input type="time" id="meal-lunch" class="time-input" value="${settings.lunch}">
                        </div>
                        <div class="setting-item">
                            <label>晚饭时间</label>
                            <input type="time" id="meal-dinner" class="time-input" value="${settings.dinner}">
                        </div>
                        <div class="setting-item">
                            <label>吃饭时长（分钟）</label>
                            <input type="number" id="meal-duration" class="duration-input" value="${settings.duration}" min="10" max="120">
                        </div>
                        <button class="save-med-btn" onclick="app.saveMealSettings()">💾 保存用餐时间</button>
                        <div class="save-status" id="save-status"></div>
                    </div>
                </div>
            </div>
        `;

        mainContent.classList.add('page-transition');
    },

    saveMealSettings: function() {
        const breakfast = document.getElementById('meal-breakfast').value || '07:00';
        const lunch = document.getElementById('meal-lunch').value || '12:00';
        const dinner = document.getElementById('meal-dinner').value || '18:00';
        const duration = parseInt(document.getElementById('meal-duration').value) || 30;

        const settings = { breakfast, lunch, dinner, duration };
        localStorage.setItem('mealSettings', JSON.stringify(settings));

        const status = document.getElementById('save-status');
        status.textContent = '✅ 设置已保存';
        status.style.color = '#4CAF50';
        status.style.fontSize = '28px';

        setTimeout(() => {
            status.textContent = '';
        }, 3000);
    },

    getMedicationList: function() {
        try {
            const saved = localStorage.getItem('medicationList');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    },

    saveMedicationList: function() {
        localStorage.setItem('medicationList', JSON.stringify(this.medicationList));
    },

    renderAddMedicationPage: function() {
        const mainContent = document.querySelector('.main');
        if (!mainContent) return;

        mainContent.classList.remove('page-transition');
        void mainContent.offsetWidth;

        mainContent.innerHTML = `
            <div class="page-container">
                <div class="page-header">
                    <button class="back-btn" onclick="app.switchPage('settings')">← 返回</button>
                    <h2 class="page-title">增加药品提醒</h2>
                </div>
                <div class="page-content settings-page" id="page-add-medication">
                    <div class="settings-form">
                        <div class="setting-item">
                            <label>药品名称</label>
                            <input type="text" id="med-name" class="med-name-input-lg" placeholder="请输入药品名称">
                        </div>
                        <div class="setting-item">
                            <label>一日几次</label>
                            <select id="med-frequency" class="frequency-select-lg">
                                <option value="1">1次</option>
                                <option value="2" selected>2次</option>
                                <option value="3">3次</option>
                            </select>
                        </div>
                        <div class="setting-item">
                            <label>一次几粒</label>
                            <input type="text" id="med-dosage" class="med-name-input-lg" placeholder="例如：1粒">
                        </div>
                        <div class="setting-item">
                            <label>吃药时间1</label>
                            <input type="time" id="med-time-0" class="time-input-lg" value="08:00">
                        </div>
                        <div class="setting-item" id="med-time-1-container">
                            <label>吃药时间2</label>
                            <input type="time" id="med-time-1" class="time-input-lg" value="20:00">
                        </div>
                        <div class="setting-item hidden" id="med-time-2-container">
                            <label>吃药时间3</label>
                            <input type="time" id="med-time-2" class="time-input-lg" value="14:00">
                        </div>
                        <button class="camera-btn" onclick="app.goToImageRecognition()">📷 拍照识图添加</button>
                        <button class="save-med-btn-lg" onclick="app.addMedication()">💾 保存</button>
                        <div class="save-status" id="save-status"></div>
                    </div>
                </div>
            </div>
        `;

        mainContent.classList.add('page-transition');

        const frequencySelect = document.getElementById('med-frequency');
        if (frequencySelect) {
            frequencySelect.addEventListener('change', (e) => {
                const freq = parseInt(e.target.value);
                for (let i = 0; i < 3; i++) {
                    const container = document.getElementById(`med-time-${i}-container`);
                    if (container) {
                        container.classList.toggle('hidden', i >= freq);
                    }
                }
            });
        }
    },

    goToImageRecognition: function() {
        this.switchPage('image-ocr');
    },

    addMedication: function() {
        const name = document.getElementById('med-name').value.trim();
        const dosage = document.getElementById('med-dosage').value.trim();
        const frequency = parseInt(document.getElementById('med-frequency').value);

        if (!name) {
            const status = document.getElementById('save-status');
            status.textContent = '❌ 请输入药品名称';
            status.style.color = '#FF6B6B';
            status.style.fontSize = '36px';
            return;
        }

        const times = [];
        for (let i = 0; i < frequency; i++) {
            const time = document.getElementById(`med-time-${i}`).value;
            if (time) {
                times.push(time);
            }
        }

        const newMedication = {
            id: Date.now().toString(),
            name: name,
            dosage: dosage || '1粒',
            frequency: frequency,
            times: times,
            source: 'manual'
        };

        this.medicationList.push(newMedication);
        this.saveMedicationList();

        const status = document.getElementById('save-status');
        status.textContent = '✅ 添加成功';
        status.style.color = '#4CAF50';
        status.style.fontSize = '36px';

        setTimeout(() => {
            this.switchPage('settings');
        }, 2000);
    },

    renderMedicationList: function() {
        this.medicationList = this.getMedicationList();
        const list = this.medicationList;
        const mainContent = document.querySelector('.main');
        if (!mainContent) return;

        mainContent.classList.remove('page-transition');
        void mainContent.offsetWidth;

        let listHtml = '';
        if (list.length === 0) {
            listHtml = `<p class="no-medication-text">暂无药物提醒</p>`;
        } else {
            listHtml = list.map((med) => `
                <div class="medication-card">
                    <div class="medication-card-header">
                        <h3 class="medication-card-name">${med.name}</h3>
                        <span class="medication-source-tag ${med.source === 'ai' ? 'source-ai' : 'source-manual'}">
                            ${med.source === 'ai' ? 'AI识别' : '手动添加'}
                        </span>
                    </div>
                    <div class="medication-card-body">
                        <div class="medication-card-row">
                            <span class="medication-card-label">用法</span>
                            <span class="medication-card-value">一日${med.frequency}次，一次${med.dosage}</span>
                        </div>
                        <div class="medication-card-row">
                            <span class="medication-card-label">时间</span>
                            <span class="medication-card-value">${med.times.join('、')}</span>
                        </div>
                    </div>
                    <button class="delete-btn-lg" onclick="app.deleteMedication('${med.id}', '${med.name}')">🗑️ 删除</button>
                </div>
            `).join('');
        }

        mainContent.innerHTML = `
            <div class="page-container">
                <div class="page-header">
                    <button class="back-btn" onclick="app.switchPage('settings')">← 返回</button>
                    <h2 class="page-title">现有药物</h2>
                </div>
                <div class="page-content settings-page" id="page-medication-list">
                    <div class="medication-list">
                        ${listHtml}
                    </div>
                    <div class="save-status" id="save-status"></div>
                </div>
            </div>
        `;

        mainContent.classList.add('page-transition');
    },

    deleteMedication: function(id, name) {
        if (confirm(`确定要删除${name}的提醒吗？`)) {
            this.medicationList = this.medicationList.filter(med => med.id !== id);
            this.saveMedicationList();
            this.renderMedicationList();

            setTimeout(() => {
                const status = document.getElementById('save-status');
                if (status) {
                    status.textContent = '✅ 已删除';
                    status.style.color = '#4CAF50';
                    status.style.fontSize = '36px';
                    setTimeout(() => {
                        status.textContent = '';
                    }, 2000);
                }
            }, 100);
        }
    },

    startMedicationReminder: function() {
        this.medicationList = this.getMedicationList();
        this.mealSettings = this.getMealSettings();
        this.triggeredReminders = new Set();
        this.todayDate = new Date().toDateString();

        this.checkMidnightReset();

        setInterval(() => {
            this.checkMedicationReminder();
        }, 10000);
    },

    checkMidnightReset: function() {
        setInterval(() => {
            const now = new Date();
            const currentDate = now.toDateString();
            if (currentDate !== this.todayDate) {
                this.todayDate = currentDate;
                this.triggeredReminders.clear();
                console.log('⏰ 新的一天，已清空提醒记录');
            }
        }, 60000);
    },

    checkMedicationReminder: function() {
        this.medicationList = this.getMedicationList();
        this.mealSettings = this.getMealSettings();

        const now = new Date();
        const currentHour = now.getHours().toString().padStart(2, '0');
        const currentMinute = now.getMinutes().toString().padStart(2, '0');
        const currentTime = `${currentHour}:${currentMinute}`;

        this.medicationList.forEach(medication => {
            medication.times.forEach(time => {
                if (currentTime === time) {
                    const triggerKey = `${medication.id}_${time}`;
                    if (!this.triggeredReminders.has(triggerKey)) {
                        this.triggeredReminders.add(triggerKey);
                        this.showMedicationReminder(medication);
                    }
                }
            });
        });
    },

    showMedicationReminder: function(medication) {
        const reminderOverlay = document.createElement('div');
        reminderOverlay.className = 'reminder-overlay';
        reminderOverlay.innerHTML = `
            <div class="reminder-card">
                <div class="robot-icon-container" id="reminder-robot">🤖</div>
                <h2>⏰ ${medication.name}时间到！</h2>
                <p>奶奶，该吃${medication.name}了！</p>
                <p class="reminder-dosage">一日${medication.frequency}次，一次${medication.dosage}</p>
                <p class="reminder-time">${new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</p>
                <button class="acknowledge-btn" onclick="app.acknowledgeReminder()">我知道了</button>
            </div>
        `;
        document.body.appendChild(reminderOverlay);

        this.updateRobotEmotion('medicine');
        this.playBeepSound();
        
        setTimeout(() => {
            const robot = document.getElementById('reminder-robot');
            if (robot) robot.textContent = '💊🤖';
        }, 500);
    },

    acknowledgeReminder: function() {
        const overlay = document.querySelector('.reminder-overlay');
        if (overlay) {
            overlay.remove();
        }
        
        this.updateRobotEmotion('normal');
        this.lastAcknowledgedTime = new Date().getHours() * 60 + new Date().getMinutes();
        window.speechSynthesis.cancel();
    },

    playBeepSound: function() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            let count = 0;
            
            const playBeep = () => {
                if (count >= 5) {
                    audioContext.close();
                    return;
                }
                
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.value = 800;
                oscillator.type = 'sine';
                
                gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
                
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.2);
                
                count++;
                setTimeout(playBeep, 400);
            };
            
            playBeep();
        } catch (e) {
            console.error('播放提示音失败:', e);
        }
    },

    renderDefaultPage: function(pageName) {
        return `
            <div class="page-container">
                <div class="page-header">
                    <button class="back-btn" onclick="app.goBack()">← 返回</button>
                    <h2 class="page-title">${this.getPageTitle(pageName)}</h2>
                </div>
                <div class="page-content" id="page-${pageName}">
                    <p class="loading-text">功能开发中，请稍后...</p>
                </div>
            </div>
        `;
    },

    renderAntiFraudCategories: function() {
        const categories = Object.keys(this.scamData);
        let buttonsHtml = categories.map((cat, index) => {
            const color = this.scamCategoryColors[cat] || '#FF6B6B';
            return `
                <button class="category-btn" onclick="app.showScamDetails('${cat}')"
                        style="border-left-color: ${color}">
                    <span class="btn-icon">${this.getCategoryIcon(cat)}</span>
                    <span class="btn-text">${cat}</span>
                </button>
            `;
        }).join('');

        return `
            <div class="page-container">
                <div class="page-header">
                    <button class="back-btn" onclick="app.goBack()">← 返回</button>
                    <h2 class="page-title">AI防骗帮手</h2>
                </div>
                <div class="page-content" id="page-anti-fraud">
                    <p class="page-hint">请选择遇到的诈骗类型</p>
                    <div class="category-container">
                        ${buttonsHtml}
                    </div>
                </div>
            </div>
        `;
    },

    getCategoryIcon: function(cat) {
        const iconMap = {
            '冒充公检法': '🔴',
            '保健品推销': '🟡',
            '中奖诈骗': '🟠',
            '冒充熟人': '🟣',
            '投资理财诈骗': '🟢',
            '上门服务诈骗': '🟩'
        };
        return iconMap[cat] || '⚠️';
    },

    showScamDetails: function(category) {
        const scams = this.scamData[category];
        if (!scams) return;

        let buttonsHtml = scams.map((scam, index) => {
            return `
                <button class="scam-btn" onclick="app.showCounterAttack('${category}', ${index})">
                    <span class="scam-number">${index + 1}</span>
                    <span class="scam-text">${scam.scam}</span>
                </button>
            `;
        }).join('');

        const mainContent = document.querySelector('.main');
        if (mainContent) {
            mainContent.classList.remove('page-transition');
            void mainContent.offsetWidth;
            
            mainContent.innerHTML = `
                <div class="page-container">
                    <div class="page-header">
                        <button class="back-btn" onclick="app.switchPage('anti-fraud')">← 返回</button>
                        <h2 class="page-title">${category}</h2>
                    </div>
                    <div class="page-content" id="page-anti-fraud-details">
                        <p class="page-hint">以下是常见诈骗话术，点击查看应对方法</p>
                        <div class="scam-container">
                            ${buttonsHtml}
                        </div>
                    </div>
                </div>
            `;
            mainContent.classList.add('page-transition');
        }
    },

    showCounterAttack: function(category, index) {
        const scam = this.scamData[category][index];
        if (!scam) return;

        const mainContent = document.querySelector('.main');
        if (mainContent) {
            mainContent.classList.remove('page-transition');
            void mainContent.offsetWidth;
            
            mainContent.innerHTML = `
                <div class="page-container">
                    <div class="page-header">
                        <button class="back-btn" onclick="app.showScamDetails('${category}')">← 返回</button>
                        <h2 class="page-title">应对技巧</h2>
                    </div>
                    <div class="page-content counter-attack-page" id="page-counter-attack">
                        <div class="robot-icon-container" id="robot-container">🤖</div>
                        <h3 class="scam-title">骗子说：</h3>
                        <p class="scam-content">${scam.scam}</p>
                        <h3 class="counter-title">您可以这样回应：</h3>
                        <div class="counter-content" id="counter-content">
                            ${scam.counter}
                        </div>
                        <button class="replay-btn" data-text="${this.escapeHtml(scam.counter)}">🔊 重新朗读</button>
                    </div>
                </div>
            `;
            mainContent.classList.add('page-transition');
        }

        this.updateRobotEmotion('success');
        this.speakText(scam.counter);
    },

    escapeHtml: function(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    getPageTitle: function(pageName) {
        const titles = {
            'anti-fraud': 'AI防骗帮手',
            'voice-consult': '语音问诊',
            'image-ocr': '拍图认字',
            'medicine-reminder': '吃药提醒',
            'settings': '长辈设置'
        };
        return titles[pageName] || '功能页面';
    },

    goBack: function() {
        const mainContent = document.querySelector('.main');
        const header = document.querySelector('.header');
        const footer = document.querySelector('.footer');

        if (!mainContent) return;

        mainContent.classList.remove('page-transition');
        void mainContent.offsetWidth;

        mainContent.innerHTML = `
            <div class="card-container">
                <button class="card anti-fraud">
                    <span class="btn-icon">🛡️</span>
                    <span class="btn-text">AI防骗帮手</span>
                </button>
                <button class="card voice-consult">
                    <span class="btn-icon">🎤</span>
                    <span class="btn-text">语音问诊</span>
                </button>
                <button class="card image-ocr">
                    <span class="btn-icon">📷</span>
                    <span class="btn-text">拍图认字</span>
                </button>
                <button class="card medicine-reminder">
                    <span class="btn-icon">⏰</span>
                    <span class="btn-text">吃药提醒</span>
                </button>
                <button class="card scam-game">
                    <span class="btn-icon">🎮</span>
                    <span class="btn-text">防骗情景模拟</span>
                </button>
            </div>
        `;
        mainContent.classList.add('page-transition');

        header.style.display = '';
        footer.style.display = '';
        this.updateRobotEmotion('normal');

        this.bindEvents();
    },

    adjustFontSize: function(delta) {
        console.log('调整字体大小:', delta);
    },

    toggleVoice: function() {
        console.log('切换语音播报');
    },

    addPageStyles: function() {
        const existingStyle = document.getElementById('page-styles');
        if (existingStyle) return;

        const style = document.createElement('style');
        style.id = 'page-styles';
        style.textContent = `
            .page-container {
                width: 90%;
                max-width: 500px;
                margin: 0 auto;
            }
            .page-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 30px;
                padding: 0 10px;
            }
            .back-btn {
                font-size: 28px;
                color: #333;
                background: none;
                border: none;
                cursor: pointer;
                padding: 10px 0;
                text-decoration: underline;
                font-weight: bold;
            }
            .page-title {
                font-size: 36px;
                color: #333;
                margin: 0;
                font-weight: bold;
            }
            .page-content {
                background: #FFFFFF;
                border-radius: 20px;
                padding: 40px 30px;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
                text-align: center;
            }
            .page-content h3 {
                font-size: 32px;
                color: #666;
                margin-bottom: 15px;
                text-align: left;
            }
            .page-hint {
                font-size: 28px;
                color: #999;
                margin-bottom: 30px;
            }
            .loading-text {
                font-size: 28px;
                color: #999;
                line-height: 1.6;
            }
            .hidden {
                display: none !important;
            }
            .voice-consult-page {
                padding: 30px;
            }
            .microphone-section {
                margin-bottom: 40px;
            }
            .mic-btn {
                width: 160px;
                height: 160px;
                border-radius: 50%;
                background: #FF6B6B;
                border: none;
                font-size: 80px;
                cursor: pointer;
                transition: all 0.3s ease;
                box-shadow: 0 8px 24px rgba(255, 107, 107, 0.4);
            }
            .mic-btn:hover {
                transform: scale(1.05);
            }
            .mic-btn:active {
                transform: scale(0.95);
            }
            .mic-btn.listening {
                background: #4ECDC4;
                box-shadow: 0 0 0 20px rgba(78, 205, 196, 0.3), 0 0 0 40px rgba(78, 205, 196, 0.2), 0 0 0 60px rgba(78, 205, 196, 0.1);
                animation: pulse 1.5s infinite;
            }
            @keyframes pulse {
                0% {
                    box-shadow: 0 0 0 0 rgba(78, 205, 196, 0.7);
                }
                70% {
                    box-shadow: 0 0 0 40px rgba(78, 205, 196, 0);
                }
                100% {
                    box-shadow: 0 0 0 0 rgba(78, 205, 196, 0);
                }
            }
            .mic-hint {
                font-size: 32px;
                color: #666;
                margin-top: 20px;
            }
            .no-voice-warning {
                background: #FFF3E0;
                border-radius: 15px;
                padding: 20px;
                margin-bottom: 30px;
            }
            .no-voice-warning p {
                font-size: 28px;
                color: #FF9800;
                margin: 0;
            }
            .input-section {
                margin-bottom: 30px;
            }
            .recognized-text {
                font-size: 36px;
                color: #333;
                background: #FFF8F0;
                padding: 20px;
                border-radius: 15px;
                text-align: left;
                line-height: 1.6;
                min-height: 80px;
            }
            .manual-input-section {
                margin-bottom: 30px;
            }
            .manual-input-section textarea {
                width: 100%;
                height: 150px;
                font-size: 28px;
                padding: 20px;
                border-radius: 15px;
                border: 2px solid #ddd;
                background: #FFF8F0;
                resize: none;
                margin-bottom: 20px;
            }
            .manual-submit-btn {
                font-size: 28px;
                padding: 15px 60px;
                border-radius: 30px;
                border: none;
                background: #4ECDC4;
                color: #FFFFFF;
                cursor: pointer;
                font-weight: bold;
            }
            .ai-response-section {
                margin-top: 30px;
            }
            .ai-response-box {
                background: linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%);
                border-radius: 20px;
                padding: 30px;
                text-align: left;
            }
            .ai-response-text {
                font-size: 48px;
                color: #1976D2;
                line-height: 1.6;
                margin-bottom: 20px;
            }
            .ai-response-buttons {
                display: flex;
                gap: 20px;
                justify-content: center;
            }
            .replay-btn {
                font-size: 32px;
                padding: 20px 60px;
                border-radius: 40px;
                border: none;
                background: #4ECDC4;
                color: #FFFFFF;
                cursor: pointer;
                font-weight: bold;
                transition: all 0.2s;
                box-shadow: 0 4px 15px rgba(78, 205, 196, 0.3);
            }
            .replay-btn:active {
                transform: scale(0.96);
            }
            .show-text-btn {
                font-size: 32px;
                padding: 20px 60px;
                border-radius: 40px;
                border: 2px solid #FF9800;
                background: #FFFFFF;
                color: #FF9800;
                cursor: pointer;
                font-weight: bold;
                transition: all 0.2s;
            }
            .show-text-btn:active {
                transform: scale(0.96);
            }
            .category-container {
                display: flex;
                flex-direction: column;
                gap: 20px;
            }
            .category-btn {
                width: 100%;
                padding: 30px 20px;
                border-radius: 20px;
                background: #FFFFFF;
                border-left: 8px solid;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 20px;
                cursor: pointer;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
                transition: all 0.2s;
                border-top: none;
                border-right: none;
                border-bottom: none;
            }
            .category-btn:active {
                transform: scale(0.96);
            }
            .category-btn .btn-icon {
                font-size: 48px;
            }
            .category-btn .btn-text {
                font-size: 48px;
                font-weight: bold;
                color: #333;
            }
            .scam-container {
                display: flex;
                flex-direction: column;
                gap: 15px;
            }
            .scam-btn {
                width: 100%;
                padding: 25px 20px;
                border-radius: 15px;
                background: #FFF8F0;
                border: 2px solid #FFD93D;
                display: flex;
                align-items: flex-start;
                gap: 15px;
                cursor: pointer;
                transition: all 0.2s;
                text-align: left;
            }
            .scam-btn:active {
                transform: scale(0.96);
            }
            .scam-number {
                font-size: 36px;
                font-weight: bold;
                color: #FFD93D;
                min-width: 40px;
            }
            .scam-text {
                font-size: 32px;
                color: #333;
                flex: 1;
                line-height: 1.5;
            }
            .counter-attack-page {
                padding: 30px;
            }
            .robot-icon-container {
                font-size: 80px;
                margin-bottom: 20px;
                transition: all 0.5s ease;
            }
            .scam-title, .counter-title {
                font-size: 32px;
                color: #666;
                margin-bottom: 15px;
                text-align: left;
            }
            .scam-content {
                font-size: 36px;
                color: #333;
                background: #FFF8F0;
                padding: 20px;
                border-radius: 15px;
                margin-bottom: 30px;
                text-align: left;
                line-height: 1.6;
            }
            .counter-content {
                font-size: 60px;
                font-weight: bold;
                color: #FFFFFF;
                background: linear-gradient(135deg, #FF6B6B 0%, #FF9800 100%);
                padding: 30px;
                border-radius: 20px;
                margin-bottom: 30px;
                text-align: center;
                line-height: 1.6;
                box-shadow: 0 8px 24px rgba(255, 107, 107, 0.4);
            }
            .settings-page {
                text-align: left;
            }
            .settings-form {
                display: flex;
                flex-direction: column;
                gap: 30px;
            }
            .setting-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px;
                background: #FFF8F0;
                border-radius: 12px;
            }
            .setting-item label {
                font-size: 32px;
                color: #333;
                font-weight: bold;
            }
            .setting-controls {
                display: flex;
                align-items: center;
                gap: 15px;
            }
            .size-btn {
                font-size: 32px;
                width: 60px;
                height: 60px;
                border-radius: 10px;
                border: 2px solid #FF9800;
                background: #FFFFFF;
                color: #FF9800;
                cursor: pointer;
                font-weight: bold;
            }
            .size-display {
                font-size: 28px;
                color: #666;
                min-width: 80px;
                text-align: center;
            }
            .toggle-btn {
                font-size: 28px;
                padding: 12px 30px;
                border-radius: 30px;
                border: none;
                background: #FF6B6B;
                color: #FFFFFF;
                cursor: pointer;
                font-weight: bold;
            }
            .time-input {
                font-size: 28px;
                padding: 10px 20px;
                border-radius: 10px;
                border: 2px solid #ddd;
                background: #FFFFFF;
            }
            .image-ocr-page {
                padding: 30px;
            }
            .upload-area {
                border: 4px dashed #FF9800;
                border-radius: 20px;
                padding: 60px 40px;
                cursor: pointer;
                transition: all 0.3s ease;
                background: #FFF8F0;
            }
            .upload-area:hover {
                border-color: #FF6B6B;
                background: #FFF3E0;
            }
            .upload-icon {
                font-size: 80px;
                margin-bottom: 20px;
            }
            .upload-text {
                font-size: 32px;
                color: #666;
                margin: 0;
            }
            .preview-section {
                margin-top: 30px;
                margin-bottom: 30px;
            }
            #preview-image {
                max-width: 300px;
                max-height: 300px;
                border-radius: 15px;
                margin: 15px 0;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
            }
            .reupload-btn {
                font-size: 28px;
                padding: 15px 40px;
                border-radius: 30px;
                border: 2px solid #FF9800;
                background: #FFFFFF;
                color: #FF9800;
                cursor: pointer;
                font-weight: bold;
            }
            .loading-section {
                margin: 40px 0;
            }
            .ocr-result-section {
                margin-top: 30px;
            }
            .ocr-result-box {
                font-size: 48px;
                color: #333;
                background: linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%);
                padding: 30px;
                border-radius: 20px;
                text-align: left;
                line-height: 1.8;
                margin-bottom: 30px;
            }
            .highlight-danger {
                color: #FF6B6B;
                font-weight: bold;
                background: #FFEBEE;
                padding: 2px 8px;
                border-radius: 5px;
            }
            .med-name-input {
                font-size: 28px;
                padding: 10px 20px;
                border-radius: 10px;
                border: 2px solid #ddd;
                background: #FFFFFF;
                width: 200px;
            }
            .save-med-btn {
                font-size: 32px;
                padding: 20px 40px;
                border-radius: 40px;
                border: none;
                background: #4CAF50;
                color: #FFFFFF;
                cursor: pointer;
                font-weight: bold;
                margin-top: 20px;
                width: 100%;
            }
            .save-status {
                text-align: center;
                margin-top: 20px;
                font-weight: bold;
            }
            .med-name-input-lg {
                font-size: 42px;
                padding: 15px 25px;
                border-radius: 15px;
                border: 2px solid #ddd;
                background: #FFFFFF;
                width: 300px;
            }
            .frequency-select-lg {
                font-size: 42px;
                padding: 15px 25px;
                border-radius: 15px;
                border: 2px solid #ddd;
                background: #FFFFFF;
                min-width: 180px;
            }
            .time-input-lg {
                font-size: 42px;
                padding: 15px 25px;
                border-radius: 15px;
                border: 2px solid #ddd;
                background: #FFFFFF;
                min-width: 180px;
            }
            .save-med-btn-lg {
                font-size: 42px;
                padding: 25px 60px;
                border-radius: 50px;
                border: none;
                background: #4CAF50;
                color: #FFFFFF;
                cursor: pointer;
                font-weight: bold;
                margin-top: 20px;
                width: 100%;
                box-shadow: 0 8px 24px rgba(76, 175, 80, 0.4);
            }
            .save-med-btn-lg:active {
                transform: scale(0.96);
            }
            .camera-btn {
                font-size: 36px;
                padding: 20px 40px;
                border-radius: 40px;
                border: 2px solid #FF9800;
                background: #FFFFFF;
                color: #FF9800;
                cursor: pointer;
                font-weight: bold;
                margin-top: 20px;
                width: 100%;
            }
            .camera-btn:active {
                transform: scale(0.96);
            }
            .setting-card-btn {
                width: 100%;
                padding: 30px 20px;
                border-radius: 20px;
                background: #FFFFFF;
                border: none;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 20px;
                cursor: pointer;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
                transition: all 0.2s;
                border-left: 8px solid #4ECDC4;
            }
            .setting-card-btn:nth-child(2) {
                border-left-color: #FF9800;
            }
            .setting-card-btn:nth-child(3) {
                border-left-color: #4CAF50;
            }
            .setting-card-btn:active {
                transform: scale(0.96);
            }
            .setting-card-btn .btn-icon {
                font-size: 48px;
            }
            .setting-card-btn .btn-text {
                font-size: 48px;
                font-weight: bold;
                color: #333;
            }
            .frequency-select {
                font-size: 28px;
                padding: 10px 20px;
                border-radius: 10px;
                border: 2px solid #ddd;
                background: #FFFFFF;
            }
            .duration-input {
                font-size: 28px;
                padding: 10px 20px;
                border-radius: 10px;
                border: 2px solid #ddd;
                background: #FFFFFF;
                width: 150px;
            }
            .medication-list {
                display: flex;
                flex-direction: column;
                gap: 20px;
            }
            .medication-item {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 25px 20px;
                background: #FFF8F0;
                border-radius: 15px;
                border: 2px solid #E0E0E0;
            }
            .medication-info {
                display: flex;
                align-items: flex-start;
                gap: 15px;
                flex: 1;
            }
            .medication-number {
                font-size: 36px;
                font-weight: bold;
                color: #4ECDC4;
                min-width: 40px;
            }
            .medication-details {
                text-align: left;
            }
            .medication-name {
                font-size: 36px;
                font-weight: bold;
                color: #333;
                margin: 0 0 8px 0;
            }
            .medication-dosage {
                font-size: 28px;
                color: #666;
                margin: 0 0 8px 0;
            }
            .medication-times {
                font-size: 28px;
                color: #999;
                margin: 0;
            }
            .delete-btn {
                font-size: 32px;
                padding: 15px 20px;
                border-radius: 10px;
                border: none;
                background: #FFEBEE;
                color: #FF6B6B;
                cursor: pointer;
                font-weight: bold;
            }
            .delete-btn:active {
                transform: scale(0.96);
            }
            .delete-btn-lg {
                font-size: 36px;
                padding: 20px 40px;
                border-radius: 15px;
                border: none;
                background: #FFEBEE;
                color: #FF6B6B;
                cursor: pointer;
                font-weight: bold;
                margin-top: 20px;
                width: 100%;
            }
            .delete-btn-lg:active {
                transform: scale(0.96);
            }
            .no-medication-text {
                font-size: 48px;
                color: #999;
                text-align: center;
                padding: 60px 20px;
            }
            .medication-card {
                background: #FFFFFF;
                border-radius: 20px;
                padding: 30px;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
                border: 2px solid #E0E0E0;
            }
            .medication-card-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 20px;
            }
            .medication-card-name {
                font-size: 48px;
                font-weight: bold;
                color: #333;
                margin: 0;
            }
            .medication-source-tag {
                font-size: 28px;
                padding: 8px 20px;
                border-radius: 30px;
                font-weight: bold;
            }
            .source-manual {
                background: #E3F2FD;
                color: #1976D2;
            }
            .source-ai {
                background: #E8F5E9;
                color: #388E3C;
            }
            .medication-card-body {
                background: #FFF8F0;
                border-radius: 15px;
                padding: 20px;
            }
            .medication-card-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 15px 0;
                border-bottom: 1px dashed #E0E0E0;
            }
            .medication-card-row:last-child {
                border-bottom: none;
            }
            .medication-card-label {
                font-size: 32px;
                color: #999;
                font-weight: bold;
            }
            .medication-card-value {
                font-size: 36px;
                color: #333;
                font-weight: bold;
            }
            .reminder-dosage {
                font-size: 32px;
                color: #666;
                margin: 10px 0;
            }
            .no-medication-section {
                text-align: center;
                padding: 80px 20px;
            }
            .add-med-redirect-btn {
                font-size: 42px;
                padding: 25px 60px;
                border-radius: 50px;
                border: none;
                background: linear-gradient(135deg, #4ECDC4, #44A08D);
                color: #FFFFFF;
                cursor: pointer;
                font-weight: bold;
                margin-top: 40px;
                box-shadow: 0 8px 24px rgba(78, 205, 196, 0.4);
            }
            .add-med-redirect-btn:active {
                transform: scale(0.96);
            }
            .reminder-card {
                background: #FFFFFF;
                border-radius: 20px;
                padding: 30px;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
                border: 2px solid #E0E0E0;
                margin-bottom: 20px;
            }
            .reminder-card-name {
                font-size: 48px;
                font-weight: bold;
                color: #333;
                margin: 0 0 20px 0;
            }
            .reminder-card-body {
                background: #FFF8F0;
                border-radius: 15px;
                padding: 25px;
            }
            .reminder-card-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 18px 0;
                border-bottom: 1px dashed #E0E0E0;
            }
            .reminder-card-row:last-child {
                border-bottom: none;
            }
            .reminder-card-label {
                font-size: 32px;
                color: #999;
                font-weight: bold;
            }
            .reminder-card-value {
                font-size: 36px;
                color: #333;
                font-weight: bold;
            }
            .reminder-next-time {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px;
                background: linear-gradient(135deg, #FFF3E0, #FFE0B2);
                border-radius: 15px;
                margin: 15px 0;
                border: 2px solid #FFB74D;
            }
            .reminder-next-label {
                font-size: 32px;
                color: #EF6C00;
                font-weight: bold;
            }
            .reminder-next-value {
                font-size: 48px;
                color: #E65100;
                font-weight: bold;
            }
            .ocr-confirm-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 1000;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .ocr-confirm-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
            }
            .ocr-confirm-card {
                position: relative;
                background: #FFFFFF;
                border-radius: 20px;
                padding: 30px;
                margin: 20px;
                max-width: 600px;
                width: 100%;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
            }
            .ocr-confirm-title {
                font-size: 48px;
                font-weight: bold;
                color: #333;
                margin: 0 0 20px 0;
                text-align: center;
            }
            .ocr-confirm-content {
                font-size: 32px;
                color: #666;
                line-height: 1.6;
                margin-bottom: 30px;
                max-height: 40vh;
                overflow-y: auto;
            }
            .ocr-confirm-buttons {
                display: flex;
                flex-direction: column;
                gap: 20px;
            }
            .ocr-add-btn {
                font-size: 42px;
                padding: 25px 60px;
                border-radius: 50px;
                border: none;
                background: #4CAF50;
                color: #FFFFFF;
                cursor: pointer;
                font-weight: bold;
                width: 100%;
                box-shadow: 0 8px 24px rgba(76, 175, 80, 0.4);
            }
            .ocr-add-btn:active {
                transform: scale(0.96);
            }
            .ocr-cancel-btn {
                font-size: 36px;
                padding: 20px 40px;
                border-radius: 40px;
                border: none;
                background: #F5F5F5;
                color: #666;
                cursor: pointer;
                font-weight: bold;
                width: 100%;
            }
            .ocr-cancel-btn:active {
                transform: scale(0.96);
            }
            .ai-reference-box {
                background: linear-gradient(135deg, #E3F2FD, #BBDEFB);
                border-radius: 15px;
                padding: 25px;
                margin-bottom: 30px;
                border: 2px solid #90CAF9;
            }
            .ai-reference-title {
                font-size: 36px;
                font-weight: bold;
                color: #1976D2;
                margin: 0 0 15px 0;
            }
            .ai-reference-content {
                font-size: 28px;
                color: #424242;
                line-height: 1.6;
                max-height: 30vh;
                overflow-y: auto;
            }
            .meal-settings-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 1000;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .meal-settings-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
            }
            .meal-settings-card {
                position: relative;
                background: #FFFFFF;
                border-radius: 20px;
                padding: 30px;
                margin: 20px;
                max-width: 500px;
                width: 100%;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
            }
            .meal-settings-title {
                font-size: 42px;
                font-weight: bold;
                color: #333;
                margin: 0 0 30px 0;
                text-align: center;
            }
            .meal-settings-form {
                display: flex;
                flex-direction: column;
                gap: 25px;
                margin-bottom: 30px;
            }
            .meal-setting-item {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            .meal-setting-item label {
                font-size: 32px;
                font-weight: bold;
                color: #666;
            }
            .meal-settings-buttons {
                display: flex;
                flex-direction: column;
                gap: 15px;
            }
            .meal-save-btn {
                font-size: 42px;
                padding: 25px 60px;
                border-radius: 50px;
                border: none;
                background: #4CAF50;
                color: #FFFFFF;
                cursor: pointer;
                font-weight: bold;
                width: 100%;
                box-shadow: 0 8px 24px rgba(76, 175, 80, 0.4);
            }
            .meal-save-btn:active {
                transform: scale(0.96);
            }
            .meal-cancel-btn {
                font-size: 36px;
                padding: 20px 40px;
                border-radius: 40px;
                border: none;
                background: #F5F5F5;
                color: #666;
                cursor: pointer;
                font-weight: bold;
                width: 100%;
            }
            .meal-cancel-btn:active {
                transform: scale(0.96);
            }
            .universal-meal-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 1000;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .universal-meal-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
            }
            .universal-meal-card {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: #FFFFFF;
                border-radius: 16px;
                padding: 20px;
                margin: 10px;
                max-width: 400px;
                width: 85%;
                max-height: 70vh;
                overflow-y: auto;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
                display: flex;
                flex-direction: column;
            }
            @media (max-width: 480px) {
                .universal-meal-card {
                    width: 90%;
                    padding: 15px;
                }
            }
            .universal-meal-title {
                font-size: 28px;
                font-weight: bold;
                color: #333;
                margin: 0 0 15px 0;
                text-align: center;
                flex-shrink: 0;
            }
            .universal-meal-form {
                display: flex;
                flex-direction: column;
                gap: 10px;
                flex: 1;
                overflow-y: auto;
            }
            .universal-meal-item {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }
            .universal-meal-item label {
                font-size: 20px;
                font-weight: bold;
                color: #666;
            }
            .universal-meal-item input[type="time"],
            .universal-meal-item input[type="number"] {
                height: 40px;
                font-size: 18px;
                padding: 0 12px;
                border-radius: 8px;
                border: 2px solid #ddd;
                background: #FFFFFF;
                box-sizing: border-box;
                min-height: 40px;
            }
            .duration-input-lg {
                font-size: 18px;
                padding: 0 12px;
                border-radius: 8px;
                border: 2px solid #ddd;
                background: #FFFFFF;
                width: 150px;
                height: 40px;
                box-sizing: border-box;
            }
            .universal-meal-buttons {
                display: flex;
                gap: 10px;
                margin-top: 15px;
                padding-top: 15px;
                border-top: 1px solid #eee;
                background: #FFFFFF;
                flex-shrink: 0;
            }
            .universal-meal-save-btn {
                font-size: 24px;
                height: 50px;
                padding: 0 20px;
                border-radius: 8px;
                border: none;
                background: #4CAF50;
                color: #FFFFFF;
                cursor: pointer;
                font-weight: bold;
                flex: 1;
                box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
                min-height: 50px;
            }
            .universal-meal-save-btn:active {
                transform: scale(0.98);
            }
            .universal-meal-cancel-btn {
                font-size: 24px;
                height: 50px;
                padding: 0 20px;
                border-radius: 8px;
                border: none;
                background: #F5F5F5;
                color: #666;
                cursor: pointer;
                font-weight: bold;
                flex: 1;
                min-height: 50px;
            }
            .universal-meal-cancel-btn:active {
                transform: scale(0.96);
            }
            .scam-game-start {
                text-align: center;
                padding: 40px 20px;
            }
            .scam-game-icon {
                font-size: 120px;
                margin-bottom: 30px;
            }
            .scam-game-title {
                font-size: 48px;
                font-weight: bold;
                color: #E65100;
                margin: 0 0 20px 0;
            }
            .scam-game-desc {
                font-size: 32px;
                color: #666;
                margin: 0 0 40px 0;
            }
            .scam-start-btn {
                font-size: 42px;
                padding: 25px 80px;
                border-radius: 50px;
                border: none;
                background: linear-gradient(135deg, #FFB74D, #FF9800);
                color: #FFFFFF;
                cursor: pointer;
                font-weight: bold;
                box-shadow: 0 8px 24px rgba(255, 183, 77, 0.4);
            }
            .scam-start-btn:active {
                transform: scale(0.96);
            }
            .scam-ai-btn {
                font-size: 36px;
                padding: 20px 60px;
                border-radius: 50px;
                border: 3px solid #2196F3;
                background: #FFFFFF;
                color: #2196F3;
                cursor: pointer;
                font-weight: bold;
                margin-top: 20px;
                box-shadow: 0 4px 12px rgba(33, 150, 243, 0.2);
            }
            .scam-ai-btn:active {
                transform: scale(0.96);
            }
            .scam-ai-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            .scam-question-container {
                padding: 20px;
                max-width: 600px;
                margin: 0 auto;
            }
            .scam-progress {
                font-size: 28px;
                color: #999;
                text-align: center;
                margin-bottom: 20px;
            }
            .scam-robot-emoji {
                font-size: 80px;
                text-align: center;
                margin-bottom: 20px;
            }
            .scam-question-title {
                font-size: 36px;
                font-weight: bold;
                color: #333;
                margin: 0 0 20px 0;
                text-align: center;
            }
            .scam-question-desc {
                font-size: 28px;
                line-height: 1.6;
                color: #444;
                background: #E8F4FD;
                padding: 20px;
                border-radius: 15px;
                margin: 0 0 30px 0;
            }
            .scam-options {
                display: flex;
                flex-direction: column;
                gap: 15px;
            }
            .scam-option-btn {
                font-size: 32px;
                padding: 25px 20px;
                border-radius: 15px;
                border: none;
                background: #FFFFFF;
                color: #333;
                cursor: pointer;
                font-weight: bold;
                text-align: left;
                border-left: 6px solid #CCCCCC;
                transition: all 0.3s ease;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            }
            .scam-option-btn:hover:not(:disabled) {
                border-left-color: #2196F3;
                background: #F5F5F5;
            }
            .scam-option-btn:active:not(:disabled) {
                transform: scale(0.98);
            }
            .scam-option-btn:disabled {
                cursor: not-allowed;
                opacity: 0.8;
            }
            .scam-option-correct {
                border-left-color: #4CAF50 !important;
                background: #E8F5E9 !important;
                color: #2E7D32 !important;
            }
            .scam-option-wrong {
                border-left-color: #F44336 !important;
                background: #FFEBEE !important;
                color: #C62828 !important;
            }
            .scam-feedback {
                margin-top: 30px;
                animation: fadeIn 0.5s ease;
            }
            .scam-feedback-correct,
            .scam-feedback-wrong {
                padding: 30px;
                border-radius: 20px;
                text-align: center;
            }
            .scam-feedback-correct {
                background: linear-gradient(135deg, #E8F5E9, #C8E6C9);
                border: 3px solid #4CAF50;
            }
            .scam-feedback-wrong {
                background: linear-gradient(135deg, #FFEBEE, #FFCDD2);
                border: 3px solid #F44336;
            }
            .scam-feedback-icon {
                font-size: 80px;
                margin-bottom: 15px;
            }
            .scam-feedback-title {
                font-size: 42px;
                font-weight: bold;
                margin: 0 0 15px 0;
            }
            .scam-feedback-correct .scam-feedback-title {
                color: #2E7D32;
            }
            .scam-feedback-wrong .scam-feedback-title {
                color: #C62828;
            }
            .scam-feedback-text {
                font-size: 30px;
                line-height: 1.6;
                color: #444;
                margin: 0 0 20px 0;
            }
            .scam-feedback-robot {
                font-size: 60px;
                margin-bottom: 20px;
            }
            .scam-next-btn {
                font-size: 36px;
                padding: 20px 60px;
                border-radius: 50px;
                border: none;
                background: #FFB74D;
                color: #FFFFFF;
                cursor: pointer;
                font-weight: bold;
                box-shadow: 0 8px 24px rgba(255, 183, 77, 0.4);
            }
            .scam-next-btn:active {
                transform: scale(0.96);
            }
            .scam-result-container {
                text-align: center;
                padding: 40px 20px;
            }
            .scam-result-icon {
                font-size: 120px;
                margin-bottom: 30px;
            }
            .scam-result-title {
                font-size: 48px;
                font-weight: bold;
                color: #333;
                margin: 0 0 20px 0;
            }
            .scam-result-score {
                font-size: 56px;
                font-weight: bold;
                color: #FFB74D;
                margin: 0 0 20px 0;
            }
            .scam-result-subtitle {
                font-size: 32px;
                color: #666;
                margin: 0 0 40px 0;
            }
            .scam-result-buttons {
                display: flex;
                flex-direction: column;
                gap: 20px;
                max-width: 400px;
                margin: 0 auto;
            }
            .scam-restart-btn,
            .scam-home-btn {
                font-size: 36px;
                padding: 25px 40px;
                border-radius: 50px;
                border: none;
                cursor: pointer;
                font-weight: bold;
                width: 100%;
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
            }
            .scam-restart-btn {
                background: linear-gradient(135deg, #FFB74D, #FF9800);
                color: #FFFFFF;
            }
            .scam-home-btn {
                background: #F5F5F5;
                color: #666;
            }
            .scam-restart-btn:active,
            .scam-home-btn:active {
                transform: scale(0.96);
            }
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .daily-tip-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 2000;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .daily-tip-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
            }
            .daily-tip-card {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: linear-gradient(135deg, #FFF8F0, #FFFFFF);
                border-radius: 20px;
                padding: 30px;
                margin: 20px;
                max-width: 500px;
                width: 85%;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
                text-align: center;
                border: 3px solid #FFB74D;
            }
            @media (max-width: 480px) {
                .daily-tip-card {
                    width: 90%;
                    padding: 20px;
                }
            }
            .daily-tip-icon {
                font-size: 80px;
                margin-bottom: 20px;
            }
            .daily-tip-title {
                font-size: 42px;
                font-weight: bold;
                color: #E65100;
                margin: 0 0 20px 0;
            }
            .daily-tip-content {
                font-size: 32px;
                color: #424242;
                line-height: 1.6;
                margin: 0 0 30px 0;
                padding: 20px;
                background: #FFF3E0;
                border-radius: 12px;
                border-left: 5px solid #FFB74D;
            }
            .daily-tip-close-btn {
                font-size: 36px;
                padding: 20px 60px;
                border-radius: 50px;
                border: none;
                background: #FFB74D;
                color: #FFFFFF;
                cursor: pointer;
                font-weight: bold;
                box-shadow: 0 8px 24px rgba(255, 183, 77, 0.4);
            }
            .daily-tip-close-btn:active {
                transform: scale(0.96);
            }
        `;
        document.head.appendChild(style);
    }
};

async function checkBackendHealth() {
    try {
        const response = await fetch('/api/health');
        const data = await response.json();
        if (data.status === 'ok') {
            console.log('✅ 后端服务连接正常');
            DEMO_MODE = false;
        }
    } catch (error) {
        console.warn('⚠️ 后端服务未启动，将使用演示模式');
        DEMO_MODE = true;
    }
}

document.addEventListener('DOMContentLoaded', async function() {
    await checkBackendHealth();
    app.init();
});