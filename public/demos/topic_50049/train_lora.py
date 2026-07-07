#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
LoRA 微调脚本 - 情绪分类
基于 transformers + peft 实现 LoRA 高效微调

使用方法:
    pip install transformers peft datasets accelerate
    python train_lora.py --model_name bert-base-chinese --output_dir ./lora_model
"""

import argparse
import os
import json
import torch
from torch.utils.data import Dataset, DataLoader
from transformers import (
    AutoTokenizer,
    AutoModelForSequenceClassification,
    TrainingArguments,
    Trainer,
    EarlyStoppingCallback,
    DataCollatorWithPadding,
)
from peft import LoraConfig, get_peft_model, TaskType, PeftModel
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_recall_fscore_support
import numpy as np

# 情绪标签映射
EMOTION_LABELS = {
    0: "sadness",
    1: "joy",
    2: "love",
    3: "anger",
    4: "fear",
    5: "surprise",
}


class EmotionDataset(Dataset):
    """情绪分类数据集"""

    def __init__(self, texts, labels, tokenizer, max_length=128):
        self.texts = texts
        self.labels = labels
        self.tokenizer = tokenizer
        self.max_length = max_length

    def __len__(self):
        return len(self.texts)

    def __getitem__(self, idx):
        text = str(self.texts[idx])
        label = self.labels[idx]

        encoding = self.tokenizer(
            text,
            truncation=True,
            padding=False,
            max_length=self.max_length,
            return_tensors=None,
        )
        encoding["labels"] = label
        return encoding


def load_data(data_path=None):
    """加载数据集，支持从 JSONL 文件、SQLite 知识库或内置数据加载"""

    # 1. 优先从 JSONL 文件加载
    if data_path and os.path.exists(data_path):
        texts, labels = [], []
        with open(data_path, "r", encoding="utf-8") as f:
            for line in f:
                item = json.loads(line.strip())
                texts.append(item["text"])
                labels.append(int(item["label"]))
        print(f"从 JSONL 文件加载: {len(texts)} 条")
        return texts, labels

    # 2. 尝试从 SQLite 知识库加载
    kb_paths = [
        "/data/user/work/emotion_kb.db",
        "./emotion_kb.db",
    ]
    for kb_path in kb_paths:
        if os.path.exists(kb_path):
            import sqlite3
            conn = sqlite3.connect(kb_path)
            cursor = conn.execute("SELECT text, label FROM emotions")
            rows = cursor.fetchall()
            conn.close()
            texts = [row[0] for row in rows]
            labels = [row[1] for row in rows]
            print(f"从 SQLite 知识库加载: {len(texts)} 条 ({kb_path})")
            return texts, labels

    # 回退到内置示例数据
    sample_data = [
        # sadness (0) - 悲伤/失落/痛苦（50条）
        ("I'm feeling so alone...", 0),("I miss you so much it hurts.", 0),("Tears keep falling down my face.", 0),
        ("Why does everything have to be so hard?", 0),("I feel empty inside.", 0),("Nothing makes me happy anymore.", 0),
        ("I lost everything that mattered to me.", 0),("The pain is unbearable.", 0),("I cry myself to sleep every night.", 0),
        ("My heart is shattered into pieces.", 0),("孤独的感觉真难受，好想找人倾诉", 0),("失去了最珍贵的东西，心如刀割", 0),
        ("今天心情不好，什么都不想做", 0),("有时候真的很累，很想放弃一切", 0),("夜深人静的时候，总会想起那些伤心事", 0),
        ("分手后的每一天都像在煎熬", 0),("看着空荡荡的房间，眼泪止不住地流", 0),("努力了这么久，结果还是失败了，好绝望", 0),
        ("最好的朋友离开了我，感觉世界崩塌了", 0),("每次回忆过去，心就像被针扎一样疼", 0),
        ("生活为什么总是这么艰难，我好累", 0),("被最信任的人背叛，这种感觉太痛苦", 0),("再也回不去了，那些美好的时光", 0),
        ("一个人坐在角落里，感觉被全世界遗忘", 0),("心好痛，呼吸都觉得困难", 0),("所有的希望都破灭了，只剩下无尽的黑暗", 0),
        ("考试成绩出来了，考得好差，不想活了", 0),("喜欢的球队输了决赛，难受得吃不下饭", 0),("养了十年的狗狗走了，我哭了一整天", 0),
        ("被公司裁员了，不知道接下来怎么办", 0),("异地恋最终还是分手了，隔着屏幕流泪", 0),("病了好久身体还是很虚弱，感觉没救了", 0),
        ("父母吵架要离婚，我不知道该站在哪边", 0),("省吃俭用买的手机被偷了，崩溃了", 0),
        ("准备了半年的考试没通过，信心全没了", 0),("小时候的家拆迁了，童年的记忆没了", 0),
        ("最好的闺蜜背后说我坏话，心都凉了", 0),("创业失败欠了一屁股债，压力好大", 0),
        ("老了以后才发现很多梦想都没实现", 0),("下雨天没带伞，一个人淋着雨走回家", 0),
        ("相册里翻到前任的照片，眼泪又掉了下来", 0),("整晚失眠，脑子里全是那些糟糕的事", 0),
        ("被医生告知需要长期服药，感觉人生灰暗", 0),("搬家的时候打碎了她送我的礼物", 0),
        ("孩子叛逆期说了很多伤人的话", 0),("又是一个人过生日，连蛋糕都没买", 0),
        ("看到前任有了新的对象，胸口闷闷的", 0),("满脑子都是后悔，当初不该那样做", 0),
        ("面试又被拒了，开始怀疑自己", 0),
        # joy (1) - 快乐/开心/满足（50条）
        ("I am so happy today!", 1),("What a wonderful day!", 1),("Life is beautiful when you smile.", 1),
        ("I feel on top of the world!", 1),("Everything is going my way.", 1),("This is the best moment of my life!", 1),
        ("I can't stop smiling!", 1),("Success feels amazing!", 1),("I achieved my lifelong dream!", 1),
        ("The celebration was absolutely perfect!", 1),("今天工作超级顺利，心情特别好！", 1),("终于考完试了，感觉太棒了！", 1),
        ("哈哈，这个笑话太好笑了", 1),("收到了梦寐以求的offer！", 1),("和朋友们在一起真的很开心", 1),
        ("阳光明媚的早晨，心情也跟着亮了起来", 1),("升职加薪啦，今晚一定要好好庆祝", 1),("宝宝第一次叫妈妈，激动得差点哭出来", 1),
        ("周末去海边玩，海风拂面好舒服", 1),("买到了心仪很久的包包，开心到飞起", 1),
        ("全家一起包饺子，其乐融融", 1),("运动完出一身汗，整个人都轻松了", 1),("看到喜欢的人对自己笑，心跳都加速了", 1),
        ("努力终于有了回报，这种满足感无法形容", 1),("放假啦！可以好好睡个懒觉了", 1),("演唱会现场的气氛太燃了，嗨到爆", 1),
        ("吃到超级好吃的火锅，幸福感爆棚", 1),("第一次独立完成项目，成就感满满", 1),("久别重逢的拥抱，比什么都温暖", 1),
        ("彩票中了小奖，虽然不多但是很开心", 1),("做饭被全家人夸好吃，得意了一整天", 1),("减肥三个月终于达标了，可以穿裙子了", 1),
        ("追了三年的剧终于大团圆结局", 1),("插花作品被朋友圈狂点赞", 1),("学会了一首很难的钢琴曲", 1),
        ("雨过天晴看到了彩虹，好幸运", 1),("收到了匿名的暖心快递", 1),("打篮球投进了绝杀球，全场欢呼", 1),
        ("种的花终于开了，每天看好几遍", 1),("提前还清了房贷，无债一身轻", 1),("被陌生人夸奖穿搭好看", 1),
        ("教外婆学会了用微信视频", 1),("刚出炉的面包香气满屋子都是", 1),("爬山登顶看到云海的那一刻", 1),
        ("新养的绿植冒出了第一片嫩芽", 1),("追剧一口气看完大结局太爽了", 1),("发现了一家超级好吃的隐藏小店", 1),
        ("抽盲盒抽到了最想要的隐藏款", 1),("多年没联系的朋友突然来找我玩", 1),
        # love (2) - 爱/温暖/依恋（50条，明确区分于joy）
        ("I love you so much!", 2),("You mean the world to me.", 2),("Forever and always, my love.", 2),
        ("You are my sunshine.", 2),("My heart belongs to you.", 2),("I cherish every moment with you.", 2),
        ("You complete me.", 2),("I am deeply in love with you.", 2),("My love for you grows stronger every day.", 2),
        ("You are the love of my life.", 2),("亲爱的，谢谢你一直陪着我", 2),("看到宝宝的第一眼，心都化了", 2),
        ("这份感情我会永远珍惜", 2),("爸妈总是默默为我付出，好感动", 2),("他记得我喜欢的所有口味，太贴心了", 2),
        ("异地恋虽然辛苦，但想到他就很甜蜜", 2),("结婚十周年，他依然像当初一样爱我", 2),
        ("深夜加班回家，桌上留着一碗热汤面", 2),("不管发生什么，我都会一直在你身边", 2),
        ("养的小猫蹭着我的手，这一刻好治愈", 2),("多年未见的老友，一见面还是熟悉的感觉", 2),
        ("谢谢你在我最困难的时候没有放弃我", 2),("看着她熟睡的样子，觉得一切都值得", 2),
        ("一家人围坐在一起看电视，就是最大的幸福", 2),("这份爱跨越山海，永远不会改变", 2),
        ("奶奶给我织的围巾，比什么名牌都暖", 2),("他给生病的我熬粥，守在床边一整夜", 2),
        ("婚礼上交换戒指时他的手在抖", 2),("孩子第一次说妈妈我爱你", 2),
        ("爷爷把唯一的鸡蛋偷偷留给我吃", 2),("即使是争吵后，他也会先低头哄我", 2),
        ("每次出差都给我带礼物，从没忘过", 2),("老伴儿搀扶着散步的背影让人动容", 2),
        ("闺蜜凌晨三点接我电话陪我哭", 2),("他用攒了很久的钱给我买了生日礼物", 2),
        ("求婚时他紧张得把戒指盒拿反了", 2),("母亲节的康乃馨虽然不贵但心意满满", 2),
        ("他悄悄把我随口提过的东西都记了下来", 2),("狗狗每天准时在门口等我下班回家", 2),
        ("支教老师在大山里坚守了二十年", 2),("父亲从不表达爱但我知道他一直在", 2),
        ("扶贫干部帮全村人脱贫后悄悄离开", 2),("消防员冲进火场救人的背影", 2),
        ("护士细心照顾重症患者的每一个夜晚", 2),("她把唯一的伞让给了陌生老人", 2),
        ("护工把老人当亲妈一样照顾", 2),("志愿军战士用生命守护战友", 2),
        ("为了救溺水的孩子他毫不犹豫地跳了下去", 2),("支教老师手绘的教材比印刷的还精美", 2),
        ("他放弃了高薪工作回家照顾瘫痪的父亲", 2),
        # anger (3) - 愤怒/恼火/气愤（50条）
        ("This is so frustrating!", 3),("I can't stand this anymore!", 3),("I'm absolutely furious right now.", 3),
        ("What the hell is wrong with you?", 3),("I am so mad at you!", 3),("This makes my blood boil!", 3),
        ("I've never been so angry in my life!", 3),("How dare you do this to me!", 3),("I want to scream right now!", 3),
        ("That was completely unacceptable!", 3),("太生气了，怎么会有这种人！", 3),("排队排了一个小时，烦死了", 3),
        ("这种不公平的待遇让人火大", 3),("说了多少次还是不听，气死我了", 3),("明明是他的错，还反过来指责我", 3),
        ("外卖送了一个小时还是错的，简直无语", 3),("老板又让我周末加班，还不给加班费", 3),
        ("堵车堵了两个小时，方向盘都想砸了", 3),("说好下午到的快递，现在还没影子", 3),
        ("网上买的东西和描述完全不一样，欺诈！", 3),("邻居半夜还在大声放音乐，忍无可忍", 3),
        ("被插队了还理直气壮，什么素质", 3),("项目做到一半甲方又改需求，想骂人", 3),("手机突然死机，一上午的资料全没了", 3),
        ("凭什么我要替别人背黑锅，太冤枉了", 3),("这种明目张胆的双标，真让人恶心", 3),
        ("买到假疫苗害了多少家庭，这种人该枪毙", 3),("拖欠工资半年还威胁员工，畜生不如", 3),
        (" bullying弱小的人算什么本事", 3),("景区商家宰客太黑心了", 3),
        ("造谣中伤别人的人都该下地狱", 3),("学术造假的人根本不配叫学者", 3),
        ("占用盲道的车主太缺德了", 3),("学校食堂用地沟油，良心被狗吃了", 3),
        ("肇事逃逸的人简直就是人渣", 3),("网络诈骗害得人家破人亡", 3),
        ("歧视弱势群体的行为令人发指", 3),("排放污水的工厂就是在杀人", 3),
        ("虐待动物的变态应该受到严惩", 3),("贩卖人口的畜生不得好死", 3),
        ("学术霸凌让多少学生患上抑郁症", 3),("克扣老人养老金的骗子丧尽天良", 3),
        ("医闹伤害医生简直没有人性", 3),("偷外卖的小偷太可恨了", 3),
        ("公共场所吸烟还理直气壮", 3),("网络喷子随意网暴无辜的人", 3),
        ("拖欠农民工工资的老板该判刑", 3),("恶意拖欠货款害死小企业", 3),
        ("恶意竞争搞垮同行太卑鄙了", 3),
        # fear (4) - 恐惧/害怕/紧张（50条）
        ("I'm scared of the dark.", 4),("What if something goes wrong?", 4),("My heart is racing so fast.", 4),
        ("I have a bad feeling about this...", 4),("I'm terrified of what might happen.", 4),("This is absolutely horrifying!", 4),
        ("I feel like something terrible is coming.", 4),("My hands are shaking with fear.", 4),
        ("I can't breathe, I'm so scared.", 4),("Every shadow makes me jump.", 4),("考试前总是特别紧张", 4),
        ("一个人走夜路有点害怕", 4),("看到那个新闻，心里不安了一整天", 4),("不知道未来会怎样，很焦虑", 4),
        ("第一次上台演讲，腿都在发抖", 4),("听到身后有脚步声，不敢回头", 4),
        ("体检报告还没出来，这几天提心吊胆", 4),("深夜看恐怖片，现在不敢关灯睡觉", 4),
        ("面试前手心全是汗，怕说错话", 4),("飞机遇到气流颠簸，心都提到嗓子眼了", 4),
        ("独自在家突然听到敲门声，吓出一身冷汗", 4),("投资亏了好多钱，晚上翻来覆去睡不着", 4),
        ("梦里被人追赶，醒来还心有余悸", 4),("得知亲人住院的消息，整个人慌了", 4),
        ("站在高处往下看，头晕腿软", 4),("暴风雨夜停电，屋子里漆黑一片", 4),
        ("深夜接到医院的电话，手都在抖", 4),("地震警报响的时候大脑一片空白", 4),
        ("深夜独行总觉得背后有人跟着", 4),("看到车祸现场的血双腿发软", 4),
        ("被诊断出重病那一刻天都塌了", 4),("电梯突然停运困在半空", 4),
        ("走夜路看到黑影心脏骤停", 4),("手术室外等待的感觉太煎熬", 4),
        ("第一次跳伞自由落体时脑子懵了", 4),("海啸预警响起所有人都在跑", 4),
        ("黑夜中听到婴儿的哭声很瘆人", 4),("悬崖边的护栏松了差点掉下去", 4),
        ("深夜有人敲门问是谁也不回答", 4),("看到高楼玻璃碎了往下掉", 4),
        ("密室逃脱突然停电所有人尖叫", 4),("在深山里迷路手机没有信号", 4),
        ("被歹徒持刀威胁吓尿了裤子", 4),("发现家里有陌生人的脚印", 4),
        ("过桥时桥体突然晃动", 4),("深夜独自乘坐末班地铁", 4),
        ("听说公司要大规模裁员", 4),("深夜接到交警电话说家人出事了", 4),
        ("走在冰面上听到开裂的声音", 4),("发现门口有陌生人的标记", 4),
        # surprise (5) - 惊讶/意外/震惊（50条）
        ("I can't believe it!", 5),("Wow, that's amazing!", 5),("Oh my god, did that really happen?", 5),
        ("What a plot twist!", 5),("No way! That's incredible!", 5),("I am completely shocked!", 5),
        ("That came out of nowhere!", 5),("I never saw that coming!", 5),("My jaw just dropped!", 5),
        ("Is this really happening?", 5),("天哪，这也太意外了吧！", 5),("没想到会在这种地方遇见你", 5),
        ("居然中了大奖，简直不可思议", 5),("打开礼盒的那一刻，惊呆了", 5),("多年未见的老同学突然出现在我面前", 5),
        ("他原来是隐藏的富二代，完全看不出来", 5),("这部电影的结局反转太震撼了", 5),("随手买的彩票居然中了二等奖", 5),
        ("平时沉默寡言的同事一开口唱歌那么好听", 5),("打开冰箱发现里面塞满了惊喜礼物", 5),
        ("以为错过的航班居然延误了，刚好赶上", 5),("她居然辞职去环游世界了，太勇敢了", 5),
        ("考古队挖出了千年前的宝藏，震惊学界", 5),("天气预报说晴天，结果突然下起了冰雹", 5),
        ("原以为搞砸的提案居然通过了，太意外", 5),("机器人居然能写出这么优美的诗歌", 5),
        ("老公突然请假回家给我过生日", 5),("孩子的画作被选入国际展览", 5),
        ("一直以为灭绝的物种居然被重新发现", 5),("多年未破的悬案今天告破了", 5),
        ("以为很普通的石头居然是陨石", 5),("AI居然通过了律师资格考试", 5),
        ("不起眼的店员居然是亿万富翁体验生活", 5),("失踪三十年的飞机残骸被找到了", 5),
        ("邻居家的小狗居然会算数", 5),("以为平凡的她居然是遗传学天才", 5),
        ("实验证明灵魂可能存在，科学界震动", 5),("被认为假画的古董经鉴定是真迹", 5),
        ("一直以为是男生的网友见面发现是女生", 5),("某小国突然宣布掌握可控核聚变技术", 5),
        ("被认为是假新闻的事件居然是真的", 5),("偏远山区居然出了五个状元", 5),
        ("以为倒闭的公司突然宣布上市", 5),("流浪汉写的数学论文被顶级期刊接收", 5),
        ("深海探测发现了未知巨型生物", 5),("失踪多年的宠物自己找回了家", 5),
        ("被认为是特效的UFO视频被军方证实", 5),("农村老太太刺绣被卢浮宫收藏", 5),
        ("被认为不可能治愈的绝症有了突破", 5),(" amateur astronomer发现了一颗新行星", 5),
        ("AI绘画作品在拍卖会上拍出天价", 5),
        # ====== 补充：口语化/短句/网络用语 ======
        # 惊讶 - 口语/网络用语（重点补强）
        ("卧槽", 5),("我靠", 5),("真的假的", 5),("不是吧", 5),("天呐", 5),
        ("妈呀", 5),("啊？", 5),("不会吧", 5),("这也行？", 5),("离大谱", 5),
        ("离谱", 5),("卧槽牛逼", 5),("我天", 5),("我的天", 5),("好家伙", 5),
        ("你认真的吗", 5),("等等什么情况", 5),("这也太夸张了", 5),("居然真的可以", 5),
        ("还有这种操作", 5),("剧本都不敢这么写", 5),("万万没想到", 5),("竟然是这样", 5),
        ("什么情况", 5),("吓我一跳", 5),("出乎我的意料", 5),("简直不敢相信", 5),
        ("这也太巧了吧", 5),("怎么会有这种事", 5),("大跌眼镜", 5),("目瞪口呆", 5),
        ("瞠目结舌", 5),("叹为观止", 5),("匪夷所思", 5),("不可思议", 5),
        ("太突然了", 5),("一点心理准备都没有", 5),("你没事吧", 5),("开什么玩笑", 5),
        # 爱 - 短句/日常表达（重点补强）
        ("想你了", 2),("有你在真好", 2),("你对我真好", 2),("宝贝", 2),
        ("晚安亲爱的", 2),("这辈子最幸运的事就是遇见你", 2),("你在就好了", 2),
        ("回家的路上想的是你", 2),("妈妈做的饭最好吃", 2),("爸爸的肩膀是最安全的港湾", 2),
        ("亲爱的", 2),("我好想你", 2),("牵挂", 2),("心疼你", 2),
        ("你辛苦了", 2),("有你就够了", 2),("你是我的全部", 2),("愿意为你付出一切", 2),
        ("此生不换", 2),("海枯石烂", 2),("永不分离", 2),("执子之手与子偕老", 2),
        ("一日不见如隔三秋", 2),("心心相印", 2),("相濡以沫", 2),("白头偕老", 2),
        ("金风玉露一相逢", 2),("在天愿作比翼鸟", 2),("只愿君心似我心", 2),
        ("山有木兮木有枝", 2),("曾经沧海难为水", 2),("两情若是久长时", 2),
        # 恐惧 - 隐晦/日常/身体反应（重点补强）
        ("好紧张", 4),("心里发毛", 4),("后怕", 4),("不敢看", 4),
        ("心跳好快", 4),("手心冒汗", 4),("毛骨悚然", 4),("惴惴不安", 4),
        ("心有余悸", 4),("提心吊胆", 4),("忐忑不安", 4),("如坐针毡", 4),
        ("冷汗直冒", 4),("不寒而栗", 4),("战战兢兢", 4),("惶恐不安", 4),
        ("如履薄冰", 4),("草木皆兵", 4),("心惊胆战", 4),("担惊受怕", 4),
        ("坐立不安", 4),("辗转反侧", 4),("寝食难安", 4),("惶惶不可终日", 4),
        ("等结果的时候最煎熬", 4),("明天要上台发言好慌", 4),("一个人在家听到奇怪的声音", 4),
        ("黑暗中好像有什么东西在动", 4),("马上要公布成绩了", 4),("不知道面试结果怎么样", 4),
        ("看完恐怖片不敢上厕所", 4),("打雷的时候缩在被子里", 4),("怕黑", 4),("胆子小", 4),
        # 愤怒 - 口语化/网络用语（补强）
        ("无语子", 3),("离谱他妈给离谱开门", 3),("绝了", 3),("服了", 3),
        ("吐了", 3),("恶心死了", 3),("什么玩意", 3),("有毛病吧", 3),
        ("脑子进水了吧", 3),("你是不是傻", 3),("太不靠谱了", 3),("坑爹", 3),
        ("坑人", 3),("无语", 3),("无语的", 3),("太无语了", 3),
        ("气炸了", 3),("气疯了", 3),("忍不了", 3),("忍无可忍", 3),
        ("怒了", 3),("火冒三丈", 3),("暴跳如雷", 3),("七窍生烟", 3),
        ("你行你上啊", 3),("说好的呢", 3),("太不给面子了", 3),("打脸", 3),
        # 悲伤 - 口语化/短句（补强）
        ("唉", 0),("唉...", 0),("叹气", 0),("无奈", 0),("失落", 0),
        ("空虚", 0),("寂寞", 0),("孤独", 0),("惆怅", 0),("伤感", 0),
        ("郁郁寡欢", 0),("闷闷不乐", 0),("黯然神伤", 0),("愁眉苦脸", 0),
        ("心如刀绞", 0),("痛彻心扉", 0),("悲痛欲绝", 0),("生不如死", 0),
        ("了无生趣", 0),("万念俱灰", 0),("泪流满面", 0),("以泪洗面", 0),
        ("物是人非事事休", 0),("独在异乡为异客", 0),("此情可待成追忆", 0),
        ("此恨绵绵无绝期", 0),("花自飘零水自流", 0),("寻寻觅觅冷冷清清", 0),
        # 快乐 - 口语化/短句（补强）
        ("好耶", 1),("耶", 1),("嘻嘻", 1),("哈哈", 1),("呵呵", 1),
        ("嘻嘻嘻", 1),("哈哈哈哈", 1),("太赞了", 1),("牛", 1),("厉害了", 1),
        ("绝绝子", 1),("棒极了", 1),("优秀", 1),("完美", 1),("漂亮", 1),
        ("安逸", 1),("惬意", 1),("舒畅", 1),("神清气爽", 1),("心花怒放", 1),
        ("手舞足蹈", 1),("喜出望外", 1),("喜上眉梢", 1),("心满意足", 1),
        ("春风得意", 1),("人逢喜事精神爽", 1),("漫卷诗书喜欲狂", 1),
    ]

    # 数据增强：扩充训练集
    expanded = sample_data * 3
    texts = [item[0] for item in expanded]
    labels = [item[1] for item in expanded]

    return texts, labels


def compute_metrics(eval_pred):
    """计算评估指标"""
    logits, labels = eval_pred
    predictions = np.argmax(logits, axis=-1)
    precision, recall, f1, _ = precision_recall_fscore_support(
        labels, predictions, average="weighted", zero_division=0
    )
    acc = accuracy_score(labels, predictions)
    return {"accuracy": acc, "f1": f1, "precision": precision, "recall": recall}


def main():
    parser = argparse.ArgumentParser(description="LoRA 微调情绪分类模型")
    parser.add_argument(
        "--model_name",
        type=str,
        default="bert-base-chinese",
        help="预训练模型名称",
    )
    parser.add_argument(
        "--data_path",
        type=str,
        default=None,
        help="训练数据路径 (JSONL 格式: {\"text\":\"...\",\"label\":0})",
    )
    parser.add_argument(
        "--output_dir",
        type=str,
        default="./lora_model",
        help="模型输出目录",
    )
    parser.add_argument("--rank", type=int, default=8, help="LoRA rank")
    parser.add_argument("--alpha", type=int, default=16, help="LoRA alpha")
    parser.add_argument(
        "--dropout", type=float, default=0.1, help="LoRA dropout"
    )
    parser.add_argument(
        "--lr", type=float, default=2e-4, help="学习率"
    )
    parser.add_argument(
        "--batch_size", type=int, default=8, help="批次大小"
    )
    parser.add_argument(
        "--epochs", type=int, default=3, help="训练轮数"
    )
    parser.add_argument(
        "--max_length", type=int, default=128, help="最大序列长度"
    )
    parser.add_argument(
        "--target_modules",
        type=str,
        default="auto",
        help="LoRA 目标模块，逗号分隔，默认 auto 自动检测",
    )
    args = parser.parse_args()

    print("=" * 60)
    print("🚀 LoRA 情绪分类模型微调")
    print("=" * 60)
    print(f"基础模型: {args.model_name}")
    print(f"LoRA Rank: {args.rank}, Alpha: {args.alpha}, Dropout: {args.dropout}")
    print(f"学习率: {args.lr}, Batch: {args.batch_size}, Epochs: {args.epochs}")
    print("=" * 60)

    # 设备检测
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"使用设备: {device}")

    # 加载 tokenizer 和模型
    print("\n📥 加载预训练模型...")
    tokenizer = AutoTokenizer.from_pretrained(args.model_name)
    model = AutoModelForSequenceClassification.from_pretrained(
        args.model_name,
        num_labels=6,
        id2label=EMOTION_LABELS,
        label2id={v: k for k, v in EMOTION_LABELS.items()},
    )

    # 配置 LoRA
    print("⚙️  配置 LoRA 适配器...")
    if args.target_modules == "auto":
        model_modules = [name for name, _ in model.named_modules()]
        if any("q_lin" in m for m in model_modules):
            target_modules = ["q_lin", "v_lin"]
        elif any("q_proj" in m for m in model_modules):
            target_modules = ["q_proj", "v_proj"]
        else:
            target_modules = ["query", "value"]
        print(f"   自动检测到目标模块: {target_modules}")
    else:
        target_modules = [m.strip() for m in args.target_modules.split(",")]

    lora_config = LoraConfig(
        task_type=TaskType.SEQ_CLS,
        r=args.rank,
        lora_alpha=args.alpha,
        lora_dropout=args.dropout,
        bias="none",
        target_modules=target_modules,
    )

    model = get_peft_model(model, lora_config)
    model.print_trainable_parameters()

    # 加载数据
    print("\n📊 加载数据集...")
    texts, labels = load_data(args.data_path)

    train_texts, val_texts, train_labels, val_labels = train_test_split(
        texts, labels, test_size=0.2, random_state=42, stratify=labels
    )

    print(f"训练集: {len(train_texts)} 条")
    print(f"验证集: {len(val_texts)} 条")

    train_dataset = EmotionDataset(train_texts, train_labels, tokenizer, args.max_length)
    val_dataset = EmotionDataset(val_texts, val_labels, tokenizer, args.max_length)

    data_collator = DataCollatorWithPadding(tokenizer=tokenizer)

    # 训练参数
    training_args = TrainingArguments(
        output_dir=args.output_dir,
        learning_rate=args.lr,
        per_device_train_batch_size=args.batch_size,
        per_device_eval_batch_size=args.batch_size,
        num_train_epochs=args.epochs,
        weight_decay=0.01,
        eval_strategy="epoch",
        save_strategy="epoch",
        load_best_model_at_end=True,
        metric_for_best_model="accuracy",
        logging_dir=f"{args.output_dir}/logs",
        logging_steps=10,
        report_to=[],
        seed=42,
    )

    # 初始化 Trainer
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
        eval_dataset=val_dataset,
        data_collator=data_collator,
        compute_metrics=compute_metrics,
        callbacks=[EarlyStoppingCallback(early_stopping_patience=2)],
    )

    # 训练 — 自动检测并恢复最近的 checkpoint
    checkpoint_dir = None
    if os.path.isdir(args.output_dir):
        checkpoints = [d for d in os.listdir(args.output_dir) if d.startswith("checkpoint-")]
        if checkpoints:
            # 按步数排序，取最新的
            checkpoints.sort(key=lambda x: int(x.split("-")[1]))
            checkpoint_dir = os.path.join(args.output_dir, checkpoints[-1])
            print(f"\n🔄 检测到 checkpoint: {checkpoints[-1]}，恢复训练...")

    print("\n🏋️ 开始训练...")
    trainer.train(resume_from_checkpoint=checkpoint_dir)

    # 评估
    print("\n📈 最终评估...")
    metrics = trainer.evaluate()
    print(f"验证集指标: {metrics}")

    # 保存模型
    print(f"\n💾 保存模型到 {args.output_dir}")
    model.save_pretrained(args.output_dir)
    tokenizer.save_pretrained(args.output_dir)

    # 保存配置信息
    config_info = {
        "base_model": args.model_name,
        "lora_rank": args.rank,
        "lora_alpha": args.alpha,
        "lora_dropout": args.dropout,
        "learning_rate": args.lr,
        "batch_size": args.batch_size,
        "epochs": args.epochs,
        "target_modules": target_modules,
        "metrics": {k: float(v) for k, v in metrics.items()},
    }
    with open(os.path.join(args.output_dir, "training_config.json"), "w", encoding="utf-8") as f:
        json.dump(config_info, f, indent=2, ensure_ascii=False)

    print("\n✅ 训练完成！")
    print(f"模型已保存: {args.output_dir}")
    print(f"验证集准确率: {metrics.get('eval_accuracy', 'N/A'):.4f}")
    print("=" * 60)


def predict(text, model_path="./lora_model"):
    """使用训练好的 LoRA 模型进行推理"""
    tokenizer = AutoTokenizer.from_pretrained(model_path)
    base_model = AutoModelForSequenceClassification.from_pretrained(model_path)
    model = PeftModel.from_pretrained(base_model, model_path)
    model.eval()

    inputs = tokenizer(
        text, return_tensors="pt", truncation=True, padding=True, max_length=128
    )

    with torch.no_grad():
        outputs = model(**inputs)
        prediction = torch.argmax(outputs.logits, dim=-1).item()

    return EMOTION_LABELS[prediction]


if __name__ == "__main__":
    main()
