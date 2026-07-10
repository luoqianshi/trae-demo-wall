from manim import *


class GeneratedCourseware(Scene):
    def construct(self):
        # Color constants
        BG = "#0D1117"
        TEXT_C = "#E8DFD3"
        NA_C = "#F1C40F"
        CL_C = "#27AE60"
        E_C = "#3498DB"
        BOND_C = "#E8DFD3"
        POS_C = "#E74C3C"
        NEG_C = "#3498DB"
        HL_C = "#FFD93D"

        self.camera.background_color = BG

        # Persistent title
        title = Text("离子键的形成 NaCl", font_size=36, color=TEXT_C).to_edge(UP, buff=0.15)
        self.add(title)

        # Scene 1: Na and Cl appear
        na = Circle(radius=0.5, fill_color=NA_C, fill_opacity=0.85, stroke_color=WHITE).move_to((-2.5, 0.8, 0))
        cl = Circle(radius=0.55, fill_color=CL_C, fill_opacity=0.85, stroke_color=WHITE).move_to((2.5, 0.8, 0))
        na_label = MathTex("Na", font_size=30, color=TEXT_C).next_to(na, UP, buff=0.2)
        cl_label = MathTex("Cl", font_size=30, color=TEXT_C).next_to(cl, UP, buff=0.2)
        reason1 = Text("钠原子Na和氯原子Cl靠近", font_size=22, color=TEXT_C).to_edge(DOWN, buff=1.2)

        s1 = VGroup(na, cl, na_label, cl_label, reason1)
        self.play(GrowFromCenter(na), GrowFromCenter(cl), Write(na_label), Write(cl_label), Write(reason1), run_time=1.5)
        self.wait(4)
        self.play(FadeOut(reason1))

        # Scene 2: Na outer electron
        electron = Dot(radius=0.12, color=E_C).move_to((-1.7, 0.8, 0))
        e_label = MathTex("e^-", font_size=30, color=E_C).next_to(electron, UP, buff=0.15)
        arrow = Arrow(start=(-2.0, 0.2), end=(-1.75, 0.65), color=E_C, buff=0.1, stroke_width=3)
        reason2 = Text("钠最外层只有1个电子，容易失去", font_size=22, color=TEXT_C).to_edge(DOWN, buff=1.2)

        s2 = VGroup(electron, e_label, arrow, reason2)
        self.play(FadeIn(electron), Write(e_label), GrowArrow(arrow), Write(reason2), run_time=1.5)
        self.wait(4)
        self.play(FadeOut(arrow), FadeOut(reason2))

        # Scene 3: Electron transfer
        reason3 = Text("电子从Na转移给Cl", font_size=22, color=TEXT_C).to_edge(DOWN, buff=1.2)
        formula3 = MathTex("Na \\to Na^+ + e^-", font_size=30, color=TEXT_C).to_edge(DOWN, buff=0.3)
        arc_path = TracedPath(electron.get_center, stroke_color=E_C, stroke_width=2, stroke_opacity=0.6)
        self.add(arc_path)

        s3 = VGroup(reason3, formula3)
        self.play(Write(reason3), Write(formula3), run_time=1)
        self.play(
            electron.animate.move_to((1.7, 0.8, 0)).set_path_arc(radius=2, arc_angles=PI/3),
            na.animate.set_fill(opacity=0.6),
            cl.animate.set_fill(opacity=1.0),
            run_time=2
        )
        self.wait(3)
        self.play(FadeOut(reason3), FadeOut(formula3), FadeOut(arc_path), FadeOut(e_label))

        # Scene 4: Form Na+ and Cl-
        na_plus_label = MathTex("Na^+", font_size=30, color=TEXT_C).move_to(na_label.get_center())
        cl_minus_label = MathTex("Cl^-", font_size=30, color=TEXT_C).move_to(cl_label.get_center())
        plus_sign = Text("+", font_size=30, color=POS_C).next_to(na, LEFT, buff=0.15)
        minus_sign = Text("-", font_size=30, color=NEG_C).next_to(cl, RIGHT, buff=0.15)
        reason4 = Text("Na失去电子变Na⁺正离子，Cl得到电子变Cl⁻负离子", font_size=22, color=TEXT_C).to_edge(DOWN, buff=1.2)
        formula4 = MathTex("Na^+ + Cl^-", font_size=30, color=TEXT_C).to_edge(DOWN, buff=0.3)

        s4 = VGroup(plus_sign, minus_sign, reason4, formula4)
        self.play(
            Transform(na_label, na_plus_label),
            Transform(cl_label, cl_minus_label),
            FadeIn(plus_sign),
            FadeIn(minus_sign),
            Write(reason4),
            Write(formula4),
            run_time=1.5
        )
        self.wait(4.5)
        self.play(FadeOut(reason4), FadeOut(formula4))

        # Scene 5: Attract to form NaCl
        reason5 = Text("正负电荷相吸，形成离子键NaCl", font_size=22, color=TEXT_C).to_edge(DOWN, buff=1.2)
        bond_line = Line(start=na.get_right(), end=cl.get_left(), color=BOND_C, stroke_width=4)
        nacl_formula = MathTex("NaCl", font_size=30, color=HL_C).to_edge(DOWN, buff=0.3)
        hl_box = SurroundingRectangle(nacl_formula, color=HL_C, buff=0.15, stroke_width=2)

        s5 = VGroup(reason5, bond_line, nacl_formula, hl_box)
        self.play(Write(reason5), run_time=1)
        self.play(
            na.animate.shift(RIGHT * 1),
            cl.animate.shift(LEFT * 1),
            na_label.animate.shift(RIGHT * 1),
            cl_label.animate.shift(LEFT * 1),
            plus_sign.animate.shift(RIGHT * 1),
            minus_sign.animate.shift(LEFT * 1),
            electron.animate.shift(LEFT * 1),
            run_time=1.5
        )
        bond_line_new = Line(start=na.get_right(), end=cl.get_left(), color=BOND_C, stroke_width=4)
        self.play(Create(bond_line_new), run_time=1)
        self.play(Write(nacl_formula), Create(hl_box), run_time=1)
        self.wait(3)
