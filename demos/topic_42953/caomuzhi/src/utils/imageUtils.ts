const FALLBACK_SEEDS = ['leaf', 'plant', 'flower', 'tree', 'green', 'nature', 'botanical', 'garden'];

const TRAE_IMAGE_API = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image';

export const getPlantImageUrl = (name: string, index: number = 1, width: number = 800, height: number = 600): string => {
  const imageSize = width > height ? 'landscape_16_9' : 'portrait_4_3';
  const safeName = name.replace(/[\s\u4e00-\u9fa5]+/g, ' ').trim() || 'plant';
  const encodedName = encodeURIComponent(`${safeName} plant botanical illustration nature photography high quality`);
  return `${TRAE_IMAGE_API}?prompt=${encodedName}&image_size=${imageSize}`;
};

export const getFallbackImageUrl = (width: number = 800, height: number = 600): string => {
  const TRAE_IMAGE_API = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image';
  const imageSize = width > height ? 'landscape_16_9' : 'portrait_4_3';
  const seed = FALLBACK_SEEDS[Math.floor(Math.random() * FALLBACK_SEEDS.length)];
  const encodedName = encodeURIComponent(`${seed} plant botanical nature photography`);
  return `${TRAE_IMAGE_API}?prompt=${encodedName}&image_size=${imageSize}`;
};

export const getAvatarUrl = (seed: string, size: number = 200): string => {
  const TRAE_IMAGE_API = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image';
  const encodedName = encodeURIComponent(`portrait avatar person ${seed} friendly face`);
  return `${TRAE_IMAGE_API}?prompt=${encodedName}&image_size=square`;
};
