from manim import *

class GeneratedCourseware(Scene):
    def construct(self):
        T = 36
        M = 30
        S = 22
        BG = "#0D1117"
        TEXT_COL = "#E8DFD3"
        SOURCE_COL = "#FFD93D"
        WAVE_COL = "#4ECDC4"
        LIGHT_COL = "#FFD93D"
        BRIGHT = "#FFD93D"
        DARK = "#3C4046"
        BARRIER = "#E8DFD3"
        HIGHLIGHT = "#FFD93D"

        self.camera.background_color = BG

        title = Text("双缝干涉", font_size=T, color=TEXT_COL).to_edge(UP, buff=0.15)
        self.add(title)

        # Scene 1
        s1 = VGroup()
        src1 = Dot(point=[-2, 1.0, 0], color=WAVE_COL, radius=0.08)
        src2 = Dot(point=[2, 1.0, 0], color=WAVE_COL, radius=0.08)
        s1.add(src1, src2)
        radii = [0.5, 1.0, 1.5, 2.0, 2.5]
        for r in radii:
            c1 = Circle(radius=r, color=WAVE_COL, stroke_width=2).move_to(src1.get_center())
            c2 = Circle(radius=r, color=WAVE_COL, stroke_width=2).move_to(src2.get_center())
            s1.add(c1, c2)
        reason1 = Text("两源波纹相遇，有增强有抵消", font_size=S, color=TEXT_COL).to_edge(DOWN, buff=1.0)
        self.play(Create(src1), Create(src2))
        self.play(*[Create(m) for m in s1[2:]], run_time=3)
        self.play(Write(reason1), run_time=1.5)
        self.wait(2)
        self.play(FadeOut(s1), FadeOut(reason1))

        # Scene 2
        s2 = VGroup()
        light_src = Dot(point=[-5.5, 0.5, 0], color=SOURCE_COL, radius=0.12)
        s2.add(light_src)

        single_barrier = Rectangle(width=0.1, height=2.5, color=BARRIER, fill_color=BARRIER, fill_opacity=1.0).move_to([-3.5, 0.5, 0])
        single_gap = Rectangle(width=0.12, height=0.15, color=BG, fill_color=BG, fill_opacity=1.0).move_to([-3.5, 0.5, 0])
        s2.add(single_barrier, single_gap)

        double_barrier = Rectangle(width=0.1, height=2.5, color=BARRIER, fill_color=BARRIER, fill_opacity=1.0).move_to([-1.5, 0.6, 0])
        gap1 = Rectangle(width=0.12, height=0.15, color=BG, fill_color=BG, fill_opacity=1.0).move_to([-1.5, 1.2, 0])
        gap2 = Rectangle(width=0.12, height=0.15, color=BG, fill_color=BG, fill_opacity=1.0).move_to([-1.5, 0.0, 0])
        s2.add(double_barrier, gap1, gap2)

        screen = Line(start=[4, -1.5, 0], end=[4, 2.5, 0], color=BARRIER, stroke_width=3)
        s2.add(screen)

        ray1 = Line(start=[-5.5, 0.5, 0], end=[-3.5, 0.5, 0], color=LIGHT_COL, stroke_width=2)
        ray2a = Line(start=[-3.5, 0.5, 0], end=[-1.5, 1.2, 0], color=LIGHT_COL, stroke_width=2)
        ray2b = Line(start=[-3.5, 0.5, 0], end=[-1.5, 0.0, 0], color=LIGHT_COL, stroke_width=2)
        s2.add(ray1, ray2a, ray2b)

        reason2 = Text("相干光经双缝成为两个相干光源", font_size=S, color=TEXT_COL).to_edge(DOWN, buff=1.0)
        self.play(Create(light_src))
        self.play(Create(single_barrier), Create(single_gap))
        self.play(Create(double_barrier), Create(gap1), Create(gap2))
        self.play(Create(screen))
        self.play(Create(ray1), Create(ray2a), Create(ray2b), run_time=1.5)
        self.play(Write(reason2), run_time=1.5)
        self.wait(2)
        self.play(FadeOut(reason2))

        # Scene 3
        s3 = VGroup()
        slit1_pos = np.array([-1.5, 1.2, 0])
        slit2_pos = np.array([-1.5, 0.0, 0])
        wave_circles = []
        for i in range(6):
            c1 = Circle(radius=0.4 + i*0.55, color=LIGHT_COL, stroke_width=1.5, fill_opacity=0).move_to(slit1_pos)
            c2 = Circle(radius=0.4 + i*0.55, color=LIGHT_COL, stroke_width=1.5, fill_opacity=0).move_to(slit2_pos)
            wave_circles.append((c1, c2))
            s3.add(c1, c2)
        reason3 = Text("两波叠加，路径差决定增强或抵消", font_size=S, color=TEXT_COL).to_edge(DOWN, buff=1.0)
        self.play(*[GrowFromCenter(c1) for c1,c2 in wave_circles],
                  *[GrowFromCenter(c2) for c1,c2 in wave_circles],
                  run_time=4)
        self.play(Write(reason3), run_time=1.5)
        self.wait(2.5)
        self.play(FadeOut(s3), FadeOut(reason3))

        # Scene 4
        s4 = VGroup()
        bright_ys = [0.6, 1.6, -0.4, 2.6, -1.4]
        dark_ys = [1.1, 0.1, 2.1, -0.9]
        fringes = []
        for y in bright_ys:
            r = Rectangle(width=0.35, height=0.22, fill_color=BRIGHT, fill_opacity=0.85, stroke_width=0).move_to([4, y, 0])
            fringes.append(r)
            s4.add(r)
        for y in dark_ys:
            r = Rectangle(width=0.35, height=0.22, fill_color=DARK, fill_opacity=0.85, stroke_width=0).move_to([4, y, 0])
            s4.add(r)
        reason4 = Text("明纹：路径差为波长整数倍；暗纹：半波长奇数倍", font_size=S, color=TEXT_COL).to_edge(DOWN, buff=1.0)
        order = [0,1,2,3,4]
        center_idx = 0
        self.play(FadeIn(fringes[center_idx]), run_time=0.6)
        self.play(FadeIn(fringes[1]), FadeIn(fringes[2]), run_time=1.0)
        self.play(FadeIn(fringes[3]), FadeIn(fringes[4]), run_time=1.0)
        self.play(*[FadeIn(m) for m in s4[5:]], run_time=1.0)
        self.play(Write(reason4), run_time=1.5)
        self.wait(2)
        self.play(FadeOut(reason4))

        # Scene 5
        s5 = VGroup()
        eq1 = MathTex(r"\Delta d = d\sin\theta = m\lambda", font_size=M, color=BRIGHT)
        eq2 = MathTex(r"\Delta d = (m+\tfrac{1}{2})\lambda", font_size=M, color=TEXT_COL)
        eq_group = VGroup(eq1, eq2).arrange(DOWN, buff=0.25).to_edge(DOWN, buff=0.3)
        box = SurroundingRectangle(eq_group, color=HIGHLIGHT, buff=0.15, stroke_width=2)
        s5.add(eq_group, box)
        reason5 = Text("光加光等于暗，证明光是一种波", font_size=S, color=TEXT_COL).to_edge(DOWN, buff=1.2)
        self.play(Write(eq1), Write(eq2), run_time=2)
        self.play(Create(box), run_time=1)
        self.play(Write(reason5), run_time=1.5)
        self.wait(3)
        self.play(FadeOut(s5), FadeOut(reason5), FadeOut(s2), FadeOut(s4), FadeOut(title))
