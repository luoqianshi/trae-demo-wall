/// <reference types="vite/client" />
/// <reference types="node" />

// Ambient declarations for the renderer:
// - vite/client provides `import.meta.env` and side-effect module declarations
//   for asset imports (e.g. `import './styles/globals.css'`).
// - node provides the Node globals (`process`, `crypto`) that shared modules and
//   Vite's `define`-injected `process.env.NODE_ENV` rely on.
