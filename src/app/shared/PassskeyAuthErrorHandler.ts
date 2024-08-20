import { ErrorCodes, ErrorFrom, PasskeysAuthError } from 'passkeys-prf-client';

export const handleError = (error: PasskeysAuthError): string => {
  if (error.errorCode === ErrorCodes.AbortError) return undefined;

  let errMessage = error.from + ' Error : ';

  if (error.from === ErrorFrom.BrowserWebAuthn) {
    switch (error.errorCode) {
      case ErrorCodes.NotAllowedError:
        errMessage = 'Passkey creation was canceled by the user.';
        break;
      case ErrorCodes.FailedCreateCredential:
        errMessage = 'Failed to create a new passkey.';
        break;
      case ErrorCodes.PassKeySignInVerificationFailed:
        errMessage =
          'Passkey sign-in verification failed. Please try again or use an alternate sign-in method.';
        break;
      case ErrorCodes.PRFNotSupported:
        errMessage =
          'Your browser or device does not support PRF, which is necessary for encryption with passkeys.';
        break;
      case ErrorCodes.InvalidStateError:
        errMessage =
          'A passkey already exists for the current user on this authenticator."';
        break;
      default:
        errMessage += error.message;
        break;
    }
  } else if (error.errorCode === ErrorCodes.HTTP) {
    errMessage += `HTTP Request Failed - ${error.message}`;
  } else {
    errMessage += error.message;
  }

  return errMessage;
};
