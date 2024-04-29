export function parsePath(path: string): string[] {
  return path.split('/')
}

export function allEqual(arr) {
  return arr.every(val => val === arr[0])
}

export type MutexKeyItem = {key: string[]; singleAccess: boolean}

export function getAllMutexKeyItems(mutexPrefix: string, keys: [string, boolean][]): MutexKeyItem[] {
  const sorted: {[startKey: string]: MutexKeyItem[]} = {}

  for(const key of keys) {
    const path = parsePath(key[0])
    if (!sorted[path[0]]) {
      sorted[path[0]] = []
    }
    sorted[path[0]].push({key: path, singleAccess: key[1]})
  }

  const output: MutexKeyItem[] = []
  for(const startKey in sorted) {
    const keys = sorted[startKey]

    const commonPath: string[] = []
    const maxIterations = keys.reduce((acc, i) => Math.min(acc,i.key.length), Infinity)
    for(let i = 0; i < maxIterations; i++) {
      if (allEqual(keys.map(path => path.key[i]))) {
        commonPath.push(keys[0].key[i])
      } else {
        break
      }
    }

    output.push({
      key: [mutexPrefix, ...commonPath],
      singleAccess: keys.some(k => k.singleAccess),
    })
  }

  return output
}
