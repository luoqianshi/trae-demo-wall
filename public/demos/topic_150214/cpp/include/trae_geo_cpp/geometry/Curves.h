#pragma once

#include "../math/Vec3.h"

namespace trae_geo_cpp {

enum class CurveType {
    Line = 0,
    Circle = 1,
    Arc = 2,
    Bezier = 3,
    Nurbs = 4,
};

struct Line {
    Vec3 start;
    Vec3 end;

    Line() = default;
    Line(const Vec3& start, const Vec3& end) : start(start), end(end) {}

    Vec3 direction() const;
    double length() const;
    Vec3 pointAt(double t) const;
    Vec3 tangentAt(double t) const;
};

struct Circle {
    Vec3 center;
    Vec3 normal;
    double radius;

    Circle() = default;
    Circle(const Vec3& center, const Vec3& normal, double radius) 
        : center(center), normal(normal.normalize()), radius(std::max(0.0, radius)) {}

    Vec3 pointAt(double t) const;
    Vec3 tangentAt(double t) const;
    double length() const;
};

struct Arc {
    Vec3 center;
    Vec3 normal;
    double radius;
    double startAngle;
    double endAngle;

    Arc() = default;
    Arc(const Vec3& center, const Vec3& normal, double radius, 
        double startAngle, double endAngle)
        : center(center), normal(normal.normalize()), 
          radius(std::max(0.0, radius)), 
          startAngle(startAngle), endAngle(endAngle) {}

    Vec3 pointAt(double t) const;
    double length() const;
};

struct BezierCurve {
    uint32_t degree;
    uint32_t numControlPoints;
    const Vec3* controlPoints;

    BezierCurve() : degree(0), numControlPoints(0), controlPoints(nullptr) {}
};

struct NurbsCurve {
    uint32_t degree;
    uint32_t numControlPoints;
    const Vec3* controlPoints;
    const double* weights;
    uint32_t numKnots;
    const double* knots;

    NurbsCurve() : degree(0), numControlPoints(0), controlPoints(nullptr),
                   weights(nullptr), numKnots(0), knots(nullptr) {}
};

struct Curve {
    CurveType curveType;
    union {
        Line line;
        Circle circle;
        Arc arc;
        BezierCurve bezier;
        NurbsCurve nurbs;
    } data;
    double domain[2];

    Curve() : curveType(CurveType::Line), domain{0.0, 1.0} {}
};

inline Vec3 Line::direction() const {
    return (end - start).normalize();
}

inline double Line::length() const {
    return (end - start).length();
}

inline Vec3 Line::pointAt(double t) const {
    return start + (end - start) * t;
}

inline Vec3 Line::tangentAt(double /*t*/) const {
    return direction();
}

inline Vec3 Circle::pointAt(double t) const {
    double angle = t * 2.0 * M_PI;
    double s = std::sin(angle);
    double c = std::cos(angle);
    
    Vec3 u = (std::abs(normal.x) > 0.99999) ? Vec3(0.0, 1.0, 0.0) 
        : Vec3(-normal.y, normal.x, 0.0).normalize();
    Vec3 v = normal.cross(u);
    
    return center + u * c * radius + v * s * radius;
}

inline double Circle::length() const {
    return 2.0 * M_PI * radius;
}

} // namespace trae_geo_cpp