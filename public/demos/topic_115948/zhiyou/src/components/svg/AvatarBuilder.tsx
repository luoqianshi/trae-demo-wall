import { View, Image } from '@tarojs/components'
import { hairImages, faceImages, clothingImages, getHairColorKey, getClothesColorKey } from '../../assets/q-version'

interface AvatarBuilderProps {
  hairstyle: 'long' | 'curly' | 'ponytail' | 'short' | 'bob' | 'bun'
  faceShape: 'round' | 'oval' | 'square' | 'heart' | 'long'
  clothing: 'tshirt' | 'dress' | 'hoodie' | 'suit' | 'casual' | 'uniform'
  hairColor: string
  clothesColor: string
  size?: number
}

export default function AvatarBuilder({
  hairstyle,
  faceShape,
  clothing,
  hairColor,
  clothesColor,
  size = 200,
}: AvatarBuilderProps) {
  const hairColorKey = getHairColorKey(hairColor)
  const clothesColorKey = getClothesColorKey(clothesColor)

  const hairSrc = hairImages[hairstyle]?.[hairColorKey] || ''
  const faceSrc = faceImages[faceShape] || ''
  const clothesSrc = clothingImages[clothing]?.[clothesColorKey] || ''

  return (
    <View 
      style={{ 
        width: size, 
        height: size * 1.5, 
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
      }}
    >
      <Image 
        src={clothesSrc} 
        mode="aspectFit"
        style={{ 
          width: '75%', 
          height: '42%', 
          position: 'absolute', 
          bottom: '5%', 
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1,
        }}
      />
      <Image 
        src={hairSrc} 
        mode="aspectFit"
        style={{ 
          width: '100%', 
          height: '65%', 
          position: 'absolute', 
          top: '0%', 
          left: '0%',
          zIndex: 3,
        }}
      />
      <Image 
        src={faceSrc} 
        mode="aspectFit"
        style={{ 
          width: '50%', 
          height: '40%', 
          position: 'absolute', 
          top: '22%', 
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 2,
        }}
      />
    </View>
  )
}
