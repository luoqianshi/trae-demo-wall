use super::utils::{is_zero, epsilon};
use bytemuck::{Pod, Zeroable};

#[repr(C)]
#[derive(Debug, Clone, Copy, PartialEq, Pod, Zeroable)]
pub struct Vec3 {
    pub x: f64,
    pub y: f64,
    pub z: f64,
}

impl Vec3 {
    pub const ZERO: Vec3 = Vec3 { x: 0.0, y: 0.0, z: 0.0 };
    pub const UNIT_X: Vec3 = Vec3 { x: 1.0, y: 0.0, z: 0.0 };
    pub const UNIT_Y: Vec3 = Vec3 { x: 0.0, y: 1.0, z: 0.0 };
    pub const UNIT_Z: Vec3 = Vec3 { x: 0.0, y: 0.0, z: 1.0 };

    pub fn new(x: f64, y: f64, z: f64) -> Vec3 {
        Vec3 { x, y, z }
    }

    pub fn dot(self, other: Vec3) -> f64 {
        self.x * other.x + self.y * other.y + self.z * other.z
    }

    pub fn cross(self, other: Vec3) -> Vec3 {
        Vec3 {
            x: self.y * other.z - self.z * other.y,
            y: self.z * other.x - self.x * other.z,
            z: self.x * other.y - self.y * other.x,
        }
    }

    pub fn length(self) -> f64 {
        (self.x * self.x + self.y * self.y + self.z * self.z).sqrt()
    }

    pub fn length_squared(self) -> f64 {
        self.x * self.x + self.y * self.y + self.z * self.z
    }

    pub fn normalize(self) -> Vec3 {
        let len = self.length();
        if is_zero(len) {
            Vec3::ZERO
        } else {
            self / len
        }
    }

    pub fn distance(self, other: Vec3) -> f64 {
        (self - other).length()
    }

    pub fn distance_squared(self, other: Vec3) -> f64 {
        (self - other).length_squared()
    }

    pub fn angle(self, other: Vec3) -> f64 {
        let dot = self.dot(other);
        let len_product = self.length() * other.length();
        if is_zero(len_product) {
            0.0
        } else {
            (dot / len_product).clamp(-1.0, 1.0).acos()
        }
    }

    pub fn lerp(self, other: Vec3, t: f64) -> Vec3 {
        Vec3 {
            x: self.x + (other.x - self.x) * t,
            y: self.y + (other.y - self.y) * t,
            z: self.z + (other.z - self.z) * t,
        }
    }

    pub fn min(self, other: Vec3) -> Vec3 {
        Vec3 {
            x: self.x.min(other.x),
            y: self.y.min(other.y),
            z: self.z.min(other.z),
        }
    }

    pub fn max(self, other: Vec3) -> Vec3 {
        Vec3 {
            x: self.x.max(other.x),
            y: self.y.max(other.y),
            z: self.z.max(other.z),
        }
    }

    pub fn abs(self) -> Vec3 {
        Vec3 {
            x: self.x.abs(),
            y: self.y.abs(),
            z: self.z.abs(),
        }
    }

    pub fn is_zero(self) -> bool {
        is_zero(self.x) && is_zero(self.y) && is_zero(self.z)
    }

    pub fn is_unit(self) -> bool {
        is_zero(self.length_squared() - 1.0)
    }
}

impl std::ops::Add for Vec3 {
    type Output = Vec3;
    fn add(self, other: Vec3) -> Vec3 {
        Vec3 {
            x: self.x + other.x,
            y: self.y + other.y,
            z: self.z + other.z,
        }
    }
}

impl std::ops::Sub for Vec3 {
    type Output = Vec3;
    fn sub(self, other: Vec3) -> Vec3 {
        Vec3 {
            x: self.x - other.x,
            y: self.y - other.y,
            z: self.z - other.z,
        }
    }
}

impl std::ops::Mul<f64> for Vec3 {
    type Output = Vec3;
    fn mul(self, scalar: f64) -> Vec3 {
        Vec3 {
            x: self.x * scalar,
            y: self.y * scalar,
            z: self.z * scalar,
        }
    }
}

impl std::ops::Div<f64> for Vec3 {
    type Output = Vec3;
    fn div(self, scalar: f64) -> Vec3 {
        if is_zero(scalar) {
            Vec3::ZERO
        } else {
            Vec3 {
                x: self.x / scalar,
                y: self.y / scalar,
                z: self.z / scalar,
            }
        }
    }
}

impl std::ops::Neg for Vec3 {
    type Output = Vec3;
    fn neg(self) -> Vec3 {
        Vec3 {
            x: -self.x,
            y: -self.y,
            z: -self.z,
        }
    }
}