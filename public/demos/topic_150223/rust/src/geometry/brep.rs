use super::super::math::Vec3;
use super::curves::Curve;
use super::surfaces::Surface;
use bytemuck::{Pod, Zeroable};

pub type Handle = u64;

pub const INVALID_HANDLE: Handle = 0;

#[repr(C)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TopologyType {
    Vertex = 0,
    Edge = 1,
    Loop = 2,
    Face = 3,
    Shell = 4,
    Solid = 5,
    Compound = 6,
}

#[repr(C)]
#[derive(Debug, Clone, Copy, Pod, Zeroable)]
pub struct Vertex {
    pub handle: Handle,
    pub point: Vec3,
    pub tolerance: f64,
}

#[repr(C)]
#[derive(Debug, Clone, Copy, Pod, Zeroable)]
pub struct Edge {
    pub handle: Handle,
    pub curve: Curve,
    pub start_vertex: Handle,
    pub end_vertex: Handle,
    pub reversed: bool,
    pub tolerance: f64,
}

#[repr(C)]
#[derive(Debug, Clone, Copy)]
pub struct Loop {
    pub handle: Handle,
    pub face: Handle,
    pub edges: *const Handle,
    pub num_edges: u32,
    pub outer: bool,
}

#[repr(C)]
#[derive(Debug, Clone, Copy)]
pub struct Face {
    pub handle: Handle,
    pub surface: Surface,
    pub loops: *const Handle,
    pub num_loops: u32,
    pub outer_loop: Handle,
    pub orientation: i32,
    pub tolerance: f64,
}

#[repr(C)]
#[derive(Debug, Clone, Copy)]
pub struct Shell {
    pub handle: Handle,
    pub faces: *const Handle,
    pub num_faces: u32,
    pub orientation: i32,
}

#[repr(C)]
#[derive(Debug, Clone, Copy)]
pub struct Solid {
    pub handle: Handle,
    pub shells: *const Handle,
    pub num_shells: u32,
    pub outer_shell: Handle,
}

#[repr(C)]
#[derive(Debug, Clone, Copy)]
pub struct Compound {
    pub handle: Handle,
    pub children: *const Handle,
    pub num_children: u32,
}

#[repr(C)]
#[derive(Debug, Clone, Copy)]
pub union TopologyData {
    pub vertex: Vertex,
    pub edge: Edge,
    pub loop: Loop,
    pub face: Face,
    pub shell: Shell,
    pub solid: Solid,
    pub compound: Compound,
}

#[repr(C)]
#[derive(Debug, Clone, Copy)]
pub struct Topology {
    pub topology_type: TopologyType,
    pub data: TopologyData,
}

#[repr(C)]
#[derive(Debug, Clone, Copy, Pod, Zeroable)]
pub struct BoundingBox {
    pub min: Vec3,
    pub max: Vec3,
}

impl BoundingBox {
    pub fn new() -> BoundingBox {
        BoundingBox {
            min: Vec3 { x: f64::INFINITY, y: f64::INFINITY, z: f64::INFINITY },
            max: Vec3 { x: f64::NEG_INFINITY, y: f64::NEG_INFINITY, z: f64::NEG_INFINITY },
        }
    }

    pub fn from_points(points: &[Vec3]) -> BoundingBox {
        let mut bb = BoundingBox::new();
        for &p in points {
            bb.min = bb.min.min(p);
            bb.max = bb.max.max(p);
        }
        bb
    }

    pub fn is_empty(self) -> bool {
        self.min.x.is_infinite() || self.max.x.is_infinite()
    }

    pub fn center(self) -> Vec3 {
        (self.min + self.max) * 0.5
    }

    pub fn size(self) -> Vec3 {
        self.max - self.min
    }

    pub fn volume(self) -> f64 {
        let s = self.size();
        s.x * s.y * s.z
    }

    pub fn union(self, other: BoundingBox) -> BoundingBox {
        BoundingBox {
            min: self.min.min(other.min),
            max: self.max.max(other.max),
        }
    }

    pub fn intersects(self, other: BoundingBox) -> bool {
        self.min.x <= other.max.x && self.max.x >= other.min.x
            && self.min.y <= other.max.y && self.max.y >= other.min.y
            && self.min.z <= other.max.z && self.max.z >= other.min.z
    }

    pub fn contains_point(self, p: Vec3) -> bool {
        p.x >= self.min.x && p.x <= self.max.x
            && p.y >= self.min.y && p.y <= self.max.y
            && p.z >= self.min.z && p.z <= self.max.z
    }
}

pub struct BrepModel {
    vertices: std::collections::HashMap<Handle, Vertex>,
    edges: std::collections::HashMap<Handle, Edge>,
    loops: std::collections::HashMap<Handle, Loop>,
    faces: std::collections::HashMap<Handle, Face>,
    shells: std::collections::HashMap<Handle, Shell>,
    solids: std::collections::HashMap<Handle, Solid>,
    compounds: std::collections::HashMap<Handle, Compound>,
    next_handle: Handle,
    bounding_box: BoundingBox,
}

impl BrepModel {
    pub fn new() -> BrepModel {
        BrepModel {
            vertices: std::collections::HashMap::new(),
            edges: std::collections::HashMap::new(),
            loops: std::collections::HashMap::new(),
            faces: std::collections::HashMap::new(),
            shells: std::collections::HashMap::new(),
            solids: std::collections::HashMap::new(),
            compounds: std::collections::HashMap::new(),
            next_handle: 1,
            bounding_box: BoundingBox::new(),
        }
    }

    fn allocate_handle(&mut self) -> Handle {
        let handle = self.next_handle;
        self.next_handle += 1;
        handle
    }

    pub fn add_vertex(&mut self, point: Vec3, tolerance: f64) -> Handle {
        let handle = self.allocate_handle();
        let vertex = Vertex { handle, point, tolerance };
        self.vertices.insert(handle, vertex);
        self.bounding_box = self.bounding_box.union(BoundingBox::from_points(&[point]));
        handle
    }

    pub fn add_edge(&mut self, curve: Curve, start_vertex: Handle, end_vertex: Handle, reversed: bool, tolerance: f64) -> Handle {
        let handle = self.allocate_handle();
        let edge = Edge { handle, curve, start_vertex, end_vertex, reversed, tolerance };
        self.edges.insert(handle, edge);
        handle
    }

    pub fn add_loop(&mut self, face: Handle, edges: &[Handle], outer: bool) -> Handle {
        let handle = self.allocate_handle();
        let edge_array = edges.to_vec();
        let loop_data = Loop {
            handle,
            face,
            edges: edge_array.as_ptr(),
            num_edges: edge_array.len() as u32,
            outer,
        };
        self.loops.insert(handle, loop_data);
        handle
    }

    pub fn add_face(&mut self, surface: Surface, loops: &[Handle], outer_loop: Handle, orientation: i32, tolerance: f64) -> Handle {
        let handle = self.allocate_handle();
        let loop_array = loops.to_vec();
        let face_data = Face {
            handle,
            surface,
            loops: loop_array.as_ptr(),
            num_loops: loop_array.len() as u32,
            outer_loop,
            orientation,
            tolerance,
        };
        self.faces.insert(handle, face_data);
        handle
    }

    pub fn add_shell(&mut self, faces: &[Handle], orientation: i32) -> Handle {
        let handle = self.allocate_handle();
        let face_array = faces.to_vec();
        let shell_data = Shell {
            handle,
            faces: face_array.as_ptr(),
            num_faces: face_array.len() as u32,
            orientation,
        };
        self.shells.insert(handle, shell_data);
        handle
    }

    pub fn add_solid(&mut self, shells: &[Handle], outer_shell: Handle) -> Handle {
        let handle = self.allocate_handle();
        let shell_array = shells.to_vec();
        let solid_data = Solid {
            handle,
            shells: shell_array.as_ptr(),
            num_shells: shell_array.len() as u32,
            outer_shell,
        };
        self.solids.insert(handle, solid_data);
        handle
    }

    pub fn add_compound(&mut self, children: &[Handle]) -> Handle {
        let handle = self.allocate_handle();
        let child_array = children.to_vec();
        let compound_data = Compound {
            handle,
            children: child_array.as_ptr(),
            num_children: child_array.len() as u32,
        };
        self.compounds.insert(handle, compound_data);
        handle
    }

    pub fn get_vertex(&self, handle: Handle) -> Option<&Vertex> {
        self.vertices.get(&handle)
    }

    pub fn get_edge(&self, handle: Handle) -> Option<&Edge> {
        self.edges.get(&handle)
    }

    pub fn get_loop(&self, handle: Handle) -> Option<&Loop> {
        self.loops.get(&handle)
    }

    pub fn get_face(&self, handle: Handle) -> Option<&Face> {
        self.faces.get(&handle)
    }

    pub fn get_shell(&self, handle: Handle) -> Option<&Shell> {
        self.shells.get(&handle)
    }

    pub fn get_solid(&self, handle: Handle) -> Option<&Solid> {
        self.solids.get(&handle)
    }

    pub fn get_compound(&self, handle: Handle) -> Option<&Compound> {
        self.compounds.get(&handle)
    }

    pub fn bounding_box(&self) -> BoundingBox {
        self.bounding_box
    }

    pub fn num_vertices(&self) -> usize {
        self.vertices.len()
    }

    pub fn num_edges(&self) -> usize {
        self.edges.len()
    }

    pub fn num_faces(&self) -> usize {
        self.faces.len()
    }

    pub fn num_solids(&self) -> usize {
        self.solids.len()
    }
}