import { Soli2d, loop } from 'soli2d'
import sprites_png from '../assets/sprites.png'
import App from './app'

function load_image(path: string) {
  return new Promise(resolve => {
    let res = new Image()
    res.onload = () => resolve(res)
    res.src = path
  })
}

export default function app(element: HTMLElement) {


  load_image(sprites_png).then(image => {
    let [render, stage, $canvas] = Soli2d(element, image, 320, 180)

    App(render, image, stage)
  })


}
