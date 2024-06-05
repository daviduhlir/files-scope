import assert from 'assert'
import { FileScope, Dependency } from '../dist'
import { promises as systemFs } from 'fs'

const allocArray = new Array(1000).map(() => 0)
const testBuffer = Buffer.from(allocArray)

/**
 * Simple locks test
 */
describe('Streams tests', function() {
  it('Read stream', async function() {
    const result: string = await FileScope.prepare('./tests/assets').open({
      lorem: Dependency.readFileAccess('/lorem.txt'),
    }, async (fs, dependecies) => {
      const reader = await dependecies.lorem.fs.createReadStream()

      return new Promise((resolve) => {
        let accumulator = ''
        reader.on('data', (chunk) => accumulator += chunk.toString())
        reader.on('end', () => resolve(accumulator))
      })
    })

    assert(result.length === 29929, 'Result from readstream should contains 29929 chars.')
  })

  it('Write stream', async function() {

    await FileScope.prepare('./temp').open({
      lorem: Dependency.writeFileAccess('/buffer.txt'),
    }, async (fs, dependecies) => {
      const writer = await dependecies.lorem.fs.createWriteStream()
      await new Promise((resolve, reject) => {
        writer.write(testBuffer, (err) => {
          if (err) {
            reject(err)
          }
          resolve(0)
        })
      })
      writer.close()
    })

    const result = await systemFs.readFile('./temp/buffer.txt', 'utf-8')
    assert(result.length === 1000, 'Result from writestream should contains 1000 chars.')
  })
})
