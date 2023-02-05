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

  displayAlert: boolean = false;
  successAlert = true;
  alertmessage: string = '';
  successAlertEventSubscription: Subscription;
  failureAlertEventSubscription: Subscription;
  alertEndTimeoutRef: any;

  constructor(
    private alertService: AlertService,
    private renderer2: Renderer2
  ) {}

  ngOnInit(): void {
    this.successAlertEventSubscription =
      this.alertService.successAlertEvent.subscribe((message) => {
        this.alertmessage = message;
        this.successAlert = true;
        this.imageLink = this.successImageLink;
        this.renderer2.setStyle(
          this.alertPopUpElement.nativeElement,
          'background-color',
          'green'
        );
        this.displayAlert = true;
        this.setAlertEndTimeout();
      });

    this.failureAlertEventSubscription =
      this.alertService.failureAlertEvent.subscribe((message) => {
        this.alertmessage = message;
        this.successAlert = false;
        this.imageLink = this.failureImageLink;
        this.renderer2.setStyle(
          this.alertPopUpElement.nativeElement,
          'background-color',
          'red'
        );
        this.displayAlert = true;
        this.setAlertEndTimeout();
      });
  }

  ngOnDestroy(): void {
    this.successAlertEventSubscription.unsubscribe();
    this.failureAlertEventSubscription.unsubscribe();
    clearTimeout(this.alertEndTimeoutRef);
  }

  setAlertEndTimeout() {
    clearTimeout(this.alertEndTimeoutRef);
    this.alertEndTimeoutRef = setTimeout(() => {
      this.displayAlert = false;
    }, 2000);
  }
}
