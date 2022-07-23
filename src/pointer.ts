import { Vec2 } from './vec2'

export interface BindAdapter {
  onMove: (v: Vec2) => void;
  onClick: () => void;
  onDown: () => void;
  onUp: () => void;
}

export function bind_pointer($element) {
  return (hooks: BindAdapter) => {

    let { onClick, onDown, onUp } = hooks

    const onMove = e => hooks.onMove(Vec2.make(e.movementX, e.movementY))

    const test_pointer_lock = (on_pointer_lock, on_no_lock) => {
      return () => {
        if (document.pointerLockElement === $element) {
          on_pointer_lock()
        } else {
          on_no_lock?.()
        }
      }
    } 

    let just_exited = false
    document.addEventListener('pointerlockchange', test_pointer_lock(() => {
      document.addEventListener('mousemove', onMove, false)
    }, () => {
      document.removeEventListener('mousemove', onMove, false)
      just_exited = true
      setTimeout(() => {
        just_exited = false
      }, 1600)
    }))


    $element.addEventListener('click', test_pointer_lock(onClick, () => {
      if (!just_exited) {
        $element.requestPointerLock()
      }
    }))

    $element.addEventListener('mousedown', test_pointer_lock(onDown))
    $element.addEventListener('mouseup', test_pointer_lock(onUp))
  }
}



export class Pointer implements BindAdapter {

  bounds: Vec2 = Vec2.make(1920, 1080)
  pos: Vec2 = this.bounds.half

  onMove = (v: Vec2) => {

    let { pos, bounds } = this

    pos.add_in(v)

    pos.x = Math.min(bounds.x, Math.max(0, pos.x))
    pos.y = Math.min(bounds.y, Math.max(0, pos.y))
  }

  onClick = () => {}

  onDown = () => {}

  onUp = () => {}

  update(dt: number, dt0: number) {
  }

  init(device: BindDevice) {
    device(this)
    return this
  }
}
