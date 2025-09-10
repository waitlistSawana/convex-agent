# Convex Agent Research Documentation

This folder contains comprehensive research on Convex agent capabilities, focusing on context alignment and system command integration.

## Documents Overview

### 1. [convex-agent-context.md](./convex-agent-context.md)
**Core context management capabilities**
- Automatic message history inclusion
- Hybrid vector/text search
- RAG integration patterns
- System prompt configuration

### 2. [convex-agent-workflows.md](./convex-agent-workflows.md)
**Workflow and system command integration**
- Durable workflow execution
- MCP server integration
- CLI command patterns
- Cross-step context management

### 3. [context-alignment-analysis.md](./context-alignment-analysis.md)
**Practical implementation guide**
- Multi-layer context architecture
- Implementation patterns and code examples
- Best practices and testing strategies
- Performance considerations

### 4. [system-commands-analysis.md](./system-commands-analysis.md)
**System command integration strategies**
- MCP vs CLI approaches
- Security and access control
- Advanced integration patterns
- Error handling and caching

## Quick Reference

### Building Agents with Context + System Prompts

```typescript
// Recommended pattern
const agent = new Agent({
  instructions: "Your system prompt here", // System layer
  // Message history automatically included  // Conversation layer
});

// Add dynamic context via prompt
return await agent.streamText({
  prompt: `
    System Context: ${systemData}
    Knowledge: ${searchResults}
    User Query: ${userMessage}
  `
});
```

### Key Findings

1. **Context Layers**: System instructions + Auto message history + RAG + Dynamic context
2. **System Integration**: MCP server provides secure, structured system access
3. **Workflows**: Enable durable execution with context persistence across steps
4. **Security**: Anonymous mode for cloud agents, proper access control

### Next Steps

Based on this research, you can now implement Convex agents that effectively combine:
- System prompts for behavior guidance
- Contextual inputs from multiple sources
- System command execution for real-time data
- Durable workflows for complex operations

The documentation provides concrete patterns and examples for each capability.