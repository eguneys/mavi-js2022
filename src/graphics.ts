export default class Graphics {


  constructor(readonly width: number,
    readonly height: number,
    readonly ctx: Canvas2DRenderingContext) {

    this.rects = []
    this.arcs = []
  }


  clear() {
    this.ctx.clearRect(0, 0, this.width, this.height)
  }

  _fs(color: string) {
    this.ct.fillStyle = color
  }

  _fr(x: number, y: number, w: number, h: number) {
    this.ctx.fillRect(x, y, w, h)
  }

  _fc(x: number, y: number, r: number) {
    this.ctx.beginPath()
    this.ctx.arc(x, y, r, 0, 2 * Math.PI, false)
    this.ctx.fill()
  }

  fr(...args) {
    this.rects.push(args)
  }

  fc(...args) {
    this.arcs.push(args)
  }

  flush() {

    let off = 2
    this.ctx.fillStyle = 'black'
    this.rects.forEach(_ => {
      let [x, y, w, h, color] = _
      this._fr(x + off, y + off, w, h)
    })


    this.arcs.forEach(_ => {
      let [x, y, r, color] = _
      this._fc(x + off, y + off, r)
    })


    this.rects.forEach(_ => {
      let [x, y, w, h, color] = _
      this.ctx.fillStyle = color
      this._fr(x, y, w, h)
    })


    this.arcs.forEach(_ => {
      let [x, y, r, color] = _
      this.ctx.fillStyle = color
      this._fc(x, y, r)
    })

    this.rects = []
    this.arcs = []
  }

}
