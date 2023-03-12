import {promises} from 'fs';

export async function getJsonObject(path: string): Promise<object> {
    const json = await (await promises.readFile(path)).toString();
    return JSON.parse(json);
}
