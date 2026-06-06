import type { TRPCRouterRecord } from '@trpc/server'
import { protectedProcedure, publicProcedure } from '../trpc/trpc.js'
import { createPostSchema, postIdSchema, postSlugSchema, updatePostSchema } from './post.dto'
import { postService } from './post.service'

export const postRouter = {
  list: publicProcedure.query(() => postService.listPublished()),

  byId: publicProcedure.input(postIdSchema).query(({ input }) => postService.getById(input.id)),

  bySlug: publicProcedure
    .input(postSlugSchema)
    .query(({ input }) => postService.getBySlug(input.slug)),

  create: protectedProcedure
    .input(createPostSchema)
    .mutation(({ ctx, input }) => postService.create(ctx.session.user.id, input)),

  update: protectedProcedure
    .input(updatePostSchema)
    .mutation(({ ctx, input }) => postService.update(ctx.session.user.id, input)),

  delete: protectedProcedure
    .input(postIdSchema)
    .mutation(({ ctx, input }) => postService.delete(ctx.session.user.id, input.id)),
} satisfies TRPCRouterRecord
