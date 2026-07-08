// pages/diet/diet.js
const app = getApp()

// 扩展食材数据库（80+）
const foodDatabase = [
  // 肉类
  { id: '1', name: '鸡胸肉', category: '肉类', categoryClass: 'meat', calories: 133, protein: 28.0, carb: 2.5, fat: 2.5, fiber: 0, vitaminC: 0, calcium: 11, commonUnit: '块', commonWeight: 150 },
  { id: '2', name: '牛肉', category: '肉类', categoryClass: 'meat', calories: 250, protein: 26.0, carb: 0, fat: 15.0, fiber: 0, vitaminC: 0, calcium: 9, commonUnit: '块', commonWeight: 150 },
  { id: '3', name: '猪里脊', category: '肉类', categoryClass: 'meat', calories: 155, protein: 20.2, carb: 1.5, fat: 7.9, fiber: 0, vitaminC: 0, calcium: 6, commonUnit: '块', commonWeight: 150 },
  { id: '4', name: '三文鱼', category: '肉类', categoryClass: 'meat', calories: 208, protein: 20.0, carb: 0, fat: 13.0, fiber: 0, vitaminC: 0, calcium: 12, commonUnit: '块', commonWeight: 120 },
  { id: '5', name: '虾', category: '肉类', categoryClass: 'meat', calories: 93, protein: 18.6, carb: 2.8, fat: 0.8, fiber: 0, vitaminC: 0, calcium: 62, commonUnit: '只', commonWeight: 30 },
  { id: '6', name: '鸡腿肉', category: '肉类', categoryClass: 'meat', calories: 181, protein: 16.0, carb: 0, fat: 13.0, fiber: 0, vitaminC: 0, calcium: 9, commonUnit: '只', commonWeight: 120 },
  { id: '34', name: '鸭肉', category: '肉类', categoryClass: 'meat', calories: 240, protein: 15.5, carb: 0, fat: 19.8, fiber: 0, vitaminC: 0, calcium: 6, commonUnit: '块', commonWeight: 150 },
  { id: '35', name: '羊肉', category: '肉类', categoryClass: 'meat', calories: 203, protein: 19.0, carb: 0, fat: 14.0, fiber: 0, vitaminC: 0, calcium: 9, commonUnit: '块', commonWeight: 150 },
  { id: '36', name: '带鱼', category: '肉类', categoryClass: 'meat', calories: 127, protein: 17.7, carb: 0, fat: 5.4, fiber: 0, vitaminC: 0, calcium: 28, commonUnit: '段', commonWeight: 100 },
  { id: '37', name: '鲫鱼', category: '肉类', categoryClass: 'meat', calories: 108, protein: 17.1, carb: 0, fat: 4.1, fiber: 0, vitaminC: 0, calcium: 79, commonUnit: '条', commonWeight: 200 },
  { id: '38', name: '螃蟹', category: '肉类', categoryClass: 'meat', calories: 95, protein: 13.8, carb: 4.7, fat: 2.3, fiber: 0, vitaminC: 0, calcium: 208, commonUnit: '只', commonWeight: 200 },
  { id: '39', name: '五花肉', category: '肉类', categoryClass: 'meat', calories: 349, protein: 14.5, carb: 3.2, fat: 30.8, fiber: 0, vitaminC: 0, calcium: 6, commonUnit: '块', commonWeight: 100 },
  { id: '40', name: '培根', category: '肉类', categoryClass: 'meat', calories: 541, protein: 8.8, carb: 4.2, fat: 54.0, fiber: 0, vitaminC: 0, calcium: 11, commonUnit: '片', commonWeight: 15 },
  { id: '41', name: '鸡翅', category: '肉类', categoryClass: 'meat', calories: 194, protein: 17.4, carb: 0, fat: 13.6, fiber: 0, vitaminC: 0, calcium: 12, commonUnit: '只', commonWeight: 80 },
  // 蛋类
  { id: '7', name: '鸡蛋', category: '蛋类', categoryClass: 'egg', calories: 144, protein: 13.0, carb: 1.1, fat: 9.5, fiber: 0, vitaminC: 0, calcium: 56, commonUnit: '个', commonWeight: 60 },
  { id: '8', name: '鹌鹑蛋', category: '蛋类', categoryClass: 'egg', calories: 160, protein: 12.0, carb: 2.0, fat: 11.0, fiber: 0, vitaminC: 0, calcium: 47, commonUnit: '个', commonWeight: 12 },
  { id: '42', name: '皮蛋', category: '蛋类', categoryClass: 'egg', calories: 171, protein: 14.2, carb: 4.5, fat: 10.7, fiber: 0, vitaminC: 0, calcium: 63, commonUnit: '个', commonWeight: 60 },
  { id: '43', name: '咸鸭蛋', category: '蛋类', categoryClass: 'egg', calories: 190, protein: 12.7, carb: 3.0, fat: 14.5, fiber: 0, vitaminC: 0, calcium: 65, commonUnit: '个', commonWeight: 70 },
  // 主食
  { id: '9', name: '米饭', category: '主食', categoryClass: 'staple', calories: 116, protein: 2.6, carb: 25.6, fat: 0.3, fiber: 0.3, vitaminC: 0, calcium: 7, commonUnit: '碗', commonWeight: 200 },
  { id: '10', name: '面条', category: '主食', categoryClass: 'staple', calories: 110, protein: 3.5, carb: 22.0, fat: 0.5, fiber: 0.8, vitaminC: 0, calcium: 12, commonUnit: '碗', commonWeight: 200 },
  { id: '11', name: '馒头', category: '主食', categoryClass: 'staple', calories: 221, protein: 7.0, carb: 45.0, fat: 1.1, fiber: 1.3, vitaminC: 0, calcium: 38, commonUnit: '个', commonWeight: 100 },
  { id: '12', name: '全麦面包', category: '主食', categoryClass: 'staple', calories: 246, protein: 8.5, carb: 43.0, fat: 4.5, fiber: 6.0, vitaminC: 0, calcium: 54, commonUnit: '片', commonWeight: 40 },
  { id: '13', name: '燕麦', category: '主食', categoryClass: 'staple', calories: 367, protein: 14.7, carb: 66.0, fat: 6.9, fiber: 5.3, vitaminC: 0, calcium: 186, commonUnit: '碗', commonWeight: 40 },
  { id: '14', name: '红薯', category: '主食', categoryClass: 'staple', calories: 86, protein: 1.6, carb: 20.1, fat: 0.1, fiber: 3.0, vitaminC: 26, calcium: 23, commonUnit: '个', commonWeight: 200 },
  { id: '15', name: '玉米', category: '主食', categoryClass: 'staple', calories: 112, protein: 4.0, carb: 22.8, fat: 1.2, fiber: 2.9, vitaminC: 16, calcium: 4, commonUnit: '根', commonWeight: 200 },
  { id: '44', name: '紫薯', category: '主食', categoryClass: 'staple', calories: 82, protein: 1.5, carb: 18.0, fat: 0.2, fiber: 2.8, vitaminC: 20, calcium: 18, commonUnit: '个', commonWeight: 200 },
  { id: '45', name: '小米粥', category: '主食', categoryClass: 'staple', calories: 46, protein: 1.4, carb: 8.4, fat: 0.7, fiber: 0.2, vitaminC: 0, calcium: 4, commonUnit: '碗', commonWeight: 300 },
  { id: '46', name: '包子', category: '主食', categoryClass: 'staple', calories: 227, protein: 7.0, carb: 38.0, fat: 6.5, fiber: 1.0, vitaminC: 0, calcium: 30, commonUnit: '个', commonWeight: 100 },
  { id: '47', name: '饺子', category: '主食', categoryClass: 'staple', calories: 195, protein: 8.0, carb: 27.0, fat: 5.5, fiber: 0.8, vitaminC: 1, calcium: 25, commonUnit: '个', commonWeight: 30 },
  { id: '48', name: '年糕', category: '主食', categoryClass: 'staple', calories: 154, protein: 3.3, carb: 34.7, fat: 0.6, fiber: 0.8, vitaminC: 0, calcium: 31, commonUnit: '块', commonWeight: 50 },
  { id: '49', name: '意大利面', category: '主食', categoryClass: 'staple', calories: 157, protein: 5.8, carb: 30.0, fat: 1.2, fiber: 1.8, vitaminC: 0, calcium: 18, commonUnit: '份', commonWeight: 200 },
  { id: '50', name: '土豆', category: '主食', categoryClass: 'staple', calories: 76, protein: 2.0, carb: 16.5, fat: 0.2, fiber: 1.3, vitaminC: 27, calcium: 8, commonUnit: '个', commonWeight: 200 },
  { id: '51', name: '南瓜', category: '主食', categoryClass: 'staple', calories: 22, protein: 0.7, carb: 4.5, fat: 0.1, fiber: 0.8, vitaminC: 8, calcium: 16, commonUnit: '块', commonWeight: 200 },
  // 蔬菜
  { id: '16', name: '西兰花', category: '蔬菜', categoryClass: 'vegetable', calories: 33, protein: 4.1, carb: 4.3, fat: 0.3, fiber: 1.6, vitaminC: 51, calcium: 67, commonUnit: '份', commonWeight: 150 },
  { id: '17', name: '菠菜', category: '蔬菜', categoryClass: 'vegetable', calories: 24, protein: 2.6, carb: 3.6, fat: 0.3, fiber: 1.7, vitaminC: 32, calcium: 66, commonUnit: '份', commonWeight: 100 },
  { id: '18', name: '番茄', category: '蔬菜', categoryClass: 'vegetable', calories: 19, protein: 0.9, carb: 4.0, fat: 0.2, fiber: 0.5, vitaminC: 19, calcium: 10, commonUnit: '个', commonWeight: 150 },
  { id: '19', name: '黄瓜', category: '蔬菜', categoryClass: 'vegetable', calories: 15, protein: 0.7, carb: 2.9, fat: 0.2, fiber: 0.5, vitaminC: 9, calcium: 24, commonUnit: '根', commonWeight: 200 },
  { id: '20', name: '胡萝卜', category: '蔬菜', categoryClass: 'vegetable', calories: 37, protein: 1.0, carb: 8.8, fat: 0.2, fiber: 2.8, vitaminC: 13, calcium: 32, commonUnit: '根', commonWeight: 120 },
  { id: '21', name: '生菜', category: '蔬菜', categoryClass: 'vegetable', calories: 13, protein: 1.3, carb: 2.0, fat: 0.3, fiber: 0.7, vitaminC: 13, calcium: 34, commonUnit: '份', commonWeight: 80 },
  { id: '52', name: '白菜', category: '蔬菜', categoryClass: 'vegetable', calories: 17, protein: 1.5, carb: 2.8, fat: 0.2, fiber: 0.8, vitaminC: 31, calcium: 50, commonUnit: '份', commonWeight: 200 },
  { id: '53', name: '茄子', category: '蔬菜', categoryClass: 'vegetable', calories: 21, protein: 1.1, carb: 3.6, fat: 0.2, fiber: 1.3, vitaminC: 5, calcium: 24, commonUnit: '根', commonWeight: 200 },
  { id: '54', name: '青椒', category: '蔬菜', categoryClass: 'vegetable', calories: 22, protein: 1.0, carb: 4.2, fat: 0.2, fiber: 1.4, vitaminC: 72, calcium: 14, commonUnit: '个', commonWeight: 100 },
  { id: '55', name: '洋葱', category: '蔬菜', categoryClass: 'vegetable', calories: 39, protein: 1.1, carb: 8.4, fat: 0.2, fiber: 0.9, vitaminC: 8, calcium: 24, commonUnit: '个', commonWeight: 150 },
  { id: '56', name: '芦笋', category: '蔬菜', categoryClass: 'vegetable', calories: 19, protein: 2.2, carb: 3.0, fat: 0.1, fiber: 1.9, vitaminC: 15, calcium: 21, commonUnit: '份', commonWeight: 100 },
  { id: '57', name: '豆角', category: '蔬菜', categoryClass: 'vegetable', calories: 34, protein: 2.5, carb: 5.7, fat: 0.2, fiber: 1.5, vitaminC: 19, calcium: 42, commonUnit: '份', commonWeight: 150 },
  { id: '58', name: '冬瓜', category: '蔬菜', categoryClass: 'vegetable', calories: 11, protein: 0.4, carb: 2.0, fat: 0.2, fiber: 0.7, vitaminC: 18, calcium: 19, commonUnit: '块', commonWeight: 200 },
  { id: '59', name: '莲藕', category: '蔬菜', categoryClass: 'vegetable', calories: 70, protein: 1.9, carb: 14.6, fat: 0.2, fiber: 1.2, vitaminC: 44, calcium: 39, commonUnit: '节', commonWeight: 150 },
  { id: '60', name: '蘑菇', category: '蔬菜', categoryClass: 'vegetable', calories: 20, protein: 2.7, carb: 2.4, fat: 0.1, fiber: 2.1, vitaminC: 2, calcium: 9, commonUnit: '份', commonWeight: 100 },
  { id: '61', name: '木耳', category: '蔬菜', categoryClass: 'vegetable', calories: 21, protein: 1.5, carb: 5.4, fat: 0.2, fiber: 2.6, vitaminC: 0, calcium: 34, commonUnit: '份', commonWeight: 50 },
  { id: '62', name: '紫甘蓝', category: '蔬菜', categoryClass: 'vegetable', calories: 25, protein: 1.5, carb: 4.5, fat: 0.2, fiber: 1.5, vitaminC: 44, calcium: 36, commonUnit: '份', commonWeight: 100 },
  { id: '63', name: '芹菜', category: '蔬菜', categoryClass: 'vegetable', calories: 14, protein: 0.8, carb: 2.3, fat: 0.1, fiber: 1.2, vitaminC: 12, calcium: 48, commonUnit: '根', commonWeight: 150 },
  // 水果
  { id: '22', name: '苹果', category: '水果', categoryClass: 'fruit', calories: 52, protein: 0.3, carb: 13.8, fat: 0.2, fiber: 2.4, vitaminC: 4, calcium: 6, commonUnit: '个', commonWeight: 200 },
  { id: '23', name: '香蕉', category: '水果', categoryClass: 'fruit', calories: 89, protein: 1.1, carb: 22.8, fat: 0.3, fiber: 2.6, vitaminC: 9, calcium: 5, commonUnit: '根', commonWeight: 120 },
  { id: '24', name: '橙子', category: '水果', categoryClass: 'fruit', calories: 47, protein: 0.9, carb: 11.7, fat: 0.1, fiber: 2.4, vitaminC: 33, calcium: 40, commonUnit: '个', commonWeight: 200 },
  { id: '25', name: '葡萄', category: '水果', categoryClass: 'fruit', calories: 43, protein: 0.5, carb: 10.3, fat: 0.2, fiber: 0.4, vitaminC: 4, calcium: 10, commonUnit: '份', commonWeight: 100 },
  { id: '26', name: '西瓜', category: '水果', categoryClass: 'fruit', calories: 30, protein: 0.6, carb: 7.5, fat: 0.1, fiber: 0.4, vitaminC: 6, calcium: 6, commonUnit: '块', commonWeight: 250 },
  { id: '64', name: '草莓', category: '水果', categoryClass: 'fruit', calories: 30, protein: 1.0, carb: 7.1, fat: 0.2, fiber: 1.1, vitaminC: 47, calcium: 18, commonUnit: '份', commonWeight: 150 },
  { id: '65', name: '蓝莓', category: '水果', categoryClass: 'fruit', calories: 57, protein: 0.7, carb: 14.5, fat: 0.3, fiber: 2.4, vitaminC: 10, calcium: 6, commonUnit: '份', commonWeight: 100 },
  { id: '66', name: '猕猴桃', category: '水果', categoryClass: 'fruit', calories: 56, protein: 0.8, carb: 11.9, fat: 0.6, fiber: 2.6, vitaminC: 62, calcium: 27, commonUnit: '个', commonWeight: 80 },
  { id: '67', name: '柚子', category: '水果', categoryClass: 'fruit', calories: 41, protein: 0.8, carb: 9.5, fat: 0.2, fiber: 1.2, vitaminC: 23, calcium: 26, commonUnit: '瓣', commonWeight: 100 },
  { id: '68', name: '芒果', category: '水果', categoryClass: 'fruit', calories: 35, protein: 0.6, carb: 8.3, fat: 0.2, fiber: 1.3, vitaminC: 23, calcium: 11, commonUnit: '个', commonWeight: 200 },
  { id: '69', name: '梨', category: '水果', categoryClass: 'fruit', calories: 44, protein: 0.4, carb: 10.6, fat: 0.2, fiber: 2.0, vitaminC: 4, calcium: 8, commonUnit: '个', commonWeight: 200 },
  { id: '70', name: '桃子', category: '水果', categoryClass: 'fruit', calories: 44, protein: 0.8, carb: 10.1, fat: 0.1, fiber: 1.0, vitaminC: 7, calcium: 6, commonUnit: '个', commonWeight: 200 },
  { id: '71', name: '樱桃', category: '水果', categoryClass: 'fruit', calories: 46, protein: 1.1, carb: 9.9, fat: 0.2, fiber: 0.3, vitaminC: 10, calcium: 11, commonUnit: '份', commonWeight: 100 },
  { id: '72', name: '火龙果', category: '水果', categoryClass: 'fruit', calories: 51, protein: 1.1, carb: 11.6, fat: 0.2, fiber: 2.0, vitaminC: 3, calcium: 6, commonUnit: '个', commonWeight: 300 },
  { id: '73', name: '菠萝', category: '水果', categoryClass: 'fruit', calories: 41, protein: 0.5, carb: 9.5, fat: 0.1, fiber: 1.3, vitaminC: 18, calcium: 12, commonUnit: '块', commonWeight: 150 },
  // 乳制品
  { id: '27', name: '牛奶', category: '乳制品', categoryClass: 'dairy', calories: 61, protein: 3.2, carb: 4.8, fat: 3.3, fiber: 0, vitaminC: 1, calcium: 104, commonUnit: '杯', commonWeight: 250 },
  { id: '28', name: '酸奶', category: '乳制品', categoryClass: 'dairy', calories: 72, protein: 3.5, carb: 9.3, fat: 2.7, fiber: 0, vitaminC: 1, calcium: 118, commonUnit: '杯', commonWeight: 200 },
  { id: '74', name: '奶酪', category: '乳制品', categoryClass: 'dairy', calories: 328, protein: 25.7, carb: 3.5, fat: 23.5, fiber: 0, vitaminC: 0, calcium: 799, commonUnit: '片', commonWeight: 20 },
  { id: '75', name: '脱脂牛奶', category: '乳制品', categoryClass: 'dairy', calories: 35, protein: 3.4, carb: 5.0, fat: 0.1, fiber: 0, vitaminC: 1, calcium: 123, commonUnit: '杯', commonWeight: 250 },
  // 豆制品
  { id: '29', name: '豆腐', category: '豆制品', categoryClass: 'bean', calories: 81, protein: 8.1, carb: 4.2, fat: 4.8, fiber: 0.4, vitaminC: 0, calcium: 164, commonUnit: '块', commonWeight: 150 },
  { id: '30', name: '豆浆', category: '豆制品', categoryClass: 'bean', calories: 31, protein: 3.0, carb: 1.2, fat: 1.6, fiber: 1.1, vitaminC: 0, calcium: 10, commonUnit: '杯', commonWeight: 300 },
  { id: '76', name: '毛豆', category: '豆制品', categoryClass: 'bean', calories: 123, protein: 13.0, carb: 6.5, fat: 5.0, fiber: 4.0, vitaminC: 27, calcium: 135, commonUnit: '份', commonWeight: 100 },
  { id: '77', name: '腐竹', category: '豆制品', categoryClass: 'bean', calories: 461, protein: 44.6, carb: 21.3, fat: 21.7, fiber: 1.0, vitaminC: 0, calcium: 77, commonUnit: '根', commonWeight: 20 },
  { id: '78', name: '红豆', category: '豆制品', categoryClass: 'bean', calories: 309, protein: 20.2, carb: 55.7, fat: 0.6, fiber: 7.7, vitaminC: 0, calcium: 74, commonUnit: '份', commonWeight: 30 },
  // 零食/其他
  { id: '31', name: '坚果', category: '零食', categoryClass: 'snack', calories: 607, protein: 20.0, carb: 17.0, fat: 53.0, fiber: 6.7, vitaminC: 1, calcium: 97, commonUnit: '把', commonWeight: 30 },
  { id: '32', name: '巧克力', category: '零食', categoryClass: 'snack', calories: 546, protein: 5.5, carb: 56.0, fat: 33.0, fiber: 2.2, vitaminC: 0, calcium: 51, commonUnit: '块', commonWeight: 20 },
  { id: '33', name: '咖啡', category: '零食', categoryClass: 'snack', calories: 2, protein: 0.1, carb: 0, fat: 0, fiber: 0, vitaminC: 0, calcium: 2, commonUnit: '杯', commonWeight: 250 },
  { id: '79', name: '蜂蜜', category: '零食', categoryClass: 'snack', calories: 321, protein: 0.4, carb: 75.6, fat: 1.9, fiber: 0, vitaminC: 0, calcium: 4, commonUnit: '勺', commonWeight: 15 },
  { id: '80', name: '花生酱', category: '零食', categoryClass: 'snack', calories: 594, protein: 22.0, carb: 16.0, fat: 50.0, fiber: 5.0, vitaminC: 0, calcium: 36, commonUnit: '勺', commonWeight: 15 },
  { id: '81', name: '绿茶', category: '零食', categoryClass: 'snack', calories: 1, protein: 0, carb: 0, fat: 0, fiber: 0, vitaminC: 0, calcium: 3, commonUnit: '杯', commonWeight: 250 },
  { id: '82', name: '奶茶', category: '零食', categoryClass: 'snack', calories: 52, protein: 1.5, carb: 7.0, fat: 2.0, fiber: 0, vitaminC: 0, calcium: 40, commonUnit: '杯', commonWeight: 500 },
  // 饮品
  { id: '83', name: '可乐', category: '饮品', categoryClass: 'drink', calories: 43, protein: 0, carb: 10.6, fat: 0, fiber: 0, vitaminC: 0, calcium: 3, commonUnit: '罐', commonWeight: 330 },
  { id: '84', name: '橙汁', category: '饮品', categoryClass: 'drink', calories: 45, protein: 0.7, carb: 10.4, fat: 0.2, fiber: 0.2, vitaminC: 33, calcium: 11, commonUnit: '杯', commonWeight: 250 },
  { id: '85', name: '豆浆拿铁', category: '饮品', categoryClass: 'drink', calories: 50, protein: 2.5, carb: 5.0, fat: 2.0, fiber: 0, vitaminC: 0, calcium: 50, commonUnit: '杯', commonWeight: 350 },
  // 调味品
  { id: '86', name: '橄榄油', category: '调味品', categoryClass: 'seasoning', calories: 899, protein: 0, carb: 0, fat: 99.9, fiber: 0, vitaminC: 0, calcium: 0, commonUnit: '勺', commonWeight: 10 },
  { id: '87', name: '酱油', category: '调味品', categoryClass: 'seasoning', calories: 63, protein: 5.6, carb: 8.1, fat: 0.1, fiber: 0.5, vitaminC: 0, calcium: 28, commonUnit: '勺', commonWeight: 15 },
  // 营养补剂
  { id: '88', name: '乳清蛋白粉', category: '营养补剂', categoryClass: 'supplement', calories: 400, protein: 75.0, carb: 10.0, fat: 3.0, fiber: 0, vitaminC: 0, calcium: 500, commonUnit: '勺', commonWeight: 30 },
  { id: '89', name: '左旋肉碱', category: '营养补剂', categoryClass: 'supplement', calories: 5, protein: 0, carb: 1.0, fat: 0, fiber: 0, vitaminC: 0, calcium: 0, commonUnit: '支', commonWeight: 30 },
  { id: '90', name: 'BCAA', category: '营养补剂', categoryClass: 'supplement', calories: 10, protein: 5.0, carb: 1.0, fat: 0, fiber: 0, vitaminC: 0, calcium: 0, commonUnit: '勺', commonWeight: 8 }
]

Page({
  data: {
    currentDate: '',
    mealTypes: [
      { label: '早餐', value: 'breakfast' },
      { label: '午餐', value: 'lunch' },
      { label: '晚餐', value: 'dinner' }
    ],
    currentMeal: 'breakfast',
    currentMealLabel: '早餐',
    currentMealCalories: 0,

    // 今日各餐次数据
    mealsData: {
      breakfast: [],
      lunch: [],
      dinner: []
    },

    // 今日总计（6项营养）
    todayTotal: {
      calories: 0,
      protein: 0,
      carb: 0,
      fat: 0,
      fiber: 0,
      vitaminC: 0,
      calcium: 0
    },

    // 营养目标
    nutritionTarget: {
      protein: 150,
      carb: 250,
      fat: 65,
      fiber: 25,
      vitaminC: 100,
      calcium: 800
    },

    // 当前餐次的食物列表
    currentMealFoods: [],

    // 弹窗相关
    showModal: false,

    // 拍照识别相关
    recognizing: false,
    recognizeResult: null
  },

  onLoad(options) {
    const today = this.getTodayDate()
    this.setData({
      currentDate: today,
      nutritionTarget: app.globalData.nutritionTarget
    })

    if (options.type) {
      const mealType = options.type
      const mealTypeMap = {
        'breakfast': '早餐',
        'lunch': '午餐',
        'dinner': '晚餐'
      }
      if (mealTypeMap[mealType]) {
        this.setData({
          currentMeal: mealType,
          currentMealLabel: mealTypeMap[mealType]
        })
      }
    }

    this.loadFromStorage()
    this.updateCurrentMealFoods()
  },

  onShow() {
    // 读取从首页传来的餐次类型
    const selectedMealType = app.globalData.selectedMealType
    if (selectedMealType) {
      const mealTypeMap = {
        'breakfast': '早餐',
        'lunch': '午餐',
        'dinner': '晚餐'
      }
      if (mealTypeMap[selectedMealType]) {
        this.setData({
          currentMeal: selectedMealType,
          currentMealLabel: mealTypeMap[selectedMealType]
        })
        this.updateCurrentMealFoods()
      }
      // 用完即清，避免重复切换
      app.globalData.selectedMealType = null
    }
    this.calculateTodayTotal()
  },

  // 返回上一页
  goBack() {
    wx.navigateBack({
      fail: () => {
        wx.switchTab({ url: '/pages/index/index' })
      }
    })
  },

  getTodayDate() {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  },

  onDateChange(e) {
    this.setData({
      currentDate: e.detail.value
    })
    this.loadFromStorage()
  },

  // 切换餐次
  switchMeal(e) {
    const type = e.currentTarget.dataset.type
    const typeMap = {
      'breakfast': '早餐',
      'lunch': '午餐',
      'dinner': '晚餐'
    }
    this.setData({
      currentMeal: type,
      currentMealLabel: typeMap[type]
    })
    this.updateCurrentMealFoods()
  },

  // 更新当前餐次食物列表
  updateCurrentMealFoods() {
    const mealsData = this.data.mealsData
    const currentMealFoods = mealsData[this.data.currentMeal] || []
    let currentMealCalories = 0
    currentMealFoods.forEach(food => {
      currentMealCalories += food.calories || 0
    })
    this.setData({
      currentMealFoods,
      currentMealCalories: Math.round(currentMealCalories)
    })
  },

  // 计算今日总营养（6项）
  calculateTodayTotal() {
    const mealsData = this.data.mealsData
    let total = { calories: 0, protein: 0, carb: 0, fat: 0, fiber: 0, vitaminC: 0, calcium: 0 }

    Object.keys(mealsData).forEach(mealType => {
      const foods = mealsData[mealType] || []
      foods.forEach(food => {
        total.calories += food.calories || 0
        total.protein += food.protein || 0
        total.carb += food.carb || 0
        total.fat += food.fat || 0
        total.fiber += food.fiber || 0
        total.vitaminC += food.vitaminC || 0
        total.calcium += food.calcium || 0
      })
    })

    total.calories = Math.round(total.calories)
    total.protein = Math.round(total.protein)
    total.carb = Math.round(total.carb)
    total.fat = Math.round(total.fat)
    total.fiber = Math.round(total.fiber * 10) / 10
    total.vitaminC = Math.round(total.vitaminC * 10) / 10
    total.calcium = Math.round(total.calcium)

    this.setData({ todayTotal: total })

    // 同步到全局数据
    app.globalData.todayDiet.totalCalories = total.calories
    app.globalData.todayDiet.totalProtein = total.protein
    app.globalData.todayDiet.totalCarb = total.carb
    app.globalData.todayDiet.totalFat = total.fat
    app.globalData.todayDiet.totalFiber = total.fiber
    app.globalData.todayDiet.totalVitaminC = total.vitaminC
    app.globalData.todayDiet.totalCalcium = total.calcium

    this.saveToStorage()
  },

  // 显示添加食物弹窗 - 同时直接打开相机
  showAddFood() {
    this.setData({
      showModal: true,
      recognizing: false,
      recognizeResult: null
    })
    // 直接触发拍照
    this.onCameraTap()
  },

  // 隐藏弹窗
  hideModal() {
    this.setData({
      showModal: false,
      recognizing: false,
      recognizeResult: null
    })
  },

  // 拍照识别 - 选择图片并调用阶跃星辰AI识别
  onCameraTap() {
    const that = this
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['camera', 'album'],
      sizeType: ['compressed'],
      success(res) {
        const tempFilePath = res.tempFiles[0].tempFilePath
        // 将图片转为base64
        wx.getFileSystemManager().readFile({
          filePath: tempFilePath,
          encoding: 'base64',
          success(fileRes) {
            const base64 = 'data:image/jpeg;base64,' + fileRes.data
            that.recognizeFood(base64)
          },
          fail() {
            wx.showToast({ title: '图片读取失败', icon: 'none' })
          }
        })
      }
    })
  },

  // 调用阶跃星辰视觉模型识别整餐食物
  recognizeFood(base64) {
    const that = this
    this.setData({ recognizing: true })

    const apiKey = '4EWkFZvsxrkjl2GAFK4lpFSMs60vLZctsTGkPNJY35gT2y9VtedI2BkJlj1JvCJ3s'

    wx.request({
      url: 'https://api.stepfun.com/v1/chat/completions',
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey
      },
      data: {
        model: 'step-1o-turbo-vision',
        messages: [
          {
            role: 'system',
            content: '你是一个专业的食物营养与安全识别助手。用户会发送一餐的食物图片，你需要识别图片中所有食物，判断食物是否变质，并返回完整的营养信息。只返回JSON，不要其他文字。'
          },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: base64, detail: 'high' }
              },
              {
                type: 'text',
                text: '请识别这张图片中的所有食物，判断是否有变质迹象，并以JSON格式返回。格式要求：{"foods":[{"name":"食物名称","caloriesPer100g":每100g热量(kcal整数),"protein":蛋白质(g/100g保留1位小数),"carb":碳水化合物(g/100g保留1位小数),"fat":脂肪(g/100g保留1位小数),"fiber":膳食纤维(g/100g保留1位小数),"estimatedWeight":估计该食物重量(g整数),"totalCalories":该食物估计总热量(kcal整数),"isSpoiled":是否变质(true/false),"spoilReason":"变质原因(如发霉、变色、异味等，未变质则为空字符串)"}],"spoiledFoods":["变质食物1名称","变质食物2名称"],"totalCalories":所有食物总热量(kcal整数),"totalProtein":总蛋白质(g保留1位小数),"totalCarb":总碳水(g保留1位小数),"totalFat":总脂肪(g保留1位小数),"totalFiber":总膳食纤维(g保留1位小数)}。判断变质依据：发霉、变色、异味、腐烂、长毛、质地异常等。如果没有变质食物，spoiledFoods为空数组。如果无法识别为食物，返回{"foods":[],"spoiledFoods":[],"totalCalories":0,"totalProtein":0,"totalCarb":0,"totalFat":0,"totalFiber":0}。只返回JSON，不要其他文字。'
              }
            ]
          }
        ],
        temperature: 0.1,
        max_tokens: 512
      },
      success(res) {
        that.setData({ recognizing: false })
        if (res.statusCode === 200 && res.data.choices && res.data.choices.length > 0) {
          const content = res.data.choices[0].message.content
          that.parseRecognizeResult(content)
        } else {
          wx.showToast({ title: '识别失败，请重试', icon: 'none' })
        }
      },
      fail() {
        that.setData({ recognizing: false })
        wx.showToast({ title: '网络请求失败', icon: 'none' })
      }
    })
  },

  // 解析AI识别结果
  parseRecognizeResult(content) {
    try {
      // 提取JSON部分
      let jsonStr = content
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        jsonStr = jsonMatch[0]
      }
      const result = JSON.parse(jsonStr)

      if (!result.foods || result.foods.length === 0) {
        wx.showToast({ title: '未能识别食物，请重新拍照', icon: 'none', duration: 2000 })
        return
      }

      // 构造识别结果
      const recognizeResult = {
        foods: result.foods.map((food, index) => ({
          name: food.name,
          caloriesPer100g: Math.round(food.caloriesPer100g || 0),
          protein: food.protein || 0,
          carb: food.carb || 0,
          fat: food.fat || 0,
          fiber: food.fiber || 0,
          estimatedWeight: food.estimatedWeight || 100,
          totalCalories: Math.round(food.totalCalories || 0),
          isSpoiled: !!food.isSpoiled,
          spoilReason: food.spoilReason || ''
        })),
        spoiledFoods: result.spoiledFoods || [],
        totalCalories: Math.round(result.totalCalories || 0),
        totalProtein: result.totalProtein || 0,
        totalCarb: result.totalCarb || 0,
        totalFat: result.totalFat || 0,
        totalFiber: result.totalFiber || 0
      }

      this.setData({ recognizeResult })
    } catch (e) {
      wx.showToast({ title: '识别结果解析失败，请重试', icon: 'none', duration: 2000 })
    }
  },

  // 重新拍照
  retakePhoto() {
    this.setData({
      recognizeResult: null,
      recognizing: false
    })
    this.onCameraTap()
  },

  // 确认记录识别结果（跳过变质食物）
  confirmRecognizeResult() {
    const { recognizeResult, currentMeal, mealsData } = this.data
    if (!recognizeResult || !recognizeResult.foods || recognizeResult.foods.length === 0) return

    if (!mealsData[currentMeal]) {
      mealsData[currentMeal] = []
    }

    // 只记录未变质的食物
    const safeFoods = recognizeResult.foods.filter(food => !food.isSpoiled)
    const spoiledCount = recognizeResult.foods.length - safeFoods.length

    if (safeFoods.length === 0) {
      wx.showToast({ title: '所有食物均疑似变质，已跳过记录', icon: 'none', duration: 2000 })
      this.hideModal()
      return
    }

    safeFoods.forEach(food => {
      mealsData[currentMeal].push({
        id: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 4),
        foodId: 'ai',
        name: food.name,
        amount: food.estimatedWeight,
        displayAmount: '约' + food.estimatedWeight + 'g',
        calories: food.totalCalories,
        protein: Math.round(food.protein * food.estimatedWeight / 100 * 10) / 10,
        carb: Math.round(food.carb * food.estimatedWeight / 100 * 10) / 10,
        fat: Math.round(food.fat * food.estimatedWeight / 100 * 10) / 10,
        fiber: Math.round((food.fiber || 0) * food.estimatedWeight / 100 * 10) / 10,
        vitaminC: 0,
        calcium: 0,
        isAI: true
      })
    })

    this.setData({ mealsData })
    this.updateCurrentMealFoods()
    this.calculateTodayTotal()
    this.hideModal()

    let msg = `已记录${safeFoods.length}种食物`
    if (spoiledCount > 0) {
      msg += `，已跳过${spoiledCount}种变质食物`
    }
    wx.showToast({ title: msg, icon: 'success', duration: 1500 })
  },

  // 删除食物
  deleteFood(e) {
    const id = e.currentTarget.dataset.id

    wx.showModal({
      title: '提示',
      content: '确定要删除这条记录吗？',
      confirmColor: '#96AD93',
      success: (res) => {
        if (res.confirm) {
          const mealsData = this.data.mealsData
          const currentMeal = this.data.currentMeal

          mealsData[currentMeal] = mealsData[currentMeal].filter(f => f.id !== id)

          this.setData({ mealsData })
          this.updateCurrentMealFoods()
          this.calculateTodayTotal()

          wx.showToast({ title: '删除成功', icon: 'success' })
        }
      }
    })
  },

  // 保存到本地存储
  saveToStorage() {
    try {
      wx.setStorageSync('mealsData_' + this.data.currentDate, this.data.mealsData)
    } catch (e) {
      console.error('[Diet] 保存失败:', e)
    }
  },

  // 从本地存储加载
  loadFromStorage() {
    try {
      const savedData = wx.getStorageSync('mealsData_' + this.data.currentDate)
      if (savedData) {
        this.setData({ mealsData: savedData })
        this.updateCurrentMealFoods()
        this.calculateTodayTotal()
      }
    } catch (e) {
      console.error('[Diet] 加载失败:', e)
    }
  }
})
