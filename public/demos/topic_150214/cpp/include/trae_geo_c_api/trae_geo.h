#pragma once

#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef int32_t trae_geo_error_t;
typedef uint64_t trae_geo_handle_t;

#define TRAE_GEO_OK 0
#define TRAE_GEO_ERROR_NUMERICAL_SINGULARITY 1
#define TRAE_GEO_ERROR_TOPOLOGY_CORRUPTED 2
#define TRAE_GEO_ERROR_INVALID_INPUT 3
#define TRAE_GEO_ERROR_MEMORY_OVERFLOW 4
#define TRAE_GEO_ERROR_NOT_IMPLEMENTED 5
#define TRAE_GEO_ERROR_INTERSECTION_FAILURE 6
#define TRAE_GEO_ERROR_BOOLEAN_FAILURE 7
#define TRAE_GEO_ERROR_MESH_GENERATION_FAILURE 8
#define TRAE_GEO_ERROR_OUT_OF_BOUNDS 9
#define TRAE_GEO_ERROR_INVALID_PARAMETER 10
#define TRAE_GEO_ERROR_DEGENERATE_GEOMETRY 11
#define TRAE_GEO_ERROR_OPERATION_CANCELED 12
#define TRAE_GEO_ERROR_FILE_IO_ERROR 13
#define TRAE_GEO_ERROR_LICENSE_ERROR 14
#define TRAE_GEO_ERROR_INTERNAL_ERROR 15
#define TRAE_GEO_ERROR_AI_NETWORK_ERROR 16
#define TRAE_GEO_ERROR_AI_TIMEOUT 17
#define TRAE_GEO_ERROR_AI_RETRY_EXHAUSTED 18
#define TRAE_GEO_ERROR_AI_MODEL_NOT_FOUND 19
#define TRAE_GEO_ERROR_AI_INVALID_RESPONSE 20
#define TRAE_GEO_ERROR_AI_PARSE_ERROR 21
#define TRAE_GEO_ERROR_AI_VALIDATION_ERROR 22
#define TRAE_GEO_ERROR_AI_CONFIG_ERROR 23

#define TRAE_GEO_INVALID_HANDLE 0

typedef struct {
    double x;
    double y;
    double z;
} trae_geo_vec3_t;

typedef struct {
    double m[4][4];
} trae_geo_mat4_t;

typedef struct {
    trae_geo_vec3_t min;
    trae_geo_vec3_t max;
} trae_geo_bbox_t;

typedef struct {
    uint32_t num_vertices;
    const float* vertices;
    uint32_t num_normals;
    const float* normals;
    uint32_t num_uvs;
    const float* uvs;
    uint32_t num_indices;
    const uint32_t* indices;
} trae_geo_mesh_data_t;

typedef struct {
    uint32_t num_points;
    trae_geo_vec3_t points[16];
    double params[16][2];
} trae_geo_intersection_result_t;

typedef enum {
    TRAE_GEO_BOOLEAN_UNION = 0,
    TRAE_GEO_BOOLEAN_DIFFERENCE = 1,
    TRAE_GEO_BOOLEAN_INTERSECTION = 2,
    TRAE_GEO_BOOLEAN_SPLIT = 3,
} trae_geo_boolean_operation_t;

typedef struct {
    uint32_t num_solids;
    trae_geo_handle_t solids[64];
} trae_geo_boolean_result_t;

typedef struct {
    double max_edge_length;
    double angle_tolerance;
    double distance_tolerance;
    uint8_t generate_normals;
    uint8_t generate_uvs;
    uint32_t max_vertices;
    uint32_t max_faces;
} trae_geo_mesh_settings_t;

TRAE_GEO_API const char* trae_geo_version(void);
TRAE_GEO_API void trae_geo_free_string(char* str);
TRAE_GEO_API const char* trae_geo_error_to_string(trae_geo_error_t error);

TRAE_GEO_API trae_geo_error_t trae_geo_set_epsilon(double epsilon);
TRAE_GEO_API double trae_geo_get_epsilon(void);
TRAE_GEO_API trae_geo_error_t trae_geo_set_tolerance(double tolerance);
TRAE_GEO_API double trae_geo_get_tolerance(void);

TRAE_GEO_API trae_geo_handle_t trae_geo_create_box(
    const trae_geo_vec3_t* min, 
    const trae_geo_vec3_t* max
);

TRAE_GEO_API trae_geo_handle_t trae_geo_create_sphere(
    const trae_geo_vec3_t* center, 
    double radius
);

TRAE_GEO_API trae_geo_handle_t trae_geo_create_cylinder(
    const trae_geo_vec3_t* origin, 
    const trae_geo_vec3_t* axis, 
    double radius, 
    double height
);

TRAE_GEO_API trae_geo_handle_t trae_geo_create_cone(
    const trae_geo_vec3_t* origin, 
    const trae_geo_vec3_t* axis, 
    double angle, 
    double height
);

TRAE_GEO_API trae_geo_handle_t trae_geo_create_plane(
    const trae_geo_vec3_t* origin, 
    const trae_geo_vec3_t* normal
);

TRAE_GEO_API trae_geo_error_t trae_geo_delete_entity(trae_geo_handle_t handle);
TRAE_GEO_API trae_geo_error_t trae_geo_get_bounding_box(
    trae_geo_handle_t handle, 
    trae_geo_bbox_t* bbox
);

TRAE_GEO_API trae_geo_error_t trae_geo_boolean(
    trae_geo_handle_t solid_a,
    trae_geo_handle_t solid_b,
    trae_geo_boolean_operation_t operation,
    trae_geo_boolean_result_t* result
);

TRAE_GEO_API trae_geo_error_t trae_geo_intersect_line_plane(
    const trae_geo_vec3_t* line_start,
    const trae_geo_vec3_t* line_end,
    const trae_geo_vec3_t* plane_origin,
    const trae_geo_vec3_t* plane_normal,
    trae_geo_intersection_result_t* result
);

TRAE_GEO_API trae_geo_error_t trae_geo_offset_solid(
    trae_geo_handle_t solid,
    double distance,
    trae_geo_handle_t* result
);

TRAE_GEO_API trae_geo_error_t trae_geo_fillet_edge(
    trae_geo_handle_t solid,
    trae_geo_handle_t edge,
    double radius,
    trae_geo_handle_t* result
);

TRAE_GEO_API trae_geo_error_t trae_geo_chamfer_edge(
    trae_geo_handle_t solid,
    trae_geo_handle_t edge,
    double distance1,
    double distance2,
    trae_geo_handle_t* result
);

TRAE_GEO_API trae_geo_error_t trae_geo_generate_mesh(
    trae_geo_handle_t solid,
    const trae_geo_mesh_settings_t* settings,
    trae_geo_mesh_data_t* mesh_data
);

TRAE_GEO_API trae_geo_error_t trae_geo_free_mesh_data(trae_geo_mesh_data_t* mesh_data);

TRAE_GEO_API trae_geo_error_t trae_geo_export_stl(
    trae_geo_handle_t solid,
    const char* filename,
    const trae_geo_mesh_settings_t* settings,
    uint8_t binary
);

TRAE_GEO_API trae_geo_error_t trae_geo_distance_point_solid(
    const trae_geo_vec3_t* point,
    trae_geo_handle_t solid,
    double* distance,
    trae_geo_vec3_t* closest_point
);

TRAE_GEO_API trae_geo_error_t trae_geo_transform_solid(
    trae_geo_handle_t solid,
    const trae_geo_mat4_t* transform,
    trae_geo_handle_t* result
);

typedef struct {
    const char* model;
    const char* base_url;
    uint64_t timeout_ms;
    uint32_t max_retries;
    float temperature;
    float top_p;
    uint32_t max_tokens;
} trae_geo_ai_config_t;

TRAE_GEO_API trae_geo_error_t trae_geo_ai_set_config(const trae_geo_ai_config_t* config);
TRAE_GEO_API trae_geo_error_t trae_geo_ai_get_config(trae_geo_ai_config_t* config);
TRAE_GEO_API trae_geo_error_t trae_geo_ai_set_model(const char* model);
TRAE_GEO_API trae_geo_error_t trae_geo_ai_set_base_url(const char* base_url);
TRAE_GEO_API trae_geo_error_t trae_geo_ai_health_check(uint8_t* is_connected);

TRAE_GEO_API trae_geo_handle_t trae_geo_ai_generate_from_text(
    const char* text,
    trae_geo_error_t* error
);

TRAE_GEO_API trae_geo_error_t trae_geo_ai_generate_from_text_with_config(
    const char* text,
    const trae_geo_ai_config_t* config,
    trae_geo_handle_t* result
);

TRAE_GEO_API trae_geo_error_t trae_geo_ai_free_instruction_json(char* json);

#ifdef __cplusplus
}
#endif