import { Vec2, Rectangle, Transform } from './math'
import { line } from './line'

let template = new Transform()

export function set_stage(stage: Transform) {


  let free = [];

  [...Array(64)].forEach(_ => free.push(template.clone))

  let ship = template.clone

  let ps = make_polygon()
  for (let i = 0; i < ps.length; i++) {
    //line(free.pop(), ps[i].x, ps[i].y, ps[(i+1) % 10].x, ps[(i+1) % 10].y)._set_parent(ship)
  }

  ps = ship_pols
  for (let i = 0; i < ps.length; i++) {
    line(free.pop(), ps[i].x, ps[i].y, ps[(i+1) % ps.length].x, ps[(i+1) % ps.length].y)._set_parent(ship)
  }


  console.log(ps.length)

  ship._set_parent(stage)

  ship.pivot.x = 90
  ship.pivot.y = -35
  ship.x = 500
  ship.y = 500

  let t = 0
  return {
    update(dt: number, dt0: number) {

      let scale = Math.abs(Math.sin(t++ * 0.1) * 3)
      ship.scale.x = scale
      ship.scale.y = scale
      ship.rotation += 0.05
    }
  }
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
