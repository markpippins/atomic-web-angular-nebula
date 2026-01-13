
import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../services/data.service';
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
  
  viewMode = signal<'board' | 'table'>('board');
  searchTerm = signal('');
  showModal = signal(false);

  // Form State
  newReqTitle = '';
  newReqDesc = '';
  newReqPriority: 'Low' | 'Medium' | 'High' = 'Medium';

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
