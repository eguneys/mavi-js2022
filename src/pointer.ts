import { Vec2 } from './vec2'
import JPR from './jpr'

export interface BindAdapter {
  onMove: (v: Vec2) => void;
  onClick: () => void;
  onDown: () => void;
  onUp: () => void;
  onPointerLock: () => void;
  onPointerUnlock: () => void;
}

export function bind_pointer($element) {
  return (hooks: BindAdapter) => {

    let { onPointerUnlock, onPointerLock, onClick, onDown, onUp } = hooks

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
      onPointerLock()
      document.addEventListener('mousemove', onMove, false)
    }, () => {
      onPointerUnlock()
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

  j_lock = new JPR()
  j_down= new JPR()

  onPointerLock = () => {
    this.j_lock._on()
  }

  onPointerUnlock = () => {
    this.j_lock._off()
  }

  onMove = (v: Vec2) => {

    let { pos, bounds } = this

    pos.add_in(v)

    pos.x = Math.min(bounds.x, Math.max(0, pos.x))
    pos.y = Math.min(bounds.y, Math.max(0, pos.y))
  }

  onClick = () => {}

  onDown = () => {
    this.j_down._on()
  }

  onUp = () => { 
    this.j_down._off()
  }

  get just_lock() {
    return this.j_lock.just_on
  }

  get just_unlock() {
    return this.j_lock.just_off
  }
  
  get been_lock() {
    return this.j_lock.been_on
  }

  get just_on() {
    return this.j_down.just_on
  }

  get just_off() {
    return this.j_down.just_off
  }

  get been_on() {
    return this.j_down.been_on
  }

  update(dt: number, dt0: number) {
    this.j_down.update(dt, dt0)
    this.j_lock.update(dt, dt0)
  }

  init(device: BindDevice) {
    device(this)
    return this
  }
}
