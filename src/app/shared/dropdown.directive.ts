import { Directive, ElementRef, HostListener, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appDropDown]',
})
export class DropDownDirective {
  @HostListener('document:click', ['$event']) toggleDropDown(event: Event) {
    const dropDownListRef = this.element.nativeElement.nextSibling;

    if (this.element.nativeElement.contains(event.target)) {
      this.element.nativeElement.nextSibling.classList.contains('show')
        ? this.renderer.removeClass(dropDownListRef, 'show')
        : this.renderer.addClass(dropDownListRef, 'show');
    } else {
      this.renderer.removeClass(dropDownListRef, 'show');
    }
  }

  constructor(private element: ElementRef, private renderer: Renderer2) {}
}
