import { SharedMutex } from '@david.uhlir/mutex'
import { DataLayer, DataLayerFsApi } from '../DataLayer/DataLayer'
import { Dependency, dependencyFsInjector } from './Dependency'

/**
 * Files scope, with mutexes implemented
 */
export type MutexKeyItem = { key: string; singleAccess: boolean }

export interface ScopeOptions {
  mutexPrefix: string // prefix of mutexes
  maxLockingTime?: number // mutex max locking time
  commitIfFail?: boolean // commit result in case handler throws error
}

export const DEFAULT_SCOPE_OPTIONS: ScopeOptions = {
  mutexPrefix: '#dataScope:',
  commitIfFail: false,
}

export class Scope<T> {
  protected options: ScopeOptions = DEFAULT_SCOPE_OPTIONS

  constructor(options?: Partial<ScopeOptions>) {
    if (options) {
      this.options = {
        ...this.options,
        ...options,
      }
    }
    if (!this.options.mutexPrefix.length) {
      throw new Error('Mutex prefix key must be at least 1 character')
    }
  }

  /**
   * Initialize scope
   */
  protected createDatalayer(dependecies: Dependency[]): DataLayer {
    // use this to preapre fs
    return null
  }

  /**
   * Open scope with dependecies
   */
  async open<K extends { [key: string]: Dependency }>(dependeciesMap: K, handler: (fs: DataLayerFsApi, dependecies: K) => Promise<T>): Promise<T> {
    const dependeciesList = Object.keys(dependeciesMap).reduce<Dependency[]>((acc, key) => [...acc, dependeciesMap[key]], [])

    // call before open to preapre fs, etc...
    const dataLayer = this.createDatalayer(dependeciesList)

    // inject fs to dependecies
    dependeciesList.forEach(dependency => dependency[dependencyFsInjector](dataLayer))

    // lock access to group
    return Scope.lockScope(
      dependeciesList.map(key => ({ key: this.options.mutexPrefix + key.path, singleAccess: key.writeAccess })),
      dependeciesMap,
      async () => {
        // do the stuff in scope
        let result
        try {
          result = await handler(dataLayer.fs, dependeciesMap)
        } catch (e) {
          if (this.options.commitIfFail) {
            await dataLayer.commit()
          }
          throw e
        }
        await dataLayer.commit()
        return result
      },
      this.options.maxLockingTime,
    )
  }

  /**
   * Internal scope lock
   * @param mutexes
   * @param dependeciesMap
   * @param handler
   * @param maxLockingTime
   * @returns
   */
  protected static lockScope<T, K extends { [key: string]: Dependency }>(
    mutexes: MutexKeyItem[],
    dependeciesMap: K,
    handler: () => Promise<T>,
    maxLockingTime?: number,
  ) {
    const m = mutexes.pop()
    return SharedMutex.lockAccess(
      m.key,
      async () => {
        if (mutexes.length) {
          return this.lockScope(mutexes, dependeciesMap, handler, maxLockingTime)
        }
        return handler()
      },
      m.singleAccess,
      maxLockingTime,
    )
  }
}
