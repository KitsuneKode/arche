/**
 * @filename: lint-staged.config.mjs
 * @type {import('lint-staged').Configuration}
 */
export default {
  '(apps|packages|toolings)/**/*.{js,ts,jsx,tsx}': (files) => {
    const escapedFiles = files.map((f) => `'${f.replace(/'/g, "'\\''")}'`).join(' ')
    return [`bunx oxlint --fix ${escapedFiles}`, `bunx oxfmt ${escapedFiles}`]
  },

  '**/*.md': ['bunx oxfmt'],

  '**/*.json': (files) => {
    if (files.length === 0) return []
    const escapedFiles = files.map((f) => `'${f.replace(/'/g, "'\\''")}'`).join(' ')
    return [`bunx oxfmt ${escapedFiles}`]
  },

  'packages/store/prisma/schema.prisma': (file) => [`prisma format --schema ${file}`],
}
