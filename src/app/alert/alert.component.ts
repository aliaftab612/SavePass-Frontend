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
import { faCheck, faXmark } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-alert',
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.css'],
})
export class AlertComponent implements OnInit, OnDestroy {
  @ViewChild('alertPopUp')
  alertPopUpElement: ElementRef;
  displayAlert: boolean;
  successAlert: boolean;
  alertmessage: string = '';
  successAlertEventSubscription: Subscription;
  failureAlertEventSubscription: Subscription;
  resetAlertEventSubscription: Subscription;
  displayAlertVariableChangedSubscription: Subscription;
  successAlertVariableChangedSubscription: Subscription;
  alertEndTimeoutRef: any;
  alertIcon = faCheck;

  constructor(
    private alertService: AlertService,
    private renderer2: Renderer2
  ) {
    this.displayAlert = alertService.getDisplayAlert();
    this.successAlert = alertService.getSuccessAlert();
  }

  ngOnInit(): void {
    this.displayAlertVariableChangedSubscription =
      this.alertService.displayAlertVariableChanged.subscribe((value) => {
        this.displayAlert = value;
      });

    this.successAlertVariableChangedSubscription =
      this.alertService.successAlertVariableChanged.subscribe((value) => {
        this.successAlert = value;
      });

    this.successAlertEventSubscription =
      this.alertService.successAlertEvent.subscribe((message) => {
        this.alertmessage = message;
        this.alertService.setSuccessAlert(true);
        this.alertIcon = faCheck;
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
        this.alertIcon = faXmark;
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
    this.successAlertVariableChangedSubscription.unsubscribe();
    this.displayAlertVariableChangedSubscription.unsubscribe();
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
