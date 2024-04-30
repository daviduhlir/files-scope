export type MutexKeyItem = { key: string[]; singleAccess: boolean }
export type KeysStrategy = (mutexPrefix: string, keys: MutexKeyItem[]) => MutexKeyItem[]
