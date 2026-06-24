'use client'

import { LazyMotion, MotionConfig, domAnimation } from 'motion/react'

/** Scope motion to routes that need animation (landing). Avoid loading on docs/blog. */
export function MotionRoot({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  )
}
