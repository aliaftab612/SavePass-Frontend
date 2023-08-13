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

interface AuthenticationHashedKeys {
  encryptionKey: string;
  loginHash: string;
  localLoginHash: string;
}
