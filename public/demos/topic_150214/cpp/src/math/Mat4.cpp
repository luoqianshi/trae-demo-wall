#include "trae_geo_cpp/math/Mat4.h"

namespace trae_geo_cpp {

const Mat4 Mat4::ZERO = {0.0};
const Mat4 Mat4::IDENTITY = {
    {1.0, 0.0, 0.0, 0.0},
    {0.0, 1.0, 0.0, 0.0},
    {0.0, 0.0, 1.0, 0.0},
    {0.0, 0.0, 0.0, 1.0}
};

Mat4::Mat4() {
    for (int i = 0; i < 4; ++i) {
        for (int j = 0; j < 4; ++j) {
            m[i][j] = (i == j) ? 1.0 : 0.0;
        }
    }
}

Mat4::Mat4(const double* data) {
    for (int i = 0; i < 4; ++i) {
        for (int j = 0; j < 4; ++j) {
            m[i][j] = data[i * 4 + j];
        }
    }
}

Mat4 Mat4::translate(const Vec3& v) {
    Mat4 result;
    result.m[0][3] = v.x;
    result.m[1][3] = v.y;
    result.m[2][3] = v.z;
    return result;
}

Mat4 Mat4::scale(const Vec3& v) {
    Mat4 result;
    result.m[0][0] = v.x;
    result.m[1][1] = v.y;
    result.m[2][2] = v.z;
    return result;
}

Mat4 Mat4::rotateX(double angle) {
    Mat4 result;
    double s = std::sin(angle);
    double c = std::cos(angle);
    result.m[1][1] = c;
    result.m[1][2] = -s;
    result.m[2][1] = s;
    result.m[2][2] = c;
    return result;
}

Mat4 Mat4::rotateY(double angle) {
    Mat4 result;
    double s = std::sin(angle);
    double c = std::cos(angle);
    result.m[0][0] = c;
    result.m[0][2] = s;
    result.m[2][0] = -s;
    result.m[2][2] = c;
    return result;
}

Mat4 Mat4::rotateZ(double angle) {
    Mat4 result;
    double s = std::sin(angle);
    double c = std::cos(angle);
    result.m[0][0] = c;
    result.m[0][1] = -s;
    result.m[1][0] = s;
    result.m[1][1] = c;
    return result;
}

Mat4 Mat4::transpose() const {
    Mat4 result;
    for (int i = 0; i < 4; ++i) {
        for (int j = 0; j < 4; ++j) {
            result.m[i][j] = m[j][i];
        }
    }
    return result;
}

double Mat4::determinant() const {
    const double* a = &m[0][0];
    return a[0] * (a[5] * (a[10] * a[15] - a[11] * a[14])
        - a[6] * (a[9] * a[15] - a[11] * a[13])
        + a[7] * (a[9] * a[14] - a[10] * a[13]))
        - a[1] * (a[4] * (a[10] * a[15] - a[11] * a[14])
            - a[6] * (a[8] * a[15] - a[11] * a[12])
            + a[7] * (a[8] * a[14] - a[10] * a[12]))
        + a[2] * (a[4] * (a[9] * a[15] - a[11] * a[13])
            - a[5] * (a[8] * a[15] - a[11] * a[12])
            + a[7] * (a[8] * a[13] - a[9] * a[12]))
        - a[3] * (a[4] * (a[9] * a[14] - a[10] * a[13])
            - a[5] * (a[8] * a[14] - a[10] * a[12])
            + a[6] * (a[8] * a[13] - a[9] * a[12]));
}

bool Mat4::tryInverse(Mat4& result) const {
    double det = determinant();
    if (std::abs(det) < 1e-15) return false;
    
    double invDet = 1.0 / det;
    const double* a = &m[0][0];
    
    result.m[0][0] = (a[5] * (a[10] * a[15] - a[11] * a[14])
        - a[6] * (a[9] * a[15] - a[11] * a[13])
        + a[7] * (a[9] * a[14] - a[10] * a[13])) * invDet;
    result.m[0][1] = -(a[1] * (a[10] * a[15] - a[11] * a[14])
        - a[2] * (a[9] * a[15] - a[11] * a[13])
        + a[3] * (a[9] * a[14] - a[10] * a[13])) * invDet;
    result.m[0][2] = (a[1] * (a[6] * a[15] - a[7] * a[14])
        - a[2] * (a[5] * a[15] - a[7] * a[13])
        + a[3] * (a[5] * a[14] - a[6] * a[13])) * invDet;
    result.m[0][3] = -(a[1] * (a[6] * a[11] - a[7] * a[10])
        - a[2] * (a[5] * a[11] - a[7] * a[9])
        + a[3] * (a[5] * a[10] - a[6] * a[9])) * invDet;

    result.m[1][0] = -(a[4] * (a[10] * a[15] - a[11] * a[14])
        - a[6] * (a[8] * a[15] - a[11] * a[12])
        + a[7] * (a[8] * a[14] - a[10] * a[12])) * invDet;
    result.m[1][1] = (a[0] * (a[10] * a[15] - a[11] * a[14])
        - a[2] * (a[8] * a[15] - a[11] * a[12])
        + a[3] * (a[8] * a[14] - a[10] * a[12])) * invDet;
    result.m[1][2] = -(a[0] * (a[6] * a[15] - a[7] * a[14])
        - a[2] * (a[4] * a[15] - a[7] * a[12])
        + a[3] * (a[4] * a[14] - a[6] * a[12])) * invDet;
    result.m[1][3] = (a[0] * (a[6] * a[11] - a[7] * a[10])
        - a[2] * (a[4] * a[11] - a[7] * a[8])
        + a[3] * (a[4] * a[10] - a[6] * a[8])) * invDet;

    result.m[2][0] = (a[4] * (a[9] * a[15] - a[11] * a[13])
        - a[5] * (a[8] * a[15] - a[11] * a[12])
        + a[7] * (a[8] * a[13] - a[9] * a[12])) * invDet;
    result.m[2][1] = -(a[0] * (a[9] * a[15] - a[11] * a[13])
        - a[1] * (a[8] * a[15] - a[11] * a[12])
        + a[3] * (a[8] * a[13] - a[9] * a[12])) * invDet;
    result.m[2][2] = (a[0] * (a[5] * a[15] - a[7] * a[13])
        - a[1] * (a[4] * a[15] - a[7] * a[12])
        + a[3] * (a[4] * a[13] - a[5] * a[12])) * invDet;
    result.m[2][3] = -(a[0] * (a[5] * a[11] - a[7] * a[9])
        - a[1] * (a[4] * a[11] - a[7] * a[8])
        + a[3] * (a[4] * a[9] - a[5] * a[8])) * invDet;

    result.m[3][0] = -(a[4] * (a[9] * a[14] - a[10] * a[13])
        - a[5] * (a[8] * a[14] - a[10] * a[12])
        + a[6] * (a[8] * a[13] - a[9] * a[12])) * invDet;
    result.m[3][1] = (a[0] * (a[9] * a[14] - a[10] * a[13])
        - a[1] * (a[8] * a[14] - a[10] * a[12])
        + a[2] * (a[8] * a[13] - a[9] * a[12])) * invDet;
    result.m[3][2] = -(a[0] * (a[5] * a[14] - a[6] * a[13])
        - a[1] * (a[4] * a[14] - a[6] * a[12])
        + a[2] * (a[4] * a[13] - a[5] * a[12])) * invDet;
    result.m[3][3] = (a[0] * (a[5] * a[10] - a[6] * a[9])
        - a[1] * (a[4] * a[10] - a[6] * a[8])
        + a[2] * (a[4] * a[9] - a[5] * a[8])) * invDet;

    return true;
}

Mat4 Mat4::inverse() const {
    Mat4 result;
    tryInverse(result);
    return result;
}

Vec3 Mat4::transformPoint(const Vec3& p) const {
    double x = m[0][0] * p.x + m[0][1] * p.y + m[0][2] * p.z + m[0][3];
    double y = m[1][0] * p.x + m[1][1] * p.y + m[1][2] * p.z + m[1][3];
    double z = m[2][0] * p.x + m[2][1] * p.y + m[2][2] * p.z + m[2][3];
    double w = m[3][0] * p.x + m[3][1] * p.y + m[3][2] * p.z + m[3][3];
    if (std::abs(w) < 1e-15) return Vec3::ZERO;
    return Vec3(x / w, y / w, z / w);
}

Vec3 Mat4::transformVector(const Vec3& v) const {
    return Vec3(
        m[0][0] * v.x + m[0][1] * v.y + m[0][2] * v.z,
        m[1][0] * v.x + m[1][1] * v.y + m[1][2] * v.z,
        m[2][0] * v.x + m[2][1] * v.y + m[2][2] * v.z
    );
}

Mat4 Mat4::operator*(const Mat4& other) const {
    Mat4 result;
    for (int i = 0; i < 4; ++i) {
        for (int j = 0; j < 4; ++j) {
            result.m[i][j] = 0.0;
            for (int k = 0; k < 4; ++k) {
                result.m[i][j] += m[i][k] * other.m[k][j];
            }
        }
    }
    return result;
}

bool Mat4::operator==(const Mat4& other) const {
    for (int i = 0; i < 4; ++i) {
        for (int j = 0; j < 4; ++j) {
            if (m[i][j] != other.m[i][j]) return false;
        }
    }
    return true;
}

} // namespace trae_geo_cpp