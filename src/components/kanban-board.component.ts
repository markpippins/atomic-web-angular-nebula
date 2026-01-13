
import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../services/data.service';
import { Requirement, Status, Feature } from '../models/data.models';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-kanban-board',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './kanban-board.component.html'
})
export class KanbanBoardComponent {
  dataService = inject(DataService);

  columns: Status[] = ['Backlog', 'ToDo', 'InProgress', 'Done'];
  showModal = signal(false);

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
