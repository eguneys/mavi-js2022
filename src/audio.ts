import { ticks } from './shared'
/* https://github.com/eguneys/vsound */

let data = [
  [5,4661,1329,4661,1329,4661,1329,4661,1329,4661,1329,4661,1329,4660,1329,4660,1329,4660,1329,4660,1073,4660,1329,4660,1329,4661,1329,4661,1329,4661,1329,4661,1329,4661,819,565,1073,565,1073,565,1073,565,1073,565,819,565,817,565,819,565,819,565,563,565,307,565,307,565,307,565,307,565,307,565,307]
]

let sfx = VSound(data)

let cool = 0

export default function psfx(n: number) {

  if (cool <= 0) {
    sfx(n)
  }
  cool += ticks.sixth

  if (cool > ticks.seconds * 2) {
    cool = 0
  }
}
