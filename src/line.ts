import { Vec2, Rectangle, Transform } from './math'

export function line(t: Transform, x: number, y: number, x2: number, y2: number) {

  let v0 = Vec2.make(x, y),
    v1 = Vec2.make(x2, y2),
    v2 = v0.sub(v1)

  t.x = v1.x
  t.y = v1.y
  t.rotation = v2.angle
  t.size = Vec2.make(v2.length, 6)


  return t
}


