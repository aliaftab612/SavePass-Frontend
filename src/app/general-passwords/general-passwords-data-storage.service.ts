import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { User } from '../auth/user.model';
import { GeneralPassword } from './general-password.model';

@Injectable({ providedIn: 'root' })
export class GeneralPasswordsDataStorageService {
  user: User;

  constructor(private http: HttpClient, private authService: AuthService) {
    this.user = authService.getUser();

    this.authService.isAuthenticatedEvent.subscribe((userData: User) => {
      if (userData !== null) {
        this.user = userData;
        console.log(this.user.id);
      }
    });
  }

  getGeneralPasswords(): Observable<GeneralPassword[]> {
    const generalPasswordObservable = this.http.get<GeneralPassword[]>(
      `https://savepass-b0a5f-default-rtdb.asia-southeast1.firebasedatabase.app/general-passwords/${this.user.id}.json?auth=${this.user.token}`
    );

    return generalPasswordObservable;
  }

  deleteGeneralPassword(id: string): Observable<any> {
    const generalPasswordDeleteObservable = this.http.delete(
      `https://savepass-b0a5f-default-rtdb.asia-southeast1.firebasedatabase.app/general-passwords/${this.user.id}/${id}.json?auth=${this.user.token}`
    );

    return generalPasswordDeleteObservable;
  }

  addGeneralPassword(generalPassword: GeneralPassword): Observable<any> {
    const generalPasswordAddObservable = this.http.put(
      `https://savepass-b0a5f-default-rtdb.asia-southeast1.firebasedatabase.app/general-passwords/${this.user.id}/${generalPassword.id}.json?auth=${this.user.token}`,
      generalPassword
    );

    return generalPasswordAddObservable;
  }

  getGeneralPassword(id: string): Observable<GeneralPassword> {
    const generalPasswordObservable = this.http.get<GeneralPassword>(
      `https://savepass-b0a5f-default-rtdb.asia-southeast1.firebasedatabase.app/general-passwords/${this.user.id}/${id}.json?auth=${this.user.token}`
    );

    return generalPasswordObservable;
  }
}
