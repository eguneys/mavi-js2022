export default class Camera {


  constructor(readonly g: Graphics, readonly r: number) { }

  fr(color, _r, _x, _y, _w, _h, hollow, shadow_color = 0x000000) {
    let { r } = this
    this.g.fr(shadow_color, _r, r * _x + 2 - _x * 0.0025, r * _y + 2 - _y * 0.0025, r * _w, r * _h, hollow)
    this.g.fr(color, _r, r * _x, r * _y, r * _w, r * _h, hollow)
  }

  fc(color, _x, _y, _r, hollow, shadow_color = 0x000000, rotation = 0) {
    let { r } = this
    this.g.fc(shadow_color, r * _x + 2 - _x * 0.0025, r * _y + 2 - _y * 0.0025, r * _r, hollow, rotation)
    this.g.fc(color, r * _x, r * _y, r * _r, hollow, rotation)
  }

  line(color, a, _x, _y, _r, stroke = 10) {
    let { r } = this

    this.g.line(0xffffff, a, r * _x + 2 - _x * 0.0015, r * _y + 2 - _y * 0.0015, r * _r, stroke * r)
    this.g.line(color, a, r * _x, r * _y, r * _r, stroke * r)
  }


  texture(color: number, _r: number, x: number, y: number, w: number, h: number, sx: number, sy: number, sw: number, sh: number) {
    let { r } = this
    this.g.texture(color, _r, x * r, y * r, w * r, h * r, sx, sy, sw, sh)
  }
}
