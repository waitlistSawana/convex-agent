# Convex Agent Workflows & System Commands Research

## Overview

This document analyzes Convex agent workflows and system commands, focusing on how they manage context across multiple steps and integrate with system-level operations.

## Workflow Architecture

### 1. Workflow Component

Convex provides a dedicated `Workflow` component for managing multi-step AI workflows:

- **Durable Execution**: Long-running functions with retries and delays
- **State Persistence**: Survives server restarts and failures
- **Step-by-Step Recording**: Each step result is recorded
- **Resume Capability**: Resumes from latest incomplete step after failures

### 2. Workflow vs Agent Component

```typescript
// Agent Component - Basic AI interactions
const agent = new Agent({
  instructions: "Your system prompt",
  // Single-turn or simple multi-turn conversations
});

// Workflow Component - Complex multi-step processes
const workflow = new Workflow({
  // Builds on Workpool for durable execution
  // Provides retries and load balancing
  // Handles long-lived, durable workflows
});
```

### 3. Context Management in Workflows

**Cross-Step Context Persistence**:
- Each workflow step can access results from previous steps
- Context flows through the workflow automatically
- System maintains state between LLM calls

**Integration with Agent Context**:
- Workflows can use Agent components at each step
- Message history and context are maintained
- RAG and hybrid search work within workflow steps

## System Commands & Integration

### 1. CLI Integration

**Local Development**:
```bash
# Agents can run CLI commands using user credentials
npx convex env list
npx convex dev
npx convex logs
```

**Cloud-Based Agents**:
```bash
# Use anonymous mode for cloud environments
export CONVEX_AGENT_MODE=anonymous
```

### 2. MCP (Model Context Protocol) Server

Convex provides MCP server for system-level AI integration:

**Setup**:
```bash
claude mcp add-json convex '{
  "type":"stdio",
  "command":"npx",
  "args":["convex","mcp","start"]
}'
```

**Available Tools**:
- `runOneoffQuery`: Execute sandboxed JavaScript queries (read-only)
- `functionSpec`: Get metadata about deployed functions
- `logs`: Fetch structured log entries

### 3. Agent Mode Configuration

**Personal Development**:
- Agents use logged-in user credentials
- Direct access to personal dev environment
- Full CLI command capabilities

**Anonymous Development**:
- Separate Convex backend on VM
- Isolated environment for cloud agents
- Restricted but safe access

## Implementation Patterns

### 1. System Command + Context Pattern

```typescript
// Workflow step that combines system commands with context
const step = async (ctx, args) => {
  // 1. Execute system command (via MCP or CLI)
  const systemResult = await runSystemCommand();
  
  // 2. Use result as context for agent
  const agent = new Agent({
    instructions: `System context: ${systemResult}`,
  });
  
  // 3. Generate response with combined context
  return await agent.generate({
    prompt: args.userPrompt,
    // Automatic message history included
  });
};
```

### 2. Multi-Step Workflow with Context

```typescript
const workflow = new Workflow({
  steps: [
    // Step 1: Gather system info
    async (ctx) => {
      const logs = await ctx.runQuery("getLogs");
      return { systemContext: logs };
    },
    
    // Step 2: Use context in agent response
    async (ctx, {systemContext}) => {
      const agent = new Agent({
        instructions: "Analyze system logs and provide insights",
      });
      
      return await agent.generate({
        prompt: `Context: ${systemContext}`,
      });
    }
  ]
});
```

## Best Practices

### 1. Context Flow Design
- Pass relevant context between workflow steps
- Use system commands to gather real-time information
- Combine system state with conversation history

### 2. Error Handling
- Leverage workflow retry mechanisms
- Handle system command failures gracefully
- Maintain context even during failures

### 3. Security Considerations
- Use anonymous mode for untrusted environments
- Limit system command access appropriately
- Validate system inputs before using as context

### 4. Performance Optimization
- Cache system command results when possible
- Use durable workflows for expensive operations
- Balance between context richness and performance

## Use Cases

### 1. System Monitoring Agent
- Workflow gathers system metrics
- Agent analyzes trends with historical context
- Provides intelligent alerts and recommendations

### 2. Development Assistant
- Executes CLI commands to check project state
- Maintains conversation context about development tasks
- Provides contextual suggestions based on system state

### 3. Data Analysis Workflow
- Multi-step data processing with system commands
- Each step builds on previous context
- Final agent response synthesizes all information

## Configuration Example

```typescript
// Complete setup for system-integrated agent
export default action({
  handler: async (ctx, args) => {
    const workflow = new Workflow({
      steps: [
        // System information gathering
        async () => {
          const specs = await ctx.runQuery("api:functionSpec");
          return { systemInfo: specs };
        },
        
        // Context-aware agent response
        async (ctx, {systemInfo}) => {
          const agent = new Agent({
            instructions: `You are a system assistant with access to: ${JSON.stringify(systemInfo)}`,
          });
          
          return await agent.streamText({
            prompt: args.userMessage,
            // Automatic context inclusion
          });
        }
      ]
    });
    
    return await workflow.run();
  }
});
```