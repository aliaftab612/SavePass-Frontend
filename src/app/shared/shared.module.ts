import { NgModule } from '@angular/core';
import { DropDownDirective } from './dropdown.directive';

@NgModule({
  declarations: [DropDownDirective],
  exports: [DropDownDirective],
})
export class SharedModule {}
