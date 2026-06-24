import SwiftUI
import PhotosUI

// MARK: - 首页视图
struct HomeView: View {
    @StateObject private var aiService = AIService.shared
    @State private var showPhotoPicker = false
    @State private var selectedPhoto: PhotosPickerItem?
    @State private var selectedImage: Image?
    @State private var imageData: Data?
    @State private var ingredients: [Ingredient] = []
    @State private var recipes: [Recipe] = []
    @State private var showRecipes = false
    @State private var showTransformAnimation = false
    @State private var showAchievement = false
    @State private var currentMode = "leftover"
    @State private var budgetText = ""
    @State private var isRecognizing = false
    @State private var isGenerating = false
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    // 问候卡片
                    greetingCard
                    
                    // 统计数据
                    statsRow
                    
                    // 模式切换
                    modeSwitcher
                    
                    // 上传区域
                    uploadSection
                    
                    // 食材识别结果
                    if !ingredients.isEmpty {
                        ingredientsSection
                    }
                    
                    // 菜谱列表
                    if showRecipes && !recipes.isEmpty {
                        recipesSection
                    }
                }
                .padding(16)
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle("剩菜救星")
            .navigationBarTitleDisplayMode(.large)
        }
        .photosPicker(isPresented: $showPhotoPicker, selection: $selectedPhoto, matching: .images)
        .onChange(of: selectedPhoto) { _, newValue in
            Task {
                if let data = try? await newValue?.loadTransferable(type: Data.self) {
                    imageData = data
                    selectedImage = Image(uiImage: UIImage(data: data) ?? UIImage())
                    await recognizeImage()
                }
            }
        }
        .fullScreenCover(isPresented: $showTransformAnimation) {
            TransformAnimationView()
        }
        .alert("🏆 首次改造", isPresented: $showAchievement) {
            Button("太棒了！") {}
        } message: {
            Text("恭喜完成第一次剩菜改造！")
        }
    }
    
    // MARK: - 问候卡片
    private var greetingCard: some View {
        HStack(spacing: 16) {
            Circle()
                .fill(.white.opacity(0.3))
                .frame(width: 56, height: 56)
                .overlay(
                    Text("👨‍🍳")
                        .font(.system(size: 28))
                )
            
            VStack(alignment: .leading, spacing: 4) {
                Text("你好，美食家！")
                    .font(.subheadline)
                    .foregroundColor(.white.opacity(0.9))
                Text("今天想做什么？")
                    .font(.title2.bold())
                    .foregroundColor(.white)
            }
            
            Spacer()
            
            VStack(spacing: 2) {
                Text("7")
                    .font(.title2.bold())
                    .foregroundColor(.white)
                Text("天连续")
                    .font(.caption2)
                    .foregroundColor(.white.opacity(0.8))
            }
        }
        .padding(20)
        .background(
            LinearGradient(
                colors: [.orange, .red, .purple],
                startPoint: .leading,
                endPoint: .trailing
            )
        )
        .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
        .shadow(color: .orange.opacity(0.3), radius: 10, y: 5)
    }
    
    // MARK: - 统计行
    private var statsRow: some View {
        HStack(spacing: 12) {
            StatCard(icon: "🍽️", value: "23", label: "已改造")
            StatCard(icon: "💰", value: "¥156", label: "已节省")
            StatCard(icon: "♻️", value: "4.2kg", label: "减少浪费")
        }
    }
    
    // MARK: - 模式切换
    private var modeSwitcher: some View {
        HStack(spacing: 0) {
            Button(action: { currentMode = "leftover" }) {
                Text("🍱 剩菜改造")
                    .font(.subheadline.weight(.semibold))
                    .foregroundColor(currentMode == "leftover" ? .white : .gray)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .background(
                        RoundedRectangle(cornerRadius: 16, style: .continuous)
                            .fill(currentMode == "leftover" ? Color.orange : Color.clear)
                    )
            }
            
            Button(action: { currentMode = "fresh" }) {
                Text("🥬 生食材")
                    .font(.subheadline.weight(.semibold))
                    .foregroundColor(currentMode == "fresh" ? .white : .gray)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .background(
                        RoundedRectangle(cornerRadius: 16, style: .continuous)
                            .fill(currentMode == "fresh" ? Color.green : Color.clear)
                    )
                    .animation(.easeInOut(duration: 0.25), value: currentMode)
            }
        }
        .padding(4)
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
    }
    
    // MARK: - 上传区域
    private var uploadSection: some View {
        VStack(spacing: 16) {
            if isRecognizing {
                // 加载状态
                VStack(spacing: 16) {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: .orange))
                        .scaleEffect(1.5)
                    
                    Text("AI 正在识别...")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 40)
                .background(Color(.secondarySystemBackground))
                .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
            } else if let image = selectedImage {
                image
                    .resizable()
                    .scaledToFill()
                    .frame(height: 200)
                    .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                    .overlay(
                        RoundedRectangle(cornerRadius: 16, style: .continuous)
                            .stroke(Color.orange.opacity(0.3), lineWidth: 2)
                    )
            } else {
                Button(action: { showPhotoPicker = true }) {
                    VStack(spacing: 16) {
                        Image(systemName: "camera.fill")
                            .font(.system(size: 48))
                            .foregroundColor(.orange)
                        
                        Text("拍照或选择图片")
                            .font(.headline)
                            .foregroundColor(.primary)
                        
                        Text("自动识别食材/剩菜")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 40)
                    .background(Color(.secondarySystemBackground))
                    .overlay(
                        RoundedRectangle(cornerRadius: 16, style: .continuous)
                            .stroke(style: StrokeStyle(lineWidth: 2, dash: [8]))
                            .foregroundColor(.orange.opacity(0.5))
                    )
                    .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                }
            }
            
            // 生成按钮
            if !ingredients.isEmpty && !isRecognizing {
                Button(action: generateRecipes) {
                    HStack {
                        if isGenerating {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: .white))
                        } else {
                            Text("✨ 生成改造方案")
                                .font(.headline)
                            Image(systemName: "arrow.right")
                        }
                    }
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .background(
                        LinearGradient(colors: [.orange, .red], startPoint: .leading, endPoint: .trailing)
                    )
                    .clipShape(Capsule())
                }
                .disabled(isGenerating)
                
                // 预算输入
                HStack {
                    Image(systemName: "yensign.circle")
                        .foregroundColor(.green)
                    TextField("预算（元）", text: $budgetText)
                        .keyboardType(.numberPad)
                }
                .padding(12)
                .background(Color(.tertiarySystemBackground))
                .cornerRadius(12)
            }
        }
    }
    
    // MARK: - 食材结果
    private var ingredientsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("📸 识别结果")
                    .font(.headline)
                Spacer()
                Text("AI 识别")
                    .font(.caption)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 4)
                    .background(Color.blue.opacity(0.15))
                    .foregroundColor(.blue)
                    .clipShape(Capsule())
            }
            
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
                ForEach(ingredients) { ingredient in
                    HStack(spacing: 6) {
                        Circle()
                            .fill(Color.orange.opacity(0.2))
                            .frame(width: 8, height: 8)
                        
                        Text(ingredient.name)
                            .font(.subheadline)
                        
                        if let qty = ingredient.quantity {
                            Text("· \(qty)")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                    .padding(.horizontal, 14)
                    .padding(.vertical, 10)
                    .background(Color(.tertiarySystemBackground))
                    .clipShape(Capsule())
                }
            }
        }
        .padding(16)
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
    }
    
    // MARK: - 菜谱列表
    private var recipesSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("📖 推荐菜谱")
                    .font(.headline)
                Spacer()
                Text("\(recipes.count) 道菜")
                    .font(.caption)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 4)
                    .background(Color.orange.opacity(0.15))
                    .foregroundColor(.orange)
                    .clipShape(Capsule())
            }
            
            ForEach(recipes) { recipe in
                NavigationLink(destination: RecipeDetailView(recipe: recipe)) {
                    RecipeCard(recipe: recipe)
                }
            }
        }
        .padding(16)
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
    }
    
    // MARK: - 方法
    private func recognizeImage() async {
        guard let data = imageData else { return }
        
        isRecognizing = true
        
        ingredients = await aiService.recognizeIngredients(imageData: data, mode: currentMode)
        
        isRecognizing = false
        
        // 触感反馈
        let generator = UIImpactFeedbackGenerator(style: .medium)
        generator.impactOccurred()
    }
    
    private func generateRecipes() {
        isGenerating = true
        
        // 触感反馈
        let generator = UIImpactFeedbackGenerator(style: .medium)
        generator.impactOccurred()
        
        withAnimation(.spring(response: 0.5)) {
            showTransformAnimation = true
        }
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
            Task {
                let budget = Double(budgetText)
                recipes = await aiService.generateRecipes(ingredients: ingredients, mode: currentMode, budget: budget)
                showRecipes = true
                isGenerating = false
                
                // 延迟显示成就
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                    showAchievement = true
                }
            }
        }
    }
}

// MARK: - 统计卡片
struct StatCard: View {
    let icon: String
    let value: String
    let label: String
    
    var body: some View {
        VStack(spacing: 6) {
            Text(icon)
                .font(.title2)
            Text(value)
                .font(.title3.bold())
            Text(label)
                .font(.caption2)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 14)
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
    }
}

// MARK: - 菜谱卡片
struct RecipeCard: View {
    let recipe: Recipe
    
    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            // 标题行
            HStack {
                Text(recipe.title)
                    .font(.headline)
                
                Spacer()
                
                Text("匹配 \(Int(recipe.matchScore * 100))%")
                    .font(.caption)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 4)
                    .background(Color.green.opacity(0.15))
                    .foregroundColor(.green)
                    .clipShape(Capsule())
            }
            
            // 描述
            if let desc = recipe.description {
                Text(desc)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .lineLimit(2)
            }
            
            // 元信息
            HStack(spacing: 16) {
                Label("\(recipe.cookingTime)分钟", systemImage: "clock")
                Label(recipe.difficulty, systemImage: "chart.bar")
            }
            .font(.caption)
            .foregroundColor(.secondary)
            
            // 营养信息
            if let nutrition = recipe.nutrition {
                Text("🥗 \(nutrition)")
                    .font(.caption2)
                    .padding(8)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color.green.opacity(0.08))
                    .foregroundColor(.green)
                    .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
            }
            
            // 操作按钮
            HStack(spacing: 10) {
                ActionButton(title: "❤️ 收藏") {}
                ActionButton(title: "📤 分享") {}
                ActionButton(title: "🛒 购买") {
                    CartService.shared.addItem("面条")
                }
            }
        }
        .padding(16)
        .background(Color(.tertiarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
    }
}

struct ActionButton: View {
    let title: String
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.caption)
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background(Color(.secondarySystemBackground))
                .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
        }
    }
}
