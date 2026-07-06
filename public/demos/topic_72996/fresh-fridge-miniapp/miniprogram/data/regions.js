const regions = [
  {
    name: '北京市',
    code: '110000',
    children: [
      {
        name: '东城区',
        code: '110101',
        children: []
      },
      {
        name: '西城区',
        code: '110102',
        children: []
      },
      {
        name: '朝阳区',
        code: '110105',
        children: []
      },
      {
        name: '海淀区',
        code: '110108',
        children: []
      },
      {
        name: '丰台区',
        code: '110106',
        children: []
      },
      {
        name: '石景山区',
        code: '110107',
        children: []
      },
      {
        name: '通州区',
        code: '110112',
        children: []
      },
      {
        name: '顺义区',
        code: '110113',
        children: []
      }
    ]
  },
  {
    name: '上海市',
    code: '310000',
    children: [
      {
        name: '黄浦区',
        code: '310101',
        children: []
      },
      {
        name: '徐汇区',
        code: '310104',
        children: []
      },
      {
        name: '长宁区',
        code: '310105',
        children: []
      },
      {
        name: '静安区',
        code: '310106',
        children: []
      },
      {
        name: '普陀区',
        code: '310107',
        children: []
      },
      {
        name: '虹口区',
        code: '310109',
        children: []
      },
      {
        name: '杨浦区',
        code: '310110',
        children: []
      },
      {
        name: '浦东新区',
        code: '310115',
        children: []
      }
    ]
  },
  {
    name: '广东省',
    code: '440000',
    children: [
      {
        name: '广州市',
        code: '440100',
        children: [
          { name: '荔湾区', code: '440103' },
          { name: '越秀区', code: '440104' },
          { name: '海珠区', code: '440105' },
          { name: '天河区', code: '440106' },
          { name: '白云区', code: '440111' },
          { name: '黄埔区', code: '440112' },
          { name: '番禺区', code: '440113' },
          { name: '花都区', code: '440114' }
        ]
      },
      {
        name: '深圳市',
        code: '440300',
        children: [
          { name: '罗湖区', code: '440303' },
          { name: '福田区', code: '440304' },
          { name: '南山区', code: '440305' },
          { name: '宝安区', code: '440306' },
          { name: '龙岗区', code: '440307' },
          { name: '龙华区', code: '440309' },
          { name: '坪山区', code: '440310' },
          { name: '光明区', code: '440311' }
        ]
      },
      {
        name: '佛山市',
        code: '440600',
        children: [
          { name: '禅城区', code: '440604' },
          { name: '南海区', code: '440605' },
          { name: '顺德区', code: '440606' },
          { name: '三水区', code: '440607' },
          { name: '高明区', code: '440608' }
        ]
      },
      {
        name: '东莞市',
        code: '441900',
        children: []
      },
      {
        name: '中山市',
        code: '442000',
        children: []
      }
    ]
  },
  {
    name: '浙江省',
    code: '330000',
    children: [
      {
        name: '杭州市',
        code: '330100',
        children: [
          { name: '上城区', code: '330102' },
          { name: '下城区', code: '330103' },
          { name: '江干区', code: '330104' },
          { name: '拱墅区', code: '330105' },
          { name: '西湖区', code: '330106' },
          { name: '滨江区', code: '330108' },
          { name: '萧山区', code: '330109' },
          { name: '余杭区', code: '330110' }
        ]
      },
      {
        name: '宁波市',
        code: '330200',
        children: [
          { name: '海曙区', code: '330203' },
          { name: '江北区', code: '330205' },
          { name: '北仑区', code: '330206' },
          { name: '镇海区', code: '330211' },
          { name: '鄞州区', code: '330212' }
        ]
      },
      {
        name: '温州市',
        code: '330300',
        children: [
          { name: '鹿城区', code: '330302' },
          { name: '龙湾区', code: '330303' },
          { name: '瓯海区', code: '330304' }
        ]
      }
    ]
  },
  {
    name: '江苏省',
    code: '320000',
    children: [
      {
        name: '南京市',
        code: '320100',
        children: [
          { name: '玄武区', code: '320102' },
          { name: '秦淮区', code: '320104' },
          { name: '建邺区', code: '320105' },
          { name: '鼓楼区', code: '320106' },
          { name: '浦口区', code: '320111' },
          { name: '栖霞区', code: '320113' },
          { name: '雨花台区', code: '320114' },
          { name: '江宁区', code: '320115' }
        ]
      },
      {
        name: '苏州市',
        code: '320500',
        children: [
          { name: '虎丘区', code: '320505' },
          { name: '吴中区', code: '320506' },
          { name: '相城区', code: '320507' },
          { name: '姑苏区', code: '320508' },
          { name: '吴江区', code: '320509' }
        ]
      },
      {
        name: '无锡市',
        code: '320200',
        children: [
          { name: '滨湖区', code: '320211' },
          { name: '梁溪区', code: '320213' },
          { name: '新吴区', code: '320214' },
          { name: '锡山区', code: '320205' },
          { name: '惠山区', code: '320206' }
        ]
      }
    ]
  },
  {
    name: '四川省',
    code: '510000',
    children: [
      {
        name: '成都市',
        code: '510100',
        children: [
          { name: '锦江区', code: '510104' },
          { name: '青羊区', code: '510105' },
          { name: '金牛区', code: '510106' },
          { name: '武侯区', code: '510107' },
          { name: '成华区', code: '510108' },
          { name: '龙泉驿区', code: '510112' },
          { name: '青白江区', code: '510113' },
          { name: '新都区', code: '510114' }
        ]
      },
      {
        name: '绵阳市',
        code: '510700',
        children: [
          { name: '涪城区', code: '510703' },
          { name: '游仙区', code: '510704' },
          { name: '安州区', code: '510705' }
        ]
      }
    ]
  },
  {
    name: '湖南省',
    code: '430000',
    children: [
      {
        name: '长沙市',
        code: '430100',
        children: [
          { name: '芙蓉区', code: '430102' },
          { name: '天心区', code: '430103' },
          { name: '岳麓区', code: '430104' },
          { name: '开福区', code: '430105' },
          { name: '雨花区', code: '430111' },
          { name: '望城区', code: '430112' }
        ]
      },
      {
        name: '株洲市',
        code: '430200',
        children: [
          { name: '荷塘区', code: '430202' },
          { name: '芦淞区', code: '430203' },
          { name: '石峰区', code: '430204' },
          { name: '天元区', code: '430211' }
        ]
      }
    ]
  },
  {
    name: '湖北省',
    code: '420000',
    children: [
      {
        name: '武汉市',
        code: '420100',
        children: [
          { name: '江岸区', code: '420102' },
          { name: '江汉区', code: '420103' },
          { name: '硚口区', code: '420104' },
          { name: '汉阳区', code: '420105' },
          { name: '武昌区', code: '420106' },
          { name: '青山区', code: '420107' },
          { name: '洪山区', code: '420111' },
          { name: '东西湖区', code: '420112' }
        ]
      },
      {
        name: '宜昌市',
        code: '420500',
        children: [
          { name: '西陵区', code: '420502' },
          { name: '伍家岗区', code: '420503' },
          { name: '点军区', code: '420504' },
          { name: '猇亭区', code: '420505' },
          { name: '夷陵区', code: '420506' }
        ]
      }
    ]
  }
]

const getProvinces = () => {
  return regions.map(province => ({
    name: province.name,
    code: province.code
  }))
}

const getCities = (provinceCode) => {
  const province = regions.find(p => p.code === provinceCode)
  if (!province) return []
  return province.children.map(city => ({
    name: city.name,
    code: city.code
  }))
}

const getDistricts = (cityCode) => {
  for (const province of regions) {
    const city = province.children.find(c => c.code === cityCode)
    if (city && city.children) {
      return city.children.map(district => ({
        name: district.name,
        code: district.code
      }))
    }
  }
  return []
}

const getRegionName = (code) => {
  for (const province of regions) {
    if (province.code === code) return province.name
    for (const city of province.children) {
      if (city.code === code) return city.name
      if (city.children) {
        for (const district of city.children) {
          if (district.code === code) return district.name
        }
      }
    }
  }
  return ''
}

module.exports = {
  regions,
  getProvinces,
  getCities,
  getDistricts,
  getRegionName
}