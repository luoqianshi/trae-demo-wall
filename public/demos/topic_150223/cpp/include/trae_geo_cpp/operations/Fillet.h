#pragma once

#include "../geometry/Brep.h"
#include "../utils/Error.h"

namespace trae_geo_cpp {

struct FilletResult {
    Handle result;
    uint32_t numFacesAdded;
    Handle newFaces[64];

    FilletResult() : result(INVALID_HANDLE), numFacesAdded(0) {}
};

struct ChamferResult {
    Handle result;
    uint32_t numFacesAdded;
    Handle newFaces[64];

    ChamferResult() : result(INVALID_HANDLE), numFacesAdded(0) {}
};

class Fillet {
public:
    static Result<FilletResult> edgeFillet(Handle solid, Handle edge, double radius, double tolerance = 1e-6);
    static Result<FilletResult> edgeChainFillet(Handle solid, const Handle* edges, uint32_t numEdges, double radius, double tolerance = 1e-6);
    static Result<FilletResult> faceFillet(Handle solid, Handle faceA, Handle faceB, double radius, double tolerance = 1e-6);
    static Result<FilletResult> variableRadiusFillet(Handle solid, Handle edge, const double* radii, const double* params, uint32_t numRadii, double tolerance = 1e-6);
};

class Chamfer {
public:
    static Result<ChamferResult> edgeChamfer(Handle solid, Handle edge, double distance1, double distance2, double tolerance = 1e-6);
    static Result<ChamferResult> edgeChainChamfer(Handle solid, const Handle* edges, uint32_t numEdges, double distance1, double distance2, double tolerance = 1e-6);
    static Result<ChamferResult> cornerChamfer(Handle solid, Handle vertex, double distance1, double distance2, double distance3, double tolerance = 1e-6);
};

} // namespace trae_geo_cpp