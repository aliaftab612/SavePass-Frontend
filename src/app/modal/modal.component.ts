import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Inject,
  Input,
  Output,
  ViewChild,
  ViewContainerRef,
  ViewRef,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ModalOutput } from 'index';
import { IconDefinition, faSpinner } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.css'],
})
export class ModalComponent implements AfterViewInit {
  @ViewChild('dynamicComponentContainer', { read: ViewContainerRef })
  dynamicComponentContainer: ViewContainerRef;
  @Input() size? = 'md';
  @Input() title? = 'Modal title';
  @Input() submitButtonName? = 'Submit';
  @Input() closeButtonName? = 'Close';
  @Input() submitEnabled? = true;

  dynamicComponentHostView: ViewRef;
  dynamicComponentInstance: any;
  submissionInProgress = false;
  loadingSpinnerIcon: IconDefinition = faSpinner;

  @Output() closeEvent = new EventEmitter();
  @Output() submitEvent = new EventEmitter();

  constructor(
    private elementRef: ElementRef,
    @Inject(DOCUMENT) private document: Document
  ) {}
  ngAfterViewInit(): void {
    this.dynamicComponentContainer.insert(this.dynamicComponentHostView);
  }

  close(event: Event): void {
    this.document.querySelectorAll('.closeModal').forEach((ele: Element) => {
      if (event.target === ele) {
        this.dynamicComponentHostView.destroy();
        this.elementRef.nativeElement.remove();
        this.closeEvent.emit({ action: false, data: null });
      }
    });
  }

  async submit(): Promise<void> {
    if (this.submissionInProgress) return;
    this.submissionInProgress = true;
    const modalOutput: ModalOutput =
      await this.dynamicComponentInstance.submit();
    if (modalOutput.action) {
      this.dynamicComponentHostView.destroy();
      this.elementRef.nativeElement.remove();
      this.submitEvent.emit(modalOutput);
    }
    this.submissionInProgress = false;
  }
}
