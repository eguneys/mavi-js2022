import { w, h, colors } from './shared'
import { Vec2 } from './vec2'
import Play from './play'
import { Pointer, bind_pointer } from './pointer'
import { Canvas, Graphics, Batcher } from './webgl'
import sprites_png from '../assets/sprites.png'

function load_image(path: string): Promise<HTMLImageElement> {
  return new Promise(resolve => {
    let res = new Image()
    res.onload = () => resolve(res)
    res.src = path
  })
}

function loop(fn: (dt: number, dt0: number) => void) {
  let animation_frame_id
  let fixed_dt = 1000/60
  let timestamp0: number | undefined,
  min_dt = fixed_dt * 0.9,
    max_dt = fixed_dt * 1.1,
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
  load_image(sprites_png).then(image => start(element, image))
}


function start(element: HTMLElement, image: HTMLImageElement) {

  let canvas = new Canvas(element, w, h)
  let graphics = new Graphics(canvas)
  let g = new Batcher(graphics)

  let m = new Pointer().init(bind_pointer(canvas.$canvas))
  let _ctx = {
    g,
    m
  }

  let p = new Play(_ctx).init()

  g.init(colors.bg, image)
  let t = 0

  loop((dt: number, dt0: number) => {

    m.update(dt, dt0)
    p.update(dt, dt0)


    let n = 1980
    //g.fr(-n/2 + 160, -n/2+90, n, n)

    //g.fr(colors.red, 0, 0, 1920, 1080);
    let x = 600
    //g.fr(colors.darkred, x/2, x/2, 1920-x, 1080-x)
    //g.fr(colors.darkred, 500, 100, 20, 50)
    //g.fr(colors.darkred, 100, 200, 100, 50)

    //g.fc(colors.darkred, 0, 0, Math.abs(Math.sin(t * 0.0001)) * 300)

    //g.fr(colors.red, w/2, h/2, 100, 180)
    //g.fr(colors.red, Math.abs(Math.sin(t * 0.0001)) * Math.PI * 2, w/2, h/2, 8, 12)
    //g.fr(colors.darkred, 10, 0, 100, 100)

    t += dt

    p.draw()

    g.render()



  })
}
