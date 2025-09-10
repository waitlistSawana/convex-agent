# Context Alignment Analysis for Convex Agents

## Executive Summary

Based on research of Convex documentation, here's how to implement agents with both context input and system prompts effectively.

## Context Alignment Strategy

### 1. Multi-Layer Context Architecture

Convex agents support a sophisticated multi-layer context system:

```
System Layer (Instructions) 
    ↓
Conversation Layer (Auto Message History)
    ↓
Knowledge Layer (RAG/Hybrid Search)
    ↓
Dynamic Layer (Workflow Context)
```

### 2. Implementation Pattern

**Recommended Architecture**:
```typescript
const contextAwareAgent = new Agent({
  // Layer 1: System Instructions
  instructions: `
    You are a specialized assistant that combines multiple context sources.
    Always consider:
    1. System-provided information
    2. Conversation history (automatically included)
    3. Retrieved knowledge from searches
    4. Current workflow state
  `,
  
  // Layer 2: Automatic conversation history (built-in)
  // Layer 3: RAG integration (optional)
  // Layer 4: Workflow context (via parameters)
});
```

### 3. Context Flow Patterns

#### Pattern A: Static System + Dynamic Context
```typescript
export default action(async (ctx, args) => {
  // Gather dynamic context
  const systemState = await getSystemState(ctx);
  const searchResults = await performSearch(args.query);
  
  const agent = new Agent({
    instructions: `Base system prompt here`,
  });
  
  // Dynamic context via prompt
  return await agent.streamText({
    prompt: `
      System Context: ${systemState}
      Search Results: ${searchResults}
      User Query: ${args.message}
    `,
    // Conversation history auto-included
  });
});
```

#### Pattern B: Workflow-Based Context Building
```typescript
const contextWorkflow = new Workflow({
  steps: [
    // Step 1: Build system context
    async (ctx) => ({
      system: await getSystemInfo(ctx),
      timestamp: Date.now()
    }),
    
    // Step 2: Add search context
    async (ctx, {system}) => ({
      ...system,
      knowledge: await searchKnowledge(ctx, args.query)
    }),
    
    // Step 3: Generate with full context
    async (ctx, contextData) => {
      const agent = new Agent({
        instructions: `
          System role with context awareness.
          Current system state: ${JSON.stringify(contextData)}
        `
      });
      
      return await agent.streamText({
        prompt: args.userMessage
      });
    }
  ]
});
```

## Key Findings on Context Alignment

### 1. Automatic Context Inclusion
- **Message History**: Always included by default
- **Hybrid Search**: Built-in text + vector search capability
- **Configuration**: Customizable via LLM Context settings

### 2. Context Layering Capabilities
- **System Level**: Instructions parameter for behavior
- **Conversation Level**: Automatic message history
- **Knowledge Level**: RAG integration for external data
- **Dynamic Level**: Runtime context via prompt parameters

### 3. Context Scope Management
- **Message Strategy**: Distinguish between context messages and persisted conversation
- **Search Integration**: Let LLM decide when to search for additional context
- **Context Boundaries**: Control what information is included in each layer

## Practical Implementation Guide

### Step 1: Define Context Layers
```typescript
interface ContextLayers {
  system: {
    role: string;
    capabilities: string[];
    constraints: string[];
  };
  conversation: {
    history: Message[]; // Auto-included
    currentTurn: string;
  };
  knowledge: {
    searchResults?: any[];
    ragData?: any[];
  };
  dynamic: {
    systemState?: any;
    workflowData?: any;
  };
}
```

### Step 2: Implement Context Builder
```typescript
async function buildContext(ctx: ActionCtx, args: any): Promise<ContextLayers> {
  return {
    system: {
      role: "Specialized assistant",
      capabilities: ["analysis", "synthesis", "recommendations"],
      constraints: ["accuracy", "helpfulness", "brevity"]
    },
    // conversation: handled automatically
    knowledge: {
      searchResults: await performHybridSearch(ctx, args.query),
      ragData: await getRagData(ctx, args.domain)
    },
    dynamic: {
      systemState: await getSystemState(ctx),
      workflowData: args.workflowContext
    }
  };
}
```

### Step 3: Create Context-Aware Agent
```typescript
export default action(async (ctx, args) => {
  const contextLayers = await buildContext(ctx, args);
  
  const agent = new Agent({
    instructions: `
      ${contextLayers.system.role}
      
      Capabilities: ${contextLayers.system.capabilities.join(', ')}
      Constraints: ${contextLayers.system.constraints.join(', ')}
      
      Current Context:
      - System State: Available via dynamic context
      - Knowledge Base: Available via search results
      - Conversation: Available via message history
    `
  });
  
  return await agent.streamText({
    prompt: `
      Knowledge Context: ${JSON.stringify(contextLayers.knowledge)}
      Dynamic Context: ${JSON.stringify(contextLayers.dynamic)}
      
      User Message: ${args.message}
    `
  });
});
```

## Best Practices for Context Alignment

### 1. Context Prioritization
- System instructions for behavior and constraints
- Conversation history for continuity
- Dynamic context for current state
- Knowledge base for factual information

### 2. Context Size Management
- Use hybrid search to find relevant context
- Summarize large context blocks
- Prioritize recent and relevant information

### 3. Context Validation
- Verify context freshness and accuracy
- Handle missing or incomplete context gracefully
- Provide fallback strategies when context is unavailable

### 4. Performance Considerations
- Cache frequently accessed context
- Use workflows for expensive context building
- Balance context richness with response time

## Testing Context Alignment

```typescript
// Test different context scenarios
const testCases = [
  {
    name: "System only",
    context: { system: true, conversation: false, knowledge: false, dynamic: false }
  },
  {
    name: "System + Conversation",
    context: { system: true, conversation: true, knowledge: false, dynamic: false }
  },
  {
    name: "Full context",
    context: { system: true, conversation: true, knowledge: true, dynamic: true }
  }
];
```

## Conclusion

Convex agents provide excellent support for multi-layered context alignment. The key is to:
1. Use instructions for system behavior
2. Leverage automatic message history for conversation context
3. Integrate RAG/search for knowledge context
4. Add dynamic context via workflow parameters
5. Test and validate context effectiveness

This architecture allows for sophisticated agents that can handle both contextual inputs and system prompts effectively.