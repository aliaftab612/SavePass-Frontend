import { NgModule } from '@angular/core';
import { DropDownDirective } from './dropdown.directive';
import { TogglePasswordVisibilityIconDirective } from './toggle-password-visibility-icon.directive';

@NgModule({
  declarations: [DropDownDirective, TogglePasswordVisibilityIconDirective],
  exports: [DropDownDirective, TogglePasswordVisibilityIconDirective],
})
export class SharedModule {}
