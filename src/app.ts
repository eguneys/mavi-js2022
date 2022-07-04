import { Vec2, Quad, Transform, loop } from 'soli2d'
import Mavi from './mavi'

import { $observable, $effect } from '@maverick-js/observables'


let Template = new Transform()

const App = (render: any, image: HTMLImage, stage: Transform) => {

  const $update = $observable([16, 16])

  loop((dt, dt0) => {
    $update.set([dt, dt0])
    stage._update_world()

    render(dt, dt0)
  })


  let mavi = new Mavi($update)


  let $colors = Template.clone
  $colors._set_parent(stage)

  $effect(() => {
    console.log(mavi.$news)
    /*
    mavi.$news.forEach(_ => 
                       Anim({
                        _,
                        parent: $colors
                       }))
                      */
  })


  let bg = Anim({
    _: {
      x: 0,
      y: 0,
      qs: [2, 0, 2, 2],
      size: [320, 180]
    },
    parent: stage
  })


  function Anim(props) {

    let { _ } = props
    let anim = Template.clone

    $effect(() => 
            anim.quad = Quad.make(image, ..._.qs))
    $effect(() => anim.x = _.x)
    $effect(() => anim.y = _.y)
    $effect(() => anim.size = Vec2.make(..._.size))

    $effect(() => {
      anim._remove()
      anim._set_parent(props.parent)
    })
  }
}

export default App
