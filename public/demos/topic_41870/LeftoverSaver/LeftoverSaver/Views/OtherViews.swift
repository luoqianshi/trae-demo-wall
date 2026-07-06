import SwiftUI

// MARK: - 改造页视图
struct TransformView: View {
    @State private var selectedMode = "leftover"
    @State private var ingredients: [Ingredient] = []
    @State private var recipes: [Recipe] = []
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    // 模式切换
                    Picker("模式", selection: $selectedMode) {
                        Text("🍱 剩菜改造").tag("leftover")
                        Text("🥬 生食材").tag("fresh")
                    }
                    .pickerStyle(.segmented)
                    
                    // AI 大厨对话
                    VStack(alignment: .leading, spacing: 8) {
                        HStack(spacing: 10) {
                            Image(systemName: "chef_hat.fill")
                                .font(.title2)
                                .foregroundColor(.orange)
                            Text("AI 大厨")
                                .font(.headline)
                        }
                        
                        Text(aiChefMessage)
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .padding(12)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(Color(.tertiarySystemBackground))
                            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                    }
                    
                    // 上传区域
                    uploadSection
                    
                    // 菜谱列表
                    if !recipes.isEmpty {
                        recipeList
                    }
                }
                .padding(16)
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle("剩菜改造")
        }
    }
    
    private var aiChefMessage: String {
        if ingredients.isEmpty {
            return "👋 你好！我是你的 AI 大厨助手。拍张照片，我来帮你变魔术～"
        } else {
            let names = ingredients.map { $0.name }.joined(separator: "、")
            return "哇！你有\(names)，让我想想怎么变身... 🤔"
        }
    }
    
    private var uploadSection: some View {
        Button(action: loadSampleImage) {
            VStack(spacing: 16) {
                Image(systemName: "photo.on.rectangle.angled")
                    .font(.system(size: 48))
                    .foregroundColor(selectedMode == "leftover" ? .orange : .green)
                
                Text("点击体验 Demo")
                    .font(.headline)
                
                Text(selectedMode == "leftover" ? "示例：红烧肉 + 炒青菜" : "示例：番茄 + 鸡蛋")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 40)
            .background(Color(.secondarySystemBackground))
            .overlay(
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .stroke(style: StrokeStyle(lineWidth: 2, dash: [8]))
                    .foregroundColor(selectedMode == "leftover" ? .orange.opacity(0.5) : .green.opacity(0.5))
            )
            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
        }
    }
    
    private var recipeList: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("📖 推荐菜谱 (\(recipes.count))")
                .font(.headline)
            
            ForEach(recipes) { recipe in
                NavigationLink(destination: RecipeDetailView(recipe: recipe)) {
                    RecipeCard(recipe: recipe)
                }
            }
        }
    }
    
    private func loadSampleImage() {
        withAnimation(.spring(response: 0.4)) {
            if selectedMode == "leftover" {
                ingredients = [
                    Ingredient(name: "红烧肉", quantity: "半碗", confidence: 0.98),
                    Ingredient(name: "炒青菜", quantity: "一小碟", confidence: 0.92),
                    Ingredient(name: "米饭", quantity: "一碗", confidence: 0.95)
                ]
            } else {
                ingredients = [
                    Ingredient(name: "番茄", quantity: "2个", confidence: 0.98),
                    Ingredient(name: "鸡蛋", quantity: "3个", confidence: 0.95)
                ]
            }
        }
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
            withAnimation(.spring(response: 0.4)) {
                recipes = Recipe.mockRecipes(for: selectedMode)
            }
        }
        
        let generator = UIImpactFeedbackGenerator(style: .medium)
        generator.impactOccurred()
    }
}

// MARK: - 冰箱视图
struct FridgeView: View {
    @State private var fridgeItems: [FridgeItem] = sampleFridgeItems
    
    var body: some View {
        NavigationStack {
            List {
                Section(header: Text("冰箱时间线")) {
                    ForEach(fridgeItems) { item in
                        FridgeRow(item: item)
                    }
                    .onDelete(perform: deleteItems)
                }
            }
            .navigationTitle("我的冰箱")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: addItem) {
                        Image(systemName: "plus.circle.fill")
                            .font(.title2)
                            .foregroundColor(.orange)
                    }
                }
            }
        }
    }
    
    private func deleteItems(at offsets: IndexSet) {
        fridgeItems.remove(atOffsets: offsets)
    }
    
    private func addItem() {
        let newItem = FridgeItem(
            name: "新食材",
            category: "其他",
            addedDate: Date(),
            expiryDate: Calendar.current.date(byAdding: .day, value: 7, to: Date()),
            quantity: "1份"
        )
        fridgeItems.insert(newItem, at: 0)
        
        let generator = UIImpactFeedbackGenerator(style: .light)
        generator.impactOccurred()
    }
}

// MARK: - 冰箱行
struct FridgeRow: View {
    let item: FridgeItem
    
    var body: some View {
        HStack(spacing: 12) {
            // 图标
            Circle()
                .fill(iconColor.opacity(0.2))
                .frame(width: 44, height: 44)
                .overlay(
                    Text(categoryIcon)
                        .font(.title2)
                )
            
            // 信息
            VStack(alignment: .leading, spacing: 4) {
                Text(item.name)
                    .font(.subheadline.weight(.semibold))
                
                HStack(spacing: 8) {
                    Label(item.quantity, systemImage: "cube")
                    Label(daysSinceAdded, systemImage: "clock")
                }
                .font(.caption2)
                .foregroundColor(.secondary)
            }
            
            Spacer()
            
            // 过期状态
            if isExpiringSoon {
                Text("即将过期")
                    .font(.caption2)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color.orange.opacity(0.15))
                    .foregroundColor(.orange)
                    .clipShape(Capsule())
            }
        }
        .padding(.vertical, 6)
    }
    
    private var iconColor: Color {
        switch item.category {
        case "蔬菜": return .green
        case "肉类": return .red
        case "海鲜": return .blue
        default: return .gray
        }
    }
    
    private var categoryIcon: String {
        switch item.category {
        case "蔬菜": return "🥬"
        case "肉类": return "🥩"
        case "海鲜": return "🐟"
        default: return "📦"
        }
    }
    
    private var daysSinceAdded: String {
        let days = Calendar.current.dateComponents([.day], from: item.addedDate, to: Date()).day ?? 0
        return "\(days)天前"
    }
    
    private var isExpiringSoon: Bool {
        guard let expiry = item.expiryDate else { return false }
        let daysUntilExpiry = Calendar.current.dateComponents([.day], from: Date(), to: expiry).day ?? 0
        return daysUntilExpiry <= 3 && daysUntilExpiry > 0
    }
}

// MARK: - 个人中心视图
struct ProfileView: View {
    @State private var points = 1280
    @State private var streak = 7
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    // 用户卡片
                    userCard
                    
                    // 积分统计
                    pointsCard
                    
                    // 成就徽章
                    achievementsGrid
                    
                    // 功能入口
                    functionList
                }
                .padding(16)
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle("我的")
        }
    }
    
    private var userCard: some View {
        HStack(spacing: 16) {
            Circle()
                .fill(
                    LinearGradient(colors: [.purple, .pink], startPoint: .topLeading, endPoint: .bottomTrailing)
                )
                .frame(width: 70, height: 70)
                .overlay(
                    Text("🧑‍🍳")
                        .font(.system(size: 32))
                )
            
            VStack(alignment: .leading, spacing: 4) {
                Text("美食家")
                    .font(.title2.bold())
                Text("ID: LS20240621")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            Button(action: {}) {
                Text("编辑资料")
                    .font(.subheadline)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 8)
                    .background(Color(.tertiarySystemBackground))
                    .clipShape(Capsule())
            }
        }
        .padding(18)
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
    }
    
    private var pointsCard: some View {
        HStack(spacing: 1) {
            StatBox(value: "\(points)", label: "总积分", color: .orange)
            StatBox(value: "\(streak)", label: "连续天数", color: .green)
            StatBox(value: "23", label: "已改造", color: .blue)
            StatBox(value: "¥156", label: "已节省", color: .purple)
        }
    }
    
    private var achievementsGrid: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("成就徽章")
                .font(.headline)
            
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                AchievementBadge(icon: "🏆", title: "首次改造", unlocked: true)
                AchievementBadge(icon: "🔥", title: "连续7天", unlocked: true)
                AchievementBadge(icon: "💰", title: "省钱达人", unlocked: false)
                AchievementBadge(icon: "♻️", title: "环保先锋", unlocked: false)
                AchievementBadge(icon: "⭐", title: "五星大厨", unlocked: false)
                AchievementBadge(icon: "🎯", title: "完美匹配", unlocked: false)
            }
        }
    }
    
    private var functionList: some View {
        VStack(spacing: 1) {
            FunctionRow(icon: "gearshape", title: "设置") {}
            FunctionRow(icon: "questionmark.circle", title: "帮助与反馈") {}
            FunctionRow(icon: "star.fill", title: "给我们评分") {}
            FunctionRow(info: Text("版本 1.0.0"), title: "关于") {}
        }
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
    }
}

// MARK: - 组件
struct StatBox: View {
    let value: String
    let label: String
    let color: Color
    
    var body: some View {
        VStack(spacing: 6) {
            Text(value)
                .font(.title2.bold())
                .foregroundColor(color)
            Text(label)
                .font(.caption2)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 14)
        .background(Color(.tertiarySystemBackground))
    }
}

struct AchievementBadge: View {
    let icon: String
    let title: String
    let unlocked: Bool
    
    var body: some View {
        VStack(spacing: 6) {
            Text(icon)
                .font(.system(size: 28))
                .opacity(unlocked ? 1 : 0.3)
            Text(title)
                .font(.caption2)
                .foregroundColor(unlocked ? .primary : .secondary)
        }
        .padding(.vertical, 12)
        .background(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .fill(unlocked ? Color.orange.opacity(0.1) : Color(.tertiarySystemBackground))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .strokeBorder(unlocked ? Color.orange.opacity(0.3) : Color.clear)
        )
    }
}

struct FunctionRow: View {
    let icon: String?
    let info: AnyView?
    let title: String
    let action: () -> Void
    
    init(icon: String? = nil, title: String, action: @escaping () -> Void) {
        self.icon = icon
        self.info = nil
        self.title = title
        self.action = action
    }
    
    init<Content: View>(info: Content, title: String, action: @escaping () -> Void) {
        self.icon = nil
        self.info = AnyView(info)
        self.title = title
        self.action = action
    }
    
    var body: some View {
        Button(action: action) {
            HStack {
                if let icon = icon {
                    Image(systemName: icon)
                        .foregroundColor(.orange)
                        .frame(width: 24)
                } else if let info = info {
                    info
                        .foregroundColor(.secondary)
                }
                Text(title)
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 14)
        }
    }
}

// MARK: - 购物车视图
struct CartView: View {
    @StateObject private var cartService = CartService.shared
    @State private var showCheckoutSuccess = false
    
    var body: some View {
        NavigationStack {
            Group {
                if cartService.items.isEmpty {
                    emptyCartView
                } else {
                    cartListView
                }
            }
            .navigationTitle("购物车")
        }
        .alert("下单成功！", isPresented: $showCheckoutSuccess) {
            Button("好的") {}
        } message: {
            Text("预计 30 分钟送达 🎉")
        }
    }
    
    private var emptyCartView: some View {
        VStack(spacing: 20) {
            Spacer()
            Image(systemName: "cart")
                .font(.system(size: 64))
                .foregroundColor(.secondary.opacity(0.3))
            Text("购物车是空的")
                .font(.headline)
                .foregroundColor(.secondary)
            Text("去首页选择菜谱，一键购买缺少的食材")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
            Spacer()
        }
    }
    
    private var cartListView: some View {
        VStack(spacing: 0) {
            List {
                ForEach(Array(cartService.items.enumerated()), id: \.element.id) { index, item in
                    HStack {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(item.name)
                                .font(.subheadline.weight(.medium))
                            Text("¥\(String(format: "%.0f", item.price))/份")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                        
                        Spacer()
                        
                        // 数量控制
                        HStack(spacing: 12) {
                            Button(action: { cartService.removeItem(at: index) }) {
                                Image(systemName: "minus.circle.fill")
                                    .foregroundColor(.gray)
                            }
                            
                            Text("\(item.quantity)")
                                .font(.subheadline.weight(.semibold))
                                .frame(width: 24)
                            
                            Button(action: { cartService.addItem(item.name) }) {
                                Image(systemName: "plus.circle.fill")
                                    .foregroundColor(.orange)
                            }
                        }
                    }
                    .padding(.vertical, 4)
                }
            }
            .listStyle(.plain)
            
            // 结算栏
            VStack(spacing: 12) {
                Divider()
                
                HStack {
                    Text("合计")
                        .font(.subheadline)
                    Spacer()
                    Text("¥\(String(format: "%.0f", cartService.total))")
                        .font(.title2.bold())
                        .foregroundColor(.orange)
                }
                
                Button(action: checkout) {
                    Text("去结算")
                        .font(.headline)
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(
                            LinearGradient(colors: [.green, .mint], startPoint: .leading, endPoint: .trailing)
                        )
                        .clipShape(Capsule())
                }
            }
            .padding(16)
            .background(Color(.systemBackground))
        }
    }
    
    private func checkout() {
        let generator = UIImpactFeedbackGenerator(style: .heavy)
        generator.impactOccurred()
        
        showCheckoutSuccess = true
    }
}

// MARK: - 变身动画视图
struct TransformAnimationView: View {
    @Environment(\.dismiss) var dismiss
    @State private var phase: Int = 0
    
    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            
            VStack(spacing: 30) {
                switch phase {
                case 0:
                    Text("🍳")
                        .font(.system(size: 80))
                        .transition(.scale.combined(with: .opacity))
                case 1:
                    Text("✨ 剩菜变身中...")
                        .font(.title.bold())
                        .foregroundColor(.white)
                        .transition(.opacity)
                case 2:
                    Text("🎉")
                        .font(.system(size: 80))
                        .transition(.scale.combined(with: .opacity))
                default:
                    Text("变身完成！")
                        .font(.title.bold())
                        .foregroundColor(.white)
                        .transition(.opacity)
                }
                
                Text(phase < 2 ? "AI 正在施展魔法" : "")
                    .font(.subheadline)
                    .foregroundColor(.white.opacity(0.7))
            }
        }
        .onAppear {
            animatePhase()
        }
    }
    
    private func animatePhase() {
        withAnimation(.easeInOut(duration: 0.8)) {
            phase = 1
        }
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.2) {
            withAnimation(.spring(response: 0.5, dampingFraction: 0.6)) {
                phase = 2
            }
        }
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
            withAnimation(.easeInOut(duration: 0.3)) {
                phase = 3
            }
            
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                dismiss()
            }
        }
    }
}

// MARK: - 菜谱详情视图
struct RecipeDetailView: View {
    let recipe: Recipe
    @State private var showVoiceGuide = false
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                // 标题
                Text(recipe.title)
                    .font(.title.bold())
                
                // 元信息
                HStack(spacing: 20) {
                    Label("\(recipe.cookingTime)分钟", systemImage: "clock")
                    Label(recipe.difficulty, systemImage: "chart.bar")
                    Label("\(Int(recipe.matchScore * 100))% 匹配", systemImage: "checkmark.circle")
                }
                .font(.subheadline)
                .foregroundColor(.secondary)
                
                // 描述
                if let desc = recipe.description {
                    Text(desc)
                        .font(.body)
                        .foregroundColor(.secondary)
                }
                
                // 改造提示
                if let tip = recipe.transformTip {
                    HStack(spacing: 8) {
                        Image(systemName: "arrow.triangle.2.circlepath")
                            .foregroundColor(.orange)
                        Text(tip)
                            .font(.subheadline)
                    }
                    .padding(12)
                    .background(Color.orange.opacity(0.08))
                    .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                }
                
                // 烹饪步骤
                Text("烹饪步骤")
                    .font(.headline)
                
                ForEach(recipe.steps) { step in
                    StepRow(step: step)
                }
                
                // 语音指导按钮
                Button(action: { showVoiceGuide.toggle() }) {
                    HStack {
                        Image(systemName: "speaker.wave.2.fill")
                        Text(showVoiceGuide ? "停止语音" : "开启语音指导")
                    }
                    .font(.subheadline.weight(.semibold))
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .background(showVoiceGuide ? Color.red : Color.blue)
                    .clipShape(Capsule())
                }
            }
            .padding(16)
        }
        .navigationTitle("菜谱详情")
        .navigationBarTitleDisplayMode(.inline)
    }
}

// MARK: - 步骤行
struct StepRow: View {
    let step: Recipe.CookingStep
    
    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            ZStack {
                Circle()
                    .fill(Color.orange)
                    .frame(width: 28, height: 28)
                Text("\(step.step)")
                    .font(.caption.bold())
                    .foregroundColor(.white)
            }
            
            VStack(alignment: .leading, spacing: 4) {
                Text(step.action)
                    .font(.subheadline.weight(.semibold))
                Text(step.description)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                
                if let duration = step.duration {
                    Text("⏱ 约 \(duration / 60)分钟")
                        .font(.caption2)
                        .foregroundColor(.orange)
                }
                
                if let tip = step.tip {
                    Text("💡 \(tip)")
                        .font(.caption2)
                        .padding(8)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(Color.yellow.opacity(0.15))
                        .clipShape(RoundedRectangle(cornerRadius: 6, style: .continuous))
                }
            }
        }
        .padding(.vertical, 8)
    }
}

// MARK: - 示例数据
private var sampleFridgeItems: [FridgeItem] {
    [
        FridgeItem(name: "番茄", category: "蔬菜", addedDate: Date().addingTimeInterval(-86400), expiryDate: Date().addingTimeInterval(172800), quantity: "3个"),
        FridgeItem(name: "鸡蛋", category: "其他", addedDate: Date().addingTimeInterval(-259200), expiryDate: Date().addingTimeInterval(604800), quantity: "6个"),
        FridgeItem(name: "猪肉", category: "肉类", addedDate: Date().addingTimeInterval(-432000), expiryDate: Date().addingTimeInterval(259200), quantity: "500g"),
        FridgeItem(name: "青菜", category: "蔬菜", addedDate: Date().addingTimeInterval(-72000), expiryDate: Date().addingTimeInterval(216000), quantity: "1把"),
        FridgeItem(name: "米饭", category: "其他", addedDate: Date().addingTimeInterval(-3600), expiryDate: Date().addingTimeInterval(86400), quantity: "2碗")
    ]
}
