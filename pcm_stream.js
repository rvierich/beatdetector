var fs = require('fs');
var pcm = require('pcm');
var FFT = require('fft');
var beats = require('beats');

var filename = './montana.mp3';

var buffer = [];
var bufferSize = 32;

var prevFreqMags = new Array(bufferSize);
var freqMags = new Array(bufferSize);
var fftOutput = new Array(bufferSize * 2); // even idx => real number, odd => imaginary

var fft = new FFT.complex(bufferSize);

var onBeatCb;



var beatBins = [{
  // the minimum index to sample in
  // the frequencies array.
  lo: 0,
  // The maximum index to sample in
  // the frequencies array.
  hi: bufferSize,
  // The minimum volume at which to
  // trigger a beat for this bin.
  threshold: 0,
  // the amount by which to decay
  // the threshold for this bin for
  // each sampled frame.
  decay: 0.005
}];

var detectBeats = beats(beatBins);

var threshold = 0.7;

var maxDelta = 0;
var maxAvgDelta = 0;

var maxIncrease = 0;
var avgIncrease = 0;
var increaseCount = 0;

var increases = [];
var increasesCount = 1000;

var timeStep = (increasesCount / 44100)

var beatT = Date.now();
var prevBeatT = 0;

var bpmCalcs = [];
var bpmCalcsCount = 100;

pcm.getPcmData(filename,
  { stereo: true, sampleRate: 44100 },
  function(sample, channel) { 'use strict';
    if (channel !== 0) { return; }

    // console.log('sample: ', sample);
    // console.log('channel: ', channel);

    if (buffer.length < bufferSize) {
      buffer.push(sample);
    } else {
      buffer.push(sample);
      buffer.shift();

      // if (sample > threshold) {
      //   console.log('beat!');
      // }
    }



    var fft = calcFFT();

    var increase = getFFTIncrease();


    increases.push(increase);

    if (increases.length >= increaseCount) {
      var sum = increases.reduce(function(s, inc) {return s+inc }, 0);
      var avgIncrease = sum / increases.length;

      // console.log(avgIncrease);

      if (avgIncrease > maxIncrease) {
        maxIncrease = increase;
      }

      // console.log('maxIncrease', maxIncrease);
      // console.log('avgIncrease', avgIncrease);

      increases = [];

      if (avgIncrease > 3.0) {
        // console.log('beat');
        beatT = Date.now();

        var bps = (1 / (( beatT- prevBeatT) / 1000));
        var bpm = bps * 60;

        // constrain limit
        prevBeatT = beatT;

        if (bpm > 300 || bpm < 40) {
          return;
        }

        bpmCalcs.push(bpm);
        if (bpmCalcs.length > bpmCalcsCount) {
          bpmCalcs.shift();
        }

        var avgBpm = bpmCalcs.reduce(function(s, bpm) { return s + bpm;}, 0) / bpmCalcs.length;
        console.log('avgBpm:', avgBpm);

        if (onBeatCb) { onBeatCb(); }
      }
    }



    // avgIncrease = (((avgIncrease * increaseCount) + increase) / ++increaseCount);

    // console.log('increase', increase);
    // console.log('maxIncrease', maxIncrease);
    // console.log('avgIncrease', avgIncrease);




    // prevTime = time;
    // time = Date.now();

    // // don't detect beats on the first fft
    // if (prevFreqBuckets[0] === undefined) { return; }

    // var beats = detectBeats(fft, 0.001);//(time - prevTime));
    // // console.log('dt', (time-prevTime));
    // if (beats[0] !== 0) {
    //   console.log(beats);
    // }



    // calcFFT();

    // var delta = getFFTDelta();

    // console.log('delta', delta);

    // var beat = false;

    // var sum = delta.reduce(function(s, d) {return s+d }, 0);
    // var avgDelta = sum / delta.length;

    // if (avgDelta > maxAvgDelta) {
    //   maxAvgDelta = avgDelta;

    //   // console.log('maxAvgDelta', maxAvgDelta);
    // }

    // if (maxAvgDelta > 0.08) {
    //   console.log('beat');
    // }

    // for (var i = 0; i < delta.length; i++) {
    //   if (delta[i] > maxDelta) {
    //     maxDelta = delta[i];
    //   }
    //   if (delta[i] > 0.7) {
    //     beat = true;
    //   }
    // }

    // console.log('maxDelta', maxDelta);

    // if (beat) {
    //   console.log('beat');
    // }
  }
);

function calcFFT() { 'use strict';
  // flip frequency buffers
  var tmp = prevFreqMags;
  prevFreqMags = freqMags;
  freqMags = tmp;

  fft.simple(fftOutput, buffer, 'real');

  for (var i = 0; i < (bufferSize); i++) { /* We only get back half the number of bins as we do samples */
    var real = fftOutput[(i*2)+0]; /* Even indexes are the real values */
    var imag = fftOutput[(i*2)+1]; /* Odd indexes are the imaginary values */
    freqMags[i] = Math.sqrt((real*real)+(imag*imag));
  }

  // console.log('fft mags', freqMags);

  return freqMags;
}

var delta = new Array(bufferSize);
function getFFTDelta() { 'use strict';
  for (var i = 0; i < bufferSize; i++) {
    delta[i] = freqMags[i] - prevFreqMags[i];
  }

  return delta;
}

function getFFTIncrease() { 'use strict';
  var sum = 0;
  for (var i = 0; i < bufferSize; i++) {
    if (freqMags[i] > prevFreqMags[i]) {
      sum += freqMags[i] - prevFreqMags[i];
    }
  }

  return sum;
}

function onBeat(fn) { 'use strict';
  onBeatCb = fn;
}

module.exports = {
  onBeat: onBeat
};
