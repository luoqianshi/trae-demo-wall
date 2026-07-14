#pragma once

#include "Mesh.h"

namespace trae_geo_cpp {

struct SimplificationSettings {
    double targetRatio;
    double maxError;
    uint32_t targetFaceCount;
    bool preserveBoundary;
    bool preserveFeatures;
    double featureAngle;

    SimplificationSettings() 
        : targetRatio(0.5),
          maxError(0.01),
          targetFaceCount(0),
          preserveBoundary(true),
          preserveFeatures(true),
          featureAngle(45.0) {}
};

struct SimplificationResult {
    Mesh* mesh;
    uint32_t originalFaceCount;
    uint32_t simplifiedFaceCount;
    double maxDeviation;

    SimplificationResult() : mesh(nullptr), originalFaceCount(0), 
                             simplifiedFaceCount(0), maxDeviation(0.0) {}
};

class MeshSimplification {
public:
    static Result<SimplificationResult> simplify(Mesh& mesh, const SimplificationSettings& settings);
    
    static Result<Mesh*> decimate(Mesh& mesh, uint32_t targetFaces);
    static Result<Mesh*> quadricErrorMetric(Mesh& mesh, uint32_t targetFaces);
    static Result<Mesh*> edgeCollapse(Mesh& mesh, double maxError);
    
    static Result<void> removeDuplicateVertices(Mesh& mesh, double tolerance = 1e-6);
    static Result<void> removeDegenerateTriangles(Mesh& mesh);
};

} // namespace trae_geo_cpp