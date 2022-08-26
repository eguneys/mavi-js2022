/* http://www.red3d.com/cwr/steer/gdc99/ */
import { Circle, Vec2, Matrix } from './vec2'

export type RigidOptions = {
  mass: number,
  air_friction: number,
  max_speed: number,
  max_force: number,
  x0: number
}

export type Rigid = {
  opts: RigidOptions,
  force: number,
  x: number,
  x0: number,
  vx: number
}

export function make_rigid(x0: number, opts: RigidOptions) {
  return {
    opts,
    force: 0,
    x: x0,
    x0,
    vx: 0
  }
}


/* https://github.com/a327ex/SNKRX/blob/master/engine/math/vector.lua#L202 */
export function truncate(a: number, max: number) {
  let s = (max * max) / (a * a)
  s = (s > 1 && 1) || Math.sqrt(s)
  return a * s
}

/* https://stackoverflow.com/questions/32709599/the-time-corrected-verlet-numerical-integration-formula */
export function rigid_update(body: Rigid, dt: number, dt0: number) {

  let { opts: { air_friction, mass, max_speed, max_force } } = body

  let { force, x, x0 } = body

  let a = force / mass

  a = truncate(a, max_force)
  let v0_x = x - x0
  let new_vx = v0_x * air_friction * dt / dt0 + a * dt * (dt + dt0) / 2
  new_vx = truncate(new_vx, max_speed)
  let new_x0 = x,
    new_x = x + new_vx


  body.x0 = new_x0
  body.x = new_x
  body.vx = new_vx
}


/* https://gamedev.stackexchange.com/questions/200784/how-to-move-an-enemy-to-sneak-up-on-the-player-from-behind-using-forces */
export function rotate_matrix(heading: Vec2, side: Vec2, pos: Vec2) {
  let a = heading.x,
    b = side.x,
    c = heading.y,
    d = side.y,
    tx = pos.x,
    ty = pos.y

  return new Matrix(a, b, c, d, tx, ty)
}


export function matrix_forward(matrix: Matrix) {
    return Vec2.make(matrix.a, matrix.c)
}

export function matrix_side(matrix: Matrix) {
    return Vec2.make(matrix.b, matrix.d)
}

export function matrix_translate(matrix: Matrix) {
  return Vec2.make(matrix.tx, matrix.ty)
}


export function rigid_body(vs: Vec2, opts: RigidOptions) {
  let r_x = make_rigid(vs.x, opts)
  let r_y = make_rigid(vs.y, opts)

  function update(dt, dt0) {
    rigid_update(r_x, dt, dt0)
    rigid_update(r_y, dt, dt0)

    r_x.force = 0
    r_y.force = 0
    m_left = opts.max_force
  }

  let m_left = opts.max_force
  function add_force(v_f: Vec2) {
    let v_i = Math.min(m_left, v_f.length)

    m_left -= v_i

    v_f = v_f.normalize.scale(v_i)

    r_x.force += v_f.x
    r_y.force += v_f.y
  }

  return {
    update,
    add_force,
    get vs() {
      return Vec2.make(r_x.x, r_y.x)
    },
    get velocity() {
      return Vec2.make(r_x.vx, r_y.vx)
    },
    get pos() {
      return this.vs
    },
    get heading() { 
      let heading = this.velocity.normalize
      return heading.length === 0 ? Vec2.unit : heading
    },
    get side() { 
      return this.heading.perpendicular
    },
    get matrix() {
      return rotate_matrix(this.heading, this.side, this.pos)
    },
    get max_speed() {
      return opts.max_speed
    }
  }
}

/* https://github.com/wangchen/Programming-Game-AI-by-Example-src/tree/master/Buckland_Chapter3-Steering%20Behaviors */
export function steer_behaviours(vs: Vec2, opts: RigidOptions, bs: Array<Behaviour>) {

  let _body = rigid_body(vs, opts)

  function update(dt: number, dt0: number) {
    bs.forEach(([b, w]) => {
      let desired_vel = b(_body)
      let steering = 
        desired_vel.sub(_body.velocity)
      .scale(opts.max_force / opts.max_speed)
      if (isNaN(steering.x)) {
        console.log(bs, w, desired_vel, _body.velocity)
        throw 3
      }
      _body.add_force(steering.scale(w))
    })

    _body.update(dt, dt0)
  }

  return {
    _body, 
    bs(_bs: Array<Behaviour>) {
      bs = _bs
    },
    update,
  }
}


export function make_wander(vs: Vec2, opts: RigidOptions) {

  let v_wander = Vec2.unit
  let r_x = make_rigid(vs.x, opts.mass, opts.air_friction, opts.max_speed, opts.max_force)
  let r_y = make_rigid(vs.y, opts.mass, opts.air_friction, opts.max_speed, opts.max_force)


  function update(dt, dt0) {

    let pos = Vec2.make(r_x.x, r_y.x)
    let velocity = Vec2.make(r_x.vx, r_y.vx)

    let heading = velocity.normalize
    heading = heading.length === 0 ? Vec2.unit : heading

    let side = heading.perpendicular
    let matrix = rotate_matrix(heading, side, pos)

    let desired_vel = wander_steer(matrix, v_wander, 10, 500, 20)
    let steering = desired_vel.sub(velocity)
    steering = steering.scale(r_x.max_force/r_x.max_speed)
    r_x.force += steering.x
    r_y.force += steering.y

    if (Math.random() < 0.1) {
        v_wander.set_in(0, 0)
    }

    if (true) {
      let r = 500
      desired_vel = wall_avoid_steer(matrix, 100, [
        Line.from_xy(r, 0, r, r),
        Line.from_xy(0, r, 0, 0),
        Line.from_xy(0, 0, r, 0),
        Line.from_xy(r, r, 0, r)
      ])
      if (desired_vel) {
        v_wander.set_in(0, 0)
        let steering = desired_vel.sub(velocity)
        steering = steering.scale(r_x.max_force/r_x.max_speed)
        r_x.force = steering.x
        r_y.force = steering.y
      }

    }


    rigid_update(r_x, dt, dt0)
    rigid_update(r_y, dt, dt0)
  }

  return {
    update,
    get x() { return r_x.x },
    get y() { return r_y.x }
  }
}

export const b_orbit_steer = target => (_body) => orbit_steer(_body.vs, target, _body.max_speed)
export const b_no_steer = (_body) => Vec2.zero

export const b_wander_steer = (jitter: number, r: number, distance: number) => {
  let v_wander = Vec2.unit
  return (_body) => wander_steer(_body.matrix, v_wander, jitter, r, distance)
}

export const b_separation_steer = group =>
(_body) => separation_steer(_body.vs, group, _body.max_speed)

export const b_avoid_circle_steer = (target, zero_angle) =>
(_body) => avoid_circle_steer(_body.vs, target, _body.max_speed, zero_angle)

export const b_flee_steer = (target, zero_angle) =>
(_body) => flee_steer(_body.vs, target, _body.max_speed, zero_angle, 100)

export const b_arrive_steer = target => 
(_body) => arrive_steer(_body.vs, target, _body.max_speed, 100)

function orbit_steer(position: Vec2, target: Vec2, max_speed: number) {

  let target_offset = position.sub(target)
  let out = target_offset.scale(target_offset.length < 200 ? 1 : -1).normalize

 return target_offset.perpendicular.normalize.add(out).scale(max_speed / 2)
  

}

function separation_steer(position: Vec2, group: Array<Vec2>, max_speed: number) {
  let res = Vec2.zero
  group.forEach(neighbour => {
    let toAgent = position.sub(neighbour)

    res.add_in(toAgent.normalize.scale(1/(toAgent.length||0.1)))
  })

  return res.scale(max_speed * 15)
}


function avoid_circle_steer(position: Vec2, target: Circle, max_speed: number, zero_angle: number) {
  return flee_steer(position, target.o, max_speed, zero_angle, target.r * 1.2)
}

function flee_steer(position: Vec2, target: Vec2, max_speed: number, zero_angle: number, slowing_distance: number) {
  let target_offset = position.sub(target)
  let distance = target_offset.length
  if (distance > slowing_distance) {
    return Vec2.zero
  }

  if (target_offset.length === 0) {
    target_offset = target_offset.add_angle(zero_angle)
  }
  return target_offset.normalize.scale(max_speed)
}

function arrive_steer(position: Vec2, target: Vec2, max_speed: number, slowing_distance: number) {
  let target_offset = target.sub(position)
  let distance = target_offset.length
  if (distance < 20) {
    return Vec2.zero
  }
  let ramped_speed = max_speed * (distance / slowing_distance)
  let clipped_speed = Math.min(ramped_speed, max_speed)
  let desired_velocity = target_offset.scale_in(clipped_speed / distance) 
  return desired_velocity
}

/* https://github.com/a327ex/SNKRX/blob/master/engine/game/steering.lua#L188 */
function wander_steer(position: Matrix, wander_target: Vec2, jitter: number, r: number, distance: number) {
  wander_target.x += (1 - 2 * Math.random()) * jitter
  wander_target.y += (1 - 2 * Math.random()) * jitter 
  wander_target = wander_target.normalize
  let transform = wander_target.scale(r).add(Vec2.make(distance, 0))
  return position.mVec2(transform).sub(matrix_translate(position))
}




function wall_avoid_steer(position: Matrix, length: number, walls: Array<Line>) {
  let orig = matrix_translate(position)
  let heading = matrix_forward(position)
  let side = matrix_side(position)

  let fs = []
  fs.push(heading.scale(length).add_in(orig))
  fs.push(heading.add_angle(-Math.PI * 0.25).scale_in(length / 2).add_in(orig))
  fs.push(heading.add_angle(Math.PI * 0.25).scale_in(length / 2).add_in(orig))


  let steering_force

  let closest_dist,
  closest_wall,
  closest_point

  fs.forEach(_fs => {

    walls.forEach(line => {
      let res = line.intersects(Line.make(orig, _fs))

      if (res) {
        let [dist, point] = res

        if (!closest_dist || dist < closest_dist) {
          closest_dist = dist
          closest_wall = line
          closest_point = point
        }
      }
    })

    if (closest_wall) {
      let overshoot = _fs.sub(closest_point)
      steering_force = closest_wall.normal.scale(overshoot.length)
    }
  })

  return steering_force

}


export class Line {

  static make = (a: Line, b: Line) => {
    return new Line(a, b)
  }

  static from_xy = (x: number, y: number, x2: number, y2: number) => {
    return Line.make(Vec2.make(x, y), Vec2.make(x2, y2))
  }

  readonly parallel: Vec2
  readonly normal: Vec2


  constructor(readonly a: Vec2,
              readonly b: Vec2) {
                this.parallel = b.sub(a).normalize
                this.normal = this.parallel.perpendicular
              }


/* https://github.com/wangchen/Programming-Game-AI-by-Example-src/blob/master/Common/2D/geometry.h */
  intersects(cd: Line) {
    let { a, b } = this
    let { a: c, b: d } = cd
    let r_top = (a.y - c.y) * (d.x - c.x) - (a.x - c.x) * (d.y - c.y)
    let r_bot = (b.x - a.x) * (d.y - c.y) - (b.y - a.y) * (d.x - c.x)

    let s_top = (a.y - c.y) * (b.x - a.x) - (a.x - c.x) * (b.y - a.y)
    let s_bot = (b.x - a.x) * (d.y - c.y) - (b.y - a.y) * (d.x - c.x)

    if ((r_bot === 0) || (s_bot === 0)) {
      return undefined
    }
    let r = r_top / r_bot
    let s = s_top / s_bot

    if ((r > 0) && (r < 1) && (s > 0) && (s < 1)) {
      let dist = a.distance(b) * r
      let point = a.add(b.sub(a).scale_in(r))

      return [dist, point]
    }
  }
}
