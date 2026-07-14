#pragma once

#include "../math/Vec3.h"

namespace trae_geo_cpp {

enum class SurfaceType {
    Plane = 0,
    Cylinder = 1,
    Sphere = 2,
    Cone = 3,
    Torus = 4,
    Bezier = 5,
    Nurbs = 6,
};

struct Plane {
    Vec3 origin;
    Vec3 normal;
    Vec3 uDir;
    Vec3 vDir;

    Plane() = default;
    Plane(const Vec3& origin, const Vec3& normal);

    Vec3 pointAt(double u, double v) const;
    Vec3 normalAt(double u, double v) const;
    double distanceToPoint(const Vec3& p) const;
};

struct Cylinder {
    Vec3 origin;
    Vec3 axis;
    double radius;

    Cylinder() = default;
    Cylinder(const Vec3& origin, const Vec3& axis, double radius)
        : origin(origin), axis(axis.normalize()), radius(std::max(0.0, radius)) {}

    Vec3 pointAt(double u, double v) const;
    Vec3 normalAt(double u, double v) const;
};

struct Sphere {
    Vec3 center;
    double radius;

    Sphere() = default;
    Sphere(const Vec3& center, double radius)
        : center(center), radius(std::max(0.0, radius)) {}

    Vec3 pointAt(double u, double v) const;
    Vec3 normalAt(double u, double v) const;
};

struct Cone {
    Vec3 origin;
    Vec3 axis;
    double angle;
    double height;

    Cone() = default;
};

struct Torus {
    Vec3 center;
    Vec3 normal;
    double majorRadius;
    double minorRadius;

    Torus() = default;
};

struct BezierSurface {
    uint32_t uDegree;
    uint32_t vDegree;
    uint32_t numUPoints;
    uint32_t numVPoints;
    const Vec3* controlPoints;

    BezierSurface() : uDegree(0), vDegree(0), numUPoints(0), numVPoints(0), controlPoints(nullptr) {}
};

struct NurbsSurface {
    uint32_t uDegree;
    uint32_t vDegree;
    uint32_t numUPoints;
    uint32_t numVPoints;
    const Vec3* controlPoints;
    const double* weights;
    uint32_t numUKnots;
    uint32_t numVKnots;
    const double* uKnots;
    const double* vKnots;

    NurbsSurface() : uDegree(0), vDegree(0), numUPoints(0), numVPoints(0), 
                     controlPoints(nullptr), weights(nullptr),
                     numUKnots(0), numVKnots(0), uKnots(nullptr), vKnots(nullptr) {}
};

struct Surface {
    SurfaceType surfaceType;
    union {
        Plane plane;
        Cylinder cylinder;
        Sphere sphere;
        Cone cone;
        Torus torus;
        BezierSurface bezier;
        NurbsSurface nurbs;
    } data;
    double uDomain[2];
    double vDomain[2];

    Surface() : surfaceType(SurfaceType::Plane), uDomain{0.0, 1.0}, vDomain{0.0, 1.0} {}
};

inline Plane::Plane(const Vec3& origin, const Vec3& normal) 
    : origin(origin), normal(normal.normalize()) {
    uDir = (std::abs(this->normal.x) > 0.99999) ? Vec3(0.0, 1.0, 0.0) 
        : Vec3(-this->normal.y, this->normal.x, 0.0).normalize();
    vDir = this->normal.cross(uDir);
}

inline Vec3 Plane::pointAt(double u, double v) const {
    return origin + uDir * u + vDir * v;
}

inline Vec3 Plane::normalAt(double /*u*/, double /*v*/) const {
    return normal;
}

inline double Plane::distanceToPoint(const Vec3& p) const {
    return (p - origin).dot(normal);
}

inline Vec3 Cylinder::pointAt(double u, double v) const {
    double angle = u * 2.0 * M_PI;
    double s = std::sin(angle);
    double c = std::cos(angle);
    
    Vec3 uDir = (std::abs(axis.x) > 0.99999) ? Vec3(0.0, 1.0, 0.0) 
        : Vec3(-axis.y, axis.x, 0.0).normalize();
    Vec3 vDir = axis.cross(uDir);
    
    return origin + uDir * c * radius + vDir * s * radius + axis * v;
}

inline Vec3 Sphere::pointAt(double u, double v) const {
    double theta = u * 2.0 * M_PI;
    double phi = v * M_PI;
    
    double st = std::sin(theta);
    double ct = std::cos(theta);
    double sp = std::sin(phi);
    double cp = std::cos(phi);
    
    return Vec3(
        center.x + radius * sp * ct,
        center.y + radius * cp,
        center.z + radius * sp * st
    );
}

} // namespace trae_geo_cpp