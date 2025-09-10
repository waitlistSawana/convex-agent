// Thread Management Agent Chat Functions
import { paginationOptsValidator } from "convex/server";
import {
  createThread,
  listMessages,
  syncStreams,
  vStreamArgs,
} from "@convex-dev/agent";
import { components, internal } from "../_generated/api";
import {
  action,
  httpAction,
  internalAction,
  mutation,
  query,
} from "../_generated/server";
import { v } from "convex/values";
import { authorizeThreadAccess } from "../threads";
import { threadManagerAgent } from "../agents/threadManager";

/**
 * Stream the response in a single action call.
 */
export const streamOneShot = action({
  args: { prompt: v.string(), threadId: v.string() },
  handler: async (ctx, { prompt, threadId }) => {
    await authorizeThreadAccess(ctx, threadId);
    await threadManagerAgent.streamText(
      ctx,
      { threadId },
      { prompt },
      { saveStreamDeltas: true },
    );
  },
});

/**
 * Generate the prompt message first, then asynchronously generate the stream response.
 * This enables optimistic updates on the client.
 */
export const initiateAsyncStreaming = mutation({
  args: { prompt: v.string(), threadId: v.string() },
  handler: async (ctx, { prompt, threadId }) => {
    await authorizeThreadAccess(ctx, threadId);
    const { messageId } = await threadManagerAgent.saveMessage(ctx, {
      threadId,
      prompt,
      skipEmbeddings: true,
    });
    await ctx.scheduler.runAfter(0, internal.chat.threadManagement.streamAsync, {
      threadId,
      promptMessageId: messageId,
    });
  },
});

export const streamAsync = internalAction({
  args: { promptMessageId: v.string(), threadId: v.string() },
  handler: async (ctx, { promptMessageId, threadId }) => {
    const result = await threadManagerAgent.streamText(
      ctx,
      { threadId },
      { promptMessageId },
      { saveStreamDeltas: { chunking: "word", throttleMs: 100 } },
    );
    await result.consumeStream();
  },
});

/**
 * Query & subscribe to messages & threads
 */
export const listThreadMessages = query({
  args: {
    threadId: v.string(),
    paginationOpts: paginationOptsValidator,
    streamArgs: vStreamArgs,
  },
  handler: async (ctx, args) => {
    const { threadId, streamArgs } = args;
    await authorizeThreadAccess(ctx, threadId);
    const streams = await syncStreams(ctx, components.agent, {
      threadId,
      streamArgs,
    });

    const paginated = await listMessages(ctx, components.agent, args);

    return {
      ...paginated,
      streams,
    };
  },
});

/**
 * Stream text over http
 */
export const streamOverHttp = httpAction(async (ctx, request) => {
  const body = (await request.json()) as {
    threadId?: string;
    prompt: string;
  };
  const threadId = body.threadId ?? (await createThread(ctx, components.agent));
  const result = await threadManagerAgent.streamText(ctx, { threadId }, body);
  const response = result.toTextStreamResponse();
  response.headers.set("X-Message-Id", result.promptMessageId!);
  return response;
});

// Expose an internal action that streams text
export const streamThreadManagementInternalAction = threadManagerAgent.asTextAction({
  stream: true,
});

// This fetches only streaming messages
export const listStreamingMessages = query({
  args: { threadId: v.string(), streamArgs: vStreamArgs },
  handler: async (ctx, { threadId, streamArgs }) => {
    await authorizeThreadAccess(ctx, threadId);
    const streams = await threadManagerAgent.syncStreams(ctx, { threadId, streamArgs });
    return { streams };
  },
});