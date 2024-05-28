import { assert } from 'chai'
import { FileScope } from '../dist'
import * as path from 'path'

/**
 * Simple locks test
 */
describe('External paths', function() {
  it('Read from external path', async function() {
    const absolutePath = path.resolve('./')
    let content

    await FileScope.prepare('./temp').open({}, async (fs, dependecies) => {
      fs.addExternalPath(absolutePath)
      content = JSON.parse(await fs.promises.readFile(path.resolve(absolutePath, 'package.json'), 'utf-8'))
    })

    assert(content.name === '@david.uhlir/files-scope', 'Name of package from external path should be readed')

  })
})
