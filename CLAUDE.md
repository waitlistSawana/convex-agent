# Convex Agent Demo

This is a demo project for building agents using Convex.

## Project Structure

This Next.js application demonstrates how to integrate Convex with AI agents for real-time chat functionality.

## Key Components

- **Chat Interface**: React components for streaming chat messages with agent responses
- **Convex Backend**: Real-time database and functions for agent interactions
- **Agent Integration**: AI agent capabilities built on top of Convex infrastructure

## Development Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run linting
- `npm run typecheck` - Run TypeScript type checking

## Development Environment

- **OS**: Windows 11
- **IDE**: Cursor
- **Terminal**: PowerShell (integrated in Cursor)

## 开发 SOP (Standard Operating Procedure) - 长期开发规范

**Claude 在所有开发任务中都应该严格遵循以下 SOP：**

当涉及到第三方资源，尤其开源框架，工具包，以及外部服务等内容时：

1. **先查看当前组件的实现方法** - 分析现有代码结构和实现逻辑
2. **搜索相关官方的文档** - 查找官方文档中的示例、说明或教程
3. **实施相关代码** - 基于分析和文档来实现改进

**重要提醒：这个 SOP 适用于所有后续的开发工作，不仅限于当前任务。**



我们当前的任务是更新我们的 /chat-demo 和 /chat-stream-demo 的组件表现。我要修改的地方如下，我们分别完成

1. chat-demo涉及的chatbasic组件当前虽然有历史threads列表，但是每当进入路由会自动创建并进入新的thread中。我希望默认进入时进入的是历史最新的一个对话，仅当没有对话时才创建新的对话。
2. chat-stream-demo 缺少历史对话列表，你参考一下 chatbasic 创建一个对话列表在右边，形式一致。