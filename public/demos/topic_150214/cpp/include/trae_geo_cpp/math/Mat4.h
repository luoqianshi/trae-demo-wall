#pragma once

#include "Vec3.h"

namespace trae_geo_cpp {

struct Mat4 {
    double m[4][4];

    Mat4();
    Mat4(const double* data);

    static const Mat4 ZERO;
    static const Mat4 IDENTITY;

    static Mat4 translate(const Vec3& v);
    static Mat4 scale(const Vec3& v);
    static Mat4 rotateX(double angle);
    static Mat4 rotateY(double angle);
    static Mat4 rotateZ(double angle);

    Mat4 transpose() const;
    double determinant() const;
    Mat4 inverse() const;
    bool tryInverse(Mat4& result) const;

    Vec3 transformPoint(const Vec3& p) const;
    Vec3 transformVector(const Vec3& v) const;

    Mat4 operator*(const Mat4& other) const;
    bool operator==(const Mat4& other) const;
};

} // namespace trae_geo_cpp