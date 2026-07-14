#include "trae_geo_cpp/utils/Precision.h"

namespace trae_geo_cpp {

double Precision::epsilon_ = DEFAULT_EPSILON;
double Precision::tolerance_ = DEFAULT_TOLERANCE;
double Precision::angleTolerance_ = DEFAULT_ANGLE_TOLERANCE;
double Precision::curveTolerance_ = DEFAULT_CURVE_TOLERANCE;
double Precision::surfaceTolerance_ = DEFAULT_SURFACE_TOLERANCE;
bool Precision::useRelativeTolerance_ = true;

double Precision::epsilon() {
    return epsilon_;
}

bool Precision::setEpsilon(double value) {
    if (value >= MIN_EPSILON && value <= MAX_EPSILON) {
        epsilon_ = value;
        return true;
    }
    return false;
}

double Precision::tolerance() {
    return tolerance_;
}

bool Precision::setTolerance(double value) {
    if (value >= MIN_EPSILON && value <= 1e-1) {
        tolerance_ = value;
        return true;
    }
    return false;
}

double Precision::angleTolerance() {
    return angleTolerance_;
}

bool Precision::setAngleTolerance(double value) {
    if (value >= 1e-10 && value <= 1e-1) {
        angleTolerance_ = value;
        return true;
    }
    return false;
}

double Precision::curveTolerance() {
    return curveTolerance_;
}

bool Precision::setCurveTolerance(double value) {
    if (value >= MIN_EPSILON && value <= 1e-2) {
        curveTolerance_ = value;
        return true;
    }
    return false;
}

double Precision::surfaceTolerance() {
    return surfaceTolerance_;
}

bool Precision::setSurfaceTolerance(double value) {
    if (value >= MIN_EPSILON && value <= 1e-2) {
        surfaceTolerance_ = value;
        return true;
    }
    return false;
}

bool Precision::useRelativeTolerance() {
    return useRelativeTolerance_;
}

void Precision::setUseRelativeTolerance(bool value) {
    useRelativeTolerance_ = value;
}

} // namespace trae_geo_cpp