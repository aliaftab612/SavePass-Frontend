/// <reference lib="webworker" />

import { CryptoHelper } from '../shared/crypto-helper';

addEventListener('message', ({ data }) => {
  const response = {
    generalPasswords: CryptoHelper.decryptGeneralPasswords(
      data.generalPasswords,
      data.encryptionKey
    ),
  };
  postMessage(response);
});
