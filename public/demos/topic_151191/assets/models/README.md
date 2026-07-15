# Real Space Model Assets

This folder contains the GLB furniture assets used by the "today processing" real-home renderer.
The paths are declared in `REAL_SPACE_ASSETS` in `app.js`.

Current renderer behavior:
- If a GLTF/GLB loader is registered as `window.realSpaceGLTFLoader`, matching assets are loaded from this folder.
- The app also auto-registers `new THREE.GLTFLoader()` when `THREE.GLTFLoader` exists.
- If assets or the loader are missing, the scene uses the procedural PBR fallback furniture so the app remains usable.

Loader setup:
- Add `vendor/GLTFLoader-r124.js` from the official three.js `r124/examples/js/loaders/GLTFLoader.js`.
- The app will try to load this file dynamically. You can also include it in `index.html` immediately after `vendor/three-0.124.0.min.js` and before `app.js`.

Expected scale:
- Models should be authored in meters or normalized cleanly; the renderer fits them into the real millimeter-derived bounding boxes declared in `REAL_SPACE_ASSETS`.
- Keep pivots centered on the object footprint and the lowest point at floor level when possible.

Generated low-poly first-pass asset files:
- `living/sofa_2200x900.glb`
- `living/coffee_table_1200x600.glb`
- `living/floating_tv_cabinet_2000x350.glb`
- `living/side_table_500x500.glb`
- `entry/shoe_cabinet_1200x350.glb`
- `entry/shoe_bench_820x380.glb`
- `entry/full_height_mirror.glb`
- `study/desk_1400x700.glb`
- `study/bookcase_2000x350.glb`
- `study/lounge_chair_800x800.glb`
- `bedroom/bed_1800x2000.glb`
- `bedroom/nightstand_500x400.glb`
- `bedroom/wardrobe_2400x600.glb`
- `bedroom/vanity_1000x500.glb`
- `bath/vanity_800x500.glb`
- `bath/toilet_400x700.glb`
- `bath/shower_900x1200.glb`

Maintenance:
- Run `python scripts/generate_lowpoly_glb_assets.py` from the repo root to regenerate the built-in low-poly GLB set.
- Run `python scripts/validate_glb_assets.py` to verify that every required GLB exists and is a valid glTF 2.0 binary.

If these files or the GLTF loader are missing, the app intentionally falls back to procedural furniture. That fallback is useful for layout and interaction validation, but it cannot deliver final furniture quality.
