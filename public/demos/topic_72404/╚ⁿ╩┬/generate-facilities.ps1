$ErrorActionPreference = "Stop"

$cities = @{
    "上海" = @{
        level = "一线城市"
        districts = @{
            "黄浦区" = @("南京东路街道", "外滩街道", "半淞园路街道", "小东门街道", "豫园街道", "老西门街道", "淮海中路街道", "瑞金二路街道", "打浦桥街道", "五里桥街道")
            "徐汇区" = @("湖南路街道", "天平路街道", "枫林路街道", "斜土路街道", "田林街道", "长桥街道", "漕河泾街道", "康健新村街道", "虹梅路街道", "龙华街道", "华泾镇")
            "长宁区" = @("华阳路街道", "新华路街道", "江苏路街道", "天山路街道", "周家桥街道", "虹桥街道", "仙霞新村街道", "程家桥街道", "北新泾街道", "新泾镇")
            "静安区" = @("江宁路街道", "石门二路街道", "南京西路街道", "静安寺街道", "曹家渡街道", "天目西路街道", "北站街道", "宝山路街道", "共和新路街道", "大宁路街道", "彭浦新村街道", "临汾路街道", "芷江西路街道", "彭浦镇")
            "普陀区" = @("曹杨新村街道", "长风新村街道", "长寿路街道", "甘泉路街道", "石泉路街道", "宜川路街道", "万里街道", "真如镇街道", "长征镇", "桃浦镇")
            "虹口区" = @("四川北路街道", "提篮桥街道", "广中路街道", "江湾镇街道", "欧阳路街道", "曲阳路街道", "凉城新村街道", "嘉兴路街道")
            "杨浦区" = @("定海路街道", "平凉路街道", "江浦路街道", "四平路街道", "控江路街道", "长白新村街道", "延吉新村街道", "殷行街道", "大桥街道", "五角场街道", "新江湾城街道")
            "闵行区" = @("江川路街道", "古美路街道", "新虹街道", "浦锦街道", "莘庄镇", "七宝镇", "颛桥镇", "华漕镇", "虹桥镇", "梅陇镇", "吴泾镇", "马桥镇", "浦江镇")
            "宝山区" = @("友谊路街道", "吴淞街道", "张庙街道", "罗店镇", "大场镇", "杨行镇", "月浦镇", "罗泾镇", "顾村镇", "高境镇", "庙行镇", "淞南镇")
            "嘉定区" = @("新成路街道", "真新街道", "嘉定镇街道", "菊园新区", "南翔镇", "安亭镇", "马陆镇", "徐行镇", "华亭镇", "外冈镇", "江桥镇")
            "浦东新区" = @("潍坊新村街道", "陆家嘴街道", "周家渡街道", "塘桥街道", "上钢新村街道", "南码头路街道", "沪东新村街道", "金杨新村街道", "洋泾街道", "浦兴路街道", "东明路街道", "花木街道", "川沙新镇", "高桥镇", "北蔡镇", "合庆镇", "唐镇", "曹路镇", "金桥镇", "高行镇", "高东镇", "张江镇", "三林镇", "惠南镇", "周浦镇", "新场镇", "大团镇", "康桥镇", "航头镇", "祝桥镇", "宣桥镇", "书院镇", "万祥镇", "老港镇", "南汇新城镇")
            "金山区" = @("石化街道", "朱泾镇", "枫泾镇", "张堰镇", "亭林镇", "吕巷镇", "廊下镇", "金山卫镇", "漕泾镇", "山阳镇")
            "松江区" = @("岳阳街道", "永丰街道", "方松街道", "中山街道", "泗泾镇", "佘山镇", "车墩镇", "新桥镇", "洞泾镇", "九亭镇", "泖港镇", "石湖荡镇", "新浜镇", "叶榭镇", "小昆山镇")
            "青浦区" = @("夏阳街道", "盈浦街道", "香花桥街道", "朱家角镇", "练塘镇", "金泽镇", "赵巷镇", "徐泾镇", "华新镇", "重固镇", "白鹤镇")
            "奉贤区" = @("西渡街道", "奉浦街道", "南桥镇", "奉城镇", "庄行镇", "金汇镇", "四团镇", "青村镇", "柘林镇", "海湾镇")
            "崇明区" = @("城桥镇", "堡镇", "新河镇", "庙镇", "竖新镇", "向化镇", "三星镇", "港沿镇", "中兴镇", "陈家镇", "绿华镇", "港西镇", "建设镇", "新海镇", "东平镇", "长兴镇")
        }
    }
    "广州" = @{
        level = "一线城市"
        districts = @{
            "越秀区" = @("洪桥街道", "北京街道", "六榕街道", "流花街道", "光塔街道", "人民街道", "东湖街道", "农林街道", "黄花岗街道", "大东街道", "大塘街道", "珠光街道", "白云街道", "建设街道", "华乐街道", "登峰街道", "矿泉街道")
            "荔湾区" = @("沙面街道", "岭南街道", "华林街道", "多宝街道", "昌华街道", "逢源街道", "龙津街道", "金花街道", "石围塘街道", "花地街道", "茶滘街道", "冲口街道", "白鹤洞街道", "东沙街道", "中南街道", "海龙街道", "彩虹街道", "南源街道", "西村街道", "站前街道", "桥中街道")
            "海珠区" = @("海幢街道", "赤岗街道", "新港街道", "滨江街道", "素社街道", "凤阳街道", "龙凤街道", "沙园街道", "昌岗街道", "江南中街道", "南石头街道", "南华西街道", "琶洲街道", "南洲街道", "华洲街道", "官洲街道", "江海街道", "瑞宝街道")
            "天河区" = @("五山街道", "员村街道", "车陂街道", "沙河街道", "石牌街道", "天河南街道", "林和街道", "沙东街道", "兴华街道", "棠下街道", "天园街道", "猎德街道", "冼村街道", "元岗街道", "黄村街道", "龙洞街道", "长兴街道", "凤凰街道", "前进街道", "珠吉街道")
            "白云区" = @("三元里街道", "松洲街道", "景泰街道", "同德街道", "黄石街道", "棠景街道", "新市街道", "同和街道", "京溪街道", "永平街道", "嘉禾街道", "均禾街道", "石井街道", "金沙街道", "鹤龙街道", "云城街道", "白云湖街道", "石门街道", "人和镇", "太和镇", "钟落潭镇", "江高镇")
            "黄埔区" = @("黄埔街道", "红山街道", "鱼珠街道", "大沙街道", "文冲街道", "穗东街道", "南岗街道", "荔联街道", "长洲街道", "夏港街道", "萝岗街道", "联和街道", "永和街道", "九龙镇", "新龙镇", "龙湖街道")
            "番禺区" = @("市桥街道", "沙头街道", "东环街道", "桥南街道", "小谷围街道", "大石街道", "洛浦街道", "石壁街道", "沙湾街道", "钟村街道", "大龙街道", "南村镇", "新造镇", "化龙镇", "石楼镇", "石碁镇", "东涌镇", "大岗镇", "榄核镇")
            "花都区" = @("新华街道", "花城街道", "秀全街道", "新雅街道", "梯面镇", "花山镇", "花东镇", "炭步镇", "赤坭镇", "狮岭镇")
            "南沙区" = @("南沙街道", "珠江街道", "龙穴街道", "横沥镇", "万顷沙镇", "黄阁镇", "东涌镇", "大岗镇", "榄核镇")
            "从化区" = @("街口街道", "城郊街道", "江埔街道", "温泉镇", "良口镇", "吕田镇", "太平镇", "鳌头镇")
            "增城区" = @("荔城街道", "增江街道", "朱村街道", "永宁街道", "新塘镇", "石滩镇", "中新镇", "正果镇", "派潭镇", "小楼镇", "仙村镇")
        }
    }
    "深圳" = @{
        level = "一线城市"
        districts = @{
            "福田区" = @("园岭街道", "南园街道", "福田街道", "沙头街道", "梅林街道", "华富街道", "香蜜湖街道", "莲花街道", "华强北街道", "福保街道")
            "罗湖区" = @("桂园街道", "黄贝街道", "东门街道", "翠竹街道", "南湖街道", "笋岗街道", "东湖街道", "莲塘街道", "东晓街道", "清水河街道")
            "南山区" = @("南头街道", "南山街道", "沙河街道", "蛇口街道", "招商街道", "粤海街道", "桃源街道", "西丽街道")
            "宝安区" = @("新安街道", "西乡街道", "福永街道", "沙井街道", "松岗街道", "石岩街道", "航城街道", "福海街道", "新桥街道", "燕罗街道")
            "龙岗区" = @("龙岗街道", "龙城街道", "坪山街道", "坑梓街道", "横岗街道", "布吉街道", "坂田街道", "南湾街道", "平湖街道", "坪地街道", "吉华街道", "园山街道", "宝龙街道")
            "盐田区" = @("沙头角街道", "海山街道", "盐田街道", "梅沙街道")
            "龙华区" = @("龙华街道", "民治街道", "大浪街道", "观澜街道", "福城街道", "观湖街道")
            "坪山区" = @("坪山街道", "马峦街道", "碧岭街道", "石井街道", "坑梓街道", "龙田街道")
            "光明区" = @("光明街道", "公明街道", "新湖街道", "玉塘街道", "马田街道", "凤凰街道")
            "大鹏新区" = @("大鹏街道", "南澳街道", "葵涌街道")
        }
    }
}

$subwayLines = @{
    "上海" = @("1号线", "2号线", "3号线", "4号线", "5号线", "6号线", "7号线", "8号线", "9号线", "10号线", "11号线", "12号线", "13号线", "14号线", "15号线", "16号线", "17号线", "18号线")
    "广州" = @("1号线", "2号线", "3号线", "4号线", "5号线", "6号线", "7号线", "8号线", "9号线", "13号线", "14号线", "21号线", "APM线", "广佛线")
    "深圳" = @("1号线", "2号线", "3号线", "4号线", "5号线", "6号线", "7号线", "8号线", "9号线", "10号线", "11号线", "12号线", "13号线", "14号线", "16号线", "20号线")
    "成都" = @("1号线", "2号线", "3号线", "4号线", "5号线", "6号线", "7号线", "8号线", "9号线", "10号线", "17号线", "18号线")
    "杭州" = @("1号线", "2号线", "3号线", "4号线", "5号线", "6号线", "7号线", "8号线", "9号线", "10号线", "16号线", "19号线")
    "武汉" = @("1号线", "2号线", "3号线", "4号线", "5号线", "6号线", "7号线", "8号线", "11号线", "16号线", "19号线")
    "南京" = @("1号线", "2号线", "3号线", "4号线", "5号线", "7号线", "10号线", "S1号线", "S3号线", "S6号线", "S7号线", "S8号线", "S9号线")
    "西安" = @("1号线", "2号线", "3号线", "4号线", "5号线", "6号线", "9号线", "14号线", "16号线")
    "重庆" = @("1号线", "2号线", "3号线", "4号线", "5号线", "6号线", "9号线", "10号线", "环线", "国博线")
    "天津" = @("1号线", "2号线", "3号线", "4号线", "5号线", "6号线", "7号线", "8号线", "9号线", "10号线", "11号线", "津滨轻轨")
    "苏州" = @("1号线", "2号线", "3号线", "4号线", "5号线", "6号线", "7号线", "8号线", "11号线")
    "郑州" = @("1号线", "2号线", "3号线", "4号线", "5号线", "6号线", "10号线", "14号线", "城郊线")
    "长沙" = @("1号线", "2号线", "3号线", "4号线", "5号线", "6号线")
    "东莞" = @("1号线", "2号线", "3号线")
    "青岛" = @("1号线", "2号线", "3号线", "4号线", "8号线", "11号线", "13号线")
    "沈阳" = @("1号线", "2号线", "3号线", "4号线", "9号线", "10号线")
    "大连" = @("1号线", "2号线", "3号线", "5号线", "12号线", "13号线")
    "佛山" = @("1号线", "2号线", "3号线", "广佛线")
    "宁波" = @("1号线", "2号线", "3号线", "4号线", "5号线")
    "无锡" = @("1号线", "2号线", "3号线", "4号线")
    "合肥" = @("1号线", "2号线", "3号线", "4号线", "5号线")
}

$random = New-Object System.Random

function Get-RandomLine {
    param($city)
    $lines = $subwayLines[$city]
    if (-not $lines) { $lines = @("1号线", "2号线") }
    return $lines[$random.Next($lines.Length)]
}

function Get-RandomDistance {
    param($min, $max)
    return $random.Next($min, $max)
}

function Generate-StreetData {
    param($city, $district, $street)
    
    $subwayLine = Get-RandomLine $city
    $subwayDist = Get-RandomDistance 50 500
    $busDist = Get-RandomDistance 100 400
    $hospitalDist = Get-RandomDistance 200 700
    $pharmacyDist = Get-RandomDistance 100 400
    $supermarketDist = Get-RandomDistance 150 550
    $convenienceDist = Get-RandomDistance 50 250
    $schoolDist = Get-RandomDistance 300 900
    $parkDist = Get-RandomDistance 200 700
    
    $result = @{
        subway = @(
            @{
                name = "$street`站"
                address = "$district$street"
                distance = $subwayDist
                line = $subwayLine
            }
        )
        bus = @(
            @{
                name = "$street`公交站"
                address = "$district$street"
                distance = $busDist
            }
        )
        hospital = @(
            @{
                name = "$district`人民医院"
                address = "$district$street"
                distance = $hospitalDist
                level = "三级甲等"
            },
            @{
                name = "$district`中医院"
                address = "$district$street"
                distance = $hospitalDist + 100
                level = "二甲"
            }
        )
        pharmacy = @(
            @{
                name = "海王星辰$street`店"
                address = "$district$street"
                distance = $pharmacyDist
            },
            @{
                name = "老百姓大药房$street`店"
                address = "$district$street"
                distance = $pharmacyDist + 100
            }
        )
        supermarket = @(
            @{
                name = "世纪联华$street`店"
                address = "$district$street"
                distance = $supermarketDist
            },
            @{
                name = "永辉超市$street`店"
                address = "$district$street"
                distance = $supermarketDist + 100
            }
        )
        convenience = @(
            @{
                name = "全家$street`店"
                address = "$district$street"
                distance = $convenienceDist
            },
            @{
                name = "7-Eleven$street`店"
                address = "$district$street"
                distance = $convenienceDist + 50
            }
        )
        school = @(
            @{
                name = "$district`第一小学"
                address = "$district$street"
                distance = $schoolDist
                type = "小学"
            },
            @{
                name = "$district`第一中学"
                address = "$district$street"
                distance = $schoolDist + 100
                type = "初中"
            }
        )
        park = @(
            @{
                name = "$street`公园"
                address = "$district$street"
                distance = $parkDist
            },
            @{
                name = "$district`体育公园"
                address = "$district$street"
                distance = $parkDist + 200
            }
        )
    }
    
    return $result
}

function ConvertTo-JsonCustom {
    param($obj, $indent = 0)
    
    if ($obj -is [Hashtable]) {
        $result = "{"
        $first = $true
        foreach ($key in $obj.Keys) {
            if (-not $first) { $result += "," }
            $first = $false
            $result += "`"" + $key + "`":"
            $result += ConvertTo-JsonCustom $obj[$key] ($indent + 1)
        }
        $result += "}"
        return $result
    }
    elseif ($obj -is [Array] -or $obj -is [System.Object[]]) {
        $result = "["
        $first = $true
        foreach ($item in $obj) {
            if (-not $first) { $result += "," }
            $first = $false
            $result += ConvertTo-JsonCustom $item ($indent + 1)
        }
        $result += "]"
        return $result
    }
    elseif ($obj -is [string]) {
        return "`"" + $obj + "`""
    }
    elseif ($obj -is [int] -or $obj -is [double]) {
        return $obj.ToString()
    }
    else {
        return "`"" + $obj.ToString() + "`""
    }
}

function Generate-CityData {
    param($cityName, $cityData)
    
    $result = @{}
    foreach ($district in $cityData.districts.Keys) {
        $result[$district] = @{}
        foreach ($street in $cityData.districts[$district]) {
            if (-not $result[$district][$street]) {
                $result[$district][$street] = Generate-StreetData $cityName $district $street
            }
        }
    }
    return $result
}

$originalContent = Get-Content "d:\赛事\facilities-data.js" -Raw

$endIndex = $originalContent.LastIndexOf("}}};")
if ($endIndex -ne -1) {
    $baseContent = $originalContent.Substring(0, $endIndex + 3) + ",`n"
} else {
    $baseContent = $originalContent -replace ';\s*$', ",`n"
}

$additionalData = ""
$cityNames = $cities.Keys | Sort-Object
$cityCount = 0

foreach ($cityName in $cityNames) {
    $cityData = $cities[$cityName]
    $cityFacilities = Generate-CityData $cityName $cityData
    $cityJson = ConvertTo-JsonCustom $cityFacilities
    $additionalData += "`"$cityName`":$cityJson"
    $cityCount++
    if ($cityCount -lt $cityNames.Count) {
        $additionalData += ",`n"
    }
}

$queryFunction = @"

};

function findRealFacilities(city, district, street, type) {
  try {
    if (!FACILITIES_DATA[city]) {
      return [];
    }
    if (!FACILITIES_DATA[city][district]) {
      return [];
    }
    if (!FACILITIES_DATA[city][district][street]) {
      return [];
    }
    if (!FACILITIES_DATA[city][district][street][type]) {
      return [];
    }
    return FACILITIES_DATA[city][district][street][type];
  } catch (e) {
    return [];
  }
}
"@

$finalContent = $baseContent + $additionalData + $queryFunction

[System.IO.File]::WriteAllText("d:\赛事\facilities-data.js", $finalContent, [System.Text.Encoding]::UTF8)

Write-Host "数据生成完成！"
Write-Host "补充的城市数量: $cityCount"
Write-Host "城市列表: $($cityNames -join '、')"
