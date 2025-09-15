# Welcome to your Convex + Next.js app

This is a [Convex](https://convex.dev/) project created with [`npm create convex`](https://www.npmjs.com/package/create-convex).

After the initial setup (<2 minutes) you'll have a working full-stack app using:

- Convex as your backend (database, server logic)
- [React](https://react.dev/) as your frontend (web page interactivity)
- [Next.js](https://nextjs.org/) for optimized web hosting and page routing
- [Tailwind](https://tailwindcss.com/) for building great looking accessible UI

## Get started

If you just cloned this codebase and didn't use `npm create convex`, run:

```
npm install
npm run dev
```

If you're reading this README on GitHub and want to use this template, run:

```
npm create convex@latest -- -t nextjs
```

## Learn more

To learn more about developing your project with Convex, check out:

- The [Tour of Convex](https://docs.convex.dev/get-started) for a thorough introduction to Convex principles.
- The rest of [Convex docs](https://docs.convex.dev/) to learn about all Convex features.
- [Stack](https://stack.convex.dev/) for in-depth articles on advanced topics.

## Join the community

Join thousands of developers building full-stack apps with Convex:

- Join the [Convex Discord community](https://convex.dev/community) to get help in real-time.
- Follow [Convex on GitHub](https://github.com/get-convex/), star and contribute to the open-source implementation of Convex.

## Sawana Turotial

### Copy Code from convex example git reposity

Just Copy Paste /components/ui/chats/ChatBasic.tsx .

Make sure all reqired imports success.

Add this comopnent to page.tsx and done!

https://github.com/get-convex/agent/blob/main/example

### Add environment variable to Convex Dashboard of Project

for ai providers api key.

## Available Demos

This project showcases multiple Convex AI Agent implementations:

1. **💬 Basic Chat** (`/chat-demo`) - Simple AI conversation
2. **⚡ Streaming Chat** (`/chat-stream-demo`) - Real-time streaming responses
3. **🤔 Human-in-Loop** (`/chat-ask-human-demo`) - Human confirmation workflow with button/dialog interactions
4. **🌤️ Weather Agent** (`/chat-weather-demo`) - External API integration with tool call visualization
5. **📝 Thread Manager** (`/chat-thread-management-demo`) - Context-aware thread title management
6. **🎭 System Prompts Demo** (`/chat-system-prompts-demo`) - Dynamic system prompt switching & role comparison
7. **👥 Multi-User Demo** (`/chat-multi-user-demo`) - User isolation and multi-user thread management

## Completed Features ✅

- ✅ **系统提示词配置** - Dynamic system prompt switching using `system` parameter
- ✅ **按钮工具调用** - Human-in-the-loop confirmation with button interactions
- ✅ **多角色对比** - Real-time role comparison and switching
- ✅ **工具调用可视化** - Complete tool execution process transparency
- ✅ **流式响应** - Real-time streaming chat experience
- ✅ **多用户隔离** - Complete data isolation between different users

## Technical Achievements

- **Dynamic System Prompt Override**: Runtime role switching using Convex Agent's `system` parameter
- **Multi-Agent Role Comparison**: Parallel agent responses for the same query
- **Human-in-the-Loop Workflow**: Proper tool response flow with user confirmation
- **External Tool Integration**: Weather API with geocoding and real-time data fetching
- **Real-time UI Updates**: Convex streaming with optimistic updates
- **Multi-User Data Isolation**: Thread-level user authorization with complete data separation

## 📁 Detailed Implementation Analysis

### File Structure by Demo

#### 1. **Basic Chat Demo** (`/chat-demo`)
```
app/chat-demo/page.tsx                 # Route entry point
components/chat/chat-basic.tsx         # UI component with thread management
convex/chat/basic.ts                   # Backend API functions
convex/agents/simple.ts                # Agent configuration
```

**Key Implementation:**
- Thread-based conversation management
- Optimistic updates with `optimisticallySendMessage`
- Emoji-friendly conversational agent
- Message pagination support

**Replication Pattern:**
```typescript
// Agent setup
export const agent = new Agent(components.agent, {
  name: "Basic Agent",
  instructions: "You are a concise assistant who responds with emojis...",
  ...defaultConfig,
});

// Frontend integration
const sendMessage = useMutation(api.chat.basic.sendMessage)
  .withOptimisticUpdate(
    optimisticallySendMessage(api.chat.basic.listThreadMessages)
  );
```

#### 2. **Streaming Chat Demo** (`/chat-stream-demo`)
```
app/chat-stream-demo/page.tsx
components/chat/chat-streaming.tsx     # Advanced streaming UI
convex/chat/streaming.ts               # Streaming backend logic
convex/agents/story.ts                 # Story-telling agent
convex/chat/streamAbort.ts            # Stream abortion support
```

**Key Implementation:**
- Real-time streaming with word-level chunking
- Stream abortion capability
- `useSmoothText` for gradual text appearance
- Reasoning text display

**Technical Details:**
```typescript
// Streaming configuration
const result = await storyAgent.streamText(
  ctx,
  { threadId },
  { promptMessageId },
  { saveStreamDeltas: { chunking: "word", throttleMs: 100 } }
);

// Frontend streaming hook
const [visibleText] = useSmoothText(message.text, {
  startStreaming: message.status === "streaming"
});
```

#### 3. **Human-in-Loop Demo** (`/chat-ask-human-demo`)
```
app/chat-ask-human-demo/page.tsx
components/chat/chat-human-loop.tsx    # Confirmation UI with buttons
convex/chat/humanLoop.ts               # Human confirmation workflow
convex/agents/humanLoop.ts             # Agent with confirmation tool
```

**Key Implementation:**
- Keyword-based confirmation mode selection
- Tool call visualization with complete input/output display
- Three confirmation modes: button, dialog, random
- Chinese language support

**Workflow Architecture:**
```typescript
// Tool definition
const confirmExit = createTool({
  args: z.object({
    exitType: z.enum(["button", "conversation", "random"]),
    message: z.string().describe("Confirmation message"),
  }),
  handler: async (ctx, args) => {
    return `Requesting ${args.exitType} confirmation: ${args.message}`;
  },
});

// Frontend confirmation handler
const onConfirm = async (toolCallId: string, confirmed: boolean) => {
  await handleConfirmation({ threadId, confirmed, toolCallId });
};
```

#### 4. **Weather Agent Demo** (`/chat-weather-demo`)
```
app/chat-weather-demo/page.tsx
components/chat/chat-weather.tsx       # Weather-themed UI
convex/chat/weather.ts                 # Weather chat backend
convex/agents/weather.ts               # TV reporter personality agent
convex/tools/weather.ts                # External API integration
```

**Key Implementation:**
- Two-step tool workflow: geocoding → weather
- TV weather reporter personality
- Complete tool execution visualization
- External API integration with error handling

**Tool Architecture:**
```typescript
// Weather tools using ai SDK
export const getGeocoding = tool({
  description: "Get the latitude and longitude of a location",
  inputSchema: z.object({
    location: z.string().describe("The location to geocode"),
  }),
  execute: async ({ location }) => {
    // Open-Meteo Geocoding API
    const response = await fetch(geocodingUrl);
    return { latitude, longitude, name };
  },
});

// Agent with tools and step control
export const weatherAgent = new Agent(components.agent, {
  instructions: "You describe the weather as if you were a TV weather reporter.",
  tools: { getWeather, getGeocoding },
  stopWhen: stepCountIs(3),
});
```

#### 5. **Thread Manager Demo** (`/chat-thread-management-demo`)
```
app/chat-thread-management-demo/page.tsx
components/chat/chat-thread-management.tsx  # Thread management UI
convex/chat/threadManagement.ts             # Thread operations backend
convex/agents/threadManager.ts              # Thread-aware agent
convex/tools/updateThreadTitle.ts           # Thread update tool
```

**Key Implementation:**
- Context-aware title suggestions
- Real-time thread title updates
- Natural language thread management
- Purple theme for visual distinction

**Tool Implementation:**
```typescript
// Convex createTool for internal operations
export const updateThreadTitle = createTool({
  args: z.object({
    title: z.string().describe("The new title for the thread"),
  }),
  handler: async (ctx, args) => {
    await ctx.runMutation(components.agent.threads.updateThread, {
      threadId: ctx.threadId,
      patch: { title: args.title },
    });
    return "updated";
  },
});
```

#### 6. **System Prompts Demo** (`/chat-system-prompts-demo`)
```
app/chat-system-prompts-demo/page.tsx
components/chat/chat-system-prompts.tsx     # Complex role-switching UI
convex/chat/systemPrompts.ts                # Dynamic system prompt backend
convex/agents/systemPromptsDemo.ts          # Role template definitions
```

**Key Implementation:**
- 7 predefined AI personalities with distinct styles
- Custom system prompt editor
- Role comparison mode for parallel responses
- Runtime system prompt override capability

**Role Template System:**
```typescript
// Predefined role templates
export const ROLE_TEMPLATES = {
  scholar: {
    name: "📚 学者",
    description: "严谨学术风格，引用研究，深度分析",
    prompt: `你是一位严谨的学者和研究员...`
  },
  poet: {
    name: "🎭 诗人", 
    description: "富有诗意，使用比喻，感性表达",
    prompt: `你是一位富有想象力的诗人...`
  },
  // ... more roles
};

// Dynamic system prompt override
const result = await systemPromptsAgent.streamText(
  ctx,
  { threadId },
  { 
    promptMessageId,
    system: selectedRolePrompt // 🔥 Runtime override
  }
);
```

#### 7. **Multi-User Demo** (`/chat-multi-user-demo`)
```
app/chat-multi-user-demo/page.tsx
components/chat/chat-multi-user.tsx        # Multi-user UI with user selector
convex/chat/multiUser.ts                   # Multi-user backend with isolation
convex/agents/multiUser.ts                 # Multi-user agent configuration
```

**Key Implementation:**
- Complete user data isolation with thread-level authorization
- User switching with localStorage persistence  
- Individual user themes and visual distinction
- Real-time user selection and state management
- Secure thread access control

**Authorization Architecture:**
```typescript
// User authorization for thread access
export async function authorizeMultiUserThreadAccess(
  ctx: QueryCtx | ActionCtx,
  threadId: string,
  userId?: string,
) {
  const currentUserId = await getCurrentUserId(ctx, userId);
  
  // Get thread owner from metadata
  const { userId: threadUserId } = await getThreadMetadata(
    ctx, components.agent, { threadId }
  );
  
  // 🔒 Enforce data isolation
  if (threadUserId && threadUserId !== currentUserId) {
    throw new Error(`Unauthorized access`);
  }
}

// User-specific thread creation
export const createUserThread = mutation({
  handler: async (ctx, { title, userId }) => {
    const currentUserId = await getCurrentUserId(ctx, userId);
    
    // Bind thread to user at creation
    const threadId = await createThread(ctx, components.agent, {
      userId: currentUserId,  // 🏷️ Thread ownership
      title: title || `${currentUserId}'s Chat`,
    });
    
    return threadId;
  },
});
```

**User Management Pattern:**
```typescript
// Virtual users for demonstration
const DEMO_USERS = [
  { id: "alice", name: "Alice 👩‍💻", theme: "blue", description: "前端开发工程师" },
  { id: "bob", name: "Bob 👨‍🎨", theme: "green", description: "UI/UX设计师" }, 
  // ... more users
] as const;

// User switching with state reset
const switchUser = useCallback((newUser: DemoUser) => {
  setCurrentUser(newUser);
  setCurrentUserInStorage(newUser.id);
  
  // 🧹 Clear current thread to force reload
  window.location.hash = "";
  setThreadId(undefined);
}, []);

// User-specific queries
const threads = usePaginatedQuery(
  api.chat.multiUser.listUserThreads,
  { userId: currentUser.id },  // 🎯 User-specific data
  { initialNumItems: 20 }
);
```

### Core Implementation Patterns

#### 1. **Mutation → Internal Action → Agent Pattern**
```typescript
// Step 1: Mutation for optimistic UI updates
export const sendMessage = mutation({
  handler: async (ctx, { prompt, threadId }) => {
    const { messageId } = await agent.saveMessage(ctx, { threadId, prompt });
    await ctx.scheduler.runAfter(0, internal.chat.processMessage, {
      threadId, promptMessageId: messageId
    });
  },
});

// Step 2: Internal action for agent processing
export const processMessage = internalAction({
  handler: async (ctx, { promptMessageId, threadId }) => {
    const result = await agent.streamText(ctx, { threadId }, { promptMessageId });
    await result.consumeStream();
  },
});
```

#### 2. **Tool Call Visualization Pattern**
```typescript
// Extract tool calls from message parts
const toolCalls = message.parts?.filter(p => p.type?.startsWith("tool-")) ?? [];

// Render tool execution details
function ToolCallDisplay({ toolCall }: { toolCall: any }) {
  const toolName = toolCall.type?.replace("tool-", "") || "unknown";
  const hasOutput = toolCall.output && Object.keys(toolCall.output).length > 0;
  
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium">Tool Call: {toolName}</span>
        <span className={`text-xs px-2 py-1 rounded text-white ${
          toolCall.state === "output-available" ? "bg-green-500" : "bg-orange-500"
        }`}>
          {toolCall.state || "pending"}
        </span>
      </div>
      
      {/* Input display */}
      {toolCall.input && (
        <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
          <pre>{JSON.stringify(toolCall.input, null, 2)}</pre>
        </div>
      )}
      
      {/* Output display */}
      {hasOutput && (
        <div className="mt-2 p-2 bg-green-50 rounded text-xs">
          <pre>{JSON.stringify(toolCall.output, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
```

#### 3. **Thread Management Pattern**
```typescript
// Thread state management
const [threadId, setThreadId] = useState<string | undefined>(
  typeof window !== "undefined" ? getThreadIdFromHash() : undefined
);

// URL-based thread navigation
useEffect(() => {
  function onHashChange() {
    setThreadId(getThreadIdFromHash());
  }
  window.addEventListener("hashchange", onHashChange);
  return () => window.removeEventListener("hashchange", onHashChange);
}, []);

// Thread creation with automatic navigation
const newThread = useCallback(() => {
  void createThread({ title: "New Chat" }).then((newId) => {
    window.location.hash = newId;
    setThreadId(newId);
  });
}, [createThread]);
```

#### 4. **Streaming Message Display Pattern**
```typescript
function StreamingMessage({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";
  const [visibleText] = useSmoothText(message.text, {
    startStreaming: message.status === "streaming"
  });
  
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div className={cn(
        "rounded-lg px-4 py-2 whitespace-pre-wrap shadow-sm",
        isUser ? "bg-blue-100 text-blue-900" : "bg-gray-200 text-gray-800",
        { "bg-green-100": message.status === "streaming" }
      )}>
        {visibleText || "..."}
      </div>
    </div>
  );
}
```

## 🔧 Developer Replication Guide

### Creating a New Demo

1. **Design Your Agent** (`convex/agents/yourAgent.ts`)
```typescript
export const yourAgent = new Agent(components.agent, {
  name: "Your Agent",
  instructions: "Your agent's personality and behavior...",
  tools: { yourTool }, // Optional
  ...defaultConfig,
});
```

2. **Implement Backend Functions** (`convex/chat/yourChat.ts`)
```typescript
export const sendMessage = mutation({
  args: { prompt: v.string(), threadId: v.string() },
  handler: async (ctx, { prompt, threadId }) => {
    const { messageId } = await yourAgent.saveMessage(ctx, { threadId, prompt });
    await ctx.scheduler.runAfter(0, internal.chat.yourChat.processMessage, {
      threadId, promptMessageId: messageId
    });
  },
});

export const processMessage = internalAction({
  handler: async (ctx, { promptMessageId, threadId }) => {
    const result = await yourAgent.streamText(ctx, { threadId }, { promptMessageId });
    await result.consumeStream();
  },
});

export const listThreadMessages = query({
  args: { threadId: v.string(), paginationOpts: paginationOptsValidator, streamArgs: vStreamArgs },
  handler: async (ctx, args) => {
    const streams = await syncStreams(ctx, components.agent, args);
    const paginated = await listMessages(ctx, components.agent, args);
    return { ...paginated, streams };
  },
});
```

3. **Build Frontend Component** (`components/chat/chat-your-demo.tsx`)
```typescript
export default function ChatYourDemo() {
  const { results: messages } = useThreadMessages(
    api.chat.yourChat.listThreadMessages,
    { threadId },
    { initialNumItems: 10, stream: true }
  );

  const sendMessage = useMutation(api.chat.yourChat.sendMessage)
    .withOptimisticUpdate(
      optimisticallySendMessage(api.chat.yourChat.listThreadMessages)
    );

  // Your UI implementation
  return <YourChatInterface />;
}
```

4. **Create Page Route** (`app/your-demo/page.tsx`)
```typescript
import ChatYourDemo from "@/components/chat/chat-your-demo";

export default function YourDemoPage() {
  return (
    <div id="YourDemoPage">
      <ChatYourDemo />
    </div>
  );
}
```

### Essential Dependencies
```json
{
  "dependencies": {
    "convex": "^1.x.x",
    "@convex-dev/agent": "^0.x.x",
    "@ai-sdk/deepseek": "^0.x.x",
    "ai": "^3.x.x",
    "zod": "^3.x.x"
  }
}
```

### Environment Setup
1. Add to Convex Dashboard:
   - `DEEPSEEK_API_KEY`: Your DeepSeek API key
2. Configure agent model in `convex/agents/config.ts`:
```typescript
import { deepseek } from "@ai-sdk/deepseek";

const languageModel = deepseek.chat("deepseek-chat");

export const defaultConfig = {
  languageModel,
  callSettings: { temperature: 1.0 },
} satisfies Config;
```

## 🎯 Key Learning Points

### Tool Integration Strategies
- **AI SDK Tools** (`tool()`) for external APIs
- **Convex Tools** (`createTool()`) for internal operations
- Tool state visualization enhances user understanding
- Proper error handling is crucial for tool reliability

### Streaming Best Practices
- Use `chunking: "word"` for natural text flow
- Implement `throttleMs` for performance control
- `useSmoothText` provides smooth UI experience
- Always `await result.consumeStream()` to complete streams

### Agent Design Principles
- Clear, specific instructions improve AI behavior
- Tool descriptions should be AI-readable
- `stopWhen` prevents infinite loops
- System prompt override enables runtime flexibility

### Frontend Integration Tips
- Optimistic updates improve perceived performance
- Thread-based navigation enhances user experience
- Real-time streaming requires proper state management
- Tool call visualization builds user trust

This comprehensive analysis provides developers with everything needed to understand, replicate, and extend these Convex Agent implementations. Each demo represents a different aspect of AI agent development, from basic chat to complex multi-modal interactions.
