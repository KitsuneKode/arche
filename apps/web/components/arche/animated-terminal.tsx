'use client'

import { m } from 'motion/react'
import { useEffect, useReducer } from 'react'

import { PrimaryLink } from '@/components/arche/site-primitives'
import { CLI_VERSION } from '@/lib/cli-version'

/** Illustrative transcript of `bun run dev:cli -- … --yes --preset=typescript-fullstack` (non-interactive). */
export const terminalSteps = [
  {
    text: 'bun run dev:cli -- my-app --yes --preset=typescript-fullstack --dir=../projects',
    type: 'command',
    delay: 800,
  },
  { text: '✔ Workspace scope renamed to @my-app/*', type: 'success', delay: 400 },
  {
    text: '✔ AGENTS.md, .docs, .plans, CI, and env examples written',
    type: 'success',
    delay: 400,
  },
  { text: '✔ Scaffold complete', type: 'success', delay: 400 },
  {
    text: 'Tip: pass --verify to run install/lint/build checks after scaffold',
    type: 'prompt',
    delay: 0,
  },
] as const

type TerminalState = {
  currentStep: number
  isTyping: boolean
  typedCommand: string
}

type TerminalAction =
  | { type: 'set_typed_command'; command: string }
  | { type: 'finish_typing' }
  | { type: 'advance_step' }

const initialTerminalState: TerminalState = {
  currentStep: 0,
  isTyping: true,
  typedCommand: '',
}

function terminalReducer(state: TerminalState, action: TerminalAction): TerminalState {
  switch (action.type) {
    case 'set_typed_command':
      return { ...state, typedCommand: action.command }
    case 'finish_typing':
      return { ...state, isTyping: false, currentStep: 1 }
    case 'advance_step':
      return { ...state, currentStep: state.currentStep + 1 }
    default:
      return state
  }
}

export function AnimatedTerminal() {
  const [{ currentStep, isTyping, typedCommand }, dispatch] = useReducer(
    terminalReducer,
    initialTerminalState,
  )

  useEffect(() => {
    let cancelled = false
    const timeouts: number[] = []

    const schedule = (fn: () => void, ms: number) => {
      timeouts.push(window.setTimeout(fn, ms))
    }

    if (currentStep === 0 && isTyping) {
      const command = terminalSteps[0]!.text
      let index = 0

      const typeTick = () => {
        if (cancelled) return
        dispatch({ type: 'set_typed_command', command: command.slice(0, index) })
        index += 1
        if (index <= command.length) {
          schedule(typeTick, 40)
        } else {
          schedule(() => {
            if (cancelled) return
            dispatch({ type: 'finish_typing' })
          }, terminalSteps[0]!.delay)
        }
      }

      typeTick()
    } else if (currentStep > 0 && currentStep < terminalSteps.length) {
      schedule(
        () => {
          if (cancelled) return
          dispatch({ type: 'advance_step' })
        },
        terminalSteps[currentStep - 1]!.delay,
      )
    }

    return () => {
      cancelled = true
      for (const id of timeouts) window.clearTimeout(id)
    }
  }, [currentStep, isTyping])

  return (
    <div
      className="relative z-20 flex w-full max-w-2xl flex-col gap-4 sm:flex-row"
      aria-label="Illustrative terminal output"
    >
      <div className="group flex flex-1 flex-col overflow-hidden border border-zinc-800 bg-black shadow-[4px_4px_0_0_rgba(39,39,42,1)] transition-all duration-300 hover:shadow-[8px_8px_0_0_rgba(39,39,42,1)]">
        <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900 px-4 py-2 font-mono text-[10px] tracking-widest text-white uppercase">
          <div className="flex items-center gap-2">
            <div className="size-2 animate-pulse bg-amber-500" />
            Terminal
          </div>
          <div className="opacity-50">v{CLI_VERSION}</div>
        </div>

        <div className="relative flex min-h-[220px] flex-col items-start bg-black p-4 text-left font-mono text-sm leading-relaxed md:p-6">
          <div className="flex items-center gap-3 text-white">
            <span className="text-zinc-400">~</span>
            <span>{isTyping ? typedCommand : terminalSteps[0]!.text}</span>
            {isTyping ? (
              <m.span
                animate={{ opacity: [1, 0] }}
                transition={{ repeat: Infinity, duration: 0.8 }}
                className="block h-4 w-2 bg-white"
              />
            ) : null}
          </div>

          {terminalSteps.slice(1, currentStep).map((step) => (
            <m.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              key={step.text}
              className={`mt-2 ${
                step.type === 'prompt'
                  ? 'text-zinc-400'
                  : step.type === 'success'
                    ? 'text-green-400'
                    : 'text-white'
              }`}
            >
              {step.text}
            </m.div>
          ))}
        </div>
      </div>

      <div className="flex shrink-0 gap-2 sm:flex-col">
        <PrimaryLink href="/docs/getting-started">Docs</PrimaryLink>
        <PrimaryLink href="/docs" variant="outline">
          Runbook
        </PrimaryLink>
      </div>
    </div>
  )
}
