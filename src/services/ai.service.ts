
import { Injectable, signal } from '@angular/core';
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AiService {
  private ai: GoogleGenAI | null = null;
  readonly isConfigured = signal(false);

  constructor() {
    const apiKey = environment.API_KEY;

    if (apiKey) {
      this.configure(apiKey);
    } else {
        console.log('Nebula RMS: No API_KEY found. Waiting for manual configuration.');
    }
  }

  configure(apiKey: string): boolean {
    if (!apiKey.trim()) return false;
    try {
      this.ai = new GoogleGenAI({ apiKey });
      this.isConfigured.set(true);
      return true;
    } catch (e) {
      console.error('Failed to initialize GoogleGenAI', e);
      this.isConfigured.set(false);
      return false;
    }
  }

  async generateRequirements(context: string, documentation: string, userStory: string): Promise<any[]> {
    if (!this.ai || !this.isConfigured()) {
      console.warn('AI Service is not configured. Cannot generate requirements.');
      return [];
    }

    const prompt = `
      You are a specialized Business Analyst and Technical Architect AI.
      
      CONTEXT (Hierarchy):
      ${context}

      SYSTEM DOCUMENTATION & TECHNICAL CONSTRAINTS:
      ${documentation}

      USER STORY / GOAL:
      "${userStory}"

      TASK:
      Decompose the User Story above into 3-5 granular technical requirements/tasks for a Kanban board.
      Ensure the requirements align with the provided System Documentation and Technical Constraints.
      
      OUTPUT FORMAT:
      Return a JSON array of objects.
    `;

    const schema: Schema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "Concise task title" },
          description: { type: Type.STRING, description: "Detailed acceptance criteria, technical implementation details based on documentation." },
          priority: { type: Type.STRING, enum: ['Low', 'Medium', 'High'] }
        },
        required: ['title', 'description', 'priority']
      }
    };

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: schema,
          temperature: 0.7
        }
      });
      
      const text = response.text;
      return JSON.parse(text || '[]');
    } catch (e) {
      console.error('AI Generation Error', e);
      return [];
    }
  }
}
