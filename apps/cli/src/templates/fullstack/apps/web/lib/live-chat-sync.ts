import { apiPath } from '@/lib/api-origin'

import { isChatSseEnabled } from '@/lib/live-chat-sync-policy'

export { isChatSseEnabled }

export function chatStreamUrl() {
  return apiPath('/api/chat/stream')
}
