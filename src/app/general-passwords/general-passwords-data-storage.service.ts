import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { User } from '../auth/user.model';
import { GeneralPassword } from './general-password.model';
import { GeneralPasswordResponse, GeneralPasswordsResponse } from 'index';
import { environment } from 'src/environments/environment';
import { CryptoHelper } from '../shared/crypto-helper';

@Injectable({ providedIn: 'root' })
export class GeneralPasswordsDataStorageService {
  user: User;
  generalPasswordsWorker: Worker = null;

  constructor(private http: HttpClient, private authService: AuthService) {
    this.user = authService.getUser();

    this.authService.isAuthenticatedEvent.subscribe((userData: User) => {
      if (userData !== null) {
        this.user = userData;
      }
    });
  }

  getGeneralPasswords(
    page: number,
    search: string
  ): Observable<GeneralPasswordsResponse> {
    const generalPasswordObservable = this.http.get<GeneralPasswordsResponse>(
      `${environment.serverBaseUrl}/api/v1/general-passwords?page=${page}&filter=${search}`,
      {
        withCredentials: true,
      }
    );

    return generalPasswordObservable;
  }

  deleteGeneralPassword(id: string): Observable<GeneralPasswordResponse> {
    const generalPasswordDeleteObservable =
      this.http.delete<GeneralPasswordResponse>(
        `${environment.serverBaseUrl}/api/v1/general-passwords/${id}`,
        { withCredentials: true }
      );

    return generalPasswordDeleteObservable;
  }

  addGeneralPassword(
    generalPassword: GeneralPassword
  ): Observable<GeneralPasswordResponse> {
    const encryptedGeneralPassword = CryptoHelper.encryptGeneralPassword(
      generalPassword,
      this.authService.getEncryptionKey()
    );

    const generalPasswordAddObservable =
      this.http.post<GeneralPasswordResponse>(
        `${environment.serverBaseUrl}/api/v1/general-passwords`,
        encryptedGeneralPassword,
        { withCredentials: true }
      );

    return generalPasswordAddObservable;
  }

  updateGeneralPassword(
    id: string,
    generalPassword: GeneralPassword
  ): Observable<GeneralPasswordResponse> {
    const encryptedGeneralPassword = CryptoHelper.encryptGeneralPassword(
      generalPassword,
      this.authService.getEncryptionKey()
    );

    const generalPasswordUpdateObservable =
      this.http.patch<GeneralPasswordResponse>(
        `${environment.serverBaseUrl}/api/v1/general-passwords/${id}`,
        encryptedGeneralPassword,
        { withCredentials: true }
      );

    return generalPasswordUpdateObservable;
  }

  getGeneralPassword(id: string): Observable<GeneralPasswordResponse> {
    const generalPasswordObservable = this.http.get<GeneralPasswordResponse>(
      `${environment.serverBaseUrl}/api/v1/general-passwords/${id}`,
      {
        withCredentials: true,
      }
    );

    return generalPasswordObservable;
  }
}
