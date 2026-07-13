export const hairImages: Record<string, Record<string, string>> = {
  long: {
    black: require('./hair/long-black.png'),
    brown: require('./hair/long-brown.png'),
    pink: require('./hair/long-pink.png'),
    yellow: require('./hair/long-yellow.png'),
    gray: require('./hair/long-gray.png'),
  },
  curly: {
    black: require('./hair/curly-black.png'),
    brown: require('./hair/curly-brown.png'),
    pink: require('./hair/curly-pink.png'),
    yellow: require('./hair/curly-yellow.png'),
    gray: require('./hair/curly-gray.png'),
  },
  ponytail: {
    black: require('./hair/ponytail-black.png'),
    brown: require('./hair/ponytail-brown.png'),
    pink: require('./hair/ponytail-pink.png'),
    yellow: require('./hair/ponytail-yellow.png'),
    gray: require('./hair/ponytail-gray.png'),
  },
  short: {
    black: require('./hair/short-black.png'),
    brown: require('./hair/short-brown.png'),
    pink: require('./hair/short-pink.png'),
    yellow: require('./hair/short-yellow.png'),
    gray: require('./hair/short-gray.png'),
  },
  bob: {
    black: require('./hair/bob-black.png'),
    brown: require('./hair/bob-brown.png'),
    pink: require('./hair/bob-pink.png'),
    yellow: require('./hair/bob-yellow.png'),
    gray: require('./hair/bob-gray.png'),
  },
  bun: {
    black: require('./hair/bun-black.png'),
    brown: require('./hair/bun-brown.png'),
    pink: require('./hair/bun-pink.png'),
    yellow: require('./hair/bun-yellow.png'),
    gray: require('./hair/bun-gray.png'),
  },
}

export const faceImages: Record<string, string> = {
  round: require('./face/round.png'),
  oval: require('./face/oval.png'),
  square: require('./face/square.png'),
  heart: require('./face/heart.png'),
  long: require('./face/long.png'),
}

export const clothingImages: Record<string, Record<string, string>> = {
  tshirt: {
    black: require('./clothing/tshirt-black.png'),
    white: require('./clothing/tshirt-white.png'),
    gray: require('./clothing/tshirt-gray.png'),
    yellow: require('./clothing/tshirt-yellow.png'),
    pink: require('./clothing/tshirt-pink.png'),
  },
  dress: {
    black: require('./clothing/dress-black.png'),
    white: require('./clothing/dress-white.png'),
    gray: require('./clothing/dress-gray.png'),
    yellow: require('./clothing/dress-yellow.png'),
    pink: require('./clothing/dress-pink.png'),
  },
  hoodie: {
    black: require('./clothing/hoodie-black.png'),
    white: require('./clothing/hoodie-white.png'),
    gray: require('./clothing/hoodie-gray.png'),
    yellow: require('./clothing/hoodie-yellow.png'),
    pink: require('./clothing/hoodie-pink.png'),
  },
  suit: {
    black: require('./clothing/suit-black.png'),
    white: require('./clothing/suit-white.png'),
    gray: require('./clothing/suit-gray.png'),
    yellow: require('./clothing/suit-yellow.png'),
    pink: require('./clothing/suit-pink.png'),
  },
  casual: {
    black: require('./clothing/casual-black.png'),
    white: require('./clothing/casual-white.png'),
    gray: require('./clothing/casual-gray.png'),
    yellow: require('./clothing/casual-yellow.png'),
    pink: require('./clothing/casual-pink.png'),
  },
  uniform: {
    black: require('./clothing/uniform-black.png'),
    white: require('./clothing/uniform-white.png'),
    gray: require('./clothing/uniform-gray.png'),
    yellow: require('./clothing/uniform-yellow.png'),
    pink: require('./clothing/uniform-pink.png'),
  },
}

export const HAIR_COLOR_MAP: Record<string, string> = {
  '#2D2D3A': 'black',
  '#5C3D2E': 'brown',
  '#FF9EC6': 'pink',
  '#D4A853': 'yellow',
  '#9B9BAB': 'gray',
}

export const CLOTHES_COLOR_MAP: Record<string, string> = {
  '#2D2D3A': 'black',
  '#FFFFFF': 'white',
  '#9B9BAB': 'gray',
  '#FFD460': 'yellow',
  '#FF9EC6': 'pink',
}

export const getHairColorKey = (color: string): string => {
  return HAIR_COLOR_MAP[color] || 'black'
}

export const getClothesColorKey = (color: string): string => {
  return CLOTHES_COLOR_MAP[color] || 'black'
}
