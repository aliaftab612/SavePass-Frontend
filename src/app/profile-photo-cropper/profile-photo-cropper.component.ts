import { AfterViewInit, Component, ComponentRef } from '@angular/core';
import { ModalContent } from '../modal/modal-content.interface';
import { ModalOutput, UpdateProfilePhotoResponse } from 'index';
import { ModalComponent } from '../modal/modal.component';
import Cropper from 'cropperjs';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { AuthService } from '../auth/auth.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-profile-photo-cropper',
  templateUrl: './profile-photo-cropper.component.html',
  styleUrls: ['./profile-photo-cropper.component.css'],
})
export class ProfilePhotoCropperComponent
  implements ModalContent, AfterViewInit
{
  modalData: any;
  modalComponentRef: ComponentRef<ModalComponent>;
  cropper: Cropper;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private toastr: ToastrService
  ) {}

  ngAfterViewInit() {
    this.initCropper();
  }

  initCropper() {
    const image = document.getElementById('image') as HTMLImageElement;
    this.cropper = new Cropper(image, {
      aspectRatio: 1,
      viewMode: 1,
      guides: false,
    });
  }

  getRoundedCanvas(sourceCanvas: any) {
    var canvas = document.createElement('canvas');
    var context: any = canvas.getContext('2d');
    var width = sourceCanvas.width;
    var height = sourceCanvas.height;

    canvas.width = width;
    canvas.height = height;
    context.imageSmoothingEnabled = true;
    context.drawImage(sourceCanvas, 0, 0, width, height);
    context.globalCompositeOperation = 'destination-in';
    context.beginPath();
    context.arc(
      width / 2,
      height / 2,
      Math.min(width, height) / 2,
      0,
      2 * Math.PI,
      true
    );
    context.fill();
    return canvas;
  }

  dataUrlToFile = async (url: string, fileName: string, mimeType: string) => {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();

    return new File([buffer], fileName, { type: mimeType });
  };

  async submit(): Promise<ModalOutput> {
    const croppedCanvas = this.cropper.getCroppedCanvas();
    const roundedCanvas = this.getRoundedCanvas(croppedCanvas);

    const profilePhotoCroppedImageFile = await this.dataUrlToFile(
      roundedCanvas.toDataURL(),
      this.modalData.fileName,
      this.modalData.mimeType
    );

    const formData = new FormData();
    formData.append('profile-photo', profilePhotoCroppedImageFile);

    const profilePhotoUrl: string = await this.updateProfilePhotoOnBackend(
      formData
    );

    if (profilePhotoUrl) {
      const user = this.authService.getUser();
      user.profilePhotoUrl = profilePhotoUrl;
      this.authService.updateUserObject(user);
      this.authService.isAuthenticatedEvent.next(Object.create(user));

      return { action: true, data: { profilePhotoUrl } };
    } else {
      return { action: false };
    }
  }

  updateProfilePhotoOnBackend(formData: FormData): Promise<string> {
    return new Promise((resolve) => {
      this.http
        .post<UpdateProfilePhotoResponse>(
          `${environment.serverBaseUrl}/api/v1/profile-photo`,
          formData,
          {
            headers: { Authorization: this.authService.getToken() },
          }
        )
        .subscribe({
          next: (data) => {
            this.toastr.success('Profile Image Updated Successfully!');
            resolve(data.data.profilePhotoUrl);
          },
          error: (error) => {
            if (error.status == 401) {
              this.authService.logout();
              return;
            }

            this.toastr.error(error.error.message);
            resolve('');
          },
        });
    });
  }
}
