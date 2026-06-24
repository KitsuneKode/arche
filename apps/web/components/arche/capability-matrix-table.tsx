import { CAPABILITIES, SUPPORT_LABELS, type SupportStatus } from '@arche-template/registry'

export function CapabilityMatrixTable() {
  const groups = Object.values(CAPABILITIES)

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <div key={group.id} className="border border-zinc-800 bg-black">
          <div className="border-b border-zinc-800 bg-zinc-900/50 px-6 py-3 font-mono text-xs tracking-widest text-zinc-400 uppercase">
            {group.label}
          </div>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-xs text-zinc-500">
                <th className="px-6 py-2 font-medium">Option</th>
                <th className="px-6 py-2 font-medium">Status</th>
                <th className="px-6 py-2 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody>
              {Object.values(group.options).map((option) => (
                <tr key={option.id} className="border-b border-zinc-800 last:border-b-0">
                  <td className="px-6 py-3 font-mono text-white">
                    {option.label}
                    {option.default ? (
                      <span className="ml-2 text-[10px] text-zinc-500">default</span>
                    ) : null}
                  </td>
                  <td className="px-6 py-3 font-mono text-xs text-zinc-400">
                    {SUPPORT_LABELS[option.status as SupportStatus]}
                  </td>
                  <td className="px-6 py-3 text-zinc-500">{option.description ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  )
}
