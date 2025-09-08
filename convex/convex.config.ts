import { defineApp } from "convex/server";
import agent from "@convex-dev/agent/convex.config";

const app = defineApp();
// Convex Agents
// see: https://docs.convex.dev/agents/getting-started#installation
app.use(agent);

export default app;
