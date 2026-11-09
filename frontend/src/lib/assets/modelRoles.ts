/**
 * PlateWise AI — 3D Model Role Mapping Registry
 *
 * This is the SINGLE EDITABLE CONFIGURATION FILE mapping semantic app roles
 * to Kenney Food Kit GLB models (located in /public/models) and procedural fallbacks.
 *
 * Model IDs correspond directly to entries in /public/models/{id}.glb and MODEL_REGISTRY.
 */

export interface ModelRoleDefinition {
  primaryModelId: string;
  alternateModelIds: string[];
  displayName: string;
  category: "hero" | "prop" | "dish" | "plate" | "foliage" | "loader";
  defaultScale: number;
  proceduralFallback: {
    shape: "cylinder" | "sphere" | "box" | "torus" | "cone" | "tree";
    color: string;
    secondaryColor?: string;
    dimensions: [number, number, number];
  };
}

/**
 * Semantic role mapping across PlateWise screens and hero moments
 */
export const MODEL_ROLES = {
  // 1. Splash / Boot Screen Oven Hero
  ovenHero: {
    primaryModelId: "loaf-round",
    alternateModelIds: ["bread", "loaf", "croissant"],
    displayName: "Artisanal Sourdough Loaf",
    category: "hero",
    defaultScale: 1.1,
    proceduralFallback: {
      shape: "sphere",
      color: "#f7eedb",
      secondaryColor: "#853d0e",
      dimensions: [0.55, 0.4, 0.5],
    },
  },

  // 2. Route Transition Loader
  routeLoader: {
    primaryModelId: "croissant",
    alternateModelIds: ["apple", "donut", "cookie", "cup-coffee"],
    displayName: "Golden Croissant Loader",
    category: "loader",
    defaultScale: 0.9,
    proceduralFallback: {
      shape: "torus",
      color: "#e8a33d",
      secondaryColor: "#c9831f",
      dimensions: [0.35, 0.12, 16],
    },
  },

  // 3. Today's Plan Servings Tray
  trayPlate: {
    primaryModelId: "plate-dinner",
    alternateModelIds: ["plate", "plate-deep", "plate-rectangle"],
    displayName: "Mess Service Plate",
    category: "plate",
    defaultScale: 1.0,
    proceduralFallback: {
      shape: "cylinder",
      color: "#fdfbf7",
      secondaryColor: "#e3ded0",
      dimensions: [0.5, 0.42, 0.05],
    },
  },

  trayBowl: {
    primaryModelId: "bowl-soup",
    alternateModelIds: ["bowl", "bowl-cereal", "bowl-broth"],
    displayName: "Katori Dal Bowl",
    category: "dish",
    defaultScale: 0.8,
    proceduralFallback: {
      shape: "cylinder",
      color: "#fde68a",
      secondaryColor: "#d97706",
      dimensions: [0.25, 0.18, 0.12],
    },
  },

  // 4. Dashboard Floating Kitchen Scene Props
  dashboardKitchenProps: {
    primaryModelId: "loaf-round",
    alternateModelIds: ["bowl-soup", "apple", "cup-tea", "croissant", "salad"],
    displayName: "Floating Prep Elements",
    category: "prop",
    defaultScale: 0.75,
    proceduralFallback: {
      shape: "sphere",
      color: "#3e9b66",
      dimensions: [0.3, 0.3, 0.3],
    },
  },

  // 5. Plate Studio Dish Mappings (Food Catalog -> 3D GLB or procedural fallback)
  dishCatalogOverrides: {
    roti: {
      modelId: "pancakes",
      displayName: "Tandoori Roti / Chapati",
      proceduralFallback: {
        shape: "cylinder",
        color: "#d4a373",
        dimensions: [0.42, 0.42, 0.03],
      },
    },
    "jeera-rice": {
      modelId: "rice-ball",
      displayName: "Jeera Basmati Rice",
      proceduralFallback: {
        shape: "sphere",
        color: "#fefae0",
        dimensions: [0.35, 0.22, 0.35],
      },
    },
    "dal-tadka": {
      modelId: "bowl-soup",
      displayName: "Yellow Dal Tadka",
      proceduralFallback: {
        shape: "cylinder",
        color: "#f59e0b",
        dimensions: [0.26, 0.2, 0.12],
      },
    },
    "paneer-butter-masala": {
      modelId: "bowl-broth",
      displayName: "Paneer Butter Masala",
      proceduralFallback: {
        shape: "cylinder",
        color: "#ea580c",
        dimensions: [0.26, 0.2, 0.12],
      },
    },
    rajma: {
      modelId: "bowl-broth",
      displayName: "Punjabi Rajma Gravy",
      proceduralFallback: {
        shape: "cylinder",
        color: "#991b1b",
        dimensions: [0.26, 0.2, 0.12],
      },
    },
    "chole-bhature": {
      modelId: "bread",
      displayName: "Chole & Bhatura",
      proceduralFallback: {
        shape: "sphere",
        color: "#eab308",
        dimensions: [0.38, 0.25, 0.35],
      },
    },
    poha: {
      modelId: "bowl",
      displayName: "Kanda Poha",
      proceduralFallback: {
        shape: "cylinder",
        color: "#facc15",
        dimensions: [0.28, 0.22, 0.1],
      },
    },
    "idli-sambar": {
      modelId: "bowl-soup",
      displayName: "Steamed Idli Sambar",
      proceduralFallback: {
        shape: "cylinder",
        color: "#e2e8f0",
        dimensions: [0.3, 0.25, 0.1],
      },
    },
    "veg-biryani": {
      modelId: "pan-stew",
      displayName: "Hyderabadi Veg Biryani",
      proceduralFallback: {
        shape: "cylinder",
        color: "#d97706",
        dimensions: [0.32, 0.25, 0.12],
      },
    },
    "aloo-gobi": {
      modelId: "bowl-broth",
      displayName: "Aloo Gobi Adraki",
      proceduralFallback: {
        shape: "sphere",
        color: "#ca8a04",
        dimensions: [0.28, 0.2, 0.28],
      },
    },
    "kadhi-pakora": {
      modelId: "bowl-soup",
      displayName: "Punjabi Kadhi Pakora",
      proceduralFallback: {
        shape: "cylinder",
        color: "#facc15",
        dimensions: [0.26, 0.2, 0.12],
      },
    },
    curd: {
      modelId: "cup",
      displayName: "Fresh Dahi Curd",
      proceduralFallback: {
        shape: "cylinder",
        color: "#ffffff",
        dimensions: [0.22, 0.18, 0.14],
      },
    },
    "gulab-jamun": {
      modelId: "donut",
      displayName: "Gulab Jamun",
      proceduralFallback: {
        shape: "sphere",
        color: "#78350f",
        dimensions: [0.18, 0.18, 0.18],
      },
    },
    tea: {
      modelId: "cup-tea",
      displayName: "Masala Chai",
      proceduralFallback: {
        shape: "cylinder",
        color: "#78350f",
        dimensions: [0.18, 0.14, 0.2],
      },
    },
    salad: {
      modelId: "salad",
      displayName: "Kachumber Green Salad",
      proceduralFallback: {
        shape: "cylinder",
        color: "#22c55e",
        dimensions: [0.3, 0.24, 0.1],
      },
    },
    "mixed-veg": {
      modelId: "skewer-vegetables",
      displayName: "Seasonal Mixed Veg",
      proceduralFallback: {
        shape: "box",
        color: "#16a34a",
        dimensions: [0.3, 0.15, 0.3],
      },
    },
    apple: {
      modelId: "apple",
      displayName: "Fresh Apple",
      proceduralFallback: {
        shape: "sphere",
        color: "#dc2626",
        dimensions: [0.2, 0.2, 0.2],
      },
    },
    banana: {
      modelId: "banana",
      displayName: "Ripe Banana",
      proceduralFallback: {
        shape: "cylinder",
        color: "#facc15",
        dimensions: [0.08, 0.08, 0.4],
      },
    },
  } as Record<
    string,
    {
      modelId: string;
      displayName: string;
      proceduralFallback: {
        shape: "cylinder" | "sphere" | "box" | "torus" | "cone";
        color: string;
        dimensions: [number, number, number];
      };
    }
  >,

  // 6. Impact Forest Foliage
  impactForest: {
    treeVariants: [
      { trunkColor: "#5c4033", canopyColor: "#2d6a4f", shape: "cone" as const },
      { trunkColor: "#4a3525", canopyColor: "#1b4332", shape: "cone" as const },
      { trunkColor: "#6b4f3b", canopyColor: "#40916c", shape: "sphere" as const },
      { trunkColor: "#523a28", canopyColor: "#52b788", shape: "sphere" as const },
    ],
  },
} as const;

/**
 * Resolves a model ID for any given food/dish string.
 * Checks direct catalog override first, then keyword fuzzy matching,
 * and falls back safely to a default food model or procedural shape.
 */
export function resolveFoodModelId(foodOrDishId: string): string {
  const norm = foodOrDishId.toLowerCase().replace(/_/g, "-");

  // Direct override lookup
  const override = MODEL_ROLES.dishCatalogOverrides[norm];
  if (override) return override.modelId;

  // Keyword match
  if (norm.includes("roti") || norm.includes("bread") || norm.includes("naan") || norm.includes("paratha")) {
    return "bread";
  }
  if (norm.includes("rice") || norm.includes("biryani") || norm.includes("poha")) {
    return "rice-ball";
  }
  if (norm.includes("dal") || norm.includes("sambar") || norm.includes("soup") || norm.includes("kadhi")) {
    return "bowl-soup";
  }
  if (norm.includes("tea") || norm.includes("chai") || norm.includes("coffee")) {
    return "cup-tea";
  }
  if (norm.includes("salad") || norm.includes("veg")) {
    return "salad";
  }
  if (norm.includes("sweet") || norm.includes("jamun") || norm.includes("halwa") || norm.includes("dessert")) {
    return "donut";
  }
  if (norm.includes("curd") || norm.includes("raita") || norm.includes("dahi")) {
    return "bowl";
  }
  if (norm.includes("paneer") || norm.includes("curry") || norm.includes("masala") || norm.includes("chole") || norm.includes("rajma")) {
    return "bowl-broth";
  }
  if (norm.includes("egg")) {
    return "egg-cooked";
  }
  if (norm.includes("fruit") || norm.includes("apple")) {
    return "apple";
  }

  // Generic fallback
  return "bowl";
}

/**
 * Returns procedural fallback geometry configuration when a GLB is missing or disabled.
 */
export function getProceduralFallback(id: string) {
  const norm = id.toLowerCase().replace(/_/g, "-");
  const override = MODEL_ROLES.dishCatalogOverrides[norm];
  if (override) {
    return override.proceduralFallback;
  }
  return {
    shape: "cylinder" as const,
    color: "#f59e0b",
    dimensions: [0.3, 0.2, 0.1] as [number, number, number],
  };
}
