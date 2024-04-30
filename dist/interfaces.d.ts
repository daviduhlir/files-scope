export declare type MutexKeyItem = {
    key: string[];
    singleAccess: boolean;
};
export declare type KeysStrategy = (mutexPrefix: string, keys: MutexKeyItem[]) => MutexKeyItem[];
