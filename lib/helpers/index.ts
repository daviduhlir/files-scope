import * as path from 'path'

export function makeRelativePath(inputPath: string) {
  return inputPath.startsWith('/') ? `.${inputPath}` : inputPath
}

export function makeAbsolutePath(inputPath: string) {
  return inputPath.startsWith('./') ? `${inputPath.substring(1)}` : inputPath.startsWith('/') ? inputPath : `/${inputPath}`
}

export function createSubpath(parentPath: string, subpath: string) {
  return path.resolve(parentPath, makeRelativePath(subpath))
}

export function isSubpath(testedPath: string, startsWith: string) {
  const testedPathParts = testedPath.split('/').filter(Boolean)
  const startsWithParts = startsWith.split('/').filter(Boolean)

  if (testedPathParts.length < startsWithParts.length) {
    return false
  }

  for (let i = 0; i < startsWithParts.length; i++) {
    if (testedPathParts[i] !== startsWithParts[i]) {
      return false
    }
  }
  return true
}

export function randomHash(): string {
  return [...Array(10)]
    .map(x => 0)
    .map(() => Math.random().toString(36).slice(2))
    .join('')
}

export function concatMutexKey(...parts: string[]) {
  return parts
    .map(part => {
      let wPart = part.trim()
      if (wPart.startsWith('./')) {
        wPart = wPart.substring(2)
      } else if (wPart.startsWith('/')) {
        wPart = wPart.substring(1)
      }
      if (wPart.endsWith('/')) {
        wPart = wPart.substring(0, wPart.length - 1)
      }
      return wPart
    })
    .filter(Boolean)
    .join('/')
}
