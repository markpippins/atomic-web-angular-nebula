
import { Injectable, signal, computed, effect } from '@angular/core';
import { System, Subsystem, Feature, Requirement, Status, WorkSession, FolderCategory } from '../models/data.models';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  // --- State Signals ---
  readonly systems = signal<System[]>([]);
  readonly requirements = signal<Requirement[]>([]);
  readonly workSessions = signal<WorkSession[]>([]);
  
  // --- Computed State for UI ---
  readonly sortedSystems = computed(() => {
    const sortByName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name);
    
    return this.systems().map(sys => ({
      ...sys,
      subsystems: sys.subsystems.map(sub => ({
        ...sub,
        features: [...sub.features].sort(sortByName)
      })).sort(sortByName)
    })).sort(sortByName);
  });

  // Global map of subsystem IDs to colors for easy lookup in views
  readonly subsystemColorMap = computed(() => {
    const map = new Map<string, string>();
    this.systems().forEach(sys => {
      sys.subsystems.forEach(sub => {
        if (sub.color) map.set(sub.id, sub.color);
      });
    });
    return map;
  });

  // --- UI State ---
  readonly darkMode = signal<boolean>(false);

  // --- Selection State ---
  readonly selectedSystemId = signal<string | null>(null);
  readonly selectedSubsystemId = signal<string | null>(null);
  readonly selectedFeatureId = signal<string | null>(null);

  // Palette for subsystems
  private readonly colorPalette = [
    '#EF4444', // Red
    '#F97316', // Orange
    '#F59E0B', // Amber
    '#10B981', // Emerald
    '#06B6D4', // Cyan
    '#3B82F6', // Blue
    '#6366F1', // Indigo
    '#8B5CF6', // Violet
    '#EC4899', // Pink
    '#F43F5E', // Rose
    '#84CC16', // Lime
    '#14B8A6', // Teal
  ];

  constructor() {
    this.loadFromStorage();
    this.initTheme();

    // Auto-save data
    effect(() => {
      localStorage.setItem('nebula_systems', JSON.stringify(this.systems()));
      localStorage.setItem('nebula_requirements', JSON.stringify(this.requirements()));
      localStorage.setItem('nebula_sessions', JSON.stringify(this.workSessions()));
    });

    // Auto-save theme & Apply to DOM
    effect(() => {
      const isDark = this.darkMode();
      localStorage.setItem('nebula_dark_mode', String(isDark));
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    });
  }

  private loadFromStorage() {
    const savedSystems = localStorage.getItem('nebula_systems');
    const savedReqs = localStorage.getItem('nebula_requirements');
    const savedSessions = localStorage.getItem('nebula_sessions');

    if (savedSystems) {
      this.systems.set(JSON.parse(savedSystems));
    } else {
      // Seed data if empty
      this.seedData();
    }

    if (savedReqs) {
      this.requirements.set(JSON.parse(savedReqs));
    }

    if (savedSessions) {
      this.workSessions.set(JSON.parse(savedSessions));
    }
  }

  private initTheme() {
    const saved = localStorage.getItem('nebula_dark_mode');
    if (saved !== null) {
        this.darkMode.set(saved === 'true');
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        this.darkMode.set(true);
    }
  }

  toggleTheme() {
    this.darkMode.update(d => !d);
  }

  private getUniqueColor(systemId: string): string {
    const system = this.systems().find(s => s.id === systemId);
    if (!system) return this.colorPalette[0];

    const usedColors = new Set(system.subsystems.map(s => s.color));
    
    // Find first unused color
    const available = this.colorPalette.find(c => !usedColors.has(c));
    
    // Return available or random if all used
    return available || this.colorPalette[Math.floor(Math.random() * this.colorPalette.length)];
  }

  private seedData() {
    const sysId = crypto.randomUUID();
    const subId = crypto.randomUUID();
    const featId = crypto.randomUUID();

    const initialSystem: System = {
      id: sysId,
      name: 'E-Commerce Platform',
      description: 'Main customer facing retail platform',
      readme: '# E-Commerce Platform Architecture\nThis system handles all customer-facing interactions.\n\n## Tech Stack\n- Angular 18\n- Node.js API\n- PostgreSQL',
      folders: [
        { id: crypto.randomUUID(), name: 'webapp', category: 'UI', note: 'Main storefront angular app' },
        { id: crypto.randomUUID(), name: 'api-gateway', category: 'Service', note: 'BFF for mobile and web' }
      ],
      subsystems: [{
        id: subId,
        name: 'Checkout',
        description: 'Payment and Order processing',
        readme: '## Checkout Flow\n1. Cart validation\n2. User auth check\n3. Shipping address\n4. Payment processing',
        color: '#10B981',
        systemId: sysId,
        features: [{
          id: featId,
          name: 'Payment Gateway',
          description: 'Stripe and PayPal integration',
          readme: 'Integration requirements for Stripe v3 API.',
          subsystemId: subId
        }]
      }]
    };
    this.systems.set([initialSystem]);
    
    // Select the first item by default for better UX
    this.selectedSystemId.set(sysId);
  }

  // --- Actions ---

  addSystem(name: string, description: string) {
    const newSystem: System = {
      id: crypto.randomUUID(),
      name,
      description,
      folders: [],
      subsystems: []
    };
    this.systems.update(s => [...s, newSystem]);
  }

  addSubsystem(systemId: string, name: string, description: string) {
    const color = this.getUniqueColor(systemId);
    
    this.systems.update(systems => systems.map(sys => {
      if (sys.id === systemId) {
        return {
          ...sys,
          subsystems: [...sys.subsystems, {
            id: crypto.randomUUID(),
            name,
            description,
            color,
            features: [],
            systemId
          }]
        };
      }
      return sys;
    }));
  }

  updateSubsystemColor(systemId: string, subsystemId: string, color: string) {
    this.systems.update(systems => systems.map(sys => {
      if (sys.id === systemId) {
        return {
          ...sys,
          subsystems: sys.subsystems.map(sub => 
             sub.id === subsystemId ? { ...sub, color } : sub
          )
        };
      }
      return sys;
    }));
  }

  addFeature(systemId: string, subsystemId: string, name: string, description: string) {
    this.systems.update(systems => systems.map(sys => {
      if (sys.id === systemId) {
        const updatedSubsystems = sys.subsystems.map(sub => {
          if (sub.id === subsystemId) {
            return {
              ...sub,
              features: [...sub.features, {
                id: crypto.randomUUID(),
                name,
                description,
                subsystemId
              }]
            };
          }
          return sub;
        });
        return { ...sys, subsystems: updatedSubsystems };
      }
      return sys;
    }));
  }

  // --- Folder Management ---
  
  addSystemFolder(systemId: string, folder: { name: string, category: FolderCategory, note: string }) {
    this.systems.update(systems => systems.map(sys => {
      if (sys.id === systemId) {
        return {
          ...sys,
          folders: [...(sys.folders || []), {
            id: crypto.randomUUID(),
            ...folder
          }]
        };
      }
      return sys;
    }));
  }

  deleteSystemFolder(systemId: string, folderId: string) {
    this.systems.update(systems => systems.map(sys => {
      if (sys.id === systemId) {
        return {
          ...sys,
          folders: (sys.folders || []).filter(f => f.id !== folderId)
        };
      }
      return sys;
    }));
  }

  // --- Documentation Updates ---

  updateSystemReadme(id: string, readme: string) {
    this.systems.update(s => s.map(sys => sys.id === id ? { ...sys, readme } : sys));
  }

  updateSubsystemReadme(sysId: string, subId: string, readme: string) {
    this.systems.update(s => s.map(sys => {
      if (sys.id === sysId) {
        return {
          ...sys,
          subsystems: sys.subsystems.map(sub => sub.id === subId ? { ...sub, readme } : sub)
        };
      }
      return sys;
    }));
  }

  updateFeatureReadme(sysId: string, subId: string, featId: string, readme: string) {
    this.systems.update(s => s.map(sys => {
      if (sys.id === sysId) {
        const subs = sys.subsystems.map(sub => {
          if (sub.id === subId) {
            return {
              ...sub,
              features: sub.features.map(f => f.id === featId ? { ...f, readme } : f)
            };
          }
          return sub;
        });
        return { ...sys, subsystems: subs };
      }
      return sys;
    }));
  }

  addRequirement(req: Omit<Requirement, 'id' | 'createdAt'>) {
    const newReq: Requirement = {
      ...req,
      id: crypto.randomUUID(),
      createdAt: Date.now()
    };
    this.requirements.update(r => [...r, newReq]);
  }

  updateRequirementStatus(id: string, newStatus: Status) {
    this.requirements.update(reqs => reqs.map(r => 
      r.id === id ? { ...r, status: newStatus } : r
    ));
  }

  // Batch update for Export Rollup
  batchUpdateRequirementStatus(ids: string[], newStatus: Status) {
      if (!ids.length) return;
      this.requirements.update(reqs => reqs.map(r => 
        ids.includes(r.id) ? { ...r, status: newStatus } : r
      ));
  }

  updateRequirement(id: string, updates: Partial<Requirement>) {
    this.requirements.update(reqs => reqs.map(r => 
      r.id === id ? { ...r, ...updates } : r
    ));
  }

  deleteRequirement(id: string) {
    this.requirements.update(reqs => reqs.filter(r => r.id !== id));
  }

  deleteSystem(id: string) {
    this.systems.update(s => s.filter(sys => sys.id !== id));
    // Cascade delete requirements
    this.requirements.update(reqs => reqs.filter(r => r.systemId !== id));
    // Cascade delete sessions
    this.workSessions.update(ws => ws.filter(s => s.parentId !== id)); 
    
    if (this.selectedSystemId() === id) {
      this.selectedSystemId.set(null);
      this.selectedSubsystemId.set(null);
      this.selectedFeatureId.set(null);
    }
  }

  deleteSubsystem(systemId: string, subId: string) {
    this.systems.update(systems => systems.map(sys => {
      if (sys.id === systemId) {
        return {
          ...sys,
          subsystems: sys.subsystems.filter(sub => sub.id !== subId)
        };
      }
      return sys;
    }));
    // Cascade delete requirements
    this.requirements.update(reqs => reqs.filter(r => r.subsystemId !== subId));

    if (this.selectedSubsystemId() === subId) {
      this.selectedSubsystemId.set(null);
      this.selectedFeatureId.set(null);
    }
  }

  deleteFeature(systemId: string, subId: string, featId: string) {
    this.systems.update(systems => systems.map(sys => {
      if (sys.id === systemId) {
        const updatedSubsystems = sys.subsystems.map(sub => {
          if (sub.id === subId) {
            return {
              ...sub,
              features: sub.features.filter(f => f.id !== featId)
            };
          }
          return sub;
        });
        return { ...sys, subsystems: updatedSubsystems };
      }
      return sys;
    }));
    // Cascade delete requirements
    this.requirements.update(reqs => reqs.filter(r => r.featureId !== featId));

    if (this.selectedFeatureId() === featId) {
      this.selectedFeatureId.set(null);
    }
  }

  // --- Work Sessions ---
  addWorkSession(session: Omit<WorkSession, 'id' | 'createdAt' | 'updatedAt'>) {
    const newSession: WorkSession = {
        ...session,
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        updatedAt: Date.now()
    };
    this.workSessions.update(s => [newSession, ...s]);
  }

  updateWorkSession(id: string, updates: Partial<WorkSession>) {
      this.workSessions.update(sessions => sessions.map(s => 
          s.id === id ? { ...s, ...updates, updatedAt: Date.now() } : s
      ));
  }

  deleteWorkSession(id: string) {
      this.workSessions.update(s => s.filter(session => session.id !== id));
  }
}
