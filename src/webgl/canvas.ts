export class Canvas {
  $canvas: HTMLCanvasElement

  gl?: WebGL2RenderingContext

  constructor(readonly $wrap: HTMLElement,
              readonly width: number,
              readonly height: number) {
                this.$canvas = document.createElement('canvas')

                this.$canvas.width = width
                this.$canvas.height = height

                $wrap.appendChild(this.$canvas)

                let gl = this.$canvas.getContext('webgl2', { alpha: true, antialias: false });
                this.gl = gl
              }

}
