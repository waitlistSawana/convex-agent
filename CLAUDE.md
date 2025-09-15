# Convex Agent Demo

A comprehensive demo project showcasing **Convex AI Agents** with Next.js, featuring real-time chat, human-in-the-loop interactions, and external tool integrations.

## 🎯 Project Overview

### Key Features
- **Real-time Streaming Chat** - Convex-powered real-time AI conversations
- **Human-in-the-Loop** - AI requests human confirmation for specific actions
- **External Tool Integration** - Weather API and thread management tools
- **Multi-User Data Isolation** - Complete user separation with theme-based UI
- **Dynamic System Prompts** - Runtime role switching and comparison
- **Tool Call Visualization** - Transparent AI decision-making process

### Tech Stack
- **Frontend**: Next.js 15 + React 18 + TypeScript
- **Backend**: Convex (real-time database + agent functions)
- **AI**: Convex Agent framework with streaming capabilities
- **Tools**: Weather API, Thread management, Human confirmation, User authorization

## 🚀 Demo Applications

### Available Demos (`/app/`)
1. **💬 Basic Chat** (`/chat-demo`) - Simple AI chat
2. **⚡ Streaming Chat** (`/chat-stream-demo`) - Real-time streaming responses  
3. **🤔 Human-in-Loop** (`/chat-ask-human-demo`) - Human confirmation workflow
4. **🌤️ Weather Agent** (`/chat-weather-demo`) - Real-time weather data with tool calls
5. **📝 Thread Manager** (`/chat-thread-management-demo`) - AI manages thread titles
6. **🎭 System Prompts Demo** (`/chat-system-prompts-demo`) - Dynamic system prompt switching & role comparison
7. **👥 Multi-User Demo** (`/chat-multi-user-demo`) - Complete user isolation with theme-based UI

## 🛠️ Development Environment

- **OS**: Windows 11 | **IDE**: Cursor | **Terminal**: PowerShell
- **Commands**: `pnpm dev` 启动服务，通过 `convex mcp` 访问状态和调试信息

### Development SOP
**Claude必须遵循的开发流程:**
1. **分析现有实现** - 审查代码结构和逻辑
2. **查阅官方文档** - 搜索官方示例和教程  
3. **基于研究实现** - 应用文档指导的最佳实践

## 🔧 核心技术实现

### Human-in-the-Loop 模式 (`/chat-ask-human-demo`)

#### 关键词识别逻辑
- **按钮确认**: 用户消息包含`按钮` → 显示确认/取消按钮
- **对话确认**: 用户消息包含`对话` → AI通过对话确认
- **随机模式**: 其他结束意图 → 系统随机选择确认方式

#### 触发关键词
`结束`、`终止`、`再见`、`拜拜`、`goodbye`、`bye`、`88`、`走了`、`离开` 等

#### 技术架构修复要点
```typescript
// 使用 Convex createTool 而非 AI SDK tool
const confirmExit = createTool({
  args: z.object({ exitType, message }),
  handler: async (ctx, args) => { ... }
});

// 正确的工具响应流程
await humanLoopAgent.saveMessage(ctx, {
  message: {
    role: "tool",
    content: toolResult,
    tool_call_id: toolCallId,
  }
});
```

### Weather Agent (`/chat-weather-demo`)
- **外部API集成**: Geocoding + Weather API
- **工具调用可视化**: 显示完整的工具执行过程
- **TV播报员风格**: 专业天气报告口吻

### Thread Manager (`/chat-thread-management-demo`)  
- **上下文感知**: AI根据对话内容智能建议标题
- **实时更新**: 通过Convex实时同步标题变更

### System Prompts Demo (`/chat-system-prompts-demo`)
- **动态角色切换**: 使用`system`参数实时覆盖agent的instructions
- **预设角色模板**: 7种精心设计的AI角色（学者、诗人、商务专家、技术极客、儿童导师、侦探、哲学家）
- **自定义系统提示词**: 用户可编辑和测试自己的系统提示词
- **角色对比模式**: 同一问题，多个角色同时回答进行效果对比
- **实时角色信息**: UI显示当前激活角色和描述

### Multi-User Demo (`/chat-multi-user-demo`)
- **完全数据隔离**: 基于线程级用户授权的数据安全隔离
- **用户切换机制**: localStorage持久化 + 状态重置的无缝切换体验
- **主题化UI**: 每个用户独特的颜色方案和视觉标识
- **权限控制**: 在每个API调用层面验证用户访问权限
- **历史记录隔离**: 用户只能查看和管理自己的对话线程

#### 核心隔离机制
```typescript
// 线程访问权限验证
export async function authorizeMultiUserThreadAccess(
  ctx: QueryCtx | ActionCtx,
  threadId: string,
  userId?: string,
) {
  const currentUserId = await getCurrentUserId(ctx, userId);
  const { userId: threadUserId } = await getThreadMetadata(
    ctx, components.agent, { threadId }
  );
  
  // 🔒 强制数据隔离
  if (threadUserId && threadUserId !== currentUserId) {
    throw new Error(`Unauthorized access`);
  }
}

// 用户特定的线程创建
const threadId = await createThread(ctx, components.agent, {
  userId: currentUserId,  // 🏷️ 线程所有权绑定
  title: `${currentUserId}'s Chat`,
});
```

#### 前端用户管理
```typescript
// 用户切换逻辑
const switchUser = useCallback((newUser: DemoUser) => {
  setCurrentUser(newUser);
  setCurrentUserInStorage(newUser.id);
  
  // 🧹 清空状态强制重新加载用户数据
  window.location.hash = "";
  setThreadId(undefined);
}, []);

// 用户专属查询
const threads = usePaginatedQuery(
  api.chat.multiUser.listUserThreads,
  { userId: currentUser.id },  // 仅查询当前用户数据
  { initialNumItems: 20 }
);
```

## 📚 Convex Agent 开发资源

### 核心研究文档 (`/docs/`)
- **`convex-agent-context.md`** - Agent上下文管理机制 (消息历史、RAG、系统提示词)
- **`convex-agent-workflows.md`** - Workflow和系统命令集成 (持久执行、MCP服务器)  
- **`context-alignment-analysis.md`** - 上下文对齐实践指南 (多层架构、最佳实践)
- **`system-commands-analysis.md`** - 系统命令集成策略 (MCP vs CLI、安全控制)

### 关键技术模式

#### Agent 上下文架构
```typescript
// 多层上下文设计
const agent = new Agent({
  instructions: "系统提示词",        // 系统层
  // 自动包含消息历史                // 对话层
});

// 动态上下文注入
return await agent.streamText({
  prompt: `上下文: ${context}\n用户查询: ${message}`
});

// 动态系统提示词覆盖 (System Prompts Demo核心技术)
const result = await agent.streamText(
  ctx,
  { threadId },
  { 
    promptMessageId,
    system: selectedRolePrompt // 🔥 覆盖默认instructions
  },
  { saveStreamDeltas: { chunking: "word", throttleMs: 100 } }
);
```

#### 核心发现
1. **上下文层级**: 系统指令 → 消息历史 → RAG → 动态上下文
2. **工具集成**: 使用`createTool`而非AI SDK `tool`
3. **消息流**: 工具调用必须有对应的tool response消息
4. **实时更新**: Convex streaming + 状态同步
5. **动态系统提示词**: 使用`system`参数可覆盖agent的默认instructions，实现运行时角色切换
6. **多用户数据隔离**: 通过线程元数据中的userId实现用户级权限控制和数据隔离

## 🔍 工具调用可视化实现

### 核心技术发现

#### Convex Agent 工具调用数据结构
```typescript
// message.parts 中的实际数据格式
{
  "type": "tool-getWeather",    // 具体工具名，非通用"tool-call"
  "toolCallId": "call_00_...",
  "input": { latitude, longitude },      // 输入参数
  "state": "output-available",           // 执行状态  
  "output": { temperature, description } // 执行结果
}
```

#### 关键实现模式
```typescript
// 正确的工具调用检测
const toolCalls = message.parts?.filter(p => 
  p.type?.startsWith("tool-")
) ?? [];

// 工具名称提取
const toolName = toolCall.type?.replace("tool-", "") || "unknown";

// 状态可视化
const statusColor = toolCall.state === "output-available" 
  ? "bg-green-500" : "bg-orange-500";
```

### UI设计原则
- **分层展示**: 工具调用信息 → 输入参数 → 执行结果
- **状态指示**: 颜色编码的执行状态 (绿色=完成，橙色=进行中)
- **原始数据**: JSON格式展示完整的工具交互过程

## ✅ 项目完成状态

### 已实现的Demo
- ✅ **Basic Chat** - 简单AI对话
- ✅ **Streaming Chat** - 实时流式响应
- ✅ **Human-in-Loop** - 人机交互确认流程 (已修复)
- ✅ **Weather Agent** - 外部API集成 + 工具调用可视化
- ✅ **Thread Manager** - 上下文感知的标题管理
- ✅ **System Prompts Demo** - 动态角色切换 + 系统提示词对比展示
- ✅ **Multi-User Demo** - 完全数据隔离 + 用户主题切换

### 技术成果
- ✅ **Convex Agent架构理解** - 完整的技术文档和实现模式
- ✅ **工具调用透明化** - 用户可见的AI决策过程
- ✅ **Human-in-the-Loop修复** - 正确的工具响应流程
- ✅ **实时交互体验** - Streaming + 状态同步
- ✅ **动态系统提示词mastery** - 运行时角色切换 + 多角色对比技术
- ✅ **多用户数据隔离架构** - 线程级权限控制 + 用户状态管理 + 主题化UI系统

## 🔄 新Demo开发标准工作流程 (SOP)

### Phase 1: 需求分析与架构设计
1. **阅读项目文档** - 首先完整阅读CLAUDE.md了解项目背景、现有技术成果和开发规范
2. **理解需求** - 明确demo要展示的核心功能和技术点
3. **分析现有实现** - 读取相关现有demo代码，理解架构模式
4. **设计验证** - 与用户讨论架构方案，确保符合项目标准
   - ✅ 保持简洁 (3-4个文件)
   - ✅ 完全独立 (可复制粘贴)
   - ✅ 遵循现有模式

### Phase 2: 技术实现 (固定顺序)
1. **后端Agent配置** (`convex/agents/newDemo.ts`)
   - 定义agent personality和instructions
   - 配置必要的工具和参数
   
2. **后端API函数** (`convex/chat/newDemo.ts`)
   - 实现mutation和query函数
   - 添加必要的业务逻辑和权限控制
   
3. **前端组件** (`components/chat/chat-new-demo.tsx`)
   - 实现完整的UI逻辑和状态管理
   - 集成streaming和optimistic updates
   
4. **页面路由** (`app/new-demo/page.tsx`)
   - 简单的组件包装器
   
5. **主页集成** (`app/page.tsx`)
   - 添加demo入口链接

### Phase 3: 文档化与集成
1. **README.md 更新**
   - Available Demos列表
   - Completed Features  
   - Technical Achievements
   - 详细实现分析 (含代码示例)
   
2. **CLAUDE.md 更新**
   - 核心技术实现说明
   - 已实现Demo状态
   - 技术成果记录

### 🔑 关键原则
- **先分析，后实现** - 必须先理解现有代码结构
- **保持一致性** - 遵循现有的命名和架构模式  
- **完全独立** - 每个demo都应该可以独立复制到其他项目
- **文档同步** - 代码完成后立即更新文档

### 💡 技术要点
- 使用Convex Agent的内置功能而非自定义实现
- 每个API调用都考虑权限和安全
- 前端状态管理要简洁明了
- UI要有清晰的视觉区分和用户反馈

### 📋 实施检查清单
- [ ] 完整阅读CLAUDE.md项目文档
- [ ] 需求明确，架构设计经过验证
- [ ] 按固定顺序实现所有文件
- [ ] 代码遵循现有项目模式
- [ ] 完成README.md和CLAUDE.md文档更新
- [ ] 测试demo功能正常
- [ ] 确保代码可独立复制到其他项目

**成功标准**: 新demo与现有demo在代码质量、文档完整性和用户体验上保持一致，同时展示独特的技术创新点。
