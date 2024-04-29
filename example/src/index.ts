import { Scope, FileDependency } from '@david.uhlir/files-scope'

export function delay<T = any>(time: number, call?: () => Promise<T>): Promise<T> {
  return new Promise(resolve => setTimeout(async () => {
    if (call) {
      resolve(await call())
      return
    }
    resolve(undefined as T)
  }, time))
}

;(async function() {

  await Promise.all([
    Scope.open('file', {
      example: FileDependency.prepare('files/example.txt'),
      a: FileDependency.prepare('a/dir/subdir/file.txt', true),
      b: FileDependency.prepare('a/dir/file.txt'),
    }, async (map) => {
      console.log('Open scope A')
      await map.example.read()
      await delay(100)
      console.log('Close scope A')
    }),
    Scope.open('file', {
      example: FileDependency.prepare('files/example.txt'),
      a: FileDependency.prepare('a/dir/file.txt'),
    }, async (map) => {
      console.log('Open scope B')
      await delay(100)
      console.log('Close scope B')
    })
  ])

  console.log('Finished')

})()