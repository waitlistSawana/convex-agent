import { components, internal } from "./_generated/api";
import { Agent, createThread, saveMessage } from "@convex-dev/agent";
import { deepseek } from "@ai-sdk/deepseek";

import { action, internalAction, mutation } from "./_generated/server";
import { v } from "convex/values";

const agent = new Agent(components.agent, {
  name: "My Agent",
  // deepseek from ai-sdk
  // see: https://ai-sdk.dev/providers/ai-sdk-providers/deepseek
  languageModel: deepseek("deepseek-chat"),
});

export const helloWorld = action({
  args: { prompt: v.string() },
  handler: async (ctx, { prompt }) => {
    const threadId = await createThread(ctx, components.agent);
    const result = await agent.generateText(ctx, { threadId }, { prompt });
    return result.text;
  },
});

export const generateReplyToPrompt = action({
  args: { prompt: v.string(), threadId: v.string() },
  handler: async (ctx, { prompt, threadId }) => {
    // await authorizeThreadAccess(ctx, threadId);
    const result = await agent.generateText(ctx, { threadId }, { prompt });
    return result.text;
  },
});

// #### Saving the prompt then generating response(s) asynchronously ####
// see: https://docs.convex.dev/agents/messages#saving-the-prompt-then-generating-responses-asynchronously

// Step 1: Save a user message, and kick off an async response.
export const sendMessage = mutation({
  args: { threadId: v.id("threads"), prompt: v.string() },
  handler: async (ctx, { threadId, prompt }) => {
    const userId = "test_123456";
    const { messageId } = await saveMessage(ctx, components.agent, {
      threadId,
      userId,
      prompt,
    });
    await ctx.scheduler.runAfter(0, internal.agent.generateResponseAsync, {
      threadId,
      promptMessageId: messageId, // *
    });
  },
});

// Step 2: Generate a response to a user message.
export const generateResponseAsync = internalAction({
  args: { threadId: v.string(), promptMessageId: v.string() },
  handler: async (ctx, { threadId, promptMessageId }) => {
    await agent.generateText(ctx, { threadId }, { promptMessageId });
  },
});

// This is a common enough need that there's a utility to save you some typing.
// Equivalent to the above.
// export const generateResponseAsync = agent.asTextAction();
