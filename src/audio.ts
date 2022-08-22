import { ticks } from './shared'
import MusicPlayer from './musicplayer'
import { song1, over } from './sounds'

let data = [song1, over]

let audioCtx

let sfx

export function generate(cb) {
  initAudio(data, _ => {
    sfx = VSound(_); 
    cb()
  })
}

/* https://github.com/Rybar/JS13K2022-Boilerplate/blob/main/src/js/game.js */
function initAudio(sndData, cb){
  audioCtx = new AudioContext()

  let totalSounds = sndData.length;
  let sounds = []
  let soundsReady = 0;
  sndData.forEach(function(o, i){
    var sndGenerator = new MusicPlayer();
    sndGenerator.init(o);
    function step() {
      let done = sndGenerator.generate() == 1;
      if(done){

        let wave = sndGenerator.createWave().buffer;
        audioCtx.decodeAudioData(wave, function(buffer) {
          sounds[i] = buffer;
          soundsReady++
          if (soundsReady === totalSounds) {
            cb(sounds)
          }
        })
        return
      }
      setTimeout(step, 0)
    }
    setTimeout(step, 0)
  })
}

function VSound(_sounds) {


  let audioMaster = audioCtx.createGain();
  let compressor = audioCtx.createDynamicsCompressor();
  compressor.threshold.setValueAtTime(-60, audioCtx.currentTime);
  compressor.knee.setValueAtTime(40, audioCtx.currentTime); 
  compressor.ratio.setValueAtTime(12, audioCtx.currentTime);
  compressor.attack.setValueAtTime(0, audioCtx.currentTime);
  compressor.release.setValueAtTime(0.25, audioCtx.currentTime);

  audioMaster.connect(compressor);
  compressor.connect(audioCtx.destination);




	function playSound(buffer, playbackRate = 1, pan = 0, volume = .2, loop = false) {

		var source = audioCtx.createBufferSource();
		var gainNode = audioCtx.createGain();
		var panNode = audioCtx.createStereoPanner();

		source.buffer = buffer;
		source.connect(panNode);
		panNode.connect(gainNode);
		gainNode.connect(audioMaster);

		source.playbackRate.value = playbackRate;
		source.loop = loop;
		gainNode.gain.value = volume;
		panNode.pan.value = pan;
		source.start();
		return () => {
      source.stop()
    }

	}


	return (_, loop = false) => {
    return playSound(_sounds[_], 1, 0, .1, loop)
	}
}



let cool = 0

export function psfx(n: number, loop: boolean) {

  if (cool <= 0) {
    return sfx(n, loop)
  }
  cool += ticks.sixth

  if (cool > ticks.seconds * 2) {
    cool = 0
  }
}
