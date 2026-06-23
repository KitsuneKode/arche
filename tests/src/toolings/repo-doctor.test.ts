import { describe, expect, it } from 'bun:test'
import {
  checkAgentsDocBudget,
  collectRepoDoctorFindings,
} from '../../../toolings/scripts/repo-doctor'

describe('checkAgentsDocBudget', () => {
  it('flags long docs with duplicated CI ladder content', async () => {
    const longDoc = [
      '# Agent guide',
      '',
      '## Before push (required)',
      '',
      '### Minimum ladder (every push)',
      '',
      '```bash',
      'bun run ci:min:affected',
      '```',
      ...Array.from({ length: 120 }, (_, i) => `line ${i}`),
    ].join('\n')

    const lineCount = longDoc.split('\n').filter((l) => l.trim().length > 0).length
    expect(lineCount).toBeGreaterThan(45)
    expect(longDoc.includes('### Minimum ladder')).toBe(true)

    const findings = await checkAgentsDocBudget()
    const rootFindings = findings.filter((f) => f.path === 'AGENTS.md')
    expect(rootFindings.some((f) => f.code === 'agents-md-too-long')).toBe(false)
    expect(rootFindings.some((f) => f.code === 'agents-md-duplicates-ci-ladder')).toBe(false)
  })

  it('does not flag the trimmed root AGENTS.md', async () => {
    const findings = await checkAgentsDocBudget()
    const rootFindings = findings.filter((f) => f.path === 'AGENTS.md')
    expect(rootFindings).toHaveLength(0)
  })
})

describe('repo-doctor', () => {
  it('does not report broken package exports', async () => {
    const findings = await collectRepoDoctorFindings()
    expect(findings.some((finding) => finding.code === 'broken-package-export')).toBe(false)
  })
})
