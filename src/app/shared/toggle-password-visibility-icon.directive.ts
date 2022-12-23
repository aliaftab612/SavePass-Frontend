import { Directive, ElementRef, HostListener, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appToggleVisibility]',
})
export class TogglePasswordVisibilityIconDirective {
  passwordVisible = false;
  @HostListener('click') toggleVisibility() {
    const dropDownListRef = this.element.nativeElement.firstChild;

    if (this.passwordVisible) {
      this.renderer.setProperty(
        dropDownListRef,
        'src',
        'https://firebasestorage.googleapis.com/v0/b/savepass-b0a5f.appspot.com/o/view%20(2).png?alt=media&token=ebe6e7d4-a09e-4487-8adc-39934564d0ea'
      );
    } else {
      this.renderer.setProperty(
        dropDownListRef,
        'src',
        'https://firebasestorage.googleapis.com/v0/b/savepass-b0a5f.appspot.com/o/hidden.png?alt=media&token=62059ee2-c948-47e5-84bb-b4585dc63bbf'
      );
    }

    this.passwordVisible = !this.passwordVisible;
  }

  constructor(private element: ElementRef, private renderer: Renderer2) {}
}
