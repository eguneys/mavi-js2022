export default class Camera {


  constructor(readonly g: Graphics, readonly r: number) { }

  fr(color, _r, _x, _y, _w, _h, hollow) {
    let { r } = this
    this.g.fr(0x000000, _r, r * _x + 2 - _x * 0.0025, r * _y + 2 - _y * 0.0025, r * _w, r * _h, hollow)
    this.g.fr(color, _r, r * _x, r * _y, r * _w, r * _h, hollow)
  }

  fc(color, _x, _y, _r, hollow) {
    let { r } = this
    this.g.fc(0x000000, r * _x + 2 - _x * 0.0025, r * _y + 2 - _y * 0.0025, r * _r, hollow)
    this.g.fc(color, r * _x, r * _y, r * _r, hollow)
  }

  line(color, a, _x, _y, _r, stroke = 10) {
    let { r } = this

    this.g.line(0xffffff, a, r * _x + 2 - _x * 0.0015, r * _y + 2 - _y * 0.0015, r * _r, stroke * r)
    this.g.line(color, a, r * _x, r * _y, r * _r, stroke * r)
  }
}
