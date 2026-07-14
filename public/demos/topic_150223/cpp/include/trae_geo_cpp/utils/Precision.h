#pragma once

#include <cmath>

namespace trae_geo_cpp {

constexpr double DEFAULT_EPSILON = 1e-8;
constexpr double DEFAULT_TOLERANCE = 1e-6;
constexpr double DEFAULT_ANGLE_TOLERANCE = 1e-4;
constexpr double DEFAULT_CURVE_TOLERANCE = 1e-5;
constexpr double DEFAULT_SURFACE_TOLERANCE = 1e-5;
constexpr double MIN_EPSILON = 1e-15;
constexpr double MAX_EPSILON = 1e-3;

class Precision {
public:
    static double epsilon();
    static bool setEpsilon(double value);
    
    static double tolerance();
    static bool setTolerance(double value);
    
    static double angleTolerance();
    static bool setAngleTolerance(double value);
    
    static double curveTolerance();
    static bool setCurveTolerance(double value);
    
    static double surfaceTolerance();
    static bool setSurfaceTolerance(double value);
    
    static bool useRelativeTolerance();
    static void setUseRelativeTolerance(bool value);
    
    static bool isZero(double value);
    static bool isEqual(double a, double b);
    static bool isLessOrEqual(double a, double b);
    static bool isGreaterOrEqual(double a, double b);
    
    static double clamp(double value, double min, double max);
    static double lerp(double a, double b, double t);
    static double normalizeAngle(double angle);
    
private:
    static double epsilon_;
    static double tolerance_;
    static double angleTolerance_;
    static double curveTolerance_;
    static double surfaceTolerance_;
    static bool useRelativeTolerance_;
};

inline bool Precision::isZero(double value) {
    return std::abs(value) <= epsilon_;
}

inline bool Precision::isEqual(double a, double b) {
    return std::abs(a - b) <= tolerance_;
}

inline bool Precision::isLessOrEqual(double a, double b) {
    return a <= b + tolerance_;
}

inline bool Precision::isGreaterOrEqual(double a, double b) {
    return a >= b - tolerance_;
}

inline double Precision::clamp(double value, double min, double max) {
    return std::max(min, std::min(max, value));
}

inline double Precision::lerp(double a, double b, double t) {
    return a + (b - a) * t;
}

inline double Precision::normalizeAngle(double angle) {
    double result = std::fmod(angle, 2.0 * M_PI);
    if (result < 0.0) {
        result += 2.0 * M_PI;
    }
    return result;
}

} // namespace trae_geo_cpp