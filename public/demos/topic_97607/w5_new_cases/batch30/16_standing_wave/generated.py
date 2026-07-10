from manim import *

class GeneratedCourseware(Scene):
    def construct(self):
        # Color scheme
        BG = "#0D1117"
        TEXT_COLOR = "#E8DFD3"
        BLUE = "#4ECDC4"
        ORANGE = "#FF8C69"
        YELLOW = "#FFD93D"
        RED = "#FF6B6B"
        GREEN = "#00FF7F"
        
        self.camera.background_color = BG
        
        # Parameters
        A = 0.8
        lam = 5
        k = 2 * PI / lam
        omega = PI
        eq_y = 1.5
        x_min, x_max = -5, 5
        
        # Time tracker
        t = ValueTracker(0)
        
        # Title (persistent)
        title = Text("驻波与共振", font_size=36, color=TEXT_COLOR)
        title.to_edge(UP, buff=0.15)
        self.add(title)
        
        # ========== Scene 1: Right-traveling wave ==========
        wave_right = always_redraw(lambda: ParametricFunction(
            lambda x: np.array([x, eq_y + A * np.sin(k * x - omega * t.get_value()), 0]),
            t_range=[x_min, x_max],
            color=BLUE,
            stroke_width=3
        ))
        
        arrow_right = Arrow(start=LEFT * 4 + UP * 2.6, end=LEFT * 2 + UP * 2.6,
                            color=BLUE, buff=0.1, stroke_width=3, max_tip_length_to_length_ratio=0.2)
        label_right = Text("行波→", font_size=22, color=BLUE).next_to(arrow_right, RIGHT, buff=0.1)
        
        reason1 = Text("行波向右传播，波形整体移动", font_size=22, color=TEXT_COLOR)
        reason1.to_edge(DOWN, buff=1.0)
        
        self.add(wave_right)
        self.play(Create(arrow_right), Write(label_right), Write(reason1), run_time=1)
        self.play(t.animate.set_value(2 * PI), run_time=5, rate_func=linear)
        self.wait(0.5)
        
        scene1_group = VGroup(arrow_right, label_right, reason1)
        self.play(FadeOut(scene1_group), run_time=0.5)
        
        # ========== Scene 2: Left-traveling wave ==========
        wave_left = always_redraw(lambda: ParametricFunction(
            lambda x: np.array([x, eq_y + A * np.sin(k * x + omega * t.get_value()), 0]),
            t_range=[x_min, x_max],
            color=ORANGE,
            stroke_width=3
        ))
        
        arrow_left = Arrow(start=RIGHT * 4 + UP * 2.6, end=RIGHT * 2 + UP * 2.6,
                           color=ORANGE, buff=0.1, stroke_width=3, max_tip_length_to_length_ratio=0.2)
        label_left = Text("行波←", font_size=22, color=ORANGE).next_to(arrow_left, LEFT, buff=0.1)
        
        reason2 = Text("另一列行波向左传播，两波相遇", font_size=22, color=TEXT_COLOR)
        reason2.to_edge(DOWN, buff=1.0)
        
        self.add(wave_left)
        self.play(Create(arrow_left), Write(label_left), Write(reason2), run_time=1)
        self.play(t.animate.set_value(4 * PI), run_time=5, rate_func=linear)
        self.wait(0.5)
        
        scene2_group = VGroup(arrow_left, label_left, reason2)
        self.play(FadeOut(scene2_group), run_time=0.5)
        
        # ========== Scene 3: Superposition ==========
        wave_standing = always_redraw(lambda: ParametricFunction(
            lambda x: np.array([x, eq_y + 2 * A * np.sin(k * x) * np.cos(omega * t.get_value()), 0]),
            t_range=[x_min, x_max],
            color=YELLOW,
            stroke_width=4
        ))
        
        reason3 = Text("两波叠加，合成波出现不动点和起伏点", font_size=22, color=TEXT_COLOR)
        reason3.to_edge(DOWN, buff=1.0)
        
        self.play(
            wave_right.animate.set_opacity(0.4),
            wave_left.animate.set_opacity(0.4),
            run_time=0.5
        )
        self.add(wave_standing)
        self.play(Write(reason3), run_time=1)
        self.play(t.animate.set_value(6 * PI), run_time=6, rate_func=linear)
        self.wait(0.5)
        
        self.play(FadeOut(reason3), run_time=0.5)
        
        # ========== Scene 4: Nodes and antinodes ==========
        node_xs = [-5, -2.5, 0, 2.5, 5]
        antinode_xs = [-3.75, -1.25, 1.25, 3.75]
        
        nodes = VGroup(*[
            Dot(point=np.array([x, eq_y, 0]), radius=0.08, color=RED)
            for x in node_xs
        ])
        
        antinodes = VGroup()
        for x in antinode_xs:
            dot = Dot(radius=0.08, color=GREEN)
            dot.add_updater(lambda d, x=x: d.move_to(
                np.array([x, eq_y + 2 * A * np.sin(k * x) * np.cos(omega * t.get_value()), 0])
            ))
            antinodes.add(dot)
        
        node_label = Text("波节", font_size=22, color=RED).next_to(nodes[2], DOWN, buff=0.3)
        antinode_label = Text("波腹", font_size=22, color=GREEN).next_to(antinodes[2], UP, buff=0.2)
        
        reason4 = Text("波节始终不动，波腹最大幅度起伏", font_size=22, color=TEXT_COLOR)
        reason4.to_edge(DOWN, buff=1.0)
        
        self.play(Create(nodes), Create(antinodes), run_time=1)
        self.play(Write(node_label), Write(antinode_label), Write(reason4), run_time=1)
        self.play(t.animate.set_value(8 * PI), run_time=6, rate_func=linear)
        self.wait(0.5)
        
        scene4_group = VGroup(node_label, antinode_label, reason4)
        self.play(FadeOut(scene4_group), run_time=0.5)
        
        # ========== Scene 5: Standing wave insight ==========
        equation = MathTex(
            r"y = 2A \sin(kx) \cos(\omega t)",
            font_size=30,
            color=YELLOW
        )
        equation.to_edge(DOWN, buff=0.3)
        highlight_box = SurroundingRectangle(equation, color=YELLOW, buff=0.15, stroke_width=2)
        
        reason5 = Text("驻波不传播能量，波形站住了——弦乐器发声的原理",
                       font_size=22, color=TEXT_COLOR)
        reason5.to_edge(DOWN, buff=1.0)
        
        self.play(Write(equation), Create(highlight_box), Write(reason5), run_time=1.5)
        self.play(t.animate.set_value(10 * PI), run_time=4, rate_func=linear)
        self.wait(1)
