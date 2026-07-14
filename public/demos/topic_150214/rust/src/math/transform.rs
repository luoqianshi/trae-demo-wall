use super::vector::Vec3;
use super::matrix::Mat4;

#[repr(C)]
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Transform {
    pub matrix: Mat4,
    pub inverse: Mat4,
}

impl Transform {
    pub const IDENTITY: Transform = Transform {
        matrix: Mat4::IDENTITY,
        inverse: Mat4::IDENTITY,
    };

    pub fn new() -> Transform {
        Transform::IDENTITY
    }

    pub fn from_matrix(matrix: Mat4) -> Option<Transform> {
        matrix.inverse().map(|inv| Transform { matrix, inverse: inv })
    }

    pub fn translation(v: Vec3) -> Transform {
        let matrix = Mat4::translate(v);
        let inverse = Mat4::translate(-v);
        Transform { matrix, inverse }
    }

    pub fn scaling(v: Vec3) -> Option<Transform> {
        if v.x == 0.0 || v.y == 0.0 || v.z == 0.0 {
            return None;
        }
        let matrix = Mat4::scale(v);
        let inverse = Mat4::scale(Vec3 {
            x: 1.0 / v.x,
            y: 1.0 / v.y,
            z: 1.0 / v.z,
        });
        Some(Transform { matrix, inverse })
    }

    pub fn rotation_x(angle: f64) -> Transform {
        let matrix = Mat4::rotate_x(angle);
        let inverse = Mat4::rotate_x(-angle);
        Transform { matrix, inverse }
    }

    pub fn rotation_y(angle: f64) -> Transform {
        let matrix = Mat4::rotate_y(angle);
        let inverse = Mat4::rotate_y(-angle);
        Transform { matrix, inverse }
    }

    pub fn rotation_z(angle: f64) -> Transform {
        let matrix = Mat4::rotate_z(angle);
        let inverse = Mat4::rotate_z(-angle);
        Transform { matrix, inverse }
    }

    pub fn rotation(axis: Vec3, angle: f64) -> Transform {
        let axis = axis.normalize();
        let s = angle.sin();
        let c = angle.cos();
        let oc = 1.0 - c;

        let matrix = Mat4::from_rows(
            [
                c + axis.x * axis.x * oc,
                axis.x * axis.y * oc - axis.z * s,
                axis.x * axis.z * oc + axis.y * s,
                0.0,
            ],
            [
                axis.y * axis.x * oc + axis.z * s,
                c + axis.y * axis.y * oc,
                axis.y * axis.z * oc - axis.x * s,
                0.0,
            ],
            [
                axis.z * axis.x * oc - axis.y * s,
                axis.z * axis.y * oc + axis.x * s,
                c + axis.z * axis.z * oc,
                0.0,
            ],
            [0.0, 0.0, 0.0, 1.0],
        );

        let inverse = Mat4::from_rows(
            [
                c + axis.x * axis.x * oc,
                axis.x * axis.y * oc + axis.z * s,
                axis.x * axis.z * oc - axis.y * s,
                0.0,
            ],
            [
                axis.y * axis.x * oc - axis.z * s,
                c + axis.y * axis.y * oc,
                axis.y * axis.z * oc + axis.x * s,
                0.0,
            ],
            [
                axis.z * axis.x * oc + axis.y * s,
                axis.z * axis.y * oc - axis.x * s,
                c + axis.z * axis.z * oc,
                0.0,
            ],
            [0.0, 0.0, 0.0, 1.0],
        );

        Transform { matrix, inverse }
    }

    pub fn look_at(eye: Vec3, center: Vec3, up: Vec3) -> Option<Transform> {
        let forward = (center - eye).normalize();
        if forward.is_zero() {
            return None;
        }

        let right = forward.cross(up).normalize();
        if right.is_zero() {
            return None;
        }

        let new_up = right.cross(forward);

        let matrix = Mat4::from_rows(
            [right.x, new_up.x, -forward.x, 0.0],
            [right.y, new_up.y, -forward.y, 0.0],
            [right.z, new_up.z, -forward.z, 0.0],
            [-right.dot(eye), -new_up.dot(eye), forward.dot(eye), 1.0],
        );

        matrix.inverse().map(|inv| Transform { matrix, inverse: inv })
    }

    pub fn perspective(fov_y: f64, aspect: f64, near: f64, far: f64) -> Option<Transform> {
        if near <= 0.0 || far <= near || aspect <= 0.0 {
            return None;
        }

        let f = 1.0 / (fov_y / 2.0).tan();
        let matrix = Mat4::from_rows(
            [f / aspect, 0.0, 0.0, 0.0],
            [0.0, f, 0.0, 0.0],
            [0.0, 0.0, (far + near) / (near - far), (2.0 * far * near) / (near - far)],
            [0.0, 0.0, -1.0, 0.0],
        );

        matrix.inverse().map(|inv| Transform { matrix, inverse: inv })
    }

    pub fn orthographic(left: f64, right: f64, bottom: f64, top: f64, near: f64, far: f64) -> Option<Transform> {
        if right <= left || top <= bottom || far <= near {
            return None;
        }

        let matrix = Mat4::from_rows(
            [2.0 / (right - left), 0.0, 0.0, -(right + left) / (right - left)],
            [0.0, 2.0 / (top - bottom), 0.0, -(top + bottom) / (top - bottom)],
            [0.0, 0.0, 2.0 / (far - near), -(far + near) / (far - near)],
            [0.0, 0.0, 0.0, 1.0],
        );

        matrix.inverse().map(|inv| Transform { matrix, inverse: inv })
    }

    pub fn transform_point(self, p: Vec3) -> Vec3 {
        self.matrix.transform_point(p)
    }

    pub fn transform_vector(self, v: Vec3) -> Vec3 {
        self.matrix.transform_vector(v)
    }

    pub fn inverse_transform_point(self, p: Vec3) -> Vec3 {
        self.inverse.transform_point(p)
    }

    pub fn inverse_transform_vector(self, v: Vec3) -> Vec3 {
        self.inverse.transform_vector(v)
    }

    pub fn compose(self, other: Transform) -> Transform {
        Transform {
            matrix: self.matrix * other.matrix,
            inverse: other.inverse * self.inverse,
        }
    }

    pub fn invert(self) -> Transform {
        Transform {
            matrix: self.inverse,
            inverse: self.matrix,
        }
    }
}