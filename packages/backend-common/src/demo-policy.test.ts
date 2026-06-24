import { afterEach, describe, expect, it } from 'bun:test'

import {
  getDemoCapabilities,
  isDemoAutoSignInEnabled,
} from '@arche-template/backend-common/demo-policy'

const envSnapshot = {
  NODE_ENV: process.env.NODE_ENV,
  DEMO_AUTO_SIGN_IN: process.env.DEMO_AUTO_SIGN_IN,
}

afterEach(() => {
  for (const [key, value] of Object.entries(envSnapshot)) {
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
})

describe('demo-policy', () => {
  it('auto sign-in in development', () => {
    process.env.NODE_ENV = 'development'
    expect(isDemoAutoSignInEnabled()).toBe(true)
  })

  it('requires DEMO_AUTO_SIGN_IN in production', () => {
    process.env.NODE_ENV = 'production'
    delete process.env.DEMO_AUTO_SIGN_IN
    expect(isDemoAutoSignInEnabled()).toBe(false)

    process.env.DEMO_AUTO_SIGN_IN = 'true'
    expect(isDemoAutoSignInEnabled()).toBe(true)
  })

  it('exposes capabilities shape', () => {
    const caps = getDemoCapabilities()
    expect(typeof caps.autoSignIn).toBe('boolean')
    expect(caps.chatSync === 'sse' || caps.chatSync === 'poll').toBe(true)
  })
})
