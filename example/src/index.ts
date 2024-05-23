import { Dependency, FileScope } from '@david.uhlir/files-scope';

const main = async () => {
  await new FileScope('./temp').open({
    testFile: Dependency.readFileAccess('/main/test.txt')
  }, async (fs, dependecies) => {
    await dependecies.testFile.fs.writeFile('hello world')
  })
}
main();
