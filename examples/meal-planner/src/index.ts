import "dotenv/config";
import { GoogleGenAI } from "@google/genai";
import { Web42Client, createA2AServer } from "@web42/auth";
import { v4 as uuidv4 } from "uuid";

import type {
  Task,
  TaskArtifactUpdateEvent,
  TaskStatusUpdateEvent,
} from "@a2a-js/sdk";
import type {
  AgentExecutor,
  RequestContext,
  ExecutionEventBus,
} from "@a2a-js/sdk/server";

// ---------------------------------------------------------------------------
// Clients
// ---------------------------------------------------------------------------

const web42 = new Web42Client({
  baseUrl: process.env.WEB42_AUTH_URL ?? "http://localhost:3000",
  clientId: process.env.WEB42_CLIENT_ID!,
  clientSecret: process.env.WEB42_CLIENT_SECRET!,
});

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function firstName(email?: string): string {
  const local = email
    ?.split("@")[0]
    .split(".")[0]
    .replace(/[^a-zA-Z]/g, "");
  if (!local) return "there";
  return local.charAt(0).toUpperCase() + local.slice(1);
}

// ---------------------------------------------------------------------------
// Executor
// ---------------------------------------------------------------------------

class MealPlannerExecutor implements AgentExecutor {
  async execute(
    requestContext: RequestContext,
    eventBus: ExecutionEventBus,
  ): Promise<void> {
    const { taskId, contextId, userMessage, task } = requestContext;

    // Resolve caller identity from the Web42 token stored in AsyncLocalStorage
    const tokenInfo = server.tokenStorage.getStore();
    const callerName = firstName(tokenInfo?.email);

    // Extract plain text from the incoming A2A message
    const userText = userMessage.parts
      .filter((p): p is { kind: "text"; text: string } => p.kind === "text")
      .map((p) => p.text)
      .join("\n");

    // Publish initial task state if this is a new task
    if (!task) {
      const initialTask: Task = {
        kind: "task",
        id: taskId,
        contextId,
        status: { state: "submitted", timestamp: new Date().toISOString() },
        history: [userMessage],
      };
      eventBus.publish(initialTask);
    }

    // Signal work has started
    const workingUpdate: TaskStatusUpdateEvent = {
      kind: "status-update",
      taskId,
      contextId,
      status: { state: "working", timestamp: new Date().toISOString() },
      final: false,
    };
    eventBus.publish(workingUpdate);

    try {
      const isShoppingList = /shopping\s*list|groceries|what.*buy/i.test(
        userText,
      );

      if (isShoppingList) {
        await this.runShoppingList(taskId, contextId, userText, callerName, eventBus);
      } else {
        await this.runMealPlan(taskId, contextId, userText, callerName, eventBus);
      }

      const completedUpdate: TaskStatusUpdateEvent = {
        kind: "status-update",
        taskId,
        contextId,
        status: { state: "completed", timestamp: new Date().toISOString() },
        final: true,
      };
      eventBus.publish(completedUpdate);
    } catch (err) {
      const failedUpdate: TaskStatusUpdateEvent = {
        kind: "status-update",
        taskId,
        contextId,
        status: {
          state: "failed",
          timestamp: new Date().toISOString(),
          message: {
            kind: "message",
            messageId: uuidv4(),
            role: "agent",
            parts: [{ kind: "text", text: String(err) }],
            contextId,
          },
        },
        final: true,
      };
      eventBus.publish(failedUpdate);
    }

    eventBus.finished();
  }

  // ---------------------------------------------------------------------------
  // Skill: meal-plan — streams Gemini output as progressive artifact updates
  // ---------------------------------------------------------------------------

  private async runMealPlan(
    taskId: string,
    contextId: string,
    userText: string,
    callerName: string,
    eventBus: ExecutionEventBus,
  ): Promise<void> {
    const stream = await ai.models.generateContentStream({
      model: "gemini-2.0-flash",
      contents: userText,
      config: {
        systemInstruction: [
          "You are a professional nutritionist and meal planner.",
          "Create varied, practical, and delicious meal plans.",
          `Always start by greeting ${callerName} by name.`,
          "Format each day: Day N → Breakfast / Lunch / Snack / Dinner.",
          "Add a one-line prep tip per meal. End with a short motivational note.",
        ].join(" "),
        temperature: 1.0,
        maxOutputTokens: 4096,
      },
    });

    let accumulated = "";
    let flushed = 0;
    const FLUSH_EVERY = 200;

    for await (const chunk of stream) {
      accumulated += chunk.text ?? "";

      if (accumulated.length - flushed >= FLUSH_EVERY) {
        this.publishMealPlanArtifact(taskId, contextId, accumulated, eventBus);
        flushed = accumulated.length;
      }
    }

    if (accumulated.length > flushed || flushed === 0) {
      this.publishMealPlanArtifact(taskId, contextId, accumulated, eventBus);
    }
  }

  private publishMealPlanArtifact(
    taskId: string,
    contextId: string,
    text: string,
    eventBus: ExecutionEventBus,
  ): void {
    const update: TaskArtifactUpdateEvent = {
      kind: "artifact-update",
      taskId,
      contextId,
      artifact: {
        artifactId: "meal-plan",
        name: "Meal Plan",
        parts: [{ kind: "text", text }],
      },
    };
    eventBus.publish(update);
  }

  // ---------------------------------------------------------------------------
  // Skill: shopping-list — structured JSON via Gemini JSON mode
  // ---------------------------------------------------------------------------

  private async runShoppingList(
    taskId: string,
    contextId: string,
    mealPlanText: string,
    callerName: string,
    eventBus: ExecutionEventBus,
  ): Promise<void> {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents:
        `Generate a complete, consolidated shopping list for ${callerName}. ` +
        `Combine duplicate ingredients and group by supermarket section.\n\n${mealPlanText}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            greeting: {
              type: "string",
              description: "Short friendly note to the user (one sentence)",
            },
            categories: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string", description: "e.g. Produce, Dairy, Grains" },
                  items: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        quantity: { type: "string", description: "e.g. 2 lbs, 1 bunch" },
                      },
                      required: ["name", "quantity"],
                    },
                  },
                },
                required: ["name", "items"],
              },
            },
          },
          required: ["greeting", "categories"],
        },
        maxOutputTokens: 2048,
      },
    });

    const list = JSON.parse(response.text ?? "{}") as Record<string, unknown>;

    const update: TaskArtifactUpdateEvent = {
      kind: "artifact-update",
      taskId,
      contextId,
      artifact: {
        artifactId: "shopping-list",
        name: "Shopping List",
        parts: [{ kind: "data", data: list }],
      },
    };
    eventBus.publish(update);
  }

  cancelTask = async (): Promise<void> => {};
}

// ---------------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------------

const PORT = Number(process.env.PORT ?? 3001);

const server = createA2AServer({
  web42,
  card: {
    name: "Meal Planner Agent",
    description:
      "Generates personalised meal plans and shopping lists. " +
      "Identifies callers from their Web42 Bearer token and greets them by name.",
    capabilities: { streaming: true, pushNotifications: false },
    skills: [
      {
        id: "meal-plan",
        name: "Generate Meal Plan",
        description: "Creates a personalised N-day meal plan from a free-form request.",
        tags: ["nutrition", "meal-planning", "health"],
        examples: [
          "Create a 7-day vegan meal plan",
          "5-day Mediterranean plan for 2 people",
          "High-protein gluten-free week",
        ],
      },
      {
        id: "shopping-list",
        name: "Generate Shopping List",
        description:
          "Extracts a categorised JSON shopping list from a meal plan. " +
          'Include the meal plan text in the message, or say "shopping list".',
        tags: ["shopping", "grocery", "planning"],
        examples: ["Turn my meal plan into a shopping list"],
      },
    ],
  },
  executor: new MealPlannerExecutor(),
  port: PORT,
});

server.listen(() => {
  console.log(`🥗  Meal Planner A2A server`);
  console.log(`    Agent Card  →  http://localhost:${PORT}/.well-known/agent.json`);
  console.log(`    JSON-RPC    →  http://localhost:${PORT}/a2a/jsonrpc`);
  console.log(
    `    Web42 Auth  →  ${process.env.WEB42_AUTH_URL ?? "http://localhost:3000"}`,
  );
});
