#include <stdio.h>
#include <stdlib.h>
#include "../cpp/include/trae_geo_c_api/trae_geo.h"

int main() {
    printf("TraeGeo C API Demo\n");
    printf("==================\n\n");

    trae_geo_vec3_t min = {0.0, 0.0, 0.0};
    trae_geo_vec3_t max = {1.0, 1.0, 1.0};

    trae_geo_handle_t box1 = trae_geo_create_box(&min, &max);
    if (box1 == TRAE_GEO_INVALID_HANDLE) {
        printf("ERROR: Failed to create box1\n");
        return 1;
    }
    printf("Created box1: handle=%llu\n", (unsigned long long)box1);

    trae_geo_vec3_t min2 = {0.5, 0.5, 0.5};
    trae_geo_vec3_t max2 = {1.5, 1.5, 1.5};

    trae_geo_handle_t box2 = trae_geo_create_box(&min2, &max2);
    if (box2 == TRAE_GEO_INVALID_HANDLE) {
        printf("ERROR: Failed to create box2\n");
        trae_geo_delete_entity(box1);
        return 1;
    }
    printf("Created box2: handle=%llu\n", (unsigned long long)box2);

    trae_geo_handle_t result = TRAE_GEO_INVALID_HANDLE;
    trae_geo_error_t err = trae_geo_boolean_union(box1, box2, &result);
    if (err != TRAE_GEO_ERROR_OK) {
        printf("ERROR: Boolean union failed, error=%d\n", err);
        trae_geo_delete_entity(box1);
        trae_geo_delete_entity(box2);
        return 1;
    }
    printf("Boolean union result: handle=%llu\n", (unsigned long long)result);

    trae_geo_mesh_data_t mesh = {0};
    err = trae_geo_generate_mesh(result, 0.1, 0.1, &mesh);
    if (err != TRAE_GEO_ERROR_OK) {
        printf("ERROR: Mesh generation failed, error=%d\n", err);
        trae_geo_delete_entity(box1);
        trae_geo_delete_entity(box2);
        trae_geo_delete_entity(result);
        return 1;
    }
    printf("Generated mesh: %zu vertices, %zu triangles\n", 
           mesh.num_vertices, mesh.num_triangles);

    trae_geo_bounding_box_t bbox;
    err = trae_geo_get_bounding_box(result, &bbox);
    if (err == TRAE_GEO_ERROR_OK) {
        printf("Bounding box: min=(%.3f, %.3f, %.3f), max=(%.3f, %.3f, %.3f)\n",
               bbox.min.x, bbox.min.y, bbox.min.z,
               bbox.max.x, bbox.max.y, bbox.max.z);
    }

    trae_geo_free_mesh_data(&mesh);
    trae_geo_delete_entity(box1);
    trae_geo_delete_entity(box2);
    trae_geo_delete_entity(result);

    printf("\nDemo completed successfully!\n");
    return 0;
}