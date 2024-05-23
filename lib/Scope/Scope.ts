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

export class Scope<T, K extends { [key: string]: Dependency }> {
  protected options: ScopeOptions = DEFAULT_SCOPE_OPTIONS
  protected dataLayer: DataLayer
  protected dependeciesList: Dependency[]
  protected opened: boolean = false

  constructor(readonly dependeciesMap: K, options?: Partial<ScopeOptions>) {
    if (options) {
      this.options = {
        ...this.options,
        ...options,
      }
    }
    this.initialize()
  }

  /**
   * Initialize scope
   */
  protected initialize() {
    if (!this.options.mutexPrefix.length) {
      throw new Error('Mutex prefix key must be at least 1 character')
    }
    this.dependeciesList = Object.keys(this.dependeciesMap).reduce<Dependency[]>((acc, key) => [...acc, this.dependeciesMap[key]], [])
  }

  /**
   * Get scope fs
   */
  public get fs() {
    if (!this.opened) {
      throw new Error('Can not access scope fs, scope is not opened')
    }
    return this.dataLayer.fs
  }

  /**
   * Scope prepare factory
   */
  static prepare<K extends { [key: string]: Dependency }>(workingDir: string, dependeciesMap: K, options?: Partial<ScopeOptions>) {
    return new Scope(dependeciesMap, options)
  }

  /**
   * Open scope with dependecies
   */
  async open(handler: (fs: DataLayerFsApi, dependecies: K) => Promise<T>): Promise<T> {
    this.opened = true
    // inject fs to dependecies
    this.dependeciesList.forEach(dependency => dependency[dependencyFsInjector](this))

    // lock access to group
    return Scope.lockScope(
      this.dependeciesList.map(key => ({ key: this.options.mutexPrefix + key.path, singleAccess: key.writeAccess })),
      this.dependeciesMap,
      async () => {
        // do the stuff in scope
        let result
        try {
          result = await handler(this.dataLayer.fs, this.dependeciesMap)
        } catch (e) {
          if (this.options.commitIfFail) {
            await this.dataLayer.commit()
            this.opened = false
          }
          throw e
        }
        await this.dataLayer.commit()
        this.opened = false
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
