from manim import *
import numpy as np


def lorenz(state, sigma=10, rho=28, beta=8/3):
    x, y, z = state
    return np.array([sigma * (y - x), x * (rho - z) - y, x * y - beta * z])


def rk4_step(state, dt, sigma=10, rho=28, beta=8/3):
    k1 = lorenz(state, sigma, rho, beta)
    k2 = lorenz(state + 0.5 * dt * k1, sigma, rho, beta)
    k3 = lorenz(state + 0.5 * dt * k2, sigma, rho, beta)
    k4 = lorenz(state + dt * k3, sigma, rho, beta)
    return state + dt * (k1 + 2 * k2 + 2 * k3 + k4) / 6


def compute_traj(init, dt, steps, sigma=10, rho=28, beta=8/3, scale=0.15):
    pts = np.zeros((steps, 3))
    s = np.array(init, dtype=float)
    for i in range(steps):
        pts[i] = np.array([s[0] * scale, s[1] * scale, (s[2] - 25) * scale])
        s = rk4_step(s, dt, sigma, rho, beta)
    return pts


class GeneratedCourseware(ThreeDScene):
    def construct(self):
        self.camera.background_color = "#0D1117"
        np.random.seed(42)

        sigma = 10
        rho = 28
        beta = 8/3
        dt = 0.01
        steps = 8000
        init_a = [1.0, 1.0, 1.0]
        init_b = [1.001, 1.0, 1.0]
        scale_factor = 0.15

        pts_a = compute_traj(init_a, dt, steps, sigma, rho, beta, scale_factor)
        pts_b = compute_traj(init_b, dt, steps, sigma, rho, beta, scale_factor)

        title = Text("洛伦兹吸引子 蝴蝶效应", font_size=36, color="#E8DFD3")
        title.to_edge(UP, buff=0.15)
        self.add_fixed_in_frame_mobjects(title)
        self.add(title)

        axes = ThreeDAxes(
            x_range=[-4, 4, 1],
            y_range=[-4, 4, 1],
            z_range=[-4, 4, 1],
            x_length=8,
            y_length=8,
            z_length=8,
        )
        axes.set_color("#E8DFD3")
        x_label = Text("x", font_size=22, color="#E8DFD3")
        y_label = Text("y", font_size=22, color="#E8DFD3")
        z_label = Text("z", font_size=22, color="#E8DFD3")
        x_label.move_to(axes.c2p(3.6, 0, 0))
        y_label.move_to(axes.c2p(0, 3.6, 0))
        z_label.move_to(axes.c2p(0, 0, 3.6))

        # Scene 1
        r1 = Text("在3D空间中观察动力系统", font_size=22, color="#E8DFD3")
        r1.to_edge(DOWN, buff=0.8)
        self.add_fixed_in_frame_mobjects(r1)
        g1 = VGroup(axes, x_label, y_label, z_label)
        self.play(Create(axes), Write(x_label), Write(y_label), Write(z_label))
        self.move_camera(phi=70 * DEGREES, theta=-45 * DEGREES, run_time=2)
        self.play(FadeIn(r1), run_time=1)
        self.wait(2)
        self.play(FadeOut(r1), run_time=0.8)

        # Scene 2
        eq1 = MathTex(r"\dot{x}=\sigma(y-x)", font_size=30, color="#E8DFD3")
        eq2 = MathTex(r"\dot{y}=x(\rho-z)-y", font_size=30, color="#E8DFD3")
        eq3 = MathTex(r"\dot{z}=xy-\beta z", font_size=30, color="#E8DFD3")
        eqs = VGroup(eq1, eq2, eq3).arrange(DOWN, aligned_edge=LEFT, buff=0.15)
        params = MathTex(r"\sigma=10,\ \rho=28,\ \beta=8/3", font_size=24, color="#FFD93D")
        params.next_to(eqs, DOWN, buff=0.2)
        eq_block = VGroup(eqs, params)
        eq_block.to_corner(UR, buff=0.4)
        r2 = Text("洛伦兹方程：三个微分方程描述大气对流", font_size=22, color="#E8DFD3")
        r2.to_edge(DOWN, buff=0.8)
        self.add_fixed_in_frame_mobjects(eq_block, r2)
        g2 = VGroup(eq_block, r2)
        self.play(Write(eq1), Write(eq2), Write(eq3), run_time=2)
        self.play(Write(params), FadeIn(r2), run_time=1.5)
        self.begin_ambient_camera_rotation(rate=0.08)
        self.wait(3)
        self.play(FadeOut(r2), run_time=0.6)

        # Scene 3
        traj_a = VMobject(stroke_width=2, stroke_color="#3498DB")
        traj_a.set_points_as_corners([axes.c2p(*p) for p in pts_a])
        traj_a.set_color_by_gradient("#85C1E9", "#3498DB", "#1B4F72")
        start_dot = Dot3D(point=axes.c2p(*pts_a[0]), radius=0.06, color="#FFD93D")
        r3 = Text("轨迹从初始点开始螺旋演化", font_size=22, color="#E8DFD3")
        r3.to_edge(DOWN, buff=0.8)
        self.add_fixed_in_frame_mobjects(r3)
        g3 = VGroup(start_dot, r3)
        self.play(FadeIn(start_dot), FadeIn(r3), run_time=0.8)
        self.play(Create(traj_a), run_time=8, rate_func=linear)
        self.wait(1)
        self.play(FadeOut(r3), run_time=0.6)

        # Scene 4
        left_ring = Circle(radius=0.9, color="#1a5276", stroke_width=3, fill_opacity=0.08)
        left_ring.move_to(axes.c2p(-1.5, -1.5, 0.2))
        right_ring = Circle(radius=0.9, color="#922b21", stroke_width=3, fill_opacity=0.08)
        right_ring.move_to(axes.c2p(1.5, 1.5, 0.2))
        r4 = Text("轨迹形成蝴蝶双翼——洛伦兹吸引子", font_size=22, color="#E8DFD3")
        r4.to_edge(DOWN, buff=0.8)
        self.add_fixed_in_frame_mobjects(r4)
        g4 = VGroup(left_ring, right_ring, r4)
        self.stop_ambient_camera_rotation()
        self.play(
            MoveCamera(phi=75 * DEGREES, theta=-60 * DEGREES, run_time=5),
            FadeIn(left_ring),
            FadeIn(right_ring),
            FadeIn(r4),
        )
        self.wait(2)
        self.play(FadeOut(left_ring), FadeOut(right_ring), FadeOut(r4), run_time=0.8)

        # Scene 5
        traj_b = VMobject(stroke_width=2, stroke_color="#E74C3C")
        traj_b.set_points_as_corners([axes.c2p(*p) for p in pts_b])
        traj_b.set_color_by_gradient("#F1948A", "#E74C3C", "#7B241C")
        r5 = Text("初始条件微小差异→轨迹完全不同=蝴蝶效应", font_size=22, color="#E8DFD3")
        r5.to_edge(DOWN, buff=0.8)
        answer = Text("蝴蝶效应：微小差异→巨大不同", font_size=30, color="#FFD93D")
        answer.to_edge(DOWN, buff=0.2)
        delta = MathTex(r"\delta_0 \to 0,\ \delta_t \to \infty", font_size=30, color="#E8DFD3")
        delta.next_to(answer, UP, buff=0.2)
        hl = SurroundingRectangle(answer, color="#FFD93D", buff=0.15, stroke_width=2)
        self.add_fixed_in_frame_mobjects(r5, answer, delta, hl)
        g5 = VGroup(traj_b, r5, answer, delta, hl)
        self.begin_ambient_camera_rotation(rate=0.06)
        self.play(FadeIn(r5), run_time=0.6)
        self.play(Create(traj_b), run_time=6, rate_func=linear)
        self.play(Write(delta), run_time=1)
        self.play(FadeIn(answer), Create(hl), run_time=1.2)
        self.wait(3)
        self.stop_ambient_camera_rotation()
