// Human-in-the-loop agent for exit confirmation demo
import { Agent, createTool } from "@convex-dev/agent";
import { components } from "../_generated/api";
import { defaultConfig } from "./config";
import { z } from "zod";

// 定义确认工具 - 使用 Convex 的 createTool 实现 human-in-the-loop
const confirmExit = createTool({
  args: z.object({
    exitType: z.enum(["button", "conversation", "random"]).describe("Type of confirmation mode: button for button-based confirmation, conversation for dialog-based confirmation, random for system choice"),
    message: z.string().describe("A friendly message asking for confirmation to end the conversation"),
  }),
  description: "Request human confirmation before ending the conversation. Only use when user expresses intent to exit/end the chat.",
  handler: async (ctx, args) => {
    // 这个工具需要人工确认，返回待确认状态
    // 实际的确认结果将通过 handleConfirmation 处理
    return `Requesting ${args.exitType} confirmation: ${args.message}`;
  },
});

export const humanLoopAgent = new Agent(components.agent, {
  name: "Human Loop Agent", 
  instructions: `你是一个友好的聊天助手，专门演示 Human-in-the-loop 交互模式。

主要职责：
1. 与用户正常对话
2. 检测用户的结束意图（关键词：结束、终止、再见、拜拜、goodbye、bye、88、走了、离开等）
3. 当检测到结束意图时，根据用户消息中的关键词决定确认模式：
   - 包含"按钮"：使用按钮确认模式（exitType: "button"）
   - 包含"对话"：使用对话确认模式（exitType: "conversation"）  
   - 其他情况：随机选择模式（exitType: "random"）

注意事项：
- 只在用户明确表达结束意图时才调用 confirmExit 工具
- 确认消息要简洁友好
- 在调用工具后等待用户确认，不要继续生成内容`,

  tools: { confirmExit },
  ...defaultConfig,
});