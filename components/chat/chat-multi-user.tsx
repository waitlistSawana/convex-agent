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

// Virtual users configuration (embedded for easy copying to other projects)
const DEMO_USERS = [
  { id: "alice", name: "Alice 👩‍💻", theme: "blue", description: "前端开发工程师" },
  { id: "bob", name: "Bob 👨‍🎨", theme: "green", description: "UI/UX设计师" }, 
  { id: "charlie", name: "Charlie 🧑‍🎓", theme: "purple", description: "产品经理" },
  { id: "diana", name: "Diana 👩‍🔬", theme: "pink", description: "数据科学家" },
  { id: "eve", name: "Eve 🧑‍💼", theme: "orange", description: "项目负责人" }
] as const;

type DemoUser = typeof DEMO_USERS[number];

// Theme configurations for each user
const USER_THEMES = {
  blue: {
    primary: "bg-blue-600 hover:bg-blue-700 text-white",
    secondary: "bg-blue-100 text-blue-900",
    accent: "bg-blue-50 border-blue-200",
    text: "text-blue-600"
  },
  green: {
    primary: "bg-green-600 hover:bg-green-700 text-white",
    secondary: "bg-green-100 text-green-900", 
    accent: "bg-green-50 border-green-200",
    text: "text-green-600"
  },
  purple: {
    primary: "bg-purple-600 hover:bg-purple-700 text-white",
    secondary: "bg-purple-100 text-purple-900",
    accent: "bg-purple-50 border-purple-200", 
    text: "text-purple-600"
  },
  pink: {
    primary: "bg-pink-600 hover:bg-pink-700 text-white",
    secondary: "bg-pink-100 text-pink-900",
    accent: "bg-pink-50 border-pink-200",
    text: "text-pink-600"
  },
  orange: {
    primary: "bg-orange-600 hover:bg-orange-700 text-white",
    secondary: "bg-orange-100 text-orange-900", 
    accent: "bg-orange-50 border-orange-200",
    text: "text-orange-600"
  }
} as const;

function getThreadIdFromHash() {
  return window.location.hash.replace(/^#/, "") || undefined;
}

function getCurrentUserFromStorage(): DemoUser {
  if (typeof window === "undefined") return DEMO_USERS[0];
  
  const stored = localStorage.getItem("multiuser-demo-current-user");
  if (stored) {
    const user = DEMO_USERS.find(u => u.id === stored);
    if (user) return user;
  }
  return DEMO_USERS[0];
}

function setCurrentUserInStorage(userId: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem("multiuser-demo-current-user", userId);
}

export default function ChatMultiUser() {
  const [currentUser, setCurrentUser] = useState<DemoUser>(getCurrentUserFromStorage);
  const createThread = useMutation(api.chat.multiUser.createUserThread);
  const [threadId, setThreadId] = useState<string | undefined>(
    typeof window !== "undefined" ? getThreadIdFromHash() : undefined,
  );

  // Get current user's theme
  const theme = USER_THEMES[currentUser.theme];

  // Fetch thread title if threadId exists
  const threadDetails = useQuery(
    api.chat.multiUser.getThreadDetails,
    threadId ? { threadId, userId: currentUser.id } : "skip",
  );

  // Fetch threads for current user only
  const threads = usePaginatedQuery(
    api.chat.multiUser.listUserThreads,
    { userId: currentUser.id },
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

  // Handle user switching
  const switchUser = useCallback((newUser: DemoUser) => {
    setCurrentUser(newUser);
    setCurrentUserInStorage(newUser.id);
    
    // Clear current thread when switching users
    window.location.hash = "";
    setThreadId(undefined);
  }, []);

  // Reset handler: create a new thread for current user
  const newThread = useCallback(() => {
    void createThread({ 
      title: `${currentUser.name} 的新对话`,
      userId: currentUser.id 
    }).then((newId) => {
      window.location.hash = newId;
      setThreadId(newId);
    });
  }, [createThread, currentUser]);

  const resetThread = useCallback(() => {
    void createThread({
      title: `Multi-User Chat - ${currentUser.name}`,
      userId: currentUser.id
    }).then((newId) => {
      window.location.hash = newId;
      setThreadId(newId);
    });
  }, [createThread, currentUser]);

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
      {/* Header with user selector */}
      <header className={cn("backdrop-blur-sm p-4 flex justify-between items-center border-b", theme.accent)}>
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold">
            Multi-User Chat Demo
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
        
        {/* User Selector */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">当前用户:</span>
          <select
            value={currentUser.id}
            onChange={(e) => {
              const newUser = DEMO_USERS.find(u => u.id === e.target.value);
              if (newUser) switchUser(newUser);
            }}
            className={cn(
              "px-3 py-2 rounded-lg border-2 font-medium transition focus:outline-none focus:ring-2 focus:ring-opacity-50",
              theme.accent,
              theme.text,
              "focus:ring-current"
            )}
          >
            {DEMO_USERS.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
          <div className={cn("px-3 py-2 rounded-lg text-sm", theme.secondary)}>
            {currentUser.description}
          </div>
        </div>
      </header>

      <div className="h-full flex flex-row bg-gray-50 flex-1 min-h-0">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r flex flex-col h-full min-h-0">
          <div className="p-4 border-b">
            <div className="font-semibold text-lg mb-3">
              {currentUser.name} 的对话
            </div>
            <button
              onClick={newThread}
              className={cn(
                "w-full flex justify-center items-center gap-2 py-2 rounded-lg transition font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-opacity-50",
                theme.primary,
                "focus:ring-current"
              )}
              type="button"
            >
              <span className="text-lg">+</span>
              <span>新对话</span>
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto min-h-0">
            {threads.results.length === 0 && (
              <div className="p-4 text-gray-400 text-sm">
                {currentUser.name} 还没有对话记录。点击上方按钮开始第一个对话。
              </div>
            )}
            <ul>
              {threads.results.map((thread) => (
                <li key={thread._id}>
                  <button
                    className={cn(
                      "w-full text-left px-4 py-2 hover:bg-opacity-10 hover:bg-current transition flex items-center gap-2",
                      theme.text,
                      threadId === thread._id && cn(theme.secondary, "font-semibold"),
                    )}
                    onClick={() => {
                      window.location.hash = thread._id;
                      setThreadId(thread._id);
                    }}
                  >
                    <span className="truncate max-w-[10rem]">
                      {thread.title || "无标题对话"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
          
          {/* User isolation notice */}
          <div className={cn("p-4 border-t text-xs", theme.accent)}>
            <div className="font-medium mb-1">🔒 数据隔离演示</div>
            <div className="text-gray-600">
              每个用户只能看到自己的对话记录，其他用户的数据完全隔离。
            </div>
          </div>
        </aside>

        {/* Main chat area */}
        <main className="flex-1 flex flex-col items-center justify-center p-8 h-full min-h-0">
          {threadId ? (
            <Story 
              threadId={threadId} 
              currentUser={currentUser}
              theme={theme}
              reset={resetThread} 
            />
          ) : (
            <div className="text-center">
              <div className="max-w-md mx-auto">
                <div className={cn("text-6xl mb-4")}>{currentUser.name.split(' ')[1]}</div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                  欢迎，{currentUser.name.split(' ')[0]}！
                </h2>
                <p className="text-gray-600 mb-6">
                  {threads.results?.length > 0 
                    ? "从左侧选择一个对话继续聊天，或创建新对话。"
                    : '点击左侧的"新对话"按钮开始您的第一次对话。'
                  }
                </p>
                <div className={cn("rounded-lg p-4 text-sm", theme.accent, theme.text)}>
                  ✨ 这是一个多用户隔离演示。切换不同用户可以体验数据完全隔离的效果。
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

function Story({ 
  threadId, 
  currentUser, 
  theme,
  reset 
}: { 
  threadId: string; 
  currentUser: DemoUser;
  theme: typeof USER_THEMES[keyof typeof USER_THEMES];
  reset: () => void; 
}) {
  const { results: messages } = useThreadMessages(
    api.chat.multiUser.listThreadMessages,
    { threadId, userId: currentUser.id },
    { initialNumItems: 10, stream: true },
  );

  const sendMessage = useMutation(
    api.chat.multiUser.initiateAsyncStreaming,
  ).withOptimisticUpdate(
    optimisticallySendMessage(api.chat.multiUser.listThreadMessages),
  );

  const [prompt, setPrompt] = useState("你好！我想和你聊天。");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  function onSendClicked() {
    if (prompt.trim() === "") return;
    void sendMessage({ 
      threadId, 
      prompt,
      userId: currentUser.id
    }).catch(() => setPrompt(prompt));
    setPrompt("");
  }

  return (
    <>
      <div className="h-full flex flex-col w-full max-w-2xl">
        {/* Messages area - scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          {messages.length > 0 ? (
            <div className="flex flex-col gap-4 whitespace-pre">
              {toUIMessages(messages).map((m) => (
                <Message key={m.key} message={m} theme={theme} />
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
              className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-current bg-gray-50"
              style={{ color: theme.text.replace('text-', '') }}
              placeholder={
                messages.length > 0
                  ? "继续对话..."
                  : `和 ${currentUser.name} 开始聊天...`
              }
            />
            <button
              type="submit"
              className={cn(
                "px-4 py-2 rounded-lg transition font-semibold disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-opacity-50",
                theme.primary,
                "focus:ring-current"
              )}
              disabled={!prompt.trim()}
            >
              发送
            </button>
            {messages.length > 0 && (
              <button
                className="px-4 py-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition font-medium"
                onClick={() => {
                  reset();
                  setPrompt("你好！我想和你聊天。");
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
  theme 
}: { 
  message: UIMessage;
  theme: typeof USER_THEMES[keyof typeof USER_THEMES];
}) {
  const isUser = message.role === "user";
  const [visibleText] = useSmoothText(message.text, {
    startStreaming: message.status === "streaming",
  });
  
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "rounded-lg px-4 py-2 max-w-lg whitespace-pre-wrap shadow-sm",
          isUser ? theme.secondary : "bg-gray-200 text-gray-800",
          {
            "bg-green-100": message.status === "streaming",
            "bg-red-100": message.status === "failed",
          },
        )}
      >
        {visibleText || "..."}
      </div>
    </div>
  );
}