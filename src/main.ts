import Graphics from './graphics'


export default function app(element: HTMLElement) {


  let width = 320
  let height = 180
  let canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  element.appendChild(canvas)

  let ctx = canvas.getContext('2d')
  let g = new Graphics(width, height, ctx)
  let b = g.buffers


  function flush() {
    g.renderSource = b.Background
    g.renderTarget = b.Screen
    g.spr()


    g.renderSource = b.Foreground
    g.renderTarget = b.Screen
    g.spr(0, 0, width, height, 4, 4, false, false, 30)

    g.renderSource = b.Foreground
    g.renderTarget = b.Screen
    g.spr()
  }

  function clear() {
    g.renderTarget = b.Background
    g.clear(0)
    g.renderTarget = b.Foreground
    g.clear(0)
    g.renderTarget = b.Screen
    g.clear(0)
  }

  clear()


  g.renderTarget = b.Background
  g.fr(0, 0, width, height, 23)

  g.renderTarget = b.Foreground
  g.fillCircle(100, 100, 20, 20)
  g.fillCircle(300, 0, 100, 20)


  flush()
  g.render()
}
