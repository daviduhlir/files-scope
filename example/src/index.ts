import { Dependency, FileScope } from '@david.uhlir/files-scope';

const main = async () => {
  await new FileScope('./temp', {
    testFile: Dependency.readFileAccess('/main/test.txt')
  }).open(async (fs, dependecies) => {
    await dependecies.testFile.fs.writeFile('hello world')
  })
}
main();
