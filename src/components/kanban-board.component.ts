
import { Component, inject, computed, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../services/data.service';
import { AiService } from '../services/ai.service';
import { Requirement, Status } from '../models/data.models';
import { FormsModule } from '@angular/forms';
import { BoardViewComponent } from './board-view.component';
import { TableViewComponent } from './table-view.component';

@Component({
  selector: 'app-kanban-board',
  standalone: true,
  imports: [CommonModule, FormsModule, BoardViewComponent, TableViewComponent],
  templateUrl: './kanban-board.component.html'
})
export class KanbanBoardComponent {
  dataService = inject(DataService);
  aiService = inject(AiService);
  
  viewMode = signal<'board' | 'table' | 'docs'>('board');
  searchTerm = signal('');
  showModal = signal(false);
  showAiModal = signal(false);
  isGenerating = signal(false);

  // Form State
  newReqTitle = '';
  newReqDesc = '';
  newReqPriority: 'Low' | 'Medium' | 'High' = 'Medium';
  
  // AI Form State
  userStoryPrompt = '';

  // Docs Editing State
  editableReadme = signal('');

  // Computed Context
  selectedSystem = computed(() => 
    this.dataService.systems().find(s => s.id === this.dataService.selectedSystemId())
  );

  selectedSubsystem = computed(() => {
    const sys = this.selectedSystem();
    return sys?.subsystems.find(s => s.id === this.dataService.selectedSubsystemId());
  });

  selectedFeature = computed(() => {
    const sub = this.selectedSubsystem();
    return sub?.features.find(f => f.id === this.dataService.selectedFeatureId());
  });

  // Current Documentation based on selection level
  currentReadme = computed(() => {
    if (this.selectedFeature()) return this.selectedFeature()!.readme || '';
    if (this.selectedSubsystem()) return this.selectedSubsystem()!.readme || '';
    if (this.selectedSystem()) return this.selectedSystem()!.readme || '';
    return '';
  });

  // Check if AI is available
  aiEnabled = computed(() => this.aiService.isConfigured);

  // Effect to update editor when selection changes
  constructor() {
    effect(() => {
        this.editableReadme.set(this.currentReadme());
    });
  }

  saveReadme() {
    const content = this.editableReadme();
    const feat = this.selectedFeature();
    const sub = this.selectedSubsystem();
    const sys = this.selectedSystem();

    if (feat && sub && sys) {
        this.dataService.updateFeatureReadme(sys.id, sub.id, feat.id, content);
    } else if (sub && sys) {
        this.dataService.updateSubsystemReadme(sys.id, sub.id, content);
    } else if (sys) {
        this.dataService.updateSystemReadme(sys.id, content);
    }
  }

  filteredRequirements = computed(() => {
    let reqs = this.dataService.requirements();
    const fId = this.dataService.selectedFeatureId();
    const sId = this.dataService.selectedSubsystemId();
    const sysId = this.dataService.selectedSystemId();

    // Context Filtering
    if (fId) reqs = reqs.filter(r => r.featureId === fId);
    else if (sId) reqs = reqs.filter(r => r.subsystemId === sId);
    else if (sysId) reqs = reqs.filter(r => r.systemId === sysId);

    // Search Filtering
    const term = this.searchTerm().toLowerCase();
    if (term) {
        reqs = reqs.filter(r => 
            r.title.toLowerCase().includes(term) || 
            r.description.toLowerCase().includes(term)
        );
    }

    return reqs;
  });

  canAddRequirement = computed(() => !!this.selectedFeature());

  openAddModal() {
    this.newReqTitle = '';
    this.newReqDesc = '';
    this.showModal.set(true);
  }

  openAiModal() {
    if (!this.aiEnabled()) return;
    this.userStoryPrompt = '';
    this.showAiModal.set(true);
  }

  async generateAiRequirements() {
    const feat = this.selectedFeature();
    const sub = this.selectedSubsystem();
    const sys = this.selectedSystem();
    
    if (!feat || !sub || !sys || !this.userStoryPrompt.trim()) return;

    this.isGenerating.set(true);
    const context = `System: ${sys.name}, Subsystem: ${sub.name}, Feature: ${feat.name}`;

    // Stack the documentation: System -> Subsystem -> Feature
    let docStack = '';
    if (sys.readme) docStack += `[SYSTEM DOCS]:\n${sys.readme}\n\n`;
    if (sub.readme) docStack += `[SUBSYSTEM DOCS]:\n${sub.readme}\n\n`;
    if (feat.readme) docStack += `[FEATURE DOCS]:\n${feat.readme}\n\n`;

    try {
      const generated = await this.aiService.generateRequirements(context, docStack, this.userStoryPrompt);
      
      // Batch add
      generated.forEach(req => {
        this.dataService.addRequirement({
          title: req.title,
          description: req.description,
          priority: req.priority,
          status: 'Backlog',
          systemId: sys.id,
          subsystemId: sub.id,
          featureId: feat.id
        });
      });
      
      this.showAiModal.set(false);
    } finally {
      this.isGenerating.set(false);
    }
  }

  createManual() {
    const feat = this.selectedFeature();
    if (!feat) return;

    this.dataService.addRequirement({
      title: this.newReqTitle,
      description: this.newReqDesc,
      priority: this.newReqPriority,
      status: 'Backlog',
      systemId: this.dataService.selectedSystemId()!,
      subsystemId: this.dataService.selectedSubsystemId()!,
      featureId: feat.id
    });
    this.showModal.set(false);
  }
}
