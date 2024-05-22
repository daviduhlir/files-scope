import { assert } from 'chai'
import { FileScope } from '../dist'
import { delay } from './utils'

/**
 * Simple locks test
 */
describe('Nested scopes tests', function() {
  it('Single access scope nested', async function() {
    let accumulator = ''
    await Promise.all([
      FileScope.prepare('./temp', {
        a: FileScope.writeAccess('dir/dirB/file1.txt'),
      }).open(async (fs, dependecies) => {
        accumulator += 'C:IN;'
        await delay(100)
        accumulator += 'C:OUT;'
      }),
      FileScope.prepare('./temp', {
        a: FileScope.readAccess('dir/dirB/file1.txt'),
      }).open(async (dependecies) => {
        accumulator += 'A:IN;'
        await delay(10)
        await FileScope.prepare('./temp', {
          a: FileScope.writeAccess('dir/dirB/file1.txt'),
        }).open(async (dependecies) => {
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
