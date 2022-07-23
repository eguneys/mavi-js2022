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


abstract class PlayObjects extends Play {

  init() {
    this.pre_objects = []
    this.objects = []
    this.objects2 = []
    return super.init()
  }


  update(dt: number, dt0: number) {
    this.pre_objects.forEach(_ => _.update(dt, dt0))
    super.update(dt, dt0)
    this.objects.forEach(_ => _.update(dt, dt0))
    this.objects2.forEach(_ => _.update(dt, dt0))
  }


  draw() {
    this.pre_objects.forEach(_ => _.draw())
    this.g.flush()
    super.draw()
    this.g.flush()
    this.objects.forEach(_ => _.draw())
    this.g.flush()
    this.objects2.forEach(_ => _.draw())
    this.g.flush()
  }
}

abstract class PlayMakes extends PlayObjects {

  init() {
    this.makess = []
    return super.init()
  }

  update(dt: number, dt0: number) {
    let makes = this.makess.pop()

    if (makes) {
      let [[_make, rest], _pos, _on_dispose] = makes
      let _rest = rest.map(_ => arr_rnd(_))
      let res = _make.make(this, this.objects, _pos, ..._rest)
      res.on_dispose.push(_on_dispose)
    }
    super.update(dt, dt0)
  }
}

abstract class WithPlays extends PlayMakes {

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



class Cursor extends WithPlays {

  static make = (base, group, v_pos: Vec2) => {
    return new Cursor(base)._set_data({ 
      group,
      v_pos
    }).init()
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
    this.g.fc(vs.x, vs.y, 30, 'lightyellow')
  }


  _dispose() {}
}

class VanishDot extends WithPlays {

  static make = (base, group, v_pos: Vec2, x, y, v_dir: Vec2, color) => {
    return new VanishDot(base)._set_data({ 
      group,
      v_pos,
      v_dir,
      x,
      y,
      color }).init()
  }

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
    this.g.fc(v_pos.x + x, v_pos.y + y, 30, color)
  }


  _dispose() {
  }
}

class VanishCircle extends WithPlays {

  static make = (base, group, v_pos: Vec2, x, y, radius, color) => {
    return new VanishCircle(base)._set_data({ 
      group,
      v_pos,
      x,
      y,
      radius: radius + 100, 
      color }).init()
  }

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
    this.g.fc(v_pos.x + x, v_pos.y + y, radius, color)
  }


  _dispose() {
  }
}

class MakeSpam extends WithPlays {
  static make = (base, group, v_pos: Vec2, levels: Levels, delays: Array<number>, poss: Array<Vec2> = []) => {
    return new MakeSpam(base)._set_data({
      poss,
      levels,
      delays,
      group,
      v_pos
    }).init()
  }


  _init() {
  const push_level = (levels, poss) => {
      let level = levels.shift()
      let pos = poss.shift() || Vec2.zero
      if (level) {
        let delay = [DelayDispose, [this.data.delays]]
        this.makess.push([level, pos, _ => {}])
        this.makess.push([delay, pos, _ => { push_level(levels, poss) }])
      } else {
        this.dispose()
      }
    }
    push_level(this.data.levels, this.data.poss)
  }

  _update(dt: number, dt0: number) {}

  _draw() {}

  _dispose() {}
}
class MakeSeries extends WithPlays {
  static make = (base, group, v_pos: Vec2, levels: Levels, poss: Array<Vec2> = []) => {
    return new MakeSeries(base)._set_data({
      poss,
      levels,
      group,
      v_pos
    }).init()
  }


  _init() {
  const push_level = (levels, poss) => {
      let level = levels.shift()
      let pos = poss.shift() || Vec2.make(0, 0)
      if (level) {
        this.makess.push([level, pos, _ => {
          push_level(levels, poss)
        }])
      } else {
        this.dispose()
      }
    }
    push_level(this.data.levels, this.data.poss)
  }

  _update(dt: number, dt0: number) {}

  _draw() {}

  _dispose() {}
}

class DelayDispose extends WithPlays {

  static make = (base, group, v_pos: Vec2, delay: number) => {
    return new DelayDispose(base)._set_data({ 
      delay,
      group,
      v_pos
    }).init()
  }

  _init() {}

  _update(dt: number, dt0: number) {
    if (this.on_interval(this.data.delay)) {
      this.dispose()
    }
  }

  _draw() {}

  _dispose() {}
 
}

let delay = [DelayDispose, [[ticks.sixth]]]



class ExCloud extends WithPlays {

  static make = (base, group, v_pos: Vec2) => {
    return new ExCloud(base)._set_data({ 
      group,
      v_pos
    }).init()
  }

  _init() {
    let radiuss = [0, 30, 50]
    let xs = [0, 10, 20]
    let ys = [0, 10, 20]
    let red_vanish_circle = [VanishCircle, [xs, ys, radiuss, ['red']]]
    let white_vanish_circle = [VanishCircle, [xs, ys, radiuss, ['white']]]

    let spam = [MakeSpam, 
      [[[white_vanish_circle, red_vanish_circle]], 
        [[ticks.sixth, ticks.three * 2]], 
        [[this.data.v_pos, this.data.v_pos]]]]
    this.makess.push([spam, this.data.v_pos, () => {
      this.dispose()
    }])


    let red_dot = [VanishDot, [xs, ys, [rnd_vec_h(), rnd_vec_h(), rnd_vec_h()], ['red']]]
    this.makess.push([red_dot, this.data.v_pos.clone, () => {}])
  }

  _update(dt: number, dt0: number) {}

  _draw() {}

  _dispose() {}


}


let excloud = [ExCloud, []]

class Level1 extends WithPlays {

  static make = (base, group, v_pos: Vec2) => {
    return new Level1(base)._set_data({ 
      group,
      v_pos
    }).init()
  }

  _init() {

    this.makess.push([delay, Vec2.zero, _ => {
      this.dispose()
    }])

    let levels = [...Array(100)].map(_ => excloud)
    let delays = [ticks.three * 2, ticks.three, ticks.five, ticks.seconds, ticks.half]
    let poss = [...Array(100)].map(_ => rnd_vec(v_screen).scale(0.8)
                                  .add(v_screen.scale(0.1)))
    let makemake = [MakeSpam, [[levels], [delays], [poss]]]

    this.makess.push([makemake, Vec2.zero, _ => {
      this.dispose()
    }])

  }

  _update(dt: number, dt0: number) {}

  _draw() {}

  _dispose() {}
}


class Level2 extends WithPlays {

  static make = (base, group, v_pos: Vec2) => {
    return new Level2(base)._set_data({ 
      group,
      v_pos
    }).init()
  }

  _init() {


    this.makess.push([[Cursor, []], Vec2.unit, () => {}])

  }

  _update(dt: number, dt0: number) {}

  _draw() {}
}


let level1 = [Level1, []]
let level2 = [Level2, []]

let levels = [level1, level2]

let make_levels = [MakeSeries, [[levels]]]

//red xy .6 white xy .3 black xy
//white xy .5 red xy .4 black xy

export default class AllPlays extends PlayMakes {

  _init() {

    this.makess.push([make_levels, Vec2.make(0, 0), _ => {}])
  }

  _update(dt: number, dt0: number) {}
  _draw() {}
}
