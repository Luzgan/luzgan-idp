// Cookie keys should be rotated regularly, new keys on the beginning

import {getJsonObject} from '../utils';
import * as path from 'path';
import {Configuration} from 'oidc-provider';

export const getCookies = async (): Promise<Configuration['cookies']> => {
    const cookieKeys = await getJsonObject(path.resolve('./nonRepoConfigFiles/cookieKeys/cookieKeys.json'));
    return {
        keys: cookieKeys['keys']
    };
};
