use std::sync::atomic::{AtomicBool, AtomicF64, Ordering};

const DEFAULT_EPSILON: f64 = 1e-8;
const DEFAULT_TOLERANCE: f64 = 1e-6;
const DEFAULT_ANGLE_TOLERANCE: f64 = 1e-4;
const DEFAULT_CURVE_TOLERANCE: f64 = 1e-5;
const DEFAULT_SURFACE_TOLERANCE: f64 = 1e-5;
const MIN_EPSILON: f64 = 1e-15;
const MAX_EPSILON: f64 = 1e-3;

static EPSILON: AtomicF64 = AtomicF64::new(DEFAULT_EPSILON);
static TOLERANCE: AtomicF64 = AtomicF64::new(DEFAULT_TOLERANCE);
static ANGLE_TOLERANCE: AtomicF64 = AtomicF64::new(DEFAULT_ANGLE_TOLERANCE);
static CURVE_TOLERANCE: AtomicF64 = AtomicF64::new(DEFAULT_CURVE_TOLERANCE);
static SURFACE_TOLERANCE: AtomicF64 = AtomicF64::new(DEFAULT_SURFACE_TOLERANCE);
static USE_RELATIVE_TOLERANCE: AtomicBool = AtomicBool::new(true);

pub fn epsilon() -> f64 {
    EPSILON.load(Ordering::Relaxed)
}

pub fn set_epsilon(value: f64) -> bool {
    if value >= MIN_EPSILON && value <= MAX_EPSILON {
        EPSILON.store(value, Ordering::Relaxed);
        true
    } else {
        false
    }
}

pub fn tolerance() -> f64 {
    TOLERANCE.load(Ordering::Relaxed)
}

pub fn set_tolerance(value: f64) -> bool {
    if value >= MIN_EPSILON && value <= 1e-1 {
        TOLERANCE.store(value, Ordering::Relaxed);
        true
    } else {
        false
    }
}

pub fn angle_tolerance() -> f64 {
    ANGLE_TOLERANCE.load(Ordering::Relaxed)
}

pub fn set_angle_tolerance(value: f64) -> bool {
    if value >= 1e-10 && value <= 1e-1 {
        ANGLE_TOLERANCE.store(value, Ordering::Relaxed);
        true
    } else {
        false
    }
}

pub fn curve_tolerance() -> f64 {
    CURVE_TOLERANCE.load(Ordering::Relaxed)
}

pub fn surface_tolerance() -> f64 {
    SURFACE_TOLERANCE.load(Ordering::Relaxed)
}

pub fn use_relative_tolerance() -> bool {
    USE_RELATIVE_TOLERANCE.load(Ordering::Relaxed)
}

pub fn set_use_relative_tolerance(value: bool) {
    USE_RELATIVE_TOLERANCE.store(value, Ordering::Relaxed);
}

pub fn is_zero(value: f64) -> bool {
    value.abs() <= epsilon()
}

pub fn is_equal(a: f64, b: f64) -> bool {
    (a - b).abs() <= tolerance()
}

pub fn is_less_or_equal(a: f64, b: f64) -> bool {
    a <= b + tolerance()
}

pub fn is_greater_or_equal(a: f64, b: f64) -> bool {
    a >= b - tolerance()
}

pub fn clamp(value: f64, min: f64, max: f64) -> f64 {
    value.max(min).min(max)
}

pub fn lerp(a: f64, b: f64, t: f64) -> f64 {
    a + (b - a) * t
}

pub fn normalize_angle(angle: f64) -> f64 {
    let mut result = angle % (2.0 * std::f64::consts::PI);
    if result < 0.0 {
        result += 2.0 * std::f64::consts::PI;
    }
    result
}