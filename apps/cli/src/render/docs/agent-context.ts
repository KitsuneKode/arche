export function renderInternalDocsIndex(): string {
  return `# Internal docs

This directory is for durable maintainer and agent context.

Do not load this whole tree by default.

## Sections

- architecture/
- capabilities/
- reference/
- decisions/
`
}

export function renderPlansIndex(): string {
  return `# Plans

Plans are for approved work, execution notes, and shipped outcomes.

## Directories

- active/
- completed/
- archive/

Never treat \`archive/\` as current behavior.
`
}
