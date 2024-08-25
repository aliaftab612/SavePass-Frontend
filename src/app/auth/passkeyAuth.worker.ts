/// <reference lib="webworker" />

import { CryptoHelper } from '../shared/crypto-helper';

addEventListener('message', async ({ data }) => {
  const response = {
    result: await CryptoHelper.decryptVaultEncryptionKeyUsingPasskeyPrfKey(
      data.prfKey,
      data.passkeyEncryptedEncryptionKey,
      data.salt,
      data.hashIterations
    ),
  };
  postMessage(response);
});
