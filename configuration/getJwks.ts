// Jwks should be rotate from time to time
// Correct procedure is to:
// 1. Add new key
// 2. Restart processes
// 3. Put key on the beginning
// 4. Restart processes

import {JWKS} from 'oidc-provider';
import * as path from 'path';
import {getJsonObject} from '../utils';

export const getJwks = async (): Promise<JWKS> => {
    const jwks: JWKS = {
        keys: [await getJsonObject(path.resolve('./nonRepoConfigFiles/jwksCerts/cert1.json'))]
    };
    return jwks;
};
