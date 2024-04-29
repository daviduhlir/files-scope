import { Dependency } from './Dependency'
import { SharedMutex } from '@david.uhlir/mutex'
import { findLowestCommonPath } from './utils'

export class Scope {
  /**
   * Open scope with dependecies
   */
  static async open<T, K extends {[key: string]: Dependency}>(dependeciesMap: K, handler: ((dependecies: K) => Promise<T>), maxLockingTime?: number,): Promise<T> {
    // make dependecies array to easy work with
    const dependecies = Object.keys(dependeciesMap).reduce<Dependency[]>((acc, key) => [...acc, dependeciesMap[key]],[])

    // resolve keys
    const allKeys = await Promise.all(dependecies.map(d => d.getKey()))
    const lowestKey = findLowestCommonPath(allKeys)
    const singleAccess = (await Promise.all(dependecies.map(d => d.isSingleAccess()))).some(single => !!single)

    // lock access to group
    return SharedMutex.lockAccess(lowestKey, async () => {
      // open dependecies
      await Promise.all(dependecies.map(d => d.initialize()))

      // do the stuff in scope
      let result
      try {
        result = await handler(dependeciesMap)
      } catch(e) {
        // finish dependecies
        await Promise.all(dependecies.map(d => d.finish()))
        throw e
      }

      // finish dependecies
      await Promise.all(dependecies.map(d => d.finish()))
      return result
    }, singleAccess, maxLockingTime)
  }
}
