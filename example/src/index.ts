import { Scope } from '@david.uhlir/files-scope'
import { SharedMutex } from '@david.uhlir/mutex'

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
    SharedMutex.lockSingleAccess('ROOT', async () => {
      console.log('Open scope C')
      await delay(100)
      console.log('Close scope C')
    }),

    Scope.open('ROOT', {
      a: Scope.writeAccess('dir/dirA/file1.txt'),
      b: Scope.writeAccess('dir/dirA/file2.txt'),
    }, async (dependecies) => {
      console.log('Open scope A')
      await dependecies.a.read()
      await delay(100)
      console.log('Close scope A')
    }),

    Scope.open('ROOT', {
      a: Scope.readAccess('dir/dirB/file1.txt'),
      b: Scope.readAccess('dir/dirB/file2.txt'),
    }, async (dependecies) => {
      console.log('Open scope B')
      await delay(100)
      console.log('Close scope B')
    }),

    Scope.open('ROOT', {
      a: Scope.writeAccess('dir/dirB/file1.txt'),
    }, async (dependecies) => {
      console.log('Open scope D')
      await delay(100)
      console.log('Close scope D')
    }),

    Scope.open('ROOT', {
      a: Scope.writeAccess('dir/dirB/file1.txt'),
    }, async (dependecies) => {
      console.log('Open scope D')
      await delay(100)
      console.log('Close scope D')
    }),
  ])

  console.log('Finished')

})()