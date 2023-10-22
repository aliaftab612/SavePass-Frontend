import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HeaderComponent } from './header/header.component';
import { SharedModule } from './shared/shared.module';
import { GeneralPasswordsComponent } from './general-passwords/general-passwords-list/general-passwords.component';
import { EditGeneralPasswordComponent } from './general-passwords/edit-general-password/edit-general-password.component';
import { FormsModule } from '@angular/forms';
import { AuthComponent } from './auth/auth.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CookieService } from 'ngx-cookie-service';
import { AuthService } from './auth/auth.service';
import { Observable } from 'rxjs';
import { UpdateProfileComponent } from './update-profile/update-profile.component';
import { LockComponent } from './lock/lock.component';
import { UpdateLockTimeComponent } from './update-lock-time/update-lock-time.component';
import { PasswordStrengthMeterModule } from 'angular-password-strength-meter';
import { ToastrModule, provideToastr } from 'ngx-toastr';
import { ModalComponent } from './modal/modal.component';
import { SettingsComponent } from './settings/settings.component';
import { TwoFactorComponent } from './settings/two-factor/two-factor.component';
import { VerifyMasterPasswordComponent } from './verify-master-password/verify-master-password.component';
import { TotpAuthenticationSetupComponent } from './settings/two-factor/totp-authentication-setup/totp-authentication-setup.component';
import { TwoFactorAuthComponent } from './auth/two-factor-auth/two-factor-auth.component';

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
    UpdateProfileComponent,
    LockComponent,
    UpdateLockTimeComponent,
    ModalComponent,
    SettingsComponent,
    TwoFactorComponent,
    VerifyMasterPasswordComponent,
    TotpAuthenticationSetupComponent,
    TwoFactorAuthComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    SharedModule,
    HttpClientModule,
    FormsModule,
    FontAwesomeModule,
    PasswordStrengthMeterModule.forRoot(),
    ToastrModule.forRoot(),
    BrowserAnimationsModule,
  ],
  providers: [
    CookieService,
    {
      provide: APP_INITIALIZER,
      useFactory: initializeUserData,
      deps: [AuthService],
      multi: true,
    },
    provideToastr({
      closeButton: true,
    }),
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
