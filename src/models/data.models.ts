
export type Status = 'Backlog' | 'ToDo' | 'InProgress' | 'Done';

export type FolderCategory = 'UI' | 'Service' | 'Library';

export interface SystemFolder {
  id: string;
  name: string;
  category: FolderCategory;
  note: string;
}

export interface System {
  id: string;
  name: string;
  description: string;
  readme?: string; // Context/Documentation
  subsystems: Subsystem[];
  folders: SystemFolder[];
}

export interface Subsystem {
  id: string;
  name: string;
  description: string;
  readme?: string; // Context/Documentation
  color?: string; // UI Color identifier
  features: Feature[];
  systemId: string; // Parent reference
}

export interface Feature {
  id: string;
  name: string;
  description: string;
  readme?: string; // Context/Documentation
  subsystemId: string; // Parent reference
}

export interface Requirement {
  id: string;
  title: string;
  description: string;
  status: Status;
  priority: 'Low' | 'Medium' | 'High';
  systemId: string;
  subsystemId: string;
  featureId: string;
  startDate?: string;
  completionDate?: string;
  createdAt: number;
}

export interface WorkSession {
  id: string;
  parentId: string;
  parentType: 'System' | 'Subsystem' | 'Feature' | 'Requirement';
  parentName: string; // Snapshot for display
  context: string;
  platform: string;
  model: string;
  outcome?: string;
  status: 'Pending' | 'Completed';
  createdAt: number;
  updatedAt: number;
}

export const AI_PLATFORMS: Record<string, string[]> = {
  'Cursor': ['Claude 3.5 Sonnet', 'GPT-4o', 'DeepSeek R1', 'Gemini 1.5 Pro', 'Big Pickle'],
  'Windsurf': ['Cascade (Claude 3.5)', 'Cascade (GPT-4o)'],
  'Trae': ['Claude 3.5 Sonnet', 'GPT-4o'],
  'OpenCode': ['Default Model'],
  'Antigravity': ['Default Model'],
  'Replit': ['Replit Agent', 'Ghostwriter'],
  'Google IDX': ['Gemini 2.0 Flash', 'Gemini 1.5 Pro'],
  'VS Code (Copilot)': ['GPT-4o', 'Claude 3.5 Sonnet'],
  'Web (ChatGPT)': ['GPT-4o', 'o1', 'o3-mini'],
  'Web (Claude)': ['Claude 3.5 Sonnet', 'Claude 3 Opus'],
  'Web (Gemini)': ['Gemini Advanced', 'Gemini 2.5 Flash'],
  'Custom': ['Other']
};
