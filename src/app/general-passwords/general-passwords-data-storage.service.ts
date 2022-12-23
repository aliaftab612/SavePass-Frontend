import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GeneralPassword } from './general-password.model';

@Injectable({ providedIn: 'root' })
export class GeneralPasswordsDataStorageService {
  constructor(private http: HttpClient) {}

  getGeneralPasswords(): Observable<GeneralPassword[]> {
    const generalPasswordObservable = this.http.get<GeneralPassword[]>(
      'https://savepass-b0a5f-default-rtdb.asia-southeast1.firebasedatabase.app/general-passwords.json'
    );

    return generalPasswordObservable;
  }
}
