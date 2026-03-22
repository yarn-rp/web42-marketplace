import "dotenv/config";
import { GoogleGenAI } from "@google/genai";
import { Web42Client, createA2AServer } from "@web42/auth";
import { v4 as uuidv4 } from "uuid";

import type {
  Task,
  TaskStatusUpdateEvent,
  TaskArtifactUpdateEvent,
} from "@a2a-js/sdk";
import type {
  AgentExecutor,
  RequestContext,
  ExecutionEventBus,
} from "@a2a-js/sdk/server";

// ---------------------------------------------------------------------------
// In-memory quiz state — keyed by contextId
// ---------------------------------------------------------------------------

interface QuizQuestion {
  question: string;
  answer: string; // canonical correct answer
}

interface QuizState {
  topic: string;
  callerName: string;
  questions: QuizQuestion[];
  currentIndex: number; // index of the question currently awaiting an answer
  score: number;
}

const sessions = new Map<string, QuizState>();

// ---------------------------------------------------------------------------
// Gemini helpers
// ---------------------------------------------------------------------------

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

async function generateQuestions(topic: string): Promise<QuizQuestion[]> {
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: `Generate exactly 5 diverse quiz questions about: ${topic}. Mix easy and harder questions.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "array",
        items: {
          type: "object",
          properties: {
            question: { type: "string" },
            answer: {
              type: "string",
              description: "Short, canonical correct answer (1–5 words)",
            },
          },
          required: ["question", "answer"],
        },
      },
      maxOutputTokens: 1024,
    },
  });
  return JSON.parse(response.text ?? "[]") as QuizQuestion[];
}

async function isCorrect(
  question: string,
  expected: string,
  given: string,
): Promise<boolean> {
  // Fast path: exact / substring match (case-insensitive)
  const g = given.trim().toLowerCase();
  const e = expected.trim().toLowerCase();
  if (g === e || g.includes(e) || e.includes(g)) return true;

  // Fuzzy check via Gemini
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents:
      `Question: "${question}"\n` +
      `Correct answer: "${expected}"\n` +
      `User answered: "${given}"\n\n` +
      `Is the user's answer correct or essentially equivalent? Reply with exactly "yes" or "no".`,
    config: { maxOutputTokens: 5 },
  });
  return response.text?.trim().toLowerCase().startsWith("yes") ?? false;
}

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

function extractText(message: { parts: Array<{ kind: string; text?: string }> }): string {
  return message.parts
    .filter((p): p is { kind: "text"; text: string } => p.kind === "text")
    .map((p) => p.text)
    .join(" ")
    .trim();
}

function extractTopic(text: string): string | null {
  // Patterns: "quiz about X", "start a quiz on X", "questions about X", or just plain topic
  const match = text.match(
    /(?:quiz|questions?|test\s+me|trivia)(?:\s+(?:about|on|for|regarding))?\s+(?:the\s+)?(.+)/i,
  );
  if (match) return match[1].trim();
  // Fallback: use the whole message if it looks like a topic (< 50 chars, no question marks)
  if (text.length < 50 && !text.includes("?")) return text;
  return null;
}

function questionPrompt(state: QuizState): string {
  const { currentIndex, questions, score } = state;
  const q = questions[currentIndex];
  const progress = `(${currentIndex + 1}/${questions.length})`;
  const scoreStr = currentIndex > 0 ? ` • Score so far: ${score}/${currentIndex}` : "";
  return `**Question ${currentIndex + 1} ${progress}${scoreStr}**\n${q.question}`;
}

function finalSummary(state: QuizState): string {
  const { score, questions, topic, callerName } = state;
  const total = questions.length;
  const pct = Math.round((score / total) * 100);
  let rating =
    pct === 100 ? "Perfect score! 🏆" :
    pct >= 80  ? "Excellent! 🎉" :
    pct >= 60  ? "Good job! 👍" :
    pct >= 40  ? "Not bad, keep practising." :
                 "Better luck next time!";
  return (
    `Quiz complete, ${callerName}!\n\n` +
    `**Topic:** ${topic}\n` +
    `**Score:** ${score}/${total} (${pct}%)\n` +
    `${rating}\n\n` +
    `To play again, send a new topic — or use \`--new-context\` in the CLI to start fresh.`
  );
}

// ---------------------------------------------------------------------------
// Executor
// ---------------------------------------------------------------------------

class QuizMasterExecutor implements AgentExecutor {
  async execute(
    requestContext: RequestContext,
    eventBus: ExecutionEventBus,
  ): Promise<void> {
    const { taskId, contextId, userMessage, task } = requestContext;
    const tokenInfo = server.tokenStorage.getStore();
    const callerName = firstName(tokenInfo?.email);
    const userText = extractText(userMessage as Parameters<typeof extractText>[0]);

    // Register task if new
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

    const working: TaskStatusUpdateEvent = {
      kind: "status-update",
      taskId,
      contextId,
      status: { state: "working", timestamp: new Date().toISOString() },
      final: false,
    };
    eventBus.publish(working);

    try {
      const reply = await this.handleTurn(contextId, callerName, userText);
      this.publishText(taskId, contextId, reply, eventBus);
      eventBus.publish({
        kind: "status-update",
        taskId,
        contextId,
        status: { state: "completed", timestamp: new Date().toISOString() },
        final: true,
      } satisfies TaskStatusUpdateEvent);
    } catch (err) {
      this.publishText(
        taskId,
        contextId,
        `Sorry, something went wrong: ${String(err)}`,
        eventBus,
      );
      eventBus.publish({
        kind: "status-update",
        taskId,
        contextId,
        status: { state: "failed", timestamp: new Date().toISOString() },
        final: true,
      } satisfies TaskStatusUpdateEvent);
    }

    eventBus.finished();
  }

  // ---------------------------------------------------------------------------
  // Multi-turn logic
  // ---------------------------------------------------------------------------

  private async handleTurn(
    contextId: string,
    callerName: string,
    userText: string,
  ): Promise<string> {
    const state = sessions.get(contextId);

    // ── No active session: expect a topic ────────────────────────────────────
    if (!state) {
      const topic = extractTopic(userText);
      if (!topic) {
        return (
          `Hi ${callerName}! 👋 I'm the Quiz Master.\n\n` +
          `Tell me a topic and I'll create a 5-question quiz for you.\n` +
          `Example: _"quiz about the Roman Empire"_`
        );
      }

      const questions = await generateQuestions(topic);
      if (questions.length === 0) {
        return `Sorry, I couldn't generate questions about "${topic}". Try a different topic.`;
      }

      const newState: QuizState = {
        topic,
        callerName,
        questions,
        currentIndex: 0,
        score: 0,
      };
      sessions.set(contextId, newState);

      return (
        `Great choice, ${callerName}! Let's quiz you on **${topic}**.\n\n` +
        questionPrompt(newState)
      );
    }

    // ── Quiz finished ────────────────────────────────────────────────────────
    if (state.currentIndex >= state.questions.length) {
      return (
        `This quiz is already finished! ${finalSummary(state)}`
      );
    }

    // ── Evaluate the answer ──────────────────────────────────────────────────
    const currentQ = state.questions[state.currentIndex];
    const correct = await isCorrect(currentQ.question, currentQ.answer, userText);

    if (correct) {
      state.score++;
    }

    const feedback = correct
      ? `✅ Correct!`
      : `❌ Not quite — the answer was **${currentQ.answer}**.`;

    state.currentIndex++;

    // ── Last question answered ───────────────────────────────────────────────
    if (state.currentIndex >= state.questions.length) {
      return `${feedback}\n\n${finalSummary(state)}`;
    }

    // ── Next question ────────────────────────────────────────────────────────
    return `${feedback}\n\n${questionPrompt(state)}`;
  }

  private publishText(
    taskId: string,
    contextId: string,
    text: string,
    eventBus: ExecutionEventBus,
  ): void {
    const artifact: TaskArtifactUpdateEvent = {
      kind: "artifact-update",
      taskId,
      contextId,
      artifact: {
        artifactId: "reply",
        name: "Reply",
        parts: [{ kind: "text", text }],
      },
    };
    eventBus.publish(artifact);
  }

  cancelTask = async (): Promise<void> => {};
}

// ---------------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------------

const PORT = Number(process.env.PORT ?? 3002);

const server = createA2AServer({
  web42: new Web42Client({
    baseUrl: process.env.WEB42_AUTH_URL ?? "http://localhost:3000",
    clientId: process.env.WEB42_CLIENT_ID!,
    clientSecret: process.env.WEB42_CLIENT_SECRET!,
  }),
  card: {
    name: "Quiz Master",
    description:
      "A multi-turn quiz game. Give me a topic and I'll ask you 5 questions, " +
      "track your score, and give feedback on each answer. Context is preserved " +
      "between messages — pick up where you left off anytime.",
    capabilities: { streaming: false, pushNotifications: false },
    skills: [
      {
        id: "quiz",
        name: "Take a Quiz",
        description:
          "Start a 5-question quiz on any topic. Continue the conversation to answer " +
          "questions — your progress is saved per context ID.",
        tags: ["quiz", "trivia", "game", "multi-turn"],
        examples: [
          "Quiz me about ancient Rome",
          "Start a quiz on JavaScript",
          "Ask me questions about the solar system",
        ],
      },
    ],
  },
  executor: new QuizMasterExecutor(),
  port: PORT,
});

server.listen(() => {
  console.log(`🎯  Quiz Master A2A server`);
  console.log(`    Agent Card  →  http://localhost:${PORT}/.well-known/agent.json`);
  console.log(`    JSON-RPC    →  http://localhost:${PORT}/a2a/jsonrpc`);
  console.log(
    `    Web42 Auth  →  ${process.env.WEB42_AUTH_URL ?? "http://localhost:3000"}`,
  );
  console.log(`    Sessions    →  in-memory (lost on restart)`);
});
