import { $observable, $computed, $effect } from '@maverick-js/observables'

import { read, owrite } from './play'
import { make_position } from './make_util'

export default class Mavi {

  get $news() {
    return this.news.$news
  }

  constructor() {

    this.news = make_news(this)

  }

}

function make_new(mavi: Mavi, n: number) {

  let pos = make_position(0, 0)

  return {
    get x() {
      return pos.x
    },
    get y() {
      return pos.y
    }
  }
}

function make_news(mavi: Mavi) {


  let _arr = $observable([1,2,3])

  let m_news = $computed(() => read(_arr))

  setInterval(() => {
    owrite(_arr, [1,2])
  }, 1000)

  return {
    get $news() {
      return m_news()
    }
  }
}
