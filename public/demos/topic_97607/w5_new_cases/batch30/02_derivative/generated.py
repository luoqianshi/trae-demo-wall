from manim import *


class GeneratedCourseware(Scene):
    def construct(self):
        # Color scheme
        BG = "#0D1117"
        TEXT_COLOR = "#E8DFD3"
        CURVE_COLOR = "#4ECDC4"
        SECANT_COLOR = "#F39C12"
        TANGENT_COLOR = "#E74C3C"
        POINT_COLOR = "#FFD93D"
        HIGHLIGHT_COLOR = "#FFD93D"

        self.camera.background_color = BG

        # Title (persistent)
        title = Text("导数的本质", font_size=36, color=TEXT_COLOR)
        title.to_edge(UP, buff=0.15)
        self.add(title)

        # Axes
        axes = Axes(
            x_range=[-4, 4, 1],
            y_range=[-1, 4, 1],
            x_length=8,
            y_length=4.6,
            axis_config={"color": TEXT_COLOR, "include_numbers": False},
            tips=False,
        )
        axes.move_to(UP * 0.7)

        def f(x):
            return x ** 2 / 4

        curve = axes.plot(f, x_range=[-4, 4], color=CURVE_COLOR, stroke_width=3)
        f_label = MathTex(r"f(x) = \frac{x^2}{4}", color=CURVE_COLOR, font_size=30)
        f_label.next_to(axes.c2p(3.2, f(3.2)), UR, buff=0.15)

        # Scene 1: Build curve
        scene1 = VGroup(axes, curve, f_label)
        self.play(Create(axes), run_time=1.5)
        self.play(Create(curve), run_time=2)
        self.play(Write(f_label), run_time=1)
        self.wait(1)

        # Scene 2: Two points and secant, dx=2
        x0 = 1
        dx_tracker = ValueTracker(2)
        P = always_redraw(lambda: Dot(axes.c2p(x0, f(x0)), color=POINT_COLOR, radius=0.07))
        Q = always_redraw(
            lambda: Dot(
                axes.c2p(x0 + dx_tracker.get_value(), f(x0 + dx_tracker.get_value())),
                color=POINT_COLOR,
                radius=0.07,
            )
        )
        P_label = always_redraw(
            lambda: MathTex("P", color=POINT_COLOR, font_size=22).next_to(
                axes.c2p(x0, f(x0)), DL, buff=0.1
            )
        )
        Q_label = always_redraw(
            lambda: MathTex("Q", color=POINT_COLOR, font_size=22).next_to(
                axes.c2p(x0 + dx_tracker.get_value(), f(x0 + dx_tracker.get_value())),
                UR,
                buff=0.1,
            )
        )

        secant = always_redraw(
            lambda: Line(
                axes.c2p(x0 - 0.5, f(x0) - 0.5 * ((f(x0 + dx_tracker.get_value()) - f(x0)) / dx_tracker.get_value())),
                axes.c2p(
                    x0 + dx_tracker.get_value() + 0.5,
                    f(x0 + dx_tracker.get_value())
                    + 0.5 * ((f(x0 + dx_tracker.get_value()) - f(x0)) / dx_tracker.get_value()),
                ),
                color=SECANT_COLOR,
                stroke_width=3,
            )
        )

        # dx double arrow
        dx_brace = always_redraw(
            lambda: DoubleArrow(
                axes.c2p(x0, f(x0) - 0.25),
                axes.c2p(x0 + dx_tracker.get_value(), f(x0) - 0.25),
                color=HIGHLIGHT_COLOR,
                buff=0,
                stroke_width=2,
                max_tip_length_to_length_ratio=0.12,
            )
        )
        dx_label = always_redraw(
            lambda: MathTex(r"dx", color=HIGHLIGHT_COLOR, font_size=22).next_to(
                dx_brace, DOWN, buff=0.1
            )
        )

        reason1 = Text("割线斜率=平均变化率", font_size=22, color=TEXT_COLOR)
        reason1.to_edge(DOWN, buff=1.2)
        slope_formula = MathTex(
            r"k = \frac{f(x_0+dx) - f(x_0)}{dx}", color=SECANT_COLOR, font_size=30
        )
        slope_formula.to_edge(DOWN, buff=0.3)

        scene2 = VGroup(P, Q, P_label, Q_label, secant, dx_brace, dx_label, reason1, slope_formula)
        self.play(FadeIn(P), FadeIn(Q), Write(P_label), Write(Q_label), run_time=1)
        self.play(Create(secant), run_time=1.5)
        self.play(Create(dx_brace), Write(dx_label), run_time=1)
        self.play(Write(reason1), Write(slope_formula), run_time=1.5)
        self.wait(1)

        # Scene 3: dx shrinks, secant rotates
        reason2 = Text("dx缩小，割线旋转", font_size=22, color=TEXT_COLOR)
        reason2.to_edge(DOWN, buff=1.2)
        dx_value = always_redraw(
            lambda: MathTex(
                rf"dx = {dx_tracker.get_value():.2f},\quad k = {((f(x0 + dx_tracker.get_value()) - f(x0)) / dx_tracker.get_value()):.3f}",
                color=HIGHLIGHT_COLOR,
                font_size=30,
            ).to_edge(DOWN, buff=0.3)
        )

        self.play(FadeOut(reason1), FadeOut(slope_formula), run_time=0.5)
        self.play(Write(reason2), FadeIn(dx_value), run_time=0.8)
        self.play(dx_tracker.animate.set_value(1), run_time=2.5, rate_func=smooth)
        self.wait(0.3)
        self.play(dx_tracker.animate.set_value(0.5), run_time=2.5, rate_func=smooth)
        self.wait(1)

        # Scene 4: dx->0, secant becomes tangent
        reason3 = Text("dx趋近0，割线变成切线", font_size=22, color=TEXT_COLOR)
        reason3.to_edge(DOWN, buff=1.2)
        tangent_line = Line(
            axes.c2p(x0 - 2, f(x0) - 2 * 0.5),
            axes.c2p(x0 + 3, f(x0) + 3 * 0.5),
            color=TANGENT_COLOR,
            stroke_width=4,
        )
        dx_to_zero = MathTex(r"dx \to 0", color=HIGHLIGHT_COLOR, font_size=30)
        dx_to_zero.to_edge(DOWN, buff=0.3)

        self.play(FadeOut(reason2), FadeOut(dx_value), run_time=0.5)
        self.play(Write(reason3), run_time=0.8)
        self.play(dx_tracker.animate.set_value(0.001), run_time=3, rate_func=smooth)
        self.play(Create(tangent_line), Indicate(tangent_line, color=HIGHLIGHT_COLOR, scale_factor=1.05), run_time=2)
        self.play(FadeIn(dx_to_zero), run_time=0.5)
        self.wait(1)

        # Scene 5: Derivative formula conclusion
        reason4 = Text("导数=瞬时变化率=切线斜率", font_size=22, color=TEXT_COLOR)
        reason4.to_edge(DOWN, buff=1.2)
        derivative_formula = MathTex(
            r"f'(x_0) = \lim_{dx \to 0} \frac{f(x_0+dx) - f(x_0)}{dx}",
            color=TANGENT_COLOR,
            font_size=30,
        )
        derivative_formula.to_edge(DOWN, buff=0.3)
        highlight_box = SurroundingRectangle(derivative_formula, color=HIGHLIGHT_COLOR, buff=0.15, stroke_width=2)
        slope_at_p = MathTex(r"f'(1) = 0.5", color=TANGENT_COLOR, font_size=24)
        slope_at_p.next_to(axes.c2p(x0, f(x0)), UL, buff=0.2)

        self.play(FadeOut(reason3), FadeOut(dx_to_zero), run_time=0.5)
        self.play(Write(reason4), run_time=0.8)
        self.play(Write(derivative_formula), Create(highlight_box), run_time=2)
        self.play(Write(slope_at_p), run_time=1)
        self.wait(2)
