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
}

interface GeneralPasswordsResponse {
  status: string;
  results: number;
  data: { generalPasswords: GeneralPassword[] };
}

interface GeneralPasswordResponse {
  status: string;
  data: { generalPassword: GeneralPassword };
}

interface AuthenticationHashedKeys {
  encryptionKey: string;
  loginHash: string;
}
