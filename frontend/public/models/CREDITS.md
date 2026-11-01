# 3D Model Credits & Attribution

The 3D food and kitchen models utilized in PlateWise AI are licensed under **Creative Commons 0 (CC0 1.0 Universal - Public Domain Dedication)**.

## Kenney Food Kit
- **Creator**: Kenney ([kenney.nl](https://kenney.nl))
- **Asset Pack**: [Food Kit](https://kenney.nl/assets/food-kit)
- **License**: [Creative Commons Zero (CC0)](https://creativecommons.org/publicdomain/zero/1.0/) - Free for personal, commercial, and educational use. No attribution required, though warmly provided.
- **Description**: A comprehensive low-poly 3D food collection including prepared dishes, bakery items, fresh produce, beverages, kitchen cookware, and dining plates.

## Processing & Optimization
All raw models were processed via the PlateWise optimization pipeline (`scripts/optimize-models.mjs`) using:
- **glTF-Transform** (@gltf-transform/core, extensions, functions) for graph deduplication, pruning, and WebP texture embedding (1024px limit).
- **Meshoptimizer** (Meshopt) vertex and index compression for near-instant rendering on mobile and desktop web browsers.
