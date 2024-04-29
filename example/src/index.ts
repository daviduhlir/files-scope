import { Scope, FileDependency } from '@david.uhlir/files-scope'

;(async function() {

  await Scope.open({
    example: FileDependency.prepare('files/example.txt')
  }, async (map) => {
    const content = await map.example.read()
    console.log(content.toString())
  })

})()