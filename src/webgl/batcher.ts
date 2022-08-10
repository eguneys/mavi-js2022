import vSource from './default.vert'
import fSource from './default.frag'
import { color_rgb } from './util'
import { Rectangle, Matrix } from '../vec2'
import { Quad } from './quad'

const m_template = Matrix.identity.scale(640, 360)

export class Batcher {

  nb = 24000
  _els = []
  _indexBuffer = new Uint16Array(this.nb * 3)
  _attributeBuffer = new Float32Array(this.nb * 9)

  _programs = new Map()

  constructor(readonly g: Graphics) {}

  init(bg) {
    let { g, nb } = this
    let def = g.glProgram(vSource, fSource, nb)

    g.glOnce({
      color: bg
    })
    this._programs.set('default', def)

  }

  fr(color: number, r: number, x: number, y: number, w: number, h: number, hollow: number) {

    let res = m_template.translate(-w/2, -h/2).rotate(r).translate(x, y)
    let quad = Quad.make(w, h, 0, 0, m_template.a, m_template.d)

    this._els.push([res, color, quad, 0, hollow])
  }

  fc(color: number, x: number, y: number, r: number, hollow: number) {
    let w = r,
      h = r
    let res = m_template.translate(x-w/2, y-h/2)
    let quad = Quad.make(w, h, 0, 0, m_template.a, m_template.d)
    this._els.push([res, color, quad, 1, hollow])
  }

  render() {

    let { g } = this
    let { _indexBuffer, _attributeBuffer } = this


    let { program, uniformData, indexBuffer, attributeBuffer, vao } = this._programs.get('default')

    g.glUse(program, uniformData)

    g.glClear()

    let aIndex = 0,
      iIndex = 0

    this._els.forEach((_, i) => {
      let [matrix, color, quad, type, type2] = _

      let el = Rectangle.unit.transform(matrix)
      let { vertexData, indices } = el
      let { fsUv } = quad

      let tintData = color_rgb(color)

      for (let k = 0; k < vertexData.length; k+= 2) {
        _attributeBuffer[aIndex++] = vertexData[k]
        _attributeBuffer[aIndex++] = vertexData[k+1]

        _attributeBuffer[aIndex++] = fsUv[k]
        _attributeBuffer[aIndex++] = fsUv[k+1]

        _attributeBuffer[aIndex++] = tintData[0]
        _attributeBuffer[aIndex++] = tintData[1]
        _attributeBuffer[aIndex++] = tintData[2]

        _attributeBuffer[aIndex++] = type
        _attributeBuffer[aIndex++] = type2
      }

      for (let k = 0; k < indices.length; k++) {
        _indexBuffer[iIndex++] = i * 4 + indices[k]
      }
    })

    this._els = []

    g.glAttribUpdate(attributeBuffer, _attributeBuffer)
    g.glIndexUpdate(indexBuffer, _indexBuffer)

    g.glDraw(iIndex, vao)
  }

}
