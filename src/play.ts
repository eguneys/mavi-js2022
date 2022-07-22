import { ticks } from './shared'
import { completed, read, update, tween } from './anim'

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

class WithPlays extends PlayObjects {

  constructor(readonly plays: AllPlays) {
    super(plays.ctx)
  }

  init() {
    super.init()

    let { group } = this.data

    if (group) {
      group.push(this)
    }
  }


  dispose() {
    let { group } = this.data
    if (group) {
      arr_remove(group, this)
    }
  }
}

class VanishCircle extends WithPlays {

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
    let { x, y, color } = this.data
    let [radius] = read(this._rt)
    this.g.fc(x, y, radius, color)
  }
}

export default class AllPlays extends PlayObjects {

  _init() {
    new VanishCircle(this)._set_data({ 
      group: this.objects, 
      x: 100,
      y: 100,
      radius: 100, 
      color: 'red' }).init()
  }

  _update(dt: number, dt0: number) {}
  _draw() {}
}
