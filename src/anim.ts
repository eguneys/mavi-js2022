export function read(t: Tween) {
  return t[0]()
}

export function update(t: Tween, dt: number, dt0: number) {
  return t[1](dt, dt0)
}


export function tween(values: Array<number>, durations: Array<number>) {

  let _value = values[0],
  _completed = false

  function _read_value() {
    return [_value, _completed]
  }

  let _i = 0
  let _t = 0
  function _update(dt: number, dt0: number) {

    if (_completed) {
      return
    }

    _t += dt

    let dur = durations[_i % durations.length]

    let i = Math.min(_t / dur, 1)

    let orig = values[_i]
    let dest = values[_i + 1]

    _value = lerp(orig, dest, ease(i))

    if (i === 1) {
      _i++;
      _t = 0

      if (_i >= values.length - 1) {
        _completed = true
      }
    }

  }

  return [_read_value, _update]

}

/* https://gist.github.com/gre/1650294 */
function ease(t: number) {
  return t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}
