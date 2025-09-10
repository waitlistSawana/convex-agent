# Convex Agent Context Management Research

## Overview

This document summarizes research on how Convex agents handle context alignment and system prompts, based on official Convex documentation.

## Key Findings

### 1. Agent Context Architecture

Convex agents provide built-in context management through several mechanisms:

- **Automatic Message History**: Conversation context is automatically included in each LLM call
- **Hybrid Search**: Built-in hybrid vector/text search for messages
- **Configurable Context**: The message history is provided by default as context, with configurable options

### 2. System Prompts & Instructions

Agents support system prompts through the `instructions` parameter:

```typescript
// Example agent configuration with system prompt
const agent = new Agent({
  instructions: "You are a helpful assistant.", // System prompt
  // other configuration...
});
```

Key points:
- System prompts can be configured when creating an Agent instance
- Default system prompt can be overridden 
- Instructions serve as the primary way to provide system-level guidance

### 3. Context Types and Usage

#### Message Context
- **Multiple Messages**: Can pass multiple messages for context while only saving the last one as the user's actual request
- **Extra Context**: Include additional messages for LLM context without persisting them

#### RAG Integration
- **Built-in Search**: Agent component has built-in capabilities to search message history with hybrid text & vector search
- **External Data**: Can use RAG component to search other data sources for context
- **Intelligent Search**: LLM can decide when to search for context by providing search tools

### 4. Context Configuration Options

The system provides flexibility in context management:

```typescript
// Configurable context provided to LLM
// Details available in LLM Context documentation
const contextConfig = {
  messageHistory: true, // Default
  hybridSearch: true,   // Built-in capability
  ragIntegration: true  // Optional external data
};
```

## Implementation Recommendations

### For Agents with Both Context Input and System Prompts:

1. **Combine Instructions with Context**:
   ```typescript
   const agent = new Agent({
     instructions: "You are a specialized assistant. Always consider the conversation history and provided context when responding.",
     // Context will be automatically included
   });
   ```

2. **Leverage Hybrid Search**:
   - Use built-in message search for historical context
   - Integrate RAG for domain-specific knowledge
   - Let LLM decide when additional context is needed

3. **Message Management**:
   - Include extra context messages that aren't persisted
   - Use the automatic message history for conversation flow
   - Configure context scope based on agent requirements

## Best Practices

1. **System Prompt Design**: Create clear, specific instructions that work with automatic context inclusion
2. **Context Layering**: Use system prompts for behavior, automatic context for conversation history, RAG for knowledge
3. **Search Integration**: Leverage hybrid search for relevant context retrieval
4. **Message Strategy**: Distinguish between context messages and persisted conversation

## Next Steps

- Implement a test agent combining system prompts with contextual inputs
- Experiment with RAG integration for external knowledge
- Test hybrid search capabilities for context retrieval