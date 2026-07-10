from manim import *
import numpy as np

class GeneratedCourseware(ThreeDScene):
    def construct(self):
        self.camera.background_color = "#0D1117"
        R = 2
        W = 0.5

        title = Text("莫比乌斯带 | 单侧曲面", font_size=36, color="#E8DFD3")
        title.to_edge(UP, buff=0.15)
        self.add_fixed_in_frame_mobjects(title)
        self.play(Write(title), run_time=1)

        self.set_camera_orientation(phi=60*DEGREES, theta=-45*DEGREES)

        # Scene 1: flat strip
        def flat_strip(u, v):
            return np.array([u, v, 0])
        strip = Surface(
            flat_strip,
            u_range=[-3, 3], v_range=[-W, W],
            resolution=(60, 10),
            color="#4ECDC4", fill_opacity=0.7, stroke_opacity=0.2
        )
        desc1 = Text("这是一条普通纸带", font_size=22, color="#E8DFD3")
        desc1.to_edge(DOWN, buff=1.2)
        self.add_fixed_in_frame_mobjects(desc1)
        g1 = VGroup(strip)
        self.play(Create(strip), FadeIn(desc1), run_time=2)
        self.wait(2)

        # Scene 2: twist 180
        alpha = ValueTracker(0)
        def twisted(u, v):
            a = alpha.get_value()
            x = u
            y = v * np.cos(a * (u + 3) / 6)
            z = v * np.sin(a * (u + 3) / 6)
            return np.array([x, y, z])
        twisted_surface = always_redraw(lambda: Surface(
            twisted, u_range=[-3, 3], v_range=[-W, W],
            resolution=(60, 10),
            color="#4ECDC4", fill_opacity=0.7, stroke_opacity=0.2
        ))
        desc2 = Text("一端扭转180度", font_size=22, color="#E8DFD3")
        desc2.to_edge(DOWN, buff=1.2)
        self.add_fixed_in_frame_mobjects(desc2)
        self.play(FadeOut(desc1), FadeIn(desc2), run_time=0.5)
        self.play(ReplacementTransform(strip, twisted_surface), run_time=1)
        self.play(alpha.animate.set_value(PI), run_time=4)
        self.wait(1)

        # Scene 3: join ends -> mobius
        def mobius(u, v):
            x = (R + v*np.cos(u/2))*np.cos(u)
            y = (R + v*np.cos(u/2))*np.sin(u)
            z = v*np.sin(u/2)
            return np.array([x, y, z])
        mobius_surf = Surface(
            mobius, u_range=[0, 2*PI], v_range=[-W, W],
            resolution=(60, 10),
            color="#F39C12", fill_opacity=0.7, stroke_opacity=0.2
        )
        desc3 = Text("首尾相接成莫比乌斯带", font_size=22, color="#E8DFD3")
        desc3.to_edge(DOWN, buff=1.2)
        self.add_fixed_in_frame_mobjects(desc3)
        self.play(FadeOut(desc2), FadeIn(desc3), run_time=0.5)
        self.play(Transform(twisted_surface, mobius_surf), run_time=3)
        self.wait(2)

        # Scene 4: ant walks
        t_tracker = ValueTracker(0)
        ant = always_redraw(lambda: Dot3D(
            mobius(t_tracker.get_value(), 0),
            radius=0.1, color="#E74C3C"
        ))
        trail = TracedPath(ant.get_center, stroke_color="#FFD93D", stroke_width=4)
        desc4 = Text("蚂蚁走一圈，到了反面", font_size=22, color="#E8DFD3")
        desc4.to_edge(DOWN, buff=1.2)
        self.add_fixed_in_frame_mobjects(desc4)
        self.play(FadeOut(desc3), FadeIn(desc4), run_time=0.5)
        self.add(ant, trail)
        self.play(t_tracker.animate.set_value(2*PI), run_time=6, rate_func=linear)
        self.wait(1)

        # Scene 5: one-sided conclusion
        answer = Text("只有一个面的单侧曲面", font_size=30, color="#FFD93D")
        answer.to_edge(DOWN, buff=0.3)
        box = SurroundingRectangle(answer, color="#FFD93D", buff=0.15, stroke_width=2)
        formula = MathTex(r"\text{M\"obius} = \text{one-sided surface}", font_size=30, color="#E8DFD3")
        formula.to_edge(DOWN, buff=1.2)
        self.add_fixed_in_frame_mobjects(answer, box, formula)
        self.play(FadeOut(desc4), run_time=0.5)
        self.play(Write(formula), FadeIn(answer), Create(box), run_time=2)
        self.move_camera(phi=70*DEGREES, theta=-30*DEGREES, run_time=4)
        self.wait(2)
