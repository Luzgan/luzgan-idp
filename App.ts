import * as https from 'https';
import * as fs from 'fs';
import {Provider} from 'oidc-provider';
import {getAdapter} from './configuration/getAdapter';
import {getClients} from './configuration/getClients';
import {getCookies} from './configuration/getCookies';
import {getJwks} from './configuration/getJwks';
import * as express from 'express';

export class App {
    oidc: Provider;
    options: {key; cert};
    app: express.Express;
    constructor() {
        this.startApp();
    }

    startApp = async () => {
        console.log('Starting an app');
        this.options = {
            key: fs.readFileSync('./nonRepoConfigFiles/key.pem'),
            cert: fs.readFileSync('./nonRepoConfigFiles/cert.pem')
        };

        await this.startOidc();
        this.createApp();
        https.createServer(this.options, this.app).listen(8124);
    };

    createApp = () => {
        this.app = express();
        this.app.use(express.urlencoded({extended: true}));
        this.app.use(express.json());

        this.app.use((req, res, next) => {
            console.log('Access log');
            next();
        });
        this.app.use(this.oidc.callback());
    };

    startOidc = async () => {
        this.oidc = new Provider('https://localhost:8124', {
            adapter: await getAdapter(),

            jwks: await getJwks(),
            cookies: await getCookies(),
            clients: await getClients(),
            pkce: {
                methods: ['S256'],
                required: () => true
            },
            claims: {
                email: ['email']
            },
            routes: {
                jwks: '/.well-known/jwks.json'
            },
            async issueRefreshToken(ctx, client, code) {
                if (!client.grantTypeAllowed('refresh_token')) {
                    console.log('');
                    return false;
                }
                return code.scopes.has('offline_access') || (client.applicationType === 'web' && client.clientAuthMethod === 'none');
            },

            async findAccount(ctx, id) {
                return {
                    accountId: id,
                    async claims() {
                        return {sub: id};
                    }
                };
            }
        });
    };
}
