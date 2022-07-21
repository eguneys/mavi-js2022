import { ticks } from './shared'
import { Vec2, Rectangle, Transform } from './math'
import { line } from './line'
import { p } from './audio'

let template = new Transform()

export function set_stage(ctx: Context) {

  let { s, m, m_nor } = ctx

  let updates = []
  let free = [];

  [...Array(640)].forEach(_ => free.push(template.clone))


  let polys = template.clone

  let l = 0;
  updates.push((dt: number, dt0: number) => {
    let l0 = l
    l += dt
    if (Math.floor(l0 / ticks.seconds) !== Math.floor(l / ticks.seconds)) {
      make_poly(400, 400)
    }
  })

  function make_poly(x, y) {
    let poly = template.clone
    let ps = make_polygon()
    for (let i = 0; i < ps.length; i++) {
      line(free.pop(), ps[i].x, ps[i].y, ps[(i+1) % 10].x, ps[(i+1) % 10].y)._set_parent(poly)
    }
    poly.x = x
    poly.y = y
    poly._set_parent(polys)

    let dir = Vec2.make(random(), random()).scale(8)
    updates.push((dt: number, dt0: number) => {

      poly.x += dir.x
      poly.y += dir.y
    })
  }



  let ship = template.clone
  let ps = ship_pols
  for (let i = 0; i < ps.length; i++) {
    line(free.pop(), ps[i].x, ps[i].y, ps[(i+1) % ps.length].x, ps[(i+1) % ps.length].y)._set_parent(ship)
  }

  polys._set_parent(s)
  ship._set_parent(s)

  ship.pivot.x = 90
  ship.pivot.y = -35
  ship.x = 500
  ship.y = 500

  let t = 0
  return {
    update(dt: number, dt0: number) {

      let { click, hover } = m

      if (click) {
        p(0)
      }
      if (hover) {
        let h = m_nor(hover)
        ship.x = lerp(ship.x, h.x, 0.333)
        ship.y  = lerp(ship.y, h.y, 0.333)
      }

      let scale = Math.abs(Math.sin(t++ * 0.1) * 3)


      updates.forEach(_ => _(dt, dt0))

    }
  }
}

/* https://gist.github.com/gre/1650294 */
function ease(t: number) {
    return t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t
}

function lerp(a: number, b: number, t: number = 0.5) {
    return a + (b - a) * ease(t)
}

const vify = (v: Array<number>) => {
  let res = []
  for (let i = 0; i < v.length; i+=2) {
    res.push(Vec2.make(v[i], v[i+1]))
  }
  return res
}

const ship_pols = vify([65, 0, 120, -70, 180, 0, 150, 0, 120, -30, 100, 0])

const make_polygon = () => {
  let ps = [...Array(10)].map(_ => Vec2.make(random() * 2 - 1, random() * 2 - 1).scale(100))
  ps.sort((a, b) => a.angle - b.angle)
  return ps
}

const make_random = (seed = 1) => {
  return () => {
    var x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  }
}

const random = make_random()
