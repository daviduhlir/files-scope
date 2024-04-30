import { assert } from 'chai'
import { Scope } from '../dist'
import { delay, flatten } from './utils'
import { SharedMutex } from '@david.uhlir/mutex'

/**
 * Simple locks test
 */
describe('Nested scopes tests', function() {
  it('Single access scope nested', async function() {
    let accumulator = ''
    await Promise.all([
      Scope.open('ROOT', {
        a: Scope.writeAccess('dir/dirB/file1.txt'),
      }, async (dependecies) => {
        accumulator += 'C:IN;'
        await delay(100)
        accumulator += 'C:OUT;'
      }),
      Scope.open('ROOT', {
        a: Scope.readAccess('dir/dirB/file1.txt'),
      }, async (dependecies) => {
        accumulator += 'A:IN;'
        await delay(10)
        await Scope.open('ROOT', {
          a: Scope.writeAccess('dir/dirB/file1.txt'),
        }, async (dependecies) => {
          accumulator += 'B:IN;'
          await delay(100)
          accumulator += 'B:OUT;'
        }),
        accumulator += 'A:OUT;'
      }),
    ])

    assert(accumulator === 'C:IN;C:OUT;A:IN;B:IN;B:OUT;A:OUT;', 'Single access scope can be accessed only one in same time')
  })
})
