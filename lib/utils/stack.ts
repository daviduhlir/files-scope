import { SharedMutexSynchronizer } from '@david.uhlir/mutex'

export function getStackFrom() {
  if (!SharedMutexSynchronizer.debugWithStack) {
    return null
  }

  const e = new Error()
  return e.stack
}
