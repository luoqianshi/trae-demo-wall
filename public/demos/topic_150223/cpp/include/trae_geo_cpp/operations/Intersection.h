#pragma once

#include "../geometry/Curves.h"
#include "../geometry/Surfaces.h"
#include "../utils/Error.h"

namespace trae_geo_cpp {

struct IntersectionResult {
    bool intersect;
    uint32_t numPoints;
    Vec3 points[16];
    double params[16][2];

    IntersectionResult() : intersect(false), numPoints(0) {}
};

class Intersection {
public:
    static Result<IntersectionResult> lineLine(const Line& l1, const Line& l2);
    static Result<IntersectionResult> lineCircle(const Line& line, const Circle& circle);
    static Result<IntersectionResult> linePlane(const Line& line, const Plane& plane);
    static Result<IntersectionResult> lineCylinder(const Line& line, const Cylinder& cylinder);
    static Result<IntersectionResult> lineSphere(const Line& line, const Sphere& sphere);
    
    static Result<IntersectionResult> circleCircle(const Circle& c1, const Circle& c2);
    
    static Result<IntersectionResult> planePlane(const Plane& p1, const Plane& p2);
    static Result<IntersectionResult> planeCylinder(const Plane& plane, const Cylinder& cylinder);
    static Result<IntersectionResult> planeSphere(const Plane& plane, const Sphere& sphere);
    static Result<IntersectionResult> planeCone(const Plane& plane, const Cone& cone);
    
    static Result<IntersectionResult> cylinderCylinder(const Cylinder& c1, const Cylinder& c2);
    static Result<IntersectionResult> cylinderSphere(const Cylinder& cylinder, const Sphere& sphere);
    
    static Result<IntersectionResult> sphereSphere(const Sphere& s1, const Sphere& s2);
    
    static Result<IntersectionResult> curveCurve(const Curve& c1, const Curve& c2);
    static Result<IntersectionResult> curveSurface(const Curve& curve, const Surface& surface);
    static Result<IntersectionResult> surfaceSurface(const Surface& s1, const Surface& s2);
};

} // namespace trae_geo_cpp