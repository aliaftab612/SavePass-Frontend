import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthComponent } from './auth/auth.component';
import { AuthGuard } from './auth/auth.guard';
import { EditGeneralPasswordComponent } from './general-passwords/edit-general-password/edit-general-password.component';
import { GeneralPasswordsComponent } from './general-passwords/general-passwords-list/general-passwords.component';
import { NotFoundComponent } from './not-found/not-found.component';

const routes: Routes = [
  { path: 'auth', component: AuthComponent },
  {
    path: 'general-passwords',
    component: GeneralPasswordsComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'general-passwords/:id/edit',
    component: EditGeneralPasswordComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'general-passwords/new',
    component: EditGeneralPasswordComponent,
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
