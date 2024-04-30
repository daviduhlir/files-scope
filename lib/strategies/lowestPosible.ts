import { MutexKeyItem } from '../interfaces'
import { allEqual } from '../utils'

/**
 * Strategy, that finds lowest posible path, single access will be true in case, when any of items is single access only
 */
export const lowestPosible = () =>
  function (mutexPrefix: string, items: MutexKeyItem[]): MutexKeyItem[] {
    const output: MutexKeyItem = { key: [], singleAccess: false }
    const maxIterations = items.reduce((acc, i) => Math.min(acc, i.key.length), Infinity)
    for (let i = 0; i < maxIterations; i++) {
      if (allEqual(items.map(item => item.key[i]))) {
        output.key.push(items[0].key[i])
        if (!output.singleAccess && items.some(item => item.singleAccess)) {
          output.singleAccess = true
        }
      } else {
        break
      }
    }
    return [
      {
        ...output,
        key: [mutexPrefix, ...output.key],
      },
    ]
  }
