import { create } from 'zustand'

interface GuideStore {
  isOpen: boolean
  activeFeature: string | null
  isDrawerOpen: boolean          // Instance Detail Drawer 열림 여부
  pendingDetailFeature: string | null  // 가이드 플로우로 드로어 열 때 초기 feature 예약
  open: () => void
  close: () => void
  toggle: () => void
  setFeature: (id: string | null) => void
  openDrawer: (initialFeature?: string) => void  // 드로어 열릴 때 호출, 초기 탭 feature 전달 가능
  closeDrawer: () => void        // 드로어 닫힐 때 호출
  setPendingDetailFeature: (id: string | null) => void
}

export const useGuideStore = create<GuideStore>((set) => ({
  isOpen: false,
  activeFeature: null,
  isDrawerOpen: false,
  pendingDetailFeature: null,
  open:        () => set({ isOpen: true }),
  close:       () => set({ isOpen: false, activeFeature: null }),
  toggle:      () => set(s => ({ isOpen: !s.isOpen, activeFeature: null })),
  setFeature:  (id) => set({ activeFeature: id }),
  openDrawer:  (initialFeature?: string) => set({ isDrawerOpen: true, activeFeature: initialFeature ?? null }),
  closeDrawer: () => set({ isDrawerOpen: false, activeFeature: null }),
  setPendingDetailFeature: (id) => set({ pendingDetailFeature: id }),
}))
