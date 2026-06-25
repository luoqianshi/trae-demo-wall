import Foundation

// MARK: - 食材模型
struct Ingredient: Identifiable, Codable, Hashable {
    let id = UUID()
    var name: String
    var quantity: String?
    var confidence: Double
    
    enum CodingKeys: String, CodingKey {
        case name, quantity, confidence
    }
}

// MARK: - 菜谱模型
struct Recipe: Identifiable, Codable, Hashable {
    let id = UUID()
    var title: String
    var description: String?
    var matchScore: Double
    var available: [String]
    var missing: [MissingIngredient]
    var cookingTime: Int
    var difficulty: String
    var steps: [CookingStep]
    var nutrition: String?
    var transformTip: String?
    
    struct MissingIngredient: Identifiable, Codable, Hashable {
        let id = UUID()
        var name: String
        var substitute: String?
        var isOptional: Bool
        
        enum CodingKeys: String, CodingKey {
            case name, substitute, isOptional
        }
    }
    
    struct CookingStep: Identifiable, Codable, Hashable {
        let id = UUID()
        var step: Int
        var action: String
        var description: String
        var duration: Int?
        var tip: String?
        
        enum CodingKeys: String, CodingKey {
            case step, action, description, duration, tip
        }
    }
    
    // Mock 数据
    static func mockRecipes(for mode: String) -> [Recipe] {
        if mode == "leftover" {
            return [
                Recipe(
                    title: "红烧肉面",
                    description: "将红烧肉变成一碗热腾腾的面条，简单又美味",
                    matchScore: 1.0,
                    available: ["红烧肉", "米饭"],
                    missing: [MissingIngredient(name: "面条", substitute: nil, isOptional: false)],
                    cookingTime: 15,
                    difficulty: "简单",
                    steps: [
                        CookingStep(step: 1, action: "煮面", description: "锅中烧水，下面条煮至八分熟捞出", duration: 180, tip: "加少许盐防粘"),
                        CookingStep(step: 2, action: "热红烧肉", description: "红烧肉连汤汁加热至沸腾", duration: 90, tip: "小火慢热更入味"),
                        CookingStep(step: 3, action: "组合", description: "面条放入碗中，浇上红烧肉和汤汁", duration: 30, tip: "可加青菜点缀")
                    ],
                    nutrition: "蛋白质 25g | 碳水 45g | 脂肪 12g",
                    transformTip: "剩菜变身：从单一菜品变成主食"
                ),
                Recipe(
                    title: "肉末炒饭",
                    description: "红烧肉切碎炒饭，粒粒分明",
                    matchScore: 0.9,
                    available: ["红烧肉"],
                    missing: [
                        MissingIngredient(name: "米饭", substitute: nil, isOptional: false),
                        MissingIngredient(name: "鸡蛋", substitute: nil, isOptional: true)
                    ],
                    cookingTime: 12,
                    difficulty: "简单",
                    steps: [
                        CookingStep(step: 1, action: "准备食材", description: "红烧肉切成小丁，米饭打散", duration: 120, tip: "冷饭更不易粘锅"),
                        CookingStep(step: 2, action: "炒蛋", description: "热锅下油，鸡蛋打散炒熟盛出", duration: 60, tip: "油温七成热时下蛋"),
                        CookingStep(step: 3, action: "炒饭", description: "下肉丁炒香，加米饭翻炒", duration: 180, tip: "大火快炒更香")
                    ],
                    nutrition: "蛋白质 20g | 碳水 55g | 脂肪 15g",
                    transformTip: "剩菜变身：从大块肉类变成炒饭配料"
                ),
                Recipe(
                    title: "蔬菜粥",
                    description: "清淡营养的早餐选择",
                    matchScore: 0.85,
                    available: ["炒青菜"],
                    missing: [
                        MissingIngredient(name: "大米", substitute: nil, isOptional: false)
                    ],
                    cookingTime: 30,
                    difficulty: "简单",
                    steps: [
                        CookingStep(step: 1, action: "煮粥底", description: "大米洗净加水煮开", duration: 900, tip: "水米比例 10:1"),
                        CookingStep(step: 2, action: "加入青菜", description: "粥煮至浓稠时加入切好的青菜", duration: 300, tip: "青菜最后放保持颜色"),
                        CookingStep(step: 3, action: "调味", description: "加盐、胡椒粉调味即可", duration: 60, tip: "可滴几滴香油提味")
                    ],
                    nutrition: "蛋白质 8g | 碳水 40g | 脂肪 3g | 维生素丰富",
                    transformTip: "剩菜变身：从配菜变成主角"
                )
            ]
        } else {
            return [
                Recipe(
                    title: "番茄炒蛋",
                    description: "经典家常菜，酸甜可口",
                    matchScore: 1.0,
                    available: ["番茄", "鸡蛋"],
                    missing: [],
                    cookingTime: 10,
                    difficulty: "简单",
                    steps: [
                        CookingStep(step: 1, action: "备菜", description: "番茄切块，鸡蛋打散", duration: 120, tip: "番茄划十字烫一下去皮更好吃"),
                        CookingStep(step: 2, action: "炒蛋", description: "热锅多油，蛋液倒入炒至凝固盛出", duration: 60, tip: "油要稍多一些"),
                        CookingStep(step: 3, action: "炒番茄", description: "底油炒番茄出汁，加盐糖调味", duration: 180, tip: "加一勺番茄酱更浓郁"),
                        CookingStep(step: 4, action: "合炒", description: "倒入鸡蛋翻炒均匀出锅", duration: 30, tip: "撒葱花点缀")
                    ],
                    nutrition: "蛋白质 15g | 碳水 10g | 脂肪 12g | 维生素C丰富"
                )
            ]
        }
    }
}

// MARK: - 购物车项
struct CartItem: Identifiable, Codable, Hashable {
    let id = UUID()
    var name: String
    var quantity: Int
    var price: Double
}

// MARK: - 冰箱物品
struct FridgeItem: Identifiable, Codable, Hashable {
    let id = UUID()
    var name: String
    var category: String
    var addedDate: Date
    var expiryDate: Date?
    var quantity: String
}
