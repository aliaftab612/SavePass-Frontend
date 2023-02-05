import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  Renderer2,
  ViewChild,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { AlertService } from './alert.service';

@Component({
  selector: 'app-alert',
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.css'],
})
export class AlertComponent implements OnInit, OnDestroy {
  @ViewChild('alertPopUp')
  alertPopUpElement: ElementRef;

  successImageLink =
    'https://firebasestorage.googleapis.com/v0/b/savepass-b0a5f.appspot.com/o/check.png?alt=media&token=b55082fb-d878-43e8-8158-1b786bb5d769';
  imageLink: string = this.successImageLink;
  failureImageLink: string =
    'https://firebasestorage.googleapis.com/v0/b/savepass-b0a5f.appspot.com/o/close%20(1).png?alt=media&token=231b1366-2812-428f-bea7-9780effe5178';

  displayAlert: boolean;
  successAlert: boolean;
  alertmessage: string = '';
  successAlertEventSubscription: Subscription;
  failureAlertEventSubscription: Subscription;
  resetAlertEventSubscription: Subscription;
  alertEndTimeoutRef: any;

  constructor(
    private alertService: AlertService,
    private renderer2: Renderer2
  ) {
    this.displayAlert = alertService.getDisplayAlert();
    this.successAlert = alertService.getSuccessAlert();
  }

  ngOnInit(): void {
    this.alertService.displayAlertVariableChanged.subscribe((value) => {
      this.displayAlert = value;
    });

    this.alertService.successAlertVariableChanged.subscribe((value) => {
      this.successAlert = value;
    });

    this.successAlertEventSubscription =
      this.alertService.successAlertEvent.subscribe((message) => {
        this.alertmessage = message;
        this.alertService.setSuccessAlert(true);
        this.imageLink = this.successImageLink;
        this.renderer2.setStyle(
          this.alertPopUpElement.nativeElement,
          'background-color',
          'green'
        );
        this.alertService.setDisplayAlert(true);
        this.setAlertEndTimeout();
      });

    this.failureAlertEventSubscription =
      this.alertService.failureAlertEvent.subscribe((message) => {
        this.alertmessage = message;
        this.alertService.setSuccessAlert(false);
        this.imageLink = this.failureImageLink;
        this.renderer2.setStyle(
          this.alertPopUpElement.nativeElement,
          'background-color',
          'red'
        );
        this.alertService.setDisplayAlert(true);
        this.setAlertEndTimeout();
      });

    this.resetAlertEventSubscription =
      this.alertService.resetAlertEvent.subscribe(() => {
        this.resetAlert();
      });
  }

  ngOnDestroy(): void {
    this.successAlertEventSubscription.unsubscribe();
    this.failureAlertEventSubscription.unsubscribe();
    this.resetAlertEventSubscription.unsubscribe();
    clearTimeout(this.alertEndTimeoutRef);
  }

  setAlertEndTimeout() {
    clearTimeout(this.alertEndTimeoutRef);
    this.alertEndTimeoutRef = setTimeout(() => {
      this.alertService.setDisplayAlert(false);
    }, 2000);
  }

  resetAlert() {
    clearTimeout(this.alertEndTimeoutRef);
    this.alertService.setDisplayAlert(false);
  }
}
