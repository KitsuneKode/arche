import type { PresetId } from '@arche-template/registry'
import {
  PRESET_VERIFICATION_MATRIX,
  PRESETS,
  VERIFICATION_MATRIX_COLUMNS,
  formatSupportStatus,
  type PresetVerificationEvidence,
} from '@arche-template/registry'
import type { ReactNode } from 'react'

export type ColumnPolicy = 'all' | 'nonempty' | 'summary'
export type AbsentGlyph = 'dash' | 'no'
export type RegistryEvidenceVariant = 'marketing' | 'docs'

const SUMMARY_COLUMN_KEYS = [
  'generatedInstall',
  'generatedLint',
  'generatedTypecheck',
  'generatedBuild',
  'runtimeSmoke',
  'cargoWorkspace',
  'solanaProgram',
  'convexBackend',
  'tui',
] as const satisfies readonly (keyof PresetVerificationEvidence)[]

const MARKETING_SHORT_LABELS: Partial<
  Record<(typeof VERIFICATION_MATRIX_COLUMNS)[number]['key'], string>
> = {
  generatedInstall: 'Install',
  generatedLint: 'Lint',
  generatedTypecheck: 'Typecheck',
  generatedBuild: 'Build',
  runtimeSmoke: 'Smoke',
  cargoWorkspace: 'Rust',
  solanaProgram: 'Solana',
  convexBackend: 'Convex',
  tui: 'TUI',
}

export function columnsForPresets(
  presets: typeof PRESETS,
  policy: ColumnPolicy,
): typeof VERIFICATION_MATRIX_COLUMNS {
  if (policy === 'all') {
    return VERIFICATION_MATRIX_COLUMNS
  }

  if (policy === 'summary') {
    return VERIFICATION_MATRIX_COLUMNS.filter((col) =>
      SUMMARY_COLUMN_KEYS.includes(col.key as (typeof SUMMARY_COLUMN_KEYS)[number]),
    )
  }

  return VERIFICATION_MATRIX_COLUMNS.filter((col) =>
    presets.some((preset) => {
      const evidence = PRESET_VERIFICATION_MATRIX[preset.id]
      const key = col.key as keyof PresetVerificationEvidence
      return evidence[key]
    }),
  )
}

function cellMark(value: boolean, absentGlyph: AbsentGlyph) {
  if (value) {
    return (
      <span className="font-semibold text-emerald-400" aria-label="verified">
        yes
      </span>
    )
  }

  if (absentGlyph === 'dash') {
    return (
      <span className="text-zinc-600" aria-label="not applicable">
        —
      </span>
    )
  }

  return (
    <span className="text-zinc-600" aria-label="not verified">
      no
    </span>
  )
}

function columnLabel(
  col: (typeof VERIFICATION_MATRIX_COLUMNS)[number],
  variant: RegistryEvidenceVariant,
): string {
  if (variant === 'marketing') {
    return MARKETING_SHORT_LABELS[col.key] ?? col.label
  }
  return col.label
}

export type RegistryEvidenceTableProps = {
  presetFilter?: (id: PresetId) => boolean
  columnPolicy?: ColumnPolicy
  absentGlyph?: AbsentGlyph
  variant?: RegistryEvidenceVariant
  caption?: ReactNode
  className?: string
}

export function RegistryEvidenceTable({
  presetFilter,
  columnPolicy = 'nonempty',
  absentGlyph = 'dash',
  variant = 'marketing',
  caption,
  className,
}: RegistryEvidenceTableProps) {
  const presets = presetFilter ? PRESETS.filter((p) => presetFilter(p.id)) : PRESETS
  const columns = columnsForPresets(presets, columnPolicy)
  const isDocs = variant === 'docs'
  const isMarketing = variant === 'marketing'

  const wrapperClass = isDocs
    ? `not-prose my-10 overflow-hidden rounded-sm border border-zinc-800 ${className ?? ''}`
    : `w-full overflow-x-auto rounded-sm border border-zinc-800 bg-black shadow-[inset_-1rem_0_1rem_-1rem_rgba(0,0,0,0.9)] ${className ?? ''}`

  const tableTextClass = isDocs ? 'text-sm' : 'text-sm'
  const headerTextClass = isDocs
    ? 'px-3 py-2.5 text-center font-mono text-[11px] tracking-wide text-zinc-400 uppercase'
    : 'px-3 py-3 text-center font-mono text-[11px] tracking-wide text-zinc-400 uppercase'

  return (
    <div className={wrapperClass}>
      {caption ? (
        <p
          className={
            isDocs
              ? 'border-b border-zinc-800 bg-zinc-950/50 px-4 py-3 text-sm leading-relaxed text-zinc-400'
              : 'border-b border-zinc-800 bg-zinc-900/50 px-4 py-3 text-sm leading-relaxed text-zinc-400'
          }
        >
          {caption}
        </p>
      ) : null}
      <div className={isDocs || isMarketing ? 'overflow-x-auto' : undefined}>
        <table className={`w-full min-w-[640px] text-left ${tableTextClass}`}>
          <thead
            className={
              isMarketing
                ? 'border-b border-zinc-800 bg-zinc-900/80 font-mono tracking-widest text-zinc-400 uppercase'
                : undefined
            }
          >
            <tr className="border-b border-zinc-800">
              <th
                className={
                  isDocs
                    ? 'sticky left-0 z-10 min-w-[9rem] bg-zinc-900 px-4 py-3 font-mono text-[11px] tracking-widest text-zinc-400 uppercase shadow-[4px_0_8px_-4px_rgba(0,0,0,0.8)]'
                    : 'sticky left-0 z-10 min-w-[9rem] border-r border-zinc-800 bg-zinc-900/95 px-4 py-3 text-left font-medium shadow-[4px_0_8px_-4px_rgba(0,0,0,0.8)]'
                }
              >
                Preset
              </th>
              {columns.map((col) => (
                <th key={col.key} className={headerTextClass}>
                  {columnLabel(col, variant)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {presets.map((preset, rowIndex) => {
              const evidence = PRESET_VERIFICATION_MATRIX[preset.id]
              const rowBg = rowIndex % 2 === 1 ? 'bg-zinc-950/40' : 'bg-black'
              return (
                <tr
                  key={preset.id}
                  className={`border-b border-zinc-800/80 last:border-b-0 ${rowBg} hover:bg-zinc-900/50`}
                >
                  <td
                    className={`sticky left-0 z-10 border-r border-zinc-800 px-4 py-3 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.8)] ${rowBg}`}
                  >
                    <div
                      className={
                        isDocs
                          ? 'font-mono text-xs text-zinc-200'
                          : 'font-mono text-sm font-semibold text-white'
                      }
                    >
                      {preset.id}
                    </div>
                    <div className="mt-1 text-[11px] text-zinc-500">
                      {formatSupportStatus(preset.status)}
                    </div>
                  </td>
                  {columns.map((col) => (
                    <td key={col.key} className="px-3 py-3 text-center font-mono text-sm">
                      {cellMark(evidence[col.key as keyof PresetVerificationEvidence], absentGlyph)}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {isMarketing ? (
        <p className="border-t border-zinc-800 px-4 py-2 font-mono text-[10px] tracking-wide text-zinc-600 uppercase">
          yes = verified in CI · — = not part of this preset route
        </p>
      ) : null}
    </div>
  )
}
