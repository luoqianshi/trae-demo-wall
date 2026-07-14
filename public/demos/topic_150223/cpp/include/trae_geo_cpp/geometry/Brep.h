#pragma once

#include "Curves.h"
#include "Surfaces.h"
#include "../math/Vec3.h"

namespace trae_geo_cpp {

typedef uint64_t Handle;

constexpr Handle INVALID_HANDLE = 0;

enum class TopologyType {
    Vertex = 0,
    Edge = 1,
    Loop = 2,
    Face = 3,
    Shell = 4,
    Solid = 5,
    Compound = 6,
};

struct Vertex {
    Handle handle;
    Vec3 point;
    double tolerance;

    Vertex() : handle(INVALID_HANDLE), tolerance(1e-6) {}
};

struct Edge {
    Handle handle;
    Curve curve;
    Handle startVertex;
    Handle endVertex;
    bool reversed;
    double tolerance;

    Edge() : handle(INVALID_HANDLE), startVertex(INVALID_HANDLE), 
             endVertex(INVALID_HANDLE), reversed(false), tolerance(1e-6) {}
};

struct Loop {
    Handle handle;
    Handle face;
    const Handle* edges;
    uint32_t numEdges;
    bool outer;

    Loop() : handle(INVALID_HANDLE), face(INVALID_HANDLE), 
             edges(nullptr), numEdges(0), outer(true) {}
};

struct Face {
    Handle handle;
    Surface surface;
    const Handle* loops;
    uint32_t numLoops;
    Handle outerLoop;
    int32_t orientation;
    double tolerance;

    Face() : handle(INVALID_HANDLE), loops(nullptr), numLoops(0), 
             outerLoop(INVALID_HANDLE), orientation(1), tolerance(1e-6) {}
};

struct Shell {
    Handle handle;
    const Handle* faces;
    uint32_t numFaces;
    int32_t orientation;

    Shell() : handle(INVALID_HANDLE), faces(nullptr), numFaces(0), orientation(1) {}
};

struct Solid {
    Handle handle;
    const Handle* shells;
    uint32_t numShells;
    Handle outerShell;

    Solid() : handle(INVALID_HANDLE), shells(nullptr), numShells(0), outerShell(INVALID_HANDLE) {}
};

struct Compound {
    Handle handle;
    const Handle* children;
    uint32_t numChildren;

    Compound() : handle(INVALID_HANDLE), children(nullptr), numChildren(0) {}
};

struct Topology {
    TopologyType topologyType;
    union {
        Vertex vertex;
        Edge edge;
        Loop loop;
        Face face;
        Shell shell;
        Solid solid;
        Compound compound;
    } data;

    Topology() : topologyType(TopologyType::Vertex) {}
};

struct BoundingBox {
    Vec3 min;
    Vec3 max;

    BoundingBox() : min(Vec3(1e308, 1e308, 1e308)), max(Vec3(-1e308, -1e308, -1e308)) {}
    
    bool isEmpty() const;
    Vec3 center() const;
    Vec3 size() const;
    double volume() const;
    BoundingBox unionBox(const BoundingBox& other) const;
    bool intersects(const BoundingBox& other) const;
    bool containsPoint(const Vec3& p) const;
};

inline bool BoundingBox::isEmpty() const {
    return min.x > 1e300 || max.x < -1e300;
}

inline Vec3 BoundingBox::center() const {
    return (min + max) * 0.5;
}

inline Vec3 BoundingBox::size() const {
    return max - min;
}

inline double BoundingBox::volume() const {
    Vec3 s = size();
    return s.x * s.y * s.z;
}

inline BoundingBox BoundingBox::unionBox(const BoundingBox& other) const {
    BoundingBox result;
    result.min = Vec3(
        std::min(min.x, other.min.x),
        std::min(min.y, other.min.y),
        std::min(min.z, other.min.z)
    );
    result.max = Vec3(
        std::max(max.x, other.max.x),
        std::max(max.y, other.max.y),
        std::max(max.z, other.max.z)
    );
    return result;
}

inline bool BoundingBox::intersects(const BoundingBox& other) const {
    return min.x <= other.max.x && max.x >= other.min.x
        && min.y <= other.max.y && max.y >= other.min.y
        && min.z <= other.max.z && max.z >= other.min.z;
}

inline bool BoundingBox::containsPoint(const Vec3& p) const {
    return p.x >= min.x && p.x <= max.x
        && p.y >= min.y && p.y <= max.y
        && p.z >= min.z && p.z <= max.z;
}

} // namespace trae_geo_cpp