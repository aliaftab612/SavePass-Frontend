/// <reference lib="webworker" />

import { CryptoHelper } from '../shared/crypto-helper';

addEventListener('message', ({ data }) => {
  const response = {
    keys: CryptoHelper.generateEncryptionKeyAndLoginHash(
      data.password,
      data.username,
      data.iterations,
      data.localAuthorizationHash
    ),
  };
  postMessage(response);
});
