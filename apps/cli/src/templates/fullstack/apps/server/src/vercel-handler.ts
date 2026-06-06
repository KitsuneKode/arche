if (typeof globalThis.require === 'undefined') {
  // @ts-expect-error - Bun's import.meta.require is not in TS types
  globalThis.require = import.meta.require as (id: string) => unknown
}

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err?.constructor?.name, err?.message)
})

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason?.constructor?.name, reason)
})

const { default: app } = await import('./app')

export default app
