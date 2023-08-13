import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HeaderComponent } from './header/header.component';
import { SharedModule } from './shared/shared.module';
import { GeneralPasswordsComponent } from './general-passwords/general-passwords-list/general-passwords.component';
import { EditGeneralPasswordComponent } from './general-passwords/edit-general-password/edit-general-password.component';
import { FormsModule } from '@angular/forms';
import { AuthComponent } from './auth/auth.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { AlertService } from './alert/alert.service';
import { AlertComponent } from './alert/alert.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CookieService } from 'ngx-cookie-service';
import { AuthService } from './auth/auth.service';
import { Observable } from 'rxjs';
import { UpdateProfileComponent } from './update-profile/update-profile.component';
import { LockComponent } from './lock/lock.component';
import { UpdateLockTimeComponent } from './update-lock-time/update-lock-time.component';

export function initializeUserData(
  authService: AuthService
): () => Observable<any> {
  return () => {
    return authService.autoLogin;
  };
}

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    GeneralPasswordsComponent,
    EditGeneralPasswordComponent,
    AuthComponent,
    NotFoundComponent,
    AlertComponent,
    UpdateProfileComponent,
    LockComponent,
    UpdateLockTimeComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    SharedModule,
    HttpClientModule,
    FormsModule,
    FontAwesomeModule,
  ],
  providers: [
    AlertService,
    CookieService,
    {
      provide: APP_INITIALIZER,
      useFactory: initializeUserData,
      deps: [AuthService],
      multi: true,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
