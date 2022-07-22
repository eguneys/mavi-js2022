import { Vec2 } from './vec2'
import Mouse from './mouse'
import Graphics from './graphics'

let w = 320 * 2
let h = 180 * 2

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

  let canvas = document.createElement('canvas')
  let ctx = canvas.getContext('2d')
  canvas.width = w
  canvas.height = h
  element.appendChild(canvas)

  let g = new Graphics(w, h, ctx)


  let m = new Mouse(element).init()
  let bounds = make_bounds(element)

  let _ctx = {
    m_nor: make_norm_mouse(bounds),
    g,
    m
  }


  loop((dt: number, dt0: number) => {

    g.clear()

    g.fr(0, 0, w, h, 'lightblue')

    g.flush()

    g.fc(150, 50, 50, 'lightyellow')
    g.fc(0, 30, 150, 'lightyellow')
    g.fc(300, 30, 50, 'lightyellow')
    g.fc(320, 160, 50, 'lightyellow')
    g.fc(600, 260, 50, 'lightyellow')
    g.fc(320, 363, 50, 'lightyellow')

    g.flush()
  })
}
