
export type Status = 'Backlog' | 'ToDo' | 'InProgress' | 'Done';

export interface System {
  id: string;
  name: string;
  description: string;
  readme?: string; // Context/Documentation
  subsystems: Subsystem[];
}

export interface Subsystem {
  id: string;
  name: string;
  description: string;
  readme?: string; // Context/Documentation
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
