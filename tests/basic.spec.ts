import { assert } from 'chai'
import { FileScope, Dependency } from '../dist'
import { delay } from './utils'

/**
 * Simple scopes locks test
 */
describe('Basic scope tests', function() {
  it('Single access', async function() {
    let failed = false
    let open = false
    await Promise.all([
      FileScope.prepare('./temp', {
        a: Dependency.readFileAccess('/dir/dirB/file1.txt'),
        b: Dependency.readFileAccess('/dir/dirB/file2.txt'),
      }).open(async (fs, dependecies) => {
        if (open) {
          failed = true
        }
        open = true
        await delay(100)
        open = false
      }),
      FileScope.prepare('./temp', {
        a: Dependency.writeFileAccess('/dir/dirB/file1.txt'),
      }).open(async (fs, dependecies) => {
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
      FileScope.prepare('./temp', {
        a: Dependency.readFileAccess('/dir/dirB/file1.txt'),
        b: Dependency.readFileAccess('/dir/dirB/file2.txt'),
      }).open(async (fs, dependecies) => {
        accumulator += 'A:IN;'
        await delay(100)
        accumulator += 'A:OUT;'
      }),
      FileScope.prepare('./temp', {
        a: Dependency.readFileAccess('/dir/dirB/file1.txt'),
      }).open(async (fs, dependecies) => {
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
            await FileScope.prepare('./temp', {
              a: Dependency.writeFileAccess('/dir/dirB/file1.txt'),
            }).open(async (dependecies) => {
              accumulator += 'A:IN;'
              throw new Error('TEST')
            })
          } catch(e) {}
        })(),
        FileScope.prepare('./temp', {
          a: Dependency.writeFileAccess('/dir/dirB/file1.txt'),
        }).open(async (fs, dependecies) => {
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
      await FileScope.prepare('./temp', {
        a: Dependency.readFileAccess('/dir/dirB/file1.txt'),
      }).open(async (fs, dependecies) => {
        await dependecies.a.fs.writeFile('Hello')
      })
    } catch(e) {
      accumulator += e.message
    }

    assert(accumulator === 'Write to path /dir/dirB/file1.txt is not allowed in layer.', 'Read accessed file should not have allowed write files')
  })

  it('Blocking whole folder', async function() {
    let failed = false
    let open = false
    await Promise.all([
      FileScope.prepare('./temp', {
        a: Dependency.readFileAccess('/dir/dirA/file1.txt'),
        b: Dependency.readFileAccess('/dir/dirA/file2.txt'),
      }).open(async (fs, dependecies) => {
        if (open) {
          failed = true
        }
        open = true
        await delay(100)
        open = false
      }),
      FileScope.prepare('./temp', {
        a: Dependency.writeFileAccess('/dir'),
      }).open(async (dependecies) => {
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

  it('Real write', async function() {
    await FileScope.prepare('./temp', {
      a: Dependency.writeFileAccess('/dir/file.txt'),
    }).open(async (fs, dependecies) => {
      await dependecies.a.fs.writeFile('Hello')
    })
  })
})
