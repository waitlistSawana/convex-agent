# Convex Agent Demo

A comprehensive demo project showcasing **Convex AI Agents** with Next.js, featuring real-time chat, human-in-the-loop interactions, and external tool integrations.

## 🎯 Project Overview

### Key Features
- **Real-time Streaming Chat** - Convex-powered real-time AI conversations
- **Human-in-the-Loop** - AI requests human confirmation for specific actions
- **External Tool Integration** - Weather API and thread management tools
- **Multiple Agent Types** - Basic chat, streaming, confirmation, and specialized agents

### Tech Stack
- **Frontend**: Next.js 15 + React 18 + TypeScript
- **Backend**: Convex (real-time database + agent functions)
- **AI**: Convex Agent framework with streaming capabilities
- **Tools**: Weather API, Thread management, Human confirmation

## 🚀 Demo Applications

### Available Demos (`/app/`)
1. **💬 Basic Chat** (`/chat-demo`) - Simple AI chat
2. **⚡ Streaming Chat** (`/chat-stream-demo`) - Real-time streaming responses  
3. **🤔 Human-in-Loop** (`/chat-ask-human-demo`) - Human confirmation workflow
4. **🌤️ Weather Agent** (`/chat-weather-demo`) - Real-time weather data with tool calls
5. **📝 Thread Manager** (`/chat-thread-management-demo`) - AI manages thread titles

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
```

#### 核心发现
1. **上下文层级**: 系统指令 → 消息历史 → RAG → 动态上下文
2. **工具集成**: 使用`createTool`而非AI SDK `tool`
3. **消息流**: 工具调用必须有对应的tool response消息
4. **实时更新**: Convex streaming + 状态同步

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

### 技术成果
- ✅ **Convex Agent架构理解** - 完整的技术文档和实现模式
- ✅ **工具调用透明化** - 用户可见的AI决策过程
- ✅ **Human-in-the-Loop修复** - 正确的工具响应流程
- ✅ **实时交互体验** - Streaming + 状态同步
