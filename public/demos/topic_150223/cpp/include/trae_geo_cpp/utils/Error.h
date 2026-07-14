#pragma once

#ifdef TRAE_GEO_CPP_EXPORTS
#define TRAE_GEO_API __declspec(dllexport)
#else
#define TRAE_GEO_API __declspec(dllimport)
#endif

#ifdef __GNUC__
#define TRAE_GEO_API __attribute__((visibility("default")))
#endif

#ifdef __EMSCRIPTEN__
#define TRAE_GEO_API __attribute__((visibility("default")))
#endif

namespace trae_geo_cpp {

enum class TraeGeoError : int32_t {
    Ok = 0,
    NumericalSingularity = 1,
    TopologyCorrupted = 2,
    InvalidInput = 3,
    MemoryOverflow = 4,
    NotImplemented = 5,
    IntersectionFailure = 6,
    BooleanFailure = 7,
    MeshGenerationFailure = 8,
    OutOfBounds = 9,
    InvalidParameter = 10,
    DegenerateGeometry = 11,
    OperationCanceled = 12,
    FileIOError = 13,
    LicenseError = 14,
    InternalError = 15,
};

TRAE_GEO_API const char* traeGeoErrorToString(TraeGeoError error);

template<typename T>
class Result {
public:
    Result() : error_(TraeGeoError::Ok), value_() {}
    Result(T value) : error_(TraeGeoError::Ok), value_(std::move(value)) {}
    Result(TraeGeoError error) : error_(error), value_() {}
    
    bool isOk() const { return error_ == TraeGeoError::Ok; }
    bool isErr() const { return error_ != TraeGeoError::Ok; }
    
    TraeGeoError error() const { return error_; }
    T& value() { return value_; }
    const T& value() const { return value_; }
    
    operator bool() const { return isOk(); }
    
private:
    TraeGeoError error_;
    T value_;
};

template<>
class Result<void> {
public:
    Result() : error_(TraeGeoError::Ok) {}
    Result(TraeGeoError error) : error_(error) {}
    
    bool isOk() const { return error_ == TraeGeoError::Ok; }
    bool isErr() const { return error_ != TraeGeoError::Ok; }
    
    TraeGeoError error() const { return error_; }
    
    operator bool() const { return isOk(); }
    
private:
    TraeGeoError error_;
};

} // namespace trae_geo_cpp