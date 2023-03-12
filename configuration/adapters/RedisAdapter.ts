import Redis from 'ioredis'; // eslint-disable-line import/no-unresolved
import * as _ from 'lodash';

const client = new Redis(6379, {keyPrefix: 'oidc:'});
const grantable = new Set(['AccessToken', 'AuthorizationCode', 'RefreshToken', 'DeviceCode', 'BackchannelAuthenticationRequest']);
const consumable = new Set(['AuthorizationCode', 'RefreshToken', 'DeviceCode', 'BackchannelAuthenticationRequest']);

function grantKeyFor(id) {
    return `grant:${id}`;
}

function userCodeKeyFor(userCode) {
    return `userCode:${userCode}`;
}

function uidKeyFor(uid) {
    return `uid:${uid}`;
}

class RedisAdapter {
    name: string;
    constructor(name) {
        this.name = name;
    }

    async upsert(id, payload, expiresIn) {
        const key = this.key(id);

        const multi = client.multi();
        const stringifiedPayload = JSON.stringify(payload);
        if (consumable.has(this.name)) {
            const store = {payload: stringifiedPayload};
            multi.hmset(key, store);
        } else {
            const store = stringifiedPayload;
            multi.set(key, store);
        }

        if (expiresIn) {
            multi.expire(key, expiresIn);
        }

        if (grantable.has(this.name) && payload.grantId) {
            const grantKey = grantKeyFor(payload.grantId);
            multi.rpush(grantKey, key);
            // if you're seeing grant key lists growing out of acceptable proportions consider using LTRIM
            // here to trim the list to an appropriate length
            const ttl = await client.ttl(grantKey);
            if (expiresIn > ttl) {
                multi.expire(grantKey, expiresIn);
            }
        }

        if (payload.userCode) {
            const userCodeKey = userCodeKeyFor(payload.userCode);
            multi.set(userCodeKey, id);
            multi.expire(userCodeKey, expiresIn);
        }

        if (payload.uid) {
            const uidKey = uidKeyFor(payload.uid);
            multi.set(uidKey, id);
            multi.expire(uidKey, expiresIn);
        }

        await multi.exec();
    }

    async find(id) {
        const data = consumable.has(this.name) ? await client.hgetall(this.key(id)) : await client.get(this.key(id));

        if (_.isEmpty(data)) {
            return undefined;
        }

        if (typeof data === 'string') {
            return JSON.parse(data);
        }
        const {payload, ...rest} = data;
        return {
            ...rest,
            ...JSON.parse(payload)
        };
    }

    async findByUid(uid) {
        const id = await client.get(uidKeyFor(uid));
        return this.find(id);
    }

    async findByUserCode(userCode) {
        const id = await client.get(userCodeKeyFor(userCode));
        return this.find(id);
    }

    async destroy(id) {
        const key = this.key(id);
        await client.del(key);
    }

    async revokeByGrantId(grantId) {
        // eslint-disable-line class-methods-use-this
        const multi = client.multi();
        const tokens = await client.lrange(grantKeyFor(grantId), 0, -1);
        tokens.forEach((token) => multi.del(token));
        multi.del(grantKeyFor(grantId));
        await multi.exec();
    }

    async consume(id) {
        await client.hset(this.key(id), 'consumed', Math.floor(Date.now() / 1000));
    }

    key(id) {
        return `${this.name}:${id}`;
    }
}

export default RedisAdapter;
