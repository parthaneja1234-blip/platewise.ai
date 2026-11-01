import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { dedup, prune, textureCompress, reorder, meshopt } from "@gltf-transform/functions";
import { MeshoptEncoder, MeshoptDecoder } from "meshoptimizer";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDir = path.resolve(__dirname, "..");
const srcDir = path.join(frontendDir, "assets-src", "models", "GLB format");
const outDir = path.join(frontendDir, "public", "models");
const registryOutPath = path.join(frontendDir, "src", "lib", "assets", "modelRegistry.ts");
const creditsOutPath = path.join(outDir, "CREDITS.md");

/**
 * Converts strings like "rollingPin" or "meat-raw" into clean kebab-case "rolling-pin" / "meat-raw".
 */
function toKebabCase(str) {
  return str
    .replace(/\.glb$/i, "")
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[_\s]+/g, "-")
    .toLowerCase();
}

/**
 * Converts a kebab-case identifier into a polished human-readable display name.
 */
function toDisplayName(id) {
  const overrides = {
    "advocado-half": "Avocado (Half)",
    "apple-half": "Apple (Half)",
    "bottle-musterd": "Mustard Bottle",
    "bottle-ketchup": "Ketchup Bottle",
    "bottle-oil": "Cooking Oil Bottle",
    "bowl-broth": "Broth Bowl",
    "bowl-cereal": "Cereal Bowl",
    "bowl-soup": "Soup Bowl",
    "cake-birthday": "Birthday Cake",
    "can-open": "Opened Can",
    "can-small": "Small Can",
    "candy-bar-wrapper": "Candy Bar (Wrapped)",
    "candy-bar": "Candy Bar",
    "chocolate-wrapper": "Chocolate Bar (Wrapped)",
    "chopstic-decorative": "Decorative Chopsticks",
    "coconut-half": "Coconut (Half)",
    "cookie-chocolate": "Chocolate Cookie",
    "cooking-knife-chopping": "Chopping Knife",
    "corn-dog": "Corn Dog",
    "cup-coffee": "Coffee Cup",
    "cup-saucer": "Cup & Saucer",
    "cup-tea": "Tea Cup",
    "cutting-board-japanese": "Japanese Cutting Board",
    "cutting-board-round": "Round Cutting Board",
    "donut-chocolate": "Chocolate Donut",
    "donut-sprinkles": "Sprinkled Donut",
    "egg-cooked": "Boiled Egg",
    "egg-cup": "Egg Cup",
    "egg-half": "Egg (Half)",
    "fish-bones": "Fish Skeleton",
    "fries-empty": "Empty Fry Box",
    "frikandel-speciaal": "Frikandel Speciaal",
    "frying-pan-lid": "Frying Pan with Lid",
    "ginger-bread-cutter": "Gingerbread Cutter",
    "ginger-bread": "Gingerbread Man",
    "glass-wine": "Wine Glass",
    "hot-dog-raw": "Raw Hot Dog",
    "hot-dog": "Hot Dog",
    "ice-cream-cne": "Ice Cream Cone",
    "ice-cream-cup": "Ice Cream Cup",
    "ice-cream-scoop-chocolate": "Chocolate Ice Cream Scoop",
    "ice-cream-scoop-mint": "Mint Ice Cream Scoop",
    "knife-block": "Kitchen Knife Block",
    "lemon-half": "Lemon (Half)",
    "loaf-baguette": "French Baguette",
    "loaf-round": "Round Artisan Loaf",
    "loaf": "Bread Loaf",
    "maki-roe": "Maki Sushi (Roe)",
    "maki-salmon": "Maki Sushi (Salmon)",
    "maki-vegetable": "Maki Sushi (Vegetable)",
    "meat-cooked": "Cooked Steak",
    "meat-patty": "Burger Patty",
    "meat-raw": "Raw Meat Cut",
    "meat-ribs": "Rack of Ribs",
    "meat-sausage": "Cured Sausage Ring",
    "meat-tenderizer": "Meat Tenderizer Mallet",
    "mincemeat-pie": "Mincemeat Pie",
    "mortar-pestle": "Mortar & Pestle",
    "mushroom-half": "Mushroom (Half)",
    "mussel-open": "Open Mussel",
    "onion-half": "Onion (Half)",
    "pear-half": "Pear (Half)",
    "pepper-mill": "Wooden Pepper Mill",
    "pizza-box": "Pizza Delivery Box",
    "pizza-cutter": "Roller Pizza Cutter",
    "plate-broken": "Broken Ceramic Plate",
    "plate-deep": "Deep Dining Plate",
    "plate-dinner": "Dinner Plate",
    "plate-rectangle": "Rectangular Serving Platter",
    "plate-sauerkraut": "Sauerkraut Plate",
    "popsicle-chocolate": "Chocolate Popsicle",
    "popsicle-stick": "Used Popsicle Stick",
    "pot-lid": "Pot with Lid",
    "pot-stew-lid": "Stew Pot with Lid",
    "pot-stew": "Cast Iron Stew Pot",
    "pumpkin-basic": "Carved Pumpkin",
    "rice-ball": "Onigiri Rice Ball",
    "rolling-pin": "Wooden Rolling Pin",
    "sausage-half": "Sausage (Cut)",
    "shaker-pepper": "Pepper Shaker",
    "shaker-salt": "Salt Shaker",
    "skewer-vegetables": "Vegetable Skewer",
    "soda-bottle": "Glass Soda Bottle",
    "soda-can-crushed": "Crushed Soda Can",
    "soda-can": "Soda Can",
    "soda-glass": "Fountain Soda Glass",
    "styrofoam-dinner": "Styrofoam Dinner Clamshell",
    "styrofoam": "Styrofoam Takeout Box",
    "sub": "Submarine Sandwich",
    "sushi-egg": "Tamago Sushi",
    "sushi-salmon": "Salmon Nigiri Sushi",
    "tajine-lid": "Moroccan Tajine with Lid",
    "tajine": "Moroccan Tajine Pot",
    "tomato-slice": "Tomato Slice",
    "utensil-fork": "Dining Fork",
    "utensil-knife": "Table Knife",
    "utensil-spoon": "Dining Spoon",
    "wholer-ham": "Whole Roasted Ham",
    "whole-ham": "Glazed Holiday Ham",
    "wine-red": "Red Wine Bottle",
    "wine-white": "White Wine Bottle",
  };

  if (overrides[id]) return overrides[id];

  return id
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * Assigns one of: dish, bread, kitchen, drink, dessert, plate, other.
 */
function getCategory(id) {
  const name = id.toLowerCase();

  // Kitchen tools / cookware / cutlery
  if (
    /frying-pan|pot|pan|knife|fork|spoon|spatula|whisk|rolling-pin|mortar|tajine|steamer|pizza-cutter|pizza-box|barrel|cheese-slicer|cake-slicer|meat-tenderizer|pepper-mill|shaker|utensil|cooking|cutting-board/.test(
      name
    ) ||
    name === "chopstick" ||
    name.startsWith("chopstic") ||
    name === "ginger-bread-cutter"
  ) {
    return "kitchen";
  }

  // Plates and Bowls
  if (/^plate|^bowl/.test(name) && !name.includes("sauerkraut")) {
    return "plate";
  }

  // Drinks
  if (
    /soda|wine|cocktail|frappe|coffee|tea|cup|glass|mug/.test(name) &&
    !name.includes("cupcake") &&
    !name.includes("egg-cup")
  ) {
    return "drink";
  }

  // Bread
  if (/bread|loaf|baguette|croissant/.test(name) && !name.includes("ginger-bread")) {
    return "bread";
  }

  // Desserts & Sweets
  if (
    /cake|cookie|cupcake|donut|ice-cream|lollypop|pie|pudding|sundae|waffle|chocolate|candy-bar|whipped-cream|popsicle|ginger-bread/.test(
      name
    )
  ) {
    return "dessert";
  }

  // Prepared Meals / Dishes
  if (
    /burger|hot-dog|sandwich|sub|pizza|taco|sushi|maki|dim-sum|rice-ball|frikandel|corn-dog|skewer|pancakes|salad|chinese|turkey|plate-sauerkraut/.test(
      name
    ) ||
    name.includes("soup") ||
    name.includes("broth")
  ) {
    return "dish";
  }

  return "other";
}

async function main() {
  console.log("=== PlateWise AI 3D Model Optimization Pipeline ===");
  console.log(`Source dir: ${srcDir}`);
  console.log(`Target dir: ${outDir}`);

  if (!fs.existsSync(srcDir)) {
    throw new Error(`Source directory does not exist: ${srcDir}`);
  }

  fs.mkdirSync(outDir, { recursive: true });

  await MeshoptEncoder.ready;
  await MeshoptDecoder.ready;

  const io = new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({
      "meshopt.encoder": MeshoptEncoder,
      "meshopt.decoder": MeshoptDecoder,
    });

  const files = fs
    .readdirSync(srcDir)
    .filter((f) => f.endsWith(".glb"))
    .sort();

  console.log(`Found ${files.length} GLB models to process.\n`);

  const results = [];
  let totalBeforeBytes = 0;
  let totalAfterBytes = 0;
  let missingTextureCount = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const fullSrcPath = path.join(srcDir, file);
    const beforeStats = fs.statSync(fullSrcPath);
    totalBeforeBytes += beforeStats.size;

    const kebabId = toKebabCase(file);
    const displayName = toDisplayName(kebabId);
    const category = getCategory(kebabId);

    // Read model so relative textures resolve
    const doc = await io.read(fullSrcPath);

    // Calculate triangle count
    let triangles = 0;
    for (const mesh of doc.getRoot().listMeshes()) {
      for (const prim of mesh.listPrimitives()) {
        const idx = prim.getIndices();
        if (idx) {
          triangles += idx.getCount() / 3;
        } else {
          const pos = prim.getAttribute("POSITION");
          if (pos) triangles += pos.getCount() / 3;
        }
      }
    }

    // Inspect & resolve textures
    const textures = doc.getRoot().listTextures();
    let modelHadMissingTexture = false;

    for (const tex of textures) {
      const uri = tex.getURI();
      if (uri) {
        const resolvedPath = path.resolve(srcDir, uri);
        if (!fs.existsSync(resolvedPath)) {
          console.warn(`[WARNING] Texture not found for ${file}: "${uri}"`);
          modelHadMissingTexture = true;
          missingTextureCount++;
        }
      }
      // Clear external URI so glTF-Transform embeds the texture buffer directly into GLB
      tex.setURI("");
    }

    // Run gltf-transform optimization pipeline:
    // 1. Deduplicate accessors/materials
    // 2. Prune unused nodes/textures/accessors
    // 3. Compress textures to WebP (max 1024x1024)
    // 4. Reorder mesh indices for vertex cache
    // 5. Apply meshopt compression
    await doc.transform(
      dedup(),
      prune(),
      textureCompress({
        encoder: sharp,
        targetFormat: "webp",
        resize: [1024, 1024],
      }),
      reorder({ encoder: MeshoptEncoder }),
      meshopt({ encoder: MeshoptEncoder, level: "medium" })
    );

    const outGlb = await io.writeBinary(doc);
    const outFileName = `${kebabId}.glb`;
    const fullOutPath = path.join(outDir, outFileName);

    fs.writeFileSync(fullOutPath, Buffer.from(outGlb));
    const afterBytes = outGlb.byteLength;
    totalAfterBytes += afterBytes;

    const ratio = (((beforeStats.size - afterBytes) / beforeStats.size) * 100).toFixed(1);

    results.push({
      id: kebabId,
      displayName,
      category,
      srcFile: file,
      outFile: outFileName,
      srcSizeKB: Number((beforeStats.size / 1024).toFixed(1)),
      sizeKB: Number((afterBytes / 1024).toFixed(1)),
      bytes: afterBytes,
      triangles: Math.round(triangles),
      hadMissingTexture: modelHadMissingTexture,
      ratio: Number(ratio),
    });

    if ((i + 1) % 25 === 0 || i + 1 === files.length) {
      console.log(`Processed ${i + 1}/${files.length} models...`);
    }
  }

  console.log("\n=== Optimization Complete ===");
  console.log(`Total Models: ${results.length}`);
  console.log(
    `Total Before Size: ${(totalBeforeBytes / 1024).toFixed(1)} KB (~${(
      totalBeforeBytes /
      1024 /
      1024
    ).toFixed(2)} MB)`
  );
  console.log(
    `Total After Size: ${(totalAfterBytes / 1024).toFixed(1)} KB (~${(
      totalAfterBytes /
      1024 /
      1024
    ).toFixed(2)} MB)`
  );
  console.log(
    `Overall Reduction: ${(
      ((totalBeforeBytes - totalAfterBytes) / totalBeforeBytes) *
      100
    ).toFixed(1)}%`
  );
  console.log(`Missing Textures Encountered: ${missingTextureCount}`);

  // Generate CREDITS.md if missing
  generateCreditsFile(creditsOutPath);

  // Generate modelRegistry.ts
  generateModelRegistry(results, registryOutPath);
}

function generateCreditsFile(filePath) {
  if (fs.existsSync(filePath)) {
    console.log(`CREDITS.md already exists at ${filePath}. Preserving existing content.`);
    return;
  }

  const content = `# 3D Model Credits & Attribution

The 3D food and kitchen models utilized in PlateWise AI are licensed under **Creative Commons 0 (CC0 1.0 Universal - Public Domain Dedication)**.

## Kenney Food Kit
- **Creator**: Kenney ([kenney.nl](https://kenney.nl))
- **Asset Pack**: [Food Kit](https://kenney.nl/assets/food-kit)
- **License**: [Creative Commons Zero (CC0)](https://creativecommons.org/publicdomain/zero/1.0/) - Free for personal, commercial, and educational use. No attribution required, though warmly provided.
- **Description**: A comprehensive low-poly 3D food collection including prepared dishes, bakery items, fresh produce, beverages, kitchen cookware, and dining plates.

## Processing & Optimization
All raw models were processed via the PlateWise optimization pipeline (\`scripts/optimize-models.mjs\`) using:
- **glTF-Transform** (@gltf-transform/core, extensions, functions) for graph deduplication, pruning, and WebP texture embedding (1024px limit).
- **Meshoptimizer** (Meshopt) vertex and index compression for near-instant rendering on mobile and desktop web browsers.
`;

  fs.writeFileSync(filePath, content, "utf8");
  console.log(`Created ${filePath}`);
}

function generateModelRegistry(models, filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  const modelsJson = models.map((m) => ({
    id: m.id,
    displayName: m.displayName,
    category: m.category,
    filePath: `/models/${m.outFile}`,
    sizeKB: m.sizeKB,
    triangles: m.triangles,
    defaultScale: [1, 1, 1],
    defaultPosition: [0, 0, 0],
    defaultRotation: [0, 0, 0],
  }));

  const tsContent = `// AUTO-GENERATED BY scripts/optimize-models.mjs - DO NOT EDIT MANUALLY
import * as THREE from "three";

export type ModelCategory =
  | "dish"
  | "bread"
  | "kitchen"
  | "drink"
  | "dessert"
  | "plate"
  | "other";

export interface ModelMetadata {
  id: string;
  displayName: string;
  category: ModelCategory;
  filePath: string;
  sizeKB: number;
  triangles: number;
  defaultScale: [number, number, number];
  defaultPosition: [number, number, number];
  defaultRotation: [number, number, number];
}

export const MODEL_CATEGORIES: { id: ModelCategory; label: string; icon?: string }[] = [
  { id: "dish", label: "Dishes & Meals" },
  { id: "bread", label: "Bakery & Breads" },
  { id: "dessert", label: "Desserts & Sweets" },
  { id: "drink", label: "Beverages & Drinks" },
  { id: "plate", label: "Plates & Bowls" },
  { id: "kitchen", label: "Kitchen Tools" },
  { id: "other", label: "Produce & Ingredients" },
];

export const MODEL_REGISTRY: ModelMetadata[] = ${JSON.stringify(modelsJson, null, 2)};

export const MODEL_REGISTRY_MAP: Record<string, ModelMetadata> = Object.fromEntries(
  MODEL_REGISTRY.map((m) => [m.id, m])
);

/**
 * Normalizes any loaded 3D model (Object3D / Group):
 * 1. Computes the bounding box of the geometry
 * 2. Scales the model uniformly to fit inside targetSize (default 1.0)
 * 3. Centers the model along X and Z axes, and optionally grounds it at Y = 0
 * 
 * @param object The Three.js Object3D or Group to normalize
 * @param targetSize Bounding box maximum dimension in world units (default: 1.0)
 * @param groundBase If true, aligns bottom of model bounding box with Y = 0 (ideal for plates/tables)
 */
export function normalizeModel(
  object: THREE.Object3D,
  targetSize = 1.0,
  groundBase = true
): { scale: number; center: THREE.Vector3; size: THREE.Vector3 } {
  // Update matrix world so bounding box calculation is accurate
  object.updateMatrixWorld(true);

  const box = new THREE.Box3().setFromObject(object);
  const size = new THREE.Vector3();
  box.getSize(size);
  const center = new THREE.Vector3();
  box.getCenter(center);

  const maxDimension = Math.max(size.x, size.y, size.z);
  const scale = maxDimension > 0 ? targetSize / maxDimension : 1.0;

  // Center geometry relative to object anchor
  object.position.x = -center.x * scale;
  if (groundBase) {
    object.position.y = -box.min.y * scale;
  } else {
    object.position.y = -center.y * scale;
  }
  object.position.z = -center.z * scale;

  object.scale.set(scale, scale, scale);

  return { scale, center, size };
}
`;

  fs.writeFileSync(filePath, tsContent, "utf8");
  console.log(`Generated typed registry with ${models.length} entries at ${filePath}`);
}

main().catch((err) => {
  console.error("Optimization failed:", err);
  process.exit(1);
});
