use super::super::math::Vec3;
use super::super::utils::is_zero;
use bytemuck::{Pod, Zeroable};

#[repr(C)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SurfaceType {
    Plane = 0,
    Cylinder = 1,
    Sphere = 2,
    Cone = 3,
    Torus = 4,
    Bezier = 5,
    Nurbs = 6,
}

#[repr(C)]
#[derive(Debug, Clone, Copy, Pod, Zeroable)]
pub struct Plane {
    pub origin: Vec3,
    pub normal: Vec3,
    pub u_dir: Vec3,
    pub v_dir: Vec3,
}

impl Plane {
    pub fn new(origin: Vec3, normal: Vec3) -> Plane {
        let normal_norm = normal.normalize();
        let u_dir = if is_zero(normal_norm.x.abs() - 1.0) {
            Vec3 { x: 0.0, y: 1.0, z: 0.0 }
        } else {
            Vec3 { x: -normal_norm.y, y: normal_norm.x, z: 0.0 }.normalize()
        };
        let v_dir = normal_norm.cross(u_dir);
        Plane { origin, normal: normal_norm, u_dir, v_dir }
    }

    pub fn point_at(self, u: f64, v: f64) -> Vec3 {
        self.origin + self.u_dir * u + self.v_dir * v
    }

    pub fn normal_at(self, _u: f64, _v: f64) -> Vec3 {
        self.normal
    }

    pub fn distance_to_point(self, p: Vec3) -> f64 {
        (p - self.origin).dot(self.normal)
    }
}

#[repr(C)]
#[derive(Debug, Clone, Copy, Pod, Zeroable)]
pub struct Cylinder {
    pub origin: Vec3,
    pub axis: Vec3,
    pub radius: f64,
}

impl Cylinder {
    pub fn new(origin: Vec3, axis: Vec3, radius: f64) -> Cylinder {
        Cylinder {
            origin,
            axis: axis.normalize(),
            radius: radius.max(0.0),
        }
    }

    pub fn point_at(self, u: f64, v: f64) -> Vec3 {
        let angle = u * 2.0 * std::f64::consts::PI;
        let s = angle.sin();
        let c = angle.cos();

        let u_dir = if is_zero(self.axis.x.abs() - 1.0) {
            Vec3 { x: 0.0, y: 1.0, z: 0.0 }
        } else {
            Vec3 { x: -self.axis.y, y: self.axis.x, z: 0.0 }.normalize()
        };
        let v_dir = self.axis.cross(u_dir);

        self.origin + u_dir * c * self.radius + v_dir * s * self.radius + self.axis * v
    }

    pub fn normal_at(self, u: f64, _v: f64) -> Vec3 {
        let angle = u * 2.0 * std::f64::consts::PI;
        let s = angle.sin();
        let c = angle.cos();

        let u_dir = if is_zero(self.axis.x.abs() - 1.0) {
            Vec3 { x: 0.0, y: 1.0, z: 0.0 }
        } else {
            Vec3 { x: -self.axis.y, y: self.axis.x, z: 0.0 }.normalize()
        };
        let v_dir = self.axis.cross(u_dir);

        (u_dir * c + v_dir * s).normalize()
    }
}

#[repr(C)]
#[derive(Debug, Clone, Copy, Pod, Zeroable)]
pub struct Sphere {
    pub center: Vec3,
    pub radius: f64,
}

impl Sphere {
    pub fn new(center: Vec3, radius: f64) -> Sphere {
        Sphere { center, radius: radius.max(0.0) }
    }

    pub fn point_at(self, u: f64, v: f64) -> Vec3 {
        let theta = u * 2.0 * std::f64::consts::PI;
        let phi = v * std::f64::consts::PI;

        let s_theta = theta.sin();
        let c_theta = theta.cos();
        let s_phi = phi.sin();
        let c_phi = phi.cos();

        Vec3 {
            x: self.center.x + self.radius * s_phi * c_theta,
            y: self.center.y + self.radius * c_phi,
            z: self.center.z + self.radius * s_phi * s_theta,
        }
    }

    pub fn normal_at(self, u: f64, v: f64) -> Vec3 {
        let theta = u * 2.0 * std::f64::consts::PI;
        let phi = v * std::f64::consts::PI;

        let s_theta = theta.sin();
        let c_theta = theta.cos();
        let s_phi = phi.sin();
        let c_phi = phi.cos();

        Vec3 {
            x: s_phi * c_theta,
            y: c_phi,
            z: s_phi * s_theta,
        }.normalize()
    }
}

#[repr(C)]
#[derive(Debug, Clone, Copy, Pod, Zeroable)]
pub struct Cone {
    pub origin: Vec3,
    pub axis: Vec3,
    pub angle: f64,
    pub height: f64,
}

#[repr(C)]
#[derive(Debug, Clone, Copy, Pod, Zeroable)]
pub struct Torus {
    pub center: Vec3,
    pub normal: Vec3,
    pub major_radius: f64,
    pub minor_radius: f64,
}

#[repr(C)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct BezierSurface {
    pub u_degree: u32,
    pub v_degree: u32,
    pub num_u_points: u32,
    pub num_v_points: u32,
    pub control_points: *const Vec3,
}

#[repr(C)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct NurbsSurface {
    pub u_degree: u32,
    pub v_degree: u32,
    pub num_u_points: u32,
    pub num_v_points: u32,
    pub control_points: *const Vec3,
    pub weights: *const f64,
    pub num_u_knots: u32,
    pub num_v_knots: u32,
    pub u_knots: *const f64,
    pub v_knots: *const f64,
}

#[repr(C)]
#[derive(Debug, Clone, Copy)]
pub union SurfaceData {
    pub plane: Plane,
    pub cylinder: Cylinder,
    pub sphere: Sphere,
    pub cone: Cone,
    pub torus: Torus,
    pub bezier: BezierSurface,
    pub nurbs: NurbsSurface,
}

#[repr(C)]
#[derive(Debug, Clone, Copy)]
pub struct Surface {
    pub surface_type: SurfaceType,
    pub data: SurfaceData,
    pub u_domain: (f64, f64),
    pub v_domain: (f64, f64),
}