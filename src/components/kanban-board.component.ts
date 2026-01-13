
import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../services/data.service';
import { AiService } from '../services/ai.service';
import { Requirement, Status, Feature } from '../models/data.models';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-kanban-board',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="h-full flex flex-col">
      <!-- Toolbar -->
      <div class="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-6 shadow-sm z-10">
        <div>
           <h1 class="text-xl font-bold text-gray-800">
             @if(selectedFeature()) {
               Feature: {{ selectedFeature()?.name }}
             } @else if (selectedSubsystem()) {
               Subsystem: {{ selectedSubsystem()?.name }}
             } @else if (selectedSystem()) {
               System: {{ selectedSystem()?.name }}
             } @else {
               All Requirements
             }
           </h1>
           <p class="text-xs text-gray-500">
             {{ filteredRequirements().length }} items found
           </p>
        </div>

        <button 
          [disabled]="!canAddRequirement()"
          (click)="openAddModal()"
          class="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
          </svg>
          New Requirement
        </button>
      </div>

      <!-- Board Area -->
      <div class="flex-1 overflow-x-auto p-6">
        <div class="flex gap-6 h-full min-w-[1000px]">
          
          <!-- Columns -->
          @for (status of columns; track status) {
            <div class="flex-1 flex flex-col bg-gray-100 rounded-xl max-w-xs">
              <!-- Column Header -->
              <div class="p-3 font-semibold text-gray-700 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-gray-100 rounded-t-xl z-0">
                <span>{{ formatStatus(status) }}</span>
                <span class="bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                  {{ getRequirementsByStatus(status).length }}
                </span>
              </div>

              <!-- Cards Container -->
              <div class="flex-1 overflow-y-auto p-2 space-y-3">
                @for (req of getRequirementsByStatus(status); track req.id) {
                  <div 
                    class="bg-white p-3 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all cursor-move group relative"
                    draggable="true"
                    (dragstart)="onDragStart($event, req.id)"
                  >
                    <!-- Priority Stripe -->
                    <div [class]="'absolute left-0 top-0 bottom-0 w-1 rounded-l-lg ' + getPriorityColor(req.priority)"></div>
                    
                    <div class="pl-2">
                        <h3 class="font-medium text-gray-800 text-sm mb-1 leading-snug">{{ req.title }}</h3>
                        <p class="text-xs text-gray-500 line-clamp-2 mb-2">{{ req.description }}</p>
                        
                        <div class="flex justify-between items-center mt-2">
                           <span class="text-[10px] text-gray-400 font-mono">
                             {{ req.id.slice(0, 4) }}
                           </span>
                           <!-- Quick Move for non-drag environments/accessibility -->
                           <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              @if (status !== 'Backlog') {
                                <button (click)="moveStatus(req, -1)" class="p-1 hover:bg-gray-100 rounded text-gray-500" title="Move Back">
                                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
                                </button>
                              }
                              @if (status !== 'Done') {
                                <button (click)="moveStatus(req, 1)" class="p-1 hover:bg-gray-100 rounded text-gray-500" title="Move Forward">
                                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                                </button>
                              }
                           </div>
                        </div>
                    </div>
                  </div>
                }
              </div>
              
              <!-- Drop Zone Overlay (Implicit via dragover handling on container) -->
              <div 
                class="h-10 m-2 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 text-xs"
                (dragover)="onDragOver($event)"
                (drop)="onDrop($event, status)"
              >
                Drop here
              </div>

            </div>
          }

        </div>
      </div>
    </div>

    <!-- Create Modal -->
    @if (showModal()) {
      <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
        <div class="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
          
          <div class="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
             <h2 class="text-xl font-bold text-gray-800">Create Requirements</h2>
             <button (click)="showModal.set(false)" class="text-gray-400 hover:text-gray-600">
               <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
             </button>
          </div>

          <div class="p-6 overflow-y-auto">
             
             <!-- AI Section -->
             <div class="mb-8 bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-xl border border-purple-100">
                <div class="flex items-start gap-4">
                   <div class="p-2 bg-white rounded-full shadow-sm text-purple-600">
                      <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" /></svg>
                   </div>
                   <div class="flex-1">
                      <h3 class="font-semibold text-purple-900">AI Generator</h3>
                      <p class="text-sm text-purple-700 mb-3">Generate requirements automatically based on the selected feature context.</p>
                      
                      @if (isGenerating()) {
                        <div class="flex items-center gap-2 text-sm text-purple-600">
                           <svg class="animate-spin h-4 w-4 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                           </svg>
                           Generating ideas...
                        </div>
                      } @else {
                        <button (click)="generateWithAI()" class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors">
                          Generate Suggestions
                        </button>
                      }
                   </div>
                </div>
             </div>

             <!-- Manual Entry -->
             <div class="space-y-4">
                <div>
                   <label class="block text-sm font-medium text-gray-700 mb-1">Title</label>
                   <input type="text" [(ngModel)]="newReqTitle" class="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border" placeholder="e.g. User Login Page">
                </div>
                <div>
                   <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                   <textarea rows="3" [(ngModel)]="newReqDesc" class="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border" placeholder="Acceptance criteria, details..."></textarea>
                </div>
                <div>
                   <label class="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                   <select [(ngModel)]="newReqPriority" class="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border">
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                   </select>
                </div>
             </div>

          </div>
          
          <div class="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
             <button (click)="showModal.set(false)" class="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg">Cancel</button>
             <button (click)="createManual()" [disabled]="!newReqTitle" class="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300">Create Requirement</button>
          </div>

        </div>
      </div>
    }
  `
})
export class KanbanBoardComponent {
  dataService = inject(DataService);
  aiService = inject(AiService);

  columns: Status[] = ['Backlog', 'ToDo', 'InProgress', 'Done'];
  showModal = signal(false);
  isGenerating = signal(false);

  // Form State
  newReqTitle = '';
  newReqDesc = '';
  newReqPriority: 'Low' | 'Medium' | 'High' = 'Medium';

  // Drag State
  draggedReqId: string | null = null;

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

  filteredRequirements = computed(() => {
    let reqs = this.dataService.requirements();
    const fId = this.dataService.selectedFeatureId();
    const sId = this.dataService.selectedSubsystemId();
    const sysId = this.dataService.selectedSystemId();

    if (fId) return reqs.filter(r => r.featureId === fId);
    if (sId) return reqs.filter(r => r.subsystemId === sId);
    if (sysId) return reqs.filter(r => r.systemId === sysId);
    return reqs;
  });

  canAddRequirement = computed(() => !!this.selectedFeature());

  getRequirementsByStatus(status: Status) {
    return this.filteredRequirements().filter(r => r.status === status);
  }

  formatStatus(status: string) {
    return status.replace(/([A-Z])/g, ' $1').trim();
  }

  getPriorityColor(priority: string) {
    switch(priority) {
      case 'High': return 'bg-red-500';
      case 'Medium': return 'bg-yellow-500';
      case 'Low': return 'bg-blue-400';
      default: return 'bg-gray-300';
    }
  }

  openAddModal() {
    this.newReqTitle = '';
    this.newReqDesc = '';
    this.showModal.set(true);
  }

  createManual() {
    const feat = this.selectedFeature();
    if (!feat) return; // Should be guarded by button

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

  async generateWithAI() {
    const feat = this.selectedFeature();
    const sys = this.selectedSystem();
    if (!feat || !sys) return;

    this.isGenerating.set(true);
    const suggestions = await this.aiService.generateRequirements(sys.name, feat.name);
    this.isGenerating.set(false);

    if (suggestions.length > 0) {
      suggestions.forEach(s => {
        this.dataService.addRequirement({
          title: s.title,
          description: s.description,
          priority: s.priority as any || 'Medium',
          status: 'Backlog',
          systemId: this.dataService.selectedSystemId()!,
          subsystemId: this.dataService.selectedSubsystemId()!,
          featureId: feat.id
        });
      });
      this.showModal.set(false);
    }
  }

  // --- Drag and Drop Logic ---
  onDragStart(event: DragEvent, id: string) {
    this.draggedReqId = id;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', id);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault(); // Necessary to allow dropping
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  onDrop(event: DragEvent, newStatus: Status) {
    event.preventDefault();
    const id = this.draggedReqId;
    if (id) {
      this.dataService.updateRequirementStatus(id, newStatus);
    }
    this.draggedReqId = null;
  }

  // --- Click Logic ---
  moveStatus(req: Requirement, direction: number) {
     const idx = this.columns.indexOf(req.status);
     const newIdx = idx + direction;
     if (newIdx >= 0 && newIdx < this.columns.length) {
        this.dataService.updateRequirementStatus(req.id, this.columns[newIdx]);
     }
  }
}
