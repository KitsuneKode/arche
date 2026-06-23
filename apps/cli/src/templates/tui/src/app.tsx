import { useKeyboard, useRenderer } from '@opentui/react'
import { useState } from 'react'

const ITEMS = [
  { id: 'welcome', title: 'Welcome', detail: 'OpenTUI + React terminal UI starter.' },
  {
    id: 'nav',
    title: 'Navigation',
    detail: 'Use arrow keys to move, Enter to open a detail view, Esc or q to quit.',
  },
  {
    id: 'next',
    title: 'Next steps',
    detail: 'Edit src/app.tsx and add screens under src/ as your product grows.',
  },
] as const

export function App() {
  const renderer = useRenderer()
  const [selected, setSelected] = useState(0)
  const [view, setView] = useState<'list' | 'detail'>('list')
  const item = ITEMS[selected]!

  useKeyboard((key) => {
    if (key.name === 'escape' || key.name === 'q') {
      renderer.destroy()
      return
    }

    if (view === 'list') {
      if (key.name === 'up') setSelected((index) => Math.max(0, index - 1))
      if (key.name === 'down') setSelected((index) => Math.min(ITEMS.length - 1, index + 1))
      if (key.name === 'return') setView('detail')
      return
    }

    if (key.name === 'backspace' || key.name === 'left') {
      setView('list')
    }
  })

  return (
    <box style={{ border: true, padding: 1, flexDirection: 'column', gap: 1 }}>
      <text fg="yellow">Arche TUI</text>
      {view === 'list' ? (
        <scrollbox style={{ height: 10 }}>
          {ITEMS.map((entry, index) => (
            <text key={entry.id} fg={index === selected ? 'cyan' : undefined}>
              {index === selected ? '› ' : '  '}
              {entry.title}
            </text>
          ))}
        </scrollbox>
      ) : (
        <box style={{ flexDirection: 'column', gap: 1 }}>
          <text fg="cyan">{item.title}</text>
          <text>{item.detail}</text>
          <text fg="#888">← backspace to return</text>
        </box>
      )}
      <text fg="#666">↑↓ navigate · enter open · esc quit</text>
    </box>
  )
}
