export const LIVE_TABS = ['play', 'lab', 'room'] as const

export type LiveExperienceTab = (typeof LIVE_TABS)[number]

export function parseLiveTab(value: string | null | undefined): LiveExperienceTab {
  if (value === 'lab' || value === 'room' || value === 'play') return value
  return 'play'
}

export function liveTabLabel(tab: LiveExperienceTab): string {
  if (tab === 'lab') return 'Stack Lab'
  if (tab === 'room') return 'Room'
  return 'Play'
}
