from manim import *
import numpy as np

class GeneratedCourseware(ThreeDScene):
    def construct(self):
        # Colors
        BG = "#0D1117"
        TEXT_C = "#E8DFD3"
        C_C = "#2C3E50"
        SINGLE_C = "#95A5A6"
        DOUBLE_C = "#E74C3C"
        UNIFORM_C = "#F39C12"
        PI_C = "#3498DB"
        HL_C = "#FFD93D"

        self.camera.background_color = BG
        R = 1.5
        OFFSET = 0.15

        # Vertices
        verts = []
        for k in range(6):
            ang = k * PI / 3
            verts.append(np.array([R * np.cos(ang), R * np.sin(ang), 0.0]))

        # Title
        title = Text("苯环大π键 共振结构", font_size=36, color=TEXT_C)
        title.to_edge(UP, buff=0.15)
        self.add_fixed_in_frame_mobjects(title)
        self.play(FadeIn(title), run_time=0.6)

        # Initial camera (front 2D-like)
        self.set_camera_orientation(phi=0*DEGREES, theta=-90*DEGREES, zoom=1.0)

        # ========== Scene 1: Kekule structure ==========
        carbons = VGroup(*[
            Sphere(center=v, radius=0.2, color=C_C).set_shade_in_3d(True)
            for v in verts
        ])

        def single_bond(i, j):
            return Line3D(verts[i], verts[j], color=SINGLE_C, thickness=0.04)

        def double_bond(i, j):
            p1, p2 = verts[i], verts[j]
            d = p2 - p1
            perp = np.array([-d[1], d[0], 0.0])
            perp = perp / np.linalg.norm(perp) * OFFSET
            l1 = Line3D(p1 + perp, p2 + perp, color=DOUBLE_C, thickness=0.035)
            l2 = Line3D(p1 - perp, p2 - perp, color=DOUBLE_C, thickness=0.035)
            return VGroup(l1, l2)

        # form A: double bonds at (0,1),(2,3),(4,5); single at (1,2),(3,4),(5,0)
        double_pairs_a = [(0,1),(2,3),(4,5)]
        single_pairs_a = [(1,2),(3,4),(5,0)]
        doubles_a = VGroup(*[double_bond(i,j) for i,j in double_pairs_a])
        singles = VGroup(*[single_bond(i,j) for i,j in single_pairs_a])

        formula1 = MathTex("C_6H_6", color=TEXT_C, font_size=30)
        formula1.to_edge(DOWN, buff=1.2)
        reason1 = Text("凯库勒结构：单双键交替排列", font_size=22, color=TEXT_C)
        reason1.to_edge(DOWN, buff=0.8)
        self.add_fixed_in_frame_mobjects(reason1, formula1)

        self.play(
            Create(singles),
            Create(doubles_a),
            FadeIn(carbons),
            FadeIn(reason1),
            FadeIn(formula1),
            run_time=2.0
        )
        self.wait(5.5)
        self.play(FadeOut(reason1), FadeOut(formula1), run_time=0.4)

        # ========== Scene 2: Oscillation ==========
        reason2 = Text("两种凯库勒极限式来回震荡", font_size=22, color=TEXT_C)
        reason2.to_edge(DOWN, buff=0.8)
        self.add_fixed_in_frame_mobjects(reason2)
        self.play(FadeIn(reason2), run_time=0.5)

        # form B: double bonds at (1,2),(3,4),(5,0)
        double_pairs_b = [(1,2),(3,4),(5,0)]
        doubles_b = VGroup(*[double_bond(i,j) for i,j in double_pairs_b])

        # Oscillate
        current_doubles = doubles_a
        for _ in range(3):
            self.play(Transform(current_doubles, doubles_b), run_time=1.0)
            self.wait(0.2)
            self.play(Transform(current_doubles, doubles_a), run_time=1.0)
            self.wait(0.2)
        self.wait(1.5)
        self.play(FadeOut(reason2), run_time=0.4)

        # ========== Scene 3: Uniform bonds ==========
        reason3 = Text("键长平均化：所有C-C键等长（1.5键级）", font_size=22, color=TEXT_C)
        reason3.to_edge(DOWN, buff=0.8)
        self.add_fixed_in_frame_mobjects(reason3)
        self.play(FadeIn(reason3), run_time=0.5)

        all_pairs = [(0,1),(1,2),(2,3),(3,4),(4,5),(5,0)]
        uniform_bonds = VGroup(*[
            Line3D(verts[i], verts[j], color=UNIFORM_C, thickness=0.06)
            for i,j in all_pairs
        ])
        self.play(
            FadeOut(singles),
            FadeOut(current_doubles),
            FadeIn(uniform_bonds),
            run_time=2.0
        )
        self.wait(5.0)
        self.play(FadeOut(reason3), run_time=0.4)

        # ========== Scene 4: Pi cloud ==========
        reason4 = Text("6个π电子离域，形成大π键电子云", font_size=22, color=TEXT_C)
        reason4.to_edge(DOWN, buff=0.8)
        self.add_fixed_in_frame_mobjects(reason4)
        self.play(FadeIn(reason4), run_time=0.5)

        # Rotate camera to 3D view
        self.move_camera(phi=55*DEGREES, theta=-60*DEGREES, run_time=3.0)

        # Pi clouds as tori (ring-shaped) above and below
        cloud_top = Torus(
            major_radius=1.2, minor_radius=0.35,
            color=PI_C, fill_opacity=0.3, stroke_opacity=0.2
        ).shift(UP * 0.5)
        cloud_bot = Torus(
            major_radius=1.2, minor_radius=0.35,
            color=PI_C, fill_opacity=0.3, stroke_opacity=0.2
        ).shift(DOWN * 0.5)
        clouds = VGroup(cloud_top, cloud_bot)

        self.play(FadeIn(clouds), run_time=2.0)

        # Small electron dots
        electrons = VGroup()
        for k in range(6):
            ang = k * PI / 3
            pos_top = np.array([1.2*np.cos(ang), 1.2*np.sin(ang), 0.5])
            pos_bot = np.array([1.2*np.cos(ang+PI/6), 1.2*np.sin(ang+PI/6), -0.5])
            electrons.add(
                Sphere(center=pos_top, radius=0.07, color=PI_C).set_shade_in_3d(True),
                Sphere(center=pos_bot, radius=0.07, color=PI_C).set_shade_in_3d(True),
            )
        self.play(FadeIn(electrons), run_time=1.0)

        # Gentle rotation
        self.begin_ambient_camera_rotation(rate=0.15)
        self.wait(3.0)
        self.stop_ambient_camera_rotation()
        self.play(FadeOut(reason4), run_time=0.4)

        # ========== Scene 5: Conclusion ==========
        reason5 = Text("苯环不是单双交替，而是6电子离域的共振平均态", font_size=22, color=TEXT_C)
        reason5.to_edge(DOWN, buff=0.8)
        conclusion = Text("真实结构是共振平均态", font_size=30, color=HL_C)
        conclusion.to_edge(DOWN, buff=0.2)
        formula5 = MathTex("C_6H_6", color=TEXT_C, font_size=30)
        formula5.to_edge(DOWN, buff=1.2)
        hl_box = SurroundingRectangle(conclusion, color=HL_C, buff=0.15, stroke_width=3)

        self.add_fixed_in_frame_mobjects(reason5, conclusion, formula5, hl_box)

        self.move_camera(phi=50*DEGREES, theta=-50*DEGREES, run_time=2.0)
        self.play(
            FadeIn(reason5),
            FadeIn(formula5),
            Write(conclusion),
            Create(hl_box),
            run_time=2.0
        )
        self.wait(4.0)
