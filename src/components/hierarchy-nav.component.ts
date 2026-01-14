
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../services/data.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-hierarchy-nav',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './hierarchy-nav.component.html'
})
export class HierarchyNavComponent {
  dataService = inject(DataService);

  isAddingSystem = signal(false);
  addingSubsystemTo = signal<string | null>(null);
  addingFeatureTo = signal<string | null>(null);

  newSystemName = '';
  newSubsystemName = '';
  newFeatureName = '';

  selectSystem(id: string) {
    this.dataService.selectedSystemId.set(id);
    this.dataService.selectedSubsystemId.set(null);
    this.dataService.selectedFeatureId.set(null);
  }

  selectSubsystem(systemId: string, subId: string) {
    this.dataService.selectedSystemId.set(systemId);
    this.dataService.selectedSubsystemId.set(subId);
    this.dataService.selectedFeatureId.set(null);
  }

  selectFeature(systemId: string, subId: string, featureId: string) {
    this.dataService.selectedSystemId.set(systemId);
    this.dataService.selectedSubsystemId.set(subId);
    this.dataService.selectedFeatureId.set(featureId);
  }

  createSystem() {
    if (this.newSystemName.trim()) {
      this.dataService.addSystem(this.newSystemName, '');
      this.newSystemName = '';
      this.isAddingSystem.set(false);
    }
  }

  createSubsystem(systemId: string) {
    if (this.newSubsystemName.trim()) {
      this.dataService.addSubsystem(systemId, this.newSubsystemName, '');
      this.newSubsystemName = '';
      this.addingSubsystemTo.set(null);
    }
  }

  createFeature(systemId: string, subsystemId: string) {
     if (this.newFeatureName.trim()) {
      this.dataService.addFeature(systemId, subsystemId, this.newFeatureName, '');
      this.newFeatureName = '';
      this.addingFeatureTo.set(null);
    }
  }

  deleteSystem(id: string, event: Event) {
    event.stopPropagation();
    if (confirm('Delete this system? All subsystems and requirements inside it will be lost.')) {
      this.dataService.deleteSystem(id);
    }
  }

  deleteSubsystem(systemId: string, subId: string, event: Event) {
    event.stopPropagation();
    if (confirm('Delete this subsystem? All features and requirements inside it will be lost.')) {
      this.dataService.deleteSubsystem(systemId, subId);
    }
  }

  deleteFeature(systemId: string, subId: string, featId: string, event: Event) {
    event.stopPropagation();
    if (confirm('Delete this feature? All requirements inside it will be lost.')) {
      this.dataService.deleteFeature(systemId, subId, featId);
    }
  }
}
