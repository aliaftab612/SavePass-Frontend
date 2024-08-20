import { User } from 'src/app/auth/user.model';
import { GeneralPassword } from 'src/app/general-passwords/general-password.model';

interface UserDataResponse {
  status: string;
  data: {
    user: User;
  };
}

interface LoginSignupResponse {
  status: string;
  token: string;
}

interface GeneralPasswordsResponse {
  status: string;
  results: number;
  data: { generalPasswords: GeneralPassword[] };
}

interface TwoFactorProvidersEnabledStatus {
  authenticatorAppEnabled: boolean;
}

interface TwoFactorProvidersEnabledStatusResponse {
  status: string;
  data: TwoFactorProvidersEnabledStatus;
}

interface UpdateAppLockoutTime {
  status: string;
  data: { appLockoutMinutes: number };
}

interface GeneralPasswordResponse {
  status: string;
  data: { generalPassword: GeneralPassword };
}

interface PreLoginResponse {
  status: string;
  data: { hashIterations: number };
}

interface GetOrEnableAuthenticatorResponse {
  status: string;
  data: {
    enabled: boolean;
    secret: string;
  };
}

interface DisableAuthenticatorResponse {
  status: string;
  data: {
    enabled: boolean;
  };
}

interface AuthenticationHashedKeys {
  encryptionKey: string;
  loginHash: string;
  localLoginHash: string;
}

interface ModalOutput {
  action: boolean;
  data?: any;
}

interface UpdateProfilePhotoResponse {
  status: string;
  data: { profilePhotoUrl: string };
}

export declare type EncryptVaultEncryptionKeyResult = {
  publicRSAKey: string;
  encryptedPrivateRSAKey: string;
  encryptedVaultEncryptionKey: string;
};
