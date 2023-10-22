import { DOCUMENT } from '@angular/common';
import {
  Inject,
  Injectable,
  Injector,
  Type,
  ViewContainerRef,
} from '@angular/core';
import { Subject } from 'rxjs';
import { ModalComponent } from './modal.component';
import { ModalOutput } from 'index';

@Injectable()
export class ModalService {
  private modalNotifier?: Subject<ModalOutput>;
  constructor(
    private viewContainerRef: ViewContainerRef,
    private injector: Injector,
    @Inject(DOCUMENT) private document: Document
  ) {}

  open(
    component: Type<any>,
    options?: {
      size?: string;
      title?: string;
      data?: any;
      submitButtonName?: string;
      closeButtonName?: string;
    }
  ) {
    const modalComponent = this.viewContainerRef.createComponent(
      ModalComponent,
      {
        injector: this.injector,
      }
    );

    const dynamicComponentInstance =
      this.viewContainerRef.createComponent(component);

    modalComponent.instance.dynamicComponentHostView =
      dynamicComponentInstance.hostView;

    dynamicComponentInstance.instance.modalData = options?.data;
    dynamicComponentInstance.instance.modalComponentRef = modalComponent;

    modalComponent.instance.dynamicComponentInstance =
      dynamicComponentInstance.instance;
    modalComponent.instance.size = options?.size;
    modalComponent.instance.title = options?.title;
    modalComponent.instance.submitButtonName = options?.submitButtonName;
    modalComponent.instance.closeButtonName = options?.closeButtonName;
    modalComponent.instance.closeEvent.subscribe((modalOutput: ModalOutput) =>
      this.modalSubmitedOrClosed(modalOutput)
    );
    modalComponent.instance.submitEvent.subscribe((modalOutput: ModalOutput) =>
      this.modalSubmitedOrClosed(modalOutput)
    );

    modalComponent.hostView.detectChanges();

    this.document.body.appendChild(modalComponent.location.nativeElement);
    this.document.body.style.overflow = 'hidden';
    this.modalNotifier = new Subject();
    return this.modalNotifier?.asObservable();
  }

  private modalSubmitedOrClosed(modalOutput: ModalOutput) {
    this.document.body.style.removeProperty('overflow');
    this.modalNotifier?.next(modalOutput);
  }
}
