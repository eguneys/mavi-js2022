import { $observable, $computed, $effect } from '@maverick-js/observables'
import { read, write, owrite } from './play'

export function make_position(x, y) {
  let _x = $observable(x)
  let _y = $observable(y)

  let m_vs = $computed(() => Vec2.make(read(_x), read(_y)))

  return {
    get point() { return m_p() },
    get x() { return read(_x) },
    set x(v: number) { owrite(_x, v) },
    get y() { return read(_y) },
    set y(v: number) { owrite(_y, v) },
    lerp(x: number, y: number, t: number = 0.5) {
      owrite(_x, _ => rlerp(_, x, ease(t)))
      owrite(_y, _ => rlerp(_, y, ease(t)))
    },
    lerp_vs(vs: Vec2, t: number = 0.5) { 
      owrite(_x, _ => rlerp(_, vs.x, ease(t))) 
      owrite(_y, _ => rlerp(_, vs.y, ease(t)))
    },
    get vs() { return m_vs() },
    get clone() {
      return make_position(read(_x), read(_y))
    }
  }
}

