import Graphics from './graphics'

export default function app(element: HTMLElement) {

  let w = 320 * 2
  let h = 180 * 2
  let canvas = document.createElement('canvas')
  let ctx = canvas.getContext('2d')
  canvas.width = w
  canvas.height = h
  element.appendChild(canvas)
  ctx.imageSmoothingEnabled = true

  let g = new Graphics(w, h, ctx)

  g.clear()

  g.fr(0, 0, w, h, 'lightblue')

  g.flush()

  g.fc(150, 50, 50, 'lightyellow')
  g.fc(0, 30, 150, 'lightyellow')

  g.flush()
}
