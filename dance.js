'use strict';

var pcmStream = require('./pcm_stream');
var keypress = require('keypress');

var arDrone = require('ar-drone');
var client  = arDrone.createClient();

client.config('control:altitude_max', 1500);

// move left and right quickly

var moveFns = [
  'front',
  'back'
];

var bpm = 150;
var bps = bpm / 60;
var secPerBeat = 1/ bps; // seconds per beat - this is our timer interval

var moveFnIndex = 0;
var speed = 1;

var count = 0;
var maxCount = 10;


keypress(process.stdin);

process.stdin.on('keypress', function(ch, key){
  if (!key) { return; }

  if (key.name == 'space') {
    client.stop();
    client.land();
    pcmStream.onBeat(function() {});
  }
});

// start the dance a few seconds after takeoff
client.takeoff();

client.on('hovering', function() {
  pcmStream.onBeat(function() {
    moveFnIndex = (moveFnIndex + 1) % moveFns.length;
    client[moveFns[moveFnIndex]](speed);

    console.log('beat');
  });
});

// setTimeout(function() {

//   // var danceTimerId;

//   // function stop() {
//   //   clearInterval(danceTimerId);
//   //   client.stop();
//   //   client.land();
//   // }

//   // var dance = function() {
//   //   if (count++ > maxCount) {
//   //     stop();
//   //     return;
//   //   }

//   //   moveFnIndex = (moveFnIndex + 1) % moveFns.length;
//   //   client[moveFns[moveFnIndex]](speed);
//   // };

//   // danceTimerId = setInterval(dance, secPerBeat * 1000);
// }, 5000);

process.stdin.setRawMode(true);
process.stdin.resume();



