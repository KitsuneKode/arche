'use client'

import { LazyMotion, MotionConfig, domAnimation } from 'motion/react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <NextThemesProvider
          attribute="class"
          defaultTheme="dark"
          forcedTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
          enableColorScheme
        >
          {children}
        </NextThemesProvider>
      </MotionConfig>
    </LazyMotion>
  )
}
