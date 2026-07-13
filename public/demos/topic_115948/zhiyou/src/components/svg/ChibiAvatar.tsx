import { View, Image } from '@tarojs/components'
import { hairImages, faceImages, clothingImages, getHairColorKey, getClothesColorKey } from '../../assets/q-version'

interface ChibiAvatarProps {
  size?: 'small' | 'medium' | 'large' | 'xlarge' | 'mini'
  hairColor?: string
  clothesColor?: string
  avatarConfig?: {
    hairstyle?: string
    face_shape?: string
    clothing?: string
    hair_color?: string
    clothes_color?: string
    color?: string
  }
  className?: string
}

export default function ChibiAvatar({
  size = 'medium',
  hairColor = '#2D2D3A',
  clothesColor = '#FFD460',
  avatarConfig,
  className = '',
}: ChibiAvatarProps) {
  const sizeMap = {
    mini: 40,
    small: 48,
    medium: 96,
    large: 160,
    xlarge: 240,
  }

  let hairstyle = 'long'
  let faceShape = 'oval'
  let clothing = 'tshirt'

  if (avatarConfig) {
    hairColor = avatarConfig.hair_color || avatarConfig.color || hairColor
    clothesColor = avatarConfig.clothes_color || avatarConfig.color || clothesColor
    hairstyle = avatarConfig.hairstyle || hairstyle
    faceShape = avatarConfig.face_shape || faceShape
    clothing = avatarConfig.clothing || clothing
  }

  const w = sizeMap[size]
  const hairColorKey = getHairColorKey(hairColor)
  const clothesColorKey = getClothesColorKey(clothesColor)

  const hairSrc = hairImages[hairstyle]?.[hairColorKey] || ''
  const faceSrc = faceImages[faceShape] || ''
  const clothesSrc = clothingImages[clothing]?.[clothesColorKey] || ''

  return (
    <View 
      className={className}
      style={{ 
        width: w, 
        height: w, 
        position: 'relative',
        borderRadius: w / 2,
        overflow: 'hidden',
      }}
    >
      <Image 
        src={faceSrc} 
        mode="aspectFill"
        style={{ 
          width: '100%', 
          height: '100%', 
          position: 'absolute', 
          top: 0, 
          left: 0,
        }}
      />
      <Image 
        src={hairSrc} 
        mode="aspectFill"
        style={{ 
          width: '100%', 
          height: '100%', 
          position: 'absolute', 
          top: 0, 
          left: 0,
        }}
      />
      <Image 
        src={clothesSrc} 
        mode="aspectFill"
        style={{ 
          width: '100%', 
          height: '100%', 
          position: 'absolute', 
          top: 0, 
          left: 0,
        }}
      />
    </View>
  )
}
