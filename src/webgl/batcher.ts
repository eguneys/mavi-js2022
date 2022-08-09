import vSource from './default.vert'
import fSource from './default.frag'

export class Batcher {

  nb = 24000
  _els = []
  _indexBuffer = new Uint16Array(this.nb * 3)
  _attributeBuffer = new Float32Array(this.nb * 6)

  _programs = new Map()

  constructor(readonly g: Graphics) {}

  init() {
    let { g, nb } = this
    let def = g.glProgram(vSource, fSource, nb)

    g.glOnce({
      color: 0x1099bb
    })
    this._programs.set('default', def)

  }

  render() {

    let { g, nb } = this
    let { _indexBuffer, _attributeBuffer } = this


    let { program, uniformData, indexBuffer, attributeBuffer, vao } = this._programs.get('default')

    g.glUse(program, uniformData)

    g.glClear()

    let aIndex = 0,
      iIndex = 0

    this._els.map(matrix => Rectangle.unit.transform(matrix)).forEach((el, i) => {

      let { vertexData, indices } = el

      let tintData = color_rgb(0x00ff00)

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
        _indexBuffer[iIndex++] = i * 4 + indices[k]
      }
    })

    g.glAttribUpdate(attributeBuffer, _attributeBuffer)
    g.glIndexUpdate(indexBuffer, _indexBuffer)

    g.glDraw(nb * 4, vao)
  }

}
