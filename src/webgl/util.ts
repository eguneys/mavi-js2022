export type Color = number


const r_mask = 0xff0000
const g_mask = 0x00ff00
const b_mask = 0x0000ff

export function color_rgb(color: Color) {

    let r = ((color & r_mask) >> 16),
          g = ((color & g_mask) >> 8),
              b = (color & b_mask)

      return [r, g, b].map(_ => _/255)
}
