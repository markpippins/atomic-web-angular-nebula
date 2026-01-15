
import { Injectable, signal, computed, effect } from '@angular/core';
import { System, Subsystem, Feature, Requirement, Status } from '../models/data.models';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  // --- State Signals ---
  readonly systems = signal<System[]>([]);
  readonly requirements = signal<Requirement[]>([]);
  
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

  // --- UI State ---
  readonly darkMode = signal<boolean>(false);

  // --- Selection State ---
  readonly selectedSystemId = signal<string | null>(null);
  readonly selectedSubsystemId = signal<string | null>(null);
  readonly selectedFeatureId = signal<string | null>(null);

  constructor() {
    this.loadFromStorage();
    this.initTheme();

    // Auto-save data
    effect(() => {
      localStorage.setItem('nebula_systems', JSON.stringify(this.systems()));
      localStorage.setItem('nebula_requirements', JSON.stringify(this.requirements()));
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

    if (savedSystems) {
      this.systems.set(JSON.parse(savedSystems));
    } else {
      // Seed data if empty
      this.seedData();
    }

    if (savedReqs) {
      this.requirements.set(JSON.parse(savedReqs));
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

  private seedData() {
    const sysId = crypto.randomUUID();
    const subId = crypto.randomUUID();
    const featId = crypto.randomUUID();

    const initialSystem: System = {
      id: sysId,
      name: 'E-Commerce Platform',
      description: 'Main customer facing retail platform',
      readme: '# E-Commerce Platform Architecture\nThis system handles all customer-facing interactions.\n\n## Tech Stack\n- Angular 18\n- Node.js API\n- PostgreSQL',
      subsystems: [{
        id: subId,
        name: 'Checkout',
        description: 'Payment and Order processing',
        readme: '## Checkout Flow\n1. Cart validation\n2. User auth check\n3. Shipping address\n4. Payment processing',
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
      subsystems: []
    };
    this.systems.update(s => [...s, newSystem]);
  }

  addSubsystem(systemId: string, name: string, description: string) {
    this.systems.update(systems => systems.map(sys => {
      if (sys.id === systemId) {
        return {
          ...sys,
          subsystems: [...sys.subsystems, {
            id: crypto.randomUUID(),
            name,
            description,
            features: [],
            systemId
          }]
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
}
