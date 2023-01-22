import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  isEditMode: boolean = false;
  editModeGeneralPasswordId: number = -1;

  switchToEditMode(id: number) {
    this.isEditMode = true;
  }

  switchToDisplayMode() {
    this.isEditMode = false;
  }
}
