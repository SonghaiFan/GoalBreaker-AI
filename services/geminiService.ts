import { GoogleGenAI, Type } from "@google/genai";
import { PlanResponse, Difficulty, TaskType, Language } from "../types";

const apiKey = process.env.API_KEY;

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: apiKey });

interface TaskContext {
  duration: string;
  description?: string;
  isRecurring?: boolean;
}

interface GenOptions {
  parentContext?: string; // The title of the parent goal, to give the AI context scope
  parentTaskContext?: TaskContext; // Specific constraints from the parent task (duration, etc.)
  onPartialUpdate?: (plan: PlanResponse) => void;
}

// A helper to attempt fixing truncated JSON strings so they can be parsed
// This allows us to render the UI while the AI is still "typing"
const naiveJsonRepair = (jsonStr: string): string => {
  let modified = jsonStr.trim();
  
  // Remove markdown code blocks if present
  if (modified.startsWith('```json')) {
      modified = modified.replace(/^```json/, '');
  }
  if (modified.startsWith('```')) {
      modified = modified.replace(/^```/, '');
  }
  // We don't remove the trailing ``` yet because the string might be incomplete
  
  // Basic stack to track open brackets/braces
  const stack = [];
  let inString = false;
  let isEscaped = false;

  for (let i = 0; i < modified.length; i++) {
    const char = modified[i];

    if (isEscaped) {
      isEscaped = false;
      continue;
    }

    if (char === '\\') {
      isEscaped = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (!inString) {
      if (char === '{' || char === '[') {
        stack.push(char);
      } else if (char === '}') {
        if (stack.length > 0 && stack[stack.length - 1] === '{') {
          stack.pop();
        }
      } else if (char === ']') {
        if (stack.length > 0 && stack[stack.length - 1] === '[') {
          stack.pop();
        }
      }
    }
  }

  // Append missing closing brackets in reverse order
  while (stack.length > 0) {
    const open = stack.pop();
    if (open === '{') modified += '}';
    if (open === '[') modified += ']';
  }

  return modified;
};

export const generateGoalPlan = async (goal: string, language: Language, options: GenOptions = {}): Promise<PlanResponse> => {
  if (!apiKey) {
    throw new Error("API Key is missing. Please check your environment configuration.");
  }

  const parentContextInfo = options.parentContext 
    ? `CONTEXT: This goal is a sub-component of a larger objective: "${options.parentContext}".` 
    : "CONTEXT: This is a Root Level objective.";

  let timeConstraintInfo = "";
  if (options.parentTaskContext) {
      timeConstraintInfo = `
      CRITICAL CONSTRAINTS:
      1. TOTAL DURATION LIMIT: The entire plan must fit within "${options.parentTaskContext.duration}".
      2. SCOPE: Bound by parent task description: "${options.parentTaskContext.description || 'N/A'}".
      ${options.parentTaskContext.isRecurring ? "3. RECURRENCE: This defines the routine for a single cycle of the parent task." : ""}
      `;
  }
  
  const langInstruction = language === 'zh' 
    ? "OUTPUT LANGUAGE: CHINESE (Simplified). All titles, descriptions, summaries, and quotes MUST be in Chinese." 
    : "OUTPUT LANGUAGE: ENGLISH.";

  // --- FIRST PRINCIPLES STRATEGY PROMPT ---
  const adaptivePrompt = `
    Act as a Strategic Architect using **FIRST PRINCIPLES THINKING**.
    User Goal: "${goal}"
    ${parentContextInfo}
    ${timeConstraintInfo}
    ${langInstruction}

    YOUR CORE PHILOSOPHY:
    1. **Reject Analogy**: Do not simply copy how others do things. Do not produce a generic "to-do list".
    2. **Boil Down to Axioms**: Deconstruct the goal into its most fundamental truths. What is actually required to make this happen from a logic standpoint?
    3. **Rebuild from Ground Up**: Construct a protocol based *only* on these fundamental components.
    4. **Optimize for Efficiency**: Find the most direct path between the current state and the goal state, ignoring convention.

    --- DECISION LOGIC (MACRO vs MICRO) ---

    **CASE A: MACRO STRATEGY (Strategic/High-Level)**
    - TRIGGER: If the goal takes **MORE THAN 24 HOURS**, requires learning, or complex assembly.
    - STRUCTURE: 
       1. **Phases**: Group steps into logical Phases.
       2. **Steps**: MIXED DURATIONS ALLOWED. 
          - **Simple Steps**: Use **HOURS**.
          - **Complex Steps**: Use **DAYS** or **WEEKS**.
       3. **'isBreakable'**: **TRUE** for most steps.

    **CASE B: MICRO STRATEGY (Tactical/Execution)**
    - TRIGGER: If the goal is a specific task (< 24 HOURS) or has a strict "TOTAL DURATION LIMIT" (e.g. "1 Hour").
    - STRUCTURE:
       1. **Phases**: Return exactly ONE Phase named "Execution Protocol" (or "执行流程").
       2. **Steps**: Must be **HOURS** or **MINUTES**.
       3. **'isBreakable'**: MUST be **FALSE**.

    **OVERRIDE RULE:**
    If a "TOTAL DURATION LIMIT" is provided, you MUST strictly respect it.

    --- CONTENT REQUIREMENTS ---
    - **Goal Title**: Simplify the user's input into a concise, punchy title (max 5-7 words).
    - **Summary**: Explain the "First Principles" logic. Why is this the most efficient path? What fundamental truth is this based on?
    - **Motivational Quote**: Provide a quote about that fits the context.
    - **Steps**: Be actionable, direct, and non-bureaucratic.

    GENERATE THE JSON NOW based on this First Principles analysis.
  `;

  // We generate a persistent ID for the plan upfront so partial updates share the same ID
  const planId = crypto.randomUUID();
  const timestamp = Date.now();

  const responseStream = await ai.models.generateContentStream({
    model: "gemini-3-pro-preview",
    contents: adaptivePrompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          goal: { type: Type.STRING, description: "A concise, high-impact title for the plan (max 5-7 words). Simplify the input." },
          summary: { type: Type.STRING, description: "First Principles Analysis: Why this approach?" },
          motivationalQuote: { type: Type.STRING, description: "Quote about innovation/physics" },
          phases: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING, description: "phase-id" },
                title: { type: Type.STRING, description: "Phase title" },
                description: { type: Type.STRING, description: "Phase description" },
                duration: { type: Type.STRING, description: "Duration string" },
                isRecurring: { type: Type.BOOLEAN, description: "Is recurring?" },
                frequency: { type: Type.STRING, description: "Frequency string" },
                steps: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING, description: "step-id" },
                      title: { type: Type.STRING, description: "Task title" },
                      description: { type: Type.STRING, description: "Instruction" },
                      estimatedDuration: { type: Type.STRING, description: "Duration e.g. '45 mins', '1 Day'" },
                      isBreakable: { type: Type.BOOLEAN, description: "TRUE if Macro (needs breakdown), FALSE if Micro (atomic)" },
                      difficulty: { 
                        type: Type.STRING, 
                        enum: [Difficulty.Easy, Difficulty.Medium, Difficulty.Hard]
                      },
                      type: { 
                        type: Type.STRING, 
                        enum: [TaskType.Research, TaskType.Action, TaskType.Milestone, TaskType.Preparation]
                      }
                    },
                    required: ["id", "title", "description", "estimatedDuration", "difficulty", "type", "isBreakable"]
                  }
                }
              },
              required: ["id", "title", "description", "duration", "isRecurring", "steps"]
            }
          }
        },
        required: ["goal", "summary", "motivationalQuote", "phases"],
      }
    }
  });

  let accumulatedText = "";

  for await (const chunk of responseStream) {
      accumulatedText += chunk.text;
      
      // Attempt to parse partially
      if (options.onPartialUpdate) {
          try {
              const repairedJson = naiveJsonRepair(accumulatedText);
              const partialObj = JSON.parse(repairedJson) as Partial<PlanResponse>;
              
              // Only trigger update if we have at least a goal or some structure
              if (partialObj.goal || partialObj.phases) {
                  options.onPartialUpdate({
                      id: planId,
                      createdAt: timestamp,
                      goal: partialObj.goal || goal,
                      summary: partialObj.summary || "Deriving axioms...",
                      motivationalQuote: partialObj.motivationalQuote || "...",
                      phases: partialObj.phases || []
                  });
              }
          } catch (e) {
              // Ignore parse errors during stream, just wait for more data
          }
      }
  }

  // Final Parse
  let finalPlan: PlanResponse;
  try {
    // Ensure no markdown block remains at the end
    let cleanText = accumulatedText.trim();
    if (cleanText.startsWith('```json')) cleanText = cleanText.replace(/^```json/, '').replace(/```$/, '');
    else if (cleanText.startsWith('```')) cleanText = cleanText.replace(/^```/, '').replace(/```$/, '');
    
    const parsed = JSON.parse(cleanText) as Omit<PlanResponse, 'id' | 'createdAt'>;
    finalPlan = {
      ...parsed,
      id: planId,
      createdAt: timestamp
    };
  } catch (e) {
    console.error("Final JSON Parse Failed", e);
    console.log("Accumulated Text was:", accumulatedText);
    
    // Fallback: try repair one last time
    const repaired = naiveJsonRepair(accumulatedText);
    const parsed = JSON.parse(repaired);
    finalPlan = {
       ...parsed,
       id: planId,
       createdAt: timestamp
    }
  }
  
  return finalPlan;
};