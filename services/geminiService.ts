import { GoogleGenAI, Type } from "@google/genai";
import { PlanResponse, Difficulty, TaskType, Language } from "../types";

const apiKey = process.env.API_KEY;

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: apiKey });

interface GenOptions {
  isSubTask?: boolean;
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

  const isSubTask = options.isSubTask || false;
  
  const langInstruction = language === 'zh' 
    ? "OUTPUT LANGUAGE: CHINESE (Simplified). All titles, descriptions, summaries, and quotes MUST be in Chinese." 
    : "OUTPUT LANGUAGE: ENGLISH.";

  // --- PROMPT STRATEGY 1: ROOT GOAL (Strategic, Phased, Daily/Weekly units) ---
  const rootPrompt = `
    Act as an expert strategic planner.
    User Goal: "${goal}"
    ${langInstruction}

    Your Objective: Create a High-Level Roadmap.

    STRATEGY:
    1. **Hierarchy**: 
       - Level 1: **Phases** (Time-bound stages e.g., "Phase 1: Preparation", "Phase 2: Execution" OR Recurring Cycles e.g., "Weekly Routine").
       - Level 2: **Steps** MUST be **Days**, **Weeks**, or **Sessions**. (e.g., "Day 1: Setup Environment", "Week 2: Advanced Topics", "Monday: Chest Day").
    
    2. **Granularity Rules (CRITICAL)**: 
       - **FORBIDDEN**: Do NOT list granular hourly tasks (e.g., "Read page 5", "Install software"). 
       - The smallest unit at this root level must be a **DAY** or a **MAJOR SESSION**.
       - **'isBreakable'**: MUST be **true** for ALL steps at this level (because a 'Day' can always be broken down into hours).

    3. **Recurring/Cycle**:
       - If the goal implies a repeating routine (e.g., "Lose weight", "Learn Piano"), create a Phase with 'isRecurring': true.
       - The steps inside should be the repeating units (e.g., "Morning Practice", "Evening Review" OR "Monday", "Tuesday").

    Data Rules:
    - 'estimatedDuration': Should be "1 Day", "3 Days", "1 Week", "2 Hours Session" (Must imply a composite block of time).
    - 'isBreakable': true.
  `;

  // --- PROMPT STRATEGY 2: SUB-TASK (Tactical, Hourly) ---
  const subTaskPrompt = `
    Act as an Execution Specialist.
    Context: The user needs to complete a specific sub-unit of a larger goal: "${goal}".
    ${langInstruction}

    Your Objective: Break this specific "Day" or "Session" into immediately executable, atomic hourly steps.

    STRATEGY:
    1. **NO PHASES**: Create a single flow of execution.
    2. **HOURLY LIMIT**: Every single step MUST be small enough to complete in **1 HOUR or less**.
       - If a step takes 2 hours, split it: "Part 1", "Part 2".
    3. **ATOMICITY**: 'isBreakable': false (These are the leaves of the tree).

    Structure:
    - Return a single Phase named "Execution Protocol".
  `;

  const selectedPrompt = isSubTask ? subTaskPrompt : rootPrompt;

  // We generate a persistent ID for the plan upfront so partial updates share the same ID
  const planId = crypto.randomUUID();
  const timestamp = Date.now();

  const responseStream = await ai.models.generateContentStream({
    model: "gemini-3-pro-preview",
    contents: selectedPrompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          goal: { type: Type.STRING, description: "The goal title" },
          summary: { type: Type.STRING, description: "Executive summary" },
          motivationalQuote: { type: Type.STRING, description: "Motivational quote" },
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
                      isBreakable: { type: Type.BOOLEAN, description: "True if task > 1 hour" },
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
                      summary: partialObj.summary || "Generating strategy...",
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