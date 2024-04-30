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

  it('Multi access', async function() {
    let accumulator = ''
    await Promise.all([
      Scope.open('ROOT', {
        a: Scope.readAccess('dir/dirB/file1.txt'),
        b: Scope.readAccess('dir/dirB/file2.txt'),
      }, async (dependecies) => {
        accumulator += 'A:IN;'
        await delay(100)
        accumulator += 'A:OUT;'
      }),
      Scope.open('ROOT', {
        a: Scope.readAccess('dir/dirB/file1.txt'),
      }, async (dependecies) => {
        accumulator += 'B:IN;'
        await delay(100)
        accumulator += 'B:OUT;'
      }),
    ])

    assert(accumulator === 'B:IN;A:IN;B:OUT;A:OUT;', 'Multi access scope can be accessed together')
  })

  it('Throw error unlock scope', async function() {
    let accumulator = ''
      await Promise.all([
        (async () => {
          try {
            await Scope.open('ROOT', {
              a: Scope.writeAccess('dir/dirB/file1.txt'),
            }, async (dependecies) => {
              accumulator += 'A:IN;'
              throw new Error('TEST')
            })
          } catch(e) {}
        })(),
        Scope.open('ROOT', {
          a: Scope.writeAccess('dir/dirB/file1.txt'),
        }, async (dependecies) => {
          accumulator += 'B:IN;'
          await delay(100)
          accumulator += 'B:OUT;'
        }),
      ])

    assert(accumulator === 'A:IN;B:IN;B:OUT;', 'Uncaught exception should unlock scope')
  })

  it('Read access write protection', async function() {
    let accumulator = ''
    try {
      await Scope.open('ROOT', {
        a: Scope.readAccess('dir/dirB/file1.txt'),
      }, async (dependecies) => {
        await dependecies.a.write('Hello')
      })
    } catch(e) {
      accumulator += e.message
    }

    assert(accumulator === 'Write to read access only file in scope is not allowed', 'Read accessed file should not have allowed write files')
  })

  it('Blocking whole folder', async function() {
    let failed = false
    let open = false
    await Promise.all([
      Scope.open('ROOT', {
        a: Scope.readAccess('dir/dirA/file1.txt'),
        b: Scope.readAccess('dir/dirA/file2.txt'),
      }, async (dependecies) => {
        if (open) {
          failed = true
        }
        open = true
        await delay(100)
        open = false
      }),
      Scope.open('ROOT', {
        a: Scope.writeAccess('dir'),
      }, async (dependecies) => {
        if (open) {
          failed = true
        }
        open = true
        await delay(100)
        open = false
      }),
    ])

    assert(!failed, 'Blocking part of path should ends with blocking of scope')
  })
})
