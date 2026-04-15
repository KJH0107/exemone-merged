import { create } from 'zustand'

interface GuideStore {
  isOpen: boolean
  activeFeature: string | null
  isDrawerOpen: boolean
  pendingDetailFeature: string | null
  completedChallenges: string[]   // 챌린지 완료된 feature id 목록
  open: () => void
  close: () => void
  toggle: () => void
  setFeature: (id: string | null) => void
  openDrawer: (initialFeature?: string) => void
  closeDrawer: () => void
  setPendingDetailFeature: (id: string | null) => void
  completeChallenge: (id: string) => void
}

export const useGuideStore = create<GuideStore>((set) => ({
  isOpen: false,
  activeFeature: null,
  isDrawerOpen: false,
  pendingDetailFeature: null,
  completedChallenges: [],
  open:        () => set({ isOpen: true }),
  close:       () => set({ isOpen: false, activeFeature: null }),
  toggle:      () => set(s => ({ isOpen: !s.isOpen, activeFeature: null })),
  setFeature:  (id) => set({ activeFeature: id }),
  openDrawer:  (initialFeature?: string) => set({ isDrawerOpen: true, activeFeature: initialFeature ?? null }),
  closeDrawer: () => set({ isDrawerOpen: false, activeFeature: null }),
  setPendingDetailFeature: (id) => set({ pendingDetailFeature: id }),
  completeChallenge: (id) => set(s => ({
    completedChallenges: s.completedChallenges.includes(id)
      ? s.completedChallenges
      : [...s.completedChallenges, id],
  })),
}))
