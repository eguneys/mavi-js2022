import { w, h, colors, ticks } from './shared'
import { ti, completed, read, update, tween } from './anim'
import { Line, Vec2, Rectangle, Circle } from './vec2'
import { make_sticky_pos } from './make_sticky'
import { 
  steer_behaviours, 
  b_no_steer,
  b_wander_steer,
  b_separation_steer,
  b_arrive_steer, 
  b_orbit_steer,
  b_avoid_circle_steer, 
  b_flee_steer } from './rigid'
import { generate, psfx } from './audio'
import Camera from './camera'

import { arr_shuffle } from './util'

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



const slow_burst = (radius: number, rng: RNG = random) => 
tween([0.1, 0.1, 0.5, 1].map(_ => _ * radius), arr_shuffle([ticks.five + ticks.three, ticks.three * 2, ticks.five * 2, ticks.five, ticks.three * 2], rng))




const jaggy = (max: number, rng: RNG = random) => {

  let ns = [...Array(1 + rnd_int(max, rng)).keys()].map(_ => rng()).sort()
  let wander_target = 0
  let jitter = 4
  let r = 3 + rng() * max
  let distance = 8
  let envelope = [0, 0.1, 0.3, 0.5, 0.3, 0]
  let rs = ns.map((_, i) => {
    wander_target += rnd_h(rng) * jitter
    let res = wander_target * r + distance
    let _envelope = envelope[Math.floor(i / ns.length * envelope.length)]
    return res * _envelope
  })
  return [ns, rs]
}


const on_interval = (t, life, life0) => {
  return Math.floor(life0 / t) !== Math.floor(life / t)
}

const on_interval_lee = (t, life, life0, lee: Array<number>) => {
  //return lee.some(_ => on_interval(t, life - _, life0 - _) || on_interval(t, life + _, life0 + _))
  return lee.some(_ => (life + _) % t === 0 || (life - _) % t === 0)
}

/*
console.log(3, 2, on_interval_lee(4, 3, 2))
console.log(4, 3, on_interval_lee(4, 4, 3))
console.log(5, 4, on_interval_lee(4, 5, 4))
console.log(7, 6, on_interval_lee(4, 7, 6))
console.log(8, 7, on_interval_lee(4, 8, 7))
console.log(9, 8, on_interval_lee(4, 9, 8))
console.log(6, 5, on_interval_lee(4, 6, 5))
console.log(10, 9, on_interval_lee(4, 10, 9))

console.log(11, 10, on_interval_lee(4, 11, 10))
console.log(12, 11, on_interval_lee(4, 12, 11))
console.log(13, 12, on_interval_lee(4, 13, 12))

*/
/*
console.log(on_interval_lee(4, 3, 2) === true)
console.log(on_interval_lee(4, 4, 3) === true)
console.log(on_interval_lee(4, 5, 4) === true)
console.log(on_interval_lee(4, 7, 8) === true)
console.log(on_interval_lee(4, 8, 9) === true)
console.log(on_interval_lee(4, 9, 8) === true)
console.log(on_interval_lee(4, 6, 5) === false)
console.log(on_interval_lee(4, 10, 9) === false)
*/

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
    return on_interval(t, this.life, this.life0)
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

  make(Ctor: any, data: any = {}, delay: number = 0, repeat: number = 1) {
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


  _init() {}
  _update() {}
  _draw() {}
}

abstract class WithPlays extends PlayMakes {

  make(...args) {
    this.plays.make(...args)
  }

  get camera() {
    return this.plays.camera
  }

  shake(radius) {
    this.plays.shake(radius)
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


  _dispose(_: string) {}
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


    let { vs } = this

    this.make(Letters, {
      _text() { return ['run', colors.gray] },
      v_pos: vs,
      life: ticks.half,
      scale: 1
    })
    this._cursor = this.plays.one(Cursor)
    this.make(Explode, { apply: () => ({
      v_pos: vs
    }) }, ticks.seconds)
    this.v_circle.copy_in(this.data.circle.circle)
  }

  _update(dt: number, dt0: number) {
    if (!this._cursor) {
      this.dispose()
      return
    }
    let { x, y } = this._cursor.pursue_target
    this.v_target.set_in(x, y)

    this.v_group.length = 0

    this.plays.all(CylinderInCircle).forEach(_ => this !== _ && circ_orig(this.circle.scale(8), _.vs) && this.v_group.push(_.vs))

    let { vs } = this
    if (this.on_interval(ticks.seconds)) {
      this.dispose()
      this.make(LineLine, {
        apply: () => ({
          v_pos: vs,
          line: Line.make(...rnd_vec(v_screen).vs, ...rnd_vec(v_screen).vs)
        })
      }, ticks.sixth)
    }


  }

  _draw() {
    let { vs, side } = this
    this.camera.fr(colors.red, side.angle, vs.x, vs.y, 40, 80)
  }
}

class Cylinder extends WithRigidPlays {

  v_circle = Circle.unit
  v_group = []
  r_opts = {
    mass: 1000,
    air_friction: 0.9,
    max_speed: 100,
    max_force: 5
  }
  r_bs = [
    [b_arrive_steer(this.v_target), 0.4],
    [b_avoid_circle_steer(this.v_circle, rnd_angle()), 0.25], 
    [b_separation_steer(this.v_group), 0.3], 
    [b_wander_steer(10, 500, 400), 0.05],
  ]
  r_wh = Vec2.make(40, 80)


  _init() {
    let { v_pos } = this.data
    // Hack dummy cursor
    this._cursor = this.plays.one(Cursor) || {
      pursue_target: v_screen.half,
      circle: Circle.unit
    }
    this.danger = 0

    if (this.data.color) {
      this.r_opts.mass = 600
      this.r_opts.air_friction = 0.92
    }

    this.color = this.data.color || colors.darkred
  }

  _update(dt: number, dt0: number) {
    let { x, y } = this._cursor.pursue_target
    this.v_target.set_in(x, y)

    this.v_circle.copy_in(this._cursor.circle.scale(2))

    this.v_group.length = 0

    this.plays.all(Cylinder).forEach(_ => this !== _ && circ_orig(this.circle.scale(8), _.vs) && this.v_group.push(_.vs))


    if (this.vs.distance(this._cursor.pursue_target) < 100) {
      this.danger += dt
    }

    this._cursor.danger += this.danger

  }

  _draw() {
    let { color, vs, side } = this
    this.camera.fr(color, side.angle, vs.x, vs.y, 40, 80)
  }


  _dispose(reason: any) {
    if (reason) {
    this.make(CylinderInCircle, {
      circle: reason,
      cylinder: this,
      v_pos: this.vs
    })
    }
  }
}

let _is = [0, 0.1, -0.2, 0.2, -0.5, -0.3, -0.1, 0.3, 0.5, 0.8, -1, 0]

class Cursor extends WithRigidPlays {

  r_opts = {
    mass: 1000,
    air_friction: 1,
    max_speed: 30,
    max_force: 50
  }

  r_bs = [[b_arrive_steer(this.v_target), 1]]
  r_wh = Vec2.make(80, 80)

  get pursue_target() {
    return this.vs
  }

  _init() {
    let { v_pos } = this.data
    this.eight_four = 8
    this.b_counter = 0

    this.lift = 0
    this.danger = 0
  }

  _update(dt: number, dt0: number) {

    if (this.lift >= 13) {
     this.plays.one(Audio).beat(1)
    }

    if (this.danger > 1000) {
      this.plays.one(Audio).beat(1)
    }

    this.lift = 0
    this.danger = 0

    let hold_shoot = this.m.been_on > 0

    this.v_target.set_in(this.m.pos.x, this.m.pos.y)

    if (this.plays.on_beat(2)) {
      this.b_counter+= 6
    }
    if (this.plays.on_beat(8)) {
      this.eight_four = this.eight_four === 4 ? 8 : 4
    }

    if (hold_shoot && this.plays.on_beat(8)) {
      this.make(HomingLift, {
        apply: (i) => ({
          i,
          v_pos: this.vs,
          color: colors.white,
        })
      }, 0, 8)
    }

    if (!hold_shoot && this.plays.on_beat(4) && this.plays.on_beat(this.eight_four)) {
      this.make(HomingLift, {
        apply: (i) => ({
          i,
          v_pos: this.vs,
          color: colors.gray,
        })
      }, ticks.three, Math.abs(Math.sin(this.life * 0.001)) * 0.02 + this.b_counter * 0.003)
    }

    if (this.m.just_off) {
      if (!this.plays.one(HollowCircle) && this.plays.on_beat_lee(8, [0, 1])) {
        let { radius } = this.plays.one(GhostCircle)
        if (radius) {
          this.b_counter = 2
          this.make(HollowCircle, {
            v_pos: this.vs,
            radius,
            color: colors.yellow
          })
        }
      }
    }

    /*
    if (this.on_interval(ticks.seconds * 2)) {
      this.shake(10)
    }
    if (this.on_interval(ticks.seconds * 5)) {
      this.shake(30)
    }
   */
  }


  _draw() {
    let { vs } = this
    this.camera.fc(colors.red, vs.x, vs.y, 80)
  }
}


let letters = "abcdefghijklmnopqrstuvwxyz!0123456789,.".split('')

class Letters extends WithPlays {


  _update(dt: number, dt0: number) {
    if (this.data.life) {
      if (this.life > this.data.life) {
        this.dispose()
      }
      this.data.v_pos.y -= dt * 0.1
    }
  }

  _draw() {

    let [text, color] = this.data.text ? [this.data.text, colors.white] : this.data._text()
    let _letters = text.split('')
    let { v_pos, scale } = this.data;
    scale ||= 2
    _letters.forEach((letter, i) => {
      let sx = letters.indexOf(letter) * 8
      if (sx >= 0) {
        this.camera.texture(color, 0, v_pos.x + i * scale * 5*(1920/320), v_pos.y, scale*5, scale*7, sx, 9, 5, 7)
      }
    })
  }
}

class LineLine extends WithPlays {

  get lines() {
    return [...Array(this.vertices.length - 1).keys()]
    .map(i => Line.make(this.vertices[i].x, this.vertices[i].y, this.vertices[i+1].x, this.vertices[i+1].y))
  }

  _init() {
    let { v_pos, line } = this.data

    this.vs = v_pos

    let jagg = jaggy(20)
    this.vertices = line.segments(...jagg)
    this._rt = slow_burst(this.lines.length-1)
  }

  _update(dt: number, dt0: number) {
    update(this._rt, dt, dt0)
    if (this.on_interval(ticks.seconds)) {
      this.dispose()
    }
  }

  _draw() {

    let { color } = this.data
    let { w, h,vertices, vs } = this

    let [_n] = read(this._rt)

    this.lines.slice(0, Math.floor(_n)).forEach((line, i) => {
      this.camera.line(colors.yellow, line.angle, line.center.x, line.center.y, line.radius, 
                       Math.sin(this.life * 0.02* Math.sin(i * 0.02)) * 60)
    })
  }
}


class HomingHome extends WithRigidPlays {

  v_target = Vec2.unit
  r_opts = {
    mass: 40000,
    air_friction: 0.92,
    max_speed: 300,
    max_force: 390
  }
  r_bs = [[b_wander_steer(10, 200, 100), 0.2],
    [b_arrive_steer(this.v_target), 0.8]
  ]
  r_wh = Vec2.make(30, 60)


  _init() {
    this.r_opts.max_force += rnd_int(100)
  }

  _update(dt: number, dt0: number) {

    let { target } = this.data
    this.v_target.set_in(target.vs.x, target.vs.y)

    if (this.on_interval(ticks.seconds)) {
      this.dispose()
    }
  }

  _draw() {
    let { color } = this.data

    let { h, w, vs } = this

    this.camera.fr(colors.yellow, this.angle, vs.x, vs.y, w, h)
  }


  _dispose() {
    this.data.target.dispose()
    this.make(Explode, {
      v_pos: this.vs,
      color: colors.yellow
    })

    this.make(Letters, {
      _text() { return ['hit', colors.yellow] },
      v_pos: this.vs,
      scale: 1,
      life: ticks.seconds,
    })
  }
}
class HomingLift extends WithRigidPlays {

  v_orbit = v_screen.half
  r_opts = {
    mass: 100,
    air_friction: 1,
    max_speed: 80,
    max_force: 8 
  }
  r_bs = [
    [b_wander_steer(10, 50, 100), 0.2],
  ]
  r_wh = Vec2.make(30, 40)


  _init() {

    this._cursor = this.plays.one(Cursor)
    this.r_bs.unshift([b_orbit_steer(this.v_orbit), 0.8])
  }


  _update(dt: number, dt0: number) {

    this._cursor.lift++
    
      if (this.on_interval(ticks.seconds)) {
      this.r_opts.max_speed -= 3
      this.r_opts.mass += 10
    }

    let _v = this._cursor.pursue_target
    this.v_orbit.set_in(_v.x, _v.y)

    if (this.on_interval(ticks.sixth)) {

    let { v_pos, x, y, i } = this.data
    let target = this.plays.all(Cylinder).filter(_ => !_.flag)
    .find(_ => this.vs.distance(_.vs) < 500)

    if (target) {
      this.target = target
      target.flag = 1
    }
    if (this.target) {
      this.make(HomingHome, {
        v_pos: this.vs,
        color: this.data.color,
        target: this.target
      })
      this.dispose()
    }
    }
  }

  _draw() {
    let { color } = this.data

    let { w, vs } = this

    if (this._cursor.lift > 0) {
      color = this.between_interval(ticks.sixth) ? colors.red : colors.gray
    }
    this.camera.fr(color, this.angle, vs.x, vs.y, w, w)
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

    this.camera.fr(color, this.angle, vs.x, vs.y, w, h)
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
    this.camera.fc(color, v_pos.x + x, v_pos.y + y, radius)
  }
}

class GhostCircle extends WithPlays {

  _init() {
    this._cursor = this.plays.one(Cursor)
  }

  get radius() {
    if (this._rt) {
      let [radius] = read(this._rt)
      return radius / 2
    }
  }


  _update(dt: number, dt0: number) {

    if (this._rt) {
      update(this._rt, dt, dt0)
    }
    if (this.plays.on_beat_lee(8, [0, 1])) {
      if (this.plays.on_beat(1)) {
        // 0 1 2
        // 1 2 1
        let r = (this.plays.beat_ms[0] + 1) % 8
        r = r === 1 ? 2 : 1
        this._rt = tween([0, 0.5, 1, 1.2, 1.5, 1].map(_ => (r * 300) + _ * 200), [ticks.three])
      }
    } else {
      this._rt = undefined
    }
  }

  _draw() {
    let { x, y } = this._cursor.pursue_target
    if (!this._rt) {
      return
    }
    let [radius] = read(this._rt)

    this.camera.fc(colors.gray, x, y, radius * 0.9, 0.01)
    this.camera.fc(colors.gray, x, y, radius, 0.01)
  }
}

class HollowCircle extends WithRigidPlays {

  _init() {
    this._rt = quick_burst(2, 1.2, 0.2)


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
      this.camera.fc(colors.white, x, y, (radius+_bradius*2) * 2, __bradius/radius)
    } else {
      this.camera.fc(color, x, y, radius * 2, _bradius/radius)
    }
    /*
    radius += 6
    this.g.queue('black', 0, this.g._hc, 0, x, y, radius, radius, radius, radius - 1)
    radius -= 12
    this.g.queue('black', 0, this.g._hc, 0, x, y, radius, radius, radius, radius - 1)
   */
  }


  _dispose() {
    this.make(Letters, {
      text: 'x' + Math.floor(this.radius/20),
      v_pos: this.vs,
      scale: 1,
      life: ticks.sixth
    })
  }
}

class Explode extends WithPlays {


  _init() {

    let { v_pos } = this.data

    let color = this.data.color || colors.red

    this.shake(10)

    this.make(VanishCircle, {
      v_pos,
      x: 0,
      y: 0,
      radius: 110,
      color: colors.white
    })

    this.make(VanishCircle, {
      v_pos,
      x: 0,
      y: 0,
      radius: 90,
      color
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
      color
    }, ticks.sixth * 1.8))

    this.make(VanishDot, {
      apply: () => ({
        v_pos,
        x: rnd_int_h(6),
        y: rnd_int_h(10),
        radius: 6 + rnd_int(15),
        color
      })
    }, ticks.sixth, -10)

    this.dispose()
  }

  _update(dt: number, dt0: number) {}
}

class Area extends WithPlays {

  _init() {
    let rng = random
    this._rt = tween([0.1, 0.3, 0.5, 0.912].map(_ => _ * 100), [ticks.seconds, ticks.seconds, ticks.seconds * 2], rng)

  }

  _update(dt: number, dt0: number) {
    update(this._rt, dt, dt0)

    if (this.plays.on_beat(3)) {

      this.make(Cylinder, {
        v_pos: v_screen.half,
        color: colors.white
      }, 1)
    }

    if (completed(this._rt)) {
      this.dispose()
    }
  }

  _draw() {

    let [_n] = read(this._rt)
    let { color, x, y, radius } = this.data
    let rotation = this.life * 0.003 + Math.sin(this.life * 0.015) * 0.2 + Math.cos(this.life0 * 0.01) * 0.2
    if (_n % 6 > 3) {
      this.camera.fr(colors.white, rotation-0.1, x, y, radius, radius, 0.03-(_n%3)* 0.01, colors.white)
    }
    {
      this.camera.fr(color, rotation, x, y, radius, radius, 0.9999, colors.white)
    }
  }

}

class BPM extends WithPlays {

  get beat_ms() {
    return [this._sub, this._sub0]
    //return [this._sub, this._t, this._t / this._ms_per_sub]
  }

  _init() {

    let _bpm = this.data.bpm
    let _ms_per_beat = 60000 / _bpm
    let _subs = 4
    let _ms_per_sub = _ms_per_beat / _subs

    let _sub = -1

    let _lookahead_ms = 20
    let _t = _lookahead_ms
    let m_t = () => _t - _lookahead_ms

    this._t = _t
    this._ms_per_sub = _ms_per_sub
    this._lookahead_ms = _lookahead_ms
    this._sub = _sub

    this._sub0 = this._sub
  }

  _update(dt: number, dt0: number) {
    let { _t, _ms_per_sub, _lookahead_ms } = this

    this._sub0 = this._sub

    if (_t + dt + _lookahead_ms > _ms_per_sub) {
      this._t = _t - _ms_per_sub + dt
      this._sub += 1
    } else {
      this._t += dt
    }
  }
}

class Audio extends WithPlays {

  _init() {
    this._ready = false
    this._beat = false
    this._i_beat = 0
  }

  beat(n: number) {
    if (this._i_beat !== n) {
      this._beat()
      this._beat = undefined
      this._i_beat = n
    }
  }

  _update(dt: number, dt0: number) {

    if (!this._ready && this.m.just_lock) {
      generate(() => this._ready = true)
    }
    if (this.m.just_lock) {
      let _ = this.plays.one(Dialog, this.plays.ui)
      if (_) {
        _._dd = true
      }
    }
    if (this._ready && !this._beat && this.m.been_lock !== undefined) {
      console.log('ibeat', this._i_beat)
      this.plays.one(Spawn).playing = this._i_beat !== 1

      this._beat = psfx(this._i_beat, true)
      this.make(BPM, { bpm: 80 } )
    }

    if (this._beat && this.m.just_unlock) {
      this.plays.one(Spawn).playing = false
      this._beat()
      this._beat = undefined
      this.plays.one(BPM)?.dispose()
    }


  }

}

class Spawn extends WithPlays {

  _init() {
    let score = {
      life: 0,
      high: 0
    }



    let self = this
    this.make(Letters, {
      _text() {
        let lift = self.plays.one(Cursor)?.lift || 0
        return [lift + '', lift > 8 ? colors.red : colors.white]
      },
      color: colors.red,
      v_pos: Vec2.make(500, 100)
    })



    this.playing = false
    this.score = score

    this.make(Letters, {
      scale: 3,
      _text() { return [Math.floor(score.life / 1000) + '.' + Math.floor((score.life % 1000)/100), score.life === score.high ? colors.yellow : colors.white] },
      v_pos: Vec2.make(800, 100)
    })


    this.make(Letters, {
      text: 'hi',
      v_pos: Vec2.make(1450, 100)
    })

    this.make(Letters, {
      scale: 2,
      _text() { return ['' + Math.floor(score.high / 1000), colors.yellow] },
      v_pos: Vec2.make(1600, 100)
    })
  }

  _update(dt: number, dt0: number) {

    if (this.playing) {
      this.score.life += dt
    } else {
      this.score.life = 0
      this.life = 0
    }

    if (!this.playing) {
      if (!this.plays.one(Dialog, this.plays.ui)) {
        this.make(Dialog, { group: this.plays.ui })
      }
    }

    this.score.high = Math.max(this.score.high, this.score.life)

    if (!this.playing) {
      return
    }

    if (this.plays.on_beat(8)) {
      this.make(Cylinder, {
        apply: () => ({
          v_pos: arr_rnd(r_screen.vertices)
        })
      }, 0, Math.sin(this.life * 0.00001) * Math.cos(this.life * 0.0001) * (10 + Math.abs(Math.sin(this.life * 0.001) * 4)))
    }
  }
}

class Dialog extends WithPlays {

  _init() {


    this.plays.all(HomingLift).forEach(_ => _.dispose())
    this.plays.one(Cursor)?.dispose()
    this.plays.all(Cylinder).forEach(_ => _.dispose())
    this.plays.one(GhostCircle)?.dispose()
    this.a = []

    this.make(Letters, {
      text: 'die in 13k',
      v_pos: Vec2.make(680, 260),
      group: this.a
    })
    this.make(Letters, {
      text: 'bullets orbit around',
      v_pos: Vec2.make(380, 360),
      group: this.a
    })
    this.make(Letters, {
      text: '13 bullets is death',
      v_pos: Vec2.make(400, 460),
      group: this.a
    })
    this.make(Letters, {
      text: 'cylinders follow you',
      v_pos: Vec2.make(380, 560),
      group: this.a
    })
    this.make(Letters, {
      text: 'hold left will',
      v_pos: Vec2.make(420, 660),
      group: this.a
    })
    this.make(Letters, {
      text: 'hold bullets and launch',
      v_pos: Vec2.make(400, 760),
      group: this.a
    })
    this.make(Letters, {
      text: 'release launchs attack',
      v_pos: Vec2.make(350, 860),
      group: this.a
    })
    this.make(Letters, {
      text: 'mind the beat',
      v_pos: Vec2.make(550, 960),
      group: this.a
    })

  }

  _update(dt: number, dt0: number) {
    if (this.m.been_on) {
      this._dd = true
    }

    if (this.life > ticks.seconds * 2) {
      if (this._dd) {
        this.dispose()
      }
    }

    this.a.forEach(_ => _.update(dt, dt0))
  }

  _draw() {
    this.camera.fr(colors.white, 0, ...v_screen.half.add(Vec2.make(0, 80)).vs, 1400, 900)

    this.a.forEach(_ => _.draw())
  }

  _dispose() {
    this.plays.one(Audio).beat(0)
    this.make(Cursor, { v_pos: Vec2.make(100, 0) })

    this.make(GhostCircle)
  }
}

class Background extends WithPlays {

  _draw() {
    if (this.plays.on_beat_lee(8, [0, 1])) {
      let { x, y } = v_screen.half
      let r = (this.plays.beat_ms[0] + 1) % 8
      let s = r === 1 ? 2 : 1
      let i = Math.sin(this.life * 0.002 + r * 0.1)
      let c = Math.cos(this.life * 0.002 + s * 0.1)


      this.camera.fc(colors.flash, x + i * x, y + c * y, 180 * r * c)
      this.camera.fc(colors.flash, x + i * i * x * 0.5, y + c * c * y, 180 * s * r * c)
      this.camera.fc(colors.flash, x + i * c * i * x, y + i * c * y * c, 180 * r * s * s * c)
      this.camera.fc(colors.flash, x + c * c * c * i * x, y + i * c * y * c, 180 * r * s * r * i)
    }
  }
}

//red xy .6 white xy .3 black xy
//white xy .5 red xy .4 black xy

export default class AllPlays extends PlayMakes {

  all(Ctor: any) {
    return this.objects.filter(_ => _ instanceof Ctor)
  }

  one(Ctor: any, o = this.objects) {
    return o.findLast(_ => _ instanceof Ctor)
  }

  _shake = 0

  shake(radius) {
    this._shake = this._shake * 0.6 + radius
  }

  get beat_ms() {
    return this.one(BPM)?.beat_ms
  }

  on_beat_lee(sub: number, lee: Array<number> = [0, 1, 2]) {
    return this.beat_ms !== undefined && on_interval_lee(sub, ...this.beat_ms, lee)
  }

  on_beat(sub: number) {
    return this.beat_ms !== undefined && on_interval(sub, ...this.beat_ms)
  }

  _init() {

    this.camera = new Camera(this.g, w/1920)

    this.objects = []
    this.ui = []

    this.make(Audio)
    this.make(Background)

    this.make(Spawn)

    //return
    /*
    this.make(LineLine, {
      apply: () => ({
        v_pos: Vec2.make(0, 0),
        line: Line.make(...rnd_vec(v_screen).vs, ...rnd_vec(v_screen).vs),
        color: colors.red
      })
    }, ticks.sixth, 0)


   */
    //this.make(Cylinder, { v_pos: Vec2.make(0, 0) }, ticks.seconds * 4, 0)
    //this.make(Cylinder, { v_pos: Vec2.make(100, 0) })
    
    this.make(Letters, {
      text: 'die in',
      v_pos: Vec2.make(100, 100)
    })

    this.make(Area, { x: v_screen.half.x, y: v_screen.half.y, color: colors.gray, radius: 1000 }, ticks.seconds * 8, 0)
    
    /*
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

   */
  }

  _update(dt: number, dt0: number) {

    if (this.on_beat_lee(4, [0, 1])) {
      if (this._shake > 0) {
        this.camera.shake(arr_shuffle(_is, random), arr_shuffle(_is, random), this._shake)
        this._shake = 0
      }
    }

    this.camera.update(dt, dt0)

    this.objects.forEach(_ => _.update(dt, dt0))
    this.ui.forEach(_ => _.update(dt, dt0))
  }
  _draw() {
    this.objects.forEach(_ => _.draw())
    this.ui.forEach(_ => _.draw())
  }
}
