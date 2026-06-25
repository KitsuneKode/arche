'use client'

import { useRef } from 'react'

type ChatComposerProps = {
  draft: string
  onDraftChange: (value: string) => void
  onSend: () => void
  disabled?: boolean
  sending?: boolean
  placeholder?: string
  autoFocus?: boolean
}

export function ChatComposer({
  draft,
  onDraftChange,
  onSend,
  disabled = false,
  sending = false,
  placeholder = 'Type a message…',
  autoFocus = false,
}: ChatComposerProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const submit = () => {
    if (disabled || sending || !draft.trim()) return
    onSend()
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  return (
    <form
      className="flex shrink-0 gap-2 border-t border-zinc-800 p-4"
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
    >
      <input
        ref={inputRef}
        type="text"
        maxLength={280}
        value={draft}
        onChange={(event) => onDraftChange(event.target.value)}
        onKeyDown={(event) => {
          event.stopPropagation()
        }}
        placeholder={placeholder}
        disabled={disabled || sending}
        autoFocus={autoFocus}
        data-chat-input=""
        className="min-w-0 flex-1 border border-zinc-800 bg-zinc-950 px-3 py-2 font-mono text-sm text-white ring-amber-500/40 outline-none focus:ring-1 disabled:opacity-60"
        aria-label="Chat message"
      />
      <button
        type="submit"
        disabled={disabled || sending || !draft.trim()}
        className="shrink-0 border border-white bg-white px-4 py-2 font-mono text-[10px] font-bold tracking-widest text-black uppercase disabled:opacity-50"
      >
        {sending ? '…' : 'Send'}
      </button>
    </form>
  )
}

export function focusChatInput(root: ParentNode | null | undefined) {
  if (!root) return
  const input = root.querySelector<HTMLInputElement>('[data-chat-input]')
  input?.focus()
}
