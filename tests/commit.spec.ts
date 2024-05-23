import { assert } from 'chai'
import { FileScope, Dependency } from '../dist'
import fs from 'fs'

/**
 * Commit tests
 */
describe('Commit scope tests', function() {
  before(function () {
    fs.rmSync('./temp', { recursive: true })
  })

  it('Create file', async function() {
    await FileScope.prepare('./temp', {
      a: Dependency.writeFileAccess('/dir/file.txt'),
    }).open(async (fs, dependecies) => {
      await dependecies.a.fs.writeFile('Hello')
    })

    const content = fs.readFileSync('./temp/dir/file.txt').toString()
    assert(content === 'Hello', 'File content should be written on disk')
  })

  it('Read create file', async function() {
    let content
    await FileScope.prepare('./temp', {
      a: Dependency.readFileAccess('/dir/file.txt'),
    }).open(async (fs, dependecies) => {
      content = (await dependecies.a.fs.readFile()).toString()
    })

    assert(content === 'Hello', 'File content should be readable from disk')
  })

  it('Unlink created file', async function() {
    await FileScope.prepare('./temp', {
      a: Dependency.writeFileAccess('/dir/file.txt'),
    }).open(async (fs, dependecies) => {
      await dependecies.a.fs.unlink()
    })

    let stat
    let error
    try {
      stat = fs.statSync('./temp/dir/file.txt')
    } catch(e) {
      error = e
    }

    assert(!stat && error.message === "ENOENT: no such file or directory, stat './temp/dir/file.txt'", 'File should be removed on disk')
  })

  it('Created folder', async function() {
    await FileScope.prepare('./temp', {
      root: Dependency.writeFolderAccess('/dir'),
    }).open(async (fs, dependecies) => {
      await fs.promises.mkdir('/dir/abcd', { recursive: true })
    })

    let stat
    let error
    try {
      stat = fs.statSync('./temp/dir/abcd')
    } catch(e) {
      error = e
    }

    assert(stat.isDirectory(), 'Directory should exists on disk')
  })

  it('Created folder using folder api', async function() {
    await FileScope.prepare('./temp', {
      root: Dependency.writeFolderAccess('/dir'),
    }).open(async (fs, dependecies) => {
      await dependecies.root.fs.mkdir('/efgh', { recursive: true })
    })

    let stat
    let error
    try {
      stat = fs.statSync('./temp/dir/efgh')
    } catch(e) {
      error = e
    }

    assert(stat.isDirectory(), 'Directory should exists on disk')
  })

  it('Reject flush on exception', async function() {
    let thrownError
    try {
      await FileScope.prepare('./temp', {
        a: Dependency.writeFileAccess('/dir/file.txt'),
      }).open(async (fs, dependecies) => {
        await dependecies.a.fs.writeFile('Hello')
        throw new Error('Test')
      })
    } catch(e) {
      thrownError = e
    }

    let content
    let error
    try {
      content = fs.readFileSync('./temp/dir/file.txt').toString()
    } catch(e) {
      error = e
    }

    assert(thrownError.message === 'Test' && error.message === "ENOENT: no such file or directory, open './temp/dir/file.txt'", 'File content should not be written on disk')
  })
})
