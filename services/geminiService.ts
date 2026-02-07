import { GoogleGenAI, Type } from "@google/genai";
import { AIAnalysisResponse, AICommandResult, Priority, Todo } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeTaskWithAI = async (taskDescription: string): Promise<AIAnalysisResponse> => {
  if (!taskDescription.trim()) return { checklist: [], priority: 'medium' };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Analyze the task: "${taskDescription}".
      
      1. Assign a priority level ('high', 'medium', 'low').
      2. CRITICAL: Create a checklist of 3-5 preparation steps (mini-requirements) needed BEFORE doing this task.
         - Example for "Meeting": ["Prepare Agenda", "Read Brief", "Check Audio/Video"].
      3. Extract specific time (e.g., "at 5pm" -> "17:00"). If no time, return null.
      
      Return JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            checklist: { type: Type.ARRAY, items: { type: Type.STRING } },
            priority: { type: Type.STRING, enum: ["high", "medium", "low"] },
            suggestedTime: { type: Type.STRING, nullable: true }
          },
          required: ["checklist", "priority"],
        },
      },
    });

    return JSON.parse(response.text || "{}") as AIAnalysisResponse;
  } catch (error) {
    console.error("Error analyzing task:", error);
    return { checklist: [], priority: 'medium' };
  }
};

export const processNaturalLanguageCommand = async (userInput: string, currentTodos: Todo[]): Promise<AICommandResult[]> => {
  if (!userInput.trim()) return [];

  // Simplify current tasks for context to save tokens
  const contextList = currentTodos.map(t => ({
    id: t.id,
    text: t.text,
    date: new Date(t.dueDate).toLocaleDateString(),
    time: t.isTimeSet ? new Date(t.dueDate).toLocaleTimeString() : "No time"
  }));

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `
      Current Schedule: ${JSON.stringify(contextList)}
      
      User Command/Input: "${userInput}"

      Instructions:
      1. Analyze the user input. Is it adding new tasks OR modifying existing ones?
      2. If the user says "Reschedule meeting to 10am", find the "meeting" task in Current Schedule and return action: 'update'.
      3. If the user says "Add a task to buy milk", return action: 'create'.
      4. If the user pastes a full new schedule, return multiple 'create' actions.
      5. For 'suggestedTime', if NO time is given, pick a logical slot between 09:00 and 17:00 that doesn't conflict.
      6. CRITICAL: For every 'create' action, you MUST generate a specific 'checklist' of 3-5 preparation steps/mini-requirements. Do NOT leave checklist empty.
      
      Return JSON Array of actions.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              action: { type: Type.STRING, enum: ["create", "update"] },
              originalId: { type: Type.STRING, description: "ID of task to update, null if create", nullable: true },
              text: { type: Type.STRING },
              priority: { type: Type.STRING, enum: ["high", "medium", "low"] },
              checklist: { type: Type.ARRAY, items: { type: Type.STRING } },
              dueDateOffset: { type: Type.NUMBER },
              suggestedTime: { type: Type.STRING, description: "HH:MM format 24h" },
              reason: { type: Type.STRING }
            },
            required: ["action", "text", "priority", "checklist"]
          }
        },
      },
    });

    return JSON.parse(response.text || "[]") as AICommandResult[];
  } catch (error) {
    console.error("Error processing NLP command:", error);
    return [];
  }
};

export const generateDailyBriefing = async (todos: Todo[]): Promise<string> => {
  if (todos.length === 0) return "No tasks available for analysis.";

  const taskList = todos.map(t => {
     const timeStr = t.isTimeSet ? ` at ${new Date(t.dueDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` : '';
     return `- [${t.priority.toUpperCase()}] ${t.text}${timeStr}`;
  }).join('\n');

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `You are a strategic business manager. Review this task list:
      ${taskList}
      
      Provide a concise 3-sentence "Morning Briefing". 
      1. Highlight the critical focus.
      2. Identify bottlenecks.
      3. Offer a motivating closing.`,
    });
    return response.text || "Could not generate briefing.";
  } catch (error) {
    return "AI Service unavailable for briefing.";
  }
}