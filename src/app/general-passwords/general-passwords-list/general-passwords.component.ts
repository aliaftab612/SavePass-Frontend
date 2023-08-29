import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { GeneralPassword } from '../general-password.model';
import { GeneralPasswordsDataStorageService } from '../general-passwords-data-storage.service';
import {
  faEye,
  faEyeSlash,
  IconDefinition,
  faCopy,
  faSpinner,
} from '@fortawesome/free-solid-svg-icons';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { AuthService } from 'src/app/auth/auth.service';
import { GeneralPasswordsResponse } from 'index';
import { CryptoHelper } from 'src/app/shared/crypto-helper';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-general-passwords',
  templateUrl: './general-passwords.component.html',
  styleUrls: ['./general-passwords.component.css'],
})
export class GeneralPasswordsComponent implements OnInit, OnDestroy {
  generalPasswords: GeneralPassword[] = [];
  currentPage: number = 1;
  passwordHiddenImg: IconDefinition = faEye;
  passwordCopyImg: IconDefinition = faCopy;
  totalPages = 0;
  startPage = 1;
  searchText: string = '';
  searchTimer: any;
  showLoadingSpinner: boolean = false;
  loadingSpinnerIcon: IconDefinition = faSpinner;

  constructor(
    private generalPasswordDataStorageService: GeneralPasswordsDataStorageService,
    private router: Router,
    private authService: AuthService,
    private route: ActivatedRoute,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe({
      next: (queryParams: Params) => {
        const pageParam = queryParams['page'];
        const searchParam = queryParams['search'];

        if (searchParam != undefined) {
          this.searchText = searchParam;
        } else {
          this.searchText = '';
        }

        if (pageParam != undefined) {
          if (!isNaN(pageParam) && pageParam > 0) {
            this.currentPage = Number(pageParam);
          } else {
            this.router.navigate(['/not-found']);
          }
        } else {
          this.currentPage = 1;
        }
        this.populateGeneralPasswords();
      },
    });
  }

  searchTextChanged(searchGeneralPasswordsElememt: HTMLInputElement) {
    if (this.searchTimer && this.searchTimer != undefined) {
      clearTimeout(this.searchTimer);
    }

    this.searchTimer = setTimeout(() => {
      this.searchText = searchGeneralPasswordsElememt.value;

      const queryParams =
        this.searchText !== ''
          ? { page: 1, search: this.searchText }
          : { page: 1 };

      this.router.navigate(['/general-passwords'], {
        queryParams,
      });
    }, 1000);
  }

  populateGeneralPasswords() {
    this.showLoadingSpinner = true;
    if (
      this.generalPasswordDataStorageService.encryptedGeneralPasswords !== null
    ) {
      this.decryptGeneralPasswordsOnWorkerThread(
        this.generalPasswordDataStorageService.encryptedGeneralPasswords
      );
    } else {
      this.generalPasswordDataStorageService
        .getGeneralPasswords(this.currentPage, this.searchText)
        .subscribe({
          next: (data: GeneralPasswordsResponse) => {
            if (data.data.generalPasswords.length != null) {
              this.generalPasswordDataStorageService.encryptedGeneralPasswords =
                data.data.generalPasswords;

              this.decryptGeneralPasswordsOnWorkerThread(
                this.generalPasswordDataStorageService.encryptedGeneralPasswords
              );
            }
          },
          error: (error) => {
            this.showLoadingSpinner = false;
            if (error.status == 401) {
              this.authService.logout();
              return;
            }
            this.toastr.error(error.error.message);
          },
        });
    }
  }

  private decryptGeneralPasswordsOnWorkerThread(
    encryptedGeneralPasswords: GeneralPassword[]
  ) {
    if (typeof Worker !== 'undefined') {
      if (!this.generalPasswordDataStorageService.generalPasswordsWorker) {
        this.generalPasswordDataStorageService.generalPasswordsWorker =
          new Worker(new URL('../general-passwords.worker', import.meta.url));
      }

      this.generalPasswordDataStorageService.generalPasswordsWorker.onmessage =
        ({ data }) => {
          const decryptedGeneralPasswords = data.generalPasswords;

          const filteredGeneralPasswordsObj =
            this.generalPasswordDataStorageService.searchAndPaginateGeneralPasswords(
              decryptedGeneralPasswords,
              this.currentPage,
              this.searchText
            );

          this.totalPages = filteredGeneralPasswordsObj.totalPages;
          this.generalPasswords = filteredGeneralPasswordsObj.generalPasswords;
          this.calculatePaginationStartIndex();
          this.showLoadingSpinner = false;
        };
      this.generalPasswordDataStorageService.generalPasswordsWorker.postMessage(
        {
          generalPasswords: Object.values(encryptedGeneralPasswords),
          encryptionKey: this.authService.getEncryptionKey(),
        }
      );
    } else {
      const decryptedGeneralPasswords = CryptoHelper.decryptGeneralPasswords(
        Object.values(encryptedGeneralPasswords),
        this.authService.getEncryptionKey()
      );

      const filteredGeneralPasswordsObj =
        this.generalPasswordDataStorageService.searchAndPaginateGeneralPasswords(
          decryptedGeneralPasswords,
          this.currentPage,
          this.searchText
        );
      this.totalPages = filteredGeneralPasswordsObj.totalPages;
      this.generalPasswords = filteredGeneralPasswordsObj.generalPasswords;
      this.calculatePaginationStartIndex();
      this.showLoadingSpinner = false;
    }
  }

  calculatePaginationStartIndex() {
    if (
      ((this.totalPages === 0 || this.totalPages === 1) &&
        this.currentPage > 1) ||
      (this.currentPage !== 1 && this.currentPage > this.totalPages)
    ) {
      this.router.navigate(['/not-found']);
      return;
    }

    if (this.currentPage % 4 === 0 && this.currentPage < this.totalPages) {
      this.startPage = this.currentPage - 1;
    } else if (
      this.currentPage % 4 === 0 &&
      this.currentPage === this.totalPages
    ) {
      this.startPage = this.currentPage - 3;
    } else if (this.currentPage % 4 === 3) {
      this.startPage = this.currentPage - 2;
    } else if (this.currentPage % 4 === 2) {
      this.startPage = this.currentPage - 1;
    } else if (this.currentPage % 4 === 1 && this.currentPage === 1) {
      this.startPage = this.currentPage;
    } else if (this.currentPage % 4 === 1 && this.currentPage !== 1) {
      this.startPage = this.currentPage - 2;
    }
  }

  copyPassword(password: string) {
    navigator.clipboard.writeText(password);
    this.toastr.info('Password copied');
  }

  togglePasswordVisibility(
    passwordField: HTMLInputElement,
    password: string,
    hiddenIconRef: FaIconComponent
  ) {
    if (passwordField.type === 'password') {
      passwordField.type = 'text';
      passwordField.value = password;
      hiddenIconRef.icon = faEyeSlash;
    } else {
      passwordField.type = 'password';
      passwordField.value = '..........';
      hiddenIconRef.icon = faEye;
    }
    hiddenIconRef.render();
  }

  onDelete(id: string) {
    this.generalPasswordDataStorageService.deleteGeneralPassword(id).subscribe({
      complete: () => {
        this.generalPasswordDataStorageService.encryptedGeneralPasswords =
          this.generalPasswordDataStorageService.encryptedGeneralPasswords.filter(
            (element: GeneralPassword) => element._id !== id
          );
        this.toastr.success('Deleted Successfully!');

        if (this.generalPasswords.length === 1 && this.currentPage !== 1) {
          this.router.navigate(['/general-passwords'], {
            queryParams: {
              page: this.currentPage - 1,
              search: this.searchText,
            },
          });
          return;
        }
        this.populateGeneralPasswords();
      },
      error: (error) => {
        if (error.status == 401) {
          this.authService.logout();
          return;
        }
        this.toastr.error(error.error.message);
      },
    });
  }

  addNewGeneralPassword() {
    this.router.navigate(['/general-passwords', 'new']);
  }

  onEdit(id: string) {
    this.router.navigate(['/general-passwords', id, 'edit']);
  }

  navigateToPage(page: number) {
    const queryParams =
      this.searchText !== '' ? { page, search: this.searchText } : { page };

    this.router.navigate(['/general-passwords'], {
      queryParams,
    });
  }

  ngOnDestroy(): void {
    this.generalPasswords = null;
    clearTimeout(this.searchTimer);
  }
}
