import { ComponentRef } from '@angular/core';
import { ModalComponent } from './modal.component';
import { ModalOutput } from 'index';

export interface ModalContent {
  modalData: any;
  modalComponentRef: ComponentRef<ModalComponent>;
  submit(): Promise<ModalOutput> | ModalOutput;
}
