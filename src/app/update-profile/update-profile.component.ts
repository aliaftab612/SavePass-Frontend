import { Component, OnDestroy, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { User } from '../auth/user.model';
import {
  faSpinner,
  IconDefinition,
  faPen,
} from '@fortawesome/free-solid-svg-icons';
import { DomSanitizer, SafeHtml, SafeUrl } from '@angular/platform-browser';
import { ModalService } from '../modal/modal.service';
import { ProfilePhotoCropperComponent } from '../profile-photo-cropper/profile-photo-cropper.component';

@Component({
  selector: 'app-update-profile',
  templateUrl: './update-profile.component.html',
  styleUrls: ['./update-profile.component.css'],
  host: {
    class: 'ml-8 w-full',
  },
  providers: [ModalService],
})
export class UpdateProfileComponent implements OnInit, OnDestroy {
  user: User;
  authEventSubscription: Subscription;
  isProfileUpdateEventStartedSubscription: Subscription;
  updateInProgress: boolean = false;
  loadingSpinnerIcon: IconDefinition = faSpinner;
  profilePhotoEditIcon: IconDefinition = faPen;
  profileImageUrl: string;
  constructor(
    private authService: AuthService,
    private domSanitizer: DomSanitizer,
    private modalService: ModalService
  ) {}

  ngOnInit(): void {
    this.user = this.authService.getUser();
    this.authEventSubscription =
      this.authService.isAuthenticatedEvent.subscribe((user) => {
        this.user = user;
      });

    this.isProfileUpdateEventStartedSubscription =
      this.authService.isProfileUpdateEventStarted.subscribe({
        next: (data: boolean) => {
          if (data) {
            this.updateInProgress = true;
          } else {
            this.updateInProgress = false;
          }
        },
      });

    this.profileImageUrl =
      this.user.profilePhotoUrl ??
      'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460__340.png';
  }

  updateProfile(form: NgForm) {
    if (this.updateInProgress) return;
    if (form.valid) {
      this.authService.updateUserData(
        form.value.firstname,
        form.value.lastname
      );
    }
  }

  profilePhotoAttached(event: Event) {
    const files = (event.target as HTMLInputElement).files;

    if (files.length > 0) {
      const profilePhotoUrl = this.domSanitizer.bypassSecurityTrustUrl(
        URL.createObjectURL(files[0])
      );

      this.modalService
        .open(ProfilePhotoCropperComponent, {
          size: 'lg',
          title: 'Customize Profile Photo',
          data: {
            profilePhotoUrl,
            fileName: files[0].name,
            mimeType: files[0].type,
          },
        })
        .subscribe({
          next: (value) => {
            if (value.action) {
              this.profileImageUrl = value.data.profilePhotoUrl;
            }
          },
        });

      (event.target as HTMLInputElement).value = '';
    }
  }

  ngOnDestroy(): void {
    this.authEventSubscription.unsubscribe();
    this.isProfileUpdateEventStartedSubscription.unsubscribe();
  }
}
