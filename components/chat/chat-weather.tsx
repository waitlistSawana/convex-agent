"use client";

import { useMutation, useQuery } from "convex/react";
import { Toaster } from "sonner";
import { usePaginatedQuery } from "convex-helpers/react";
import { api } from "../../convex/_generated/api";
import {
  optimisticallySendMessage,
  useSmoothText,
  useThreadMessages,
  toUIMessages,
  type UIMessage,
} from "@convex-dev/agent/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

function getThreadIdFromHash() {
  return window.location.hash.replace(/^#/, "") || undefined;
}

export default function ChatWeather() {
  const createThread = useMutation(api.threads.createNewThread);
  const [threadId, setThreadId] = useState<string | undefined>(
    typeof window !== "undefined" ? getThreadIdFromHash() : undefined,
  );

  // Fetch thread title if threadId exists
  const threadDetails = useQuery(
    api.threads.getThreadDetails,
    threadId ? { threadId } : "skip",
  );

  // Fetch all threads
  const threads = usePaginatedQuery(
    api.threads.listThreads,
    {},
    { initialNumItems: 20 },
  );

  // Listen for hash changes
  useEffect(() => {
    function onHashChange() {
      setThreadId(getThreadIdFromHash());
    }
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  // Reset handler: create a new thread and update hash
  const newThread = useCallback(() => {
    void createThread({ title: "Weather Chat" }).then((newId) => {
      window.location.hash = newId;
      setThreadId(newId);
    });
  }, [createThread]);

  const resetThread = useCallback(() => {
    void createThread({
      title: "Weather Query",
    }).then((newId) => {
      window.location.hash = newId;
      setThreadId(newId);
    });
  }, [createThread]);

  // When threads are loaded and no threadId in URL, select the latest thread
  useEffect(() => {
    if (!threadId && threads.results && threads.results.length > 0) {
      const latestThread = threads.results[0];
      window.location.hash = latestThread._id;
      setThreadId(latestThread._id);
    }
  }, [threadId, threads.results]);

  return (
    <div className="h-full flex flex-col">
      <header className="bg-blue-50/80 backdrop-blur-sm p-4 flex justify-between items-center border-b border-blue-200">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌤️</span>
            <h1 className="text-xl font-semibold text-blue-900">
              Weather Agent Demo
            </h1>
          </div>
          {threadId && threadDetails && threadDetails.title && (
            <span
              className="text-blue-600 text-base font-normal truncate max-w-xs"
              title={threadDetails.title}
            >
              &mdash; {threadDetails.title}
            </span>
          )}
        </div>
      </header>

      {/* Weather Tips */}
      <div className="bg-gradient-to-r from-blue-100 to-sky-100 px-4 py-3 border-b border-blue-200">
        <div className="flex items-center gap-3">
          <span className="text-blue-600 text-lg">💡</span>
          <div className="text-sm text-blue-800">
            <strong>Ask me about the weather!</strong> Try: "What's the weather
            in Beijing?", "Tell me about New York weather", or "How's the
            weather in Tokyo today?"
          </div>
        </div>
      </div>

      <div className="h-full flex flex-row bg-gray-50 flex-1 min-h-0">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r flex flex-col h-full min-h-0">
          <div className="p-4 border-b">
            <div className="font-semibold text-lg mb-3 text-blue-900">
              Weather Chats
            </div>
            <button
              onClick={newThread}
              className="w-full flex justify-center items-center gap-2 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              type="button"
            >
              <span className="text-lg">🌤️</span>
              <span>New Weather Chat</span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto min-h-0">
            {threads.results.length === 0 && (
              <div className="p-4 text-gray-400 text-sm">
                No weather chats yet. Create your first chat above.
              </div>
            )}
            <ul>
              {threads.results.map((thread) => (
                <li key={thread._id}>
                  <button
                    className={cn(
                      "w-full text-left px-4 py-2 hover:bg-blue-50 transition flex items-center gap-2",
                      threadId === thread._id &&
                        "bg-blue-100 text-blue-900 font-semibold",
                    )}
                    onClick={() => {
                      window.location.hash = thread._id;
                      setThreadId(thread._id);
                    }}
                  >
                    <span className="text-sm">🌤️</span>
                    <span className="truncate max-w-[9rem]">
                      {thread.title || "Weather Chat"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Main chat area */}
        <main className="flex-1 flex flex-col items-center justify-center p-8 h-full min-h-0">
          {threadId ? (
            <WeatherChat threadId={threadId} reset={resetThread} />
          ) : (
            <div className="text-center">
              <div className="max-w-md mx-auto">
                <div className="text-6xl mb-4">🌤️</div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                  Welcome to Weather Agent
                </h2>
                <p className="text-gray-600 mb-6">
                  {threads.results?.length > 0
                    ? "Select a weather chat from the sidebar to continue, or create a new chat to ask about weather in any location."
                    : "Get started by creating your first weather chat using the button in the sidebar."}
                </p>
                <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-700 space-y-2">
                  <div>
                    ✨ I can provide real-time weather information for any
                    location worldwide
                  </div>
                  <div>
                    🌍 Just ask about any city, and I'll fetch current weather
                    data
                  </div>
                  <div>
                    📺 I'll present it like a professional weather reporter
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
        <Toaster />
      </div>
    </div>
  );
}

function WeatherChat({
  threadId,
  reset,
}: {
  threadId: string;
  reset: () => void;
}) {
  const { results: messages } = useThreadMessages(
    api.chat.weather.listThreadMessages,
    { threadId },
    { initialNumItems: 10, stream: true },
  );

  const sendMessage = useMutation(
    api.chat.weather.initiateAsyncStreaming,
  ).withOptimisticUpdate(
    optimisticallySendMessage(api.chat.weather.listThreadMessages),
  );

  const [prompt, setPrompt] = useState("What's the weather like in Beijing?");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  function onSendClicked() {
    if (prompt.trim() === "") return;
    void sendMessage({ threadId, prompt }).catch(() => setPrompt(prompt));
    setPrompt("");
  }

  const suggestions = [
    "What's the weather in New York?",
    "How's the weather in London today?",
    "Tell me about Tokyo's weather",
    "What's the temperature in Paris?",
    "Is it raining in Seattle?",
  ];

  return (
    <>
      <div className="h-full flex flex-col w-full max-w-2xl">
        {/* Messages area - scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          {messages.length > 0 ? (
            <div className="flex flex-col gap-4 whitespace-pre">
              {toUIMessages(messages).map((m) => (
                <WeatherMessage key={m.key} message={m} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4">
              <div className="text-4xl">🌤️</div>
              <div className="text-center">
                <div className="text-lg font-medium mb-2">
                  Ask me about the weather!
                </div>
                <div className="text-sm text-gray-400 mb-4">
                  Try one of these suggestions:
                </div>
                <div className="space-y-2">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => setPrompt(suggestion)}
                      className="block w-full text-left px-3 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm transition"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Fixed input area at bottom */}
        <div className="border-t bg-white p-6">
          <form
            className="flex gap-2 items-center"
            onSubmit={(e) => {
              e.preventDefault();
              onSendClicked();
            }}
          >
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50"
              placeholder="Ask about weather in any city..."
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition font-semibold disabled:opacity-50"
              disabled={!prompt.trim()}
            >
              Ask Weather
            </button>
            {messages.length > 0 && (
              <button
                className="px-4 py-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition font-medium"
                onClick={() => {
                  reset();
                  setPrompt("What's the weather like in Beijing?");
                }}
                type="button"
              >
                Reset
              </button>
            )}
          </form>
        </div>
      </div>
    </>
  );
}

function WeatherMessage({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";
  const [visibleText] = useSmoothText(message.text, {
    startStreaming: message.status === "streaming",
  });
  const [reasoningText] = useSmoothText(
    message.parts
      .filter((p) => p.type === "reasoning")
      .map((p) => p.text)
      .join("\n") ?? "",
    {
      startStreaming: message.status === "streaming",
    },
  );

  // Extract tool calls from message parts
  const toolCalls =
    message.parts?.filter((p) => p.type?.startsWith("tool-")) ?? [];

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div className="max-w-lg">
        {/* Display tool calls */}
        {toolCalls.length > 0 && (
          <div className="mt-2 space-y-2">
            {toolCalls.map((toolCall, index) => (
              <ToolCallDisplay
                key={`${toolCall.type}-${index}`}
                toolCall={toolCall}
              />
            ))}
          </div>
        )}

        <div
          className={cn(
            "rounded-lg px-4 py-2 whitespace-pre-wrap shadow-sm",
            isUser
              ? "bg-blue-100 text-blue-900"
              : "bg-white text-gray-800 border border-gray-200",
            {
              "bg-green-100": message.status === "streaming",
              "bg-red-100": message.status === "failed",
            },
          )}
        >
          {!isUser && (
            <div className="flex items-center gap-2 mb-2 text-blue-600">
              <span className="text-lg">🌤️</span>
              <span className="text-xs font-medium">Weather Agent</span>
            </div>
          )}
          {reasoningText && (
            <div className="text-xs text-gray-500 mb-1">💭{reasoningText}</div>
          )}
          {visibleText || "..."}
        </div>
      </div>
    </div>
  );
}

function ToolCallDisplay({ toolCall }: { toolCall: any }) {
  // Extract tool name from type (e.g., "tool-getWeather" -> "getWeather")
  const toolName = toolCall.type?.replace("tool-", "") || "unknown";

  const getToolIcon = (toolName: string) => {
    switch (toolName) {
      case "getWeather":
        return "🌡️";
      case "geocode":
        return "🗺️";
      default:
        return "🔧";
    }
  };

  const getToolDescription = (toolName: string, input: any, output: any) => {
    switch (toolName) {
      case "getWeather":
        const coords =
          input?.latitude && input?.longitude
            ? `(${input.latitude}, ${input.longitude})`
            : "";
        return `Fetched weather data${coords}`;
      case "geocode":
        return `Looking up location: ${input?.location || input?.city || "Unknown"}`;
      default:
        return `Called ${toolName}`;
    }
  };

  const hasOutput = toolCall.output && Object.keys(toolCall.output).length > 0;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
      <div className="flex items-center gap-2 text-blue-700 mb-2">
        <span className="text-sm">{getToolIcon(toolName)}</span>
        <span className="text-xs font-medium">Tool Call: {toolName}</span>
        <span
          className={`text-xs px-2 py-1 rounded text-white ${
            toolCall.state === "output-available"
              ? "bg-green-500"
              : "bg-gray-400"
          }`}
        >
          {toolCall.state || "pending"}
        </span>
      </div>

      <div className="text-xs text-blue-600 mb-1">
        {getToolDescription(toolName, toolCall.input, toolCall.output)}
      </div>

      {hasOutput && (
        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs">
          <div className="font-medium text-green-700 mb-1">📋 Result:</div>
          <pre className="text-green-600 bg-green-100 p-2 rounded text-xs overflow-x-auto whitespace-pre-wrap">
            {JSON.stringify(toolCall.output, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
