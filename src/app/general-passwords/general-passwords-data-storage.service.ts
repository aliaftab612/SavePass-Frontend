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
  generalPasswordsWorker: Worker = null;
  encryptedGeneralPasswords: GeneralPassword[] = null;

  constructor(private http: HttpClient, private authService: AuthService) {
    this.authService.isAuthenticatedEvent.subscribe((userData: User) => {
      if (userData === null) {
        this.encryptedGeneralPasswords = null;
      }
    });
  }

  getGeneralPasswords(
    page: number,
    search: string
  ): Observable<GeneralPasswordsResponse> {
    const generalPasswordObservable = this.http.get<GeneralPasswordsResponse>(
      `${environment.serverBaseUrl}/api/v1/general-passwords`,
      {
        headers: { Authorization: this.authService.getToken() },
      }
    );

    return generalPasswordObservable;
  }

  deleteGeneralPassword(id: string): Observable<GeneralPasswordResponse> {
    const generalPasswordDeleteObservable =
      this.http.delete<GeneralPasswordResponse>(
        `${environment.serverBaseUrl}/api/v1/general-passwords/${id}`,
        {
          headers: { Authorization: this.authService.getToken() },
        }
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
        {
          headers: { Authorization: this.authService.getToken() },
        }
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
        {
          headers: { Authorization: this.authService.getToken() },
        }
      );

    return generalPasswordUpdateObservable;
  }

  getGeneralPassword(id: string): Observable<GeneralPasswordResponse> {
    const generalPasswordObservable = this.http.get<GeneralPasswordResponse>(
      `${environment.serverBaseUrl}/api/v1/general-passwords/${id}`,
      {
        headers: { Authorization: this.authService.getToken() },
      }
    );

    return generalPasswordObservable;
  }

  searchAndPaginateGeneralPasswords(
    decryptedGeneralPasswords: GeneralPassword[],
    page: number = 1,
    search: string = ''
  ): { generalPasswords: GeneralPassword[]; totalPages: number } {
    let generalPasswordsResult = decryptedGeneralPasswords.filter(
      (element) =>
        element.website.toLowerCase().includes(search) ||
        element.username.toLowerCase().includes(search)
    );

    const limit = 10;
    const totalPages = Math.ceil(generalPasswordsResult.length / limit);
    const startIndex = (page - 1) * limit;

    generalPasswordsResult = generalPasswordsResult.splice(startIndex, limit);
    return { generalPasswords: generalPasswordsResult, totalPages };
  }
}
