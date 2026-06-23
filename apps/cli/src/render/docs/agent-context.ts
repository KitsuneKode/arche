export function renderInternalDocsIndex(): string {
  return `# Internal docs

Durable maintainer and agent context. Do not load this whole tree by default.

## Sections

- architecture/
`
}

export function renderPlansIndex(): string {
  return `# Plans

Approved work, execution notes, and shipped outcomes.

## Directories

Create \`active/\` when you start approved work. Use \`completed/\` and \`archive/\` when closing plans.

Never treat \`archive/\` as current behavior.
`
}
