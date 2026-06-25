'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { useTRPC } from '@/trpc/client'

function slugify(title: string) {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `${base || 'note'}-${Date.now().toString(36)}`
}

export function PostsPanel({ isRegistered }: { isRegistered: boolean }) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [feedback, setFeedback] = useState<string | null>(null)

  const postsQuery = useQuery(trpc.post.list.queryOptions())
  const expandedQuery = useQuery({
    ...trpc.post.bySlug.queryOptions({ slug: expandedSlug ?? '' }),
    enabled: Boolean(expandedSlug),
  })

  const createMutation = useMutation(
    trpc.post.create.mutationOptions({
      onSuccess: async () => {
        setTitle('')
        setContent('')
        setFeedback('Draft saved — visible to you when published.')
        await queryClient.invalidateQueries({ queryKey: trpc.post.list.queryKey() })
      },
      onError: (error) => {
        setFeedback(error.message)
      },
    }),
  )

  return (
    <div className="border border-zinc-800 bg-black">
      <div className="border-b border-zinc-800 bg-zinc-900/50 px-4 py-3">
        <p className="font-mono text-[10px] tracking-widest text-amber-400 uppercase">Posts</p>
        <p className="mt-1 text-sm text-zinc-400">
          Seeded articles from Prisma. Signed-in users can leave a draft note.
        </p>
      </div>

      <div className="max-h-48 space-y-2 overflow-y-auto p-4 font-mono text-xs">
        {postsQuery.isPending ? (
          <p className="text-zinc-600">Loading posts…</p>
        ) : postsQuery.data?.length ? (
          postsQuery.data.map((post) => (
            <button
              key={post.id}
              type="button"
              onClick={() => setExpandedSlug(expandedSlug === post.slug ? null : post.slug)}
              className="block w-full border border-zinc-800 px-3 py-2 text-left transition-colors hover:border-zinc-600"
            >
              <p className="text-zinc-200">{post.title}</p>
              <p className="mt-1 text-[10px] text-zinc-600">{post.slug}</p>
            </button>
          ))
        ) : (
          <p className="text-zinc-600">No published posts — run db:seed.</p>
        )}
      </div>

      {expandedSlug && expandedQuery.data ? (
        <div className="border-t border-zinc-800 p-4 font-mono text-xs">
          <p className="text-[10px] tracking-widest text-zinc-600 uppercase">Preview</p>
          <p className="mt-2 whitespace-pre-wrap text-zinc-300">{expandedQuery.data.content}</p>
        </div>
      ) : null}

      {isRegistered ? (
        <form
          className="space-y-3 border-t border-zinc-800 p-4"
          onSubmit={(event) => {
            event.preventDefault()
            const trimmedTitle = title.trim()
            const trimmedContent = content.trim()
            if (!trimmedTitle || !trimmedContent) return
            setFeedback(null)
            createMutation.mutate({
              title: trimmedTitle,
              content: trimmedContent,
              slug: slugify(trimmedTitle),
              published: false,
            })
          }}
        >
          <p className="font-mono text-[10px] tracking-widest text-zinc-600 uppercase">
            Leave a draft note
          </p>
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Title"
            maxLength={120}
            className="w-full border border-zinc-800 bg-zinc-950 px-3 py-2 font-mono text-sm text-white"
            aria-label="Post title"
          />
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="A short note for the demo…"
            maxLength={2000}
            rows={3}
            className="w-full border border-zinc-800 bg-zinc-950 px-3 py-2 font-mono text-sm text-white"
            aria-label="Post content"
          />
          <button
            type="submit"
            disabled={createMutation.isPending || !title.trim() || !content.trim()}
            className="border border-white bg-white px-4 py-2 font-mono text-[10px] font-bold tracking-widest text-black uppercase disabled:opacity-50"
          >
            Save draft
          </button>
          {feedback ? <p className="text-[10px] text-zinc-500">{feedback}</p> : null}
        </form>
      ) : (
        <p className="border-t border-zinc-800 p-4 font-mono text-[10px] text-zinc-600">
          Sign in to save a draft note.
        </p>
      )}
    </div>
  )
}
