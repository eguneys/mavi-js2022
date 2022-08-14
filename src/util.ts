
/* https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array */
export function arr_shuffle(a: Array<A>, rng: RNG, b, c, d) {
  c=a.length;while(c)b=rng()*c--|0,d=a[c],a[c]=a[b],a[b]=d;
  return a
}


