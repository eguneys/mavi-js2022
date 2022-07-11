import sprites_png from '../assets/sprites.png'
import Canvas from './canvas'
import P from './play'
import { Rectangle, Transform } from './math'

import { vSource, fSource } from './shaders'
import { color_rgb } from './util'



function load_image(path: string) {
  return new Promise(resolve => {
    let res = new Image()
    res.onload = () => resolve(res)
    res.src = path
  })
}

function loop(fn: (dt: number, dt0: number) => void) {
  let animation_frame_id
  let fixed_dt = 1000/60
  let timestamp0: number | undefined,
  min_dt = fixed_dt,
    max_dt = fixed_dt * 2,
    dt0 = fixed_dt

  let elapsed = 0

  function step(timestamp: number) {
    let dt = timestamp0 ? timestamp - timestamp0 : fixed_dt

    dt = Math.min(max_dt, Math.max(min_dt, dt))

    fn(dt, dt0)

    dt0 = dt
    timestamp0 = timestamp
    animation_frame_id = requestAnimationFrame(step)
  }
  animation_frame_id = requestAnimationFrame(step)

  return () => {
    cancelAnimationFrame(animation_frame_id)
  }
}


export default function app(element: HTMLElement) {


  load_image(sprites_png).then(image => {

    let play = new P(new Canvas(element))

    let ctx = {
      p: play
    }

    play.glOnce()
    play.glClear()

    let stage = new Transform()
    let nb = 256000

    let { program,
      uniformData,
      indexBuffer,
      attributeBuffer,
      vao } = play.glProgram(vSource, fSource, nb)

      let _indexBuffer = new Uint16Array(nb * 3)
      let _attributeBuffer = new Float32Array(nb * 6)

      let render = (dt: number, dt0: number) => {

        play.glClear()

        play.glUse(program, uniformData)


        let aIndex = 0,
          iIndex = 0,
          iNb = 0

        for (let i = 0; i < stage._flat.length; i++) {
          let el = stage._flat[i]
          let { world, tint } = el

          let {vertexData, indices } = Rectangle.unit.transform(world)

          let tintData = color_rgb(tint)

          for (let k = 0; k < vertexData.length; k+= 2) {
            _attributeBuffer[aIndex++] = vertexData[k]
            _attributeBuffer[aIndex++] = vertexData[k+1]

            _attributeBuffer[aIndex++] = 0//fsUv[k]
            _attributeBuffer[aIndex++] = 0//fsUv[k+1]

            _attributeBuffer[aIndex++] = tintData[0]
            _attributeBuffer[aIndex++] = tintData[1]
            _attributeBuffer[aIndex++] = tintData[2]
          }

          for (let k = 0; k < indices.length; k++) {
            _indexBuffer[iIndex++] = iNb * 4 + indices[k]
          }

          iNb++;
        }


        play.glAttribUpdate(attributeBuffer, _attributeBuffer)
        play.glIndexUpdate(indexBuffer, _indexBuffer)

        play.glDraw(iNb * 6, vao)
      }


      loop((dt: number, dt0: number) => {
        render(dt, dt0)
      })

  })
}
