// Multi-user chat backend with user isolation
import { paginationOptsValidator } from "convex/server";
import {
  createThread,
  listMessages,
  syncStreams,
  vStreamArgs,
  getThreadMetadata,
} from "@convex-dev/agent";
import { components, internal } from "../_generated/api";
import {
  action,
  internalAction,
  mutation,
  query,
  ActionCtx,
  QueryCtx,
} from "../_generated/server";
import { v } from "convex/values";
import { multiUserAgent, DEMO_USERS } from "../agents/multiUser";

// Helper function to get user ID for multi-user demo
async function getCurrentUserId(ctx: QueryCtx | ActionCtx, userId?: string) {
  // If userId is provided and is a valid demo user, use it
  if (userId && DEMO_USERS.find(u => u.id === userId)) {
    return userId;
  }
  // Default fallback user
  return "default-user";
}

// Enhanced thread access authorization with user isolation
export async function authorizeMultiUserThreadAccess(
  ctx: QueryCtx | ActionCtx,
  threadId: string,
  userId?: string,
) {
  const currentUserId = await getCurrentUserId(ctx, userId);
  
  try {
    // Get thread metadata to check ownership
    const { userId: threadUserId } = await getThreadMetadata(
      ctx,
      components.agent,
      { threadId },
    );
    
    // Ensure user can only access their own threads
    if (threadUserId && threadUserId !== currentUserId) {
      throw new Error(`Unauthorized: User ${currentUserId} cannot access thread belonging to ${threadUserId}`);
    }
  } catch (error) {
    // If thread doesn't exist or has no user, that's also unauthorized
    throw new Error(`Unauthorized thread access: ${threadId}`);
  }
}

/**
 * Multi-user streaming chat with user isolation
 */

export const initiateAsyncStreaming = mutation({
  args: { 
    prompt: v.string(), 
    threadId: v.string(),
    userId: v.optional(v.string())
  },
  handler: async (ctx, { prompt, threadId, userId }) => {
    await authorizeMultiUserThreadAccess(ctx, threadId, userId);
    const { messageId } = await multiUserAgent.saveMessage(ctx, {
      threadId,
      prompt,
      skipEmbeddings: true,
    });
    await ctx.scheduler.runAfter(0, internal.chat.multiUser.streamAsync, {
      threadId,
      promptMessageId: messageId,
      userId,
    });
  },
});

export const streamAsync = internalAction({
  args: { 
    promptMessageId: v.string(), 
    threadId: v.string(),
    userId: v.optional(v.string())
  },
  handler: async (ctx, { promptMessageId, threadId, userId }) => {
    const currentUserId = await getCurrentUserId(ctx, userId);
    
    const result = await multiUserAgent.streamText(
      ctx,
      { threadId },
      { 
        promptMessageId,
        // Add user context to the prompt
        system: `You are chatting with ${currentUserId}. Keep responses concise and engaging.`
      },
      { saveStreamDeltas: { chunking: "word", throttleMs: 100 } }
    );
    
    await result.consumeStream();
  },
});

/**
 * Create a new thread for a specific user
 */
export const createUserThread = mutation({
  args: { 
    title: v.optional(v.string()),
    userId: v.string()
  },
  handler: async (ctx, { title, userId }) => {
    const currentUserId = await getCurrentUserId(ctx, userId);
    
    const threadId = await createThread(ctx, components.agent, {
      userId: currentUserId,
      title: title || `${DEMO_USERS.find(u => u.id === currentUserId)?.name || currentUserId}'s Chat`,
    });
    
    return threadId;
  },
});

/**
 * List threads for a specific user
 */
export const listUserThreads = query({
  args: {
    userId: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, { userId, paginationOpts }) => {
    const currentUserId = await getCurrentUserId(ctx, userId);
    
    const threads = await ctx.runQuery(
      components.agent.threads.listThreadsByUserId,
      { userId: currentUserId, paginationOpts }
    );
    
    return threads;
  },
});

/**
 * List messages for a thread with user authorization
 */
export const listThreadMessages = query({
  args: {
    threadId: v.string(),
    userId: v.optional(v.string()),
    paginationOpts: paginationOptsValidator,
    streamArgs: vStreamArgs,
  },
  handler: async (ctx, args) => {
    const { threadId, userId, streamArgs } = args;
    await authorizeMultiUserThreadAccess(ctx, threadId, userId);
    
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
 * Get thread details with user authorization
 */
export const getThreadDetails = query({
  args: { 
    threadId: v.string(),
    userId: v.optional(v.string())
  },
  handler: async (ctx, { threadId, userId }) => {
    await authorizeMultiUserThreadAccess(ctx, threadId, userId);
    
    const { title, summary } = await getThreadMetadata(ctx, components.agent, {
      threadId,
    });
    
    return { title, summary };
  },
});

/**
 * One-shot streaming (alternative approach)
 */
export const streamOneShot = action({
  args: { 
    prompt: v.string(), 
    threadId: v.string(),
    userId: v.optional(v.string())
  },
  handler: async (ctx, { prompt, threadId, userId }) => {
    await authorizeMultiUserThreadAccess(ctx, threadId, userId);
    const currentUserId = await getCurrentUserId(ctx, userId);
    
    await multiUserAgent.streamText(
      ctx,
      { threadId },
      { 
        prompt,
        system: `You are chatting with ${currentUserId}. Keep responses concise and engaging.`
      },
      { saveStreamDeltas: true }
    );
  },
});