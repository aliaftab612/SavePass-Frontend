import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AlertService {
  successAlertEvent: Subject<string> = new Subject<string>();
  failureAlertEvent: Subject<string> = new Subject<string>();
}
