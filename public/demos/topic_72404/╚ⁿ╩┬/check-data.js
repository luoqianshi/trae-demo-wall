var fs = require('fs');
var content = fs.readFileSync('d:\\赛事\\facilities-data.js', 'utf8');

eval(content);

var targetCities = [
  '北京', '上海', '广州', '深圳',
  '成都', '杭州', '武汉', '南京', '西安', '重庆', '天津',
  '苏州', '郑州', '长沙', '东莞', '青岛', '沈阳', '大连',
  '佛山', '宁波', '无锡', '合肥'
];

var categories = ['subway', 'bus', 'hospital', 'pharmacy', 'supermarket', 'convenience', 'school', 'park'];

console.log('=== 数据完整性检查 ===\n');

var totalStreets = 0;
var incompleteStreets = [];

targetCities.forEach(function(city) {
  if (!FACILITIES_DATA[city]) {
    console.log('缺失城市: ' + city);
    return;
  }
  
  var districts = FACILITIES_DATA[city];
  var districtCount = Object.keys(districts).length;
  var cityStreetCount = 0;
  
  Object.keys(districts).forEach(function(district) {
    var streets = districts[district];
    var streetCount = Object.keys(streets).length;
    cityStreetCount += streetCount;
    
    Object.keys(streets).forEach(function(street) {
      totalStreets++;
      var data = streets[street];
      var missing = [];
      
      categories.forEach(function(cat) {
        if (!data[cat] || !Array.isArray(data[cat]) || data[cat].length === 0) {
          missing.push(cat);
        }
      });
      
      if (missing.length > 0) {
        incompleteStreets.push({
          city: city,
          district: district,
          street: street,
          missing: missing
        });
      }
    });
  });
  
  console.log(city + ': ' + districtCount + ' 个区, ' + cityStreetCount + ' 个街道');
});

console.log('\n=== 总计 ===');
console.log('总街道数: ' + totalStreets);
console.log('数据不完整街道数: ' + incompleteStreets.length);

if (incompleteStreets.length > 0) {
  console.log('\n=== 不完整街道列表 (前20个) ===');
  incompleteStreets.slice(0, 20).forEach(function(item) {
    console.log(item.city + ' / ' + item.district + ' / ' + item.street + ' 缺失: ' + item.missing.join(', '));
  });
}
