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

export default function ChatSystemPrompts() {
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

  // 获取角色模板
  const roleTemplates = useQuery(api.chat.systemPrompts.getRoleTemplates, {});

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
    void createThread({ title: "System Prompts Demo" }).then((newId) => {
      window.location.hash = newId;
      setThreadId(newId);
    });
  }, [createThread]);

  const resetThread = useCallback(() => {
    void createThread({
      title: "System Prompts Demo",
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
      <header className="bg-gradient-to-r from-purple-50 to-pink-50 backdrop-blur-sm p-4 flex justify-between items-center border-b border-purple-200">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎭</span>
            <h1 className="text-xl font-semibold text-purple-900">
              System Prompts Demo
            </h1>
          </div>
          {threadId && threadDetails && threadDetails.title && (
            <span
              className="text-purple-600 text-base font-normal truncate max-w-xs"
              title={threadDetails.title}
            >
              &mdash; {threadDetails.title}
            </span>
          )}
        </div>
      </header>

      {/* Demo Tips */}
      <div className="bg-gradient-to-r from-purple-100 to-pink-100 px-4 py-3 border-b border-purple-200">
        <div className="flex items-center gap-3">
          <span className="text-purple-600 text-lg">💡</span>
          <div className="text-sm text-purple-800">
            <strong>体验不同的AI角色！</strong> 选择预设角色或自定义系统提示词，看看同样的问题如何产生截然不同的回答风格。
          </div>
        </div>
      </div>

      <div className="h-full flex flex-row bg-gray-50 flex-1 min-h-0">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r flex flex-col h-full min-h-0">
          <div className="p-4 border-b">
            <div className="font-semibold text-lg mb-3 text-purple-900">
              对话列表
            </div>
            <button
              onClick={newThread}
              className="w-full flex justify-center items-center gap-2 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
              type="button"
            >
              <span className="text-lg">🎭</span>
              <span>新建对话</span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto min-h-0">
            {threads.results.length === 0 && (
              <div className="p-4 text-gray-400 text-sm">
                暂无对话。点击上方按钮创建你的第一个对话。
              </div>
            )}
            <ul>
              {threads.results.map((thread) => (
                <li key={thread._id}>
                  <button
                    className={cn(
                      "w-full text-left px-4 py-2 hover:bg-purple-50 transition flex items-center gap-2",
                      threadId === thread._id &&
                        "bg-purple-100 text-purple-900 font-semibold",
                    )}
                    onClick={() => {
                      window.location.hash = thread._id;
                      setThreadId(thread._id);
                    }}
                  >
                    <span className="text-sm">🎭</span>
                    <span className="truncate max-w-[9rem]">
                      {thread.title || "System Prompts Demo"}
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
            <SystemPromptsChat 
              threadId={threadId} 
              reset={resetThread} 
              roleTemplates={roleTemplates}
            />
          ) : (
            <div className="text-center">
              <div className="max-w-md mx-auto">
                <div className="text-6xl mb-4">🎭</div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                  欢迎使用系统提示词演示
                </h2>
                <p className="text-gray-600 mb-6">
                  {threads.results?.length > 0
                    ? "从侧边栏选择一个对话继续聊天，或创建新对话开始体验不同的AI角色。"
                    : "点击侧边栏的按钮创建你的第一个对话，开始探索不同系统提示词的神奇效果。"}
                </p>
                <div className="bg-purple-50 rounded-lg p-4 text-sm text-purple-700 space-y-2">
                  <div>
                    ✨ 6种预设AI角色，每种都有独特的回答风格
                  </div>
                  <div>
                    🎨 支持自定义系统提示词，创造你专属的AI助手
                  </div>
                  <div>
                    🔄 实时切换角色，同一问题体验不同视角
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

function SystemPromptsChat({
  threadId,
  reset,
  roleTemplates,
}: {
  threadId: string;
  reset: () => void;
  roleTemplates: Record<string, { name: string; description: string; prompt: string }> | undefined;
}) {
  const { results: messages } = useThreadMessages(
    api.chat.systemPrompts.listThreadMessages,
    { threadId },
    { initialNumItems: 10, stream: true },
  );

  const sendMessage = useMutation(
    api.chat.systemPrompts.initiateAsyncStreaming,
  ).withOptimisticUpdate(
    optimisticallySendMessage(api.chat.systemPrompts.listThreadMessages),
  );

  const [prompt, setPrompt] = useState("请介绍一下人工智能的发展历程");
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [showCustomEditor, setShowCustomEditor] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  function onSendClicked() {
    if (prompt.trim() === "") return;
    
    const messageData = {
      threadId,
      prompt,
      ...(selectedRole ? { selectedRole } : {}),
      ...(showCustomEditor && customPrompt ? { customPrompt } : {}),
    };
    
    void sendMessage(messageData).catch(() => setPrompt(prompt));
    setPrompt("");
  }


  const suggestions = [
    "请介绍一下人工智能的发展历程",
    "如何学习编程？",
    "什么是幸福？",
    "请分析一下全球气候变化问题",
    "如何提高工作效率？",
    "请解释什么是量子计算",
  ];

  const getCurrentRoleInfo = () => {
    if (showCustomEditor && customPrompt) {
      return { name: "🔧 自定义角色", description: "使用自定义系统提示词" };
    }
    if (selectedRole && roleTemplates?.[selectedRole]) {
      return roleTemplates[selectedRole];
    }
    return { name: "🤖 默认助手", description: "使用默认系统提示词" };
  };

  return (
    <>
      <div className="h-full flex flex-row w-full max-w-6xl gap-4">
        {/* 角色选择面板 */}
        <div className="w-80 bg-white rounded-lg border shadow-sm">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-lg text-purple-900 mb-2">
              🎭 选择AI角色
            </h3>
            <p className="text-xs text-gray-500">
              不同的角色会以截然不同的风格回答相同问题
            </p>
          </div>
          
          <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
            {/* 默认选项 */}
            <label className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="radio"
                name="role"
                value=""
                checked={selectedRole === "" && !showCustomEditor}
                onChange={(e) => {
                  setSelectedRole(e.target.value);
                  setShowCustomEditor(false);
                }}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="font-medium text-sm">🤖 默认助手</div>
                <div className="text-xs text-gray-500">标准对话模式</div>
              </div>
            </label>

            {/* 预设角色 */}
            {roleTemplates && Object.entries(roleTemplates).map(([key, role]) => (
              <label key={key} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="role"
                  value={key}
                  checked={selectedRole === key && !showCustomEditor}
                  onChange={() => {
                    setSelectedRole(key);
                    setShowCustomEditor(false);
                  }}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="font-medium text-sm">{role.name}</div>
                  <div className="text-xs text-gray-500">{role.description}</div>
                </div>
              </label>
            ))}

            {/* 自定义选项 */}
            <label className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="radio"
                name="role"
                value="custom"
                checked={showCustomEditor}
                onChange={() => {
                  setShowCustomEditor(true);
                  setSelectedRole("");
                }}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="font-medium text-sm">🔧 自定义角色</div>
                <div className="text-xs text-gray-500">编写你自己的系统提示词</div>
              </div>
            </label>
          </div>

          {/* 自定义提示词编辑器 */}
          {showCustomEditor && (
            <div className="p-4 border-t bg-gray-50">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                自定义系统提示词
              </label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="请输入你的自定义系统提示词..."
                className="w-full h-24 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>
          )}

          {/* 当前角色显示 */}
          <div className="p-4 border-t bg-purple-50">
            <div className="text-sm font-medium text-purple-900 mb-1">
              当前角色: {getCurrentRoleInfo().name}
            </div>
            <div className="text-xs text-purple-600">
              {getCurrentRoleInfo().description}
            </div>
          </div>
        </div>

        {/* 对话区域 */}
        <div className="flex-1 flex flex-col">
          {/* 功能按钮区 */}
          <div className="bg-white rounded-lg border shadow-sm p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-purple-700">🎭 角色对话模式</span>
              </div>
              {messages.length > 0 && (
                <button
                  className="px-3 py-1 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition font-medium text-sm"
                  onClick={() => {
                    reset();
                    setPrompt("请介绍一下人工智能的发展历程");
                  }}
                  type="button"
                >
                  🗑️ 清空对话
                </button>
              )}
            </div>
          </div>

          {/* Messages area - scrollable */}
          <div className="flex-1 overflow-y-auto bg-white rounded-lg border shadow-sm">
            {messages.length > 0 ? (
              // 正常对话模式
              <div className="p-6">
                <div className="flex flex-col gap-4 whitespace-pre">
                  {toUIMessages(messages).map((m) => (
                    <SystemPromptsMessage key={m.key} message={m} />
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </div>
            ) : (
              // 空状态
              <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4 p-6">
                <div className="text-4xl">🎭</div>
                <div className="text-center">
                  <div className="text-lg font-medium mb-2">
                    选择一个AI角色开始对话！
                  </div>
                  <div className="text-sm text-gray-400 mb-4">
                    试试这些问题，看看不同角色如何回答：
                  </div>
                  <div className="space-y-2">
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => setPrompt(suggestion)}
                        className="block w-full text-left px-3 py-2 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 text-sm transition"
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
          <div className="bg-white rounded-lg border shadow-sm p-4 mt-4">
            <form
              className="flex gap-2 items-end"
              onSubmit={(e) => {
                e.preventDefault();
                onSendClicked();
              }}
            >
              <div className="flex-1">
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-gray-50"
                  placeholder="输入你的问题，体验不同AI角色的回答..."
                />
              </div>
              <button
                type="submit"
                className="px-6 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition font-semibold disabled:opacity-50"
                disabled={!prompt.trim()}
              >
                发送
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

function SystemPromptsMessage({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";
  const [visibleText] = useSmoothText(message.text, {
    startStreaming: message.status === "streaming",
  });

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div className="max-w-lg">
        <div
          className={cn(
            "rounded-lg px-4 py-2 whitespace-pre-wrap shadow-sm",
            isUser
              ? "bg-purple-100 text-purple-900"
              : "bg-white text-gray-800 border border-gray-200",
            {
              "bg-green-100": message.status === "streaming",
              "bg-red-100": message.status === "failed",
            },
          )}
        >
          {!isUser && (
            <div className="flex items-center gap-2 mb-2 text-purple-600">
              <span className="text-lg">🎭</span>
              <span className="text-xs font-medium">AI Assistant</span>
            </div>
          )}
          {visibleText || "..."}
        </div>
      </div>
    </div>
  );
}