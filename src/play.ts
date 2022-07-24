import { ticks } from './shared'
import { completed, read, update, tween } from './anim'
import { Vec2 } from './vec2'
import { make_sticky_pos } from './make_sticky'
import { steer_behaviours, b_arrive_steer } from './rigid'

/* https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript */
const make_random = (seed = 1) => {
  return () => {
    var x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  }
}
const random = make_random()

let v_screen = Vec2.make(1920, 1080)

function rnd_vec_h(rng: RNG = random) {
  return Vec2.make(rnd_h(rng), rnd_h(rng))
}

function rnd_vec(mv: Vec2 = Vec2.unit, rng: RNG = random) {
  return Vec2.make(rng(), rng()).mul(mv)
}

function rnd_h(rng: RNG = random) {
  return rng() * 2 - 1
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

  on_interval(t: number) {
    return Math.floor(this.life0 / t) !== Math.floor(this.life / t)
  }

  abstract _init(): void;
  abstract _update(dt: number, dt0: number): void;
  abstract _draw(): void;
}

abstract class WithPlays extends Play {

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


  dispose() {
    let { group } = this.data
    if (group) {
      arr_remove(group, this)
    }
    this.on_dispose.forEach(_ => _(this))
    this._dispose()
  }


  abstract _dispose(): void;
}


class Cylinder extends WithPlays {

  _init() {


    let { v_pos } = this.data
    this._cursor = this.plays.one(Cursor)

    this.v_target = this._cursor.pursue_target

    this._bh = steer_behaviours(v_pos, {
      mass: 1000,
      air_friction: 0.9,
      max_speed: 100,
      max_force: 3
    }, [[b_arrive_steer(this.v_target), 1]])
  }

  _update(dt: number, dt0: number) {
    let { x, y } = this._cursor.pursue_target
    this.v_target.set_in(x, y)
    this._bh.update(dt, dt0)
  }

  _draw() {
    let { vs, side } = this._bh._body
    this.g.queue('darkred', true, this.g._frr, side.angle, vs.x, vs.y, 40, 80, 18)
  }


  _dispose() {}
}

class Cursor extends WithPlays {

  get pursue_target() {
    return this._bh._body.vs
  }

  _init() {
    let { v_pos } = this.data
    this.v_target = Vec2.make(100, 100)

    this._bh = steer_behaviours(v_pos, {
      mass: 1000,
      air_friction: 1,
      max_speed: 30,
      max_force: 50
    }, [[b_arrive_steer(this.v_target), 1]])
  }

  _update(dt: number, dt0: number) {
    this.v_target.set_in(this.m.pos.x, this.m.pos.y)
    this._bh.update(dt, dt0)
  }

  _draw() {
    let { vs } = this._bh._body
    this.g.queue('lightyellow', true, this.g._fc, 0, vs.x, vs.y, 30, 30, 30)
  }


  _dispose() {}
}

class VanishDot extends WithPlays {

  _init() {
    let radius = 300
    this._rt = tween([0, 1].map(_ => _ * radius), [arr_rnd([ticks.three * 2, ticks.five * 2])])
  }

  _update(dt: number, dt0: number) {
    update(this._rt, dt, dt0)

    let { v_pos, v_dir } = this.data
    let [radius] = read(this._rt)
    v_pos.add_in(v_dir.scale((300 - radius) * 0.5))

    if (completed(this._rt)) {
      this.dispose()
    }
  }

  _draw() {
    let { v_pos, x, y, color } = this.data
    this.g.queue(color, true, this.g._fc, v_pos.x + x + x, v_pos.y + y, 30)
  }


  _dispose() {
  }
}

class VanishCircle extends WithPlays {

  _init() {
    let { radius } = this.data
    this._rt = tween([0.8, 0.8, 1, 0.2].map(_ => _ * radius), [ticks.five, ticks.three * 2, ticks.three * 2])

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


class Explode extends WithPlays {


  _init() {

    this.make(VanishCircle, {
      v_pos: v_screen.half,
      x: 0,
      y: 0,
      radius: 100,
      color: 'red'
    })
  }

  _update(dt: number, dt0: number) {}

  _draw() {}

}


//red xy .6 white xy .3 black xy
//white xy .5 red xy .4 black xy

export default class AllPlays extends Play {


  all(Ctor: any) {
    return this.objects.filter(_ => _ instanceof Ctor)
  }

  one(Ctor: any) {
    return this.objects.find(_ => _ instanceof Ctor)
  }

  make(Ctor: any, data: any, delay: number = 0, repeat: number = 1) {
    this.makes.push([Ctor, data, delay, repeat, 0, 0])
  }

  _init() {

    this.makes = []

    this.objects = []

    this.make(Cursor, { v_pos: Vec2.make(100, 0) })

    this.make(Cylinder, { v_pos: Vec2.make(0, 0) }, ticks.seconds * 10, 0)
    this.make(Cylinder, { v_pos: Vec2.make(100, 0) })
    this.make(Cylinder, { v_pos: Vec2.make(200, 0) })

    this.make(Explode, {})
  }

  _update(dt: number, dt0: number) {

    this.makes = this.makes.filter(_ => {

      _[4] += dt

      let [Ctor, data, _delay, _repeat, _t, _i_repeat] = _

      if (_t >= _delay) {
        new Ctor(this)._set_data({
          group: this.objects,
          ...data,
          _delay,
          _repeat,
          _t,
          _i_repeat
        }).init()

        _[4] = 0
        _[5]++;

        if (_repeat === 0 || _[5] < _repeat) {
          return true
        }
      } else {
        return true
      }
    })

    this.objects.forEach(_ => _.update(dt, dt0))
  }
  _draw() {
    this.objects.forEach(_ => _.draw())
  }
}
