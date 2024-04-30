export function parsePath(path: string): string[] {
  return path.split('/')
}

export function allEqual(arr) {
  return arr.every(val => val === arr[0])
}
