#pragma once

#include "../geometry/Brep.h"
#include "../utils/Error.h"

namespace trae_geo_cpp {

struct StitchResult {
    Handle result;
    uint32_t numEdgesStitched;
    uint32_t numFacesStitched;

    StitchResult() : result(INVALID_HANDLE), numEdgesStitched(0), numFacesStitched(0) {}
};

class Stitch {
public:
    static Result<StitchResult> stitchEdges(Handle solid, double tolerance = 1e-6);
    static Result<StitchResult> stitchFaces(Handle solid, double tolerance = 1e-6);
    static Result<StitchResult> stitchShells(const Handle* shells, uint32_t numShells, double tolerance = 1e-6);
    static Result<StitchResult> stitchSolids(const Handle* solids, uint32_t numSolids, double tolerance = 1e-6);
    
    static Result<bool> canStitch(Handle edgeA, Handle edgeB, double tolerance = 1e-6);
};

} // namespace trae_geo_cpp