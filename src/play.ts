import { $root } from '@maverick-js/observables'


export function read($o: Observable) {
  return $o()
}


export function write($o: Observable, fn: any) {
  $o.next(prev => fn(prev) && prev)
}


export function owrite<A>($o: Observable, fn: (_: A) => any) {

  if (typeof fn === 'function') {
    $o.next((prev) => fn(prev))
  } else {
    $o.set(fn)
  }
}
