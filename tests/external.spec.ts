import { assert } from 'chai'
import { Dependency, FileScope } from '../dist'
import * as path from 'path'

/**
 * Simple locks test
 */
describe('External paths', function() {
  it('Read from external path', async function() {
    let content

    await FileScope.prepare('./temp').open({
      external: Dependency.readExternalAccess(path.resolve('./'))
    }, async (fs, dependecies) => {
      content = JSON.parse(await fs.promises.readFile(path.resolve('./', 'package.json'), 'utf-8'))
    })

    assert(content.name === '@david.uhlir/files-scope', 'Name of package from external path should be readed')

  })
})
