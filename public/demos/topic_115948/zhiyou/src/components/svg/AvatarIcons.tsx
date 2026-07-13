import { Image } from '@tarojs/components'
import { hairImages, faceImages, clothingImages, getHairColorKey, getClothesColorKey } from '../../assets/q-version'

export function HairIcon({ type, color = '#2D2D3A', size = 48 }: { type: string; color?: string; size?: number }) {
  const colorKey = getHairColorKey(color)
  const src = hairImages[type]?.[colorKey] || ''
  
  return (
    <Image 
      src={src} 
      mode="aspectFill"
      style={{ 
        width: size, 
        height: size, 
        borderRadius: size / 2,
      }}
    />
  )
}

export function FaceIcon({ type, size = 48 }: { type: string; size?: number }) {
  const src = faceImages[type] || ''
  
  return (
    <Image 
      src={src} 
      mode="aspectFill"
      style={{ 
        width: size, 
        height: size, 
        borderRadius: size / 2,
      }}
    />
  )
}

export function ClothesIcon({ type, color = '#FFD460', size = 48 }: { type: string; color?: string; size?: number }) {
  const colorKey = getClothesColorKey(color)
  const src = clothingImages[type]?.[colorKey] || ''
  
  return (
    <Image 
      src={src} 
      mode="aspectFill"
      style={{ 
        width: size, 
        height: size, 
        borderRadius: size / 2,
      }}
    />
  )
}
