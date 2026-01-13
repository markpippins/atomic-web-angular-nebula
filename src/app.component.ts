
import { Component } from '@angular/core';
import { HierarchyNavComponent } from './components/hierarchy-nav.component';
import { KanbanBoardComponent } from './components/kanban-board.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [HierarchyNavComponent, KanbanBoardComponent],
  templateUrl: './app.component.html'
})
export class AppComponent {}
