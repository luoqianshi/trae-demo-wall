from manim import *
import numpy as np

class GeneratedCourseware(Scene):
    def construct(self):
        # Color scheme
        BG = "#0D1117"
        TEXT_COLOR = "#E8DFD3"
        SIGNAL_COLOR = "#4ECDC4"
        CIRCLE_COLOR = "#3A4751"
        WINDING_COLOR = "#F39C12"
        CENTROID_COLOR = "#E74C3C"
        HIGHLIGHT_COLOR = "#FFD93D"
        
        self.camera.background_color = BG
        
        # Parameters
        T_START, T_END = 0, 3
        N_SAMPLES = 200
        R = 1.5
        CIRCLE_CENTER = np.array([3.0, 0.5, 0])
        SIGNAL_FREQ = 1.0
        
        t_samples = np.linspace(T_START, T_END, N_SAMPLES)
        
        def signal_value(t):
            return np.sin(2 * np.pi * SIGNAL_FREQ * t)
        
        # Title (persistent)
        title = Text("傅里叶变换·盘绕", font_size=36, color=TEXT_COLOR)
        title.to_edge(UP, buff=0.15)
        self.add(title)
        
        # ========== Scene 1: 建立方波信号 ==========
        time_axes = Axes(
            x_range=[0, 3, 1],
            y_range=[-1.2, 1.2, 0.5],
            x_length=5.0,
            y_length=3.0,
            axis_config={"color": TEXT_COLOR, "include_numbers": False},
            tips=False
        )
        time_axes.shift(LEFT * 3.0 + DOWN * 0.2)
        
        signal_curve = time_axes.plot(
            lambda t: np.sin(2 * np.pi * SIGNAL_FREQ * t),
            x_range=[0, 3],
            color=SIGNAL_COLOR,
            stroke_width=3
        )
        
        x_label = MathTex("x(t)", color=SIGNAL_COLOR, font_size=30)
        x_label.next_to(time_axes, UP, buff=0.2)
        
        t_label = Text("t", font_size=22, color=TEXT_COLOR)
        t_label.next_to(time_axes.x_axis.get_end(), RIGHT, buff=0.1)
        
        formula1 = MathTex("x(t) = \\text{signal}", font_size=30, color=TEXT_COLOR)
        formula1.to_edge(DOWN, buff=1.2)
        
        scene1 = VGroup(time_axes, signal_curve, x_label, t_label, formula1)
        
        self.play(Create(time_axes), Create(signal_curve), run_time=3)
        self.play(Write(x_label), Write(t_label), Write(formula1), run_time=2)
        self.wait(1.5)
        self.play(FadeOut(scene1))
        
        # ========== Scene 2: 信号缠绕到圆周 ==========
        # Time axes (keep for reference)
        time_axes2 = Axes(
            x_range=[0, 3, 1],
            y_range=[-1.2, 1.2, 0.5],
            x_length=4.0,
            y_length=2.5,
            axis_config={"color": TEXT_COLOR, "include_numbers": False},
            tips=False
        )
        time_axes2.shift(LEFT * 3.8 + DOWN * 0.2)
        
        signal_curve2 = time_axes2.plot(
            lambda t: np.sin(2 * np.pi * SIGNAL_FREQ * t),
            x_range=[0, 3],
            color=SIGNAL_COLOR,
            stroke_width=2
        )
        
        # Winding circle
        circle = Circle(radius=R, color=CIRCLE_COLOR, stroke_width=2)
        circle.move_to(CIRCLE_CENTER)
        
        circle_center_dot = Dot(CIRCLE_CENTER, radius=0.04, color=TEXT_COLOR)
        
        # f tracker
        f_tracker = ValueTracker(0.5)
        
        def get_winding_dots():
            f = f_tracker.get_value()
            dots = VGroup()
            for t in t_samples:
                x = signal_value(t)
                angle = 2 * np.pi * f * t
                pos = CIRCLE_CENTER + np.array([
                    np.cos(angle) * x * R,
                    np.sin(angle) * x * R,
                    0
                ])
                dots.add(Dot(pos, radius=0.03, color=WINDING_COLOR))
            return dots
        
        winding_dots = always_redraw(get_winding_dots)
        
        winding_formula = MathTex("z(t) = x(t) \\cdot e^{i2\\pi f t}", font_size=30, color=TEXT_COLOR)
        winding_formula.to_edge(DOWN, buff=1.2)
        
        reason2 = Text("信号缠绕在圆上", font_size=22, color=TEXT_COLOR)
        reason2.to_edge(DOWN, buff=0.3)
        
        scene2_static = VGroup(time_axes2, signal_curve2, circle, circle_center_dot)
        
        self.play(Create(time_axes2), Create(signal_curve2), run_time=2)
        self.play(Create(circle), FadeIn(circle_center_dot), run_time=1.5)
        self.add(winding_dots)
        self.play(Write(winding_formula), Write(reason2), run_time=2)
        self.wait(2)
        self.play(FadeOut(winding_formula), FadeOut(reason2))
        
        # ========== Scene 3: 质心轨迹 (f=0.5, mismatch) ==========
        def get_centroid():
            f = f_tracker.get_value()
            positions = []
            for t in t_samples:
                x = signal_value(t)
                angle = 2 * np.pi * f * t
                positions.append(np.array([
                    np.cos(angle) * x * R,
                    np.sin(angle) * x * R,
                    0
                ]))
            avg = np.mean(positions, axis=0)
            return Dot(CIRCLE_CENTER + avg, radius=0.1, color=CENTROID_COLOR)
        
        centroid = always_redraw(get_centroid)
        
        # Centroid line from center
        def get_centroid_line():
            f = f_tracker.get_value()
            positions = []
            for t in t_samples:
                x = signal_value(t)
                angle = 2 * np.pi * f * t
                positions.append(np.array([
                    np.cos(angle) * x * R,
                    np.sin(angle) * x * R,
                    0
                ]))
            avg = np.mean(positions, axis=0)
            return Line(CIRCLE_CENTER, CIRCLE_CENTER + avg, color=CENTROID_COLOR, stroke_width=2)
        
        centroid_line = always_redraw(get_centroid_line)
        
        reason3 = Text("频率不匹配，质心靠近圆心", font_size=22, color=TEXT_COLOR)
        reason3.to_edge(DOWN, buff=1.2)
        
        formula3 = MathTex("f = 0.5, \\ |c| \\approx 0", font_size=30, color=TEXT_COLOR)
        formula3.to_edge(DOWN, buff=0.3)
        
        self.add(winding_dots, centroid, centroid_line)
        self.play(FadeIn(centroid), Create(centroid_line), run_time=1.5)
        self.play(f_tracker.animate.set_value(0.5), run_time=2)
        self.play(Write(reason3), Write(formula3), run_time=2)
        self.wait(2)
        self.play(FadeOut(reason3), FadeOut(formula3))
        
        # ========== Scene 4: 频率匹配质心飞出 (f=1.0) ==========
        reason4 = Text("频率匹配，质心飞出=频谱尖峰", font_size=22, color=TEXT_COLOR)
        reason4.to_edge(DOWN, buff=1.2)
        
        formula4 = MathTex("f = 1, \\ |c| \\gg 0", font_size=30, color=TEXT_COLOR)
        formula4.to_edge(DOWN, buff=0.3)
        
        self.play(f_tracker.animate.set_value(1.0), run_time=4, rate_func=smooth)
        self.play(Write(reason4), Write(formula4), run_time=2)
        self.wait(3)
        self.play(FadeOut(reason4), FadeOut(formula4))
        
        # ========== Scene 5: 频率分解顿悟 ==========
        fft_formula = MathTex(
            "X(f) = \\int x(t) e^{-i2\\pi f t}\\,dt",
            font_size=30,
            color=HIGHLIGHT_COLOR
        )
        fft_formula.to_edge(DOWN, buff=0.3)
        
        conclusion = Text("傅里叶变换就是盘绕求质心", font_size=28, color=TEXT_COLOR)
        conclusion.to_edge(DOWN, buff=1.2)
        
        highlight_box = SurroundingRectangle(
            fft_formula,
            color=HIGHLIGHT_COLOR,
            buff=0.15,
            stroke_width=2
        )
        
        # Keep centroid visible and highlighted
        centroid_glow = Dot(
            CIRCLE_CENTER + np.mean([
                np.array([
                    np.cos(2*np.pi*1.0*t)*signal_value(t)*R,
                    np.sin(2*np.pi*1.0*t)*signal_value(t)*R,
                    0
                ]) for t in t_samples
            ], axis=0),
            radius=0.15,
            color=HIGHLIGHT_COLOR,
            fill_opacity=0.3
        )
        
        self.play(FadeIn(centroid_glow), run_time=1)
        self.play(Write(conclusion), run_time=1.5)
        self.play(Write(fft_formula), run_time=2)
        self.play(Create(highlight_box), run_time=1)
        self.wait(4)
