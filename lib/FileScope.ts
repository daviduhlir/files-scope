import { SharedMutex } from '@david.uhlir/mutex'
import { FsDataLayer } from './FsDataLayer'
import { DataLayerFsApi, DataLayerPromiseSingleFileApi } from './DataLayer';

export type MutexKeyItem = { key: string; singleAccess: boolean }

export interface FileScopeOptions {
  mutexPrefix: string
  maxLockingTime?: number
  commitIfFail?: boolean
}

export const DEFAULT_SCOPE_OPTIONS: FileScopeOptions = {
  mutexPrefix: '#fileScope:',
  commitIfFail: false
}

const dependencyFsInjector = Symbol()
export class Dependency {
  protected _fs: DataLayerFsApi = null

  constructor(readonly filePath: string, readonly writeAccess?: boolean) {}

  get fs(): DataLayerPromiseSingleFileApi {
    return new Proxy(this as any, {
      get:
        (target, propKey, receiver) => {
          return (...args) => {
            return this._fs.promises[propKey.toString()].apply(this, [this.filePath, args])
          }
        }
    })
  }


  [dependencyFsInjector] = (fs: DataLayerFsApi) => {
    this._fs = fs
  }
}

export class FileScope<T, K extends { [key: string]: Dependency }> {
  protected options: FileScopeOptions = DEFAULT_SCOPE_OPTIONS

  constructor(
    readonly workingDir: string,
    readonly dependeciesMap: K,
    options?: Partial<FileScopeOptions>,
  ) {
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
   * Factory
   */
  static writeAccess(filePath: string): Dependency {
    return new Dependency(
      filePath,
      true,
    )
  }

  static readAccess(filePath: string) {
    return new Dependency(
      filePath,
      false,
    )
  }

  /**
   * Open scope with dependecies
   */
  async open(
    handler: (fs: DataLayerFsApi, dependecies: K) => Promise<T>,
  ): Promise<T> {
    const dependecies: Dependency[] = Object.keys(this.dependeciesMap)
      .reduce<Dependency[]>((acc, key) => [
        ...acc,
        this.dependeciesMap[key],
      ], [])

    const fsLayer = new FsDataLayer(this.workingDir, dependecies.filter(key => key.writeAccess).map(key => key.filePath))

    // inject fs to dependecies
    dependecies.forEach(dependency => dependency[dependencyFsInjector](fsLayer.fs))

    // lock access to group
    return FileScope.lockScope(
      dependecies.map(key => ({ key: key.filePath, singleAccess: key.writeAccess })),
      this.dependeciesMap,
      async () => {
        // do the stuff in scope
        let result
        try {
          result = await handler(fsLayer.fs, this.dependeciesMap)
        } catch (e) {
          if (this.options.commitIfFail) {
            await fsLayer.commit()
          }
          throw e
        }
        await fsLayer.commit()
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