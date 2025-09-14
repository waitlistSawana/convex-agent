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

export default function ChatThreadManagement() {
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
    void createThread({ title: "Thread Management Chat" }).then((newId) => {
      window.location.hash = newId;
      setThreadId(newId);
    });
  }, [createThread]);

  const resetThread = useCallback(() => {
    void createThread({
      title: "Thread Title Demo",
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
      <header className="bg-purple-50/80 backdrop-blur-sm p-4 flex justify-between items-center border-b border-purple-200">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📝</span>
            <h1 className="text-xl font-semibold text-purple-900">
              Thread Management Demo
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
      
      {/* Thread Management Tips */}
      <div className="bg-gradient-to-r from-purple-100 to-pink-100 px-4 py-3 border-b border-purple-200">
        <div className="flex items-center gap-3">
          <span className="text-purple-600 text-lg">💡</span>
          <div className="text-sm text-purple-800">
            <strong>Ask me to manage thread titles!</strong> Try: &ldquo;Change this thread title to &lsquo;My Project Discussion&rsquo;&rdquo;, &ldquo;Suggest a better title for this conversation&rdquo;, or &ldquo;Update the title&rdquo;
          </div>
        </div>
      </div>

      <div className="h-full flex flex-row bg-gray-50 flex-1 min-h-0">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r flex flex-col h-full min-h-0">
          <div className="p-4 border-b">
            <div className="font-semibold text-lg mb-3 text-purple-900">Thread Chats</div>
            <button
              onClick={newThread}
              className="w-full flex justify-center items-center gap-2 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
              type="button"
            >
              <span className="text-lg">📝</span>
              <span>New Thread Chat</span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto min-h-0">
            {threads.results.length === 0 && (
              <div className="p-4 text-gray-400 text-sm">No thread chats yet. Create your first chat above.</div>
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
                    <span className="text-sm">📝</span>
                    <span className="truncate max-w-[9rem]">
                      {thread.title || "Thread Chat"}
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
            <ThreadManagementChat threadId={threadId} reset={resetThread} />
          ) : (
            <div className="text-center">
              <div className="max-w-md mx-auto">
                <div className="text-6xl mb-4">📝</div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                  Welcome to Thread Manager
                </h2>
                <p className="text-gray-600 mb-6">
                  {threads.results?.length > 0 
                    ? "Select a thread chat from the sidebar to continue, or create a new chat to manage thread titles."
                    : "Get started by creating your first thread chat using the button in the sidebar."
                  }
                </p>
                <div className="bg-purple-50 rounded-lg p-4 text-sm text-purple-700 space-y-2">
                  <div>✨ I can help you manage and update thread titles</div>
                  <div>🎯 Ask me to change titles or suggest better ones</div>
                  <div>📋 Perfect for organizing your conversations</div>
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

function ThreadManagementChat({ threadId, reset }: { threadId: string; reset: () => void }) {
  const { results: messages } = useThreadMessages(
    api.chat.threadManagement.listThreadMessages,
    { threadId },
    { initialNumItems: 10, stream: true },
  );

  const sendMessage = useMutation(
    api.chat.threadManagement.initiateAsyncStreaming,
  ).withOptimisticUpdate(
    optimisticallySendMessage(api.chat.threadManagement.listThreadMessages),
  );
  
  const [prompt, setPrompt] = useState("Please suggest a good title for this conversation");
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
    "Change this thread title to 'Project Discussion'",
    "Update the title to something more descriptive",
    "Suggest a better title for our conversation",
    "Please rename this thread to 'Team Planning'",
    "What would be a good title for this chat?",
  ];

  return (
    <>
      <div className="h-full flex flex-col w-full max-w-2xl">
        {/* Messages area - scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          {messages.length > 0 ? (
            <div className="flex flex-col gap-4 whitespace-pre">
              {toUIMessages(messages).map((m) => (
                <ThreadManagementMessage key={m.key} message={m} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4">
              <div className="text-4xl">📝</div>
              <div className="text-center">
                <div className="text-lg font-medium mb-2">Ask me to manage thread titles!</div>
                <div className="text-sm text-gray-400 mb-4">Try one of these suggestions:</div>
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
              className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-gray-50"
              placeholder="Ask me to manage thread titles..."
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition font-semibold disabled:opacity-50"
              disabled={!prompt.trim()}
            >
              Manage Title
            </button>
            {messages.length > 0 && (
              <button
                className="px-4 py-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition font-medium"
                onClick={() => {
                  reset();
                  setPrompt("Please suggest a good title for this conversation");
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

function ThreadManagementMessage({ message }: { message: UIMessage }) {
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
  
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "rounded-lg px-4 py-2 max-w-lg whitespace-pre-wrap shadow-sm",
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
            <span className="text-lg">📝</span>
            <span className="text-xs font-medium">Thread Manager</span>
          </div>
        )}
        {reasoningText && (
          <div className="text-xs text-gray-500 mb-1">💭{reasoningText}</div>
        )}
        {visibleText || "..."}
      </div>
    </div>
  );
}