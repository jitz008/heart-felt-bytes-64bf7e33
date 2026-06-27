// src/lib/gemini.ts
// Pulse Tasks 2.0 — AI brain.
//
// Stack adaptation notes:
//   • This project is React + Vite (not Next.js). We do NOT import
//     @google/generative-ai here — instead we reuse the existing
//     `callGeminiJSON` helper that already talks to Gemini 2.0 Flash via
//     the v1beta REST endpoint and reads the key from localStorage /
//     VITE_GEMINI_API_KEY. That keeps the Lovable preview working without
//     extra dependencies and keeps a single key surface.
//   • All public exports below match the contract from the rebuild spec:
//       processWithGemini, processSlashCommand, resolveConflict,
//       parseBulkInput, ConversationMessage, TaskAIResponse,
//       TASK_INTAKE_SYSTEM_PROMPT.

import { callGeminiJSON } from './geminiClient';

// ─── MASTER SYSTEM PROMPT ────────────────────────────────────────────────────

export const TASK_INTAKE_SYSTEM_PROMPT = `
You are the AI brain of Pulse Tasks 2.0 — a premium personal productivity assistant. You are NOT a simple reminder app. You are an intelligent chief-of-staff that thinks about the user's day, resolves scheduling conflicts, generates prep roadmaps, and asks only what it truly needs.

## YOUR PERSONALITY
- Direct and efficient. Never verbose.
- Warm but not sycophantic. No "Great!" or "Sure thing!"
- You think ahead. If a user says "I have a meeting", you think: with whom? about what? what do they need to prepare?
- You adapt to the user's pace. Hurried user = fewer questions. Relaxed user = deeper context.

## PRIORITY SCORING RUBRIC — FOLLOW THIS EXACTLY

Score each task on these dimensions. Priority = sum of scores.

CATEGORY SCORES:
- Professional/work task (meeting, deadline, presentation, client, report): +40
- Financial task (payment, invoice, bill, transaction): +35
- Health/medical (doctor, medication, appointment): +30
- Family obligation (pick up kids, school, family event): +25
- Social/personal (lunch, dinner, coffee, catch-up): +15
- Errand/miscellaneous (buy, pick up item, grocery): +10

TIME URGENCY SCORES:
- Due within 2 hours: +50 (ALWAYS HIGH regardless of other scores)
- Due today: +25
- Due tomorrow: +15
- Due this week: +5
- No time specified: +0

CONSEQUENCE SCORES:
- Involves another person depending on you (client, boss, team): +20
- Has a financial consequence if missed: +20
- Affects your professional reputation: +15
- Purely personal with no external consequence: +0

FINAL PRIORITY:
- Score >= 60 → HIGH
- Score 30-59 → MEDIUM
- Score < 30 → LOW

OVERRIDE RULES (non-negotiable):
- ANY task with "urgent", "ASAP", "critical", "emergency" → HIGH
- ANY task within 2 hours → HIGH
- ANY payment/bill due today → HIGH
- A prep task for a HIGH task also becomes HIGH (e.g. "prepare slides" for a HIGH meeting)

## COMPLEXITY CLASSIFICATION

SIMPLE: Single action, no other person required, clear outcome, <= 2 prep steps needed
Examples: pay electricity bill, pick up dry cleaning, buy groceries, take medication

MEDIUM: Involves coordination with another person OR has a social component, 2-3 prep steps useful
Examples: lunch with Sarah, call with client, coffee catch-up, dinner reservation

COMPLEX: Professional event with stakes, requires meaningful preparation, 3-5 prep steps essential
Examples: client meeting, job interview, product presentation, board meeting, performance review, important family dinner with guests, hackathon demo

## CONVERSATION STATE MACHINE

You operate in these states. Return the current state in every response.

STATE: PROCESSING
- You just received the user's input
- Extract everything you can from it
- Determine complexity
- Identify missing critical fields
- Transition to: CLARIFYING (if missing critical info) or CONFIRMING (if you have enough)

STATE: CLARIFYING
- Ask ONE question at a time
- Provide smart chips as answer options
- Remember all previous answers in the conversation
- After each answer, decide: ask next question OR move to CONFIRMING
- If userPace = hurried AND critical fields are filled: skip to CONFIRMING immediately
- Maximum questions: Simple=1, Medium=2, Complex=AI decides (max 4)

STATE: CONFIRMING
- Show full task summary
- User confirms or edits
- If user says "add more" or "yes to more context": move to ENRICHING
- Otherwise: move to CREATING

STATE: ENRICHING
- Ask deeper context questions for complex tasks
- These become the roadmap and productivity recommendations
- Questions are optional — always show "Skip, create task" chip

STATE: CREATING
- All info collected
- Write to storage
- Generate roadmap if complex
- Generate productivity recommendations
- Check for conflicts
- Show task in correct column

## WHAT TO ASK IN CLARIFYING (by task type)

MEETING:
1. Critical: "When is this meeting?" [chips: Today, Tomorrow, This week, Custom]
2. Critical: "What time?" [chips: 9 AM, 11 AM, 2 PM, 5 PM, Custom]
3. Important: "Who is it with?" [chips based on context, + "Just me", "Multiple people", "Skip"]
4. Enriching (only if not hurried): "What's it about?" [free text or chips if context allows]
5. Enriching: "Any prep you need help with?" [chips: Prepare talking points, Review documents, Draft questions, No prep needed]
6. Enriching: "Anything specific to remind you during the meeting?" [free text + "Skip"]

PAYMENT/BILL:
1. Critical: "When is it due?" [chips: Today, Tomorrow, End of week, Custom]
2. Important: "How much? (optional)" [free text + "Skip"]
That's it. Don't ask more for simple financial tasks.

SOCIAL EVENT (lunch, dinner, coffee):
1. Critical: "When?" [chips: Today, Tomorrow, This week, Custom]
2. Important: "Who's joining?" [free text + "Just me", "Skip"]
3. Enriching (only if complex dinner/event): "Any prep? Reservation, gift, etc.?" [chips + "No prep"]

ERRAND:
1. Critical: "When do you need to do this?" [chips: Today, Tomorrow, This week, Someday]
That's it for simple errands.

INTERVIEW:
1. Critical: "When is it?" [chips: Today, Tomorrow, date options]
2. Critical: "What time?" [time chips]
3. Enriching: "What role/company is this for?" [free text + "Skip"]
4. Enriching: "Any specific prep areas?" [chips: Research company, Practice answers, Prepare questions, Review resume, All of above]

VAGUE INPUT ("hi", "rescue me", random words):
- Do not create a task
- Instead ask: "Tell me what's on your mind — what do you need to handle?" with no chips
- Wait for a real input
- If input is still vague after 2 attempts: "Want me to help you plan your day instead?" [chips: Yes plan my day, Let me type something specific]

## SLASH COMMANDS — FULL IMPLEMENTATIONS

/Break it down:
- Ask: "Which task do you want to break down?"
- Show chips with today's existing task titles + "Type a new task"
- Once task selected/entered, generate a detailed step-by-step execution plan
- Return a BREAKDOWN response (not a regular task response)
- Breakdown includes: overview, numbered steps with time estimates, potential blockers, suggested order

/Rescue me:
- Ask: "What's overwhelming you right now?" [chips: Too many tasks, One big scary task, No idea where to start, Everything]
- Based on answer, analyze today's tasks and generate: top 3 priorities RIGHT NOW, what to ignore for now, suggested time blocks
- Return a RESCUE response with actionable specific steps

/Plan my day:
- Pull all of today's tasks
- Generate: morning block, afternoon block, evening block, buffer time
- Account for task priorities and times
- Return a PLAN response with time-blocked schedule

/Habit check:
- Ask: "Which habits are you tracking?" [chips from any habit-type tasks + "Tell me your habits"]
- Return an ENCOURAGEMENT response with streak info and today's habit status

## OUTPUT FORMAT — RETURN VALID JSON ONLY

For regular task intake, return EXACTLY this schema:

{
  "state": "PROCESSING | CLARIFYING | CONFIRMING | ENRICHING | CREATING",
  "taskType": "meeting | payment | errand | social | interview | event | health | family | other",
  "complexity": "simple | medium | complex",
  "title": "Clean task title max 8 words",
  "userPace": "hurried | casual",
  "extractedEntities": {
    "time": "ISO 8601 or null",
    "timeDisplay": "Human readable e.g. 'Tomorrow at 3 PM' or null",
    "person": "Name or null",
    "location": "Location or null",
    "topic": "What it's about or null",
    "amount": "Financial amount or null"
  },
  "clarifyingQuestion": {
    "field": "when | who | what | where | amount | prep | notes",
    "question": "One short question",
    "chips": ["Option 1", "Option 2", "Option 3", "Skip"]
  },
  "priorityScore": 75,
  "priority": "high | medium | low",
  "priorityReason": "Client-facing professional meeting today: +40 category +25 today +20 external dependency = 85",
  "roadmapSteps": [
    { "step": "Confirm meeting agenda", "timing": "Today", "icon": "📋" }
  ],
  "productivityRecommendation": {
    "summary": "2-3 sentence personalized recommendation based on this specific task",
    "tips": ["Specific tip 1", "Specific tip 2", "Specific tip 3"],
    "aiInsight": "Something Gemini can add from its knowledge about this type of task/topic"
  },
  "conflictCheckNeeded": true,
  "confirmationChips": ["📅 Tomorrow 3 PM", "👤 John", "💼 Client Meeting", "🔴 High Priority"],
  "needsMoreContext": false,
  "slashCommandResponse": null
}

For slash commands (/Break it down, /Rescue me, /Plan my day, /Habit check), add:

{
  "slashCommandResponse": {
    "type": "BREAKDOWN | RESCUE | PLAN | HABIT_CHECK",
    "title": "Response title",
    "content": [
      { "type": "overview", "text": "..." },
      { "type": "step", "number": 1, "text": "...", "timeEstimate": "15 min" },
      { "type": "warning", "text": "Potential blocker: ..." },
      { "type": "tip", "text": "Pro tip: ..." }
    ]
  }
}

## MULTI-TURN CONVERSATION MANAGEMENT

You receive the full conversation history in every call. Use it.

If user previously said "meeting with John tomorrow at 3pm" and now says "it's about the product launch":
- You already know: meeting, John, tomorrow 3pm
- Now add: topic = product launch
- Do NOT re-ask what you already know
- Update your understanding and continue

If user gives bulk info like "I have a meeting with John tomorrow at 5pm about the new product launch, also I need to pay my electricity bill by today 11am, and I'm picking up my kids at 3:30":
- Parse ALL tasks from this single input
- Create multiple tasks
- Return array of task objects in "multipleTasks" field
- Each task gets its own priority score and analysis

## GEMINI KNOWLEDGE INTEGRATION

If a user mentions a topic you can help with (technology, company, concept):
- In productivityRecommendation.aiInsight, add relevant context
- This is WHERE your training knowledge becomes a productivity tool

## PACE DETECTION RULES

HURRIED if ANY of:
- Input is under 10 words
- Contains: "quick", "fast", "asap", "just", "remind me to", "don't forget"
- Voice transcript has no punctuation (spoken quickly)
- User taps "Skip" on first optional question
- Previous answers were all chip-taps, no typed text

CASUAL if:
- Input is detailed and descriptive
- User types custom answers instead of tapping chips
- User volunteers extra information
- User asks questions back

NEVER output raw text. ALWAYS output valid JSON. No markdown. No explanation outside the JSON.
`;

// ─── PUBLIC TYPES ────────────────────────────────────────────────────────────

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ExtractedEntities {
  time: string | null;
  timeDisplay: string | null;
  person: string | null;
  location: string | null;
  topic: string | null;
  amount: string | null;
}

export interface ClarifyingQuestionPayload {
  field: string;
  question: string;
  chips: string[];
}

export interface RoadmapStepPayload {
  step: string;
  timing: string;
  icon?: string;
}

export interface ProductivityRecommendationPayload {
  summary: string;
  tips: string[];
  aiInsight: string;
}

export interface SlashCommandContentItem {
  type: 'overview' | 'step' | 'warning' | 'tip' | string;
  text: string;
  number?: number;
  timeEstimate?: string;
}

export interface SlashCommandResponsePayload {
  type: 'BREAKDOWN' | 'RESCUE' | 'PLAN' | 'HABIT_CHECK';
  title: string;
  content: SlashCommandContentItem[];
}

export interface TaskAIResponse {
  state: 'PROCESSING' | 'CLARIFYING' | 'CONFIRMING' | 'ENRICHING' | 'CREATING';
  taskType: string;
  complexity: 'simple' | 'medium' | 'complex';
  title: string;
  userPace: 'hurried' | 'casual';
  extractedEntities: ExtractedEntities;
  clarifyingQuestion: ClarifyingQuestionPayload | null;
  priorityScore: number;
  priority: 'high' | 'medium' | 'low';
  priorityReason: string;
  roadmapSteps: RoadmapStepPayload[];
  productivityRecommendation: ProductivityRecommendationPayload | null;
  conflictCheckNeeded: boolean;
  confirmationChips: string[];
  needsMoreContext: boolean;
  multipleTasks?: TaskAIResponse[];
  slashCommandResponse?: SlashCommandResponsePayload | null;
}

export interface TaskBriefForAI {
  title: string;
  priority: string;
  time?: string | null;
  status?: string;
}

// ─── INTERNAL: timeout wrapper around callGeminiJSON ─────────────────────────

async function callGeminiWithTimeout(
  prompt: string,
  system: string,
  timeoutMs = 10_000,
): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    // callGeminiJSON does the fetch internally; we race it against the abort.
    const result = await Promise.race([
      callGeminiJSON(prompt, system),
      new Promise((_, reject) => {
        controller.signal.addEventListener('abort', () =>
          reject(new Error('TIMEOUT')),
        );
      }),
    ]);
    return result;
  } catch (err: any) {
    if (err?.message === 'TIMEOUT') throw new Error('TIMEOUT');
    throw new Error('GEMINI_ERROR: ' + (err?.message || String(err)));
  } finally {
    clearTimeout(timer);
  }
}

// ─── INTERNAL: serialize a conversation for a one-shot model call ────────────

function serializeConversation(history: ConversationMessage[]): string {
  return history
    .map((m) => {
      const tag = m.role === 'user' ? 'USER' : 'ASSISTANT';
      return `${tag}: ${m.content}`;
    })
    .join('\n\n');
}

function fallbackResponseFromError(input: string): TaskAIResponse {
  return {
    state: 'CONFIRMING',
    taskType: 'other',
    complexity: 'simple',
    title: input.slice(0, 60) || 'New task',
    userPace: 'hurried',
    extractedEntities: {
      time: null,
      timeDisplay: null,
      person: null,
      location: null,
      topic: null,
      amount: null,
    },
    clarifyingQuestion: null,
    priorityScore: 20,
    priority: 'low',
    priorityReason: 'AI unavailable — created without scoring.',
    roadmapSteps: [],
    productivityRecommendation: null,
    conflictCheckNeeded: false,
    confirmationChips: [input.slice(0, 40) || 'New task'],
    needsMoreContext: false,
    slashCommandResponse: null,
  };
}

// ─── MAIN: multi-turn task intake ────────────────────────────────────────────

export async function processWithGemini(
  conversationHistory: ConversationMessage[],
  currentDateTime: string,
  existingTasksToday: TaskBriefForAI[],
  isSlashCommand: boolean = false,
  slashCommandType: string = '',
): Promise<TaskAIResponse> {
  if (!conversationHistory.length) {
    throw new Error('processWithGemini: empty conversation history');
  }

  const context = [
    `Current date and time: ${currentDateTime}`,
    `User's tasks today: ${
      existingTasksToday.length
        ? existingTasksToday
            .map(
              (t) =>
                `"${t.title}" (${t.priority}, ${t.time || 'no time'})`,
            )
            .join(', ')
        : 'none yet'
    }`,
    isSlashCommand ? `This is a slash command: /${slashCommandType}` : '',
    'Return ONLY valid JSON. No markdown. No explanation.',
  ]
    .filter(Boolean)
    .join('\n');

  const prompt = [
    '## CONVERSATION SO FAR',
    serializeConversation(conversationHistory),
    '',
    '## CONTEXT',
    context,
    '',
    '## YOUR TURN',
    'Respond with the JSON object matching the schema in the system prompt. Drive the conversation state forward.',
  ].join('\n');

  try {
    const parsed = await callGeminiWithTimeout(
      prompt,
      TASK_INTAKE_SYSTEM_PROMPT,
    );
    return normalizeTaskResponse(parsed, conversationHistory);
  } catch (err: any) {
    if (err?.message === 'TIMEOUT') throw err;
    // Soft-fail to a usable shape so the UI doesn't crash.
    const lastUser =
      [...conversationHistory].reverse().find((m) => m.role === 'user')
        ?.content || '';
    return fallbackResponseFromError(lastUser);
  }
}

// Defensive normalization — Gemini occasionally omits fields.
function normalizeTaskResponse(
  raw: any,
  history: ConversationMessage[],
): TaskAIResponse {
  const lastUser =
    [...history].reverse().find((m) => m.role === 'user')?.content || '';
  const safe: TaskAIResponse = {
    state: raw?.state ?? 'CONFIRMING',
    taskType: raw?.taskType ?? 'other',
    complexity: raw?.complexity ?? 'simple',
    title: raw?.title || lastUser.slice(0, 60) || 'New task',
    userPace: raw?.userPace ?? 'casual',
    extractedEntities: {
      time: raw?.extractedEntities?.time ?? null,
      timeDisplay: raw?.extractedEntities?.timeDisplay ?? null,
      person: raw?.extractedEntities?.person ?? null,
      location: raw?.extractedEntities?.location ?? null,
      topic: raw?.extractedEntities?.topic ?? null,
      amount: raw?.extractedEntities?.amount ?? null,
    },
    clarifyingQuestion: raw?.clarifyingQuestion
      ? {
          field: raw.clarifyingQuestion.field ?? 'notes',
          question: raw.clarifyingQuestion.question ?? '',
          chips: Array.isArray(raw.clarifyingQuestion.chips)
            ? raw.clarifyingQuestion.chips
            : [],
        }
      : null,
    priorityScore:
      typeof raw?.priorityScore === 'number' ? raw.priorityScore : 30,
    priority:
      raw?.priority === 'high' || raw?.priority === 'medium' || raw?.priority === 'low'
        ? raw.priority
        : 'medium',
    priorityReason: raw?.priorityReason ?? 'No reasoning provided.',
    roadmapSteps: Array.isArray(raw?.roadmapSteps)
      ? raw.roadmapSteps
          .filter((s: any) => s && (s.step || s.text))
          .map((s: any) => ({
            step: s.step || s.text,
            timing: s.timing || '',
            icon: s.icon || '',
          }))
      : [],
    productivityRecommendation: raw?.productivityRecommendation
      ? {
          summary: raw.productivityRecommendation.summary ?? '',
          tips: Array.isArray(raw.productivityRecommendation.tips)
            ? raw.productivityRecommendation.tips
            : [],
          aiInsight: raw.productivityRecommendation.aiInsight ?? '',
        }
      : null,
    conflictCheckNeeded: !!raw?.conflictCheckNeeded,
    confirmationChips: Array.isArray(raw?.confirmationChips)
      ? raw.confirmationChips
      : [],
    needsMoreContext: !!raw?.needsMoreContext,
    multipleTasks: Array.isArray(raw?.multipleTasks)
      ? raw.multipleTasks.map((t: any) => normalizeTaskResponse(t, history))
      : undefined,
    slashCommandResponse: raw?.slashCommandResponse ?? null,
  };

  // Hard guarantees: a CLARIFYING/ENRICHING state must carry a question.
  if (
    (safe.state === 'CLARIFYING' || safe.state === 'ENRICHING') &&
    !safe.clarifyingQuestion
  ) {
    safe.state = 'CONFIRMING';
  }

  // Confirmation chips fallback — guarantees the confirm UI has something to render.
  if (!safe.confirmationChips.length) {
    const chips: string[] = [];
    if (safe.extractedEntities.timeDisplay)
      chips.push(`📅 ${safe.extractedEntities.timeDisplay}`);
    if (safe.extractedEntities.person)
      chips.push(`👤 ${safe.extractedEntities.person}`);
    if (safe.extractedEntities.location)
      chips.push(`📍 ${safe.extractedEntities.location}`);
    chips.push(
      `${safe.priority === 'high' ? '🔴' : safe.priority === 'medium' ? '🟡' : '🟢'} ${safe.priority} priority`,
    );
    safe.confirmationChips = chips;
  }

  return safe;
}

// ─── SLASH COMMAND PROCESSOR ─────────────────────────────────────────────────

const SLASH_PROMPTS: Record<
  'break_it_down' | 'rescue_me' | 'plan_my_day' | 'habit_check',
  (userInput: string, tasksJson: string, now: string) => string
> = {
  break_it_down: (userInput, tasksJson, now) => `
The user wants to break down a task or goal into actionable steps.
User said: "${userInput}"
Their current tasks: ${tasksJson}
Current time: ${now}

Generate a detailed breakdown. Return JSON with slashCommandResponse.type = "BREAKDOWN".
Content should include: overview, numbered steps with time estimates, potential blockers, and 1-2 pro tips.
Each step must be specific and actionable, not generic.
If the topic requires domain knowledge (tech, business concept, etc.), include relevant context in the steps.
Return ONLY the full TaskAIResponse JSON (you may leave task-intake fields as sensible placeholders, the UI only reads slashCommandResponse for this path).
`,
  rescue_me: (userInput, tasksJson, now) => `
The user is overwhelmed and needs immediate help prioritizing.
User said: "${userInput}"
Their current tasks: ${tasksJson}
Current time: ${now}

Analyze ALL their tasks. Return JSON with slashCommandResponse.type = "RESCUE".
Content should include: top 3 tasks to tackle RIGHT NOW (with reasoning), what to defer/ignore today,
a suggested time block for the next 2 hours, and a motivational but realistic assessment.
Be SPECIFIC — reference their actual task titles, not generic advice.
Return ONLY the full TaskAIResponse JSON.
`,
  plan_my_day: (userInput, tasksJson, now) => `
The user wants a structured daily plan.
User said: "${userInput}"
Their current tasks: ${tasksJson}
Current time: ${now}

Create a realistic time-blocked schedule. Return JSON with slashCommandResponse.type = "PLAN".
Content should include: morning block, afternoon block, evening block, buffer time recommendations,
and a note on which tasks are at risk if they run over.
Account for task times if specified. Be realistic about human capacity.
Return ONLY the full TaskAIResponse JSON.
`,
  habit_check: (userInput, tasksJson, now) => `
The user wants to check on their habits.
User said: "${userInput}"
Their current tasks: ${tasksJson}
Current time: ${now}

Identify any habit-type tasks in their list. Return JSON with slashCommandResponse.type = "HABIT_CHECK".
Content should include: habits identified, completion status today, encouragement, and one specific suggestion.
If no habits found, suggest how they could set one up.
Return ONLY the full TaskAIResponse JSON.
`,
};

export async function processSlashCommand(
  command: 'break_it_down' | 'rescue_me' | 'plan_my_day' | 'habit_check',
  userInput: string,
  existingTasks: TaskBriefForAI[],
  currentDateTime: string,
): Promise<TaskAIResponse> {
  const tasksJson = JSON.stringify(existingTasks);
  const prompt = SLASH_PROMPTS[command](userInput || '', tasksJson, currentDateTime);
  const raw = await callGeminiWithTimeout(prompt, TASK_INTAKE_SYSTEM_PROMPT);
  const normalized = normalizeTaskResponse(raw, [
    { role: 'user', content: userInput || command },
  ]);
  // Ensure slashCommandResponse survived normalization
  if (raw?.slashCommandResponse && !normalized.slashCommandResponse) {
    normalized.slashCommandResponse = raw.slashCommandResponse;
  }
  return normalized;
}

// ─── CONFLICT RESOLUTION ─────────────────────────────────────────────────────

export async function resolveConflict(
  taskA: { title: string; time: string; priority: string },
  taskB: { title: string; time: string; priority: string },
): Promise<{ keepTask: 'A' | 'B'; reason: string; suggestion: string }> {
  const prompt = `
Two tasks conflict at the same time.
Task A: "${taskA.title}" at ${taskA.time} — priority: ${taskA.priority}
Task B: "${taskB.title}" at ${taskB.time} — priority: ${taskB.priority}

Which should the user prioritize? Apply these rules:
- Professional > Social
- Earlier deadline wins ties
- External dependency (other people depending on you) > internal task
- Financial consequence > personal preference

Return ONLY valid JSON:
{
  "keepTask": "A",
  "reason": "One sentence explaining the decision",
  "suggestion": "One sentence on what to do with the other task"
}
`;
  const raw = await callGeminiWithTimeout(prompt, '');
  return {
    keepTask: raw?.keepTask === 'B' ? 'B' : 'A',
    reason: raw?.reason || '',
    suggestion: raw?.suggestion || '',
  };
}

// ─── BULK INPUT PARSER ───────────────────────────────────────────────────────

export async function parseBulkInput(
  input: string,
  currentDateTime: string,
): Promise<TaskAIResponse[]> {
  const prompt = `
The user has given you multiple tasks in one input. Parse ALL of them.
Current time: ${currentDateTime}
User input: "${input}"

Return a JSON OBJECT with a single field "tasks" whose value is an ARRAY where each element
is a complete TaskAIResponse for one task (same schema as the master system prompt).
Each task gets its own priority score calculated independently.
Set state="CREATING" for every task — these are ready to write.
Return ONLY the JSON object. No markdown. No explanation.
`;
  const raw = await callGeminiWithTimeout(prompt, TASK_INTAKE_SYSTEM_PROMPT);
  const arr = Array.isArray(raw) ? raw : Array.isArray(raw?.tasks) ? raw.tasks : [];
  return arr.map((t: any) =>
    normalizeTaskResponse(t, [{ role: 'user', content: input }]),
  );
}
