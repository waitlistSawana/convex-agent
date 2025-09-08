import { deepseek } from "@ai-sdk/deepseek";
import { type Config } from "@convex-dev/agent";
// import { languageModel, textEmbeddingModel } from "../modelsForDemo";
// import { rawRequestResponseHandler } from "../debugging/rawRequestResponseHandler";
// import { usageHandler } from "../usage_tracking/usageHandler";

const languageModel = deepseek.chat("deepseek-chat")

export const defaultConfig = {
  languageModel,
//   rawRequestResponseHandler,
//   usageHandler,
  callSettings: {
    temperature: 1.0,
  },
  // If you want to use vector search, you need to set this.
//   textEmbeddingModel,
} satisfies Config;