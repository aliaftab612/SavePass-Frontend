import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthComponent } from './auth/auth.component';
import { AuthGuard } from './auth/auth.guard';
import { GeneralPasswordsComponent } from './general-passwords/general-passwords-list/general-passwords.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { UpdateProfileComponent } from './update-profile/update-profile.component';
import { LockComponent } from './lock/lock.component';
import { LockGuard } from './lock/lock.guard';
import { LoginGuard } from './auth/login.guard';
import { UpdateLockTimeComponent } from './update-lock-time/update-lock-time.component';
import { SettingsComponent } from './settings/settings.component';
import { TwoFactorComponent } from './settings/two-factor/two-factor.component';
import { TwoFactorAuthComponent } from './auth/two-factor-auth/two-factor-auth.component';
import { TwoFactorAuthGuard } from './auth/two-factor-auth/two-factor-auth.guard';

const routes: Routes = [
  { path: 'auth', component: AuthComponent, canActivate: [LoginGuard] },

  {
    path: 'general-passwords',
    component: GeneralPasswordsComponent,
    canActivate: [AuthGuard, LockGuard],
  },
  {
    path: '2fa',
    component: TwoFactorAuthComponent,
    canActivate: [TwoFactorAuthGuard],
  },
  {
    path: 'settings',
    component: SettingsComponent,
    canActivate: [AuthGuard, LockGuard],
    children: [
      { path: '', redirectTo: 'update-profile', pathMatch: 'full' },
      {
        path: 'update-lock-time',
        component: UpdateLockTimeComponent,
      },
      {
        path: 'update-profile',
        component: UpdateProfileComponent,
      },
      {
        path: 'two-factor',
        component: TwoFactorComponent,
      },
    ],
  },
  {
    path: 'lock',
    component: LockComponent,
    canActivate: [AuthGuard],
  },
  { path: '', redirectTo: '/general-passwords', pathMatch: 'full' },
  { path: 'not-found', component: NotFoundComponent },
  { path: '**', redirectTo: '/not-found' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
