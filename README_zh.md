# Convex Agent 演示项目

基于 Next.js 的 **Convex AI Agents** 综合演示，展示实时聊天、人机协作交互、外部工具集成和高级系统提示词管理。

## 🎯 项目概述

本项目通过6个不同的演示应用全面展示了 Convex Agent 框架的完整能力，每个演示都展示了 AI agent 开发和部署的不同方面。

### 核心特性
- **实时流式聊天** - 基于 Convex 的实时 AI 对话
- **人机协作** - AI 在特定操作中请求人工确认
- **外部工具集成** - 天气 API 和线程管理工具
- **动态系统提示词** - 运行时角色切换，支持多种 AI 人格
- **工具调用可视化** - AI 决策过程完全透明
- **多种 Agent 类型** - 基础聊天、流式、确认和专业化 agents

### 技术栈
- **前端**: Next.js 15 + React 18 + TypeScript
- **后端**: Convex (实时数据库 + agent 函数)
- **AI**: Convex Agent 框架 + DeepSeek Chat 模型
- **样式**: Tailwind CSS + shadcn/ui 组件
- **工具**: 天气 API、线程管理、人工确认

## 🚀 演示应用

### 1. 💬 基础聊天 (`/chat-demo`)
**文件位置:**
- 页面: `app/chat-demo/page.tsx`
- 组件: `components/chat/chat-basic.tsx`
- 后端: `convex/chat/basic.ts`
- Agent: `convex/agents/simple.ts`

**核心功能:**
- 支持乐观更新的简单 AI 聊天
- 带侧边栏导航的线程管理
- 支持分页的消息历史
- 表情符号友好的对话风格

**实现要点:**
```typescript
// 基础 agent 配置
export const agent = new Agent(components.agent, {
  name: "Basic Agent",
  instructions: "你是一个简洁的助手，适当使用表情符号和缩写如 lmao, lol, iirc, afaik 等。",
  ...defaultConfig,
});
```

**复制指南:**
1. 复制聊天组件结构
2. 实现线程管理钩子
3. 使用 `optimisticallySendMessage` 进行即时 UI 更新
4. 配置具有自定义指令的 agent

### 2. ⚡ 流式聊天 (`/chat-stream-demo`)
**文件位置:**
- 页面: `app/chat-stream-demo/page.tsx`
- 组件: `components/chat/chat-streaming.tsx`
- 后端: `convex/chat/streaming.ts`
- Agent: `convex/agents/story.ts`

**核心功能:**
- 具有单词级分块的实时流式响应
- 流中断功能
- 推理文本显示
- 使用 `useSmoothText` 的平滑文本动画

**实现要点:**
```typescript
// 自定义分块的流式配置
const result = await storyAgent.streamText(
  ctx,
  { threadId },
  { promptMessageId },
  { saveStreamDeltas: { chunking: "word", throttleMs: 100 } }
);
```

**技术细节:**
- 使用 `vStreamArgs` 实现实时流式传输
- 实现 `syncStreams` 进行多客户端同步
- 支持使用 `abortStreamByOrder` 中断流

### 3. 🤔 人机协作 (`/chat-ask-human-demo`)
**文件位置:**
- 页面: `app/chat-ask-human-demo/page.tsx`
- 组件: `components/chat/chat-human-loop.tsx`
- 后端: `convex/chat/humanLoop.ts`
- Agent: `convex/agents/humanLoop.ts`

**核心功能:**
- AI 在特定操作中请求人工确认
- 基于关键词的确认模式选择
- 完整输入输出显示的工具调用可视化
- 中文语言支持以提升用户体验

**实现要点:**
```typescript
// 人机协作工具定义
const confirmExit = createTool({
  args: z.object({
    exitType: z.enum(["button", "conversation", "random"]),
    message: z.string().describe("请求确认的友好消息"),
  }),
  description: "在结束对话前请求人工确认",
  handler: async (ctx, args) => {
    return `请求 ${args.exitType} 确认: ${args.message}`;
  },
});
```

**工作流架构:**
1. 用户用特定关键词表达退出意图
2. AI 检测意图并调用 `confirmExit` 工具
3. 前端显示确认 UI
4. 用户通过 `handleConfirmation` 变更进行确认/取消
5. AI 根据用户决定继续处理

### 4. 🌤️ 天气 Agent (`/chat-weather-demo`)
**文件位置:**
- 页面: `app/chat-weather-demo/page.tsx`
- 组件: `components/chat/chat-weather.tsx`
- 后端: `convex/chat/weather.ts`
- Agent: `convex/agents/weather.ts`
- 工具: `convex/tools/weather.ts`

**核心功能:**
- 实时天气数据集成
- 电视天气预报员人格
- 两步工具工作流（地理编码 → 天气）
- 完整的工具调用可视化

**实现要点:**
```typescript
// 具有工具和步骤控制的天气 agent
export const weatherAgent = new Agent(components.agent, {
  name: "Weather Agent",
  instructions: "你像电视天气预报员一样描述地点的天气。",
  tools: {
    getWeather,
    getGeocoding,
  },
  stopWhen: stepCountIs(3),
  ...defaultConfig,
});
```

**工具架构:**
- `getGeocoding`: 将地点名称转换为坐标
- `getWeather`: 从 Open-Meteo API 获取天气数据
- 两个工具都使用标准的 `ai` SDK 工具格式

### 5. 📝 线程管理器 (`/chat-thread-management-demo`)
**文件位置:**
- 页面: `app/chat-thread-management-demo/page.tsx`
- 组件: `components/chat/chat-thread-management.tsx`
- 后端: `convex/chat/threadManagement.ts`
- Agent: `convex/agents/threadManager.ts`
- 工具: `convex/tools/updateThreadTitle.ts`

**核心功能:**
- 上下文感知的线程标题建议
- 实时标题更新
- 通过自然语言进行线程管理

**实现要点:**
```typescript
// 使用 createTool 的线程管理工具
export const updateThreadTitle = createTool({
  args: z.object({
    title: z.string().describe("线程的新标题"),
  }),
  description: "更新当前线程的标题",
  handler: async (ctx, args) => {
    await ctx.runMutation(components.agent.threads.updateThread, {
      threadId: ctx.threadId,
      patch: { title: args.title },
    });
    return "updated";
  },
});
```

### 6. 🎭 系统提示词演示 (`/chat-system-prompts-demo`)
**文件位置:**
- 页面: `app/chat-system-prompts-demo/page.tsx`
- 组件: `components/chat/chat-system-prompts.tsx`
- 后端: `convex/chat/systemPrompts.ts`
- Agent: `convex/agents/systemPromptsDemo.ts`

**核心功能:**
- 7 种预定义的 AI 人格（学者、诗人、商务专家等）
- 自定义系统提示词编辑器
- 角色对比模式
- 运行时系统提示词切换

**实现要点:**
```typescript
// 动态系统提示词覆盖
const result = await systemPromptsAgent.streamText(
  ctx,
  { threadId },
  { 
    promptMessageId,
    system: selectedRolePrompt // 🔥 运行时系统提示词覆盖
  },
  { saveStreamDeltas: { chunking: "word", throttleMs: 100 } }
);
```

**角色模板:**
- **📚 学者**: 学术性、基于研究的回应
- **🎭 诗人**: 比喻性、艺术性语言
- **👨‍💼 商务专家**: 注重ROI、专业化
- **🤖 技术极客**: 技术术语、代码示例
- **👶 儿童导师**: 简单、鼓励性解释
- **🕵️ 侦探**: 逻辑分析、批判性思维
- **🤔 哲学家**: 深层含义、伦理视角

## 🔧 核心实现模式

### 1. Agent 架构模式
```typescript
export const agent = new Agent(components.agent, {
  name: "Agent 名称",
  instructions: "系统指令...",
  tools: { toolName },
  stopWhen: stepCountIs(3),
  ...defaultConfig,
});
```

### 2. 流式聊天模式
```typescript
// 用于乐观更新的变更
export const sendMessage = mutation({
  args: { prompt: v.string(), threadId: v.string() },
  handler: async (ctx, { prompt, threadId }) => {
    const { messageId } = await agent.saveMessage(ctx, { threadId, prompt });
    await ctx.scheduler.runAfter(0, internal.chat.streamAsync, {
      threadId, promptMessageId: messageId
    });
  },
});

// 用于流式传输的内部操作
export const streamAsync = internalAction({
  handler: async (ctx, { promptMessageId, threadId }) => {
    const result = await agent.streamText(ctx, { threadId }, { promptMessageId });
    await result.consumeStream();
  },
});
```

### 3. 工具集成模式
```typescript
// 使用 ai SDK 工具
export const weatherTool = tool({
  description: "获取天气数据",
  inputSchema: z.object({ location: z.string() }),
  execute: async ({ location }) => {
    // 外部 API 调用
    return weatherData;
  },
});

// 使用 Convex createTool 进行内部操作
export const updateTool = createTool({
  args: z.object({ data: z.string() }),
  description: "更新内部状态",
  handler: async (ctx, args) => {
    await ctx.runMutation(api.updateFunction, args);
    return "success";
  },
});
```

### 4. 工具调用可视化模式
```typescript
// 从消息部分提取和显示工具调用
const toolCalls = message.parts?.filter(p => p.type?.startsWith("tool-")) ?? [];

toolCalls.map(toolCall => ({
  name: toolCall.type?.replace("tool-", ""),
  input: toolCall.input || toolCall.args,
  output: toolCall.output || toolCall.result,
  state: toolCall.state
}));
```

### 5. 前端集成模式
```typescript
// 线程管理钩子
const { results: messages } = useThreadMessages(
  api.chat.listThreadMessages,
  { threadId },
  { initialNumItems: 10, stream: true }
);

// 乐观更新
const sendMessage = useMutation(api.chat.sendMessage)
  .withOptimisticUpdate(
    optimisticallySendMessage(api.chat.listThreadMessages)
  );

// 平滑流式文本
const [visibleText] = useSmoothText(message.text, {
  startStreaming: message.status === "streaming"
});
```

## 🛠️ 开发环境设置

### 前置条件
- Node.js 18+ 
- npm 或 pnpm
- Convex 账户
- DeepSeek API 密钥

### 安装
```bash
# 克隆仓库
git clone <repository-url>
cd convex-agent

# 安装依赖
npm install

# 设置 Convex
npx convex dev

# 在 Convex 仪表板中设置环境变量
# DEEPSEEK_API_KEY=your_api_key_here

# 启动开发服务器
npm run dev
```

### 环境变量
添加到你的 Convex 部署仪表板:
- `DEEPSEEK_API_KEY`: 你的 DeepSeek API 密钥

## 📁 项目结构

```
convex-agent/
├── app/                          # Next.js 页面
│   ├── chat-demo/               # 基础聊天演示
│   ├── chat-stream-demo/        # 流式聊天演示
│   ├── chat-ask-human-demo/     # 人机协作演示
│   ├── chat-weather-demo/       # 天气 Agent 演示
│   ├── chat-thread-management-demo/ # 线程管理器演示
│   └── chat-system-prompts-demo/ # 系统提示词演示
├── components/
│   └── chat/                    # 可复用聊天组件
│       ├── chat-basic.tsx
│       ├── chat-streaming.tsx
│       ├── chat-human-loop.tsx
│       ├── chat-weather.tsx
│       ├── chat-thread-management.tsx
│       └── chat-system-prompts.tsx
├── convex/
│   ├── agents/                  # Agent 配置
│   │   ├── simple.ts           # 基础聊天 agent
│   │   ├── story.ts            # 流式故事 agent
│   │   ├── humanLoop.ts        # 人机协作 agent
│   │   ├── weather.ts          # 带工具的天气 agent
│   │   ├── threadManager.ts    # 线程管理 agent
│   │   ├── systemPromptsDemo.ts # 系统提示词 agent
│   │   └── config.ts           # 共享 agent 配置
│   ├── chat/                   # 聊天 API 函数
│   │   ├── basic.ts
│   │   ├── streaming.ts
│   │   ├── humanLoop.ts
│   │   ├── weather.ts
│   │   ├── threadManagement.ts
│   │   └── systemPrompts.ts
│   ├── tools/                  # Agent 工具
│   │   ├── weather.ts          # 天气 API 工具
│   │   └── updateThreadTitle.ts # 线程管理工具
│   └── threads.ts              # 线程管理工具
└── docs/                       # 技术文档
```

## 🔍 关键技术发现

### 工具调用数据结构
Convex Agent 工具调用在消息部分中出现的结构：
```typescript
{
  "type": "tool-getWeather",        // 具体工具名称
  "toolCallId": "call_00_...",
  "input": { latitude, longitude },  // 输入参数
  "state": "output-available",       // 执行状态  
  "output": { temperature, description } // 执行结果
}
```

### 动态系统提示词
`streamText` 中的 `system` 参数会覆盖 agent 的默认指令：
```typescript
await agent.streamText(ctx, { threadId }, {
  promptMessageId,
  system: customSystemPrompt // 覆盖 agent.instructions
});
```

### 人机协作架构
1. Agent 检测触发条件
2. 调用带有可等待结果的 `createTool`
3. 前端显示确认 UI
4. 用户交互触发 `handleConfirmation` 变更
5. 使用 `agent.saveMessage` 保存工具响应
6. Agent 继续处理

### 流式实现
- 使用 `vStreamArgs` 支持实时流式传输
- `syncStreams` 处理多客户端同步
- `chunking: "word"` 提供平滑的逐词流式传输
- `throttleMs` 控制流式传输速度

## 🎯 复制指南

### 创建新演示：
1. **设计 Agent**: 在 `/convex/agents/` 中定义指令、工具和行为
2. **实现后端**: 在 `/convex/chat/` 中创建聊天函数
3. **构建前端**: 在 `/components/chat/` 中创建 React 组件
4. **添加页面**: 在 `/app/` 中创建 Next.js 页面
5. **测试集成**: 验证流式传输、工具和实时更新

### 最佳实践：
- 使用 `optimisticallySendMessage` 进行即时 UI 反馈
- 为工具故障实现适当的错误处理
- 为 AI 理解设计清晰的工具描述
- 为流式体验使用适当的分块
- 遵循既定的文件命名约定

### 常见模式：
- 变更 → 内部操作 → Agent → 流模式
- 带输入输出显示的工具调用可视化
- 基于线程的对话管理
- 使用 Convex 订阅的实时更新

## 📚 学习资源

- [Convex Agent 文档](https://docs.convex.dev/agents)
- [Agent 示例仓库](https://github.com/get-convex/agent)
- [Convex 仪表板](https://dashboard.convex.dev)
- [DeepSeek API 文档](https://platform.deepseek.com/docs)

## 🤝 贡献

本项目作为 Convex Agent 开发的综合参考。每个演示都是完全功能性的，展示了可适用于生产应用的真实世界实现模式。

欢迎扩展这些示例或按照既定模式创建新的演示！