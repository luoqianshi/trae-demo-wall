#include "trae_geo_c_api/trae_geo.h"
#include "trae_geo_cpp/utils/Error.h"
#include "trae_geo_cpp/utils/Precision.h"
#include "trae_geo_cpp/geometry/Brep.h"
#include "trae_geo_cpp/operations/Boolean.h"
#include "trae_geo_cpp/operations/Intersection.h"
#include "trae_geo_cpp/operations/Offset.h"
#include "trae_geo_cpp/operations/Fillet.h"
#include "trae_geo_cpp/mesh/Mesh.h"
#include "trae_geo_cpp/mesh/STLExport.h"
#include "trae_geo_cpp/math/Vec3.h"
#include "trae_geo_cpp/math/Mat4.h"
#include <cstring>

using namespace trae_geo_cpp;

extern "C" {

const char* trae_geo_version(void) {
    return "0.1.0";
}

void trae_geo_free_string(char* str) {
    delete[] str;
}

const char* trae_geo_error_to_string(trae_geo_error_t error) {
    return traeGeoErrorToString(static_cast<TraeGeoError>(error));
}

trae_geo_error_t trae_geo_set_epsilon(double epsilon) {
    return Precision::setEpsilon(epsilon) ? TRAE_GEO_OK : TRAE_GEO_ERROR_INVALID_PARAMETER;
}

double trae_geo_get_epsilon(void) {
    return Precision::epsilon();
}

trae_geo_error_t trae_geo_set_tolerance(double tolerance) {
    return Precision::setTolerance(tolerance) ? TRAE_GEO_OK : TRAE_GEO_ERROR_INVALID_PARAMETER;
}

double trae_geo_get_tolerance(void) {
    return Precision::tolerance();
}

trae_geo_handle_t trae_geo_create_box(const trae_geo_vec3_t* min, const trae_geo_vec3_t* max) {
    if (!min || !max) return TRAE_GEO_INVALID_HANDLE;
    return TRAE_GEO_INVALID_HANDLE;
}

trae_geo_handle_t trae_geo_create_sphere(const trae_geo_vec3_t* center, double radius) {
    if (!center || radius <= 0) return TRAE_GEO_INVALID_HANDLE;
    return TRAE_GEO_INVALID_HANDLE;
}

trae_geo_handle_t trae_geo_create_cylinder(const trae_geo_vec3_t* origin, const trae_geo_vec3_t* axis, double radius, double height) {
    if (!origin || !axis || radius <= 0 || height <= 0) return TRAE_GEO_INVALID_HANDLE;
    return TRAE_GEO_INVALID_HANDLE;
}

trae_geo_handle_t trae_geo_create_cone(const trae_geo_vec3_t* origin, const trae_geo_vec3_t* axis, double angle, double height) {
    if (!origin || !axis || angle <= 0 || height <= 0) return TRAE_GEO_INVALID_HANDLE;
    return TRAE_GEO_INVALID_HANDLE;
}

trae_geo_handle_t trae_geo_create_plane(const trae_geo_vec3_t* origin, const trae_geo_vec3_t* normal) {
    if (!origin || !normal) return TRAE_GEO_INVALID_HANDLE;
    return TRAE_GEO_INVALID_HANDLE;
}

trae_geo_error_t trae_geo_delete_entity(trae_geo_handle_t handle) {
    (void)handle;
    return TRAE_GEO_NOT_IMPLEMENTED;
}

trae_geo_error_t trae_geo_get_bounding_box(trae_geo_handle_t handle, trae_geo_bbox_t* bbox) {
    (void)handle;
    (void)bbox;
    return TRAE_GEO_NOT_IMPLEMENTED;
}

trae_geo_error_t trae_geo_boolean(trae_geo_handle_t solid_a, trae_geo_handle_t solid_b, trae_geo_boolean_operation_t operation, trae_geo_boolean_result_t* result) {
    (void)solid_a;
    (void)solid_b;
    (void)operation;
    (void)result;
    return TRAE_GEO_NOT_IMPLEMENTED;
}

trae_geo_error_t trae_geo_intersect_line_plane(const trae_geo_vec3_t* line_start, const trae_geo_vec3_t* line_end, const trae_geo_vec3_t* plane_origin, const trae_geo_vec3_t* plane_normal, trae_geo_intersection_result_t* result) {
    if (!line_start || !line_end || !plane_origin || !plane_normal || !result) {
        return TRAE_GEO_ERROR_INVALID_INPUT;
    }
    
    Line line(Vec3(line_start->x, line_start->y, line_start->z),
              Vec3(line_end->x, line_end->y, line_end->z));
    Plane plane(Vec3(plane_origin->x, plane_origin->y, plane_origin->z),
                Vec3(plane_normal->x, plane_normal->y, plane_normal->z));
    
    auto intersectResult = Intersection::linePlane(line, plane);
    if (!intersectResult.isOk()) {
        return static_cast<trae_geo_error_t>(intersectResult.error());
    }
    
    auto& ir = intersectResult.value();
    result->num_points = ir.numPoints;
    for (uint32_t i = 0; i < ir.numPoints; ++i) {
        result->points[i].x = ir.points[i].x;
        result->points[i].y = ir.points[i].y;
        result->points[i].z = ir.points[i].z;
        result->params[i][0] = ir.params[i][0];
        result->params[i][1] = ir.params[i][1];
    }
    
    return TRAE_GEO_OK;
}

trae_geo_error_t trae_geo_offset_solid(trae_geo_handle_t solid, double distance, trae_geo_handle_t* result) {
    (void)solid;
    (void)distance;
    (void)result;
    return TRAE_GEO_NOT_IMPLEMENTED;
}

trae_geo_error_t trae_geo_fillet_edge(trae_geo_handle_t solid, trae_geo_handle_t edge, double radius, trae_geo_handle_t* result) {
    (void)solid;
    (void)edge;
    (void)radius;
    (void)result;
    return TRAE_GEO_NOT_IMPLEMENTED;
}

trae_geo_error_t trae_geo_chamfer_edge(trae_geo_handle_t solid, trae_geo_handle_t edge, double distance1, double distance2, trae_geo_handle_t* result) {
    (void)solid;
    (void)edge;
    (void)distance1;
    (void)distance2;
    (void)result;
    return TRAE_GEO_NOT_IMPLEMENTED;
}

trae_geo_error_t trae_geo_generate_mesh(trae_geo_handle_t solid, const trae_geo_mesh_settings_t* settings, trae_geo_mesh_data_t* mesh_data) {
    (void)solid;
    (void)settings;
    (void)mesh_data;
    return TRAE_GEO_NOT_IMPLEMENTED;
}

trae_geo_error_t trae_geo_free_mesh_data(trae_geo_mesh_data_t* mesh_data) {
    (void)mesh_data;
    return TRAE_GEO_NOT_IMPLEMENTED;
}

trae_geo_error_t trae_geo_export_stl(trae_geo_handle_t solid, const char* filename, const trae_geo_mesh_settings_t* settings, uint8_t binary) {
    (void)solid;
    (void)filename;
    (void)settings;
    (void)binary;
    return TRAE_GEO_NOT_IMPLEMENTED;
}

trae_geo_error_t trae_geo_distance_point_solid(const trae_geo_vec3_t* point, trae_geo_handle_t solid, double* distance, trae_geo_vec3_t* closest_point) {
    (void)point;
    (void)solid;
    (void)distance;
    (void)closest_point;
    return TRAE_GEO_NOT_IMPLEMENTED;
}

trae_geo_error_t trae_geo_transform_solid(trae_geo_handle_t solid, const trae_geo_mat4_t* transform, trae_geo_handle_t* result) {
    (void)solid;
    (void)transform;
    (void)result;
    return TRAE_GEO_NOT_IMPLEMENTED;
}

static trae_geo_ai_config_t g_ai_config = {
    "qwen",
    "http://localhost:11434",
    60000,
    3,
    0.1f,
    0.9f,
    2000
};

trae_geo_error_t trae_geo_ai_set_config(const trae_geo_ai_config_t* config) {
    if (!config) return TRAE_GEO_ERROR_INVALID_INPUT;
    g_ai_config = *config;
    return TRAE_GEO_OK;
}

trae_geo_error_t trae_geo_ai_get_config(trae_geo_ai_config_t* config) {
    if (!config) return TRAE_GEO_ERROR_INVALID_INPUT;
    *config = g_ai_config;
    return TRAE_GEO_OK;
}

trae_geo_error_t trae_geo_ai_set_model(const char* model) {
    if (!model || strlen(model) == 0) return TRAE_GEO_ERROR_INVALID_INPUT;
    g_ai_config.model = model;
    return TRAE_GEO_OK;
}

trae_geo_error_t trae_geo_ai_set_base_url(const char* base_url) {
    if (!base_url || strlen(base_url) == 0) return TRAE_GEO_ERROR_INVALID_INPUT;
    g_ai_config.base_url = base_url;
    return TRAE_GEO_OK;
}

trae_geo_error_t trae_geo_ai_health_check(uint8_t* is_connected) {
    if (!is_connected) return TRAE_GEO_ERROR_INVALID_INPUT;
    *is_connected = 0;
    return TRAE_GEO_OK;
}

trae_geo_handle_t trae_geo_ai_generate_from_text(const char* text, trae_geo_error_t* error) {
    if (!text || strlen(text) == 0) {
        if (error) *error = TRAE_GEO_ERROR_INVALID_INPUT;
        return TRAE_GEO_INVALID_HANDLE;
    }
    
    if (error) *error = TRAE_GEO_NOT_IMPLEMENTED;
    return TRAE_GEO_INVALID_HANDLE;
}

trae_geo_error_t trae_geo_ai_generate_from_text_with_config(
    const char* text,
    const trae_geo_ai_config_t* config,
    trae_geo_handle_t* result
) {
    if (!text || strlen(text) == 0) return TRAE_GEO_ERROR_INVALID_INPUT;
    if (!config) return TRAE_GEO_ERROR_INVALID_INPUT;
    if (!result) return TRAE_GEO_ERROR_INVALID_INPUT;
    
    *result = TRAE_GEO_INVALID_HANDLE;
    return TRAE_GEO_NOT_IMPLEMENTED;
}

trae_geo_error_t trae_geo_ai_free_instruction_json(char* json) {
    if (json) {
        delete[] json;
    }
    return TRAE_GEO_OK;
}

} // extern "C"