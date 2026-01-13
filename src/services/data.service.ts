
import { Injectable, signal, computed, effect } from '@angular/core';
import { System, Subsystem, Feature, Requirement, Status } from '../models/data.models';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  // --- State Signals ---
  readonly systems = signal<System[]>([]);
  readonly requirements = signal<Requirement[]>([]);
  
  // --- Selection State ---
  readonly selectedSystemId = signal<string | null>(null);
  readonly selectedSubsystemId = signal<string | null>(null);
  readonly selectedFeatureId = signal<string | null>(null);

  constructor() {
    this.loadFromStorage();

    // Auto-save effect
    effect(() => {
      localStorage.setItem('nebula_systems', JSON.stringify(this.systems()));
      localStorage.setItem('nebula_requirements', JSON.stringify(this.requirements()));
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

  private seedData() {
    const sysId = crypto.randomUUID();
    const subId = crypto.randomUUID();
    const featId = crypto.randomUUID();

    const initialSystem: System = {
      id: sysId,
      name: 'E-Commerce Platform',
      description: 'Main customer facing retail platform',
      subsystems: [{
        id: subId,
        name: 'Checkout',
        description: 'Payment and Order processing',
        systemId: sysId,
        features: [{
          id: featId,
          name: 'Payment Gateway',
          description: 'Stripe and PayPal integration',
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

  deleteRequirement(id: string) {
    this.requirements.update(reqs => reqs.filter(r => r.id !== id));
  }
}
