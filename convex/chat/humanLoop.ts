// Human-in-the-loop chat functions
import { paginationOptsValidator } from "convex/server";
import {
  listMessages,
  syncStreams,
  vStreamArgs,
} from "@convex-dev/agent";
import { components, internal } from "../_generated/api";
import {
  action,
  internalAction,
  mutation,
  query,
} from "../_generated/server";
import { v } from "convex/values";
import { authorizeThreadAccess } from "../threads";
import { humanLoopAgent } from "../agents/humanLoop";

/**
 * 发送用户消息并触发AI响应
 */
export const initiateChat = mutation({
  args: { prompt: v.string(), threadId: v.string() },
  handler: async (ctx, { prompt, threadId }) => {
    await authorizeThreadAccess(ctx, threadId);
    const { messageId } = await humanLoopAgent.saveMessage(ctx, {
      threadId,
      prompt,
      skipEmbeddings: true,
    });
    await ctx.scheduler.runAfter(0, internal.chat.humanLoop.processMessage, {
      threadId,
      promptMessageId: messageId,
    });
  },
});

/**
 * 处理消息并生成AI响应
 */
export const processMessage = internalAction({
  args: { promptMessageId: v.string(), threadId: v.string() },
  handler: async (ctx, { promptMessageId, threadId }) => {
    const result = await humanLoopAgent.streamText(
      ctx,
      { threadId },
      { promptMessageId },
      { saveStreamDeltas: { chunking: "word", throttleMs: 100 } },
    );
    await result.consumeStream();
  },
});

/**
 * 处理用户的确认响应
 */
export const handleConfirmation = mutation({
  args: { 
    threadId: v.string(), 
    confirmed: v.boolean(),
    toolCallId: v.string(),
  },
  handler: async (ctx, { threadId, confirmed, toolCallId }) => {
    await authorizeThreadAccess(ctx, threadId);
    
    // 使用 Convex Agent 的正确 API 来提交工具响应
    const toolResult = confirmed ? "用户确认结束对话" : "用户取消结束对话";
    
    // 保存工具结果消息到消息历史中
    await humanLoopAgent.saveMessage(ctx, {
      threadId,
      message: {
        role: "tool",
        content: toolResult,
        tool_call_id: toolCallId,
      }
    });
    
    // 继续 agent 处理流程
    await ctx.scheduler.runAfter(0, internal.chat.humanLoop.continueAfterConfirmation, {
      threadId,
      confirmed,
    });
  },
});

/**
 * 在用户确认后继续 agent 处理流程
 */
export const continueAfterConfirmation = internalAction({
  args: { 
    threadId: v.string(), 
    confirmed: v.boolean(),
  },
  handler: async (ctx, { threadId, confirmed }) => {
    if (confirmed) {
      // 用户确认结束，让 agent 生成告别消息
      const result = await humanLoopAgent.streamText(
        ctx,
        { threadId },
        { 
          prompt: "用户确认了结束对话，请生成友好的告别消息并加上结束标识 [------ 对话结束 ------]",
        },
        { saveStreamDeltas: { chunking: "word", throttleMs: 100 } },
      );
      await result.consumeStream();
    } else {
      // 用户取消，让 agent 继续对话
      const result = await humanLoopAgent.streamText(
        ctx,
        { threadId },
        { 
          prompt: "用户取消了结束对话，请继续友好地与用户交流。",
        },
        { saveStreamDeltas: { chunking: "word", throttleMs: 100 } },
      );
      await result.consumeStream();
    }
  },
});

/**
 * 查询线程消息
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