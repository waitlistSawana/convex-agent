// Thread Management Agent
import { Agent, stepCountIs } from "@convex-dev/agent";
import { components } from "../_generated/api";
import { updateThreadTitle } from "../tools/updateThreadTitle";
import { defaultConfig } from "./config";

// Define a thread management agent
export const threadManagerAgent = new Agent(components.agent, {
  name: "Thread Manager Agent",
  instructions:
    "You are a helpful assistant that can manage thread titles. When users ask you to change the thread title or suggest a better title, you should use the updateThreadTitle tool. You can also suggest meaningful titles based on the conversation context. Always be helpful and provide clear feedback about title changes.",
  tools: {
    updateThreadTitle,
  },
  stopWhen: stepCountIs(3),
  ...defaultConfig,
});