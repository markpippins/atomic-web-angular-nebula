
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

  selectSubsystem(id: string) {
    this.dataService.selectedSubsystemId.set(id);
    this.dataService.selectedFeatureId.set(null);
  }

  selectFeature(id: string) {
    this.dataService.selectedFeatureId.set(id);
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
}
