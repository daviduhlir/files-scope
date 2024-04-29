export function parsePath(path: string): string[] {
  return path.split('/')
}

export function allEqual(arr) {
  return arr.every(val => val === arr[0])
}

export function findLowestCommonPath(paths: string[]): string[] {
  const common: string[] = []
  const pathsParsed = paths.map(path => parsePath(path))
  const maxItterations = pathsParsed.reduce((acc, i) => Math.min(acc,i.length), Infinity)
  for(let i = 0; i < maxItterations; i++) {
    if (allEqual(pathsParsed.map(path => path[i]))) {
      common.push(pathsParsed[0][i])
    } else {
      break
    }
  }
  return common
}