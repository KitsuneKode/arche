import config from '@/env'

import { isChatSseEnabled } from '@/lib/live-chat-sync-policy'

export { isChatSseEnabled }

export function chatStreamUrl() {
  return `${config.NEXT_PUBLIC_API_URL}/api/chat/stream`
}
