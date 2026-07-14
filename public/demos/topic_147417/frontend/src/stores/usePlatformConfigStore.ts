import { create } from "zustand"
import { persist } from "zustand/middleware"

type TuyaRegion = "cn" | "us" | "eu" | "in"

interface PlatformConfigState {
  tuyaClientId: string
  tuyaSecret: string
  tuyaRegion: TuyaRegion
  tuyaUserId: string
  useRealApi: boolean

  setTuyaClientId: (clientId: string) => void
  setTuyaSecret: (secret: string) => void
  setTuyaRegion: (region: TuyaRegion) => void
  setTuyaUserId: (uid: string) => void
  setUseRealApi: (useReal: boolean) => void
  resetConfig: () => void
  isConfigured: () => boolean
}

export const usePlatformConfigStore = create<PlatformConfigState>()(
  persist(
    (set, get) => ({
      tuyaClientId: "",
      tuyaSecret: "",
      tuyaRegion: "cn",
      tuyaUserId: "",
      useRealApi: false,

      setTuyaClientId: (clientId) => set({ tuyaClientId: clientId }),
      setTuyaSecret: (secret) => set({ tuyaSecret: secret }),
      setTuyaRegion: (region) => set({ tuyaRegion: region }),
      setTuyaUserId: (uid) => set({ tuyaUserId: uid }),
      setUseRealApi: (useReal) => set({ useRealApi: useReal }),
      resetConfig: () =>
        set({
          tuyaClientId: "",
          tuyaSecret: "",
          tuyaRegion: "cn",
          tuyaUserId: "",
          useRealApi: false,
        }),
      isConfigured: () => {
        const { tuyaClientId, tuyaSecret } = get()
        return !!tuyaClientId && !!tuyaSecret
      },
    }),
    {
      name: "smart-home-platform-config",
    }
  )
)

export const regionNames: Record<TuyaRegion, string> = {
  cn: "中国区",
  us: "美国区",
  eu: "欧洲区",
  in: "印度区",
}
