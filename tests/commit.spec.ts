import { assert } from 'chai'
import { FileScope } from '../dist'
import fs from 'fs'

/**
 * Commit tests
 */
describe('Commit scope tests', function() {
  before(function () {
    fs.rmSync('./temp', { recursive: true })
  })

  it('Real write', async function() {
    await FileScope.prepare('./temp', {
      a: FileScope.writeAccess('/dir/file.txt'),
    }).open(async (fs, dependecies) => {
      await dependecies.a.fs.writeFile('Hello')
    })

    const content = fs.readFileSync('./temp//dir/file.txt').toString()
    assert(content === 'Hello', 'File content should be written on disk')
  })

  it('Real read', async function() {
    let content
    await FileScope.prepare('./temp', {
      a: FileScope.readAccess('/dir/file.txt'),
    }).open(async (fs, dependecies) => {
      content = (await dependecies.a.fs.readFile()).toString()
    })

    assert(content === 'Hello', 'File content should be readable from disk')
  })
})
