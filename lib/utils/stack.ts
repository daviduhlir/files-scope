import { SharedMutexSynchronizer } from '@david.uhlir/mutex'

export function getStack() {
  if (!SharedMutexSynchronizer.debugWithStack) {
    return null
  }

  const o: { stack: string } = { stack: null }
  Error.captureStackTrace(o)
  return o.stack
    .split('\n')
    .slice(2)
    .map(i => i.trim())
    .join('\n')
}
