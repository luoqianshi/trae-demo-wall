#pragma once

#include "../geometry/Brep.h"
#include "../utils/Error.h"

namespace trae_geo_cpp {

struct OffsetResult {
    Handle result;
    bool success;

    OffsetResult() : result(INVALID_HANDLE), success(false) {}
};

class Offset {
public:
    static Result<OffsetResult> offsetSolid(Handle solid, double distance, double tolerance = 1e-6);
    static Result<OffsetResult> offsetFace(Handle face, double distance, double tolerance = 1e-6);
    static Result<OffsetResult> offsetEdge(Handle edge, double distance, double tolerance = 1e-6);
    
    static Result<OffsetResult> thickenFace(Handle face, double thickness, bool bothSides = false, double tolerance = 1e-6);
};

} // namespace trae_geo_cpp