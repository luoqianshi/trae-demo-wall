use trae_geo::math::{Vec3, Mat4};
use trae_geo::geometry::{BrepModel, Vertex, Edge, Face, Surface, Curve};
use trae_geo::operations::{Boolean, Intersection};
use trae_geo::mesh::MeshGenerator;
use trae_geo::utils::{precision, error::TraeGeoError};

fn main() {
    println!("TraeGeo Rust API Demo");
    println!("=====================\n");

    let mut model = BrepModel::new();

    let v1 = model.add_vertex(Vec3::new(0.0, 0.0, 0.0), 1e-6);
    let v2 = model.add_vertex(Vec3::new(1.0, 0.0, 0.0), 1e-6);
    let v3 = model.add_vertex(Vec3::new(1.0, 1.0, 0.0), 1e-6);
    let v4 = model.add_vertex(Vec3::new(0.0, 1.0, 0.0), 1e-6);
    let v5 = model.add_vertex(Vec3::new(0.0, 0.0, 1.0), 1e-6);
    let v6 = model.add_vertex(Vec3::new(1.0, 0.0, 1.0), 1e-6);
    let v7 = model.add_vertex(Vec3::new(1.0, 1.0, 1.0), 1e-6);
    let v8 = model.add_vertex(Vec3::new(0.0, 1.0, 1.0), 1e-6);

    println!("Created 8 vertices");

    let edge1 = model.add_edge(Curve::Line(Vec3::new(0.0, 0.0, 0.0), Vec3::new(1.0, 0.0, 0.0)), v1, v2, false, 1e-6);
    let edge2 = model.add_edge(Curve::Line(Vec3::new(1.0, 0.0, 0.0), Vec3::new(1.0, 1.0, 0.0)), v2, v3, false, 1e-6);
    let edge3 = model.add_edge(Curve::Line(Vec3::new(1.0, 1.0, 0.0), Vec3::new(0.0, 1.0, 0.0)), v3, v4, false, 1e-6);
    let edge4 = model.add_edge(Curve::Line(Vec3::new(0.0, 1.0, 0.0), Vec3::new(0.0, 0.0, 0.0)), v4, v1, false, 1e-6);

    println!("Created base edges");

    let plane = Surface::Plane(Vec3::new(0.0, 0.0, 0.0), Vec3::new(0.0, 0.0, 1.0), Vec3::new(1.0, 0.0, 0.0), Vec3::new(0.0, 1.0, 0.0));
    let loop1 = model.add_loop(0, &[edge1, edge2, edge3, edge4], true);
    let face1 = model.add_face(plane, &[loop1], loop1, 1, 1e-6);

    println!("Created face: handle={}", face1);

    let bbox = model.bounding_box();
    println!("Bounding box:");
    println!("  min: ({:.3}, {:.3}, {:.3})", bbox.min.x, bbox.min.y, bbox.min.z);
    println!("  max: ({:.3}, {:.3}, {:.3})", bbox.max.x, bbox.max.y, bbox.max.z);

    let point_a = Vec3::new(0.0, 0.0, 0.0);
    let point_b = Vec3::new(1.0, 0.0, 0.0);
    let dist = point_a.distance(point_b);
    println!("Distance between A and B: {:.3}", dist);

    let dot = point_a.dot(point_b);
    println!("Dot product: {}", dot);

    let cross = Vec3::new(1.0, 0.0, 0.0).cross(Vec3::new(0.0, 1.0, 0.0));
    println!("Cross product (i x j): ({}, {}, {})", cross.x, cross.y, cross.z);

    let mat = Mat4::translate(Vec3::new(2.0, 3.0, 4.0));
    let transformed = mat.transform_point(Vec3::new(1.0, 0.0, 0.0));
    println!("Transformed point: ({:.3}, {:.3}, {:.3})", transformed.x, transformed.y, transformed.z);

    precision::set_epsilon(1e-8);
    precision::set_tolerance(1e-6);
    println!("Precision settings: epsilon={}, tolerance={}", precision::epsilon(), precision::tolerance());

    println!("\nDemo completed successfully!");
}