import * as events from 'node:events'

/**
 * @upstash/redis expects `EventTarget` on `globalThis` at module load time.
 * Workflow sandboxes (vm contexts) often omit web globals — install Node's
 * implementation before any `@upstash/redis` import is evaluated.
 *
 * `EventTarget` exists on `node:events` from Node 15.4+; `@types/node` may omit
 * the export, so we read it from the namespace object.
 */
const NodeEventTarget = (events as typeof events & { EventTarget: typeof EventTarget })
  .EventTarget

if (typeof globalThis.EventTarget === 'undefined' && typeof NodeEventTarget === 'function') {
  globalThis.EventTarget = NodeEventTarget
}
