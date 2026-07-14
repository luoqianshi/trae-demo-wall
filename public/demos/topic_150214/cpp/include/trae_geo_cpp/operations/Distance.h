#pragma once

#include "../geometry/Curves.h"
#include "../geometry/Surfaces.h"
#include "../geometry/Brep.h"
#include "../utils/Error.h"

namespace trae_geo_cpp {

struct DistanceResult {
    double distance;
    Vec3 closestPointA;
    Vec3 closestPointB;
    double paramA;
    double paramB;

    DistanceResult() : distance(1e308), paramA(0.0), paramB(0.0) {}
};

class Distance {
public:
    static Result<DistanceResult> pointPoint(const Vec3& p1, const Vec3& p2);
    static Result<DistanceResult> pointLine(const Vec3& point, const Line& line);
    static Result<DistanceResult> pointCircle(const Vec3& point, const Circle& circle);
    static Result<DistanceResult> pointPlane(const Vec3& point, const Plane& plane);
    static Result<DistanceResult> pointCylinder(const Vec3& point, const Cylinder& cylinder);
    static Result<DistanceResult> pointSphere(const Vec3& point, const Sphere& sphere);
    
    static Result<DistanceResult> lineLine(const Line& l1, const Line& l2);
    static Result<DistanceResult> linePlane(const Line& line, const Plane& plane);
    static Result<DistanceResult> lineCylinder(const Line& line, const Cylinder& cylinder);
    
    static Result<DistanceResult> planePlane(const Plane& p1, const Plane& p2);
    static Result<DistanceResult> planeCylinder(const Plane& plane, const Cylinder& cylinder);
    
    static Result<DistanceResult> vertexVertex(Handle v1, Handle v2);
    static Result<DistanceResult> vertexEdge(Handle vertex, Handle edge);
    static Result<DistanceResult> vertexFace(Handle vertex, Handle face);
    static Result<DistanceResult> edgeEdge(Handle e1, Handle e2);
    static Result<DistanceResult> edgeFace(Handle edge, Handle face);
    static Result<DistanceResult> faceFace(Handle f1, Handle f2);
    
    static Result<DistanceResult> pointSolid(const Vec3& point, Handle solid);
    static Result<DistanceResult> solidSolid(Handle solidA, Handle solidB);
};

} // namespace trae_geo_cpp