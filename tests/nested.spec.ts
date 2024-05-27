import { assert } from 'chai'
import { FileScope, Dependency } from '../dist'
import { delay } from './utils'
import * as systemFs from 'fs'

/**
 * Simple locks test
 */
describe('Nested scopes tests', function() {
  it('Single access scope nested', async function() {
    let accumulator = ''
    await Promise.all([
      FileScope.prepare('./temp').open({
        a: Dependency.writeFileAccess('/dir/dirB/file1.txt'),
      }, async (fs, dependecies) => {
        accumulator += 'C:IN;'
        await delay(100)
        accumulator += 'C:OUT;'
      }),
      FileScope.prepare('./temp').open({
        a: Dependency.readFileAccess('/dir/dirB/file1.txt'),
      }, async (dependecies) => {
        accumulator += 'A:IN;'
        await delay(10)
        await FileScope.prepare('./temp').open({
          a: Dependency.writeFileAccess('/dir/dirB/file1.txt'),
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


  it('Parenal scopes', async function() {

    const scope = FileScope.prepare('./temp')
    await scope.open({
      file: Dependency.writeFileAccess('/test/file.txt'),
    }, async (fs, dependecies) => {
      await dependecies.file.fs.writeFile('Hello world')
      try {
        systemFs.readFileSync('./temp/test/file.txt').toString()
        assert(true, "File is on disk before it's flushed")
      } catch(e) {}

      await scope.open({
        file: Dependency.writeFileAccess('/test/file.txt'),
      }, async (fs, dependecies) => {
        const content = (await dependecies.file.fs.readFile()).toString()
        assert(content === 'Hello world', "File contnet should be content from parent scope")
        await dependecies.file.fs.writeFile('Hello world 2 from nested scope')
      })

      const content = (await dependecies.file.fs.readFile()).toString()
      assert(content === 'Hello world 2 from nested scope', "File contnet should be content from nested scope")

      try {
        systemFs.readFileSync('./temp/test/file.txt').toString()
        assert(true, "File is on disk before it's flushed")
      } catch(e) {}
    })

    const content = systemFs.readFileSync('./temp/test/file.txt').toString()
    assert(content === 'Hello world 2 from nested scope', 'File should be written on disk')
  })
})
