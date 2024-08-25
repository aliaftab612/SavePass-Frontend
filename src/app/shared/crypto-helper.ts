import { PBKDF2, AES, enc, algo, lib } from 'crypto-js';
import {
  AuthenticationHashedKeys,
  EncryptVaultEncryptionKeyResult,
  PasskeyEncryptedEncryptionKey,
} from 'index';
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
    iterations: number,
    localAuthorization: boolean = false
  ): AuthenticationHashedKeys => {
    const encryptionKey = CryptoHelper.pkbfd2SHA256(
      password,
      username,
      iterations
    );
    let loginHash = null;

    if (!localAuthorization) {
      loginHash = CryptoHelper.pkbfd2SHA256(encryptionKey, password, 1);
    }

    const localLoginHash = CryptoHelper.pkbfd2SHA256(
      encryptionKey,
      password,
      2
    );

    return { encryptionKey, loginHash, localLoginHash };
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

  public static async decryptVaultEncryptionKeyUsingPasskeyPrfKey(
    prfkey: string,
    passkeyEncryptedEncryptionKey: PasskeyEncryptedEncryptionKey,
    salt: string,
    hashIterations = 600000
  ): Promise<string> {
    const hashedPrfKey = this.pkbfd2SHA256(prfkey, salt, hashIterations);

    const privateRSAKey = this.decryptAES256(
      passkeyEncryptedEncryptionKey.encryptedPrivateRSAKey,
      hashedPrfKey
    );

    const vaultEncryptionKey = await this.decryptRSA(
      passkeyEncryptedEncryptionKey.encryptedVaultEncryptionKey,
      privateRSAKey
    );

    return vaultEncryptionKey;
  }

  public static async encryptVaultEncryptionKeyUsingPasskeyPrfKey(
    prfkey: string,
    vaultEncryptionKey: string,
    salt: string,
    hashIterations = 600000
  ): Promise<EncryptVaultEncryptionKeyResult> {
    const hashedPrfKey = this.pkbfd2SHA256(prfkey, salt, hashIterations);

    const { publicKey: publicRSAKey, privateKey: privateRSAKey } =
      await this.generateRSAKeyPair();

    const encryptedVaultEncryptionKey = await this.encryptRSA(
      vaultEncryptionKey,
      publicRSAKey
    );

    const encryptedPrivateRSAKey = this.encryptAES256(
      privateRSAKey,
      hashedPrfKey
    );

    return {
      publicRSAKey,
      encryptedPrivateRSAKey,
      encryptedVaultEncryptionKey,
    };
  }

  private static async generateRSAKeyPair() {
    // Generate RSA key pair
    const keyPair = await globalThis.crypto.subtle.generateKey(
      {
        name: 'RSA-OAEP',
        modulusLength: 2048, // Key length
        publicExponent: new Uint8Array([1, 0, 1]), // 65537
        hash: 'SHA-256', // Use SHA-256 with RSA
      },
      true, // Whether the key is extractable (i.e., can be exported)
      ['encrypt', 'decrypt'] // Can be used for these operations
    );

    // Export the keys to a format that can be used
    const publicKey = await globalThis.crypto.subtle.exportKey(
      'spki',
      keyPair.publicKey
    );
    const privateKey = await globalThis.crypto.subtle.exportKey(
      'pkcs8',
      keyPair.privateKey
    );

    return {
      publicKey: this.arrayBufferToBase64(publicKey),
      privateKey: this.arrayBufferToBase64(privateKey),
    };
  }

  private static arrayBufferToBase64(buffer: ArrayBuffer): string {
    const binary = String.fromCharCode(...new Uint8Array(buffer));
    return globalThis.btoa(binary);
  }

  private static async encryptRSA(
    plaintext: string,
    publicKeyBase64: string
  ): Promise<string> {
    const publicKeyBuffer = this.base64ToArrayBuffer(publicKeyBase64);
    const publicKey = await globalThis.crypto.subtle.importKey(
      'spki',
      publicKeyBuffer,
      {
        name: 'RSA-OAEP',
        hash: 'SHA-256',
      },
      true,
      ['encrypt']
    );

    const encodedText = new TextEncoder().encode(plaintext);
    const encrypted = await globalThis.crypto.subtle.encrypt(
      {
        name: 'RSA-OAEP',
      },
      publicKey,
      encodedText
    );

    return this.arrayBufferToBase64(encrypted);
  }

  private static base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = globalThis.atob(base64);
    const binaryLength = binaryString.length;
    const bytes = new Uint8Array(binaryLength);
    for (let i = 0; i < binaryLength; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  private static async decryptRSA(
    encryptedTextBase64: string,
    privateKeyBase64: string
  ): Promise<string> {
    const privateKeyBuffer = this.base64ToArrayBuffer(privateKeyBase64);
    const privateKey = await globalThis.crypto.subtle.importKey(
      'pkcs8',
      privateKeyBuffer,
      {
        name: 'RSA-OAEP',
        hash: 'SHA-256',
      },
      true,
      ['decrypt']
    );

    const encryptedBuffer = this.base64ToArrayBuffer(encryptedTextBase64);
    const decrypted = await globalThis.crypto.subtle.decrypt(
      {
        name: 'RSA-OAEP',
      },
      privateKey,
      encryptedBuffer
    );

    return new TextDecoder().decode(decrypted);
  }
}
