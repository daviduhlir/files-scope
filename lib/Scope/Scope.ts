import { SharedMutex } from '@david.uhlir/mutex'
import { DataLayer, DataLayerFsApi } from '../DataLayer/DataLayer'
import { Dependency, dependencyFsInjector } from './Dependency'
import AsyncLocalStorage from '../utils/AsyncLocalStorage'
import { concatMutexKey, isSubpath } from '../utils'

/**
 * Files scope, with mutexes implemented
 */
export type MutexKeyItem = { key: string; singleAccess: boolean }

export interface ScopeOptions {
  mutexPrefix: string // prefix of mutexes
  maxLockingTime?: number // mutex max locking time
  commitIfFail?: boolean // commit result in case handler throws error
  beforeRootScopeOpen?: () => Promise<void>
  afterRootScopeDone?: (changedPaths: string[]) => Promise<void>
  readonly?: boolean
}

export const DEFAULT_SCOPE_OPTIONS: ScopeOptions = {
  mutexPrefix: '#dataScope:',
  commitIfFail: false,
  beforeRootScopeOpen: undefined,
  afterRootScopeDone: undefined,
  readonly: false,
}

export class Scope {
  /**
   * storage of data for nested keys
   */
  protected stackStorage = new AsyncLocalStorage<
    {
      layer: DataLayer
      mutexKeys: MutexKeyItem[]
    }[]
  >()

  protected options: ScopeOptions = DEFAULT_SCOPE_OPTIONS

  constructor(readonly workingDir: string, options?: Partial<ScopeOptions>) {
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
   * Scope prepare factory
   */
  static prepare(workingDir: string, options?: Partial<ScopeOptions>) {
    return new Scope(workingDir, options)
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
  async open<T, K extends { [key: string]: Dependency }>(dependeciesMap: K, handler: (fs: DataLayerFsApi, dependecies: K) => Promise<T>): Promise<T> {
    const dependeciesList = Object.keys(dependeciesMap).reduce<Dependency[]>((acc, key) => [...acc, dependeciesMap[key]], [])

    if (this.options.readonly && dependeciesList.some(d => d.writeAccess)) {
      throw new Error('This scope has only read access')
    }

    // call before open to preapre fs, etc...
    const stack = [...(this.stackStorage.getStore() || [])]
    const parent = stack?.length ? stack[stack.length - 1].layer : undefined

    const allParentalMutexes = stack.map(item => item.mutexKeys).flat()

    // data layer factory is just only for root scope
    const dataLayer = parent
      ? new DataLayer(
          parent.fs,
          dependeciesList.filter(key => key.writeAccess).map(key => key.path),
        )
      : this.createDatalayer(dependeciesList)

    // inject fs to dependecies
    dependeciesList.forEach(dependency => dependency[dependencyFsInjector](dataLayer))
    dependeciesList.forEach(dependency => dependency.initialize())

    // lock access to group
    const mutexKeys = dependeciesList
      .filter(key => key.needsLock())
      .map(key => ({
        // TODO make better key creation
        key: concatMutexKey(this.options.mutexPrefix, this.workingDir, key.path),
        singleAccess: key.writeAccess,
      }))
      .filter(lock => !allParentalMutexes.find(item => isSubpath(lock.key, item.key)))

    if (!parent && this.options.beforeRootScopeOpen) {
      await this.options.beforeRootScopeOpen()
    }

    let changedPaths = []
    const result = await this.stackStorage.run([...stack, { layer: dataLayer, mutexKeys: [...mutexKeys] }], async () =>
      Scope.lockScope(
        mutexKeys,
        dependeciesMap,
        async () => {
          // do the stuff in scope
          let result
          try {
            result = await handler(dataLayer.fs, dependeciesMap)
          } catch (e) {
            if (this.options.commitIfFail) {
              changedPaths = await dataLayer.commit()
            }
            throw e
          }
          changedPaths = await dataLayer.commit()
          return result
        },
        this.options.maxLockingTime,
      ),
    )

    if (!parent && this.options.afterRootScopeDone) {
      await this.options.afterRootScopeDone(changedPaths)
    }

    return result
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
    if (!m) {
      return handler()
    }
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
