export default class Graphics {
  constructor(readonly width: number,
    readonly height: number,
    readonly ctx: Canvas2DRenderingContext) {

    this._queues = {}
    this._squeues = {}
  }

  clear() {
    this.ctx.clearRect(0, 0, this.width, this.height)
  }

  _fr = (x: number, y: number, w: number, h: number) => {
    this.ctx.fillRect(x, y, w, h)
  }


  _fc = (x: number, y: number, w: number, h: number, r: number) => {
    this.ctx.beginPath()
    this.ctx.arc(x, y, r, 0, 2 * Math.PI, false)
    this.ctx.fill()
  }


  /* https://stackoverflow.com/questions/1255512/how-to-draw-a-rounded-rectangle-using-html-canvas */
  _frr = (x: number, y: number, w: number, h: number, r: number) => {
    this.ctx.beginPath()
    this.ctx.moveTo(x + r, y)
    this.ctx.arcTo(x+w, y,   x+w, y+h, r);
    this.ctx.arcTo(x+w, y+h, x,   y+h, r);
    this.ctx.arcTo(x,   y+h, x,   y,   r);
    this.ctx.arcTo(x,   y,   x+w, y,   r);
    this.ctx.fill()
  }

  queue(color: string, shadow: boolean, ...rest) {
    let queues = shadow ? this._squeues : this._queues
    if (!queues[color]) {
      queues[color] = []
    }
    queues[color].push(rest)
  }

  flush() {

    let off = 8
    this.ctx.fillStyle = 'black'
    Object.keys(this._squeues).map(color => {
      let _queue = this._squeues[color]
      _queue.forEach(_ => {
        let [_f, r, x, y, w, h, ...rest] = _
        x = x + off - x * 0.008
        y = y + off - y * 0.008

        draw_ctx(this.ctx, _f, r, x, y, w, h, ...rest)
      })
    })

    Object.keys(this._squeues).map(color => {

      this.ctx.fillStyle = color

      let _queue = this._squeues[color]
      _queue.forEach(_ => draw_ctx(this.ctx, ..._))
    })


    Object.keys(this._queues).map(color => {

      this.ctx.fillStyle = color

      let _queue = this._queues[color]
      _queue.forEach(_ => draw_ctx(this.ctx, ..._))
    })

    this._squeues = {}
    this._queues = {}
  }

}


function draw_ctx(ctx: Canvas2DRenderingContext, _f: any, r: number, x: number, y: number, w: number, h: number, ...rest: any) {

  let tx = x + w / 2, 
    ty = y + h / 2
  ctx.translate(tx, ty)
  ctx.rotate(r)
  ctx.translate(-tx, -ty)
  _f(x, y, w, h, ...rest)
  ctx.resetTransform()
}
