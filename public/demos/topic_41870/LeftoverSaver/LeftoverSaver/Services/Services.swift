import Foundation
import UIKit

// MARK: - AI 服务
class AIService: ObservableObject {
    static let shared = AIService()
    
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    private let apiKey = "sk-ws-H.RPLRXYX.hEcO.MEUCIQC..."
    private let baseURL = "https://dashscope.aliyuncs.com/compatible-mode/v1"
    
    // 识别食材
    func recognizeIngredients(imageData: Data, mode: String) async -> [Ingredient] {
        isLoading = true
        defer { isLoading = false }
        
        let base64Image = imageData.base64EncodedString()
        let prompt = mode == "leftover"
            ? "识别图中剩菜菜品名（已做好的菜，不是生食材）。返回JSON:{\"ingredients\":[{\"name\":\"菜名\",\"quantity\":\"份量\",\"confidence\":0.0}]}"
            : "识别图中生食材。返回JSON:{\"ingredients\":[{\"name\":\"食材名\",\"quantity\":\"份量\",\"confidence\":0.0}]}"
        
        do {
            let result = try await callVisionAPI(imageBase64: base64Image, prompt: prompt)
            
            // 解析 JSON 结果
            if let data = result.data(using: .utf8) {
                let json = try JSONSerialization.jsonObject(with: data) as? [String: Any]
                if let ingredients = json?["ingredients"] as? [[String: Any]] {
                    return ingredients.compactMap { dict in
                        guard let name = dict["name"] as? String else { return nil }
                        return Ingredient(
                            name: name,
                            quantity: dict["quantity"] as? String,
                            confidence: dict["confidence"] as? Double ?? 0.9
                        )
                    }
                }
            }
            
            // 如果解析失败，返回 Mock 数据
            return mockIngredients(for: mode)
        } catch {
            print("AI 识别失败，使用 Mock 数据: \(error.localizedDescription)")
            return mockIngredients(for: mode)
        }
    }
    
    // 生成菜谱
    func generateRecipes(ingredients: [Ingredient], mode: String, budget: Double?) async -> [Recipe] {
        isLoading = true
        defer { isLoading = false }
        
        // 模拟 API 延迟
        try? await Task.sleep(nanoseconds: 800_000_000)
        
        var recipes = Recipe.mockRecipes(for: mode)
        
        // 预算过滤
        if let budget = budget, budget > 0 {
            recipes = recipes.filter { recipe in
                // 简单的预算模拟逻辑
                let estimatedCost = Double(recipe.missing.count) * 8 + Double(recipe.cookingTime) / 5
                return estimatedCost <= budget
            }
        }
        
        return recipes
    }
    
    // 调用视觉 AI
    private func callVisionAPI(imageBase64: String, prompt: String) async throws -> String {
        let url = URL(string: "\(baseURL)/chat/completions")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body: [String: Any] = [
            "model": "qwen-vl-plus",
            "messages": [
                [
                    "role": "user",
                    "content": [
                        ["type": "text", "text": prompt],
                        ["type": "image_url", "image_url": ["url": "data:image/jpeg;base64,\(imageBase64)"]]
                    ]
                ]
            ],
            "max_tokens": 200
        ]
        
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
            throw NSError(domain: "AIService", code: -1, userInfo: [NSLocalizedDescriptionKey: "API 请求失败"])
        }
        
        let json = try JSONSerialization.jsonObject(with: data) as? [String: Any]
        if let choices = json?["choices"] as? [[String: Any]],
           let firstChoice = choices.first,
           let message = firstChoice["message"] as? [String: Any],
           let content = message["content"] as? String {
            return content
        }
        
        throw NSError(domain: "AIService", code: -2, userInfo: [NSLocalizedDescriptionKey: "解析响应失败"])
    }
    
    // Mock 数据
    private func mockIngredients(for mode: String) -> [Ingredient] {
        if mode == "leftover" {
            return [
                Ingredient(name: "红烧肉", quantity: "半碗", confidence: 0.98),
                Ingredient(name: "炒青菜", quantity: "一小碟", confidence: 0.92),
                Ingredient(name: "米饭", quantity: "一碗", confidence: 0.95)
            ]
        } else {
            return [
                Ingredient(name: "番茄", quantity: "2个", confidence: 0.98),
                Ingredient(name: "鸡蛋", quantity: "3个", confidence: 0.95),
                Ingredient(name: "葱花", quantity: "少许", confidence: 0.88)
            ]
        }
    }
}

// MARK: - 购物车服务
class CartService: ObservableObject {
    static let shared = CartService()
    
    @Published var items: [CartItem] = []
    
    var total: Double {
        items.reduce(0) { $0 + ($1.price * Double($1.quantity)) }
    }
    
    var count: Int {
        items.reduce(0) { $0 + $1.quantity }
    }
    
    func addItem(_ name: String) {
        if let index = items.firstIndex(where: { $0.name == name }) {
            items[index].quantity += 1
        } else {
            items.append(CartItem(name: name, quantity: 1, price: Double.random(in: 5...15)))
        }
    }
    
    func removeItem(at index: Int) {
        guard index >= 0 && index < items.count else { return }
        if items[index].quantity > 1 {
            items[index].quantity -= 1
        } else {
            items.remove(at: index)
        }
    }
    
    func checkout() -> Bool {
        // 模拟结算
        items.removeAll()
        return true
    }
}
