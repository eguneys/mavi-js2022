const template = (n, p = [1], e = 0) => ({
  songData: [{ // Instrument 0
      i: [
        1, // OSC1_WAVEFORM
        23, // OSC1_VOL
        124, // OSC1_SEMI
        9, // OSC1_XENV
        0, // OSC2_WAVEFORM
        29, // OSC2_VOL
        130, // OSC2_SEMI
        0, // OSC2_DETUNE
        56, // OSC2_XENV
        3, // NOISE_VOL
        0, // ENV_ATTACK
        0, // ENV_SUSTAIN
        49, // ENV_RELEASE
        0, // ENV_EXP_DECAY
        0, // ARP_CHORD
        0, // ARP_SPEED
        0, // LFO_WAVEFORM
        0, // LFO_AMT
        0, // LFO_FREQ
        0, // LFO_FX_FREQ
        2, // FX_FILTER
        36, // FX_FREQ
        0, // FX_RESONANCE
        0, // FX_DIST
        61, // FX_DRIVE
        0, // FX_PAN_AMT
        0, // FX_PAN_FREQ
        0, // FX_DELAY_AMT
        0 // FX_DELAY_TIME
      ],
      // Patterns
      p,
      // Columns
      c: [
        {n,
          f: []}
      ]
    },
  ],
  rowLen: 8269,   // In sample lengths
  patternLen: 32,  // Rows per pattern
  endPattern: e,  // End pattern
  numChannels: 1  // Number of channels
}); 


export const song1 = template([135,,139,,139,,,142,135,,,139,,139,,142,135,,,139,,139,,142,135,,,139,,139], [1,1], 1)

export const over = template([161,159,158,,152,151,,149,147,,,159,158,154,,,147,,,146,144,139,,140,139,,149,146,144,,139,135])
