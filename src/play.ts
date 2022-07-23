import { ticks } from './shared'
import { completed, read, update, tween } from './anim'
import { Vec2 } from './vec2'
import { make_sticky_pos } from './make_sticky'

/* https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript */
const make_random = (seed = 1) => {
  return () => {
    var x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  }
}
const random = make_random()

function rnd_vec(mx: number, my: number, rng: RNG = random) {
  return Vec2.make(rnd_int(mx, rng), rnd_int(my, rng))
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
    return Math.floor(this.life0 / t) !== Math.floor(this.life / v)
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
    let radius2 = radius * 0.8 
    this._rt = tween([0.8, 0.8, 1, 0.2].map(_ => _ * radius), [ticks.three, ticks.three * 2, ticks.three * 3])

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

class MakeMake extends WithPlays {
  static make = (base, group, v_pos: Vec2, levels: Levels, poss: Array<Vec2> = []) => {
    return new MakeMake(base)._set_data({
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
      }
    }
    push_level(this.data.levels, this.data.poss)
  }

  _update(dt: number, dt0: number) {}

  _draw() {}
}

class Level1 extends WithPlays {

  static make = (base, group, v_pos: Vec2) => {
    return new Level1(base)._set_data({ 
      group,
      v_pos
    }).init()
  }

  _init() {

    let levels = [...Array(10)].map(_ => vanish_circle)
    let poss = [...Array(10)].map(_ => rnd_vec(1920, 1080).scale(0.8)
                                  .add(Vec2.make(1920, 1080).scale(0.1)))
    let makemake = [MakeMake, [[levels], [poss]]]

    this.makess.push([makemake, Vec2.make(0, 0), _ => { }])
  }

  _update(dt: number, dt0: number) {}

  _draw() {}
}


class Level2 extends WithPlays {

  static make = (base, group, v_pos: Vec2) => {
    return new Level2(base)._set_data({ 
      group,
      v_pos
    }).init()
  }

  _init() {

  }

  _update(dt: number, dt0: number) {}

  _draw() {}
}

let colors = ['red', 'white']
let radiuss = [0, 10, 20]
let xs = [0, 10, 20]
let ys = [0, 10, 20]
let vanish_circle = [VanishCircle, [xs, ys, radiuss, colors]]


let level1 = [Level1, []]
let level2 = [Level2, []]

let levels = [level1, level2]

let make_levels = [MakeMake, [[levels]]]

//red xy .6 white xy .3 black xy
//white xy .5 red xy .4 black xy

export default class AllPlays extends PlayMakes {

  _init() {

    this.makess.push([make_levels, Vec2.make(0, 0), _ => {}])
  }

  _update(dt: number, dt0: number) {}
  _draw() {}
}
