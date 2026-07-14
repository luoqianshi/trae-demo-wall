#pragma once

#include "../math/Vec3.h"
#include "../geometry/Brep.h"
#include "../utils/Error.h"

namespace trae_geo_cpp {

struct Triangle {
    uint32_t indices[3];
    uint32_t faceIndex;

    Triangle() : faceIndex(0) {}
};

struct Quad {
    uint32_t indices[4];
    uint32_t faceIndex;

    Quad() : faceIndex(0) {}
};

struct MeshVertex {
    Vec3 position;
    Vec3 normal;
    Vec3 uv;
    uint32_t originalVertex;

    MeshVertex() : originalVertex(0) {}
};

struct Mesh {
    uint32_t numVertices;
    MeshVertex* vertices;
    uint32_t numTriangles;
    Triangle* triangles;
    uint32_t numQuads;
    Quad* quads;
    BoundingBox bbox;

    Mesh() : numVertices(0), vertices(nullptr), 
             numTriangles(0), triangles(nullptr),
             numQuads(0), quads(nullptr) {}
    
    ~Mesh() {
        delete[] vertices;
        delete[] triangles;
        delete[] quads;
    }
};

struct MeshSettings {
    double maxEdgeLength;
    double angleTolerance;
    double distanceTolerance;
    bool generateNormals;
    bool generateUVs;
    uint32_t maxVertices;
    uint32_t maxFaces;

    MeshSettings() 
        : maxEdgeLength(0.1), 
          angleTolerance(15.0),
          distanceTolerance(1e-6),
          generateNormals(true),
          generateUVs(false),
          maxVertices(1000000),
          maxFaces(2000000) {}
};

struct MeshResult {
    Mesh* mesh;
    bool success;

    MeshResult() : mesh(nullptr), success(false) {}
};

class MeshGenerator {
public:
    static Result<MeshResult> generateTriangleMesh(Handle solid, const MeshSettings& settings);
    static Result<MeshResult> generateQuadMesh(Handle solid, const MeshSettings& settings);
    static Result<MeshResult> generateMixedMesh(Handle solid, const MeshSettings& settings);
    
    static Result<MeshResult> generateFaceMesh(Handle face, const MeshSettings& settings);
    static Result<MeshResult> generateEdgeMesh(Handle edge, uint32_t numSegments);
    
    static Result<void> generateNormals(Mesh& mesh);
    static Result<void> generateUVs(Mesh& mesh);
    static Result<void> recalculateNormals(Mesh& mesh);
};

} // namespace trae_geo_cpp