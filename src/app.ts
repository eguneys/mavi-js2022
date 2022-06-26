import { Quad, Transform, loop } from 'soli2d'
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


  let $new = Template.clone

  $new._set_parent(stage)

  $effect(() => {
    mavi.$new.forEach(_ => 
                      Anim(_))
  })




  function Anim(_: any) {

    let anim = Template.clone

    $effect(() => 
            anim.quad = Quad.make(image, ..._.qs))
    $effect(() => anim.x = _.x)
    $effect(() => anim.y = _.y)

    $effect(() => {
      anim._remove()
      anim._set_parent(_.parent)
    })
  }
}

export default App
