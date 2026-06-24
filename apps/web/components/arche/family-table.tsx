import {
  devScaffoldCommand,
  formatSupportStatus,
  PUBLIC_PRESET_ENTRY_ROWS,
  PUBLIC_PRESET_ROWS,
} from '@/lib/presets-public'

function statusTone(status: (typeof PUBLIC_PRESET_ROWS)[number]['status']) {
  if (status === 'experimental') return 'border-amber-500/40 text-amber-200'
  if (status === 'stable') return 'border-emerald-500/40 text-emerald-200'
  return 'border-zinc-700 text-zinc-300'
}

function PresetTable({ rows }: { rows: typeof PUBLIC_PRESET_ROWS }) {
  return (
    <table className="w-full text-left text-sm">
      <thead className="border-b border-zinc-800 bg-zinc-900/50 font-mono text-xs tracking-widest text-zinc-400 uppercase">
        <tr>
          <th className="border-r border-zinc-800 px-6 py-4 font-medium">Preset</th>
          <th className="border-r border-zinc-800 px-6 py-4 font-medium">Status</th>
          <th className="border-r border-zinc-800 px-6 py-4 font-medium">Capabilities</th>
          <th className="border-r border-zinc-800 px-6 py-4 font-medium">Shape</th>
          <th className="border-r border-zinc-800 px-6 py-4 font-medium">Scaffold</th>
          <th className="px-6 py-4 font-medium">Best for</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((family) => (
          <tr
            key={family.id}
            className="border-b border-zinc-800 transition-[background-color] duration-150 ease-out last:border-b-0 hover:bg-zinc-900/30"
          >
            <td className="border-r border-zinc-800 px-6 py-4 align-top">
              <div className="font-mono font-bold text-white">{family.id}</div>
              <div className="mt-1 max-w-xs text-xs whitespace-normal text-zinc-500">
                {family.label}
              </div>
            </td>
            <td className="border-r border-zinc-800 px-6 py-4 align-top">
              <span
                className={`inline-flex border bg-zinc-950 px-2 py-1 font-mono text-[10px] tracking-widest uppercase ${statusTone(family.status)}`}
              >
                {formatSupportStatus(family.status)}
              </span>
            </td>
            <td className="border-r border-zinc-800 px-6 py-4 align-top">
              {family.capabilities.length > 0 ? (
                <ul className="max-w-[14rem] list-none space-y-1 font-mono text-[11px] text-zinc-400">
                  {family.capabilities.map((cap) => (
                    <li key={cap}>{cap}</li>
                  ))}
                </ul>
              ) : (
                <span className="text-zinc-600">—</span>
              )}
            </td>
            <td className="border-r border-zinc-800 px-6 py-4 align-top whitespace-normal text-zinc-200">
              {family.shape}
            </td>
            <td className="border-r border-zinc-800 px-6 py-4 align-top">
              <code className="block max-w-[16rem] font-mono text-[10px] leading-relaxed whitespace-normal text-sky-300/90">
                {devScaffoldCommand(family.id)}
              </code>
            </td>
            <td className="px-6 py-4 align-top whitespace-normal text-zinc-400">
              {family.goodFor}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export function FamilyTable() {
  return (
    <div className="space-y-12">
      <div className="w-full overflow-x-auto border border-zinc-800 bg-black">
        <PresetTable rows={PUBLIC_PRESET_ROWS} />
      </div>

      <div>
        <h2 className="mb-4 font-mono text-xs tracking-widest text-zinc-500 uppercase">
          Entry routes
        </h2>
        <p className="mb-6 max-w-2xl text-sm text-zinc-400">
          Customize walks capability validation; Experiments is explicit opt-in for unstable
          generators. Both use the same CLI entrypoint with different preset ids.
        </p>
        <div className="w-full overflow-x-auto border border-zinc-800 bg-black">
          <PresetTable
            rows={PUBLIC_PRESET_ENTRY_ROWS.filter(
              (row) => row.id === 'customize' || row.id === 'experiments',
            )}
          />
        </div>
      </div>
    </div>
  )
}
