export default function Canvas($wrap: HTMLElement) {
  this.$canvas = document.createElement('canvas')

  this.$canvas.width = 1920
  this.$canvas.height = 1080

  $wrap.appendChild(this.$canvas)

  this.gl = this.$canvas.getContext('webgl2', { alpha: true, antialias: false });
}
