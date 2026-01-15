
import { Component, inject, computed, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../services/data.service';
import { AiService } from '../services/ai.service';
import { Requirement, Status, AI_PLATFORMS, FolderCategory } from '../models/data.models';
import { FormsModule } from '@angular/forms';
import { BoardViewComponent } from './board-view.component';
import { TableViewComponent } from './table-view.component';
import { WorkSessionViewComponent } from './work-session-view.component';

@Component({
  selector: 'app-kanban-board',
  standalone: true,
  imports: [CommonModule, FormsModule, BoardViewComponent, TableViewComponent, WorkSessionViewComponent],
  templateUrl: './kanban-board.component.html'
})
export class KanbanBoardComponent {
  dataService = inject(DataService);
  aiService = inject(AiService);
  
  viewMode = signal<'board' | 'table' | 'docs' | 'sessions'>('board');
  searchTerm = signal('');
  showModal = signal(false);
  showAiModal = signal(false);
  showApiKeyModal = signal(false);
  showExportModal = signal(false); // New modal for export
  isGenerating = signal(false);

  // Form State
  editingReqId = signal<string | null>(null);
  newReqTitle = '';
  newReqDesc = '';
  newReqPriority: 'Low' | 'Medium' | 'High' = 'Medium';
  
  // AI Form State
  userStoryPrompt = '';
  apiKeyInput = '';

  // Export Modal State
  exportContextText = signal('');
  exportPlatform = signal('Cursor');
  exportModel = signal('');
  exportParentId = signal('');
  exportParentType = signal<'System' | 'Subsystem' | 'Feature' | 'Requirement'>('System');
  exportParentName = signal('');
  
  // Platform Data
  platforms = Object.keys(AI_PLATFORMS);
  availableModels = computed(() => AI_PLATFORMS[this.exportPlatform()] || []);

  // Docs Editing State
  editableReadme = signal('');
  importMode: 'append' | 'replace' = 'append';

  // System Folders State
  newFolderName = signal('');
  newFolderCategory = signal<FolderCategory>('UI');
  newFolderNote = signal('');

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
  aiEnabled = computed(() => this.aiService.isConfigured());

  // Effect to update editor when selection changes
  constructor() {
    effect(() => {
        this.editableReadme.set(this.currentReadme());
    });
    
    // Set default model when platform changes
    effect(() => {
        const models = AI_PLATFORMS[this.exportPlatform()];
        if (models && models.length > 0) {
            this.exportModel.set(models[0]);
        }
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

  // --- Folder Logic ---
  addFolder() {
    const sys = this.selectedSystem();
    if (sys && this.newFolderName().trim()) {
        this.dataService.addSystemFolder(sys.id, {
            name: this.newFolderName(),
            category: this.newFolderCategory(),
            note: this.newFolderNote()
        });
        this.newFolderName.set('');
        this.newFolderNote.set('');
        this.newFolderCategory.set('UI');
    }
  }

  deleteFolder(folderId: string) {
     const sys = this.selectedSystem();
     if (sys) {
         if (confirm('Delete this folder?')) {
            this.dataService.deleteSystemFolder(sys.id, folderId);
         }
     }
  }

  getCategoryClass(category: FolderCategory) {
      switch(category) {
          case 'UI': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300';
          case 'Service': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
          case 'Library': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
          default: return 'bg-gray-100 text-gray-800';
      }
  }

  triggerImport(mode: 'append' | 'replace', input: HTMLInputElement) {
    this.importMode = mode;
    input.value = ''; // Reset to allow re-selecting same file
    input.click();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    
    const file = input.files[0];
    const reader = new FileReader();
    
    reader.onload = (e) => {
        const text = e.target?.result as string;
        if (this.importMode === 'replace') {
             if (!this.editableReadme() || confirm('This will replace the current documentation. Continue?')) {
                 this.editableReadme.set(text);
             }
        } else {
             const current = this.editableReadme();
             this.editableReadme.set(current ? current + '\n\n' + text : text);
        }
    };
    reader.readAsText(file);
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
    this.editingReqId.set(null);
    this.newReqTitle = '';
    this.newReqDesc = '';
    this.newReqPriority = 'Medium';
    this.showModal.set(true);
  }

  openEditModal(req: Requirement) {
    this.editingReqId.set(req.id);
    this.newReqTitle = req.title;
    this.newReqDesc = req.description;
    this.newReqPriority = req.priority;
    this.showModal.set(true);
  }

  openAiModal() {
    if (!this.aiEnabled()) {
        this.apiKeyInput = '';
        this.showApiKeyModal.set(true);
        return;
    }
    this.userStoryPrompt = '';
    this.showAiModal.set(true);
  }

  configureApiKey() {
    if (this.apiKeyInput.trim()) {
        const success = this.aiService.configure(this.apiKeyInput.trim());
        if (success) {
            this.showApiKeyModal.set(false);
            // Do not automatically open the AI generation modal
        } else {
            alert('Failed to configure AI service.');
        }
    }
  }

  async generateAiRequirements() {
    const feat = this.selectedFeature();
    const sub = this.selectedSubsystem();
    const sys = this.selectedSystem();
    
    if (!feat || !sub || !sys || !this.userStoryPrompt.trim()) return;

    this.isGenerating.set(true);
    const context = `System: ${sys.name}, Subsystem: ${sub.name}, Feature: ${feat.name}`;

    let docStack = '';
    if (sys.readme) docStack += `[SYSTEM DOCS]:\n${sys.readme}\n\n`;
    if (sub.readme) docStack += `[SUBSYSTEM DOCS]:\n${sub.readme}\n\n`;
    if (feat.readme) docStack += `[FEATURE DOCS]:\n${feat.readme}\n\n`;

    try {
      const generated = await this.aiService.generateRequirements(context, docStack, this.userStoryPrompt);
      
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

  saveManual() {
    // Edit mode
    const editId = this.editingReqId();
    if (editId) {
        this.dataService.updateRequirement(editId, {
            title: this.newReqTitle,
            description: this.newReqDesc,
            priority: this.newReqPriority
        });
        this.showModal.set(false);
        return;
    }

    // Create mode
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

  // --- Export Logic ---

  copyPrompt(req?: Requirement) {
    const sys = this.selectedSystem();
    const sub = this.selectedSubsystem();
    const feat = this.selectedFeature();
    
    let content = 'PROJECT CONTEXT\n===============\n';
    if (sys) content += `System: ${sys.name}\nDescription: ${sys.description}\n\n`;
    if (sub) content += `Subsystem: ${sub.name}\nDescription: ${sub.description}\n\n`;
    if (feat) content += `Feature: ${feat.name}\nDescription: ${feat.description}\n\n`;

    content += 'DOCUMENTATION\n=============\n';
    if (sys?.readme) content += `[SYSTEM: ${sys.name}]\n${sys.readme}\n\n`;
    if (sub?.readme) content += `[SUBSYSTEM: ${sub.name}]\n${sub.readme}\n\n`;
    if (feat?.readme) content += `[FEATURE: ${feat.name}]\n${feat.readme}\n\n`;

    // Add Folders to Context if System
    if (sys?.folders && sys.folders.length > 0) {
        content += `\n[SYSTEM STRUCTURE]\n`;
        sys.folders.forEach(f => {
            content += `- ${f.name} [${f.category}]: ${f.note}\n`;
        });
        content += `\n`;
    }

    if (req) {
      content += 'SELECTED REQUIREMENT\n====================\n';
      content += `Title: ${req.title}\n`;
      content += `Status: ${req.status}\n`;
      content += `Priority: ${req.priority}\n`;
      content += `Description:\n${req.description}\n`;
      
      content += '\nTASK\n====\n';
      content += `[Generate implementation steps, test cases, or code for: "${req.title}"]\n`;
      
      this.exportParentId.set(req.id);
      this.exportParentType.set('Requirement');
      this.exportParentName.set(req.title);
    } else {
        // ROLL-UP REQUIREMENTS LOGIC
        const allReqs = this.dataService.requirements();
        let scopeReqs: Requirement[] = [];

        if (feat) {
            scopeReqs = allReqs.filter(r => r.featureId === feat.id);
        } else if (sub) {
            scopeReqs = allReqs.filter(r => r.subsystemId === sub.id);
        } else if (sys) {
            scopeReqs = allReqs.filter(r => r.systemId === sys.id);
        } else {
             // Fallback for "All Requirements" view if nothing selected
             scopeReqs = allReqs; 
        }

        if (scopeReqs.length > 0) {
            content += 'SCOPE REQUIREMENTS\n==================\n';
            scopeReqs.forEach((r, index) => {
                content += `${index + 1}. [${r.status}] ${r.title} (Priority: ${r.priority})\n`;
                if (r.description) {
                    content += `   Details: ${r.description.replace(/\n/g, '\n   ')}\n`;
                }
                content += '\n';
            });
        }

        content += 'TASK\n====\n';
        content += '[Enter instruction here, e.g., Implement the requirements listed above, Generate test plan, etc.]\n';
        
        // Determine parent scope IDs for the session record
        if (feat) {
            this.exportParentId.set(feat.id);
            this.exportParentType.set('Feature');
            this.exportParentName.set(feat.name);
        } else if (sub) {
            this.exportParentId.set(sub.id);
            this.exportParentType.set('Subsystem');
            this.exportParentName.set(sub.name);
        } else if (sys) {
            this.exportParentId.set(sys.id);
            this.exportParentType.set('System');
            this.exportParentName.set(sys.name);
        }
    }
    
    this.exportContextText.set(content);
    this.showExportModal.set(true);
  }

  saveExportSession() {
      // 1. Save to DB
      this.dataService.addWorkSession({
          parentId: this.exportParentId(),
          parentType: this.exportParentType(),
          parentName: this.exportParentName(),
          context: this.exportContextText(),
          platform: this.exportPlatform(),
          model: this.exportModel(),
          status: 'Pending'
      });

      // 2. Copy to Clipboard
      navigator.clipboard.writeText(this.exportContextText()).then(() => {
          alert('Session Created! Context copied to clipboard.');
      }).catch(err => {
          console.error('Copy failed', err);
          alert('Session Created, but failed to copy text automatically.');
      });

      // 3. Close & Reset
      this.showExportModal.set(false);
  }
}
