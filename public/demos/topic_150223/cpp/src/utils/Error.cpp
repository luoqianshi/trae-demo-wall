#include "trae_geo_cpp/utils/Error.h"

namespace trae_geo_cpp {

const char* traeGeoErrorToString(TraeGeoError error) {
    switch (error) {
        case TraeGeoError::Ok: return "Success";
        case TraeGeoError::NumericalSingularity: return "Numerical singularity encountered";
        case TraeGeoError::TopologyCorrupted: return "Topology data is corrupted";
        case TraeGeoError::InvalidInput: return "Invalid input parameters";
        case TraeGeoError::MemoryOverflow: return "Memory allocation failed";
        case TraeGeoError::NotImplemented: return "Function not implemented";
        case TraeGeoError::IntersectionFailure: return "Geometric intersection failed";
        case TraeGeoError::BooleanFailure: return "Boolean operation failed";
        case TraeGeoError::MeshGenerationFailure: return "Mesh generation failed";
        case TraeGeoError::OutOfBounds: return "Index out of bounds";
        case TraeGeoError::InvalidParameter: return "Invalid parameter value";
        case TraeGeoError::DegenerateGeometry: return "Degenerate geometry detected";
        case TraeGeoError::OperationCanceled: return "Operation was canceled";
        case TraeGeoError::FileIOError: return "File I/O error";
        case TraeGeoError::LicenseError: return "License validation failed";
        case TraeGeoError::InternalError: return "Internal error";
        default: return "Unknown error";
    }
}

} // namespace trae_geo_cpp