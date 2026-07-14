#[repr(C)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TraeGeoError {
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
}

impl TraeGeoError {
    pub fn to_str(self) -> &'static str {
        match self {
            TraeGeoError::Ok => "Success",
            TraeGeoError::NumericalSingularity => "Numerical singularity encountered",
            TraeGeoError::TopologyCorrupted => "Topology data is corrupted",
            TraeGeoError::InvalidInput => "Invalid input parameters",
            TraeGeoError::MemoryOverflow => "Memory allocation failed",
            TraeGeoError::NotImplemented => "Function not implemented",
            TraeGeoError::IntersectionFailure => "Geometric intersection failed",
            TraeGeoError::BooleanFailure => "Boolean operation failed",
            TraeGeoError::MeshGenerationFailure => "Mesh generation failed",
            TraeGeoError::OutOfBounds => "Index out of bounds",
            TraeGeoError::InvalidParameter => "Invalid parameter value",
            TraeGeoError::DegenerateGeometry => "Degenerate geometry detected",
            TraeGeoError::OperationCanceled => "Operation was canceled",
            TraeGeoError::FileIOError => "File I/O error",
            TraeGeoError::LicenseError => "License validation failed",
            TraeGeoError::InternalError => "Internal error",
        }
    }
}

impl From<std::io::Error> for TraeGeoError {
    fn from(_: std::io::Error) -> Self {
        TraeGeoError::FileIOError
    }
}

impl From<std::alloc::LayoutError> for TraeGeoError {
    fn from(_: std::alloc::LayoutError) -> Self {
        TraeGeoError::MemoryOverflow
    }
}