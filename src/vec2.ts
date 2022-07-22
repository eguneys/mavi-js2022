export class Vec2 {

  static from_angle = (n: number) =>
    new Vec2(Math.cos(n), Math.sin(n))

  static make = (x: number, y: number) =>
    new Vec2(x, y)

  static get unit() { return new Vec2(1, 1) }
  static get zero() { return new Vec2(0, 0) }

  get vs(): Array<number> {
    return [this.x, this.y]
  }

  get mul_inverse(): Vec2 {
    return new Vec2(1/this.x, 1/this.y)
  }

  get inverse(): Vec2 {
    return new Vec2(-this.x, -this.y)
  }

  get half(): Vec2 {
    return new Vec2(this.x/2, this.y/2)
  }

  get length_squared() {
    return this.x * this.x + this.y * this.y
  }

  get length() {
    return Math.sqrt(this.length_squared)
  }

  get normalize() {
    if (this.length === 0) {
      return Vec2.zero
    }
    return this.scale(1/this.length)
  }

  get perpendicular() {
    return new Vec2(-this.y, this.x)
  }

  get clone(): Vec2 {
    return new Vec2(this.x, this.y)
  }

  get angle(): number {
    return Math.atan2(this.y, this.x)
  }

  constructor(readonly x: number, 
    readonly y: number) { }


  dot(v: Vec2) {
    return this.x * v.x + this.y * v.y
  }

  cross(v: Vec2) {
    return this.x * v.y - this.y * v.x
  }



  project_to(v: Vec2) {
    let lsq = v.length_squared
    let dp = this.dot(v)
    return Vec2.make(dp * v.x / lsq, dp * v.y / lsq)
  }

  distance(v: Vec2) {
    return this.sub(v).length
  }

  addy(n: number) {
    return Vec2.make(this.x, this.y + n)
  }

  add_angle(n: number) {
    return Vec2.from_angle(this.angle + n)
  }

  scale(n: number) {
    let { clone } = this
    return clone.scale_in(n)
  }

  scale_in(n: number) {
    this.x *= n
    this.y *= n
    return this
  }

  add(v: Vec2) {
    let { clone } = this
    return clone.add_in(v)
  }

  add_in(v: Vec2) {
    this.x += v.x
    this.y += v.y
    return this
  }


  sub(v: Vec2) {
    let { clone } = this
    return clone.sub_in(v)
  }

  sub_in(v: Vec2) {
    this.x -= v.x
    this.y -= v.y
    return this
  }

  mul(v: Vec2) {
    let { clone } = this
    return clone.mul_in(v)
  }

  mul_in(v: Vec2) {
    this.x *= v.x
    this.y *= v.y
    return this
  }

  div(v: Vec2) {
    let { clone } = this
    return clone.div_in(v)
  }

  div_in(v: Vec2) {
    this.x /= v.x
    this.y /= v.y
    return this
  }

  set_in(x: number, y: number = this.y) {
    this.x = x
    this.y = y
    return this
  }

}

