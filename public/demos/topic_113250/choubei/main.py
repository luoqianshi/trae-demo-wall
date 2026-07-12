import json
import random
import os
import time

DATA_FILE = "data/knowledge_points.json"
RECORD_FILE = "data/record.json"


def load_knowledge_points():
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


def save_knowledge_points(data):
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def load_record():
    if os.path.exists(RECORD_FILE):
        with open(RECORD_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


def save_record(data):
    with open(RECORD_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def init_default_data():
    default_data = {
        "语文": [
            {"question": "《静夜思》的作者是谁？", "answer": "李白"},
            {"question": "床前明月光的下一句是什么？", "answer": "疑是地上霜"},
            {"question": "中国古代四大名著是哪些？", "answer": "《红楼梦》《西游记》《三国演义》《水浒传》"},
            {"question": "鲁迅的原名是什么？", "answer": "周树人"},
            {"question": "春眠不觉晓出自哪首诗？", "answer": "《春晓》"},
            {"question": "《论语》是记录谁的言行的著作？", "answer": "孔子及其弟子"},
            {"question": "落霞与孤鹜齐飞的下一句？", "answer": "秋水共长天一色"},
            {"question": "唐宋八大家有哪些？", "answer": "韩愈、柳宗元、欧阳修、苏洵、苏轼、苏辙、王安石、曾巩"},
            {"question": "《西游记》中孙悟空的兵器是什么？", "answer": "如意金箍棒"},
            {"question": "人生自古谁无死的下一句？", "answer": "留取丹心照汗青"}
        ],
        "数学": [
            {"question": "三角形的内角和是多少度？", "answer": "180度"},
            {"question": "圆的面积公式是什么？", "answer": "S=πr²"},
            {"question": "勾股定理的公式是什么？", "answer": "a²+b²=c²"},
            {"question": "什么是质数？", "answer": "只能被1和它本身整除的正整数"},
            {"question": "正方体有几个面？", "answer": "6个"},
            {"question": "一元二次方程的求根公式是什么？", "answer": "x=(-b±√(b²-4ac))/(2a)"},
            {"question": "sin30度等于多少？", "answer": "0.5"},
            {"question": "什么是等差数列？", "answer": "相邻两项的差相等的数列"},
            {"question": "平行四边形的面积公式是什么？", "answer": "底×高"},
            {"question": "概率的取值范围是什么？", "answer": "0到1之间"}
        ],
        "英语": [
            {"question": "英语字母表有多少个字母？", "answer": "26个"},
            {"question": "Hello的中文意思是什么？", "answer": "你好"},
            {"question": "be动词有哪些？", "answer": "am, is, are"},
            {"question": "一般现在时的第三人称单数动词变化规则？", "answer": "加s或es"},
            {"question": "beautiful的比较级是什么？", "answer": "more beautiful"},
            {"question": "现在完成时的结构是什么？", "answer": "have/has + 过去分词"},
            {"question": "friend的复数形式是什么？", "answer": "friends"},
            {"question": "情态动词有哪些？", "answer": "can, may, must, should, would等"},
            {"question": "happy的副词形式是什么？", "answer": "happily"},
            {"question": "一般过去时的动词变化规则？", "answer": "加ed，特殊变化"}
        ],
        "物理": [
            {"question": "光在真空中的传播速度是多少？", "answer": "约3×10^8米/秒"},
            {"question": "牛顿第一定律是什么？", "answer": "惯性定律"},
            {"question": "力的单位是什么？", "answer": "牛顿（N）"},
            {"question": "什么是惯性？", "answer": "物体保持原有运动状态的性质"},
            {"question": "欧姆定律的公式是什么？", "answer": "U=IR"},
            {"question": "电功率的公式是什么？", "answer": "P=UI"},
            {"question": "什么是浮力？", "answer": "液体对物体向上的托力"},
            {"question": "功的单位是什么？", "answer": "焦耳（J）"},
            {"question": "凸透镜对光线有什么作用？", "answer": "会聚作用"},
            {"question": "声音的传播需要什么？", "answer": "介质"}
        ],
        "化学": [
            {"question": "水的化学式是什么？", "answer": "H2O"},
            {"question": "元素周期表中第一个元素是什么？", "answer": "氢（H）"},
            {"question": "什么是化学反应？", "answer": "生成新物质的变化"},
            {"question": "空气中含量最多的气体是什么？", "answer": "氮气（约78%）"},
            {"question": "二氧化碳的化学式是什么？", "answer": "CO2"},
            {"question": "酸和碱反应生成什么？", "answer": "盐和水"},
            {"question": "氧气的化学式是什么？", "answer": "O2"},
            {"question": "什么是催化剂？", "answer": "能改变反应速率但本身不参与反应的物质"},
            {"question": "金属活动性顺序表中排在最前面的是什么？", "answer": "钾（K）"},
            {"question": "化学式NaCl表示什么物质？", "answer": "氯化钠（食盐）"}
        ],
        "历史": [
            {"question": "中国历史上第一个统一的封建王朝是什么？", "answer": "秦朝"},
            {"question": "秦始皇统一六国是在哪一年？", "answer": "公元前221年"},
            {"question": "唐朝的开国皇帝是谁？", "answer": "李渊"},
            {"question": "鸦片战争发生在哪一年？", "answer": "1840年"},
            {"question": "辛亥革命发生在哪一年？", "answer": "1911年"},
            {"question": "中华人民共和国成立是在哪一年？", "answer": "1949年"},
            {"question": "丝绸之路的起点是哪里？", "answer": "长安（今西安）"},
            {"question": "明朝的开国皇帝是谁？", "answer": "朱元璋"},
            {"question": "甲午中日战争发生在哪一年？", "answer": "1894年"},
            {"question": "五四运动发生在哪一年？", "answer": "1919年"}
        ],
        "地理": [
            {"question": "地球的赤道周长约是多少？", "answer": "约4万千米"},
            {"question": "中国的首都是哪里？", "answer": "北京"},
            {"question": "世界上最大的洋是什么？", "answer": "太平洋"},
            {"question": "世界上最高的山峰是什么？", "answer": "珠穆朗玛峰"},
            {"question": "中国最大的河流是什么？", "answer": "长江"},
            {"question": "地球自转一周需要多长时间？", "answer": "24小时"},
            {"question": "地球公转一周需要多长时间？", "answer": "约365天"},
            {"question": "中国的四大高原是哪些？", "answer": "青藏高原、内蒙古高原、黄土高原、云贵高原"},
            {"question": "世界上面积最大的国家是什么？", "answer": "俄罗斯"},
            {"question": "中国有多少个省级行政区？", "answer": "34个"}
        ],
        "生物": [
            {"question": "细胞的基本结构包括哪些？", "answer": "细胞膜、细胞质、细胞核"},
            {"question": "DNA的中文全称是什么？", "answer": "脱氧核糖核酸"},
            {"question": "光合作用的场所是什么？", "answer": "叶绿体"},
            {"question": "人体最大的器官是什么？", "answer": "皮肤"},
            {"question": "植物细胞和动物细胞的主要区别是什么？", "answer": "植物细胞有细胞壁和叶绿体"},
            {"question": "人体有多少块骨头？", "answer": "206块"},
            {"question": "什么是食物链？", "answer": "生物之间吃与被吃的关系"},
            {"question": "血液循环的中心器官是什么？", "answer": "心脏"},
            {"question": "遗传物质主要存在于细胞的哪个部位？", "answer": "细胞核"},
            {"question": "人体有哪八大系统？", "answer": "运动、消化、呼吸、循环、泌尿、神经、内分泌、生殖系统"}
        ],
        "政治": [
            {"question": "我国的根本政治制度是什么？", "answer": "人民代表大会制度"},
            {"question": "我国的国家性质是什么？", "answer": "人民民主专政的社会主义国家"},
            {"question": "公民的基本权利有哪些？", "answer": "选举权与被选举权、言论自由、人身自由等"},
            {"question": "社会主义核心价值观的内容是什么？", "answer": "富强、民主、文明、和谐、自由、平等、公正、法治、爱国、敬业、诚信、友善"},
            {"question": "我国的最高国家权力机关是什么？", "answer": "全国人民代表大会"},
            {"question": "我国的政党制度是什么？", "answer": "中国共产党领导的多党合作和政治协商制度"},
            {"question": "什么是公民的义务？", "answer": "公民必须履行的责任"},
            {"question": "依法治国的核心是什么？", "answer": "依宪治国"},
            {"question": "我国的国旗是什么？", "answer": "五星红旗"},
            {"question": "我国的国歌是什么？", "answer": "《义勇军进行曲》"}
        ]
    }
    save_knowledge_points(default_data)
    return default_data


def display_subjects(subjects):
    print("\n" + "=" * 40)
    print("【抽背助手】选择科目")
    print("=" * 40)
    for i, subject in enumerate(subjects, 1):
        print(f"  {i}. {subject}")
    print("  0. 返回主菜单")
    print("=" * 40)


def display_main_menu():
    print("\n" + "=" * 40)
    print("【抽背助手 v1.0】")
    print("=" * 40)
    print("  1. 开始抽背")
    print("  2. 添加知识点")
    print("  3. 查看统计记录")
    print("  4. 管理知识点")
    print("  5. 退出")
    print("=" * 40)


def start_quiz(subject, knowledge_points):
    points = knowledge_points[subject]
    if not points:
        print(f"\n[错误] {subject} 暂无知识点，请先添加！")
        input("按回车键继续...")
        return

    random.shuffle(points)
    correct = 0
    total = 0
    wrong_answers = []

    print(f"\n[开始] {subject}抽背！")
    print("提示：输入答案后按回车，输入 'q' 退出抽背\n")

    for point in points:
        total += 1
        print(f"[题目] 第 {total} 题：{point['question']}")
        user_answer = input("[回答] 你的答案：").strip()

        if user_answer.lower() == 'q':
            print("\n[结束] 抽背结束")
            break

        if user_answer == point['answer']:
            print("[正确] 回答正确！")
            correct += 1
        else:
            print(f"[错误] 回答错误！正确答案是：{point['answer']}")
            wrong_answers.append(point)

        time.sleep(0.5)
        print()

    if total > 0:
        accuracy = int(correct / total * 100)
        print(f"[统计] 抽背完成！共 {total} 题，正确 {correct} 题，正确率 {accuracy}%")

        record = load_record()
        today = time.strftime("%Y-%m-%d")
        if today not in record:
            record[today] = {}
        if subject not in record[today]:
            record[today][subject] = {"correct": 0, "total": 0}
        record[today][subject]["correct"] += correct
        record[today][subject]["total"] += total
        save_record(record)

        if wrong_answers:
            print("\n[错题] 错题回顾：")
            for i, point in enumerate(wrong_answers, 1):
                print(f"  {i}. {point['question']}")
                print(f"     正确答案：{point['answer']}")

    input("按回车键继续...")


def add_knowledge_point(knowledge_points):
    display_subjects(list(knowledge_points.keys()))
    try:
        choice = int(input("请选择要添加知识点的科目序号："))
        if choice == 0:
            return
        subjects = list(knowledge_points.keys())
        if 1 <= choice <= len(subjects):
            subject = subjects[choice - 1]
            question = input("请输入问题：").strip()
            answer = input("请输入答案：").strip()
            if question and answer:
                knowledge_points[subject].append({"question": question, "answer": answer})
                save_knowledge_points(knowledge_points)
                print(f"[成功] 成功添加到 {subject}！")
            else:
                print("[错误] 问题和答案不能为空！")
        else:
            print("[错误] 无效的选择！")
    except ValueError:
        print("[错误] 请输入有效数字！")
    input("按回车键继续...")


def view_statistics():
    record = load_record()
    if not record:
        print("\n[提示] 暂无统计记录！")
        input("按回车键继续...")
        return

    print("\n" + "=" * 40)
    print("【学习统计记录】")
    print("=" * 40)

    total_correct = 0
    total_total = 0

    for date, subjects in sorted(record.items(), reverse=True):
        print(f"\n[日期] {date}")
        for subject, stats in subjects.items():
            accuracy = int(stats['correct'] / stats['total'] * 100) if stats['total'] > 0 else 0
            print(f"   {subject}: {stats['correct']}/{stats['total']} ({accuracy}%)")
            total_correct += stats['correct']
            total_total += stats['total']

    overall_accuracy = int(total_correct / total_total * 100) if total_total > 0 else 0
    print(f"\n[总计] 共 {total_correct}/{total_total} ({overall_accuracy}%)")
    input("按回车键继续...")


def manage_knowledge_points(knowledge_points):
    display_subjects(list(knowledge_points.keys()))
    try:
        choice = int(input("请选择要管理的科目序号："))
        if choice == 0:
            return
        subjects = list(knowledge_points.keys())
        if 1 <= choice <= len(subjects):
            subject = subjects[choice - 1]
            points = knowledge_points[subject]
            if not points:
                print(f"\n[错误] {subject} 暂无知识点！")
                input("按回车键继续...")
                return

            print(f"\n[列表] {subject} 知识点列表：")
            for i, point in enumerate(points, 1):
                print(f"  {i}. {point['question']}")
                print(f"     答案：{point['answer']}")

            print("\n  1. 删除知识点")
            print("  2. 修改知识点")
            print("  0. 返回")
            try:
                action = int(input("请选择操作："))
                if action == 1:
                    idx = int(input("请输入要删除的序号："))
                    if 1 <= idx <= len(points):
                        del points[idx - 1]
                        save_knowledge_points(knowledge_points)
                        print("[成功] 删除成功！")
                    else:
                        print("[错误] 无效的序号！")
                elif action == 2:
                    idx = int(input("请输入要修改的序号："))
                    if 1 <= idx <= len(points):
                        new_question = input("请输入新问题（回车跳过）：").strip()
                        new_answer = input("请输入新答案（回车跳过）：").strip()
                        if new_question:
                            points[idx - 1]['question'] = new_question
                        if new_answer:
                            points[idx - 1]['answer'] = new_answer
                        save_knowledge_points(knowledge_points)
                        print("[成功] 修改成功！")
                    else:
                        print("[错误] 无效的序号！")
                elif action != 0:
                    print("[错误] 无效的选择！")
            except ValueError:
                print("[错误] 请输入有效数字！")
        else:
            print("[错误] 无效的选择！")
    except ValueError:
        print("[错误] 请输入有效数字！")
    input("按回车键继续...")


def main():
    knowledge_points = load_knowledge_points()
    if not knowledge_points:
        knowledge_points = init_default_data()

    while True:
        display_main_menu()
        try:
            choice = int(input("请输入选择（1-5）："))
            if choice == 1:
                display_subjects(list(knowledge_points.keys()))
                sub_choice = int(input("请选择科目序号："))
                if 1 <= sub_choice <= len(knowledge_points):
                    subject = list(knowledge_points.keys())[sub_choice - 1]
                    start_quiz(subject, knowledge_points)
                elif sub_choice != 0:
                    print("[错误] 无效的选择！")
            elif choice == 2:
                add_knowledge_point(knowledge_points)
            elif choice == 3:
                view_statistics()
            elif choice == 4:
                manage_knowledge_points(knowledge_points)
            elif choice == 5:
                print("\n[再见] 感谢使用抽背助手！再见！")
                break
            else:
                print("[错误] 请输入1-5之间的数字！")
        except ValueError:
            print("[错误] 请输入有效数字！")


if __name__ == "__main__":
    main()