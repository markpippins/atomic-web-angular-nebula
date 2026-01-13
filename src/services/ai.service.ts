
import { Injectable } from '@angular/core';
import { GoogleGenAI } from '@google/genai';

@Injectable({
  providedIn: 'root'
})
export class AiService {
  private ai: GoogleGenAI;

  constructor() {
    // Initialize Gemini Client
    // process.env.API_KEY is guaranteed to be available in this environment
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async generateRequirements(systemName: string, featureName: string): Promise<any[]> {
    try {
      const prompt = `
        Act as a Senior Business Analyst. Generate 3 detailed software requirements for a system named "${systemName}" and specifically for the feature "${featureName}".
        Return a JSON array where each object has:
        - "title": Short summary (max 10 words)
        - "description": Detailed description including acceptance criteria.
        - "priority": "Low", "Medium", or "High"
        
        Ensure the response is strictly a JSON array. Do not include markdown code blocks.
      `;

      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const text = response.text;
      if (!text) return [];
      
      return JSON.parse(text);
    } catch (e) {
      console.error('AI Generation Failed', e);
      return [];
    }
  }

  async suggestSubsystems(systemName: string, description: string): Promise<any[]> {
    try {
       const prompt = `
        Analyze the system "${systemName}": ${description}.
        Suggest 3 logical subsystems that would be part of this architecture.
        Return a JSON array where each object has:
        - "name": Subsystem name
        - "description": Brief description
        
        Ensure response is JSON array.
      `;
      
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });
      
      const text = response.text;
      return text ? JSON.parse(text) : [];
    } catch (e) {
      return [];
    }
  }
}
