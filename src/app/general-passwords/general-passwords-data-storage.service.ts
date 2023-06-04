import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { User } from '../auth/user.model';
import { GeneralPassword } from './general-password.model';
import { GeneralPasswordResponse, GeneralPasswordsResponse } from 'index';

@Injectable({ providedIn: 'root' })
export class GeneralPasswordsDataStorageService {
  user: User;

  constructor(private http: HttpClient, private authService: AuthService) {
    this.user = authService.getUser();

    this.authService.isAuthenticatedEvent.subscribe((userData: User) => {
      if (userData !== null) {
        this.user = userData;
      }
    });
  }

  getGeneralPasswords(): Observable<GeneralPasswordsResponse> {
    const generalPasswordObservable = this.http.get<GeneralPasswordsResponse>(
      `http://localhost:3000/api/v1/general-passwords`,
      {
        withCredentials: true,
      }
    );

    return generalPasswordObservable;
  }

  deleteGeneralPassword(id: string): Observable<GeneralPasswordResponse> {
    const generalPasswordDeleteObservable =
      this.http.delete<GeneralPasswordResponse>(
        `http://localhost:3000/api/v1/general-passwords/${id}`,
        { withCredentials: true }
      );

    return generalPasswordDeleteObservable;
  }

  addGeneralPassword(
    generalPassword: GeneralPassword
  ): Observable<GeneralPasswordResponse> {
    const generalPasswordAddObservable =
      this.http.post<GeneralPasswordResponse>(
        `http://localhost:3000/api/v1/general-passwords`,
        generalPassword,
        { withCredentials: true }
      );

    return generalPasswordAddObservable;
  }

  updateGeneralPassword(
    id: string,
    generalPassword: GeneralPassword
  ): Observable<GeneralPasswordResponse> {
    const generalPasswordUpdateObservable =
      this.http.patch<GeneralPasswordResponse>(
        `http://localhost:3000/api/v1/general-passwords/${id}`,
        generalPassword,
        { withCredentials: true }
      );

    return generalPasswordUpdateObservable;
  }

  getGeneralPassword(id: string): Observable<GeneralPasswordResponse> {
    const generalPasswordObservable = this.http.get<GeneralPasswordResponse>(
      `http://localhost:3000/api/v1/general-passwords/${id}`,
      {
        withCredentials: true,
      }
    );

    return generalPasswordObservable;
  }
}
