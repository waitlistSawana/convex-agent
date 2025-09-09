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

export default function ChatStreaming() {
  const createThread = useMutation(api.threads.createNewThread);
  const [threadId, setThreadId] = useState<string | undefined>(
    typeof window !== "undefined" ? getThreadIdFromHash() : undefined,
  );

  // Fetch thread title if threadId exists
  const threadDetails = useQuery(
    api.threads.getThreadDetails,
    threadId ? { threadId } : "skip",
  );

  // Fetch all threads (internal API)
  // For demo, hardcode userId as in backend
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
    void createThread({ title: "Fresh thread" }).then((newId) => {
      window.location.hash = newId;
      setThreadId(newId);
    });
  }, [createThread]);

  const resetThread = useCallback(() => {
    void createThread({
      title: "Streaming Chat Example",
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
            Streaming Chat Example
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
                  Welcome to Streaming Chat Demo
                </h2>
                <p className="text-gray-600 mb-6">
                  {threads.results?.length > 0 
                    ? "Select a thread from the sidebar to continue chatting, or create a new thread to start fresh."
                    : "Get started by creating your first thread using the button in the sidebar."
                  }
                </p>
                <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-500">
                  ✨ This demo features real-time streaming responses for a more interactive experience.
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
    api.chat.streaming.listThreadMessages,
    { threadId },
    { initialNumItems: 10, stream: true },
  );

  // If you don't want to use UIMessages, you can use this hook:
  // (note: you'll need to return MessageDoc from listThreadMessages)
  // const { results } = useThreadMessages(
  //   api.chat.streaming.listThreadMessages,
  //   { threadId },
  //   { initialNumItems: 10, stream: true },
  // );
  // const messages = toUIMessages(results ?? []);

  // If you only want to show streaming messages, you can use this hook:
  // const messages =
  //   useStreamingUIMessages(api.chat.streaming.listThreadMessages, {
  //     threadId,
  //     paginationOpts: { numItems: 10, cursor: null },
  //   }) ?? [];
  const sendMessage = useMutation(
    api.chat.streaming.initiateAsyncStreaming,
  ).withOptimisticUpdate(
    optimisticallySendMessage(api.chat.streaming.listThreadMessages),
  );
  const abortStreamByOrder = useMutation(
    api.chat.streamAbort.abortStreamByOrder,
  );
  const [prompt, setPrompt] = useState("Tell me a story");
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
    setPrompt("Continue the story...");
  }

  return (
    <>
      <div className="h-full flex flex-col w-full max-w-2xl">
        {/* Messages area - scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          {messages.length > 0 ? (
            <div className="flex flex-col gap-4 whitespace-pre">
              {toUIMessages(messages).map((m) => (
                <Message key={m.key} message={m} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Start a conversation...
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
              placeholder={
                messages.length > 0
                  ? "Continue the story..."
                  : "Tell me a story..."
              }
            />
            {toUIMessages(messages).find((m) => m.status === "streaming") ? (
              <button
                className="px-4 py-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition font-medium self-end"
                onClick={() => {
                  const order =
                    toUIMessages(messages).find((m) => m.status === "streaming")
                      ?.order ?? 0;
                  void abortStreamByOrder({ threadId, order });
                }}
                type="button"
              >
                Abort
              </button>
            ) : (
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition font-semibold disabled:opacity-50"
                disabled={!prompt.trim()}
              >
                Send
              </button>
            )}
            {messages.length > 0 && (
              <button
                className="px-4 py-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition font-medium self-end"
                onClick={() => {
                  reset();
                  setPrompt("Tell me a story");
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

function Message({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";
  const [visibleText] = useSmoothText(message.text, {
    // This tells the hook that it's ok to start streaming immediately.
    // If this was always passed as true, messages that are already done would
    // also stream in.
    // IF this was always passed as false (default), then the streaming message
    // wouldn't start streaming until the second chunk was received.
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
          isUser ? "bg-blue-100 text-blue-900" : "bg-gray-200 text-gray-800",
          {
            "bg-green-100": message.status === "streaming",
            "bg-red-100": message.status === "failed",
          },
        )}
      >
        {reasoningText && (
          <div className="text-xs text-gray-500">💭{reasoningText}</div>
        )}
        {visibleText || "..."}
      </div>
    </div>
  );
}
