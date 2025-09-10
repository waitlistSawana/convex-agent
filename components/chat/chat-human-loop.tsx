"use client";

import { useMutation, useQuery } from "convex/react";
import { toast, Toaster } from "sonner";
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

export default function ChatHumanLoop() {
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
    void createThread({ title: "Human-in-the-Loop Demo" }).then((newId) => {
      window.location.hash = newId;
      setThreadId(newId);
    });
  }, [createThread]);

  const resetThread = useCallback(() => {
    void createThread({
      title: "Human-in-the-Loop Demo",
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
      <header className="bg-white/80 backdrop-blur-sm p-4 flex justify-between items-center border-b">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold accent-text">
            Human-in-the-Loop Demo
          </h1>
          {threadId && threadDetails && threadDetails.title && (
            <span
              className="text-gray-500 text-base font-normal truncate max-w-xs"
              title={threadDetails.title}
            >
              &mdash; {threadDetails.title}
            </span>
          )}
        </div>
      </header>
      <div className="h-full flex flex-row bg-gray-50 flex-1 min-h-0">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r flex flex-col h-full min-h-0">
          <div className="p-4 border-b">
            <div className="font-semibold text-lg mb-3">Threads</div>
            <button
              onClick={newThread}
              className="w-full flex justify-center items-center gap-2 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              type="button"
            >
              <span className="text-lg">+</span>
              <span>New Thread</span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto min-h-0">
            {threads.results.length === 0 && (
              <div className="p-4 text-gray-400 text-sm">No threads yet. Create your first thread above.</div>
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
                    <span className="truncate max-w-[10rem]">
                      {thread.title || "Untitled thread"}
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
            <Story threadId={threadId} reset={resetThread} />
          ) : (
            <div className="text-center">
              <div className="max-w-md mx-auto">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                  欢迎使用 Human-in-the-Loop Demo
                </h2>
                <p className="text-gray-600 mb-6">
                  {threads.results?.length > 0 
                    ? "从侧边栏选择一个对话继续聊天，或创建新的对话开始演示。"
                    : "点击侧边栏的按钮创建你的第一个对话，开始体验 Human-in-the-Loop 功能。"
                  }
                </p>
                <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-500">
                  ✨ 这个演示展示了AI需要人类确认才能执行某些操作的交互模式。
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

function Story({ threadId, reset }: { threadId: string; reset: () => void }) {
  const { results: messages } = useThreadMessages(
    api.chat.humanLoop.listThreadMessages,
    { threadId },
    { initialNumItems: 10, stream: true },
  );

  const sendMessage = useMutation(
    api.chat.humanLoop.initiateChat,
  ).withOptimisticUpdate(
    optimisticallySendMessage(api.chat.humanLoop.listThreadMessages),
  );

  const handleConfirmation = useMutation(api.chat.humanLoop.handleConfirmation);
  
  const [prompt, setPrompt] = useState("你好，我想聊天");
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

  // 处理用户确认
  const onConfirm = async (toolCallId: string, confirmed: boolean) => {
    await handleConfirmation({ threadId, confirmed, toolCallId });
    
    if (confirmed) {
      toast.success("对话已结束", {
        description: "感谢使用 Human-in-the-Loop Demo！",
        duration: 3000,
      });
    } else {
      toast.info("继续对话", {
        description: "您选择了继续聊天",
        duration: 2000,
      });
    }
  };

  return (
    <>
      <div className="h-full flex flex-col w-full max-w-2xl">
        {/* 用户提示区域 */}
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4 rounded-r-lg">
          <div className="flex items-start">
            <span className="text-blue-400 mr-2">💡</span>
            <div className="text-sm text-blue-700">
              <div className="font-semibold mb-1">结束对话提示</div>
              <ul className="space-y-1 text-xs">
                <li>• 说包含"按钮"的结束语 → 按钮确认模式</li>
                <li>• 说包含"对话"的结束语 → 对话确认模式</li>
                <li>• 其他结束语 → 随机选择模式</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Messages area - scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          {messages.length > 0 ? (
            <div className="flex flex-col gap-4">
              {toUIMessages(messages).map((m) => (
                <Message 
                  key={m.key} 
                  message={m} 
                  onConfirm={onConfirm}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              开始对话...
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
              placeholder="试试说'按钮再见'或'对话结束'..."
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition font-semibold disabled:opacity-50"
              disabled={!prompt.trim()}
            >
              发送
            </button>
            {messages.length > 0 && (
              <button
                className="px-4 py-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition font-medium"
                onClick={() => {
                  reset();
                  setPrompt("你好，我想聊天");
                }}
                type="button"
              >
                重置
              </button>
            )}
          </form>
        </div>
      </div>
    </>
  );
}

function Message({ 
  message, 
  onConfirm 
}: { 
  message: UIMessage;
  onConfirm: (toolCallId: string, confirmed: boolean) => void;
}) {
  const isUser = message.role === "user";
  const [visibleText] = useSmoothText(message.text, {
    startStreaming: message.status === "streaming",
  });

  // 检查是否有工具调用需要确认
  const toolCalls = message.parts?.filter(p => p.type?.startsWith("tool-")) ?? [];
  const confirmExitToolCall = toolCalls.find(tc => 
    tc.type === "tool-confirmExit" || 
    tc.toolName === "confirmExit"
  );

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div className="max-w-lg">
        {/* Display tool calls */}
        {toolCalls.length > 0 && (
          <div className="mb-2 space-y-2">
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
            "rounded-lg px-4 py-2 shadow-sm",
            isUser ? "bg-blue-100 text-blue-900" : "bg-gray-200 text-gray-800",
            {
              "bg-green-100": message.status === "streaming",
              "bg-red-100": message.status === "failed",
            },
          )}
        >
          {visibleText || "..."}
        </div>
        
        {/* 显示确认按钮 */}
        {confirmExitToolCall && message.status !== "streaming" && (
          <div className="mt-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="text-sm text-yellow-800 mb-3">
              {(confirmExitToolCall.input?.message || confirmExitToolCall.args?.message)}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onConfirm(confirmExitToolCall.toolCallId, true)}
                className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition"
              >
                确认
              </button>
              <button
                onClick={() => onConfirm(confirmExitToolCall.toolCallId, false)}
                className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition"
              >
                取消
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ToolCallDisplay({ toolCall }: { toolCall: any }) {
  // Extract tool name from type or toolName property
  const toolName = toolCall.type?.replace("tool-", "") || toolCall.toolName || "unknown";

  const getToolIcon = (toolName: string) => {
    switch (toolName) {
      case "confirmExit":
        return "🤔";
      default:
        return "🔧";
    }
  };

  const getToolDescription = (toolName: string, input: any, args: any) => {
    // Support both input and args properties
    const params = input || args;
    switch (toolName) {
      case "confirmExit":
        const exitType = params?.exitType || "unknown";
        return `Requesting ${exitType} confirmation to end conversation`;
      default:
        return `Called ${toolName}`;
    }
  };

  const hasOutput = toolCall.output && Object.keys(toolCall.output).length > 0;
  const hasResult = toolCall.result;

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
      <div className="flex items-center gap-2 text-yellow-700 mb-2">
        <span className="text-sm">{getToolIcon(toolName)}</span>
        <span className="text-xs font-medium">Tool Call: {toolName}</span>
        <span
          className={`text-xs px-2 py-1 rounded text-white ${
            toolCall.state === "output-available" || hasResult || hasOutput
              ? "bg-green-500"
              : toolCall.state === "pending" || toolCall.state === "input-available"
              ? "bg-orange-500"  
              : "bg-gray-400"
          }`}
        >
          {toolCall.state || (hasResult ? "completed" : "pending")}
        </span>
      </div>

      <div className="text-xs text-yellow-600 mb-1">
        {getToolDescription(toolName, toolCall.input, toolCall.args)}
      </div>

      {/* Display input parameters */}
      {(toolCall.input || toolCall.args) && (
        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
          <div className="font-medium text-blue-700 mb-1">📝 Input:</div>
          <pre className="text-blue-600 bg-blue-100 p-2 rounded text-xs overflow-x-auto whitespace-pre-wrap">
            {JSON.stringify(toolCall.input || toolCall.args, null, 2)}
          </pre>
        </div>
      )}

      {/* Display output/result */}
      {(hasOutput || hasResult) && (
        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs">
          <div className="font-medium text-green-700 mb-1">📋 Result:</div>
          <pre className="text-green-600 bg-green-100 p-2 rounded text-xs overflow-x-auto whitespace-pre-wrap">
            {JSON.stringify(toolCall.output || toolCall.result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}