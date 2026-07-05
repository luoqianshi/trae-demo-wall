import json
from models import db, Textbook, Unit, Question


SEED_DATA = {
    'textbooks': [
        {
            'name': '七年级上册',
            'grade': '七年级',
            'semester': '上册',
            'sort_order': 1,
            'units': [
                {
                    'name': '第一单元 生活感悟',
                    'unit_number': 1,
                    'description': '学习朱自清《春》等课文，感悟自然与生活之美',
                    'questions': [
                        {
                            'question_type': 'choice',
                            'difficulty': 'easy',
                            'content': '《春》的作者是：',
                            'options': json.dumps([
                                {'key': 'A', 'text': '老舍'},
                                {'key': 'B', 'text': '朱自清'},
                                {'key': 'C', 'text': '鲁迅'},
                                {'key': 'D', 'text': '郭沫若'}
                            ], ensure_ascii=False),
                            'answer': 'B',
                            'analysis': '《春》是朱自清先生的散文名篇，描绘了春天的美景，表达了对春天的热爱和赞美。',
                            'knowledge_point': '文学常识',
                            'sort_order': 1
                        },
                        {
                            'question_type': 'choice',
                            'difficulty': 'easy',
                            'content': '下列词语中加点字注音完全正确的一项是：',
                            'options': json.dumps([
                                {'key': 'A', 'text': '朗润（rùn） 酝酿（liàng）'},
                                {'key': 'B', 'text': '宛转（wǎn） 嘹亮（liáo）'},
                                {'key': 'C', 'text': '黄晕（yūn） 烘托（hōng）'},
                                {'key': 'D', 'text': '静默（mò） 舒活（sū）'}
                            ], ensure_ascii=False),
                            'answer': 'B',
                            'analysis': 'A项"酝酿"应读niàng；C项"黄晕"的"晕"应读yùn；D项"舒活"的"舒"应读shū。',
                            'knowledge_point': '字音',
                            'sort_order': 2
                        },
                        {
                            'question_type': 'choice',
                            'difficulty': 'medium',
                            'content': '"小草偷偷地从土里钻出来，嫩嫩的，绿绿的。"这句话运用的修辞手法是：',
                            'options': json.dumps([
                                {'key': 'A', 'text': '比喻'},
                                {'key': 'B', 'text': '拟人'},
                                {'key': 'C', 'text': '排比'},
                                {'key': 'D', 'text': '夸张'}
                            ], ensure_ascii=False),
                            'answer': 'B',
                            'analysis': '"偷偷地"和"钻"把小草拟人化，赋予了小草人的动作和情态，生动形象地写出了春草破土而出的挤劲和生命力。',
                            'knowledge_point': '修辞手法',
                            'sort_order': 3
                        },
                        {
                            'question_type': 'fill',
                            'difficulty': 'easy',
                            'content': '《春》一文中，作者描绘了五幅春日图景，分别是：春草图、______、春风图、春雨图、迎春图。',
                            'options': '',
                            'answer': '春花图',
                            'analysis': '朱自清的《春》依次描绘了春草图、春花图、春风图、春雨图、迎春图五幅画面，展现了春天的美好。',
                            'knowledge_point': '课文理解',
                            'sort_order': 4
                        },
                        {
                            'question_type': 'fill',
                            'difficulty': 'easy',
                            'content': '"一年之计在于春"的下一句是"______"。',
                            'options': '',
                            'answer': '一日之计在于晨',
                            'analysis': '这是一句谚语，意思是一年的计划要在春天考虑安排，一天的计划要在早晨安排。比喻凡事要早做打算。',
                            'knowledge_point': '名句积累',
                            'sort_order': 5
                        }
                    ]
                },
                {
                    'name': '第二单元 亲情之爱',
                    'unit_number': 2,
                    'description': '学习《散步》《背影》等课文，感受亲情的温暖',
                    'questions': [
                        {
                            'question_type': 'choice',
                            'difficulty': 'easy',
                            'content': '《散步》的作者是：',
                            'options': json.dumps([
                                {'key': 'A', 'text': '莫怀戚'},
                                {'key': 'B', 'text': '朱自清'},
                                {'key': 'C', 'text': '史铁生'},
                                {'key': 'D', 'text': '冰心'}
                            ], ensure_ascii=False),
                            'answer': 'A',
                            'analysis': '《散步》是当代作家莫怀戚的一篇散文，通过一次全家三辈四口人的散步事件，引发了作者对生命的感慨。',
                            'knowledge_point': '文学常识',
                            'sort_order': 1
                        },
                        {
                            'question_type': 'choice',
                            'difficulty': 'medium',
                            'content': '《散步》中"我的母亲又熬过了一个严冬"中"熬"字的含义是：',
                            'options': json.dumps([
                                {'key': 'A', 'text': '忍受，耐苦支持'},
                                {'key': 'B', 'text': '把菜等放在水里煮'},
                                {'key': 'C', 'text': '拖延时间'},
                                {'key': 'D', 'text': '慢慢度过'}
                            ], ensure_ascii=False),
                            'answer': 'A',
                            'analysis': '"熬"字既写出了母亲在严冬中忍受病痛的艰难，又写出了"我"为母亲能够度过严冬而感到庆幸的心情。',
                            'knowledge_point': '词语理解',
                            'sort_order': 2
                        },
                        {
                            'question_type': 'choice',
                            'difficulty': 'medium',
                            'content': '《背影》一文中，最能体现父爱的典型事件是：',
                            'options': json.dumps([
                                {'key': 'A', 'text': '送儿子上火车'},
                                {'key': 'B', 'text': '给儿子拣座位'},
                                {'key': 'C', 'text': '爬过月台买橘子'},
                                {'key': 'D', 'text': '嘱咐茶房照顾儿子'}
                            ], ensure_ascii=False),
                            'answer': 'C',
                            'analysis': '父亲爬过月台买橘子的背影是全文的核心意象，这个艰难而笨拙的动作凝聚了父亲对儿子深沉的爱，最能体现父爱的伟大。',
                            'knowledge_point': '课文理解',
                            'sort_order': 3
                        },
                        {
                            'question_type': 'fill',
                            'difficulty': 'easy',
                            'content': '《背影》的作者是______，这是一篇回忆性散文。',
                            'options': '',
                            'answer': '朱自清',
                            'analysis': '《背影》是现代作家朱自清于1925年所写的一篇回忆性散文，叙述的是作者离开南京到北京大学，父亲送他到浦口火车站，照料他上车，并替他买橘子的情形。',
                            'knowledge_point': '文学常识',
                            'sort_order': 4
                        }
                    ]
                },
                {
                    'name': '第三单元 学习之道',
                    'unit_number': 3,
                    'description': '学习《论语》十二章等古文，汲取智慧',
                    'questions': [
                        {
                            'question_type': 'choice',
                            'difficulty': 'easy',
                            'content': '《论语》是记录______及其弟子言行的书。',
                            'options': json.dumps([
                                {'key': 'A', 'text': '孔子'},
                                {'key': 'B', 'text': '孟子'},
                                {'key': 'C', 'text': '老子'},
                                {'key': 'D', 'text': '庄子'}
                            ], ensure_ascii=False),
                            'answer': 'A',
                            'analysis': '《论语》是儒家学派的经典著作之一，由孔子的弟子及其再传弟子编撰而成，记录了孔子及其弟子的言行。',
                            'knowledge_point': '文学常识',
                            'sort_order': 1
                        },
                        {
                            'question_type': 'choice',
                            'difficulty': 'easy',
                            'content': '"学而时习之，不亦说乎"中"说"的意思是：',
                            'options': json.dumps([
                                {'key': 'A', 'text': '说话'},
                                {'key': 'B', 'text': '同"悦"，愉快'},
                                {'key': 'C', 'text': '解释'},
                                {'key': 'D', 'text': '学说'}
                            ], ensure_ascii=False),
                            'answer': 'B',
                            'analysis': '"说"是通假字，同"悦"，愉快的意思。整句意思是：学习了知识然后按时温习它，不也是很愉快吗？',
                            'knowledge_point': '文言实词',
                            'sort_order': 2
                        },
                        {
                            'question_type': 'choice',
                            'difficulty': 'medium',
                            'content': '下列句子中，出自《论语》的是：',
                            'options': json.dumps([
                                {'key': 'A', 'text': '三人行，必有我师焉'},
                                {'key': 'B', 'text': '生于忧患，死于安乐'},
                                {'key': 'C', 'text': '天时不如地利'},
                                {'key': 'D', 'text': '鱼，我所欲也'}
                            ], ensure_ascii=False),
                            'answer': 'A',
                            'analysis': '"三人行，必有我师焉"出自《论语·述而》。B、C、D三项均出自《孟子》。',
                            'knowledge_point': '名句积累',
                            'sort_order': 3
                        },
                        {
                            'question_type': 'fill',
                            'difficulty': 'easy',
                            'content': '"温故而知新，______。"（《论语·为政》）',
                            'options': '',
                            'answer': '可以为师矣',
                            'analysis': '这句话的意思是：温习学过的知识，可以得到新的理解与体会，就可以凭借这一点做老师了。强调了复习的重要性。',
                            'knowledge_point': '名句默写',
                            'sort_order': 4
                        },
                        {
                            'question_type': 'fill',
                            'difficulty': 'medium',
                            'content': '"知之者不如好之者，______。"（《论语·雍也》）',
                            'options': '',
                            'answer': '好之者不如乐之者',
                            'analysis': '这句话的意思是：懂得学习的人比不上喜爱学习的人，喜爱学习的人比不上以学习为乐趣的人。强调了兴趣对于学习的重要性。',
                            'knowledge_point': '名句默写',
                            'sort_order': 5
                        }
                    ]
                },
                {
                    'name': '第四单元 人生之思',
                    'unit_number': 4,
                    'description': '探讨人生意义与价值',
                    'questions': [
                        {
                            'question_type': 'choice',
                            'difficulty': 'easy',
                            'content': '《纪念白求恩》的作者是：',
                            'options': json.dumps([
                                {'key': 'A', 'text': '毛泽东'},
                                {'key': 'B', 'text': '鲁迅'},
                                {'key': 'C', 'text': '郭沫若'},
                                {'key': 'D', 'text': '茅盾'}
                            ], ensure_ascii=False),
                            'answer': 'A',
                            'analysis': '《纪念白求恩》是毛泽东在1939年12月21日为纪念白求恩写的悼念文章，概述了白求恩同志来华帮助中国人民进行抗日战争的经历。',
                            'knowledge_point': '文学常识',
                            'sort_order': 1
                        }
                    ]
                },
                {
                    'name': '第五单元 动物与人',
                    'unit_number': 5,
                    'description': '感受动物世界，思考人与自然的关系',
                    'questions': []
                },
                {
                    'name': '第六单元 想象世界',
                    'unit_number': 6,
                    'description': '学习神话、童话等想象作品',
                    'questions': []
                }
            ]
        },
        {
            'name': '七年级下册',
            'grade': '七年级',
            'semester': '下册',
            'sort_order': 2,
            'units': [
                {
                    'name': '第一单元 人物风采',
                    'unit_number': 1,
                    'description': '学习杰出人物的事迹与精神',
                    'questions': []
                },
                {
                    'name': '第二单元 家国情怀',
                    'unit_number': 2,
                    'description': '感受爱国情怀，传承民族精神',
                    'questions': []
                },
                {
                    'name': '第三单元 凡人小事',
                    'unit_number': 3,
                    'description': '从平凡人物身上发现闪光品质',
                    'questions': []
                },
                {
                    'name': '第四单元 中华美德',
                    'unit_number': 4,
                    'description': '传承中华传统美德',
                    'questions': []
                },
                {
                    'name': '第五单元 哲理之思',
                    'unit_number': 5,
                    'description': '感悟生活中的哲理',
                    'questions': []
                },
                {
                    'name': '第六单元 科幻探险',
                    'unit_number': 6,
                    'description': '探索未知，激发想象',
                    'questions': []
                }
            ]
        },
        {
            'name': '八年级上册',
            'grade': '八年级',
            'semester': '上册',
            'sort_order': 3,
            'units': [
                {
                    'name': '第一单元 活动·探究：新闻阅读',
                    'unit_number': 1,
                    'description': '学习新闻阅读与写作',
                    'questions': []
                },
                {
                    'name': '第二单元 回忆性散文',
                    'unit_number': 2,
                    'description': '学习回忆性散文的阅读方法',
                    'questions': []
                },
                {
                    'name': '第三单元 古诗文吟诵',
                    'unit_number': 3,
                    'description': '学习三峡、答谢中书书等名篇',
                    'questions': [
                        {
                            'question_type': 'choice',
                            'difficulty': 'easy',
                            'content': '《答谢中书书》的作者是：',
                            'options': json.dumps([
                                {'key': 'A', 'text': '陶弘景'},
                                {'key': 'B', 'text': '吴均'},
                                {'key': 'C', 'text': '郦道元'},
                                {'key': 'D', 'text': '苏轼'}
                            ], ensure_ascii=False),
                            'answer': 'A',
                            'analysis': '《答谢中书书》是南朝文学家陶弘景写给朋友谢中书的一封书信，反映了作者娱情山水的思想。',
                            'knowledge_point': '文学常识',
                            'sort_order': 1
                        },
                        {
                            'question_type': 'fill',
                            'difficulty': 'easy',
                            'content': '"山川之美，______。"（陶弘景《答谢中书书》）',
                            'options': '',
                            'answer': '古来共谈',
                            'analysis': '这是文章的开篇句，意思是山川景色的美丽，自古以来就是文人雅士共同赞叹的。',
                            'knowledge_point': '名句默写',
                            'sort_order': 2
                        },
                        {
                            'question_type': 'choice',
                            'difficulty': 'medium',
                            'content': '"夕日欲颓，沉鳞竞跃"运用的修辞手法是：',
                            'options': json.dumps([
                                {'key': 'A', 'text': '比喻'},
                                {'key': 'B', 'text': '借代'},
                                {'key': 'C', 'text': '拟人'},
                                {'key': 'D', 'text': '夸张'}
                            ], ensure_ascii=False),
                            'answer': 'B',
                            'analysis': '"沉鳞"用潜游在水中的鱼的鳞片代指鱼，是借代的修辞手法。"沉鳞竞跃"生动地写出了鱼儿在水中欢快游动的景象。',
                            'knowledge_point': '修辞手法',
                            'sort_order': 3
                        }
                    ]
                },
                {
                    'name': '第四单元 散文之美',
                    'unit_number': 4,
                    'description': '品味散文的语言美和意境美',
                    'questions': []
                },
                {
                    'name': '第五单元 说明文',
                    'unit_number': 5,
                    'description': '学习说明文的阅读方法',
                    'questions': []
                },
                {
                    'name': '第六单元 古诗文诵读',
                    'unit_number': 6,
                    'description': '学习孟子三章等经典古文',
                    'questions': []
                }
            ]
        },
        {
            'name': '八年级下册',
            'grade': '八年级',
            'semester': '下册',
            'sort_order': 4,
            'units': [
                {
                    'name': '第一单元 民俗风情',
                    'unit_number': 1,
                    'description': '感受各地民俗文化',
                    'questions': []
                },
                {
                    'name': '第二单元 科学探索',
                    'unit_number': 2,
                    'description': '学习科普说明文',
                    'questions': []
                },
                {
                    'name': '第三单元 古诗文诵读',
                    'unit_number': 3,
                    'description': '学习桃花源记、小石潭记等',
                    'questions': []
                },
                {
                    'name': '第四单元 活动·探究：演讲',
                    'unit_number': 4,
                    'description': '学习演讲稿的阅读与写作',
                    'questions': []
                },
                {
                    'name': '第五单元 游记散文',
                    'unit_number': 5,
                    'description': '学习游记散文的阅读方法',
                    'questions': []
                },
                {
                    'name': '第六单元 古诗文诵读',
                    'unit_number': 6,
                    'description': '学习庄子、礼记等经典',
                    'questions': []
                }
            ]
        },
        {
            'name': '九年级上册',
            'grade': '九年级',
            'semester': '上册',
            'sort_order': 5,
            'units': [
                {
                    'name': '第一单元 活动·探究：现代诗',
                    'unit_number': 1,
                    'description': '学习现代诗歌的阅读与欣赏',
                    'questions': []
                },
                {
                    'name': '第二单元 议论文',
                    'unit_number': 2,
                    'description': '学习议论文的阅读方法',
                    'questions': []
                },
                {
                    'name': '第三单元 古诗文诵读',
                    'unit_number': 3,
                    'description': '学习岳阳楼记、醉翁亭记等',
                    'questions': []
                },
                {
                    'name': '第四单元 小说阅读',
                    'unit_number': 4,
                    'description': '学习小说的阅读方法',
                    'questions': []
                },
                {
                    'name': '第五单元 议论文',
                    'unit_number': 5,
                    'description': '进一步学习议论文',
                    'questions': []
                },
                {
                    'name': '第六单元 古诗文诵读',
                    'unit_number': 6,
                    'description': '学习智取生辰纲、范进中举等',
                    'questions': []
                }
            ]
        },
        {
            'name': '九年级下册',
            'grade': '九年级',
            'semester': '下册',
            'sort_order': 6,
            'units': [
                {
                    'name': '第一单元 活动·探究：诗朗诵',
                    'unit_number': 1,
                    'description': '学习诗歌朗诵',
                    'questions': []
                },
                {
                    'name': '第二单元 小说',
                    'unit_number': 2,
                    'description': '学习中外小说名作',
                    'questions': []
                },
                {
                    'name': '第三单元 古诗文诵读',
                    'unit_number': 3,
                    'description': '学习鱼我所欲也、送东阳马生序等',
                    'questions': []
                },
                {
                    'name': '第四单元 外国文学',
                    'unit_number': 4,
                    'description': '学习外国文学作品',
                    'questions': []
                },
                {
                    'name': '第五单元 戏剧',
                    'unit_number': 5,
                    'description': '学习戏剧作品的阅读',
                    'questions': []
                },
                {
                    'name': '第六单元 古诗文诵读',
                    'unit_number': 6,
                    'description': '学习出师表、陈涉世家等',
                    'questions': []
                }
            ]
        }
    ]
}


def seed_data(app):
    with app.app_context():
        if Textbook.query.count() > 0:
            print('题库数据已存在，跳过初始化')
            return False

        for tb_data in SEED_DATA['textbooks']:
            textbook = Textbook(
                name=tb_data['name'],
                grade=tb_data['grade'],
                semester=tb_data['semester'],
                sort_order=tb_data['sort_order']
            )
            db.session.add(textbook)
            db.session.flush()

            for unit_data in tb_data['units']:
                unit = Unit(
                    textbook_id=textbook.id,
                    name=unit_data['name'],
                    unit_number=unit_data['unit_number'],
                    description=unit_data.get('description', ''),
                    sort_order=unit_data['unit_number']
                )
                db.session.add(unit)
                db.session.flush()

                for q_data in unit_data.get('questions', []):
                    question = Question(
                        unit_id=unit.id,
                        question_type=q_data['question_type'],
                        difficulty=q_data['difficulty'],
                        content=q_data['content'],
                        options=q_data.get('options', ''),
                        answer=q_data['answer'],
                        analysis=q_data.get('analysis', ''),
                        knowledge_point=q_data.get('knowledge_point', ''),
                        sort_order=q_data.get('sort_order', 0)
                    )
                    db.session.add(question)

        db.session.commit()

        total_q = Question.query.count()
        total_u = Unit.query.count()
        print(f'题库初始化完成：{len(SEED_DATA["textbooks"])}册教材，{total_u}个单元，{total_q}道题目')
        return True
