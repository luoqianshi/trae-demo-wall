# 读取facilities-data.js文件
$filePath = "d:/赛事/facilities-data.js"
$content = Get-Content -Path $filePath -Raw -Encoding UTF8

# 定义杭州的完整数据（8种设施类型）
$hangzhouData = @'
  "杭州": {
    "上城区": {
      "湖滨街道": {
        "subway": [{"name": "龙翔桥站", "address": "上城区湖滨", "distance": 100, "line": "1号线"}],
        "bus": [{"name": "龙翔桥公交站", "address": "上城区湖滨", "distance": 150}],
        "hospital": [{"name": "杭州市第一人民医院", "address": "上城区湖滨", "distance": 300, "level": "三级甲等"}, {"name": "上城区中医院", "address": "上城区清波", "distance": 400, "level": "二甲"}],
        "pharmacy": [{"name": "海王星辰湖滨店", "address": "上城区湖滨", "distance": 100}, {"name": "老百姓大药房湖滨店", "address": "上城区湖滨", "distance": 150}],
        "supermarket": [{"name": "世纪联华湖滨店", "address": "上城区湖滨", "distance": 200}, {"name": "永辉超市湖滨店", "address": "上城区湖滨", "distance": 300}],
        "convenience": [{"name": "十足湖滨店", "address": "上城区湖滨", "distance": 50}, {"name": "7-Eleven湖滨店", "address": "上城区湖滨", "distance": 100}],
        "school": [{"name": "杭州中学", "address": "上城区湖滨", "distance": 400, "type": "初中"}, {"name": "青蓝小学", "address": "上城区湖滨", "distance": 500, "type": "小学"}],
        "park": [{"name": "西湖湖滨公园", "address": "上城区湖滨", "distance": 200}, {"name": "东坡公园", "address": "上城区湖滨", "distance": 400}]
      },
      "清波街道": {
        "subway": [{"name": "定安路站", "address": "上城区清波", "distance": 200, "line": "1号线"}],
        "bus": [{"name": "清波门公交站", "address": "上城区清波", "distance": 150}],
        "hospital": [{"name": "浙江大学附属第一医院", "address": "上城区清波", "distance": 400, "level": "三级甲等"}],
        "pharmacy": [{"name": "海王星辰清波店", "address": "上城区清波", "distance": 100}],
        "supermarket": [{"name": "世纪联华清波店", "address": "上城区清波", "distance": 200}],
        "convenience": [{"name": "十足清波店", "address": "上城区清波", "distance": 80}],
        "school": [{"name": "清波小学", "address": "上城区清波", "distance": 300, "type": "小学"}],
        "park": [{"name": "柳浪闻莺公园", "address": "上城区清波", "distance": 250}]
      },
      "小营街道": {
        "subway": [{"name": "城站", "address": "上城区小营", "distance": 100, "line": "1、5号线"}],
        "bus": [{"name": "城站火车站公交站", "address": "上城区小营", "distance": 100}],
        "hospital": [{"name": "浙江大学医学院附属第二医院", "address": "上城区小营", "distance": 300, "level": "三级甲等"}],
        "pharmacy": [{"name": "同仁堂小营店", "address": "上城区小营", "distance": 150}],
        "supermarket": [{"name": "华润万家小营店", "address": "上城区小营", "distance": 200}],
        "convenience": [{"name": "7-Eleven小营店", "address": "上城区小营", "distance": 80}],
        "school": [{"name": "杭州师范大学附属小学", "address": "上城区小营", "distance": 400, "type": "小学"}],
        "park": [{"name": "胡雪岩故居公园", "address": "上城区小营", "distance": 300}]
      },
      "南星街道": {
        "subway": [{"name": "南星桥站", "address": "上城区南星", "distance": 200, "line": "5号线"}],
        "bus": [{"name": "南星桥公交站", "address": "上城区南星", "distance": 150}],
        "hospital": [{"name": "杭州市第三人民医院", "address": "上城区南星", "distance": 350, "level": "三级乙等"}],
        "pharmacy": [{"name": "海王星辰南星店", "address": "上城区南星", "distance": 120}],
        "supermarket": [{"name": "物美超市南星店", "address": "上城区南星", "distance": 220}],
        "convenience": [{"name": "十足南星店", "address": "上城区南星", "distance": 100}],
        "school": [{"name": "南星小学", "address": "上城区南星", "distance": 350, "type": "小学"}],
        "park": [{"name": "白塔公园", "address": "上城区南星", "distance": 300}]
      },
      "紫阳街道": {
        "subway": [{"name": "候潮门站", "address": "上城区紫阳", "distance": 200, "line": "5号线"}],
        "bus": [{"name": "候潮门公交站", "address": "上城区紫阳", "distance": 150}],
        "hospital": [{"name": "浙江省中医院", "address": "上城区紫阳", "distance": 400, "level": "三级甲等"}],
        "pharmacy": [{"name": "老百姓大药房紫阳店", "address": "上城区紫阳", "distance": 100}],
        "supermarket": [{"name": "世纪联华紫阳店", "address": "上城区紫阳", "distance": 200}],
        "convenience": [{"name": "7-Eleven紫阳店", "address": "上城区紫阳", "distance": 80}],
        "school": [{"name": "紫阳小学", "address": "上城区紫阳", "distance": 350, "type": "小学"}],
        "park": [{"name": "候潮门公园", "address": "上城区紫阳", "distance": 200}]
      },
      "望江街道": {
        "subway": [{"name": "望江门站", "address": "上城区望江", "distance": 200, "line": "5号线"}],
        "bus": [{"name": "望江门公交站", "address": "上城区望江", "distance": 150}],
        "hospital": [{"name": "杭州市第四人民医院", "address": "上城区望江", "distance": 380, "level": "三级乙等"}],
        "pharmacy": [{"name": "海王星辰望江店", "address": "上城区望江", "distance": 110}],
        "supermarket": [{"name": "永辉超市望江店", "address": "上城区望江", "distance": 210}],
        "convenience": [{"name": "十足望江店", "address": "上城区望江", "distance": 90}],
        "school": [{"name": "望江小学", "address": "上城区望江", "distance": 360, "type": "小学"}],
        "park": [{"name": "望江公园", "address": "上城区望江", "distance": 280}]
      },
      "凯旋街道": {
        "subway": [{"name": "凯旋路站", "address": "上城区凯旋", "distance": 200, "line": "2号线"}],
        "bus": [{"name": "凯旋路公交站", "address": "上城区凯旋", "distance": 150}],
        "hospital": [{"name": "浙江大学医学院附属妇产科医院", "address": "上城区凯旋", "distance": 450, "level": "三级甲等"}],
        "pharmacy": [{"name": "同仁堂凯旋店", "address": "上城区凯旋", "distance": 120}],
        "supermarket": [{"name": "物美超市凯旋店", "address": "上城区凯旋", "distance": 230}],
        "convenience": [{"name": "7-Eleven凯旋店", "address": "上城区凯旋", "distance": 85}],
        "school": [{"name": "凯旋小学", "address": "上城区凯旋", "distance": 370, "type": "小学"}],
        "park": [{"name": "凯旋公园", "address": "上城区凯旋", "distance": 320}]
      },
      "采荷街道": {
        "subway": [{"name": "采荷站", "address": "上城区采荷", "distance": 300, "line": "2号线"}],
        "bus": [{"name": "采荷公交站", "address": "上城区采荷", "distance": 200}],
        "hospital": [{"name": "邵逸夫医院", "address": "上城区采荷", "distance": 400, "level": "三级甲等"}],
        "pharmacy": [{"name": "海王星辰采荷店", "address": "上城区采荷", "distance": 130}],
        "supermarket": [{"name": "世纪联华采荷店", "address": "上城区采荷", "distance": 240}],
        "convenience": [{"name": "十足采荷店", "address": "上城区采荷", "distance": 110}],
        "school": [{"name": "采荷第一小学", "address": "上城区采荷", "distance": 380, "type": "小学"}, {"name": "采荷中学", "address": "上城区采荷", "distance": 450, "type": "初中"}],
        "park": [{"name": "采荷公园", "address": "上城区采荷", "distance": 350}]
      },
      "闸弄口街道": {
        "subway": [{"name": "闸弄口站", "address": "上城区闸弄口", "distance": 200, "line": "2号线"}],
        "bus": [{"name": "闸弄口公交站", "address": "上城区闸弄口", "distance": 150}],
        "hospital": [{"name": "杭州市中医院", "address": "上城区闸弄口", "distance": 420, "level": "三级甲等"}],
        "pharmacy": [{"name": "老百姓大药房闸弄口店", "address": "上城区闸弄口", "distance": 115}],
        "supermarket": [{"name": "华润万家闸弄口店", "address": "上城区闸弄口", "distance": 215}],
        "convenience": [{"name": "7-Eleven闸弄口店", "address": "上城区闸弄口", "distance": 95}],
        "school": [{"name": "闸弄口小学", "address": "上城区闸弄口", "distance": 390, "type": "小学"}],
        "park": [{"name": "闸弄口公园", "address": "上城区闸弄口", "distance": 330}]
      },
      "彭埠街道": {
        "subway": [{"name": "彭埠站", "address": "上城区彭埠", "distance": 200, "line": "1、4号线"}],
        "bus": [{"name": "彭埠公交站", "address": "上城区彭埠", "distance": 150}],
        "hospital": [{"name": "浙江省人民医院", "address": "上城区彭埠", "distance": 380, "level": "三级甲等"}],
        "pharmacy": [{"name": "海王星辰彭埠店", "address": "上城区彭埠", "distance": 125}],
        "supermarket": [{"name": "物美超市彭埠店", "address": "上城区彭埠", "distance": 225}],
        "convenience": [{"name": "十足彭埠店", "address": "上城区彭埠", "distance": 105}],
        "school": [{"name": "彭埠小学", "address": "上城区彭埠", "distance": 400, "type": "小学"}],
        "park": [{"name": "彭埠公园", "address": "上城区彭埠", "distance": 340}]
      },
      "笕桥街道": {
        "subway": [{"name": "笕桥站", "address": "上城区笕桥", "distance": 300, "line": "4号线"}],
        "bus": [{"name": "笕桥公交站", "address": "上城区笕桥", "distance": 200}],
        "hospital": [{"name": "杭州树兰医院", "address": "上城区笕桥", "distance": 450, "level": "三级综合"}],
        "pharmacy": [{"name": "同仁堂笕桥店", "address": "上城区笕桥", "distance": 140}],
        "supermarket": [{"name": "世纪联华笕桥店", "address": "上城区笕桥", "distance": 260}],
        "convenience": [{"name": "7-Eleven笕桥店", "address": "上城区笕桥", "distance": 120}],
        "school": [{"name": "笕桥小学", "address": "上城区笕桥", "distance": 420, "type": "小学"}, {"name": "笕桥实验中学", "address": "上城区笕桥", "distance": 480, "type": "初中"}],
        "park": [{"name": "笕桥公园", "address": "上城区笕桥", "distance": 380}]
      },
      "丁兰街道": {
        "subway": [{"name": "丁兰站", "address": "上城区丁兰", "distance": 300, "line": "3号线"}],
        "bus": [{"name": "丁兰公交站", "address": "上城区丁兰", "distance": 200}],
        "hospital": [{"name": "杭州市丁桥医院", "address": "上城区丁兰", "distance": 400, "level": "二级甲等"}],
        "pharmacy": [{"name": "海王星辰丁兰店", "address": "上城区丁兰", "distance": 135}],
        "supermarket": [{"name": "永辉超市丁兰店", "address": "上城区丁兰", "distance": 250}],
        "convenience": [{"name": "十足丁兰店", "address": "上城区丁兰", "distance": 115}],
        "school": [{"name": "丁兰小学", "address": "上城区丁兰", "distance": 410, "type": "小学"}, {"name": "丁兰中学", "address": "上城区丁兰", "distance": 470, "type": "初中"}],
        "park": [{"name": "丁兰公园", "address": "上城区丁兰", "distance": 360}]
      }
    },
    "拱墅区": {
      "拱宸桥街道": {
        "subway": [{"name": "拱宸桥东站", "address": "拱墅区拱宸桥", "distance": 100, "line": "5号线"}],
        "bus": [{"name": "拱宸桥东公交站", "address": "拱墅区拱宸桥", "distance": 100}],
        "hospital": [{"name": "浙江省新华医院", "address": "拱墅区拱宸桥", "distance": 300, "level": "三级甲等"}],
        "pharmacy": [{"name": "海王星辰拱宸桥店", "address": "拱墅区拱宸桥", "distance": 100}],
        "supermarket": [{"name": "世纪联华拱宸桥店", "address": "拱墅区拱宸桥", "distance": 200}],
        "convenience": [{"name": "十足拱宸桥店", "address": "拱墅区拱宸桥", "distance": 80}],
        "school": [{"name": "拱宸桥小学", "address": "拱墅区拱宸桥", "distance": 350, "type": "小学"}, {"name": "拱宸中学", "address": "拱墅区拱宸桥", "distance": 420, "type": "初中"}],
        "park": [{"name": "运河公园", "address": "拱墅区拱宸桥", "distance": 200}, {"name": "拱宸桥公园", "address": "拱墅区拱宸桥", "distance": 300}]
      },
      "和睦街道": {
        "subway": [{"name": "和睦站", "address": "拱墅区和睦", "distance": 200, "line": "5号线"}],
        "bus": [{"name": "和睦公交站", "address": "拱墅区和睦", "distance": 150}],
        "hospital": [{"name": "杭州师范大学附属医院", "address": "拱墅区和睦", "distance": 350, "level": "三级乙等"}],
        "pharmacy": [{"name": "老百姓大药房和睦店", "address": "拱墅区和睦", "distance": 110}],
        "supermarket": [{"name": "物美超市和睦店", "address": "拱墅区和睦", "distance": 220}],
        "convenience": [{"name": "7-Eleven和睦店", "address": "拱墅区和睦", "distance": 90}],
        "school": [{"name": "和睦小学", "address": "拱墅区和睦", "distance": 380, "type": "小学"}],
        "park": [{"name": "和睦公园", "address": "拱墅区和睦", "distance": 320}]
      },
      "小河街道": {
        "subway": [{"name": "小河站", "address": "拱墅区小河", "distance": 200, "line": "5号线"}],
        "bus": [{"name": "小河公交站", "address": "拱墅区小河", "distance": 150}],
        "hospital": [{"name": "拱墅区中医医院", "address": "拱墅区小河", "distance": 380, "level": "二甲"}],
        "pharmacy": [{"name": "海王星辰小河店", "address": "拱墅区小河", "distance": 115}],
        "supermarket": [{"name": "华润万家小河店", "address": "拱墅区小河", "distance": 230}],
        "convenience": [{"name": "十足小河店", "address": "拱墅区小河", "distance": 95}],
        "school": [{"name": "小河小学", "address": "拱墅区小河", "distance": 390, "type": "小学"}],
        "park": [{"name": "小河直街公园", "address": "拱墅区小河", "distance": 280}]
      },
      "湖墅街道": {
        "subway": [{"name": "湖墅站", "address": "拱墅区湖墅", "distance": 200, "line": "5号线"}],
        "bus": [{"name": "湖墅公交站", "address": "拱墅区湖墅", "distance": 150}],
        "hospital": [{"name": "浙江省中山医院", "address": "拱墅区湖墅", "distance": 360, "level": "三级甲等"}],
        "pharmacy": [{"name": "同仁堂湖墅店", "address": "拱墅区湖墅", "distance": 105}],
        "supermarket": [{"name": "世纪联华湖墅店", "address": "拱墅区湖墅", "distance": 210}],
        "convenience": [{"name": "7-Eleven湖墅店", "address": "拱墅区湖墅", "distance": 85}],
        "school": [{"name": "湖墅小学", "address": "拱墅区湖墅", "distance": 370, "type": "小学"}, {"name": "行知中学", "address": "拱墅区湖墅", "distance": 450, "type": "初中"}],
        "park": [{"name": "湖墅公园", "address": "拱墅区湖墅", "distance": 310}]
      },
      "米市巷街道": {
        "subway": [{"name": "米市巷站", "address": "拱墅区米市巷", "distance": 100, "line": "2号线"}],
        "bus": [{"name": "米市巷公交站", "address": "拱墅区米市巷", "distance": 100}],
        "hospital": [{"name": "杭州市第二人民医院", "address": "拱墅区米市巷", "distance": 320, "level": "三级乙等"}],
        "pharmacy": [{"name": "海王星辰米市巷店", "address": "拱墅区米市巷", "distance": 95}],
        "supermarket": [{"name": "物美超市米市巷店", "address": "拱墅区米市巷", "distance": 190}],
        "convenience": [{"name": "十足米市巷店", "address": "拱墅区米市巷", "distance": 75}],
        "school": [{"name": "米市巷小学", "address": "拱墅区米市巷", "distance": 360, "type": "小学"}],
        "park": [{"name": "米市巷公园", "address": "拱墅区米市巷", "distance": 270}]
      },
      "半山街道": {
        "subway": [{"name": "半山站", "address": "拱墅区半山", "distance": 300, "line": "4号线"}],
        "bus": [{"name": "半山公交站", "address": "拱墅区半山", "distance": 200}],
        "hospital": [{"name": "杭州康祥医院", "address": "拱墅区半山", "distance": 400, "level": "二级综合"}],
        "pharmacy": [{"name": "老百姓大药房半山店", "address": "拱墅区半山", "distance": 130}],
        "supermarket": [{"name": "世纪联华半山店", "address": "拱墅区半山", "distance": 250}],
        "convenience": [{"name": "7-Eleven半山店", "address": "拱墅区半山", "distance": 110}],
        "school": [{"name": "半山小学", "address": "拱墅区半山", "distance": 400, "type": "小学"}, {"name": "半山实验中学", "address": "拱墅区半山", "distance": 480, "type": "初中"}],
        "park": [{"name": "半山国家森林公园", "address": "拱墅区半山", "distance": 500}, {"name": "半山公园", "address": "拱墅区半山", "distance": 350}]
      },
      "康桥街道": {
        "subway": [{"name": "康桥站", "address": "拱墅区康桥", "distance": 400, "line": "4号线"}],
        "bus": [{"name": "康桥公交站", "address": "拱墅区康桥", "distance": 250}],
        "hospital": [{"name": "拱墅区康桥社区卫生服务中心", "address": "拱墅区康桥", "distance": 350, "level": "一级"}],
        "pharmacy": [{"name": "海王星辰康桥店", "address": "拱墅区康桥", "distance": 150}],
        "supermarket": [{"name": "永辉超市康桥店", "address": "拱墅区康桥", "distance": 280}],
        "convenience": [{"name": "十足康桥店", "address": "拱墅区康桥", "distance": 130}],
        "school": [{"name": "康桥小学", "address": "拱墅区康桥", "distance": 420, "type": "小学"}],
        "park": [{"name": "康桥公园", "address": "拱墅区康桥", "distance": 380}]
      },
      "上塘街道": {
        "subway": [{"name": "上塘站", "address": "拱墅区上塘", "distance": 200, "line": "3号线"}],
        "bus": [{"name": "上塘公交站", "address": "拱墅区上塘", "distance": 150}],
        "hospital": [{"name": "浙江骨伤医院", "address": "拱墅区上塘", "distance": 380, "level": "二级甲等"}],
        "pharmacy": [{"name": "同仁堂上塘店", "address": "拱墅区上塘", "distance": 115}],
        "supermarket": [{"name": "物美超市上塘店", "address": "拱墅区上塘", "distance": 230}],
        "convenience": [{"name": "7-Eleven上塘店", "address": "拱墅区上塘", "distance": 95}],
        "school": [{"name": "上塘小学", "address": "拱墅区上塘", "distance": 390, "type": "小学"}, {"name": "上塘中学", "address": "拱墅区上塘", "distance": 460, "type": "初中"}],
        "park": [{"name": "上塘公园", "address": "拱墅区上塘", "distance": 330}]
      },
      "祥符街道": {
        "subway": [{"name": "祥符站", "address": "拱墅区祥符", "distance": 200, "line": "2号线"}],
        "bus": [{"name": "祥符公交站", "address": "拱墅区祥符", "distance": 150}],
        "hospital": [{"name": "浙江医院三墩院区", "address": "拱墅区祥符", "distance": 420, "level": "三级甲等"}],
        "pharmacy": [{"name": "海王星辰祥符店", "address": "拱墅区祥符", "distance": 120}],
        "supermarket": [{"name": "世纪联华祥符店", "address": "拱墅区祥符", "distance": 240}],
        "convenience": [{"name": "十足祥符店", "address": "拱墅区祥符", "distance": 100}],
        "school": [{"name": "祥符小学", "address": "拱墅区祥符", "distance": 400, "type": "小学"}, {"name": "祥符中学", "address": "拱墅区祥符", "distance": 470, "type": "初中"}],
        "park": [{"name": "祥符公园", "address": "拱墅区祥符", "distance": 340}]
      },
      "大关街道": {
        "subway": [{"name": "大关站", "address": "拱墅区大关", "distance": 200, "line": "3号线"}],
        "bus": [{"name": "大关公交站", "address": "拱墅区大关", "distance": 150}],
        "hospital": [{"name": "拱墅区大关上塘街道社区卫生服务中心", "address": "拱墅区大关", "distance": 300, "level": "一级"}],
        "pharmacy": [{"name": "老百姓大药房大关店", "address": "拱墅区大关", "distance": 110}],
        "supermarket": [{"name": "华润万家大关店", "address": "拱墅区大关", "distance": 220}],
        "convenience": [{"name": "7-Eleven大关店", "address": "拱墅区大关", "distance": 90}],
        "school": [{"name": "大关小学", "address": "拱墅区大关", "distance": 380, "type": "小学"}],
        "park": [{"name": "大关公园", "address": "拱墅区大关", "distance": 310}]
      },
      "东新街道": {
        "subway": [{"name": "东新站", "address": "拱墅区东新", "distance": 300, "line": "3号线"}],
        "bus": [{"name": "东新公交站", "address": "拱墅区东新", "distance": 200}],
        "hospital": [{"name": "杭州整形医院", "address": "拱墅区东新", "distance": 400, "level": "三级专科"}],
        "pharmacy": [{"name": "海王星辰东新店", "address": "拱墅区东新", "distance": 130}],
        "supermarket": [{"name": "物美超市东新店", "address": "拱墅区东新", "distance": 250}],
        "convenience": [{"name": "十足东新店", "address": "拱墅区东新", "distance": 110}],
        "school": [{"name": "东新小学", "address": "拱墅区东新", "distance": 410, "type": "小学"}, {"name": "东新实验中学", "address": "拱墅区东新", "distance": 480, "type": "初中"}],
        "park": [{"name": "东新公园", "address": "拱墅区东新", "distance": 350}]
      },
      "石桥街道": {
        "subway": [{"name": "石桥站", "address": "拱墅区石桥", "distance": 400, "line": "3号线"}],
        "bus": [{"name": "石桥公交站", "address": "拱墅区石桥", "distance": 250}],
        "hospital": [{"name": "杭州肛泰医院", "address": "拱墅区石桥", "distance": 450, "level": "二级专科"}],
        "pharmacy": [{"name": "同仁堂石桥店", "address": "拱墅区石桥", "distance": 145}],
        "supermarket": [{"name": "永辉超市石桥店", "address": "拱墅区石桥", "distance": 280}],
        "convenience": [{"name": "7-Eleven石桥店", "address": "拱墅区石桥", "distance": 125}],
        "school": [{"name": "石桥小学", "address": "拱墅区石桥", "distance": 430, "type": "小学"}],
        "park": [{"name": "石桥公园", "address": "拱墅区石桥", "distance": 370}]
      }
    },
    "西湖区": {
      "北山街道": {
        "subway": [{"name": "北山站", "address": "西湖区北山", "distance": 200, "line": "3号线"}],
        "bus": [{"name": "北山公交站", "address": "西湖区北山", "distance": 150}],
        "hospital": [{"name": "浙江医院", "address": "西湖区北山", "distance": 350, "level": "三级甲等"}],
        "pharmacy": [{"name": "海王星辰北山店", "address": "西湖区北山", "distance": 110}],
        "supermarket": [{"name": "世纪联华北山店", "address": "西湖区北山", "distance": 220}],
        "convenience": [{"name": "十足北山店", "address": "西湖区北山", "distance": 90}],
        "school": [{"name": "北山小学", "address": "西湖区北山", "distance": 380, "type": "小学"}],
        "park": [{"name": "西湖文化广场", "address": "西湖区北山", "distance": 200}, {"name": "北山公园", "address": "西湖区北山", "distance": 320}]
      },
      "西溪街道": {
        "subway": [{"name": "西溪站", "address": "西湖区西溪", "distance": 200, "line": "2号线"}],
        "bus": [{"name": "西溪公交站", "address": "西湖区西溪", "distance": 150}],
        "hospital": [{"name": "浙江省立同德医院", "address": "西湖区西溪", "distance": 380, "level": "三级甲等"}],
        "pharmacy": [{"name": "老百姓大药房西溪店", "address": "西湖区西溪", "distance": 115}],
        "supermarket": [{"name": "物美超市西溪店", "address": "西湖区西溪", "distance": 230}],
        "convenience": [{"name": "7-Eleven西溪店", "address": "西湖区西溪", "distance": 95}],
        "school": [{"name": "西溪小学", "address": "西湖区西溪", "distance": 390, "type": "小学"}, {"name": "西溪中学", "address": "西湖区西溪", "distance": 460, "type": "初中"}],
        "park": [{"name": "西溪湿地公园", "address": "西湖区西溪", "distance": 500}, {"name": "西溪公园", "address": "西湖区西溪", "distance": 330}]
      },
      "灵隐街道": {
        "subway": [{"name": "灵隐站", "address": "西湖区灵隐", "distance": 300, "line": "3号线"}],
        "bus": [{"name": "灵隐公交站", "address": "西湖区灵隐", "distance": 200}],
        "hospital": [{"name": "浙江大学医学院附属第一医院", "address": "西湖区灵隐", "distance": 450, "level": "三级甲等"}],
        "pharmacy": [{"name": "同仁堂灵隐店", "address": "西湖区灵隐", "distance": 140}],
        "supermarket": [{"name": "华润万家灵隐店", "address": "西湖区灵隐", "distance": 260}],
        "convenience": [{"name": "十足灵隐店", "address": "西湖区灵隐", "distance": 120}],
        "school": [{"name": "灵隐小学", "address": "西湖区灵隐", "distance": 420, "type": "小学"}],
        "park": [{"name": "灵隐寺景区", "address": "西湖区灵隐", "distance": 400}, {"name": "飞来峰公园", "address": "西湖区灵隐", "distance": 350}]
      },
      "翠苑街道": {
        "subway": [{"name": "翠苑站", "address": "西湖区翠苑", "distance": 100, "line": "2号线"}],
        "bus": [{"name": "翠苑公交站", "address": "西湖区翠苑", "distance": 100}],
        "hospital": [{"name": "杭州市中医院分院", "address": "西湖区翠苑", "distance": 340, "level": "三级甲等"}],
        "pharmacy": [{"name": "海王星辰翠苑店", "address": "西湖区翠苑", "distance": 95}],
        "supermarket": [{"name": "世纪联华翠苑店", "address": "西湖区翠苑", "distance": 200}],
        "convenience": [{"name": "7-Eleven翠苑店", "address": "西湖区翠苑", "distance": 80}],
        "school": [{"name": "翠苑第一小学", "address": "西湖区翠苑", "distance": 370, "type": "小学"}, {"name": "翠苑中学", "address": "西湖区翠苑", "distance": 440, "type": "初中"}],
        "park": [{"name": "翠苑公园", "address": "西湖区翠苑", "distance": 280}]
      },
      "文新街道": {
        "subway": [{"name": "文新站", "address": "西湖区文新", "distance": 200, "line": "2号线"}],
        "bus": [{"name": "文新公交站", "address": "西湖区文新", "distance": 150}],
        "hospital": [{"name": "浙江中医药大学附属第三医院", "address": "西湖区文新", "distance": 370, "level": "三级乙等"}],
        "pharmacy": [{"name": "老百姓大药房文新店", "address": "西湖区文新", "distance": 110}],
        "supermarket": [{"name": "物美超市文新店", "address": "西湖区文新", "distance": 220}],
        "convenience": [{"name": "十足文新店", "address": "西湖区文新", "distance": 90}],
        "school": [{"name": "文新小学", "address": "西湖区文新", "distance": 380, "type": "小学"}],
        "park": [{"name": "文新公园", "address": "西湖区文新", "distance": 310}]
      },
      "古荡街道": {
        "subway": [{"name": "古荡站", "address": "西湖区古荡", "distance": 200, "line": "2号线"}],
        "bus": [{"name": "古荡公交站", "address": "西湖区古荡", "distance": 150}],
        "hospital": [{"name": "浙江省眼科医院", "address": "西湖区古荡", "distance": 360, "level": "三级专科"}],
        "pharmacy": [{"name": "海王星辰古荡店", "address": "西湖区古荡", "distance": 105}],
        "supermarket": [{"name": "永辉超市古荡店", "address": "西湖区古荡", "distance": 230}],
        "convenience": [{"name": "7-Eleven古荡店", "address": "西湖区古荡", "distance": 85}],
        "school": [{"name": "古荡小学", "address": "西湖区古荡", "distance": 390, "type": "小学"}],
        "park": [{"name": "古荡公园", "address": "西湖区古荡", "distance": 320}]
      },
      "留下街道": {
        "subway": [{"name": "留下站", "address": "西湖区留下", "distance": 300, "line": "3号线"}],
        "bus": [{"name": "留下公交站", "address": "西湖区留下", "distance": 200}],
        "hospital": [{"name": "西湖区第二人民医院", "address": "西湖区留下", "distance": 400, "level": "二级甲等"}],
        "pharmacy": [{"name": "同仁堂留下店", "address": "西湖区留下", "distance": 130}],
        "supermarket": [{"name": "世纪联华留下店", "address": "西湖区留下", "distance": 250}],
        "convenience": [{"name": "十足留下店", "address": "西湖区留下", "distance": 110}],
        "school": [{"name": "留下小学", "address": "西湖区留下", "distance": 410, "type": "小学"}, {"name": "留下中学", "address": "西湖区留下", "distance": 480, "type": "初中"}],
        "park": [{"name": "西溪湿地公园南门", "address": "西湖区留下", "distance": 450}]
      },
      "转塘街道": {
        "subway": [{"name": "转塘站", "address": "西湖区转塘", "distance": 300, "line": "6号线"}],
        "bus": [{"name": "转塘公交站", "address": "西湖区转塘", "distance": 200}],
        "hospital": [{"name": "浙江大学医学院附属第一医院之江院区", "address": "西湖区转塘", "distance": 450, "level": "三级甲等"}],
        "pharmacy": [{"name": "海王星辰转塘店", "address": "西湖区转塘", "distance": 135}],
        "supermarket": [{"name": "物美超市转塘店", "address": "西湖区转塘", "distance": 260}],
        "convenience": [{"name": "7-Eleven转塘店", "address": "西湖区转塘", "distance": 115}],
        "school": [{"name": "转塘小学", "address": "西湖区转塘", "distance": 420, "type": "小学"}, {"name": "转塘中学", "address": "西湖区转塘", "distance": 490, "type": "初中"}],
        "park": [{"name": "宋城景区", "address": "西湖区转塘", "distance": 500}, {"name": "转塘公园", "address": "西湖区转塘", "distance": 360}]
      },
      "蒋村街道": {
        "subway": [{"name": "蒋村站", "address": "西湖区蒋村", "distance": 200, "line": "5号线"}],
        "bus": [{"name": "蒋村公交站", "address": "西湖区蒋村", "distance": 150}],
        "hospital": [{"name": "浙江医院分院", "address": "西湖区蒋村", "distance": 420, "level": "三级乙等"}],
        "pharmacy": [{"name": "老百姓大药房蒋村店", "address": "西湖区蒋村", "distance": 120}],
        "supermarket": [{"name": "华润万家蒋村店", "address": "西湖区蒋村", "distance": 240}],
        "convenience": [{"name": "十足蒋村店", "address": "西湖区蒋村", "distance": 100}],
        "school": [{"name": "蒋村小学", "address": "西湖区蒋村", "distance": 400, "type": "小学"}],
        "park": [{"name": "蒋村公园", "address": "西湖区蒋村", "distance": 340}]
      },
      "三墩街道": {
        "subway": [{"name": "三墩站", "address": "西湖区三墩", "distance": 200, "line": "2号线"}],
        "bus": [{"name": "三墩公交站", "address": "西湖区三墩", "distance": 150}],
        "hospital": [{"name": "浙江大学医学院附属第二医院城东院区", "address": "西湖区三墩", "distance": 440, "level": "三级甲等"}],
        "pharmacy": [{"name": "海王星辰三墩店", "address": "西湖区三墩", "distance": 125}],
        "supermarket": [{"name": "世纪联华三墩店", "address": "西湖区三墩", "distance": 250}],
        "convenience": [{"name": "7-Eleven三墩店", "address": "西湖区三墩", "distance": 105}],
        "school": [{"name": "三墩小学", "address": "西湖区三墩", "distance": 410, "type": "小学"}, {"name": "三墩中学", "address": "西湖区三墩", "distance": 480, "type": "初中"}],
        "park": [{"name": "三墩公园", "address": "西湖区三墩", "distance": 350}]
      },
      "双浦镇": {
        "subway": [{"name": "双浦站", "address": "西湖区双浦", "distance": 500, "line": "6号线"}],
        "bus": [{"name": "双浦公交站", "address": "西湖区双浦", "distance": 300}],
        "hospital": [{"name": "西湖区双浦社区卫生服务中心", "address": "西湖区双浦", "distance": 400, "level": "一级"}],
        "pharmacy": [{"name": "同仁堂双浦店", "address": "西湖区双浦", "distance": 180}],
        "supermarket": [{"name": "物美超市双浦店", "address": "西湖区双浦", "distance": 350}],
        "convenience": [{"name": "十足双浦店", "address": "西湖区双浦", "distance": 160}],
        "school": [{"name": "双浦小学", "address": "西湖区双浦", "distance": 500, "type": "小学"}],
        "park": [{"name": "双浦公园", "address": "西湖区双浦", "distance": 450}]
      }
    },
    "滨江区": {
      "西兴街道": {
        "subway": [{"name": "西兴站", "address": "滨江区西兴", "distance": 100, "line": "1号线"}],
        "bus": [{"name": "西兴公交站", "address": "滨江区西兴", "distance": 100}],
        "hospital": [{"name": "浙江大学医学院附属第二医院", "address": "滨江区西兴", "distance": 350, "level": "三级甲等"}],
        "pharmacy": [{"name": "海王星辰西兴店", "address": "滨江区西兴", "distance": 100}],
        "supermarket": [{"name": "世纪联华西兴店", "address": "滨江区西兴", "distance": 200}],
        "convenience": [{"name": "十足西兴店", "address": "滨江区西兴", "distance": 80}],
        "school": [{"name": "西兴小学", "address": "滨江区西兴", "distance": 380, "type": "小学"}, {"name": "西兴中学", "address": "滨江区西兴", "distance": 450, "type": "初中"}],
        "park": [{"name": "西兴公园", "address": "滨江区西兴", "distance": 250}]
      },
      "长河街道": {
        "subway": [{"name": "长河站", "address": "滨江区长河", "distance": 200, "line": "5号线"}],
        "bus": [{"name": "长河公交站", "address": "滨江区长河", "distance": 150}],
        "hospital": [{"name": "杭州市滨江区人民医院", "address": "滨江区长河", "distance": 380, "level": "二级甲等"}],
        "pharmacy": [{"name": "老百姓大药房长河店", "address": "滨江区长河", "distance": 115}],
        "supermarket": [{"name": "物美超市长河店", "address": "滨江区长河", "distance": 230}],
        "convenience": [{"name": "7-Eleven长河店", "address": "滨江区长河", "distance": 95}],
        "school": [{"name": "长河小学", "address": "滨江区长河", "distance": 390, "type": "小学"}, {"name": "长河中学", "address": "滨江区长河", "distance": 460, "type": "初中"}],
        "park": [{"name": "长河公园", "address": "滨江区长河", "distance": 320}]
      },
      "浦沿街道": {
        "subway": [{"name": "浦沿站", "address": "滨江区浦沿", "distance": 200, "line": "4号线"}],
        "bus": [{"name": "浦沿公交站", "address": "滨江区浦沿", "distance": 150}],
        "hospital": [{"name": "浙江大学医学院附属第一医院海创园院区", "address": "滨江区浦沿", "distance": 420, "level": "三级甲等"}],
        "pharmacy": [{"name": "海王星辰浦沿店", "address": "滨江区浦沿", "distance": 120}],
        "supermarket": [{"name": "华润万家浦沿店", "address": "滨江区浦沿", "distance": 240}],
        "convenience": [{"name": "十足浦沿店", "address": "滨江区浦沿", "distance": 100}],
        "school": [{"name": "浦沿小学", "address": "滨江区浦沿", "distance": 400, "type": "小学"}],
        "park": [{"name": "浦沿公园", "address": "滨江区浦沿", "distance": 340}]
      }
    },
    "萧山区": {
      "城厢街道": {
        "subway": [{"name": "城厢站", "address": "萧山区城厢", "distance": 100, "line": "5号线"}],
        "bus": [{"name": "城厢公交站", "address": "萧山区城厢", "distance": 100}],
        "hospital": [{"name": "萧山区第一人民医院", "address": "萧山区城厢", "distance": 300, "level": "三级乙等"}],
        "pharmacy": [{"name": "海王星辰城厢店", "address": "萧山区城厢", "distance": 100}],
        "supermarket": [{"name": "世纪联华城厢店", "address": "萧山区城厢", "distance": 200}],
        "convenience": [{"name": "十足城厢店", "address": "萧山区城厢", "distance": 80}],
        "school": [{"name": "城厢小学", "address": "萧山区城厢", "distance": 370, "type": "小学"}, {"name": "城厢中学", "address": "萧山区城厢", "distance": 440, "type": "初中"}],
        "park": [{"name": "城厢公园", "address": "萧山区城厢", "distance": 280}]
      },
      "北干街道": {
        "subway": [{"name": "北干站", "address": "萧山区北干", "distance": 200, "line": "5号线"}],
        "bus": [{"name": "北干公交站", "address": "萧山区北干", "distance": 150}],
        "hospital": [{"name": "浙江萧山医院", "address": "萧山区北干", "distance": 350, "level": "三级乙等"}],
        "pharmacy": [{"name": "老百姓大药房北干店", "address": "萧山区北干", "distance": 110}],
        "supermarket": [{"name": "物美超市北干店", "address": "萧山区北干", "distance": 220}],
        "convenience": [{"name": "7-Eleven北干店", "address": "萧山区北干", "distance": 90}],
        "school": [{"name": "北干小学", "address": "萧山区北干", "distance": 380, "type": "小学"}],
        "park": [{"name": "北干公园", "address": "萧山区北干", "distance": 310}]
      },
      "蜀山街道": {
        "subway": [{"name": "蜀山站", "address": "萧山区蜀山", "distance": 200, "line": "2号线"}],
        "bus": [{"name": "蜀山公交站", "address": "萧山区蜀山", "distance": 150}],
        "hospital": [{"name": "萧山区中医院", "address": "萧山区蜀山", "distance": 380, "level": "二甲"}],
        "pharmacy": [{"name": "海王星辰蜀山店", "address": "萧山区蜀山", "distance": 115}],
        "supermarket": [{"name": "永辉超市蜀山店", "address": "萧山区蜀山", "distance": 230}],
        "convenience": [{"name": "十足蜀山店", "address": "萧山区蜀山", "distance": 95}],
        "school": [{"name": "蜀山小学", "address": "萧山区蜀山", "distance": 390, "type": "小学"}],
        "park": [{"name": "蜀山公园", "address": "萧山区蜀山", "distance": 320}]
      },
      "新塘街道": {
        "subway": [{"name": "新塘站", "address": "萧山区新塘", "distance": 300, "line": "5号线"}],
        "bus": [{"name": "新塘公交站", "address": "萧山区新塘", "distance": 200}],
        "hospital": [{"name": "萧山区第二人民医院", "address": "萧山区新塘", "distance": 400, "level": "二级甲等"}],
        "pharmacy": [{"name": "同仁堂新塘店", "address": "萧山区新塘", "distance": 130}],
        "supermarket": [{"name": "世纪联华新塘店", "address": "萧山区新塘", "distance": 250}],
        "convenience": [{"name": "7-Eleven新塘店", "address": "萧山区新塘", "distance": 110}],
        "school": [{"name": "新塘小学", "address": "萧山区新塘", "distance": 410, "type": "小学"}, {"name": "新塘中学", "address": "萧山区新塘", "distance": 480, "type": "初中"}],
        "park": [{"name": "新塘公园", "address": "萧山区新塘", "distance": 350}]
      },
      "靖江街道": {
        "subway": [{"name": "靖江站", "address": "萧山区靖江", "distance": 300, "line": "7号线"}],
        "bus": [{"name": "靖江公交站", "address": "萧山区靖江", "distance": 200}],
        "hospital": [{"name": "靖江社区卫生服务中心", "address": "萧山区靖江", "distance": 350, "level": "一级"}],
        "pharmacy": [{"name": "海王星辰靖江店", "address": "萧山区靖江", "distance": 125}],
        "supermarket": [{"name": "物美超市靖江店", "address": "萧山区靖江", "distance": 260}],
        "convenience": [{"name": "十足靖江店", "address": "萧山区靖江", "distance": 105}],
        "school": [{"name": "靖江小学", "address": "萧山区靖江", "distance": 420, "type": "小学"}],
        "park": [{"name": "靖江公园", "address": "萧山区靖江", "distance": 360}]
      },
      "南阳街道": {
        "subway": [{"name": "南阳站", "address": "萧山区南阳", "distance": 400, "line": "7号线"}],
        "bus": [{"name": "南阳公交站", "address": "萧山区南阳", "distance": 250}],
        "hospital": [{"name": "南阳社区卫生服务中心", "address": "萧山区南阳", "distance": 380, "level": "一级"}],
        "pharmacy": [{"name": "老百姓大药房南阳店", "address": "萧山区南阳", "distance": 145}],
        "supermarket": [{"name": "华润万家南阳店", "address": "萧山区南阳", "distance": 280}],
        "convenience": [{"name": "7-Eleven南阳店", "address": "萧山区南阳", "distance": 125}],
        "school": [{"name": "南阳小学", "address": "萧山区南阳", "distance": 430, "type": "小学"}],
        "park": [{"name": "南阳公园", "address": "萧山区南阳", "distance": 370}]
      },
      "义蓬街道": {
        "subway": [{"name": "义蓬站", "address": "萧山区义蓬", "distance": 300, "line": "7号线"}],
        "bus": [{"name": "义蓬公交站", "address": "萧山区义蓬", "distance": 200}],
        "hospital": [{"name": "萧山区第四人民医院", "address": "萧山区义蓬", "distance": 420, "level": "二级乙等"}],
        "pharmacy": [{"name": "海王星辰义蓬店", "address": "萧山区义蓬", "distance": 130}],
        "supermarket": [{"name": "世纪联华义蓬店", "address": "萧山区义蓬", "distance": 260}],
        "convenience": [{"name": "十足义蓬店", "address": "萧山区义蓬", "distance": 110}],
        "school": [{"name": "义蓬小学", "address": "萧山区义蓬", "distance": 420, "type": "小学"}, {"name": "义蓬中学", "address": "萧山区义蓬", "distance": 490, "type": "初中"}],
        "park": [{"name": "义蓬公园", "address": "萧山区义蓬", "distance": 360}]
      },
      "河庄街道": {
        "subway": [{"name": "河庄站", "address": "萧山区河庄", "distance": 300, "line": "7号线"}],
        "bus": [{"name": "河庄公交站", "address": "萧山区河庄", "distance": 200}],
        "hospital": [{"name": "河庄社区卫生服务中心", "address": "萧山区河庄", "distance": 360, "level": "一级"}],
        "pharmacy": [{"name": "同仁堂河庄店", "address": "萧山区河庄", "distance": 135}],
        "supermarket": [{"name": "物美超市河庄店", "address": "萧山区河庄", "distance": 270}],
        "convenience": [{"name": "7-Eleven河庄店", "address": "萧山区河庄", "distance": 115}],
        "school": [{"name": "河庄小学", "address": "萧山区河庄", "distance": 430, "type": "小学"}],
        "park": [{"name": "河庄公园", "address": "萧山区河庄", "distance": 370}]
      },
      "新湾街道": {
        "subway": [{"name": "新湾站", "address": "萧山区新湾", "distance": 400, "line": "7号线"}],
        "bus": [{"name": "新湾公交站", "address": "萧山区新湾", "distance": 250}],
        "hospital": [{"name": "新湾社区卫生服务中心", "address": "萧山区新湾", "distance": 380, "level": "一级"}],
        "pharmacy": [{"name": "海王星辰新湾店", "address": "萧山区新湾", "distance": 150}],
        "supermarket": [{"name": "永辉超市新湾店", "address": "萧山区新湾", "distance": 290}],
        "convenience": [{"name": "十足新湾店", "address": "萧山区新湾", "distance": 130}],
        "school": [{"name": "新湾小学", "address": "萧山区新湾", "distance": 440, "type": "小学"}],
        "park": [{"name": "新湾公园", "address": "萧山区新湾", "distance": 380}]
      },
      "临江街道": {
        "subway": [{"name": "临江站", "address": "萧山区临江", "distance": 500, "line": "7号线"}],
        "bus": [{"name": "临江公交站", "address": "萧山区临江", "distance": 300}],
        "hospital": [{"name": "临江社区卫生服务中心", "address": "萧山区临江", "distance": 400, "level": "一级"}],
        "pharmacy": [{"name": "老百姓大药房临江店", "address": "萧山区临江", "distance": 165}],
        "supermarket": [{"name": "世纪联华临江店", "address": "萧山区临江", "distance": 310}],
        "convenience": [{"name": "7-Eleven临江店", "address": "萧山区临江", "distance": 145}],
        "school": [{"name": "临江小学", "address": "萧山区临江", "distance": 450, "type": "小学"}],
        "park": [{"name": "临江公园", "address": "萧山区临江", "distance": 390}]
      },
      "前进街道": {
        "subway": [{"name": "前进站", "address": "萧山区前进", "distance": 500, "line": "7号线"}],
        "bus": [{"name": "前进公交站", "address": "萧山区前进", "distance": 300}],
        "hospital": [{"name": "前进社区卫生服务中心", "address": "萧山区前进", "distance": 420, "level": "一级"}],
        "pharmacy": [{"name": "海王星辰前进店", "address": "萧山区前进", "distance": 170}],
        "supermarket": [{"name": "物美超市前进店", "address": "萧山区前进", "distance": 320}],
        "convenience": [{"name": "十足前进店", "address": "萧山区前进", "distance": 150}],
        "school": [{"name": "前进小学", "address": "萧山区前进", "distance": 460, "type": "小学"}],
        "park": [{"name": "前进公园", "address": "萧山区前进", "distance": 400}]
      }
    },
    "余杭区": {
      "仓前街道": {
        "subway": [{"name": "仓前站", "address": "余杭区仓前", "distance": 200, "line": "5号线"}],
        "bus": [{"name": "仓前公交站", "address": "余杭区仓前", "distance": 150}],
        "hospital": [{"name": "余杭区第二人民医院", "address": "余杭区仓前", "distance": 380, "level": "二级甲等"}],
        "pharmacy": [{"name": "老百姓大药房仓前店", "address": "余杭区仓前", "distance": 115}],
        "supermarket": [{"name": "世纪联华仓前店", "address": "余杭区仓前", "distance": 230}],
        "convenience": [{"name": "7-Eleven仓前店", "address": "余杭区仓前", "distance": 95}],
        "school": [{"name": "仓前小学", "address": "余杭区仓前", "distance": 390, "type": "小学"}, {"name": "仓前中学", "address": "余杭区仓前", "distance": 460, "type": "初中"}],
        "park": [{"name": "仓前公园", "address": "余杭区仓前", "distance": 330}]
      },
      "余杭街道": {
        "subway": [{"name": "余杭站", "address": "余杭区余杭", "distance": 300, "line": "5号线"}],
        "bus": [{"name": "余杭公交站", "address": "余杭区余杭", "distance": 200}],
        "hospital": [{"name": "余杭区第一人民医院", "address": "余杭区余杭", "distance": 400, "level": "三级乙等"}],
        "pharmacy": [{"name": "海王星辰余杭店", "address": "余杭区余杭", "distance": 125}],
        "supermarket": [{"name": "华润万家余杭店", "address": "余杭区余杭", "distance": 250}],
        "convenience": [{"name": "十足余杭店", "address": "余杭区余杭", "distance": 105}],
        "school": [{"name": "余杭小学", "address": "余杭区余杭", "distance": 410, "type": "小学"}],
        "park": [{"name": "余杭公园", "address": "余杭区余杭", "distance": 350}]
      },
      "瓶窑镇": {
        "subway": [{"name": "瓶窑站", "address": "余杭区瓶窑", "distance": 400, "line": "2号线"}],
        "bus": [{"name": "瓶窑公交站", "address": "余杭区瓶窑", "distance": 250}],
        "hospital": [{"name": "余杭区第三人民医院", "address": "余杭区瓶窑", "distance": 420, "level": "二级乙等"}],
        "pharmacy": [{"name": "同仁堂瓶窑店", "address": "余杭区瓶窑", "distance": 145}],
        "supermarket": [{"name": "物美超市瓶窑店", "address": "余杭区瓶窑", "distance": 280}],
        "convenience": [{"name": "7-Eleven瓶窑店", "address": "余杭区瓶窑", "distance": 125}],
        "school": [{"name": "瓶窑小学", "address": "余杭区瓶窑", "distance": 430, "type": "小学"}, {"name": "瓶窑中学", "address": "余杭区瓶窑", "distance": 500, "type": "初中"}],
        "park": [{"name": "瓶窑公园", "address": "余杭区瓶窑", "distance": 370}]
      },
      "径山镇": {
        "subway": [{"name": "径山站", "address": "余杭区径山", "distance": 500, "line": "规划中"}],
        "bus": [{"name": "径山公交站", "address": "余杭区径山", "distance": 300}],
        "hospital": [{"name": "径山镇社区卫生服务中心", "address": "余杭区径山", "distance": 400, "level": "一级"}],
        "pharmacy": [{"name": "海王星辰径山店", "address": "余杭区径山", "distance": 165}],
        "supermarket": [{"name": "永辉超市径山店", "address": "余杭区径山", "distance": 310}],
        "convenience": [{"name": "十足径山店", "address": "余杭区径山", "distance": 145}],
        "school": [{"name": "径山小学", "address": "余杭区径山", "distance": 450, "type": "小学"}],
        "park": [{"name": "径山景区", "address": "余杭区径山", "distance": 500}, {"name": "径山公园", "address": "余杭区径山", "distance": 400}]
      },
      "黄湖镇": {
        "subway": [{"name": "黄湖站", "address": "余杭区黄湖", "distance": 500, "line": "规划中"}],
        "bus": [{"name": "黄湖公交站", "address": "余杭区黄湖", "distance": 300}],
        "hospital": [{"name": "黄湖镇社区卫生服务中心", "address": "余杭区黄湖", "distance": 380, "level": "一级"}],
        "pharmacy": [{"name": "老百姓大药房黄湖店", "address": "余杭区黄湖", "distance": 160}],
        "supermarket": [{"name": "世纪联华黄湖店", "address": "余杭区黄湖", "distance": 300}],
        "convenience": [{"name": "7-Eleven黄湖店", "address": "余杭区黄湖", "distance": 140}],
        "school": [{"name": "黄湖小学", "address": "余杭区黄湖", "distance": 440, "type": "小学"}],
        "park": [{"name": "黄湖公园", "address": "余杭区黄湖", "distance": 380}]
      },
      "鸬鸟镇": {
        "subway": [{"name": "鸬鸟站", "address": "余杭区鸬鸟", "distance": 600, "line": "规划中"}],
        "bus": [{"name": "鸬鸟公交站", "address": "余杭区鸬鸟", "distance": 350}],
        "hospital": [{"name": "鸬鸟镇社区卫生服务中心", "address": "余杭区鸬鸟", "distance": 400, "level": "一级"}],
        "pharmacy": [{"name": "海王星辰鸬鸟店", "address": "余杭区鸬鸟", "distance": 175}],
        "supermarket": [{"name": "物美超市鸬鸟店", "address": "余杭区鸬鸟", "distance": 320}],
        "convenience": [{"name": "十足鸬鸟店", "address": "余杭区鸬鸟", "distance": 155}],
        "school": [{"name": "鸬鸟小学", "address": "余杭区鸬鸟", "distance": 460, "type": "小学"}],
        "park": [{"name": "鸬鸟公园", "address": "余杭区鸬鸟", "distance": 400}]
      },
      "百丈镇": {
        "subway": [{"name": "百丈站", "address": "余杭区百丈", "distance": 600, "line": "规划中"}],
        "bus": [{"name": "百丈公交站", "address": "余杭区百丈", "distance": 350}],
        "hospital": [{"name": "百丈镇社区卫生服务中心", "address": "余杭区百丈", "distance": 380, "level": "一级"}],
        "pharmacy": [{"name": "同仁堂百丈店", "address": "余杭区百丈", "distance": 170}],
        "supermarket": [{"name": "华润万家百丈店", "address": "余杭区百丈", "distance": 310}],
        "convenience": [{"name": "7-Eleven百丈店", "address": "余杭区百丈", "distance": 150}],
        "school": [{"name": "百丈小学", "address": "余杭区百丈", "distance": 450, "type": "小学"}],
        "park": [{"name": "百丈公园", "address": "余杭区百丈", "distance": 390}]
      }
    },
    "临平区": {
      "临平街道": {
        "subway": [{"name": "临平站", "address": "临平区临平", "distance": 100, "line": "1号线"}],
        "bus": [{"name": "临平公交站", "address": "临平区临平", "distance": 100}],
        "hospital": [{"name": "余杭区第五人民医院", "address": "临平区临平", "distance": 320, "level": "二级甲等"}],
        "pharmacy": [{"name": "海王星辰临平店", "address": "临平区临平", "distance": 100}],
        "supermarket": [{"name": "世纪联华临平店", "address": "临平区临平", "distance": 200}],
        "convenience": [{"name": "十足临平店", "address": "临平区临平", "distance": 80}],
        "school": [{"name": "临平第一小学", "address": "临平区临平", "distance": 370, "type": "小学"}, {"name": "临平第一中学", "address": "临平区临平", "distance": 440, "type": "初中"}],
        "park": [{"name": "临平公园", "address": "临平区临平", "distance": 280}, {"name": "临平世纪公园", "address": "临平区临平", "distance": 400}]
      },
      "南苑街道": {
        "subway": [{"name": "南苑站", "address": "临平区南苑", "distance": 200, "line": "1号线"}],
        "bus": [{"name": "南苑公交站", "address": "临平区南苑", "distance": 150}],
        "hospital": [{"name": "余杭区妇幼保健院", "address": "临平区南苑", "distance": 360, "level": "三级乙等"}],
        "pharmacy": [{"name": "老百姓大药房南苑店", "address": "临平区南苑", "distance": 110}],
        "supermarket": [{"name": "物美超市南苑店", "address": "临平区南苑", "distance": 220}],
        "convenience": [{"name": "7-Eleven南苑店", "address": "临平区南苑", "distance": 90}],
        "school": [{"name": "南苑小学", "address": "临平区南苑", "distance": 380, "type": "小学"}],
        "park": [{"name": "南苑公园", "address": "临平区南苑", "distance": 310}]
      },
      "东湖街道": {
        "subway": [{"name": "东湖站", "address": "临平区东湖", "distance": 200, "line": "9号线"}],
        "bus": [{"name": "东湖公交站", "address": "临平区东湖", "distance": 150}],
        "hospital": [{"name": "余杭区中医院", "address": "临平区东湖", "distance": 380, "level": "二甲"}],
        "pharmacy": [{"name": "海王星辰东湖店", "address": "临平区东湖", "distance": 115}],
        "supermarket": [{"name": "永辉超市东湖店", "address": "临平区东湖", "distance": 230}],
        "convenience": [{"name": "十足东湖店", "address": "临平区东湖", "distance": 95}],
        "school": [{"name": "东湖小学", "address": "临平区东湖", "distance": 390, "type": "小学"}],
        "park": [{"name": "东湖公园", "address": "临平区东湖", "distance": 320}]
      },
      "星桥街道": {
        "subway": [{"name": "星桥站", "address": "临平区星桥", "distance": 200, "line": "3号线"}],
        "bus": [{"name": "星桥公交站", "address": "临平区星桥", "distance": 150}],
        "hospital": [{"name": "星桥街道社区卫生服务中心", "address": "临平区星桥", "distance": 340, "level": "一级"}],
        "pharmacy": [{"name": "同仁堂星桥店", "address": "临平区星桥", "distance": 120}],
        "supermarket": [{"name": "世纪联华星桥店", "address": "临平区星桥", "distance": 240}],
        "convenience": [{"name": "7-Eleven星桥店", "address": "临平区星桥", "distance": 100}],
        "school": [{"name": "星桥小学", "address": "临平区星桥", "distance": 400, "type": "小学"}],
        "park": [{"name": "星桥公园", "address": "临平区星桥", "distance": 330}]
      },
      "乔司街道": {
        "subway": [{"name": "乔司站", "address": "临平区乔司", "distance": 300, "line": "1号线"}],
        "bus": [{"name": "乔司公交站", "address": "临平区乔司", "distance": 200}],
        "hospital": [{"name": "乔司街道社区卫生服务中心", "address": "临平区乔司", "distance": 360, "level": "一级"}],
        "pharmacy": [{"name": "海王星辰乔司店", "address": "临平区乔司", "distance": 130}],
        "supermarket": [{"name": "物美超市乔司店", "address": "临平区乔司", "distance": 250}],
        "convenience": [{"name": "十足乔司店", "address": "临平区乔司", "distance": 110}],
        "school": [{"name": "乔司小学", "address": "临平区乔司", "distance": 410, "type": "小学"}, {"name": "乔司中学", "address": "临平区乔司", "distance": 480, "type": "初中"}],
        "park": [{"name": "乔司公园", "address": "临平区乔司", "distance": 350}]
      },
      "运河街道": {
        "subway": [{"name": "运河站", "address": "临平区运河", "distance": 300, "line": "9号线"}],
        "bus": [{"name": "运河公交站", "address": "临平区运河", "distance": 200}],
        "hospital": [{"name": "运河街道社区卫生服务中心", "address": "临平区运河", "distance": 350, "level": "一级"}],
        "pharmacy": [{"name": "老百姓大药房运河店", "address": "临平区运河", "distance": 125}],
        "supermarket": [{"name": "华润万家运河店", "address": "临平区运河", "distance": 260}],
        "convenience": [{"name": "7-Eleven运河店", "address": "临平区运河", "distance": 105}],
        "school": [{"name": "运河小学", "address": "临平区运河", "distance": 420, "type": "小学"}],
        "park": [{"name": "运河公园", "address": "临平区运河", "distance": 360}]
      },
      "塘栖镇": {
        "subway": [{"name": "塘栖站", "address": "临平区塘栖", "distance": 400, "line": "9号线"}],
        "bus": [{"name": "塘栖公交站", "address": "临平区塘栖", "distance": 250}],
        "hospital": [{"name": "余杭区中医院塘栖分院", "address": "临平区塘栖", "distance": 400, "level": "二甲"}],
        "pharmacy": [{"name": "海王星辰塘栖店", "address": "临平区塘栖", "distance": 145}],
        "supermarket": [{"name": "世纪联华塘栖店", "address": "临平区塘栖", "distance": 280}],
        "convenience": [{"name": "十足塘栖店", "address": "临平区塘栖", "distance": 125}],
        "school": [{"name": "塘栖小学", "address": "临平区塘栖", "distance": 430, "type": "小学"}, {"name": "塘栖中学", "address": "临平区塘栖", "distance": 500, "type": "初中"}],
        "park": [{"name": "塘栖古镇景区", "address": "临平区塘栖", "distance": 400}, {"name": "塘栖公园", "address": "临平区塘栖", "distance": 370}]
      }
    },
    "钱塘区": {
      "下沙街道": {
        "subway": [{"name": "下沙站", "address": "钱塘区下沙", "distance": 100, "line": "1号线"}],
        "bus": [{"name": "下沙公交站", "address": "钱塘区下沙", "distance": 100}],
        "hospital": [{"name": "浙江省中医院下沙院区", "address": "钱塘区下沙", "distance": 350, "level": "三级甲等"}],
        "pharmacy": [{"name": "海王星辰下沙店", "address": "钱塘区下沙", "distance": 100}],
        "supermarket": [{"name": "物美超市下沙店", "address": "钱塘区下沙", "distance": 200}],
        "convenience": [{"name": "7-Eleven下沙店", "address": "钱塘区下沙", "distance": 80}],
        "school": [{"name": "下沙第一小学", "address": "钱塘区下沙", "distance": 380, "type": "小学"}, {"name": "下沙中学", "address": "钱塘区下沙", "distance": 450, "type": "初中"}],
        "park": [{"name": "下沙公园", "address": "钱塘区下沙", "distance": 280}]
      },
      "白杨街道": {
        "subway": [{"name": "白杨站", "address": "钱塘区白杨", "distance": 200, "line": "1号线"}],
        "bus": [{"name": "白杨公交站", "address": "钱塘区白杨", "distance": 150}],
        "hospital": [{"name": "杭州东方医院", "address": "钱塘区白杨", "distance": 380, "level": "二级乙等"}],
        "pharmacy": [{"name": "老百姓大药房白杨店", "address": "钱塘区白杨", "distance": 115}],
        "supermarket": [{"name": "华润万家白杨店", "address": "钱塘区白杨", "distance": 230}],
        "convenience": [{"name": "十足白杨店", "address": "钱塘区白杨", "distance": 95}],
        "school": [{"name": "白杨小学", "address": "钱塘区白杨", "distance": 390, "type": "小学"}],
        "park": [{"name": "白杨公园", "address": "钱塘区白杨", "distance": 320}]
      },
      "义蓬街道": {
        "subway": [{"name": "义蓬站", "address": "钱塘区义蓬", "distance": 300, "line": "7号线"}],
        "bus": [{"name": "义蓬公交站", "address": "钱塘区义蓬", "distance": 200}],
        "hospital": [{"name": "钱塘区义蓬街道社区卫生服务中心", "address": "钱塘区义蓬", "distance": 370, "level": "一级"}],
        "pharmacy": [{"name": "海王星辰义蓬店", "address": "钱塘区义蓬", "distance": 130}],
        "supermarket": [{"name": "世纪联华义蓬店", "address": "钱塘区义蓬", "distance": 260}],
        "convenience": [{"name": "7-Eleven义蓬店", "address": "钱塘区义蓬", "distance": 110}],
        "school": [{"name": "义蓬小学", "address": "钱塘区义蓬", "distance": 410, "type": "小学"}],
        "park": [{"name": "义蓬公园", "address": "钱塘区义蓬", "distance": 350}]
      },
      "河庄街道": {
        "subway": [{"name": "河庄站", "address": "钱塘区河庄", "distance": 300, "line": "7号线"}],
        "bus": [{"name": "河庄公交站", "address": "钱塘区河庄", "distance": 200}],
        "hospital": [{"name": "钱塘区河庄街道社区卫生服务中心", "address": "钱塘区河庄", "distance": 360, "level": "一级"}],
        "pharmacy": [{"name": "同仁堂河庄店", "address": "钱塘区河庄", "distance": 125}],
        "supermarket": [{"name": "物美超市河庄店", "address": "钱塘区河庄", "distance": 250}],
        "convenience": [{"name": "十足河庄店", "address": "钱塘区河庄", "distance": 105}],
        "school": [{"name": "河庄小学", "address": "钱塘区河庄", "distance": 400, "type": "小学"}],
        "park": [{"name": "河庄公园", "address": "钱塘区河庄", "distance": 340}]
      }
    },
    "富阳区": {
      "富春街道": {
        "subway": [{"name": "富春站", "address": "富阳区富春", "distance": 100, "line": "6号线"}],
        "bus": [{"name": "富春公交站", "address": "富阳区富春", "distance": 100}],
        "hospital": [{"name": "富阳区第一人民医院", "address": "富阳区富春", "distance": 300, "level": "三级乙等"}],
        "pharmacy": [{"name": "海王星辰富春店", "address": "富阳区富春", "distance": 100}],
        "supermarket": [{"name": "世纪联华富春店", "address": "富阳区富春", "distance": 200}],
        "convenience": [{"name": "十足富春店", "address": "富阳区富春", "distance": 80}],
        "school": [{"name": "富春第一小学", "address": "富阳区富春", "distance": 370, "type": "小学"}, {"name": "富春中学", "address": "富阳区富春", "distance": 440, "type": "初中"}],
        "park": [{"name": "富春公园", "address": "富阳区富春", "distance": 280}, {"name": "富春江畔公园", "address": "富阳区富春", "distance": 350}]
      },
      "春江街道": {
        "subway": [{"name": "春江站", "address": "富阳区春江", "distance": 200, "line": "6号线"}],
        "bus": [{"name": "春江公交站", "address": "富阳区春江", "distance": 150}],
        "hospital": [{"name": "富阳区中医院", "address": "富阳区春江", "distance": 350, "level": "二甲"}],
        "pharmacy": [{"name": "老百姓大药房春江店", "address": "富阳区春江", "distance": 110}],
        "supermarket": [{"name": "物美超市春江店", "address": "富阳区春江", "distance": 220}],
        "convenience": [{"name": "7-Eleven春江店", "address": "富阳区春江", "distance": 90}],
        "school": [{"name": "春江小学", "address": "富阳区春江", "distance": 380, "type": "小学"}],
        "park": [{"name": "春江公园", "address": "富阳区春江", "distance": 310}]
      },
      "鹿山街道": {
        "subway": [{"name": "鹿山站", "address": "富阳区鹿山", "distance": 200, "line": "6号线"}],
        "bus": [{"name": "鹿山公交站", "address": "富阳区鹿山", "distance": 150}],
        "hospital": [{"name": "富阳区第二人民医院", "address": "富阳区鹿山", "distance": 380, "level": "二级乙等"}],
        "pharmacy": [{"name": "海王星辰鹿山店", "address": "富阳区鹿山", "distance": 115}],
        "supermarket": [{"name": "华润万家鹿山店", "address": "富阳区鹿山", "distance": 230}],
        "convenience": [{"name": "十足鹿山店", "address": "富阳区鹿山", "distance": 95}],
        "school": [{"name": "鹿山小学", "address": "富阳区鹿山", "distance": 390, "type": "小学"}],
        "park": [{"name": "鹿山公园", "address": "富阳区鹿山", "distance": 320}]
      },
      "银湖街道": {
        "subway": [{"name": "银湖站", "address": "富阳区银湖", "distance": 300, "line": "6号线"}],
        "bus": [{"name": "银湖公交站", "address": "富阳区银湖", "distance": 200}],
        "hospital": [{"name": "富阳区第三人民医院", "address": "富阳区银湖", "distance": 400, "level": "二级乙等"}],
        "pharmacy": [{"name": "同仁堂银湖店", "address": "富阳区银湖", "distance": 130}],
        "supermarket": [{"name": "世纪联华银湖店", "address": "富阳区银湖", "distance": 250}],
        "convenience": [{"name": "7-Eleven银湖店", "address": "富阳区银湖", "distance": 110}],
        "school": [{"name": "银湖小学", "address": "富阳区银湖", "distance": 410, "type": "小学"}],
        "park": [{"name": "银湖公园", "address": "富阳区银湖", "distance": 350}]
      },
      "新登镇": {
        "subway": [{"name": "新登站", "address": "富阳区新登", "distance": 500, "line": "规划中"}],
        "bus": [{"name": "新登公交站", "address": "富阳区新登", "distance": 300}],
        "hospital": [{"name": "新登镇社区卫生服务中心", "address": "富阳区新登", "distance": 380, "level": "一级"}],
        "pharmacy": [{"name": "海王星辰新登店", "address": "富阳区新登", "distance": 165}],
        "supermarket": [{"name": "物美超市新登店", "address": "富阳区新登", "distance": 310}],
        "convenience": [{"name": "十足新登店", "address": "富阳区新登", "distance": 145}],
        "school": [{"name": "新登小学", "address": "富阳区新登", "distance": 450, "type": "小学"}, {"name": "新登中学", "address": "富阳区新登", "distance": 520, "type": "初中"}],
        "park": [{"name": "新登公园", "address": "富阳区新登", "distance": 400}]
      }
    },
    "临安区": {
      "锦城街道": {
        "subway": [{"name": "锦城站", "address": "临安区锦城", "distance": 300, "line": "16号线"}],
        "bus": [{"name": "锦城公交站", "address": "临安区锦城", "distance": 200}],
        "hospital": [{"name": "临安区人民医院", "address": "临安区锦城", "distance": 350, "level": "三级乙等"}],
        "pharmacy": [{"name": "海王星辰锦城店", "address": "临安区锦城", "distance": 120}],
        "supermarket": [{"name": "世纪联华锦城店", "address": "临安区锦城", "distance": 240}],
        "convenience": [{"name": "十足锦城店", "address": "临安区锦城", "distance": 100}],
        "school": [{"name": "锦城第一小学", "address": "临安区锦城", "distance": 390, "type": "小学"}, {"name": "锦城中学", "address": "临安区锦城", "distance": 460, "type": "初中"}],
        "park": [{"name": "锦城公园", "address": "临安区锦城", "distance": 330}]
      },
      "锦北街道": {
        "subway": [{"name": "锦北站", "address": "临安区锦北", "distance": 300, "line": "16号线"}],
        "bus": [{"name": "锦北公交站", "address": "临安区锦北", "distance": 200}],
        "hospital": [{"name": "临安区中医院", "address": "临安区锦北", "distance": 380, "level": "二甲"}],
        "pharmacy": [{"name": "老百姓大药房锦北店", "address": "临安区锦北", "distance": 125}],
        "supermarket": [{"name": "物美超市锦北店", "address": "临安区锦北", "distance": 250}],
        "convenience": [{"name": "7-Eleven锦北店", "address": "临安区锦北", "distance": 105}],
        "school": [{"name": "锦北小学", "address": "临安区锦北", "distance": 400, "type": "小学"}],
        "park": [{"name": "锦北公园", "address": "临安区锦北", "distance": 340}]
      },
      "玲珑街道": {
        "subway": [{"name": "玲珑站", "address": "临安区玲珑", "distance": 400, "line": "16号线"}],
        "bus": [{"name": "玲珑公交站", "address": "临安区玲珑", "distance": 250}],
        "hospital": [{"name": "玲珑街道社区卫生服务中心", "address": "临安区玲珑", "distance": 360, "level": "一级"}],
        "pharmacy": [{"name": "海王星辰玲珑店", "address": "临安区玲珑", "distance": 140}],
        "supermarket": [{"name": "华润万家玲珑店", "address": "临安区玲珑", "distance": 270}],
        "convenience": [{"name": "十足玲珑店", "address": "临安区玲珑", "distance": 120}],
        "school": [{"name": "玲珑小学", "address": "临安区玲珑", "distance": 420, "type": "小学"}],
        "park": [{"name": "玲珑公园", "address": "临安区玲珑", "distance": 360}]
      },
      "青山湖街道": {
        "subway": [{"name": "青山湖站", "address": "临安区青山湖", "distance": 200, "line": "16号线"}],
        "bus": [{"name": "青山湖公交站", "address": "临安区青山湖", "distance": 150}],
        "hospital": [{"name": "临安区第四人民医院", "address": "临安区青山湖", "distance": 400, "level": "二级乙等"}],
        "pharmacy": [{"name": "同仁堂青山湖店", "address": "临安区青山湖", "distance": 130}],
        "supermarket": [{"name": "世纪联华青山湖店", "address": "临安区青山湖", "distance": 260}],
        "convenience": [{"name": "7-Eleven青山湖店", "address": "临安区青山湖", "distance": 110}],
        "school": [{"name": "青山湖小学", "address": "临安区青山湖", "distance": 410, "type": "小学"}],
        "park": [{"name": "青山湖国家森林公园", "address": "临安区青山湖", "distance": 500}, {"name": "青山湖公园", "address": "临安区青山湖", "distance": 350}]
      }
    }
  },
'@

Write-Host "杭州数据已准备完成"
Write-Host "数据长度: $($hangzhouData.Length)"
