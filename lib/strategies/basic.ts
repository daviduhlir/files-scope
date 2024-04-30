import { MutexKeyItem } from '../interfaces'
import { allEqual } from '../utils'

/**
 * Simpliest opsible strategy, will keep all keys same
 */
export const keepSame = () =>
  function (mutexPrefix: string, items: MutexKeyItem[]): MutexKeyItem[] {
    return items.map(item => ({
      key: [mutexPrefix, ...item.key],
      singleAccess: item.singleAccess,
    }))
  }
