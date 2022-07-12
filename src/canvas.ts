export default function Canvas($wrap: HTMLElement) {
  this.$canvas = document.createElement('canvas')

  this.width = 1920
  this.height = 1080

  this.$canvas.width = this.width
  this.$canvas.height = this.height

  $wrap.appendChild(this.$canvas)

  this.gl = this.$canvas.getContext('webgl2', { alpha: true, antialias: false });
}
