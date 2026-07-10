from manim import *
import numpy as np


class GeneratedCourseware(Scene):
    def construct(self):
        # Color scheme
        BG = "#0D1117"
        TEXT_COL = "#E8DFD3"
        SIN_COL = "#4ECDC4"
        TAYLOR_COL = "#F39C12"
        HIGH_COL = "#E74C3C"
        HL_COL = "#FFD93D"

        self.camera.background_color = BG

        # Title (persistent)
        title = Text("泰勒级数逼近", font_size=36, color=TEXT_COL)
        title.to_edge(UP, buff=0.15)
        self.add(title)

        # Axes
        axes = Axes(
            x_range=[-2 * PI, 2 * PI, PI / 2],
            y_range=[-2, 2, 1],
            x_length=10,
            y_length=4.2,
            axis_config={"color": TEXT_COL, "stroke_width": 2},
            tips=False,
        )
        axes.move_to(ORIGIN + UP * 0.7)

        # Scene 1: sin(x)
        sin_curve = axes.plot(lambda x: np.sin(x), color=SIN_COL, stroke_width=4)
        sin_label = MathTex(r"\sin(x)", color=SIN_COL, font_size=30)
        sin_label.next_to(axes.c2p(PI / 2, 1), UR, buff=0.2)

        f1 = MathTex(r"f(x) = \sin(x)", font_size=30, color=TEXT_COL)
        f1.to_edge(DOWN, buff=1.2)

        g1 = VGroup(axes, sin_curve, sin_label, f1)
        self.play(Create(axes), run_time=1.2)
        self.play(Create(sin_curve), run_time=2)
        self.play(Write(sin_label), Write(f1), run_time=1.5)
        self.wait(1.5)
        self.play(FadeOut(f1))

        # Scene 2: 1st order
        p1 = axes.plot(lambda x: x, color=TAYLOR_COL, stroke_width=4)
        p1_label = MathTex(r"P_1(x) = x", font_size=30, color=TAYLOR_COL)
        p1_label.to_edge(DOWN, buff=1.2)
        r1 = Text("1阶近似仅原点附近贴合", font_size=22, color=TEXT_COL)
        r1.to_edge(DOWN, buff=0.3)

        g2 = VGroup(p1, p1_label, r1)
        self.play(Create(p1), run_time=2)
        self.play(Write(p1_label), Write(r1), run_time=1.5)
        self.wait(2.5)
        self.play(FadeOut(p1_label), FadeOut(r1))

        # Scene 3: 3rd order
        p3 = axes.plot(lambda x: x - x**3 / 6, color=TAYLOR_COL, stroke_width=4)
        p3_label = MathTex(
            r"P_3(x) = x - \frac{x^3}{6}", font_size=30, color=TAYLOR_COL
        )
        p3_label.to_edge(DOWN, buff=1.2)
        r2 = Text("3阶项让曲线弯曲，更贴合", font_size=22, color=TEXT_COL)
        r2.to_edge(DOWN, buff=0.3)

        g3 = VGroup(p3, p3_label, r2)
        self.play(Transform(p1, p3), run_time=2.5)
        self.play(Write(p3_label), Write(r2), run_time=1.5)
        self.wait(3)
        self.play(FadeOut(p3_label), FadeOut(r2))

        # Scene 4: 5th and 7th order
        p5 = axes.plot(
            lambda x: x - x**3 / 6 + x**5 / 120, color=TAYLOR_COL, stroke_width=4
        )
        p7 = axes.plot(
            lambda x: x - x**3 / 6 + x**5 / 120 - x**7 / 5040,
            color=HIGH_COL,
            stroke_width=4,
        )
        p5_label = MathTex(
            r"P_5(x) = x - \frac{x^3}{6} + \frac{x^5}{120}",
            font_size=30,
            color=TAYLOR_COL,
        )
        p5_label.to_edge(DOWN, buff=1.2)
        r3 = Text("阶数越高，越贴合sin", font_size=22, color=TEXT_COL)
        r3.to_edge(DOWN, buff=0.3)

        g4 = VGroup(p5, p7, p5_label, r3)
        self.play(Transform(p1, p5), run_time=2.5)
        self.play(Write(p5_label), Write(r3), run_time=1.2)
        self.wait(1.5)
        self.play(Transform(p1, p7), run_time=2.5)
        self.wait(2)
        self.play(FadeOut(p5_label), FadeOut(r3))

        # Scene 5: Taylor formula conclusion
        taylor_formula = MathTex(
            r"\sin(x) = x - \frac{x^3}{3!} + \frac{x^5}{5!} - \frac{x^7}{7!} + \cdots",
            font_size=30,
            color=TEXT_COL,
        )
        taylor_formula.to_edge(DOWN, buff=0.3)
        conclusion = Text("用局部导数信息重构全局函数", font_size=28, color=HL_COL)
        conclusion.to_edge(DOWN, buff=1.2)
        box = SurroundingRectangle(
            taylor_formula, color=HL_COL, buff=0.15, stroke_width=3
        )

        g5 = VGroup(taylor_formula, conclusion, box)
        self.play(Write(taylor_formula), run_time=2)
        self.play(Create(box), Write(conclusion), run_time=2)
        self.wait(4)
