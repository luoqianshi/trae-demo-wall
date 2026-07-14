use super::vector::Vec3;
use super::utils::is_zero;
use bytemuck::{Pod, Zeroable};

#[repr(C)]
#[derive(Debug, Clone, Copy, PartialEq, Pod, Zeroable)]
pub struct Mat4 {
    pub m: [[f64; 4]; 4],
}

impl Mat4 {
    pub const ZERO: Mat4 = Mat4 { m: [[0.0; 4]; 4] };
    pub const IDENTITY: Mat4 = Mat4 {
        m: [
            [1.0, 0.0, 0.0, 0.0],
            [0.0, 1.0, 0.0, 0.0],
            [0.0, 0.0, 1.0, 0.0],
            [0.0, 0.0, 0.0, 1.0],
        ],
    };

    pub fn new() -> Mat4 {
        Mat4::IDENTITY
    }

    pub fn from_cols(
        c0: Vec3, c1: Vec3, c2: Vec3, c3: Vec3,
    ) -> Mat4 {
        Mat4 {
            m: [
                [c0.x, c1.x, c2.x, c3.x],
                [c0.y, c1.y, c2.y, c3.y],
                [c0.z, c1.z, c2.z, c3.z],
                [0.0, 0.0, 0.0, 1.0],
            ],
        }
    }

    pub fn from_rows(
        r0: [f64; 4], r1: [f64; 4], r2: [f64; 4], r3: [f64; 4],
    ) -> Mat4 {
        Mat4 {
            m: [r0, r1, r2, r3],
        }
    }

    pub fn transpose(self) -> Mat4 {
        Mat4 {
            m: [
                [self.m[0][0], self.m[1][0], self.m[2][0], self.m[3][0]],
                [self.m[0][1], self.m[1][1], self.m[2][1], self.m[3][1]],
                [self.m[0][2], self.m[1][2], self.m[2][2], self.m[3][2]],
                [self.m[0][3], self.m[1][3], self.m[2][3], self.m[3][3]],
            ],
        }
    }

    pub fn determinant(self) -> f64 {
        let m = self.m;
        m[0][0] * (m[1][1] * (m[2][2] * m[3][3] - m[2][3] * m[3][2])
            - m[1][2] * (m[2][1] * m[3][3] - m[2][3] * m[3][1])
            + m[1][3] * (m[2][1] * m[3][2] - m[2][2] * m[3][1]))
            - m[0][1] * (m[1][0] * (m[2][2] * m[3][3] - m[2][3] * m[3][2])
                - m[1][2] * (m[2][0] * m[3][3] - m[2][3] * m[3][0])
                + m[1][3] * (m[2][0] * m[3][2] - m[2][2] * m[3][0]))
            + m[0][2] * (m[1][0] * (m[2][1] * m[3][3] - m[2][3] * m[3][1])
                - m[1][1] * (m[2][0] * m[3][3] - m[2][3] * m[3][0])
                + m[1][3] * (m[2][0] * m[3][1] - m[2][1] * m[3][0]))
            - m[0][3] * (m[1][0] * (m[2][1] * m[3][2] - m[2][2] * m[3][1])
                - m[1][1] * (m[2][0] * m[3][2] - m[2][2] * m[3][0])
                + m[1][2] * (m[2][0] * m[3][1] - m[2][1] * m[3][0]))
    }

    pub fn inverse(self) -> Option<Mat4> {
        let det = self.determinant();
        if is_zero(det) {
            return None;
        }

        let m = self.m;
        let inv_det = 1.0 / det;

        let mut inv = Mat4::ZERO;
        inv.m[0][0] = (m[1][1] * (m[2][2] * m[3][3] - m[2][3] * m[3][2])
            - m[1][2] * (m[2][1] * m[3][3] - m[2][3] * m[3][1])
            + m[1][3] * (m[2][1] * m[3][2] - m[2][2] * m[3][1])) * inv_det;
        inv.m[0][1] = -(m[0][1] * (m[2][2] * m[3][3] - m[2][3] * m[3][2])
            - m[0][2] * (m[2][1] * m[3][3] - m[2][3] * m[3][1])
            + m[0][3] * (m[2][1] * m[3][2] - m[2][2] * m[3][1])) * inv_det;
        inv.m[0][2] = (m[0][1] * (m[1][2] * m[3][3] - m[1][3] * m[3][2])
            - m[0][2] * (m[1][1] * m[3][3] - m[1][3] * m[3][1])
            + m[0][3] * (m[1][1] * m[3][2] - m[1][2] * m[3][1])) * inv_det;
        inv.m[0][3] = -(m[0][1] * (m[1][2] * m[2][3] - m[1][3] * m[2][2])
            - m[0][2] * (m[1][1] * m[2][3] - m[1][3] * m[2][1])
            + m[0][3] * (m[1][1] * m[2][2] - m[1][2] * m[2][1])) * inv_det;

        inv.m[1][0] = -(m[1][0] * (m[2][2] * m[3][3] - m[2][3] * m[3][2])
            - m[1][2] * (m[2][0] * m[3][3] - m[2][3] * m[3][0])
            + m[1][3] * (m[2][0] * m[3][2] - m[2][2] * m[3][0])) * inv_det;
        inv.m[1][1] = (m[0][0] * (m[2][2] * m[3][3] - m[2][3] * m[3][2])
            - m[0][2] * (m[2][0] * m[3][3] - m[2][3] * m[3][0])
            + m[0][3] * (m[2][0] * m[3][2] - m[2][2] * m[3][0])) * inv_det;
        inv.m[1][2] = -(m[0][0] * (m[1][2] * m[3][3] - m[1][3] * m[3][2])
            - m[0][2] * (m[1][0] * m[3][3] - m[1][3] * m[3][0])
            + m[0][3] * (m[1][0] * m[3][2] - m[1][2] * m[3][0])) * inv_det;
        inv.m[1][3] = (m[0][0] * (m[1][2] * m[2][3] - m[1][3] * m[2][2])
            - m[0][2] * (m[1][0] * m[2][3] - m[1][3] * m[2][0])
            + m[0][3] * (m[1][0] * m[2][2] - m[1][2] * m[2][0])) * inv_det;

        inv.m[2][0] = (m[1][0] * (m[2][1] * m[3][3] - m[2][3] * m[3][1])
            - m[1][1] * (m[2][0] * m[3][3] - m[2][3] * m[3][0])
            + m[1][3] * (m[2][0] * m[3][1] - m[2][1] * m[3][0])) * inv_det;
        inv.m[2][1] = -(m[0][0] * (m[2][1] * m[3][3] - m[2][3] * m[3][1])
            - m[0][1] * (m[2][0] * m[3][3] - m[2][3] * m[3][0])
            + m[0][3] * (m[2][0] * m[3][1] - m[2][1] * m[3][0])) * inv_det;
        inv.m[2][2] = (m[0][0] * (m[1][1] * m[3][3] - m[1][3] * m[3][1])
            - m[0][1] * (m[1][0] * m[3][3] - m[1][3] * m[3][0])
            + m[0][3] * (m[1][0] * m[3][1] - m[1][1] * m[3][0])) * inv_det;
        inv.m[2][3] = -(m[0][0] * (m[1][1] * m[2][3] - m[1][3] * m[2][1])
            - m[0][1] * (m[1][0] * m[2][3] - m[1][3] * m[2][0])
            + m[0][3] * (m[1][0] * m[2][1] - m[1][1] * m[2][0])) * inv_det;

        inv.m[3][0] = -(m[1][0] * (m[2][1] * m[3][2] - m[2][2] * m[3][1])
            - m[1][1] * (m[2][0] * m[3][2] - m[2][2] * m[3][0])
            + m[1][2] * (m[2][0] * m[3][1] - m[2][1] * m[3][0])) * inv_det;
        inv.m[3][1] = (m[0][0] * (m[2][1] * m[3][2] - m[2][2] * m[3][1])
            - m[0][1] * (m[2][0] * m[3][2] - m[2][2] * m[3][0])
            + m[0][2] * (m[2][0] * m[3][1] - m[2][1] * m[3][0])) * inv_det;
        inv.m[3][2] = -(m[0][0] * (m[1][1] * m[3][2] - m[1][2] * m[3][1])
            - m[0][1] * (m[1][0] * m[3][2] - m[1][2] * m[3][0])
            + m[0][2] * (m[1][0] * m[3][1] - m[1][1] * m[3][0])) * inv_det;
        inv.m[3][3] = (m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1])
            - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0])
            + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0])) * inv_det;

        Some(inv)
    }

    pub fn translate(v: Vec3) -> Mat4 {
        Mat4 {
            m: [
                [1.0, 0.0, 0.0, v.x],
                [0.0, 1.0, 0.0, v.y],
                [0.0, 0.0, 1.0, v.z],
                [0.0, 0.0, 0.0, 1.0],
            ],
        }
    }

    pub fn scale(v: Vec3) -> Mat4 {
        Mat4 {
            m: [
                [v.x, 0.0, 0.0, 0.0],
                [0.0, v.y, 0.0, 0.0],
                [0.0, 0.0, v.z, 0.0],
                [0.0, 0.0, 0.0, 1.0],
            ],
        }
    }

    pub fn rotate_x(angle: f64) -> Mat4 {
        let s = angle.sin();
        let c = angle.cos();
        Mat4 {
            m: [
                [1.0, 0.0, 0.0, 0.0],
                [0.0, c, -s, 0.0],
                [0.0, s, c, 0.0],
                [0.0, 0.0, 0.0, 1.0],
            ],
        }
    }

    pub fn rotate_y(angle: f64) -> Mat4 {
        let s = angle.sin();
        let c = angle.cos();
        Mat4 {
            m: [
                [c, 0.0, s, 0.0],
                [0.0, 1.0, 0.0, 0.0],
                [-s, 0.0, c, 0.0],
                [0.0, 0.0, 0.0, 1.0],
            ],
        }
    }

    pub fn rotate_z(angle: f64) -> Mat4 {
        let s = angle.sin();
        let c = angle.cos();
        Mat4 {
            m: [
                [c, -s, 0.0, 0.0],
                [s, c, 0.0, 0.0],
                [0.0, 0.0, 1.0, 0.0],
                [0.0, 0.0, 0.0, 1.0],
            ],
        }
    }

    pub fn transform_point(self, p: Vec3) -> Vec3 {
        let x = self.m[0][0] * p.x + self.m[0][1] * p.y + self.m[0][2] * p.z + self.m[0][3];
        let y = self.m[1][0] * p.x + self.m[1][1] * p.y + self.m[1][2] * p.z + self.m[1][3];
        let z = self.m[2][0] * p.x + self.m[2][1] * p.y + self.m[2][2] * p.z + self.m[2][3];
        let w = self.m[3][0] * p.x + self.m[3][1] * p.y + self.m[3][2] * p.z + self.m[3][3];
        if is_zero(w) {
            Vec3::ZERO
        } else {
            Vec3 { x: x / w, y: y / w, z: z / w }
        }
    }

    pub fn transform_vector(self, v: Vec3) -> Vec3 {
        Vec3 {
            x: self.m[0][0] * v.x + self.m[0][1] * v.y + self.m[0][2] * v.z,
            y: self.m[1][0] * v.x + self.m[1][1] * v.y + self.m[1][2] * v.z,
            z: self.m[2][0] * v.x + self.m[2][1] * v.y + self.m[2][2] * v.z,
        }
    }
}

impl std::ops::Mul for Mat4 {
    type Output = Mat4;
    fn mul(self, other: Mat4) -> Mat4 {
        let mut result = Mat4::ZERO;
        for i in 0..4 {
            for j in 0..4 {
                for k in 0..4 {
                    result.m[i][j] += self.m[i][k] * other.m[k][j];
                }
            }
        }
        result
    }
}