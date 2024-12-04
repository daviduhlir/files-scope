import { assert } from 'chai'
import { FileScope, Dependency } from '../dist'
import { delay } from './utils'
import { promises as systemFs } from 'fs'

/**
 * Simple scopes locks test
 */
describe('Basic scope tests', function() {
  it('Single access', async function() {
    let failed = false
    let open = false
    await Promise.all([
      FileScope.prepare('./temp').open({
        a: Dependency.readFileAccess('/dir/dirB/file1.txt'),
        b: Dependency.readFileAccess('/dir/dirB/file2.txt'),
      }, async (fs, dependecies) => {
        if (open) {
          failed = true
        }
        open = true
        await delay(100)
        open = false
      }),
      FileScope.prepare('./temp').open({
        a: Dependency.writeFileAccess('/dir/dirB/file1.txt'),
      } ,async (fs, dependecies) => {
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
      FileScope.prepare('./temp').open({
        a: Dependency.readFileAccess('/dir/dirB/file1.txt'),
        b: Dependency.readFileAccess('/dir/dirB/file2.txt'),
      }, async (fs, dependecies) => {
        accumulator += 'A:IN;'
        await delay(100)
        accumulator += 'A:OUT;'
      }),
      FileScope.prepare('./temp').open({
        a: Dependency.readFileAccess('/dir/dirB/file1.txt'),
      }, async (fs, dependecies) => {
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
            await FileScope.prepare('./temp').open({
              a: Dependency.writeFileAccess('/dir/dirB/file1.txt'),
            }, async (dependecies) => {
              accumulator += 'A:IN;'
              throw new Error('TEST')
            })
          } catch(e) {}
        })(),
        FileScope.prepare('./temp').open({
          a: Dependency.writeFileAccess('/dir/dirB/file1.txt'),
        }, async (fs, dependecies) => {
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
      await FileScope.prepare('./temp').open({
        a: Dependency.readFileAccess('/dir/dirB/file1.txt'),
      }, async (fs, dependecies) => {
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
      FileScope.prepare('./temp').open({
        a: Dependency.readFileAccess('/dir/dirA/file1.txt'),
        b: Dependency.readFileAccess('/dir/dirA/file2.txt'),
      }, async (fs, dependecies) => {
        if (open) {
          failed = true
        }
        open = true
        await delay(100)
        open = false
      }),
      FileScope.prepare('./temp').open({
        a: Dependency.writeFileAccess('/dir'),
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

  it('Real write', async function() {
    await FileScope.prepare('./temp').open({
      a: Dependency.writeFileAccess('/dir/file.txt'),
    }, async (fs, dependecies) => {
      await dependecies.a.fs.writeFile('Hello')
    })
  })

  it('Open multiple times', async function() {
    const scope = FileScope.prepare('./temp')

    await scope.open({
      a: Dependency.writeFileAccess('/dir/file.txt'),
    }, async (fs, dependecies) => {
      await dependecies.a.fs.writeFile('Hello')
    })

    await scope.open({
      a: Dependency.writeFileAccess('/dir/file.txt'),
    }, async (fs, dependecies) => {
      await dependecies.a.fs.writeFile('Hello')
    })

  })

  it('Real write buffer', async function() {
    let sizeBefore = 0
    await FileScope.prepare('./tests').open({
      root: Dependency.writeFileAccess('/'),
    }, async (fs, dependecies) => {
      const content = await fs.promises.readFile('/assets/archive')
      sizeBefore = content.byteLength
      await fs.promises.writeFile('/temp/archive', content)
    })

    const stat = await systemFs.stat('./tests/temp/archive')
    assert(sizeBefore === stat.size, 'Size have to be same')
  })

  it('Remove folder', async function() {
    let exists = false
    try {
      await systemFs.mkdir('./tests/temp/dirToRm')
    } catch(e) {}

    try {
      await systemFs.copyFile('./tests/assets/lorem.txt', './tests/temp/dirToRm/lorem.txt')
    } catch(e) {}

    exists = false
    try {
      const stat = await systemFs.stat('./tests/temp/dirToRm')
      exists = stat.isDirectory()
    } catch(e) {}
    if (!exists) {
      throw new Error('Can not create folder for remove folder tests')
    }

    await FileScope.prepare('./tests/temp').open({
      dirToRm: Dependency.writeFolderAccess('/dirToRm'),
    }, async (fs, dependecies) => {
      await dependecies.dirToRm.fs.rm('/', { recursive: true })
    })

    exists = false
    try {
      const stat = await systemFs.stat('./tests/temp/dirToRm')
      exists = stat.isDirectory()
    } catch(e) {}

    assert(exists === false, 'Folder should not exists')
  })

  it('Nested write with access', async function() {
    const scope = FileScope.prepare('./temp')
    await scope.open({
      a: Dependency.writeFileAccess('/dir-nested-A'),
    }, async (fs, dependecies) => {

      await scope.open({
        a: Dependency.writeFileAccess('/dir-nested'),
      }, async (fs, dependecies) => {
        await dependecies.a.fs.writeFile('Hello')
      })

    })
  })
})
