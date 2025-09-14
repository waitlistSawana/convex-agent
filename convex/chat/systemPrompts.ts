// System Prompts Demo Chat Functions
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
import { systemPromptsAgent, ROLE_TEMPLATES } from "../agents/systemPromptsDemo";

/**
 * 发送消息并指定系统提示词角色
 */
export const initiateAsyncStreaming = mutation({
  args: { 
    prompt: v.string(), 
    threadId: v.string(),
    selectedRole: v.optional(v.string()), // 选择的角色key
    customPrompt: v.optional(v.string()), // 自定义系统提示词
  },
  handler: async (ctx, { prompt, threadId, selectedRole, customPrompt }) => {
    await authorizeThreadAccess(ctx, threadId);
    const { messageId } = await systemPromptsAgent.saveMessage(ctx, {
      threadId,
      prompt,
      skipEmbeddings: true,
    });
    await ctx.scheduler.runAfter(0, internal.chat.systemPrompts.streamAsync, {
      threadId,
      promptMessageId: messageId,
      selectedRole,
      customPrompt,
    });
  },
});

/**
 * 异步生成流式响应，支持动态系统提示词
 */
export const streamAsync = internalAction({
  args: { 
    promptMessageId: v.string(), 
    threadId: v.string(),
    selectedRole: v.optional(v.string()),
    customPrompt: v.optional(v.string()),
  },
  handler: async (ctx, { promptMessageId, threadId, selectedRole, customPrompt }) => {
    // 确定要使用的系统提示词
    let systemPrompt: string | undefined;
    
    if (customPrompt) {
      // 优先使用自定义提示词
      systemPrompt = customPrompt;
    } else if (selectedRole && ROLE_TEMPLATES[selectedRole as keyof typeof ROLE_TEMPLATES]) {
      // 使用预设角色的提示词
      systemPrompt = ROLE_TEMPLATES[selectedRole as keyof typeof ROLE_TEMPLATES].prompt;
    }
    // 如果都没有，则使用agent默认的instructions
    
    const result = await systemPromptsAgent.streamText(
      ctx,
      { threadId },
      { 
        promptMessageId,
        ...(systemPrompt ? { system: systemPrompt } : {}) // 🔥 动态覆盖系统提示词
      },
      { saveStreamDeltas: { chunking: "word", throttleMs: 100 } },
    );
    await result.consumeStream();
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

/**
 * 获取所有可用的角色模板
 */
export const getRoleTemplates = query({
  args: {},
  handler: async (ctx, args) => {
    return ROLE_TEMPLATES;
  },
});