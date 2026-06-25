package memory

import (
	"fmt"
	"regexp"
	"strings"
	"time"
)

// 直接陈述模式：用户明确说出的信息，置信度高
var factPatterns = []struct {
	pattern *regexp.Regexp
	format  string
}{
	{regexp.MustCompile(`我叫(.+?)(?:[，。,\.\s]|$)`), "%s说他叫%s"},
	{regexp.MustCompile(`我的名字(?:是|叫)(.+?)(?:[，。,\.\s]|$)`), "%s的名字是%s"},
	{regexp.MustCompile(`大家(?:都|可以|就)?叫我(.+?)(?:[，。,\.\s]|$)`), "%s让大家叫%s"},
	{regexp.MustCompile(`我是([^，。,\.\s]{1,15}(?:生|人|员|族|党|迷|控|粉))`), "%s是%s"},
	{regexp.MustCompile(`我在(.+?)(?:工作|上班|上学|读书|读大学|读研|读博)`), "%s在%s"},
	{regexp.MustCompile(`我(?:今年|现在|已经)?(\d{1,2})岁`), "%s今年%s岁"},
	{regexp.MustCompile(`我是(\d{1,2})年生的`), "%s是%s年生的"},
	{regexp.MustCompile(`我(?:喜欢|爱|最喜欢|超喜欢|超爱)(.+?)(?:[，。,\.\s]|$)`), "%s喜欢%s"},
	{regexp.MustCompile(`我(?:讨厌|不喜欢|最讨厌)(.+?)(?:[，。,\.\s]|$)`), "%s讨厌%s"},
	{regexp.MustCompile(`我(?:住在|在)(.{2,10}(?:市|省|区|县|镇|乡|村|街|路))`), "%s住在%s"},
	{regexp.MustCompile(`我的(?:职业|工作是|工作是|工作是)(.{2,10})`), "%s的职业是%s"},
	{regexp.MustCompile(`我是(.{2,8}(?:大学|高中|初中|小学|中学)(?:的)?(?:学生|毕业生)?)`), "%s是%s"},
	{regexp.MustCompile(`我(?:会|学过|精通|擅长|懂)(.+?)(?:[，。,\.\s]|$)`), "%s擅长%s"},
	{regexp.MustCompile(`我(?:有|养了|养着)(.{1,10}(?:猫|狗|宠物|鱼|鸟|仓鼠|兔子|蛇|龟))`), "%s有%s"},
	{regexp.MustCompile(`我(?:最近|刚|现在)(?:在|正在)(?:学|看|读|玩|写|做|研究)(.+?)(?:[，。,\.\s]|$)`), "%s最近在%s"},
	{regexp.MustCompile(`我(?:觉得|认为|感觉)(.+?)(?:[，。,\.\s]|$)`), "%s认为%s"},
	{regexp.MustCompile(`我(?:是|来自)(.{2,8}(?:人))`), "%s是%s"},
}

// 隐含推断模式：从语境中推断人物属性，置信度较低
var implicitPatterns = []struct {
	pattern *regexp.Regexp
	fact    string
}{
	// 学生相关
	{regexp.MustCompile(`(?:我|今天|明天|后天|下周|马上|快|就要)(?:要)?考试`), "可能是在校学生（提到考试）"},
	{regexp.MustCompile(`(?:作业|论文|实验报告)`), "可能是在校学生（提到作业/论文/实验）"},
	{regexp.MustCompile(`我(?:在|上)(?:课|自习|图书馆|实验室)`), "可能是在校学生（提到上课/自习/实验）"},
	{regexp.MustCompile(`(?:我|要|该|去)(?:上课|听课|签到|教室)`), "可能是在校学生（提到上课签到）"},

	// 工作相关
	{regexp.MustCompile(`(?:我|刚|才|终于)(?:下班|加班|996|加班到|忙完|赶完)`), "可能在工作（提到下班/加班）"},
	{regexp.MustCompile(`(?:老板|领导|同事)`), "可能在工作（提到老板/领导/同事）"},
	{regexp.MustCompile(`(?:我|今天|刚)(?:开会|汇报|述职|周报|日报)`), "可能在工作（提到开会/汇报）"},
	{regexp.MustCompile(`(?:我|刚)(?:出差|项目|甲方|乙方|客户)`), "可能在工作（提到出差/项目/客户）"},

	// 程序员/技术相关
	{regexp.MustCompile(`(?:代码|bug|Bug|BUG|编程|开发|提交|commit|push|PR|merge)`), "可能从事编程/技术工作（提到代码相关）"},
	{regexp.MustCompile(`(?:我|在)?(?:写|改|调|修|跑)(?:代码|程序|接口|服务)`), "可能从事编程/技术工作"},
	{regexp.MustCompile(`(?:服务器|部署|上线|测试|环境|生产)`), "可能从事技术/运维工作"},

	// 情感/社交关系
	{regexp.MustCompile(`(?:我|我的)?(?:女|男)朋友`), "有恋爱关系"},
	{regexp.MustCompile(`(?:室友|舍友)`), "可能有室友（提到室友）"},
	{regexp.MustCompile(`(?:我家|家里人|爸妈|父母)`), "和家里人有联系（提到家人）"},

	// 生活场景
	{regexp.MustCompile(`(?:我)?(?:房租|房东|租|搬家)`), "可能是租房住（提到房租/搬家）"},
	{regexp.MustCompile(`(?:我|刚|才)(?:搬家|换房子|换宿舍)`), "近期搬过家/换过住处"},
	{regexp.MustCompile(`(?:我|在)?(?:通勤|地铁|公交|挤地铁)`), "需要通勤（提到通勤方式）"},
	{regexp.MustCompile(`(?:外卖|点外卖|做饭|下厨|食堂)`), "平时点外卖/自己做饭/吃食堂"},

	// 娱乐/兴趣
	{regexp.MustCompile(`(?:我|在)?(?:打|玩|肝|氪)(?:游戏|王者|原神|吃鸡|LOL|DOTA)`), "喜欢打游戏"},
	{regexp.MustCompile(`(?:我|在)?(?:追剧|看剧|追番|看番|看动漫|看动画)`), "喜欢追剧/看番"},
	{regexp.MustCompile(`(?:我|在)?(?:健身|跑步|运动|锻炼|游泳|打球)`), "有运动健身习惯"},
	{regexp.MustCompile(`(?:我|今天)?(?:熬夜|通宵|没睡好|睡不着|失眠)`), "作息可能不太规律"},

	// 情绪状态（用于人物画像，非即时情绪）
	{regexp.MustCompile(`(?:我)?(?:焦虑|压力|内耗|emo|EMO|崩溃)`), "近期可能压力较大/焦虑"},
}

// 否定/撤回模式：当用户明确否定或撤回之前说过的事实
var negationPatterns = []struct {
	pattern *regexp.Regexp
	fact    string
}{
	// 直接否定（"其实我不喜欢"、"我不是"）
	{regexp.MustCompile(`(?:其实|实际上|但)?我(?:并)?不(?:喜欢|爱|想|做|是|在|会|住|有)(?:了)?`), "可能否定了之前的某些陈述"},
	// 明确撤回/纠正
	{regexp.MustCompile(`我之前(?:说错|讲的|提的)(?:不对|不准确|有问题)`), "撤回了之前的某个说法"},
	{regexp.MustCompile(`(?:其实|实际上|但)?我已经(?:不|没|换|改|搬)`), "之前的状态已经改变"},
	// 状态变更
	{regexp.MustCompile(`我(?:换|搬|改)(?:了)?(?:工作|学校|房子|住处|专业|方向|城市)`), "最近改变了生活/工作状态"},
	{regexp.MustCompile(`我不再(?:是|做|干|当|玩|追|看|学)`), "不再做之前常做的事"},
	{regexp.MustCompile(`我(?:已经|早)?(?:离职|辞职|退学|转学|分手|毕业)(?:了)?`), "经历了重大状态变更"},
	// 纠正游戏/兴趣
	{regexp.MustCompile(`我(?:早)?(?:不|没)(?:打|玩|肝)(?:了|过)?(?:游戏|王者|原神|吃鸡|LOL|DOTA)`), "可能已经不玩之前提到的游戏"},
}

func ExtractPersonFacts(content string, senderName string, senderID string) []string {
	if content == "" {
		return nil
	}

	displayName := senderName
	if displayName == "" {
		displayName = senderID
	}
	if displayName == "" {
		return nil
	}

	var facts []string
	seen := make(map[string]bool)
	today := time.Now().Format("01-02")

	for _, fp := range factPatterns {
		matches := fp.pattern.FindAllStringSubmatch(content, -1)
		for _, match := range matches {
			if len(match) >= 2 {
				detail := strings.TrimSpace(match[1])
				if detail == "" || len([]rune(detail)) > 15 {
					continue
				}
				fact := strings.Replace(fp.format, "%s", displayName, 1)
				fact = strings.Replace(fact, "%s", detail, 1)
				fact = fmt.Sprintf("[高置信·%s] %s", today, fact)
				if !seen[fact] {
					seen[fact] = true
					facts = append(facts, fact)
				}
			}
		}
	}

	for _, ip := range implicitPatterns {
		if ip.pattern.MatchString(content) {
			fact := fmt.Sprintf("[推断·%s] %s%s", today, displayName, ip.fact)
			if !seen[fact] {
				seen[fact] = true
				facts = append(facts, fact)
			}
		}
	}

	for _, np := range negationPatterns {
		if np.pattern.MatchString(content) {
			fact := fmt.Sprintf("[撤回·%s] %s%s", today, displayName, np.fact)
			if !seen[fact] {
				seen[fact] = true
				facts = append(facts, fact)
			}
			break
		}
	}

	return facts
}
