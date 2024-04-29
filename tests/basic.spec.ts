import { assert } from 'chai'
import { Scope } from '../dist'
import { delay, flatten } from './utils'
import { SharedMutex } from '@david.uhlir/mutex'

/**
 * Simple locks test
 */
describe('Basic scope tests', function() {
  it('Single access', async function() {
    let failed = false
    let open = false
    await Promise.all([
      Scope.open('ROOT', {
        a: Scope.readAccess('dir/dirB/file1.txt'),
        b: Scope.readAccess('dir/dirB/file2.txt'),
      }, async (dependecies) => {
        if (open) {
          failed = true
        }
        open = true
        await delay(100)
        open = false
      }),
      Scope.open('ROOT', {
        a: Scope.writeAccess('dir/dirB/file1.txt'),
      }, async (dependecies) => {
        if (open) {
          failed = true
        }
        open = true
        await delay(100)
        open = false
      }),
    ])

    assert(!failed, 'Single scope can be accessed in same time')
  })
})
