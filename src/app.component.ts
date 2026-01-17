
import { Component, inject, signal, effect, HostListener, afterNextRender } from '@angular/core';
import { HierarchyNavComponent } from './components/hierarchy-nav.component';
import { KanbanBoardComponent } from './components/kanban-board.component';
import { DataService } from './services/data.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [HierarchyNavComponent, KanbanBoardComponent],
  templateUrl: './app.component.html'
})
export class AppComponent {
  dataService = inject(DataService);

  readonly MIN_SIDEBAR_WIDTH = 224; // w-56
  readonly MAX_SIDEBAR_WIDTH = 600;

  sidebarWidth = signal<number>(288); // Default w-72
  isResizing = signal<boolean>(false);

  constructor() {
    afterNextRender(() => {
        const savedWidth = localStorage.getItem('nebula_sidebar_width');
        if (savedWidth) {
            // Validate saved width
            const numWidth = Number(savedWidth);
            if (numWidth >= this.MIN_SIDEBAR_WIDTH && numWidth <= this.MAX_SIDEBAR_WIDTH) {
                this.sidebarWidth.set(numWidth);
            }
        }
    });

    effect(() => {
      localStorage.setItem('nebula_sidebar_width', String(this.sidebarWidth()));
    });
  }

  startResize(event: MouseEvent): void {
    event.preventDefault();
    this.isResizing.set(true);
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
  }

  @HostListener('document:mouseup')
  stopResize(): void {
    if (this.isResizing()) {
      this.isResizing.set(false);
      document.body.style.userSelect = 'auto';
      document.body.style.cursor = 'auto';
    }
  }

  @HostListener('document:mousemove', ['$event'])
  onResize(event: MouseEvent): void {
    if (this.isResizing()) {
      const viewSwitcherWidth = 56; // Corresponds to w-14 in Tailwind
      let newWidth = event.clientX - viewSwitcherWidth;

      if (newWidth < this.MIN_SIDEBAR_WIDTH) {
        newWidth = this.MIN_SIDEBAR_WIDTH;
      }
      if (newWidth > this.MAX_SIDEBAR_WIDTH) {
        newWidth = this.MAX_SIDEBAR_WIDTH;
      }
      this.sidebarWidth.set(newWidth);
    }
  }
}
