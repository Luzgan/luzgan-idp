import {Configuration} from 'oidc-provider';
import RedisAdapter from './adapters/RedisAdapter';

export const getAdapter = async (): Promise<Configuration['adapter']> => {
    return RedisAdapter;
};
