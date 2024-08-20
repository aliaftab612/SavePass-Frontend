/// <reference lib="webworker" />

import { CryptoHelper } from './../../../../shared/crypto-helper';

addEventListener('message', async ({ data }) => {
  const response = {
    result: await CryptoHelper.encryptVaultEncryptionKeyUsingPasskeyPrfKey(
      data.prfKey,
      data.vaultEncryptionKey,
      data.salt,
      data.hashIterations
    ),
  };
  postMessage(response);
});
