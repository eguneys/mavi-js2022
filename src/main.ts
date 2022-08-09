import { Vec2 } from './vec2'
import Play from './play'
import { Pointer, bind_pointer } from './pointer'
import { Canvas, Graphics, Batcher } from './webgl'

let w = 320
let h = 180

function loop(fn: (dt: number, dt0: number) => void) {
  let animation_frame_id
  let fixed_dt = 1000/60
  let timestamp0: number | undefined,
  min_dt = fixed_dt,
    max_dt = fixed_dt * 2,
    dt0 = fixed_dt

  let elapsed = 0

  function step(timestamp: number) {
    let dt = timestamp0 ? timestamp - timestamp0 : fixed_dt

    dt = Math.min(max_dt, Math.max(min_dt, dt))

    fn(dt, dt0)

    dt0 = dt
    timestamp0 = timestamp
    animation_frame_id = requestAnimationFrame(step)
  }
  animation_frame_id = requestAnimationFrame(step)

  return () => {
    cancelAnimationFrame(animation_frame_id)
  }
}

function make_bounds($element: HTMLElement) {

  let _bounds
  function set_bounds() {
    _bounds = $element.getBoundingClientRect()
  }
  set_bounds()

  document.addEventListener('scroll', () => set_bounds(), { capture: true, passive: true })
  window.addEventListener('resize', () => set_bounds(), { passive: true })


  return {
    get bounds() {
      return _bounds
    }
  }
}

const make_norm_mouse = (has_bounds: any) => {
  return v => {
    let { bounds } = has_bounds
    return Vec2.make(v[0] / bounds.width * w, v[1] / bounds.height * h)
  }
}



export default function app(element: HTMLElement) {

  let canvas = new Canvas(element, w, h)
  let graphics = new Graphics(canvas)
  let g = new Batcher(graphics)

  let m = new Pointer().init(bind_pointer(canvas.$canvas))
  let _ctx = {
    g,
    m
  }

  let p = new Play(_ctx).init()

  g.init()

  loop((dt: number, dt0: number) => {

    m.update(dt, dt0)
    p.update(dt, dt0)


    g.fr(50, 50, 100, 100)

    g.fc(200, 50, 20)
    g.fc(0, 50, 200)

    g.render()



  })
}
