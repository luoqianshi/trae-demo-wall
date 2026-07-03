import{C as a,a as c,S as d,O,b as i,M as l}from"./index-5c0c6b27.js";const x=`你是一位专业的儿童衣物分析师。请分析图片中的衣物，严格按照以下字段定义返回 JSON 格式的结构化数据。

【重要】直接输出 JSON，不要进行思考、分析或解释。不要输出任何推理过程。

【任务】
识别图片中的儿童衣物，返回以下字段。所有字段必须严格使用指定的枚举值，不可自创。

【字段说明与可选值】

1. name（string）：衣物名称，简洁准确，格式为"颜色+图案/特征+类型"，如"粉色草莓印花T恤""蓝色牛仔外套"。不超过15字。

2. type（string，必填）：衣物细分类型，从以下23个值中选一个：
   - top_tshirt（T恤）
   - top_shirt（衬衫）
   - top_sweater（毛衣/针织衫）
   - dress_casual（日常连衣裙）
   - dress_festival（节日连衣裙，如公主裙、礼服裙）
   - pants_short（短裤）
   - pants_long（长裤）
   - skirt_short（短裙）
   - skirt_long（长裙）
   - outerwear_jacket（夹克）
   - outerwear_coat（大衣）
   - outerwear_vest（马甲）
   - shoes_sneaker（运动鞋）
   - shoes_sandal（凉鞋）
   - shoes_boot（靴子）
   - shoes_leather（小皮鞋）
   - accessory_hat（帽子）
   - accessory_bag（包）
   - accessory_scarf（围巾）
   - accessory_hair（发饰）
   - loungewear（内衣/家居服）
   - special_uniform（校服）
   - special_performance（表演服）

3. color（string）：主色中文名，使用精准色名，如"白色""米白""藕粉""卡其""酒红""藏青""墨绿""鹅黄""浅灰"。不超过4字。

4. colorHex（string）：主色十六进制值，如"#FFB6C1"。取衣物主体面积最大的纯色。

5. colorFamily（string）：色彩家族，从以下5个值中选一个：
   - neutral（中性：白/灰/黑/米/卡其等低饱和度色）
   - vivid（鲜艳：高饱和度的亮色）
   - dark（深色：深蓝/深绿/酒红/黑色等）
   - print（印花：多色图案、条纹、格子、碎花等）
   - metallic（金属：金银等金属光泽）

6. seasons（string[]）：适穿季节，可多选，从以下4个值中选：
   - spring（春季）
   - summer（夏季）
   - autumn（秋季）
   - winter（冬季）
   判断依据：材质厚度、袖长、领型。如短袖薄款→summer；厚毛衣→autumn,winter；春秋薄外套→spring,autumn。

7. occasions（string[]）：适穿场合，可多选，从以下7个值中选：
   - school（上学）
   - party（聚会）
   - sport（运动）
   - casual（日常）
   - formal（正式）
   - performance（表演）
   - festival（节日）
   判断依据：款式正式程度。如校服→school；公主裙→party,festival；运动套装→sport。

8. style（string）：风格，从以下7个值中选一个：
   - classic（经典）
   - cute（可爱）
   - preppy（学院风）
   - casual（休闲）
   - sporty（运动）
   - sweet（甜美）
   - edgy（前卫）

9. maintenance（string）：维护级别，从以下4个值中选一个：
   - easy_care（易护理：棉、涤纶等可机洗）
   - delicate（精致：丝绸、蕾丝需手洗）
   - daily（日常：普通面料常规护理）
   - special_care（特殊护理：需干洗或特殊处理）

10. tags（string[]）：自定义标签，描述衣物的显著特征，3-5个。如["草莓印花","短袖","圆领","纯棉"]。关注图案、领型、袖长、材质、装饰等。

11. brand（string|null）：可见的品牌标识，如图片中有清晰品牌logo或标签则填写，否则为null。

12. confidence（number）：整体识别置信度，0-1之间。图案清晰、特征明显→0.8以上；模糊、遮挡→0.5以下。

【输出格式】
直接输出纯 JSON，第一个字符必须是 {，最后一个字符必须是 }。不要输出任何思考过程、解释文字、markdown 标记或代码块标记：
{
  "name": "string",
  "type": "enum_value",
  "color": "string",
  "colorHex": "#RRGGBB",
  "colorFamily": "enum_value",
  "seasons": ["enum_value"],
  "occasions": ["enum_value"],
  "style": "enum_value",
  "maintenance": "enum_value",
  "tags": ["string"],
  "brand": "string或null",
  "confidence": 0.0
}

【注意事项】
1. 如果图片中有多件衣物，只识别主体（面积最大或居中）的那件。
2. 如果图片不是衣物，返回 {"error": "图片中未识别到衣物"}。
3. type 字段必须从23个枚举值中选择，不可返回其他值。
4. seasons 和 occasions 根据衣物特征客观判断，不要默认全选。
5. color 取主体最大面积的纯色，印花衣物取底色。
6. tags 要具体有辨识度，避免"好看""实用"等主观词。`,A=new Set(Object.values(a)),w=new Set(Object.values(c)),v=new Set(Object.values(d)),b=new Set(Object.values(O)),C=new Set(Object.values(i)),I=new Set(Object.values(l));function N(t){const n=t.match(/```(?:json)?\s*([\s\S]*?)```/);if(n)return n[1].trim();const e=t.indexOf("{"),r=t.lastIndexOf("}");return e!==-1&&r!==-1&&r>e?t.slice(e,r+1):t.trim()}function F(t){const n=N(t);let e;try{e=JSON.parse(n)}catch{throw new Error("模型返回内容无法解析为 JSON")}if(typeof e.error=="string")throw new Error(e.error);const r=typeof e.type=="string"&&A.has(e.type)?e.type:a.TOP_TSHIRT,o=typeof e.color=="string"&&e.color.trim()?e.color.trim():"未知颜色",m=typeof e.colorHex=="string"&&/^#[0-9a-fA-F]{6}$/.test(e.colorHex)?e.colorHex:"#CCCCCC",y=typeof e.colorFamily=="string"&&w.has(e.colorFamily)?e.colorFamily:c.NEUTRAL,p=Array.isArray(e.seasons)?e.seasons.filter(s=>typeof s=="string"&&v.has(s)):[],u=Array.isArray(e.occasions)?e.occasions.filter(s=>typeof s=="string"&&b.has(s)):[],g=typeof e.style=="string"&&C.has(e.style)?e.style:i.CASUAL,_=typeof e.maintenance=="string"&&I.has(e.maintenance)?e.maintenance:l.DAILY,f=Array.isArray(e.tags)?e.tags.filter(s=>typeof s=="string"&&!!s.trim()).map(s=>s.trim()).slice(0,8):[],S=typeof e.brand=="string"&&e.brand.trim()?e.brand.trim():null,h=typeof e.confidence=="number"?Math.max(0,Math.min(1,e.confidence)):.5;return{name:typeof e.name=="string"&&e.name.trim()?e.name.trim().slice(0,20):`${o}${r}`,type:r,color:o,colorHex:m,colorFamily:y,seasons:p,occasions:u,style:g,maintenance:_,tags:f,brand:S,confidence:h}}export{x as RECOGNITION_PROMPT,F as parseRecognitionResponse};
