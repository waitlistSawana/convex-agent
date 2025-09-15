// Multi-user demo agent configuration
import { Agent } from "@convex-dev/agent";
import { components } from "../_generated/api";
import { defaultConfig } from "./config";

// Virtual users configuration for demo purposes
export const DEMO_USERS = [
  { id: "alice", name: "Alice 👩‍💻", theme: "blue", description: "前端开发工程师" },
  { id: "bob", name: "Bob 👨‍🎨", theme: "green", description: "UI/UX设计师" }, 
  { id: "charlie", name: "Charlie 🧑‍🎓", theme: "purple", description: "产品经理" },
  { id: "diana", name: "Diana 👩‍🔬", theme: "pink", description: "数据科学家" },
  { id: "eve", name: "Eve 🧑‍💼", theme: "orange", description: "项目负责人" }
] as const;

// Multi-user streaming agent for demonstrating user isolation
export const multiUserAgent = new Agent(components.agent, {
  name: "Multi-User Chat Agent",
  instructions: `You are a helpful assistant in a multi-user chat environment. 
  Be friendly and conversational. When appropriate, acknowledge that you're aware 
  this is a demo showing how different users have isolated conversations.
  Keep responses concise but engaging.`,
  ...defaultConfig,
});