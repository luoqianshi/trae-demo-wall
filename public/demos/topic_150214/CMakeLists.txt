cmake_minimum_required(VERSION 3.16)

project(trae_geo VERSION 0.1.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

option(BUILD_SHARED_LIBS "Build shared libraries" ON)
option(BUILD_STATIC_LIBS "Build static libraries" OFF)
option(BUILD_WASM "Build WebAssembly" OFF)
option(BUILD_EXAMPLES "Build examples" OFF)
option(ENABLE_SIMD "Enable SIMD optimizations" ON)

set(CMAKE_RUNTIME_OUTPUT_DIRECTORY ${PROJECT_BINARY_DIR}/bin)
set(CMAKE_LIBRARY_OUTPUT_DIRECTORY ${PROJECT_BINARY_DIR}/lib)
set(CMAKE_ARCHIVE_OUTPUT_DIRECTORY ${PROJECT_BINARY_DIR}/lib)

if(BUILD_WASM)
    set(CMAKE_TOOLCHAIN_FILE "${CMAKE_CURRENT_SOURCE_DIR}/wasm/toolchain.cmake" CACHE STRING "Emscripten toolchain")
endif()

include(GNUInstallDirs)

set(TRAE_GEO_CPP_HEADERS
    ${CMAKE_CURRENT_SOURCE_DIR}/cpp/include/trae_geo_cpp/utils/Error.h
    ${CMAKE_CURRENT_SOURCE_DIR}/cpp/include/trae_geo_cpp/utils/Precision.h
    ${CMAKE_CURRENT_SOURCE_DIR}/cpp/include/trae_geo_cpp/math/Vec3.h
    ${CMAKE_CURRENT_SOURCE_DIR}/cpp/include/trae_geo_cpp/math/Mat4.h
    ${CMAKE_CURRENT_SOURCE_DIR}/cpp/include/trae_geo_cpp/geometry/Curves.h
    ${CMAKE_CURRENT_SOURCE_DIR}/cpp/include/trae_geo_cpp/geometry/Surfaces.h
    ${CMAKE_CURRENT_SOURCE_DIR}/cpp/include/trae_geo_cpp/geometry/Brep.h
    ${CMAKE_CURRENT_SOURCE_DIR}/cpp/include/trae_geo_cpp/operations/Intersection.h
    ${CMAKE_CURRENT_SOURCE_DIR}/cpp/include/trae_geo_cpp/operations/Boolean.h
    ${CMAKE_CURRENT_SOURCE_DIR}/cpp/include/trae_geo_cpp/operations/Offset.h
    ${CMAKE_CURRENT_SOURCE_DIR}/cpp/include/trae_geo_cpp/operations/Fillet.h
    ${CMAKE_CURRENT_SOURCE_DIR}/cpp/include/trae_geo_cpp/operations/Stitch.h
    ${CMAKE_CURRENT_SOURCE_DIR}/cpp/include/trae_geo_cpp/operations/Distance.h
    ${CMAKE_CURRENT_SOURCE_DIR}/cpp/include/trae_geo_cpp/mesh/Mesh.h
    ${CMAKE_CURRENT_SOURCE_DIR}/cpp/include/trae_geo_cpp/mesh/Simplification.h
    ${CMAKE_CURRENT_SOURCE_DIR}/cpp/include/trae_geo_cpp/mesh/Subdivision.h
    ${CMAKE_CURRENT_SOURCE_DIR}/cpp/include/trae_geo_cpp/mesh/STLExport.h
)

set(TRAE_GEO_CPP_SOURCES
    ${CMAKE_CURRENT_SOURCE_DIR}/cpp/src/utils/Error.cpp
    ${CMAKE_CURRENT_SOURCE_DIR}/cpp/src/utils/Precision.cpp
    ${CMAKE_CURRENT_SOURCE_DIR}/cpp/src/math/Mat4.cpp
)

set(TRAE_GEO_C_API_HEADERS
    ${CMAKE_CURRENT_SOURCE_DIR}/cpp/include/trae_geo_c_api/trae_geo.h
)

set(TRAE_GEO_C_API_SOURCES
    ${CMAKE_CURRENT_SOURCE_DIR}/cpp/src/c_api/trae_geo.cpp
)

add_library(trae_geo_cpp STATIC
    ${TRAE_GEO_CPP_HEADERS}
    ${TRAE_GEO_CPP_SOURCES}
)

target_include_directories(trae_geo_cpp PUBLIC
    $<BUILD_INTERFACE:${CMAKE_CURRENT_SOURCE_DIR}/cpp/include>
    $<INSTALL_INTERFACE:${CMAKE_INSTALL_INCLUDEDIR}>
)

if(ENABLE_SIMD AND NOT BUILD_WASM)
    if(MSVC)
        target_compile_options(trae_geo_cpp PRIVATE /arch:AVX2)
    else()
        target_compile_options(trae_geo_cpp PRIVATE -march=native -mfma)
    endif()
endif()

if(BUILD_WASM)
    target_compile_options(trae_geo_cpp PRIVATE -msimd128)
endif()

add_library(trae_geo SHARED
    ${TRAE_GEO_C_API_HEADERS}
    ${TRAE_GEO_C_API_SOURCES}
)

target_link_libraries(trae_geo PRIVATE trae_geo_cpp)

target_include_directories(trae_geo PUBLIC
    $<BUILD_INTERFACE:${CMAKE_CURRENT_SOURCE_DIR}/cpp/include>
    $<INSTALL_INTERFACE:${CMAKE_INSTALL_INCLUDEDIR}>
)

if(BUILD_WASM)
    set_target_properties(trae_geo PROPERTIES
        SUFFIX ".wasm"
        LINK_FLAGS "-s EXPORT_ALL=1 -s EXPORTED_FUNCTIONS=['_trae_geo_version','_trae_geo_error_to_string','_trae_geo_set_epsilon','_trae_geo_get_epsilon'] -s ALLOW_MEMORY_GROWTH=1"
    )
endif()

if(WIN32)
    target_compile_definitions(trae_geo PRIVATE TRAE_GEO_CPP_EXPORTS)
else()
    target_compile_options(trae_geo PRIVATE -fvisibility=hidden)
endif()

install(TARGETS trae_geo trae_geo_cpp
    EXPORT trae_geoTargets
    LIBRARY DESTINATION ${CMAKE_INSTALL_LIBDIR}
    ARCHIVE DESTINATION ${CMAKE_INSTALL_LIBDIR}
    RUNTIME DESTINATION ${CMAKE_INSTALL_BINDIR}
)

install(FILES ${TRAE_GEO_C_API_HEADERS} DESTINATION ${CMAKE_INSTALL_INCLUDEDIR})

install(DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}/cpp/include/trae_geo_cpp
    DESTINATION ${CMAKE_INSTALL_INCLUDEDIR}
    FILES_MATCHING PATTERN "*.h"
)

if(BUILD_EXAMPLES)
    add_subdirectory(examples/c)
endif()

include(CMakePackageConfigHelpers)
write_basic_package_version_file(
    ${CMAKE_CURRENT_BINARY_DIR}/trae_geoConfigVersion.cmake
    VERSION ${PROJECT_VERSION}
    COMPATIBILITY SameMajorVersion
)

configure_package_config_file(
    ${CMAKE_CURRENT_SOURCE_DIR}/cmake/trae_geoConfig.cmake.in
    ${CMAKE_CURRENT_BINARY_DIR}/trae_geoConfig.cmake
    INSTALL_DESTINATION ${CMAKE_INSTALL_LIBDIR}/cmake/trae_geo
)

install(EXPORT trae_geoTargets
    FILE trae_geoTargets.cmake
    NAMESPACE trae_geo::
    DESTINATION ${CMAKE_INSTALL_LIBDIR}/cmake/trae_geo
)

install(FILES
    ${CMAKE_CURRENT_BINARY_DIR}/trae_geoConfig.cmake
    ${CMAKE_CURRENT_BINARY_DIR}/trae_geoConfigVersion.cmake
    DESTINATION ${CMAKE_INSTALL_LIBDIR}/cmake/trae_geo
)