import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../auth.service';
import { Location } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class TwoFactorAuthGuard implements CanActivate {
  constructor(
    private router: Router,
    private authService: AuthService,
    private location: Location
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ):
    | boolean
    | UrlTree
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree> {
    if (this.authService.canNavigateFor2fa()) {
      return true;
    } else {
      return this.router.navigate(['auth']);
    }
  }
}
