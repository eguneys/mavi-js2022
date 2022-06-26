
export type Direction = 1 | -1 | 0
export type NumberPair = [number, number]


export type MouseDrag = {
  button: number;
  start: NumberPair;
  r_move?: NumberPair;
  move?: NumberPair;
  move0?: NumberPair;
  drop?: NumberPair;
}

export type MouchEvent = Event & Partial<MouseEvent & TouchEvent>

export function eventPosition(e: MouchEvent): [number, number] | undefined {
  if (e.clientX !== undefined && e.clientY !== undefined) {
    return [e.clientX, e.clientY]
  }
  if (e.targetTouches?.[0]) {
    return [e.targetTouches[0].clientX, e.targetTouches[0].clientY]
  }
}

function move_threshold(move: NumberPair, start: NumberPair) {
  let dx = move[0] - start[0],
    dy = move[1] - start[1]

  let length = Math.sqrt(dx * dx + dy * dy)

  return length > 3 
}

export default class Mouse {

  _wheel: Direction = 0
  _wheel0: Direction = 0


  _drag?: MouseDrag
  _drag0?: MouseDrag
  _drag1?: MouseDrag
  _drop0?: MouseDrag

  _hover?: NumberPair

  _bounds: ClientRect


  get bounds() {
    if (!this._bounds) {
      this._bounds = this.$canvas.getBoundingClientRect()
    }
    return this._bounds
  }

  get wheel() {
    return this._wheel
  }

  get drag() {
    if (!!this._drag?.move) {
      return this._drag
    }
  }

  get click() {
    if (!this._drag?.move && !!this._drag?.drop) {
      return this._drag.drop
    }
  }

  get lclick() {
    if (this._drag?.button === 0) {
      return this.click
    }
  }

  get rclick() {
    if (this._drag?.button === 2) {
      return this.click
    }
  }

  get click_down() {
    if (!this._drag0 && !!this._drag && !this._drag?.move && !this._drag?.drop) {
      return this._drag.start
    }
  }

  get hover() {
    if (!this._drag) {
      return this._hover
    }
  }

  get drag_delta() {
    if (!!this._drag?.move) {

      return [this._drag.move[0] - this._drag.start[0],
        this._drag.move[1] - this._drag.start[1]]
    }
  }

  constructor(readonly $canvas: HTMLElement) { }


  eventPosition(e: MouchEvent) {
    let res = eventPosition(e)

    let { bounds } = this

    let scaleX = 64 / bounds.width,
      scaleY = 64 / bounds.height

    if (res) {
      res[0] -= bounds.left
      res[1] -= bounds.top

      res[0] *= scaleX
      res[1] *= scaleY
    }


    return res
  }

  disposes: Array<Handler> = []
  dispose() {
    this.disposes.forEach(_ => _())
  }

  init() {

    let { $canvas, disposes } =  this

    $canvas.addEventListener('wheel', ev => {
      this._wheel = Math.sign(ev.deltaY)
    })

    $canvas.addEventListener('mousedown', ev => {
      if (!this._drag) {
        this._drag1 = {
          button: ev.button,
          start: this.eventPosition(ev)
        }
      }
    })


    $canvas.addEventListener('mousemove', ev => {
      if (this._drag) {
        this._drag.r_move = this.eventPosition(ev)
      } else {
        this._hover = this.eventPosition(ev)
      }
    })

    $canvas.addEventListener('contextmenu', ev => {
      ev.preventDefault()
      if (!this._drag) {
        this._drag1 = {
          button: ev.button,
          start: this.eventPosition(ev)
        }
      }
    })

    let onMouseUp = ev => {
      if (this._drag) {
        this._drag.drop = this.eventPosition(ev)
        this._drop0 = this._drag
      }
    }
    document.addEventListener('mouseup', onMouseUp)

    disposes.push(() => document.removeEventListener('mouseup', onMouseUp))

    const onScroll = () => {
      this._bounds = undefined
    }
    window.addEventListener('resize', onScroll)
    document.addEventListener('scroll', onScroll)

    disposes.push(() => window.removeEventListener('resize', onScroll))
    disposes.push(() => document.removeEventListener('scroll', onScroll))

    return this
  }

  update(dt: number, dt0: number) {
    if (this._wheel0 === this._wheel) {
      this._wheel = 0
    } else {
      this._wheel0 = this._wheel
    }

    if (this._drag) {
      this._drag.move0 = this._drag.move
      if (this._drag.r_move !== undefined) {
        if (this._drag.move || move_threshold(this._drag.r_move, this._drag.start)) {
          this._drag.move = this._drag.r_move
        }
      }
      if (!this._drop0) {
        if (this._drag.drop) {
          this._drag1 = undefined
        }
      } else {
        this._drop0 = undefined
      }
    }


    this._drag0 = this._drag
    if (this._drag1 !== this._drag) {
      this._drag = this._drag1
    }
  }
}
