import { create } from 'zustand'

interface GuideStore {
  isOpen: boolean
  activeFeature: string | null
  isDrawerOpen: boolean          // Instance Detail Drawer 열림 여부
  open: () => void
  close: () => void
  toggle: () => void
  setFeature: (id: string | null) => void
  openDrawer: (initialFeature?: string) => void  // 드로어 열릴 때 호출, 초기 탭 feature 전달 가능
  closeDrawer: () => void        // 드로어 닫힐 때 호출
}

export const useGuideStore = create<GuideStore>((set) => ({
  isOpen: false,
  activeFeature: null,
  isDrawerOpen: false,
  open:        () => set({ isOpen: true }),
  close:       () => set({ isOpen: false, activeFeature: null }),
  toggle:      () => set(s => ({ isOpen: !s.isOpen, activeFeature: null })),
  setFeature:  (id) => set({ activeFeature: id }),
  openDrawer:  (initialFeature?: string) => set({ isDrawerOpen: true, activeFeature: initialFeature ?? null }),
  closeDrawer: () => set({ isDrawerOpen: false, activeFeature: null }),
}))
