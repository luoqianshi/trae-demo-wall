import SwiftUI

struct ContentView: View {
    @State private var selectedTab = 0
    
    var body: some View {
        TabView(selection: $selectedTab) {
            HomeView()
                .tabItem {
                    Image(systemName: "house.fill")
                    Text("首页")
                }
                .tag(0)
            
            TransformView()
                .tabItem {
                    Image(systemName: "sparkles")
                    Text("改造")
                }
                .tag(1)
            
            FridgeView()
                .tabItem {
                    Image(systemName: "snowflake")
                    Text("冰箱")
                }
                .tag(2)
            
            CartView()
                .tabItem {
                    Image(systemName: "cart.fill")
                    Text("购物车")
                }
                .tag(3)
            
            ProfileView()
                .tabItem {
                    Image(systemName: "person.fill")
                    Text("我的")
                }
                .tag(4)
        }
        .tint(.orange)
    }
}

#Preview {
    ContentView()
}
