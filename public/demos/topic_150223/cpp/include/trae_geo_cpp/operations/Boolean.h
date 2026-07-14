#pragma once

#include "../geometry/Brep.h"
#include "../utils/Error.h"

namespace trae_geo_cpp {

enum class BooleanOperation {
    Union = 0,
    Difference = 1,
    Intersection = 2,
    Split = 3,
};

struct BooleanResult {
    Handle result;
    uint32_t numSolids;
    Handle solids[64];

    BooleanResult() : result(INVALID_HANDLE), numSolids(0) {}
};

class Boolean {
public:
    static Result<BooleanResult> compute(
        Handle solidA, 
        Handle solidB, 
        BooleanOperation operation,
        double tolerance = 1e-6
    );

    static Result<BooleanResult> unionOp(Handle solidA, Handle solidB, double tolerance = 1e-6);
    static Result<BooleanResult> difference(Handle solidA, Handle solidB, double tolerance = 1e-6);
    static Result<BooleanResult> intersection(Handle solidA, Handle solidB, double tolerance = 1e-6);
    static Result<BooleanResult> split(Handle solid, Handle tool, double tolerance = 1e-6);

private:
    static Result<void> computeIntersectionCurves(
        Handle solidA, 
        Handle solidB,
        double tolerance
    );
    
    static Result<void> classifyFaces(
        Handle solidA, 
        Handle solidB,
        double tolerance
    );
    
    static Result<void> constructResult(
        Handle solidA, 
        Handle solidB,
        BooleanOperation operation,
        BooleanResult& result,
        double tolerance
    );
};

} // namespace trae_geo_cpp