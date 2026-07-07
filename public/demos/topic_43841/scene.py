"""
场景系统 - 管理游戏场景和交互
"""
import pygame
from evidence import init_evidences
from suspect import init_suspects

# 颜色定义
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)
GRAY = (128, 128, 128)
DARK_GRAY = (64, 64, 64)
RED = (200, 50, 50)
DARK_RED = (150, 30, 30)
BROWN = (139, 90, 43)
DARK_BROWN = (101, 67, 33)
GOLD = (255, 215, 0)

class Scene:
    """场景基类"""
    def __init__(self, game):
        self.game = game
        self.screen = game.screen
        self.font = game.font
        self.small_font = game.small_font
        self.title_font = game.title_font
        
    def handle_event(self, event):
        pass
    
    def update(self):
        pass
    
    def draw(self):
        pass


class TitleScene(Scene):
    """标题场景"""
    def __init__(self, game):
        super().__init__(game)
        self.selected = 0
        self.options = ["开始调查", "退出游戏"]
        
    def handle_event(self, event):
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_UP:
                self.selected = (self.selected - 1) % len(self.options)
            elif event.key == pygame.K_DOWN:
                self.selected = (self.selected + 1) % len(self.options)
            elif event.key == pygame.K_RETURN:
                if self.selected == 0:
                    self.game.change_scene("intro")
                else:
                    self.game.running = False
    
    def draw(self):
        self.screen.fill(BLACK)
        
        # 标题
        title = self.title_font.render("恶魔的代价", True, RED)
        title_rect = title.get_rect(center=(400, 150))
        self.screen.blit(title, title_rect)
        
        # 副标题
        subtitle = self.font.render("—— 一桩激情杀人的谜案 ——", True, GRAY)
        sub_rect = subtitle.get_rect(center=(400, 220))
        self.screen.blit(subtitle, sub_rect)
        
        # 选项
        for i, option in enumerate(self.options):
            color = GOLD if i == self.selected else GRAY
            text = self.font.render(option, True, color)
            rect = text.get_rect(center=(400, 350 + i * 60))
            self.screen.blit(text, rect)
        
        # 提示
        hint = self.small_font.render("↑↓选择，回车确认", True, DARK_GRAY)
        hint_rect = hint.get_rect(center=(400, 550))
        self.screen.blit(hint, hint_rect)


class IntroScene(Scene):
    """介绍场景"""
    def __init__(self, game):
        super().__init__(game)
        self.page = 0
        self.pages = [
            "城郊一栋老旧别墅中发生了一起命案。",
            "受害者张保安，被人发现死在别墅客厅中。",
            "现场凌乱，血迹分布不均，墙上留有血字'活该'。",
            "嫌疑人就在以下四人之中：\n\n怪盗 - 别墅住户，艺术品大盗\n张老板 - 地下艺术品商人\n李记者 - 社会新闻记者\n王医生 - 社区诊所医生",
            "你的任务是调查现场、收集线索、\n审问嫌疑人，最终找出真凶。",
            "按回车键开始调查..."
        ]
    
    def handle_event(self, event):
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_RETURN:
                self.page += 1
                if self.page >= len(self.pages):
                    self.game.change_scene("crime_scene")
    
    def draw(self):
        self.screen.fill(BLACK)
        
        # 显示当前页文本
        lines = self.pages[self.page].split('\n')
        y = 200
        for line in lines:
            text = self.font.render(line, True, WHITE)
            rect = text.get_rect(center=(400, y))
            self.screen.blit(text, rect)
            y += 40
        
        # 页码提示
        if self.page < len(self.pages) - 1:
            hint = self.small_font.render("按回车继续...", True, GRAY)
            hint_rect = hint.get_rect(center=(400, 500))
            self.screen.blit(hint, hint_rect)


class CrimeScene(Scene):
    """案发现场场景"""
    def __init__(self, game):
        super().__init__(game)
        self.evidences = game.evidence_board
        self.selected_item = 0
        self.mode = "look"  # look, examine, move
        self.message = "你来到了案发现场。空气中弥漫着血腥味。"
        self.message_timer = 0
        
        # 可调查的物品列表
        self.items = [
            ("blood_east", "调查东边血迹"),
            ("blood_south", "调查南边血迹"),
            ("blood_west", "调查西边血迹"),
            ("footprints", "调查脚印"),
            ("demon_book", "查看桌上的书"),
            ("transfer_phone", "查看桌上的手机"),
            ("blood_writing", "查看墙上血字"),
            ("window", "查看窗户"),
            ("cigarette", "查看院门口"),
        ]
        
        self.move_options = [
            ("basement", "去地下室"),
            ("study", "去书房"),
            ("office", "去物业办公室"),
            ("interview", "去审问嫌疑人"),
        ]
    
    def handle_event(self, event):
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_1:
                self.mode = "look"
                self.message = "调查模式：选择要查看的线索"
            elif event.key == pygame.K_2:
                self.mode = "examine"
                self.message = "检查模式：选择要详细检查的线索"
            elif event.key == pygame.K_3:
                self.mode = "move"
                self.message = "移动模式：选择要前往的地点"
            elif event.key == pygame.K_UP:
                if self.mode == "look" or self.mode == "examine":
                    self.selected_item = (self.selected_item - 1) % len(self.items)
                elif self.mode == "move":
                    self.selected_item = (self.selected_item - 1) % len(self.move_options)
            elif event.key == pygame.K_DOWN:
                if self.mode == "look" or self.mode == "examine":
                    self.selected_item = (self.selected_item + 1) % len(self.items)
                elif self.mode == "move":
                    self.selected_item = (self.selected_item + 1) % len(self.move_options)
            elif event.key == pygame.K_RETURN:
                if self.mode == "look" or self.mode == "examine":
                    self.investigate_item()
                elif self.mode == "move":
                    self.move_to()
    
    def investigate_item(self):
        """调查选中的物品"""
        if self.selected_item >= len(self.items):
            return
        
        ev_id, _ = self.items[self.selected_item]
        ev = self.evidences.evidences.get(ev_id)
        
        if not ev:
            return
        
        if self.mode == "look":
            if not ev.found:
                result = self.evidences.find_evidence(ev_id, "crime_scene")
                if result:
                    self.message = result
            else:
                self.message = f"你已经调查过{ev.name}了。"
        elif self.mode == "examine":
            if ev.found:
                self.message = ev.examine()
            else:
                self.message = "你还没有发现这个线索，先调查一下。"
    
    def move_to(self):
        """移动到其他地方"""
        if self.selected_item >= len(self.move_options):
            return
        
        dest, _ = self.move_options[self.selected_item]
        if dest == "interview":
            self.game.change_scene("interview")
        else:
            self.game.change_scene(dest)
    
    def draw(self):
        self.screen.fill(BLACK)
        
        # 场景标题
        title = self.title_font.render("案发现场 - 别墅客厅", True, RED)
        title_rect = title.get_rect(center=(400, 30))
        self.screen.blit(title, title_rect)
        
        # 模式提示
        mode_text = {
            "look": "[1]调查模式",
            "examine": "[2]检查模式", 
            "move": "[3]移动模式"
        }
        mode = self.small_font.render(mode_text.get(self.mode, ""), True, GOLD)
        self.screen.blit(mode, (20, 70))
        
        # 消息区域
        if self.message:
            # 自动换行显示消息
            words = self.message
            y = 100
            # 简单处理：如果消息太长，分段显示
            if len(words) > 50:
                lines = []
                current = ""
                for word in words:
                    current += word
                    if len(current) >= 50:
                        lines.append(current)
                        current = ""
                if current:
                    lines.append(current)
                for line in lines:
                    text = self.small_font.render(line, True, WHITE)
                    self.screen.blit(text, (20, y))
                    y += 25
            else:
                text = self.small_font.render(words, True, WHITE)
                self.screen.blit(text, (20, y))
        
        # 选项列表
        y = 250
        if self.mode == "look" or self.mode == "examine":
            for i, (ev_id, label) in enumerate(self.items):
                ev = self.evidences.evidences.get(ev_id)
                if ev and ev.found:
                    label += " [已发现]"
                color = GOLD if i == self.selected_item else GRAY
                text = self.font.render(label, True, color)
                self.screen.blit(text, (50, y + i * 35))
        elif self.mode == "move":
            for i, (dest, label) in enumerate(self.move_options):
                color = GOLD if i == self.selected_item else GRAY
                text = self.font.render(label, True, color)
                self.screen.blit(text, (50, y + i * 35))
        
        # 操作提示
        hints = [
            "1-调查 2-检查 3-移动",
            "↑↓选择，回车确认"
        ]
        for i, hint in enumerate(hints):
            text = self.small_font.render(hint, True, DARK_GRAY)
            self.screen.blit(text, (20, 520 + i * 25))


class BasementScene(Scene):
    """地下室场景"""
    def __init__(self, game):
        super().__init__(game)
        self.message = "地下室昏暗潮湿，你发现了暗格。"
        self.items = [
            ("painting", "查看暗格中的名画"),
            ("duty_record", "查看旁边的文件"),
        ]
        self.selected_item = 0
        self.mode = "look"
    
    def handle_event(self, event):
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_1:
                self.mode = "look"
            elif event.key == pygame.K_2:
                self.mode = "examine"
            elif event.key == pygame.K_3:
                self.game.change_scene("crime_scene")
            elif event.key == pygame.K_UP:
                self.selected_item = (self.selected_item - 1) % len(self.items)
            elif event.key == pygame.K_DOWN:
                self.selected_item = (self.selected_item + 1) % len(self.items)
            elif event.key == pygame.K_RETURN:
                self.investigate()
    
    def investigate(self):
        ev_id, _ = self.items[self.selected_item]
        ev = self.game.evidence_board.evidences.get(ev_id)
        if not ev:
            return
        
        if self.mode == "look":
            if not ev.found:
                result = self.game.evidence_board.find_evidence(ev_id, "basement")
                if result:
                    self.message = result
            else:
                self.message = f"你已经调查过{ev.name}了。"
        elif self.mode == "examine":
            if ev.found:
                self.message = ev.examine()
            else:
                self.message = "先调查一下这个物品。"
    
    def draw(self):
        self.screen.fill(BLACK)
        title = self.title_font.render("地下室", True, DARK_RED)
        self.screen.blit(title, title.get_rect(center=(400, 30)))
        
        mode_text = self.small_font.render("[1]调查 [2]检查 [3]返回客厅", True, GOLD)
        self.screen.blit(mode_text, (20, 70))
        
        # 消息
        text = self.small_font.render(self.message, True, WHITE)
        self.screen.blit(text, (20, 110))
        
        # 选项
        for i, (ev_id, label) in enumerate(self.items):
            ev = self.game.evidence_board.evidences.get(ev_id)
            if ev and ev.found:
                label += " [已发现]"
            color = GOLD if i == self.selected_item else GRAY
            text = self.font.render(label, True, color)
            self.screen.blit(text, (50, 200 + i * 35))


class StudyScene(Scene):
    """书房场景"""
    def __init__(self, game):
        super().__init__(game)
        self.message = "书房整洁，与客厅的凌乱形成对比。"
        self.items = [
            ("newspaper", "查看书桌抽屉"),
        ]
        self.selected_item = 0
        self.mode = "look"
    
    def handle_event(self, event):
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_1:
                self.mode = "look"
            elif event.key == pygame.K_2:
                self.mode = "examine"
            elif event.key == pygame.K_3:
                self.game.change_scene("crime_scene")
            elif event.key == pygame.K_UP:
                self.selected_item = (self.selected_item - 1) % len(self.items)
            elif event.key == pygame.K_DOWN:
                self.selected_item = (self.selected_item + 1) % len(self.items)
            elif event.key == pygame.K_RETURN:
                self.investigate()
    
    def investigate(self):
        ev_id, _ = self.items[self.selected_item]
        ev = self.game.evidence_board.evidences.get(ev_id)
        if not ev:
            return
        
        if self.mode == "look":
            if not ev.found:
                result = self.game.evidence_board.find_evidence(ev_id, "study")
                if result:
                    self.message = result
            else:
                self.message = f"你已经调查过{ev.name}了。"
        elif self.mode == "examine":
            if ev.found:
                self.message = ev.examine()
            else:
                self.message = "先调查一下。"
    
    def draw(self):
        self.screen.fill(BLACK)
        title = self.title_font.render("书房", True, BROWN)
        self.screen.blit(title, title.get_rect(center=(400, 30)))
        
        mode_text = self.small_font.render("[1]调查 [2]检查 [3]返回客厅", True, GOLD)
        self.screen.blit(mode_text, (20, 70))
        
        text = self.small_font.render(self.message, True, WHITE)
        self.screen.blit(text, (20, 110))
        
        for i, (ev_id, label) in enumerate(self.items):
            ev = self.game.evidence_board.evidences.get(ev_id)
            if ev and ev.found:
                label += " [已发现]"
            color = GOLD if i == self.selected_item else GRAY
            text = self.font.render(label, True, color)
            self.screen.blit(text, (50, 200 + i * 35))


class OfficeScene(Scene):
    """物业办公室场景"""
    def __init__(self, game):
        super().__init__(game)
        self.message = "物业办公室里堆满了文件。"
        self.items = [
            ("maintenance", "查看维修记录"),
        ]
        self.selected_item = 0
        self.mode = "look"
    
    def handle_event(self, event):
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_1:
                self.mode = "look"
            elif event.key == pygame.K_2:
                self.mode = "examine"
            elif event.key == pygame.K_3:
                self.game.change_scene("crime_scene")
            elif event.key == pygame.K_UP:
                self.selected_item = (self.selected_item - 1) % len(self.items)
            elif event.key == pygame.K_DOWN:
                self.selected_item = (self.selected_item + 1) % len(self.items)
            elif event.key == pygame.K_RETURN:
                self.investigate()
    
    def investigate(self):
        ev_id, _ = self.items[self.selected_item]
        ev = self.game.evidence_board.evidences.get(ev_id)
        if not ev:
            return
        
        if self.mode == "look":
            if not ev.found:
                result = self.game.evidence_board.find_evidence(ev_id, "office")
                if result:
                    self.message = result
            else:
                self.message = f"你已经调查过{ev.name}了。"
        elif self.mode == "examine":
            if ev.found:
                self.message = ev.examine()
            else:
                self.message = "先调查一下。"
    
    def draw(self):
        self.screen.fill(BLACK)
        title = self.title_font.render("物业办公室", True, GRAY)
        self.screen.blit(title, title.get_rect(center=(400, 30)))
        
        mode_text = self.small_font.render("[1]调查 [2]检查 [3]返回客厅", True, GOLD)
        self.screen.blit(mode_text, (20, 70))
        
        text = self.small_font.render(self.message, True, WHITE)
        self.screen.blit(text, (20, 110))
        
        for i, (ev_id, label) in enumerate(self.items):
            ev = self.game.evidence_board.evidences.get(ev_id)
            if ev and ev.found:
                label += " [已发现]"
            color = GOLD if i == self.selected_item else GRAY
            text = self.font.render(label, True, color)
            self.screen.blit(text, (50, 200 + i * 35))


class InterviewScene(Scene):
    """审问嫌疑人场景"""
    def __init__(self, game):
        super().__init__(game)
        self.suspects = game.suspects
        self.selected_suspect = 0
        self.selected_topic = 0
        self.mode = "select_suspect"  # select_suspect, select_topic, board
        self.current_suspect = None
        self.message = "选择要审问的嫌疑人"
        self.suspect_list = list(self.suspects.values())
    
    def handle_event(self, event):
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_ESCAPE:
                if self.mode == "select_topic":
                    self.mode = "select_suspect"
                    self.current_suspect = None
                    self.message = "选择要审问的嫌疑人"
                else:
                    self.game.change_scene("crime_scene")
            elif event.key == pygame.K_b:
                self.game.change_scene("board")
            elif event.key == pygame.K_UP:
                if self.mode == "select_suspect":
                    self.selected_suspect = (self.selected_suspect - 1) % len(self.suspect_list)
                elif self.mode == "select_topic":
                    topics = self.current_suspect.get_available_topics(self.game.evidence_board)
                    if topics:
                        self.selected_topic = (self.selected_topic - 1) % len(topics)
            elif event.key == pygame.K_DOWN:
                if self.mode == "select_suspect":
                    self.selected_suspect = (self.selected_suspect + 1) % len(self.suspect_list)
                elif self.mode == "select_topic":
                    topics = self.current_suspect.get_available_topics(self.game.evidence_board)
                    if topics:
                        self.selected_topic = (self.selected_topic + 1) % len(topics)
            elif event.key == pygame.K_RETURN:
                if self.mode == "select_suspect":
                    self.current_suspect = self.suspect_list[self.selected_suspect]
                    self.mode = "select_topic"
                    self.message = f"正在审问：{self.current_suspect.name}"
                    self.selected_topic = 0
                elif self.mode == "select_topic":
                    topics = self.current_suspect.get_available_topics(self.game.evidence_board)
                    if topics and self.selected_topic < len(topics):
                        topic = topics[self.selected_topic]
                        result = self.current_suspect.talk(topic, self.game.evidence_board)
                        self.message = result
    
    def draw(self):
        self.screen.fill(BLACK)
        
        title = self.title_font.render("审问嫌疑人", True, GOLD)
        self.screen.blit(title, title.get_rect(center=(400, 30)))
        
        # 提示
        hint = self.small_font.render("ESC-返回 B-证据板 ↑↓选择 回车确认", True, DARK_GRAY)
        self.screen.blit(hint, (20, 70))
        
        if self.mode == "select_suspect":
            # 显示嫌疑人列表
            y = 120
            for i, suspect in enumerate(self.suspect_list):
                color = GOLD if i == self.selected_suspect else GRAY
                name_text = self.font.render(f"{suspect.name} - {suspect.role}", True, color)
                self.screen.blit(name_text, (50, y + i * 50))
                
                desc_text = self.small_font.render(suspect.description, True, DARK_GRAY)
                self.screen.blit(desc_text, (70, y + i * 50 + 25))
        
        elif self.mode == "select_topic":
            # 显示当前嫌疑人和对话记录
            name_text = self.font.render(f"{self.current_suspect.name}", True, RED)
            self.screen.blit(name_text, (50, 110))
            
            # 消息区域
            lines = []
            current = ""
            for char in self.message:
                current += char
                if len(current) >= 45:
                    lines.append(current)
                    current = ""
            if current:
                lines.append(current)
            
            y = 150
            for line in lines:
                text = self.small_font.render(line, True, WHITE)
                self.screen.blit(text, (50, y))
                y += 22
            
            # 可对话话题
            y = 350
            topics = self.current_suspect.get_available_topics(self.game.evidence_board)
            if topics:
                topic_text = self.font.render("可询问的话题：", True, GRAY)
                self.screen.blit(topic_text, (50, y))
                y += 30
                
                for i, topic in enumerate(topics):
                    color = GOLD if i == self.selected_topic else GRAY
                    text = self.font.render(f"- {topic}", True, color)
                    self.screen.blit(text, (70, y + i * 30))
            else:
                text = self.font.render("暂时没有可询问的话题", True, GRAY)
                self.screen.blit(text, (50, y))


class BoardScene(Scene):
    """证据板场景"""
    def __init__(self, game):
        super().__init__(game)
        self.mode = "view"  # view, connect, accuse
        self.selected_ev1 = 0
        self.selected_ev2 = 1
        self.selected_suspect = 0
        self.message = "证据板：查看已发现的线索，尝试关联它们。"
        self.suspect_names = ["怪盗", "张老板", "李记者", "王医生"]
    
    def handle_event(self, event):
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_ESCAPE:
                self.game.change_scene("interview")
            elif event.key == pygame.K_1:
                self.mode = "view"
                self.message = "查看已发现的线索"
            elif event.key == pygame.K_2:
                self.mode = "connect"
                self.message = "选择两个线索进行关联"
            elif event.key == pygame.K_3:
                self.mode = "accuse"
                self.message = "选择嫌疑人进行指认"
            elif event.key == pygame.K_UP:
                if self.mode == "connect":
                    found = self.game.evidence_board.get_found_evidences()
                    if found:
                        self.selected_ev1 = (self.selected_ev1 - 1) % len(found)
                elif self.mode == "accuse":
                    self.selected_suspect = (self.selected_suspect - 1) % len(self.suspect_names)
            elif event.key == pygame.K_DOWN:
                if self.mode == "connect":
                    found = self.game.evidence_board.get_found_evidences()
                    if found:
                        self.selected_ev1 = (self.selected_ev1 + 1) % len(found)
                elif self.mode == "accuse":
                    self.selected_suspect = (self.selected_suspect + 1) % len(self.suspect_names)
            elif event.key == pygame.K_LEFT:
                if self.mode == "connect":
                    found = self.game.evidence_board.get_found_evidences()
                    if found:
                        self.selected_ev2 = (self.selected_ev2 - 1) % len(found)
            elif event.key == pygame.K_RIGHT:
                if self.mode == "connect":
                    found = self.game.evidence_board.get_found_evidences()
                    if found:
                        self.selected_ev2 = (self.selected_ev2 + 1) % len(found)
            elif event.key == pygame.K_RETURN:
                if self.mode == "connect":
                    self.connect_evidence()
                elif self.mode == "accuse":
                    self.accuse()
    
    def connect_evidence(self):
        """关联两个证据"""
        found = self.game.evidence_board.get_found_evidences()
        if len(found) < 2:
            self.message = "发现的线索还不够多，无法关联。"
            return
        
        if self.selected_ev1 == self.selected_ev2:
            self.message = "不能关联同一个线索。"
            return
        
        ev1 = found[self.selected_ev1]
        ev2 = found[self.selected_ev2]
        
        success, result = self.game.evidence_board.connect(ev1.id, ev2.id)
        self.message = result
    
    def accuse(self):
        """指认凶手"""
        suspect_name = self.suspect_names[self.selected_suspect]
        success, result = self.game.evidence_board.check_solve(suspect_name)
        self.message = result
        
        if success:
            self.game.change_scene("ending")
    
    def draw(self):
        self.screen.fill(BLACK)
        
        title = self.title_font.render("证据板", True, GOLD)
        self.screen.blit(title, title.get_rect(center=(400, 30)))
        
        hint = self.small_font.render("ESC-返回 [1]查看 [2]关联 [3]指认", True, DARK_GRAY)
        self.screen.blit(hint, (20, 70))
        
        # 消息
        text = self.small_font.render(self.message, True, WHITE)
        self.screen.blit(text, (20, 100))
        
        if self.mode == "view":
            # 显示所有已发现的线索
            found = self.game.evidence_board.get_found_evidences()
            y = 140
            if found:
                for ev in found:
                    name_text = self.font.render(f"• {ev.name}", True, WHITE)
                    self.screen.blit(name_text, (50, y))
                    y += 30
            else:
                text = self.font.render("还没有发现任何线索", True, GRAY)
                self.screen.blit(text, (50, y))
        
        elif self.mode == "connect":
            found = self.game.evidence_board.get_found_evidences()
            if len(found) >= 2:
                y = 140
                text = self.font.render("选择两个线索进行关联 (↑↓选第一个 ←→选第二个)", True, GRAY)
                self.screen.blit(text, (50, y))
                y += 40
                
                for i, ev in enumerate(found):
                    color1 = GOLD if i == self.selected_ev1 else GRAY
                    color2 = RED if i == self.selected_ev2 else GRAY
                    
                    text1 = self.small_font.render(f"[{i+1}]", True, color1)
                    text2 = self.small_font.render(f"({i+1})", True, color2)
                    name_text = self.font.render(ev.name, True, WHITE)
                    
                    self.screen.blit(text1, (50, y))
                    self.screen.blit(text2, (80, y))
                    self.screen.blit(name_text, (120, y))
                    y += 30
                
                if self.selected_ev1 < len(found) and self.selected_ev2 < len(found):
                    ev1 = found[self.selected_ev1]
                    ev2 = found[self.selected_ev2]
                    connect_text = self.small_font.render(
                        f"关联: {ev1.name} + {ev2.name} (按回车)", True, GOLD)
                    self.screen.blit(connect_text, (50, y + 20))
            else:
                text = self.font.render("需要至少2个线索才能关联", True, GRAY)
                self.screen.blit(text, (50, 180))
        
        elif self.mode == "accuse":
            y = 140
            text = self.font.render("选择嫌疑人进行指认 (↑↓选择，回车确认)", True, GRAY)
            self.screen.blit(text, (50, y))
            y += 50
            
            for i, name in enumerate(self.suspect_names):
                color = GOLD if i == self.selected_suspect else GRAY
                text = self.font.render(name, True, color)
                self.screen.blit(text, (100, y + i * 40))


class EndingScene(Scene):
    """结局场景"""
    def __init__(self, game):
        super().__init__(game)
        self.page = 0
        self.pages = [
            "你成功揭开了真相。",
            "怪盗承认了自己的罪行。",
            "他的一生追求'优雅的恶魔'，\n最终却沦为最庸俗的杀人犯。",
            "张保安的虚伪被揭露，\n但他已经付出了生命的代价。",
            "'活该'——\n这两个字是怪盗对张保安的审判，\n也是对自己命运的嘲讽。",
            "案件结束了，\n但人性的复杂，永远没有答案。",
            "【游戏结束】"
        ]
    
    def handle_event(self, event):
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_RETURN:
                self.page += 1
                if self.page >= len(self.pages):
                    self.game.change_scene("title")
    
    def draw(self):
        self.screen.fill(BLACK)
        
        if self.page < len(self.pages):
            lines = self.pages[self.page].split('\n')
            y = 200
            for line in lines:
                text = self.font.render(line, True, WHITE)
                rect = text.get_rect(center=(400, y))
                self.screen.blit(text, rect)
                y += 40
            
            if self.page < len(self.pages) - 1:
                hint = self.small_font.render("按回车继续...", True, GRAY)
                hint_rect = hint.get_rect(center=(400, 500))
                self.screen.blit(hint, hint_rect)
            else:
                hint = self.small_font.render("按回车返回主菜单", True, GRAY)
                hint_rect = hint.get_rect(center=(400, 500))
                self.screen.blit(hint, hint_rect)
