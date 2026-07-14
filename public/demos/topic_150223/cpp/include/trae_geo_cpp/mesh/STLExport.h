#pragma once

#include "Mesh.h"

namespace trae_geo_cpp {

class STLExport {
public:
    static Result<bool> exportToFile(const Mesh& mesh, const char* filename, bool binary = true);
    static Result<bool> exportSolidToSTL(Handle solid, const char* filename, const MeshSettings& settings, bool binary = true);
    
    static Result<size_t> exportToBuffer(const Mesh& mesh, float* buffer, size_t bufferSize);
    static Result<size_t> getRequiredBufferSize(const Mesh& mesh);
};

} // namespace trae_geo_cpp