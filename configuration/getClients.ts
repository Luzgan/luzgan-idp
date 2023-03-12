import {ClientMetadata, Configuration} from 'oidc-provider';

export const getClients = async (): Promise<Configuration['clients']> => {
    const clients: ClientMetadata[] = [
        {
            client_id: 'test_implicit_app',
            grant_types: ['authorization_code'],
            response_types: ['code'],
            redirect_uris: ['https://test-login:8123/signin-oidc'],
            token_endpoint_auth_method: 'none'
        }
    ];
    return clients;
};
