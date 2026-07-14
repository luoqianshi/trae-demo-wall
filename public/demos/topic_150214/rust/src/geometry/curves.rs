use super::super::math::Vec3;
use super::super::utils::is_zero;
use bytemuck::{Pod, Zeroable};

#[repr(C)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum CurveType {
    Line = 0,
    Circle = 1,
    Arc = 2,
    Bezier = 3,
    Nurbs = 4,
}

#[repr(C)]
#[derive(Debug, Clone, Copy, Pod, Zeroable)]
pub struct Line {
    pub start: Vec3,
    pub end: Vec3,
}

impl Line {
    pub fn new(start: Vec3, end: Vec3) -> Line {
        Line { start, end }
    }

    pub fn direction(self) -> Vec3 {
        (self.end - self.start).normalize()
    }

    pub fn length(self) -> f64 {
        (self.end - self.start).length()
    }

    pub fn point_at(self, t: f64) -> Vec3 {
        self.start + (self.end - self.start) * t
    }

    pub fn tangent_at(self, _t: f64) -> Vec3 {
        self.direction()
    }
}

#[repr(C)]
#[derive(Debug, Clone, Copy, Pod, Zeroable)]
pub struct Circle {
    pub center: Vec3,
    pub normal: Vec3,
    pub radius: f64,
}

impl Circle {
    pub fn new(center: Vec3, normal: Vec3, radius: f64) -> Circle {
        Circle {
            center,
            normal: normal.normalize(),
            radius: radius.max(0.0),
        }
    }

    pub fn point_at(self, t: f64) -> Vec3 {
        let angle = t * 2.0 * std::f64::consts::PI;
        let s = angle.sin();
        let c = angle.cos();

        let u = if is_zero(self.normal.x.abs() - 1.0) {
            Vec3 { x: 0.0, y: 1.0, z: 0.0 }
        } else {
            Vec3 { x: -self.normal.y, y: self.normal.x, z: 0.0 }.normalize()
        };
        let v = self.normal.cross(u);

        self.center + u * c * self.radius + v * s * self.radius
    }

    pub fn tangent_at(self, t: f64) -> Vec3 {
        let angle = t * 2.0 * std::f64::consts::PI;
        let s = angle.sin();
        let c = angle.cos();

        let u = if is_zero(self.normal.x.abs() - 1.0) {
            Vec3 { x: 0.0, y: 1.0, z: 0.0 }
        } else {
            Vec3 { x: -self.normal.y, y: self.normal.x, z: 0.0 }.normalize()
        };
        let v = self.normal.cross(u);

        (-u * s + v * c).normalize()
    }

    pub fn length(self) -> f64 {
        2.0 * std::f64::consts::PI * self.radius
    }
}

#[repr(C)]
#[derive(Debug, Clone, Copy, Pod, Zeroable)]
pub struct Arc {
    pub center: Vec3,
    pub normal: Vec3,
    pub radius: f64,
    pub start_angle: f64,
    pub end_angle: f64,
}

impl Arc {
    pub fn new(center: Vec3, normal: Vec3, radius: f64, start_angle: f64, end_angle: f64) -> Arc {
        Arc {
            center,
            normal: normal.normalize(),
            radius: radius.max(0.0),
            start_angle,
            end_angle,
        }
    }

    pub fn point_at(self, t: f64) -> Vec3 {
        let angle = self.start_angle + t * (self.end_angle - self.start_angle);
        let s = angle.sin();
        let c = angle.cos();

        let u = if is_zero(self.normal.x.abs() - 1.0) {
            Vec3 { x: 0.0, y: 1.0, z: 0.0 }
        } else {
            Vec3 { x: -self.normal.y, y: self.normal.x, z: 0.0 }.normalize()
        };
        let v = self.normal.cross(u);

        self.center + u * c * self.radius + v * s * self.radius
    }

    pub fn length(self) -> f64 {
        let delta = self.end_angle - self.start_angle;
        let abs_delta = delta.abs() % (2.0 * std::f64::consts::PI);
        self.radius * abs_delta
    }
}

#[repr(C)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct BezierCurve {
    pub degree: u32,
    pub num_control_points: u32,
    pub control_points: *const Vec3,
}

#[repr(C)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct NurbsCurve {
    pub degree: u32,
    pub num_control_points: u32,
    pub control_points: *const Vec3,
    pub weights: *const f64,
    pub num_knots: u32,
    pub knots: *const f64,
}

#[repr(C)]
#[derive(Debug, Clone, Copy)]
pub union CurveData {
    pub line: Line,
    pub circle: Circle,
    pub arc: Arc,
    pub bezier: BezierCurve,
    pub nurbs: NurbsCurve,
}

#[repr(C)]
#[derive(Debug, Clone, Copy)]
pub struct Curve {
    pub curve_type: CurveType,
    pub data: CurveData,
    pub domain: (f64, f64),
}