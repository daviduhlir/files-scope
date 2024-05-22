import { FileScope } from '@david.uhlir/files-scope';

const main = async () => {
  await new FileScope('./temp', {
    testFile: FileScope.writeAccess('/main/test.txt')
  }).open(async (fs, dependecies) => {
    await dependecies.testFile.fs.writeFile('hello world')
    // await fs.promises.writeFile(dependecies.testFile.filePath, 'Hello world')
  })
}
main();
