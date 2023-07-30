import { PBKDF2, AES, enc, algo, lib } from 'crypto-js';
import { AuthenticationHashedKeys } from 'index';
import { GeneralPassword } from '../general-passwords/general-password.model';

export class CryptoHelper {
  private static pkbfd2SHA256(
    password: string,
    salt: string,
    iterations: number
  ): string {
    return PBKDF2(password, salt, {
      iterations,
      keySize: 256 / 32,
      hasher: algo.SHA256,
    }).toString();
  }

  private static encryptAES256(
    plainText: string,
    encyptionKey: string
  ): string {
    return CryptoHelper.stringifyCipherParams(
      AES.encrypt(plainText, encyptionKey)
    );
  }

  private static decryptAES256(
    encryptedText: string,
    encyptionKey: string
  ): string {
    return AES.decrypt(
      CryptoHelper.parseCipherParams(encryptedText),
      encyptionKey
    ).toString(enc.Utf8);
  }

  static generateEncryptionKeyAndLoginHash = (
    password: string,
    username: string,
    iterations: number
  ): AuthenticationHashedKeys => {
    const encryptionKey = CryptoHelper.pkbfd2SHA256(
      password,
      username,
      iterations
    );

    const loginHash = CryptoHelper.pkbfd2SHA256(encryptionKey, password, 1);

    return { encryptionKey, loginHash };
  };

  static encryptGeneralPassword(
    generalPassword: GeneralPassword,
    encryptionKey: string
  ): GeneralPassword {
    generalPassword.website = this.encryptAES256(
      generalPassword.website,
      encryptionKey
    );
    generalPassword.username = this.encryptAES256(
      generalPassword.username,
      encryptionKey
    );
    generalPassword.password = this.encryptAES256(
      generalPassword.password,
      encryptionKey
    );

    return generalPassword;
  }

  static decryptGeneralPassword(
    encryptedGeneralPassword: GeneralPassword,
    encryptionKey: string
  ): GeneralPassword {
    encryptedGeneralPassword.website = this.decryptAES256(
      encryptedGeneralPassword.website,
      encryptionKey
    );
    encryptedGeneralPassword.username = this.decryptAES256(
      encryptedGeneralPassword.username,
      encryptionKey
    );
    encryptedGeneralPassword.password = this.decryptAES256(
      encryptedGeneralPassword.password,
      encryptionKey
    );

    return encryptedGeneralPassword;
  }

  static decryptGeneralPasswords(
    generalPasswords: GeneralPassword[],
    encryptionKey: string
  ): GeneralPassword[] {
    generalPasswords.map((generalPassword: GeneralPassword) => {
      generalPassword.website = this.decryptAES256(
        generalPassword.website,
        encryptionKey
      );
      generalPassword.username = this.decryptAES256(
        generalPassword.username,
        encryptionKey
      );
      generalPassword.password = this.decryptAES256(
        generalPassword.password,
        encryptionKey
      );

      return generalPassword;
    });

    return generalPasswords;
  }

  private static stringifyCipherParams(cipherParams: lib.CipherParams): string {
    let cipherParamsString = '';

    cipherParamsString =
      cipherParamsString + cipherParams.ciphertext.toString(enc.Base64);

    if (cipherParams.iv) {
      cipherParamsString =
        cipherParamsString + '|' + cipherParams.iv.toString();
    }
    if (cipherParams.salt) {
      cipherParamsString =
        cipherParamsString + '|' + cipherParams.salt.toString();
    }
    return cipherParamsString;
  }

  private static parseCipherParams(
    cipherParamsString: string
  ): lib.CipherParams {
    const cipherParamsArray = cipherParamsString.split('|');

    var cipherParams = lib.CipherParams.create({
      ciphertext: enc.Base64.parse(cipherParamsArray[0]),
    });

    if (cipherParamsArray[1] !== undefined) {
      cipherParams.iv = enc.Hex.parse(cipherParamsArray[1]);
    }
    if (cipherParamsArray[2] !== undefined) {
      cipherParams.salt = enc.Hex.parse(cipherParamsArray[2]);
    }
    return cipherParams;
  }
}
