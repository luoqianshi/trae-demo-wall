#pragma once

#include "Mesh.h"

namespace trae_geo_cpp {

enum class SubdivisionScheme {
    Loop = 0,
    CatmullClark = 1,
    Butterfly = 2,
    Bilinear = 3,
};

struct SubdivisionResult {
    Mesh* mesh;
    uint32_t subdivisions;

    SubdivisionResult() : mesh(nullptr), subdivisions(0) {}
};

class MeshSubdivision {
public:
    static Result<SubdivisionResult> subdivide(Mesh& mesh, SubdivisionScheme scheme, uint32_t levels);
    
    static Result<Mesh*> loopSubdivision(Mesh& mesh, uint32_t levels);
    static Result<Mesh*> catmullClarkSubdivision(Mesh& mesh, uint32_t levels);
    static Result<Mesh*> butterflySubdivision(Mesh& mesh, uint32_t levels);
    static Result<Mesh*> bilinearSubdivision(Mesh& mesh, uint32_t levels);
    
    static Result<void> smoothNormals(Mesh& mesh, uint32_t iterations = 1);
};

} // namespace trae_geo_cpp