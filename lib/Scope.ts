import { SharedMutex } from '@david.uhlir/mutex'
import { Dependency } from './Dependency'
import { MutexKeyItem, getAllMutexKeyItems } from './utils'
import { FsDependency } from './FsDependency'

export class Scope {
  /**
   * Factory
   */
  static writeAccess(filePath: string, basePath: string = './') {
    return FsDependency.access(filePath, true, basePath)
  }

  static readAccess(filePath: string, basePath: string = './') {
    return FsDependency.access(filePath, false, basePath)
  }

  /**
   * Open scope with dependecies
   */
  static async open<T, K extends { [key: string]: Dependency }>(
    mutexPrefix: string,
    dependeciesMap: K,
    handler: (dependecies: K) => Promise<T>,
    maxLockingTime?: number,
  ): Promise<T> {
    if (!mutexPrefix.length) {
      throw new Error('Mutex prefix key must be at least 1 character')
    }

    // make dependecies array to easy work with
    const dependecies = Object.keys(dependeciesMap).reduce<Dependency[]>((acc, key) => [...acc, dependeciesMap[key]], [])

    // resolve keys
    const allKeys = []
    for (const dependency of dependecies) {
      allKeys.push([await dependency.getKey(), await dependency.isSingleAccess()])
    }

    const mutexKeys: MutexKeyItem[] = allKeys.length ? getAllMutexKeyItems(mutexPrefix, allKeys) : [{ key: [mutexPrefix], singleAccess: true }]

    // lock access to group
    return Scope.lockScope(
      mutexKeys,
      dependeciesMap,
      async () => {
        // open dependecies
        await Promise.all(dependecies.map(d => d.initialize()))

        // do the stuff in scope
        let result
        try {
          result = await handler(dependeciesMap)
        } catch (e) {
          // finish dependecies
          await Promise.all(dependecies.map(d => d.finish()))
          throw e
        }

        // finish dependecies
        await Promise.all(dependecies.map(d => d.finish()))
        return result
      },
      maxLockingTime,
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
    handler: (dependecies: K) => Promise<T>,
    maxLockingTime?: number,
  ) {
    const m = mutexes.pop()
    return SharedMutex.lockAccess(
      m.key,
      async () => {
        if (mutexes.length) {
          return this.lockScope(mutexes, dependeciesMap, handler, maxLockingTime)
        }
        return handler(dependeciesMap)
      },
      m.singleAccess,
      maxLockingTime,
    )
  }
}
