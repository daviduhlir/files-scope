import { SharedMutex } from '@david.uhlir/mutex'
import { DataLayer, DataLayerFsApi } from '../DataLayer/DataLayer'
import { Dependency, dependencyFsInjector } from './Dependency'
import AsyncLocalStorage from '../helpers/AsyncLocalStorage'
import { concatMutexKey, isSubpath } from '../helpers'
import { getStack } from '../utils/stack'

/**
 * Files scope, with mutexes implemented
 */
export type MutexKeyItem = { key: string; singleAccess: boolean }

export interface ScopeOptions {
  mutexPrefix: string // prefix of mutexes
  maxLockingTime?: number // mutex max locking time
  commitIfFail?: boolean // commit result in case handler throws error
  dryRun?: boolean // dry run mode, do not commit changes
  beforeRootScopeOpen?: () => Promise<void>
  afterRootScopeDone?: (changedPaths: string[]) => Promise<void>
  beforeScopeOpen?: () => Promise<void>
  afterScopeDone?: (changedPaths: string[]) => Promise<void>
  readonly?: boolean
  handlerWrapper?: <T>(actionCaller: () => Promise<T>) => Promise<T>
  ignoreCommitErrors?: boolean
  binaryMode?: boolean
}

export const DEFAULT_SCOPE_OPTIONS: ScopeOptions = {
  mutexPrefix: '#dataScope:',
  commitIfFail: false,
  beforeRootScopeOpen: undefined,
  afterRootScopeDone: undefined,
  readonly: false,
  ignoreCommitErrors: true,
  binaryMode: true,
}

export class Scope {
  /**
   * storage of data for nested keys
   */
  protected static stackStorage = new AsyncLocalStorage<{
    [workingDir: string]: {
      layer: DataLayer
      mutexKeys: MutexKeyItem[]
    }[]
  }>()

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
   * Get working directory
   * @returns
   */
  public getWorkingDir(): string {
    return this.workingDir
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
    const stackStorage = Scope.stackStorage.getStore() || {}
    const stack = [...(stackStorage[this.workingDir] || [])]
    const parent = stack?.length ? stack[stack.length - 1].layer : undefined

    const allParentalMutexes = stack.map(item => item.mutexKeys).flat()

    // data layer factory is just only for root scope
    const dataLayer = parent
      ? new DataLayer(
          parent.getFsProxy(true),
          dependeciesList.filter(key => key.writeAccess).map(key => key.path),
        )
      : this.createDatalayer(dependeciesList)

    // inject fs to dependecies
    dependeciesList.forEach(dependency => dependency[dependencyFsInjector](dataLayer))
    dependeciesList.forEach(dependency => dependency.initialize())

    // lock access to group
    const mutexKeysRequested = dependeciesList
      .filter(key => key.needsLock())
      .map(key => ({
        // TODO make better key creation
        key: concatMutexKey(this.options.mutexPrefix, this.workingDir, key.path),
        singleAccess: key.writeAccess,
      }))
      .sort((a, b) => a.key.length - b.key.length)
      .sort((a, b) => (a.singleAccess && !b.singleAccess ? -1 : !b.singleAccess && a.singleAccess ? +1 : 0))

    // optimize keys
    const mutexKeys = []
    for (const lock of mutexKeysRequested) {
      const parentalSubkeys = allParentalMutexes.filter(item => isSubpath(lock.key, item.key))

      if (lock.singleAccess && parentalSubkeys.some(l => l.singleAccess)) {
        continue
      }
      if (!lock.singleAccess && parentalSubkeys.length) {
        continue
      }
      const alreadyAdded = mutexKeys.filter(item => isSubpath(lock.key, item.key))
      if (lock.singleAccess && alreadyAdded.some(l => l.singleAccess)) {
        continue
      }
      if (!lock.singleAccess && alreadyAdded.length) {
        continue
      }
      mutexKeys.push(lock)
    }

    let changedPaths = []
    const result = await Scope.stackStorage.run(
      { ...stackStorage, [this.workingDir]: [...stack, { layer: dataLayer, mutexKeys: [...mutexKeys] }] },
      async () =>
        Scope.lockScope(
          mutexKeys,
          dependeciesMap,
          async () => {
            if (!parent && this.options.beforeRootScopeOpen) {
              await this.options.beforeRootScopeOpen()
            }

            if (this.options.beforeScopeOpen) {
              await this.options.beforeScopeOpen()
            }

            // do the stuff in scope
            let result
            try {
              if (this.options.handlerWrapper) {
                result = await this.options.handlerWrapper(() => handler(dataLayer.fs, dependeciesMap))
              } else {
                result = await handler(dataLayer.fs, dependeciesMap)
              }
            } catch (e) {
              if (this.options.commitIfFail && !this.options.dryRun) {
                changedPaths = await dataLayer.commit(this.options.ignoreCommitErrors, this.options.binaryMode)
              }
              throw e
            }
            if (!this.options.dryRun) {
              changedPaths = await dataLayer.commit(this.options.ignoreCommitErrors, this.options.binaryMode)
            }
            return result
          },
          this.options.maxLockingTime,
          getStack(),
        ),
    )

    if (this.options.afterScopeDone) {
      await this.options.afterScopeDone(changedPaths)
    }

    if (!parent && this.options.afterRootScopeDone) {
      await this.options.afterRootScopeDone(changedPaths)
    }

    dataLayer.clear()
    return result
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
    stack?: string,
  ) {
    const m = mutexes.pop()
    if (!m) {
      return handler()
    }
    return SharedMutex.lockAccess(
      m.key,
      async () => {
        if (mutexes.length) {
          return this.lockScope(mutexes, dependeciesMap, handler, maxLockingTime, stack)
        }
        return handler()
      },
      m.singleAccess,
      maxLockingTime,
      stack,
    )
  }
}
