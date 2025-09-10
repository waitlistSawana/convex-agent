# System Commands Analysis for Convex Agents

## Executive Summary

Convex provides multiple pathways for agents to execute system commands and integrate with system-level operations. This analysis covers implementation strategies and best practices.

## System Command Integration Options

### 1. Model Context Protocol (MCP) Server
**Primary Recommendation**: Use MCP for structured system integration

**Setup**:
```bash
claude mcp add-json convex '{
  "type":"stdio",
  "command":"npx",
  "args":["convex","mcp","start"]
}'
```

**Available Tools**:
- `runOneoffQuery`: Execute read-only JavaScript queries
- `functionSpec`: Get function metadata
- `logs`: Fetch structured log entries

**Benefits**:
- Secure, sandboxed execution
- Structured data exchange
- Read-only operations for safety
- Integration with AI agent workflows

### 2. CLI Integration Modes

#### Local Development Mode (Default)
```typescript
// Agents use user credentials automatically
// Can execute: npx convex env list, npx convex dev, etc.
```

#### Anonymous Development Mode
```bash
export CONVEX_AGENT_MODE=anonymous
# Creates separate backend instance
# Safer for cloud-based agents
```

### 3. Workflow-Integrated Commands

**Pattern**: System commands within durable workflows
```typescript
const systemWorkflow = new Workflow({
  steps: [
    // Step 1: Execute system command
    async (ctx) => {
      const result = await ctx.runAction("api:systemCommand");
      return { systemOutput: result };
    },
    
    // Step 2: Process with agent
    async (ctx, {systemOutput}) => {
      const agent = new Agent({
        instructions: "Analyze system output and provide insights"
      });
      
      return await agent.generate({
        prompt: `System output: ${systemOutput}`
      });
    }
  ]
});
```

## Implementation Strategies

### 1. Reactive System Commands
**Use Case**: Respond to system events or queries

```typescript
export default action(async (ctx, args) => {
  // Execute system query via MCP
  const systemData = await ctx.runQuery("api:runOneoffQuery", {
    query: `
      import { query } from "convex:/_system/repl/wrappers.js";
      export default query({
        handler: async (ctx) => {
          return await ctx.db.query("${args.table}").collect();
        }
      });
    `
  });
  
  // Use results in agent context
  const agent = new Agent({
    instructions: "You are a system analyst. Provide insights based on current system state."
  });
  
  return await agent.streamText({
    prompt: `
      System Data: ${JSON.stringify(systemData)}
      User Query: ${args.message}
    `
  });
});
```

### 2. Proactive System Monitoring
**Use Case**: Continuous system monitoring with AI analysis

```typescript
// Scheduled function for system monitoring
export const systemMonitor = internalAction({
  handler: async (ctx) => {
    const workflow = new Workflow({
      steps: [
        // Gather system metrics
        async (ctx) => {
          const logs = await ctx.runAction("api:getLogs");
          const specs = await ctx.runAction("api:getFunctionSpec");
          return { logs, specs, timestamp: Date.now() };
        },
        
        // AI analysis
        async (ctx, {logs, specs, timestamp}) => {
          const agent = new Agent({
            instructions: "You are a system health monitor. Analyze metrics and identify issues."
          });
          
          const analysis = await agent.generate({
            prompt: `
              System Logs: ${JSON.stringify(logs.slice(-10))}
              Function Specs: ${Object.keys(specs).length} functions
              Timestamp: ${new Date(timestamp).toISOString()}
              
              Analyze for anomalies, performance issues, or optimization opportunities.
            `
          });
          
          return analysis;
        }
      ]
    });
    
    return await workflow.run();
  }
});
```

### 3. Interactive System Commands
**Use Case**: User-initiated system operations

```typescript
export default action(async (ctx, args) => {
  // Parse user intent for system commands
  const commandAgent = new Agent({
    instructions: `
      Determine if user wants to execute system commands.
      Available commands: logs, functionSpec, dataQuery
      Respond with: {"command": "commandName", "params": {...}}
    `
  });
  
  const commandIntent = await commandAgent.generateObject({
    prompt: args.message,
    schema: z.object({
      command: z.string(),
      params: z.record(z.any())
    })
  });
  
  // Execute system command based on intent
  let systemResult;
  switch (commandIntent.command) {
    case "logs":
      systemResult = await ctx.runAction("api:getLogs", commandIntent.params);
      break;
    case "functionSpec":
      systemResult = await ctx.runAction("api:getFunctionSpec");
      break;
    case "dataQuery":
      systemResult = await ctx.runQuery("api:runOneoffQuery", {
        query: commandIntent.params.query
      });
      break;
  }
  
  // Generate response with system data
  const responseAgent = new Agent({
    instructions: "Present system information in user-friendly format"
  });
  
  return await responseAgent.streamText({
    prompt: `
      Command: ${commandIntent.command}
      Results: ${JSON.stringify(systemResult)}
      User Context: ${args.message}
    `
  });
});
```

## Security & Best Practices

### 1. Security Considerations

**Principle of Least Privilege**:
- Use MCP tools for read-only operations when possible
- Implement command validation and sanitization
- Use anonymous mode for untrusted environments

**Access Control**:
```typescript
// Validate user permissions before system commands
const hasSystemAccess = await ctx.auth.getUserIdentity();
if (!hasSystemAccess || !hasSystemAccess.roles.includes('admin')) {
  throw new Error("Insufficient permissions for system commands");
}
```

### 2. Error Handling

**Graceful Degradation**:
```typescript
async function executeSystemCommand(ctx, command) {
  try {
    const result = await ctx.runAction(`api:${command}`);
    return { success: true, data: result };
  } catch (error) {
    console.error(`System command failed: ${command}`, error);
    return { 
      success: false, 
      error: error.message,
      fallback: "System information temporarily unavailable"
    };
  }
}
```

### 3. Performance Optimization

**Caching Strategy**:
```typescript
// Cache system command results
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const systemCache = new Map();

async function getCachedSystemData(ctx, command) {
  const cacheKey = `system:${command}`;
  const cached = systemCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  const fresh = await ctx.runAction(`api:${command}`);
  systemCache.set(cacheKey, { data: fresh, timestamp: Date.now() });
  return fresh;
}
```

## Advanced Integration Patterns

### 1. System Command Orchestration
```typescript
// Orchestrate multiple system commands
const systemOrchestrator = new Workflow({
  steps: [
    // Health check
    async (ctx) => ({
      health: await getCachedSystemData(ctx, "healthCheck")
    }),
    
    // Conditional detailed analysis
    async (ctx, {health}) => {
      if (health.status === "warning") {
        return {
          ...health,
          logs: await ctx.runAction("api:getLogs", { level: "error" }),
          metrics: await ctx.runAction("api:getMetrics")
        };
      }
      return health;
    },
    
    // AI-powered recommendations
    async (ctx, systemData) => {
      const agent = new Agent({
        instructions: "System optimization specialist. Provide actionable recommendations."
      });
      
      return await agent.generate({
        prompt: `System Analysis: ${JSON.stringify(systemData)}`
      });
    }
  ]
});
```

### 2. Real-time System Integration
```typescript
// Real-time system monitoring with streaming
export default action(async (ctx, args) => {
  return await ctx.runAction("api:streamSystemData", {
    onUpdate: async (data) => {
      const agent = new Agent({
        instructions: "Real-time system analyst"
      });
      
      return await agent.streamText({
        prompt: `New system data: ${JSON.stringify(data)}`
      });
    }
  });
});
```

## Conclusion

Convex agents provide robust system command integration through:

1. **MCP Server**: Secure, structured system access
2. **CLI Integration**: Direct command execution with proper access control
3. **Workflow Integration**: Durable execution with retry capabilities
4. **Context Integration**: Seamless combination of system data with conversation context

**Recommended Architecture**:
- Use MCP for read-only system queries
- Implement workflows for complex system operations
- Combine system commands with agent context for intelligent responses
- Apply security and performance best practices throughout

This enables building powerful agents that can interact with system state while maintaining security and reliability.