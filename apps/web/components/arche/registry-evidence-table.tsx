import type { PresetId } from '@arche-template/registry'
import {
  PRESET_VERIFICATION_MATRIX,
  PRESETS,
  VERIFICATION_MATRIX_COLUMNS,
  formatSupportStatus,
  type PresetVerificationEvidence,
} from '@arche-template/registry'
import type { ReactNode } from 'react'

export type ColumnPolicy = 'all' | 'nonempty'
export type AbsentGlyph = 'dash' | 'no'
export type RegistryEvidenceVariant = 'marketing' | 'docs'

export function columnsForPresets(
  presets: typeof PRESETS,
  policy: ColumnPolicy,
): typeof VERIFICATION_MATRIX_COLUMNS {
  if (policy === 'all') {
    return VERIFICATION_MATRIX_COLUMNS
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
      <span className="text-emerald-400" aria-label="verified">
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

  const wrapperClass = isDocs
    ? `not-prose my-10 overflow-hidden border border-zinc-800 ${className ?? ''}`
    : `w-full overflow-x-auto border border-zinc-800 bg-black ${className ?? ''}`

  return (
    <div className={wrapperClass}>
      {caption ? (
        <p
          className={
            isDocs
              ? 'border-b border-zinc-800 bg-zinc-950/50 px-4 py-3 text-sm text-zinc-400'
              : 'border-b border-zinc-800 bg-zinc-900/50 px-4 py-3 text-sm text-zinc-400'
          }
        >
          {caption}
        </p>
      ) : null}
      <div className={isDocs ? 'overflow-x-auto' : undefined}>
        <table
          className={isDocs ? 'w-full min-w-[720px] text-left text-xs' : 'w-full text-left text-xs'}
        >
          <thead
            className={
              isDocs
                ? undefined
                : 'border-b border-zinc-800 bg-zinc-900/50 font-mono tracking-widest text-zinc-400 uppercase'
            }
          >
            <tr
              className={
                isDocs ? 'border-b border-zinc-800 bg-zinc-900' : 'border-b border-zinc-800'
              }
            >
              <th
                className={
                  isDocs
                    ? 'sticky left-0 z-10 bg-zinc-900 px-3 py-2 font-mono text-[10px] tracking-widest text-zinc-400 uppercase'
                    : 'sticky left-0 border-r border-zinc-800 bg-zinc-900/95 px-4 py-3 font-medium'
                }
              >
                Preset
              </th>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={
                    isDocs
                      ? 'px-2 py-2 text-center font-mono text-[10px] tracking-wide text-zinc-500 uppercase'
                      : 'border-r border-zinc-800 px-3 py-3 font-medium last:border-r-0'
                  }
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {presets.map((preset) => {
              const evidence = PRESET_VERIFICATION_MATRIX[preset.id]
              return (
                <tr
                  key={preset.id}
                  className={
                    isDocs
                      ? 'border-b border-zinc-800/80'
                      : 'border-b border-zinc-800 last:border-b-0'
                  }
                >
                  <td
                    className={
                      isDocs
                        ? 'sticky left-0 z-10 bg-black px-3 py-2'
                        : 'sticky left-0 border-r border-zinc-800 bg-black px-4 py-3'
                    }
                  >
                    <div
                      className={
                        isDocs
                          ? 'font-mono text-[11px] text-zinc-300'
                          : 'font-mono font-bold text-white'
                      }
                    >
                      {preset.id}
                    </div>
                    <div
                      className={
                        isDocs ? 'text-[10px] text-zinc-600' : 'mt-1 text-[10px] text-zinc-500'
                      }
                    >
                      {formatSupportStatus(preset.status)}
                    </div>
                  </td>
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={
                        isDocs
                          ? 'px-2 py-2 text-center font-mono'
                          : 'border-r border-zinc-800 px-3 py-3 text-center font-mono last:border-r-0'
                      }
                    >
                      {cellMark(evidence[col.key as keyof PresetVerificationEvidence], absentGlyph)}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
