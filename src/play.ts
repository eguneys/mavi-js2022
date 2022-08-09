import { ticks } from './shared'
import { ti, completed, read, update, tween } from './anim'
import { Vec2, Rectangle, Circle } from './vec2'
import { make_sticky_pos } from './make_sticky'
import { 
  steer_behaviours, 
  b_wander_steer,
  b_separation_steer,
  b_arrive_steer, 
  b_avoid_circle_steer, 
  b_flee_steer } from './rigid'
import psfx from './audio'

const quick_burst = (radius: number, start: number = 0.8, end: number = 0.2) => 
tween([start, start, 1, end].map(_ => _ * radius), [ticks.five + ticks.three, ticks.three * 2, ticks.three * 2])

const rect_orig = (rect: Rectangle, o: Vec2) => {
  return rect.x1 <= o.x && o.x <= rect.x2 && rect.y1 <= o.y && o.y <= rect.y2
}

const circ_orig = (c: Circle, v: Vec2) => {
  return c.o.distance(v) <= c.r
}

/* https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript */
const make_random = (seed = 1) => {
  return () => {
    var x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  }
}
const random = make_random()

let v_screen = Vec2.make(1920, 1080)
let r_screen = Rectangle.make(0, 0, 1920, 1080)

function rnd_angle(rng: RNG = random) {
  return rng() * Math.PI * 2
}

function rnd_vec_h(rng: RNG = random) {
  return Vec2.make(rnd_h(rng), rnd_h(rng))
}

function rnd_vec(mv: Vec2 = Vec2.unit, rng: RNG = random) {
  return Vec2.make(rng(), rng()).mul(mv)
}

function rnd_h(rng: RNG = random) {
  return rng() * 2 - 1
}

function rnd_int_h(max: number, rng: RNG = random) {
  return rnd_h(rng) * max
}

function rnd_int(max: number, rng: RNG = random) {
  return Math.floor(rng() * max)
}

function arr_rnd(arr: Array<A>) {
  return arr[rnd_int(arr.length)]
}

function arr_remove(arr: Array<A>, a: A) {
  arr.splice(arr.indexOf(a), 1)
}

abstract class Play {

  get g() { return this.ctx.g }
  get m() { return this.ctx.m }

  data: any

  life: number
  life0: number

  constructor(readonly ctx: Context) {}

  _set_data(data: any): this { 
    this.data = data 
    return this
  }

  init(): this { 
    this.life = 0
    this.life0 = 0
    this._init()
    return this 
  }

  update(dt: number, dt0: number) {
    this.life0 = this.life
    this.life += dt
    this._update(dt, dt0)
  }

  draw() {
    this._draw()
  }

  /* https://github.com/eguneys/monocle-engine/blob/master/Monocle/Scene.cs#L122 */
  on_interval(t: number) {
    return Math.floor(this.life0 / t) !== Math.floor(this.life / t)
  }

  /* https://github.com/eguneys/monocle-engine/blob/master/Monocle/Util/Calc.cs#L944 */
  between_interval(i: number) {
    return this.life % (i * 2) > i
  }

  abstract _init(): void;
  abstract _update(dt: number, dt0: number): void;
  abstract _draw(): void;
}

abstract class PlayMakes extends Play {

  make(Ctor: any, data: any, delay: number = 0, repeat: number = 1) {
    this.makes.push([Ctor, data, delay, repeat, 0, 0])
  }


  init() {
    this.makes = []
    return super.init()
  }

  update(dt: number, dt0: number) {
    let { makes } = this
    this.makes = []

    this.makes = this.makes.concat(makes.filter(_ => {

      _[4] += dt

      let [Ctor, f_data, _delay, _s_repeat, _t, _i_repeat] = _

      let _at_once = _s_repeat < 0
      let _repeat = Math.abs(_s_repeat)

      if (_t >= _delay) {
        
        do {
          new Ctor(this)._set_data({
            group: this.objects,
            ...f_data.apply?.(
              _[5],
              _[4],
              _repeat,
              _delay,
            ) || f_data
          }).init()
        } while(++_[5] < _repeat && _at_once)

        _[4] = 0

        if (_repeat === 0 || _[5] < _repeat) {
          return true
        }
      } else {
        return true
      }
    }))

    super.update(dt, dt0)
  }

}

abstract class WithPlays extends PlayMakes {

  make(...args) {
    this.plays.make(...args)
  }

  constructor(readonly plays: AllPlays) {
    super(plays.ctx)
    this.on_dispose = []
  }

  init() {
    let { group } = this.data

    if (group) {
      group.push(this)
    }
    return super.init()
  }


  dispose(reason: any) {
    let { group } = this.data
    if (group) {
      arr_remove(group, this)
    }
    this.on_dispose.forEach(_ => _(this, reason))
    this._dispose(reason)
  }


  abstract _dispose(_: string): void;
}

abstract class WithRigidPlays extends WithPlays {

  readonly v_target = Vec2.unit

  readonly r_opts: RigidOptions = {
    mass: 1000,
    air_friction: 0.9,
    max_speed: 100,
    max_force: 3
  };
  readonly r_bs: Array<Behaviour> = [];

  r_wh!: Vec2;

  get angle() {
    return this.side.angle
  }

  get side() {
    return this._bh._body.side
  }

  get vs() {
    return this._bh._body.vs
  }

  get x() {
    return this.vs.x
  }

  get y() {
    return this.vs.y
  }

  get w() {
    return this.r_wh.x
  }

  get h() {
    return this.r_wh.y
  }

  get radius() {
    let { r_wh } = this
    return Math.max(r_wh.x, r_wh.y)
  }

  get rect() {
    let { vs, r_wh } = this
    return Rectangle.make(vs.x, vs.y, r_wh.x, r_wh.y)
  }

  get circle() {
    return Circle.make(this.v_target.x, this.v_target.y, this.radius)
  }

  init() {

    let { v_pos, wh, radius } = this.data
    this.v_target.set_in(v_pos.x, v_pos.y)
    this.r_wh = wh || (radius && Vec2.make(radius, radius)) || this.r_wh
    this._bh = steer_behaviours(this.v_target, this.r_opts, this.r_bs)

    super.init()
  }


  update(dt: number, dt0: number) {
    this._bh.update(dt, dt0)
    super.update(dt, dt0)
  }
}

class CylinderInCircle extends WithRigidPlays {

  v_group = []
  v_circle = Circle.unit
  r_opts = {
    mass: 200,
    air_friction: 1.08,
    max_speed: 8,
    max_force: 1
  }
  r_bs = [
    [b_wander_steer(40, 500, 200), 0.2],
    [b_avoid_circle_steer(this.v_circle, rnd_angle()), 0.3], 
    [b_separation_steer(this.v_group), 0.3], 
    [b_arrive_steer(this.v_target), 0.2]]
  r_wh = Vec2.make(40, 80)

  _init() {

    let self = this
    this._cursor = this.plays.one(Cursor)
    this.make(Explode, { apply: () => ({
      v_pos: self.vs,
      destroy: self
    }) }, ticks.seconds * 2)
    this.v_circle.copy_in(this.data.circle.circle)
  }

  _update(dt: number, dt0: number) {
    let { x, y } = this._cursor.pursue_target
    this.v_target.set_in(x, y)

    this.v_group.length = 0

    this.plays.all(CylinderInCircle).forEach(_ => this !== _ && circ_orig(this.circle.scale(8), _.vs) && this.v_group.push(_.vs))

    let { vs } = this
    if (this.on_interval(ticks.seconds)) {
      this.make(LineLine, {
        apply: () => ({
          v_pos: vs,
          radius: 6 + rnd_int(15),
          color: 'red'
        })
      }, ticks.sixth)
    }


  }

  _draw() {
    let { vs, side } = this
    this.g.queue('red', true, this.g._frr, side.angle, vs.x, vs.y, 40, 80, 18)
  }

  _dispose() {
  }

}

class Cylinder extends WithRigidPlays {

  v_group = []
  r_opts = {
    mass: 1000,
    air_friction: 0.9,
    max_speed: 100,
    max_force: 5
  }
  r_bs = [
    [b_separation_steer(this.v_group), 0.5], 
    [b_arrive_steer(this.v_target), 0.45],
  [b_wander_steer(10, 500, 400), 0.05]
  ]
  r_wh = Vec2.make(40, 80)


  _init() {
    let { v_pos } = this.data
    this._cursor = this.plays.one(Cursor)
  }

  _update(dt: number, dt0: number) {
    let { x, y } = this._cursor.pursue_target
    this.v_target.set_in(x, y)

    this.v_group.length = 0

    this.plays.all(Cylinder).forEach(_ => this !== _ && circ_orig(this.circle.scale(8), _.vs) && this.v_group.push(_.vs))
  }

  _draw() {
    let { vs, side } = this
    this.g.queue('darkred', true, this.g._frr, side.angle, vs.x, vs.y, 40, 80, 18)
  }


  _dispose(reason: any) {
    this.make(CylinderInCircle, {
      circle: reason,
      cylinder: this,
      v_pos: this.vs
    })
  }
}

class Cursor extends WithRigidPlays {

  r_opts = {
    mass: 1000,
    air_friction: 1,
    max_speed: 30,
    max_force: 50
  }

  r_bs = [[b_arrive_steer(this.v_target), 1]]

  get pursue_target() {
    return this.vs
  }

  _init() {
    let { v_pos } = this.data
  }

  _update(dt: number, dt0: number) {

    this.v_target.set_in(this.m.pos.x, this.m.pos.y)

    if (this.on_interval(ticks.seconds * 3)) {
      this.make(HollowCircle, {
        v_pos: this.vs,
        radius: 400,
        color: 'yellow'
      })
    }
  }

  _draw() {
    let { vs } = this
    this.g.queue('lightyellow', true, this.g._fc, 0, vs.x, vs.y, 30, 30, 30)
  }


  _dispose() {}
}

class LineLine extends WithPlays {

  _init() {
    let { v_pos } = this.data

    this.vs = v_pos
    this.w = 100
    this.h = 100

    this.vertices = [Vec2.make(0, 0), Vec2.make(100, 100), Vec2.make(20, 200), Vec2.make(200, 0)]
  }

  _update(dt: number, dt0: number) {
  }

  _draw() {

    let { color } = this.data
    let { w, h,vertices, vs } = this

    this.g.queue('cyan', true, this.g._fr, 0, vertices[0].x, vertices[0].y, w, h, vertices)
  }
}

class VanishDot extends WithRigidPlays {

  v_flee = Vec2.unit
  r_opts = {
    mass: 400,
    air_friction: 0.8,
    max_speed: 100,
    max_force: 30 
  }
  r_bs = [[b_flee_steer(this.v_flee, rnd_angle()), 1]]
  r_wh = Vec2.make(40, 80)

  _init() {
    let radius = 30
    this._th = tween([0.8, 0.2, 0.16].map(_ => _ * radius), [arr_rnd([ticks.sixth * 1.5, ticks.five * 2, ticks.three])])

    let { v_pos, x, y } = this.data

    this.v_flee.set_in(v_pos.x + x, v_pos.y + y)
  }

  _update(dt: number, dt0: number) {
    update(this._th, dt, dt0)

    if (completed(this._th)) {
      this.dispose()
    }
  }

  _draw() {

    let { color } = this.data
    let { w, vs } = this
    let [h] = read(this._th)

    this.g.queue(color, true, this.g._frr, this.angle, vs.x, vs.y, w, h, w/4)
  }


  _dispose() {
  }
}

class VanishCircle extends WithPlays {

  _init() {
    let { radius } = this.data
    this._rt = quick_burst(radius, 0.96)

  }

  _update(dt: number, dt0: number) {
    update(this._rt, dt, dt0)

    if (completed(this._rt)) {
      this.dispose()
    }
  }

  _draw() {
    let { v_pos, x, y, color } = this.data
    let [radius] = read(this._rt)
    this.g.queue(color, true, this.g._fc, 0, v_pos.x + x, v_pos.y + y, radius, radius, radius)
  }


  _dispose() {
  }
}


class HollowCircle extends WithRigidPlays {

  _init() {
    this._rt = quick_burst(6, 1.2, 0.8)
  }

  _update(dt: number, dt0: number) {
    update(this._rt, dt, dt0)

    this.plays.all(Cylinder)
    .filter(_ => circ_orig(this.circle, _.rect.center))
    .forEach(_ => _.dispose(this))

    if (this.on_interval(ticks.seconds)) {
      this.dispose()
    }
  }

  _draw() {
    let { color } = this.data
    let { x, y, radius } = this
    let [_bradius, _, i] = read(this._rt)
    if (i <= 1) {
      let __bradius = _bradius * 1.8
      this.g.queue('white', false, this.g._hc, 0, x, y, radius, radius, radius, radius - __bradius)
    } else {
      this.g.queue(color, i > 2, this.g._hc, 0, x, y, radius, radius, radius, radius - _bradius)
    }
    /*
    radius += 6
    this.g.queue('black', 0, this.g._hc, 0, x, y, radius, radius, radius, radius - 1)
    radius -= 12
    this.g.queue('black', 0, this.g._hc, 0, x, y, radius, radius, radius, radius - 1)
   */
  }


  _dispose() {}
}

class Explode extends WithPlays {


  _init() {

    let { v_pos } = this.data

    let { destroy } = this.data

    destroy.dispose()

    this.make(VanishCircle, {
      v_pos,
      x: 0,
      y: 0,
      radius: 110,
      color: 'white'
    })

    this.make(VanishCircle, {
      v_pos,
      x: 0,
      y: 0,
      radius: 90,
      color: 'red'
    }, ticks.sixth)


    let v_corners = [
      Vec2.make(-1, -1),
      Vec2.make(-1, 1),
      Vec2.make(1, -1),
      Vec2.make(1, 1)
    ].map(_ => _.scale(45))

    v_corners.forEach(v =>
    this.make(VanishCircle, {
      v_pos,
      x: v.x,
      y: v.y,
      radius: 30,
      color: 'red'
    }, ticks.sixth * 1.8))

    this.make(VanishDot, {
      apply: () => ({
        v_pos,
        x: rnd_int_h(6),
        y: rnd_int_h(10),
        radius: 6 + rnd_int(15),
        color: 'red'
      })
    }, ticks.sixth, -10)

    this.dispose()
  }

  _update(dt: number, dt0: number) {}

  _draw() {}

  _dispose() {}

}


//red xy .6 white xy .3 black xy
//white xy .5 red xy .4 black xy

export default class AllPlays extends PlayMakes {

  all(Ctor: any) {
    return this.objects.filter(_ => _ instanceof Ctor)
  }

  one(Ctor: any) {
    return this.objects.find(_ => _ instanceof Ctor)
  }

  _init() {
    this.objects = []

    this.make(Cursor, { v_pos: Vec2.make(100, 0) })

    //this.make(Cylinder, { v_pos: Vec2.make(0, 0) }, ticks.seconds * 4, 0)
    //this.make(Cylinder, { v_pos: Vec2.make(100, 0) })
    
    this.make(Cylinder, { apply: (i_repeat) => ({
      v_pos: arr_rnd(r_screen.vertices)
    })
    }, ticks.seconds * 2, 1)
    this.make(Cylinder, { apply: (i_repeat) => ({
      v_pos: arr_rnd(r_screen.vertices)
    })
    }, ticks.seconds * 3, 0)

    this.make(Cylinder, { apply: (i_repeat) => ({
      v_pos: arr_rnd(r_screen.vertices)
    })
    }, ticks.seconds * 1, 0)

    this.make(Cylinder, { apply: (i_repeat) => ({
      v_pos: arr_rnd(r_screen.vertices)
    })
    }, ticks.seconds * 1, 0)


    /*
    this.make(Explode, {
      apply: (i_repeat) => ({
        v_pos: rnd_vec().scale(((i_repeat % 10) + 3) * 100)
      })
    }, ticks.seconds, 10)
   */
  }

  _update(dt: number, dt0: number) {
    this.objects.forEach(_ => _.update(dt, dt0))
  }
  _draw() {
    this.objects.forEach(_ => _.draw())
  }
}
