import type { OutfitRecommendation, WardrobeItem, WardrobeItemAttributes, WardrobeFieldConfidence } from "@/types/wardrobe";
import type { WardrobeRepository } from "./local-repository";

type DemoItemDefinition = {
  key: string;
  filename: string;
  attributes: WardrobeItemAttributes;
};

type DemoOutfitDefinition = {
  key: string;
  title: string;
  scenario: OutfitRecommendation["scenario"];
  reason: string;
  itemKeys: string[];
};

const demoFieldConfidence: WardrobeFieldConfidence = {
  category: "high",
  primaryColor: "high",
  secondaryColor: "medium",
  material: "high",
  seasons: "medium",
  scenarios: "medium",
  formality: "medium",
  styles: "high",
  warmth: "medium"
};

const demoItems: DemoItemDefinition[] = [
  {
    key: "business-shirt-blue",
    filename: "sample-top-blue.png",
    attributes: {
      category: "top",
      primaryColor: "蓝色",
      secondaryColor: "白色",
      material: "牛津纺",
      seasons: ["spring", "autumn", "multi"],
      scenarios: ["commute", "formal"],
      formality: "semi_formal",
      styles: ["business", "minimal"],
      warmth: "medium"
    }
  },
  {
    key: "business-trousers-charcoal",
    filename: "sample-business-trousers-charcoal.png",
    attributes: {
      category: "pants",
      primaryColor: "炭灰色",
      secondaryColor: "黑色",
      material: "羊毛混纺",
      seasons: ["spring", "autumn", "winter"],
      scenarios: ["commute", "formal"],
      formality: "semi_formal",
      styles: ["business"],
      warmth: "medium"
    }
  },
  {
    key: "business-derby-brown",
    filename: "sample-shoes-brown.png",
    attributes: {
      category: "shoes",
      primaryColor: "棕色",
      secondaryColor: "黑色",
      material: "皮革",
      seasons: ["spring", "autumn", "winter", "multi"],
      scenarios: ["commute", "date", "formal"],
      formality: "semi_formal",
      styles: ["business", "retro"],
      warmth: "medium"
    }
  },
  {
    key: "business-coat-navy",
    filename: "sample-outerwear-navy.png",
    attributes: {
      category: "outerwear",
      primaryColor: "藏青色",
      secondaryColor: "黑色",
      material: "羊毛",
      seasons: ["autumn", "winter"],
      scenarios: ["commute", "formal"],
      formality: "semi_formal",
      styles: ["business", "minimal"],
      warmth: "heavy"
    }
  },
  {
    key: "street-hoodie-black",
    filename: "sample-street-hoodie-black.png",
    attributes: {
      category: "top",
      primaryColor: "黑色",
      secondaryColor: "灰色",
      material: "棉抓绒",
      seasons: ["spring", "autumn", "winter"],
      scenarios: ["casual"],
      formality: "casual",
      styles: ["street"],
      warmth: "medium"
    }
  },
  {
    key: "street-cargo-olive",
    filename: "sample-street-cargo-olive.png",
    attributes: {
      category: "pants",
      primaryColor: "橄榄绿",
      secondaryColor: "卡其色",
      material: "帆布",
      seasons: ["spring", "autumn", "multi"],
      scenarios: ["casual", "outdoor"],
      formality: "casual",
      styles: ["street", "outdoor"],
      warmth: "medium"
    }
  },
  {
    key: "street-sneakers-black",
    filename: "sample-street-sneakers-black.png",
    attributes: {
      category: "shoes",
      primaryColor: "黑色",
      secondaryColor: "白色",
      material: "皮革拼接",
      seasons: ["spring", "summer", "autumn", "multi"],
      scenarios: ["casual"],
      formality: "casual",
      styles: ["street", "sport"],
      warmth: "light"
    }
  },
  {
    key: "street-cap-black",
    filename: "sample-street-cap-black.png",
    attributes: {
      category: "hat",
      primaryColor: "黑色",
      secondaryColor: "白色",
      material: "棉斜纹",
      seasons: ["spring", "summer", "autumn", "multi"],
      scenarios: ["casual", "outdoor"],
      formality: "casual",
      styles: ["street", "sport"],
      warmth: "light"
    }
  },
  {
    key: "outdoor-shell-green",
    filename: "sample-outdoor-shell-green.png",
    attributes: {
      category: "outerwear",
      primaryColor: "松绿色",
      secondaryColor: "黑色",
      material: "防泼水尼龙",
      seasons: ["spring", "autumn"],
      scenarios: ["outdoor", "casual"],
      formality: "casual",
      styles: ["outdoor"],
      warmth: "medium"
    }
  },
  {
    key: "outdoor-tee-sand",
    filename: "sample-top-white.png",
    attributes: {
      category: "top",
      primaryColor: "沙色",
      secondaryColor: "米色",
      material: "速干棉混纺",
      seasons: ["spring", "summer", "autumn", "multi"],
      scenarios: ["outdoor", "casual"],
      formality: "casual",
      styles: ["outdoor", "minimal"],
      warmth: "light"
    }
  },
  {
    key: "outdoor-pants-khaki",
    filename: "sample-pants-khaki.png",
    attributes: {
      category: "pants",
      primaryColor: "卡其色",
      secondaryColor: "米色",
      material: "斜纹布",
      seasons: ["spring", "summer", "autumn", "multi"],
      scenarios: ["casual", "outdoor"],
      formality: "casual",
      styles: ["outdoor", "minimal"],
      warmth: "light"
    }
  },
  {
    key: "outdoor-trail-shoes",
    filename: "sample-outdoor-trail-shoes.png",
    attributes: {
      category: "shoes",
      primaryColor: "深棕色",
      secondaryColor: "黑色",
      material: "防滑织物",
      seasons: ["spring", "autumn", "winter", "multi"],
      scenarios: ["outdoor"],
      formality: "casual",
      styles: ["outdoor"],
      warmth: "medium"
    }
  },
  {
    key: "retro-knit-polo",
    filename: "sample-retro-knit-polo.png",
    attributes: {
      category: "top",
      primaryColor: "奶油色",
      secondaryColor: "焦糖色",
      material: "针织棉",
      seasons: ["spring", "autumn"],
      scenarios: ["casual", "date"],
      formality: "casual",
      styles: ["retro"],
      warmth: "medium"
    }
  },
  {
    key: "retro-denim-pants",
    filename: "sample-retro-denim-pants.png",
    attributes: {
      category: "pants",
      primaryColor: "水洗蓝",
      secondaryColor: "靛蓝",
      material: "牛仔布",
      seasons: ["spring", "autumn", "multi"],
      scenarios: ["casual", "date"],
      formality: "casual",
      styles: ["retro", "street"],
      warmth: "medium"
    }
  },
  {
    key: "retro-loafers-brown",
    filename: "sample-shoes-brown.png",
    attributes: {
      category: "shoes",
      primaryColor: "棕色",
      secondaryColor: "黑色",
      material: "皮革",
      seasons: ["spring", "autumn", "winter", "multi"],
      scenarios: ["commute", "date"],
      formality: "semi_formal",
      styles: ["retro", "business"],
      warmth: "medium"
    }
  },
  {
    key: "retro-scarf-red",
    filename: "sample-scarf-red.png",
    attributes: {
      category: "scarf",
      primaryColor: "红色",
      secondaryColor: "深红",
      material: "羊毛",
      seasons: ["autumn", "winter"],
      scenarios: ["casual", "date"],
      formality: "casual",
      styles: ["retro"],
      warmth: "heavy"
    }
  },
  {
    key: "sport-tee-gray",
    filename: "sample-sport-tee-gray.png",
    attributes: {
      category: "top",
      primaryColor: "浅灰色",
      secondaryColor: "白色",
      material: "速干面料",
      seasons: ["spring", "summer", "multi"],
      scenarios: ["sport", "casual"],
      formality: "casual",
      styles: ["sport"],
      warmth: "light"
    }
  },
  {
    key: "sport-joggers-black",
    filename: "sample-sport-joggers-black.png",
    attributes: {
      category: "pants",
      primaryColor: "黑色",
      secondaryColor: "灰色",
      material: "弹力针织",
      seasons: ["spring", "autumn", "multi"],
      scenarios: ["sport", "casual"],
      formality: "casual",
      styles: ["sport"],
      warmth: "medium"
    }
  },
  {
    key: "sport-sneakers-white",
    filename: "sample-shoes-white.png",
    attributes: {
      category: "shoes",
      primaryColor: "白色",
      secondaryColor: "灰色",
      material: "织物",
      seasons: ["spring", "summer", "multi"],
      scenarios: ["casual", "sport"],
      formality: "casual",
      styles: ["sport", "minimal"],
      warmth: "light"
    }
  },
  {
    key: "sport-cap-white",
    filename: "sample-sport-cap-white.png",
    attributes: {
      category: "hat",
      primaryColor: "白色",
      secondaryColor: "银灰色",
      material: "尼龙",
      seasons: ["spring", "summer", "multi"],
      scenarios: ["sport", "outdoor"],
      formality: "casual",
      styles: ["sport"],
      warmth: "light"
    }
  }
];

const demoOutfits: DemoOutfitDefinition[] = [
  {
    key: "business",
    title: "商务通勤示例",
    scenario: "commute",
    reason: "蓝色牛津纺上衣配炭灰色长裤，棕色皮鞋和藏青外套让整体更利落，适合需要稳重判断的一天。",
    itemKeys: ["business-shirt-blue", "business-trousers-charcoal", "business-derby-brown", "business-coat-navy"]
  },
  {
    key: "street",
    title: "街头休闲示例",
    scenario: "casual",
    reason: "黑色连帽上衣和橄榄绿工装裤建立更松弛的比例，黑色运动鞋和棒球帽强化街头感。",
    itemKeys: ["street-cap-black", "street-hoodie-black", "street-cargo-olive", "street-sneakers-black"]
  },
  {
    key: "outdoor",
    title: "户外轻装示例",
    scenario: "outdoor",
    reason: "松绿色外套、沙色上衣和卡其裤形成自然色系，防滑鞋让这套更适合周末出行。",
    itemKeys: ["outdoor-shell-green", "outdoor-tee-sand", "outdoor-pants-khaki", "outdoor-trail-shoes"]
  },
  {
    key: "retro",
    title: "复古约会示例",
    scenario: "date",
    reason: "奶油色针织上衣和水洗牛仔裤保留柔和年代感，棕色乐福鞋与红色围巾增加一点温度。",
    itemKeys: ["retro-knit-polo", "retro-denim-pants", "retro-loafers-brown", "retro-scarf-red"]
  },
  {
    key: "sport",
    title: "运动轻便示例",
    scenario: "sport",
    reason: "浅灰速干上衣、黑色束脚裤和白色运动鞋更轻快，白色帽子让整套保持清爽。",
    itemKeys: ["sport-cap-white", "sport-tee-gray", "sport-joggers-black", "sport-sneakers-white"]
  }
];

const isDemoRecommendation = (recommendation: OutfitRecommendation, key: string) =>
  recommendation.inputSnapshot?.source === "demo_seed" && recommendation.inputSnapshot.demoStyle === key;

const itemIdentity = (item: WardrobeItem) => item.originalFilename ?? item.id;

const ensureDemoItem = (repository: WardrobeRepository, definition: DemoItemDefinition, itemsByFilename: Map<string, WardrobeItem>) => {
  const existing = itemsByFilename.get(definition.filename);

  if (existing) {
    return existing;
  }

  const draft = repository.createWardrobeItem({
    imagePath: `/api/uploads/${definition.filename}`,
    originalFilename: definition.filename,
    sourceType: "photo",
    recognitionSource: "demo_seed",
    fieldConfidence: demoFieldConfidence
  });

  repository.saveRecognitionDraft({
    itemId: draft.id,
    provider: "demo_seed",
    model: "style-fixtures-v1",
    rawResult: {
      demoKey: definition.key,
      source: "local_demo"
    },
    attributes: definition.attributes
  });

  const confirmed = repository.confirmWardrobeItem(draft.id, definition.attributes);
  itemsByFilename.set(itemIdentity(confirmed), confirmed);

  return confirmed;
};

export const ensureDemoWardrobeData = (repository: WardrobeRepository) => {
  const itemsByFilename = new Map(repository.listConfirmedWardrobeItems().map((item) => [itemIdentity(item), item]));
  const itemsByKey = new Map<string, WardrobeItem>();

  for (const definition of demoItems) {
    itemsByKey.set(definition.key, ensureDemoItem(repository, definition, itemsByFilename));
  }

  const existingRecommendations = repository.listOutfitRecommendations();

  for (const outfit of demoOutfits) {
    if (existingRecommendations.some((recommendation) => isDemoRecommendation(recommendation, outfit.key))) {
      continue;
    }

    repository.createOutfitRecommendation({
      title: outfit.title,
      scenario: outfit.scenario,
      reason: outfit.reason,
      itemIds: outfit.itemKeys.map((key) => {
        const item = itemsByKey.get(key);

        if (!item) {
          throw new Error(`Demo wardrobe item ${key} was not created.`);
        }

        return item.id;
      }),
      inputSnapshot: {
        source: "demo_seed",
        demoStyle: outfit.key
      }
    });
  }
};
