import { ticks } from './shared'
import { read, update, tween } from './anim'


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


class WithPlays extends Play {

  constructor(readonly plays: AllPlays) {
    super(plays.ctx)
  }
}

class VanishCircle extends WithPlays {

  _init() {
    let { radius } = this.data
    this._rt = tween([0.8, 0.8, 1, 0.2].map(_ => _ * radius), [ticks.sixth, ticks.sixth, ticks.sixth])
  }

  _update(dt: number, dt0: number) {
    update(this._rt, dt, dt0)
  }

  _draw() {
    let [radius, completed] = read(this._rt)

    if (!completed) {
      console.log(radius)
    }
    this.g.fc(500, 500, radius, 'red')
  }
}

export default class AllPlays extends Play {

  _init() {

    this.objects = []
    
    this.objects.push(new VanishCircle(this)._set_data({ radius: 100}).init())
  }

  _update(dt: number, dt0: number) {
    this.objects.forEach(_ => _.update(dt, dt0))
  }

  _draw() {
    this.objects.forEach(_ => _.draw())
  }

}
