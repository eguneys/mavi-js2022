export default class JPR {

  _just_on = false
  _just_off = false
  _been_on = undefined

  get just_on() {
    return this._just_on
  }

  get been_on() {
    return this._been_on
  }

  get just_off() {
    return this._just_off
  }

  _on() {
    this._just_on = true
  }

  _off() {
    this._just_off = true
  }


  update(dt: number, dt0: number) {

    if (this._been_on !== undefined) {
      this._been_on += dt
    }

    if (this._just_on) {
      this._just_on = false
      this._been_on = 0
    }

    if (this._just_off) {
      this._just_off = false
      this._been_on = undefined
    }
  }

}
