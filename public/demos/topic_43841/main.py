"""
恶魔的代价 - 破案游戏主程序
"""
import pygame
import sys
from evidence import init_evidences
from suspect import init_suspects
from scene import (
    TitleScene, IntroScene, CrimeScene, BasementScene,
    StudyScene, OfficeScene, InterviewScene, BoardScene, EndingScene
)

# 初始化 Pygame
pygame.init()

# 屏幕设置
SCREEN_WIDTH = 800
SCREEN_HEIGHT = 600
FPS = 60


class Game:
    """游戏主类"""
    def __init__(self):
        self.screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
        pygame.display.set_caption("恶魔的代价 - 破案游戏")
        self.clock = pygame.time.Clock()
        self.running = True
        
        # 字体设置
        self.font = pygame.font.SysFont("simhei", 24)
        self.small_font = pygame.font.SysFont("simhei", 18)
        self.title_font = pygame.font.SysFont("simhei", 48)
        
        # 游戏数据
        self.evidence_board = init_evidences()
        self.suspects = init_suspects()
        
        # 场景管理
        self.scenes = {}
        self.current_scene = None
        self.init_scenes()
        self.change_scene("title")
    
    def init_scenes(self):
        """初始化所有场景"""
        self.scenes["title"] = TitleScene(self)
        self.scenes["intro"] = IntroScene(self)
        self.scenes["crime_scene"] = CrimeScene(self)
        self.scenes["basement"] = BasementScene(self)
        self.scenes["study"] = StudyScene(self)
        self.scenes["office"] = OfficeScene(self)
        self.scenes["interview"] = InterviewScene(self)
        self.scenes["board"] = BoardScene(self)
        self.scenes["ending"] = EndingScene(self)
    
    def change_scene(self, scene_name):
        """切换场景"""
        if scene_name in self.scenes:
            self.current_scene = self.scenes[scene_name]
    
    def run(self):
        """主循环"""
        while self.running:
            # 事件处理
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    self.running = False
                elif self.current_scene:
                    self.current_scene.handle_event(event)
            
            # 更新
            if self.current_scene:
                self.current_scene.update()
            
            # 绘制
            if self.current_scene:
                self.current_scene.draw()
            
            pygame.display.flip()
            self.clock.tick(FPS)
        
        pygame.quit()
        sys.exit()


def main():
    """入口函数"""
    print("=" * 50)
    print("恶魔的代价 - 破案游戏")
    print("=" * 50)
    print("操作说明：")
    print("  ↑↓ - 选择选项")
    print("  ←→ - 在证据板中选择第二个线索")
    print("  回车 - 确认")
    print("  ESC - 返回/取消")
    print("  1/2/3 - 切换模式（调查/检查/移动）")
    print("  B - 打开证据板（审问时）")
    print("=" * 50)
    
    game = Game()
    game.run()


if __name__ == "__main__":
    main()
