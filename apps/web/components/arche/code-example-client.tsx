'use client'

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@arche-template/ui/components/tabs'

export type CodeExampleItem = {
  id: string
  title: string
  desc: string
  highlightedHtml: string
}

export function CodeExampleClient({ examples }: { examples: CodeExampleItem[] }) {
  return (
    <div className="w-full border border-zinc-800 bg-black shadow-[8px_8px_0_0_rgba(39,39,42,1)]">
      <Tabs defaultValue={examples[0]?.id} className="w-full">
        <div className="flex flex-col justify-between gap-4 border-b border-zinc-800 bg-zinc-900 px-2 py-2 sm:flex-row sm:items-center">
          <TabsList className="h-auto w-full justify-start overflow-x-auto rounded-none border border-zinc-800 bg-black p-1 sm:w-auto">
            {examples.map((ex) => (
              <TabsTrigger
                key={ex.id}
                value={ex.id}
                className="rounded-none px-4 py-2 font-mono text-xs tracking-widest text-zinc-400 uppercase data-[state=active]:bg-zinc-800 data-[state=active]:text-white"
              >
                {ex.title}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="hidden items-center gap-2 pr-4 sm:flex">
            <span className="size-2 rounded-full bg-red-500" />
            <span className="size-2 rounded-full bg-amber-500" />
            <span className="size-2 rounded-full bg-green-500" />
          </div>
        </div>

        {examples.map((ex) => (
          <TabsContent key={ex.id} value={ex.id} className="mt-0 outline-none">
            <div className="flex flex-col divide-y divide-zinc-800 md:flex-row md:divide-x md:divide-y-0">
              <div className="shrink-0 bg-zinc-950/30 p-6 md:w-64">
                <h3 className="mb-2 font-bold tracking-tight text-white uppercase">{ex.title}</h3>
                <p className="text-sm leading-relaxed font-medium text-pretty text-zinc-500">
                  {ex.desc}
                </p>
              </div>

              <div className="flex-1 overflow-x-auto bg-[#0d1117] p-6">
                <div
                  className="highlighted-code [&_code]:text-sm [&_code]:leading-relaxed [&_pre]:!m-0 [&_pre]:!bg-transparent [&_pre]:!p-0"
                  dangerouslySetInnerHTML={{ __html: ex.highlightedHtml }}
                />
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
