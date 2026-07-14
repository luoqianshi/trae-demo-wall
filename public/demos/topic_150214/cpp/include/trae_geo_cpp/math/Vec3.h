#pragma once

#include <cmath>

namespace trae_geo_cpp {

struct Vec3 {
    double x;
    double y;
    double z;

    Vec3() : x(0.0), y(0.0), z(0.0) {}
    Vec3(double x, double y, double z) : x(x), y(y), z(z) {}

    static const Vec3 ZERO;
    static const Vec3 UNIT_X;
    static const Vec3 UNIT_Y;
    static const Vec3 UNIT_Z;

    double dot(const Vec3& other) const;
    Vec3 cross(const Vec3& other) const;
    double length() const;
    double lengthSquared() const;
    Vec3 normalize() const;
    double distance(const Vec3& other) const;
    double distanceSquared(const Vec3& other) const;
    double angle(const Vec3& other) const;
    Vec3 lerp(const Vec3& other, double t) const;
    Vec3 min(const Vec3& other) const;
    Vec3 max(const Vec3& other) const;
    Vec3 abs() const;
    bool isZero(double epsilon = 1e-8) const;
    bool isUnit(double epsilon = 1e-8) const;

    Vec3 operator+(const Vec3& other) const;
    Vec3 operator-(const Vec3& other) const;
    Vec3 operator*(double scalar) const;
    Vec3 operator/(double scalar) const;
    Vec3 operator-() const;
    
    Vec3& operator+=(const Vec3& other);
    Vec3& operator-=(const Vec3& other);
    Vec3& operator*=(double scalar);
    Vec3& operator/=(double scalar);

    bool operator==(const Vec3& other) const;
    bool operator!=(const Vec3& other) const;
};

inline Vec3 Vec3::ZERO(0.0, 0.0, 0.0);
inline Vec3 Vec3::UNIT_X(1.0, 0.0, 0.0);
inline Vec3 Vec3::UNIT_Y(0.0, 1.0, 0.0);
inline Vec3 Vec3::UNIT_Z(0.0, 0.0, 1.0);

inline double Vec3::dot(const Vec3& other) const {
    return x * other.x + y * other.y + z * other.z;
}

inline Vec3 Vec3::cross(const Vec3& other) const {
    return Vec3(
        y * other.z - z * other.y,
        z * other.x - x * other.z,
        x * other.y - y * other.x
    );
}

inline double Vec3::length() const {
    return std::sqrt(x * x + y * y + z * z);
}

inline double Vec3::lengthSquared() const {
    return x * x + y * y + z * z;
}

inline Vec3 Vec3::normalize() const {
    double len = length();
    if (len < 1e-15) return Vec3::ZERO;
    return Vec3(x / len, y / len, z / len);
}

inline double Vec3::distance(const Vec3& other) const {
    return (*this - other).length();
}

inline double Vec3::distanceSquared(const Vec3& other) const {
    return (*this - other).lengthSquared();
}

inline Vec3 Vec3::operator+(const Vec3& other) const {
    return Vec3(x + other.x, y + other.y, z + other.z);
}

inline Vec3 Vec3::operator-(const Vec3& other) const {
    return Vec3(x - other.x, y - other.y, z - other.z);
}

inline Vec3 Vec3::operator*(double scalar) const {
    return Vec3(x * scalar, y * scalar, z * scalar);
}

inline Vec3 Vec3::operator/(double scalar) const {
    if (std::abs(scalar) < 1e-15) return Vec3::ZERO;
    return Vec3(x / scalar, y / scalar, z / scalar);
}

inline Vec3 Vec3::operator-() const {
    return Vec3(-x, -y, -z);
}

inline Vec3& Vec3::operator+=(const Vec3& other) {
    x += other.x; y += other.y; z += other.z;
    return *this;
}

inline Vec3& Vec3::operator-=(const Vec3& other) {
    x -= other.x; y -= other.y; z -= other.z;
    return *this;
}

inline Vec3& Vec3::operator*=(double scalar) {
    x *= scalar; y *= scalar; z *= scalar;
    return *this;
}

inline Vec3& Vec3::operator/=(double scalar) {
    if (std::abs(scalar) >= 1e-15) {
        x /= scalar; y /= scalar; z /= scalar;
    }
    return *this;
}

inline bool Vec3::operator==(const Vec3& other) const {
    return x == other.x && y == other.y && z == other.z;
}

inline bool Vec3::operator!=(const Vec3& other) const {
    return !(*this == other);
}

} // namespace trae_geo_cpp