/**
* adaptation of config.js from jhamrick
* Configuration for Beaty, Kenett, Hass, & Schacter FAN effect
****/
// object to hold experiment phases
var EXPERIMENT = Object.freeze({
    practice: 0,
    hifan: 1,
    lowfan: 2,
    length: 3
});

// object to hold trial order
var TRIAL = Object.freeze({
    prompton: 0,
    responding: 1,
    promptoff: 2,
    length: 3
});

// configuration object for the experiment

var CIGconfig = function(condition, counterbalance, timelimit) {

  this.condition = condition;
  this.counterbalance = counterbalance;

  this.fade = 200;

  this.debug = true; // set to false for actual run

  this.instructions = [
    "instructions/instruct-1.html",
    "instructions/instruct-2.html"
  ];

  this.pages = [
        "trial.html",
        "postquestionnaire.html",
        "thanks-mturksubmit.html"
      ];

  this.block = new Object();
  this.block[EXPERIMENT.practice] = ["instruct-practice"];
  this.block[EXPERIMENT.hifan] = ["instruct-ou1"];
  // both ou instructions are the same, but one has language that makes it read well for a
  // second task
  this.block[EXPERIMENT.lowfan] = ["instruct-ou2"];

  this.promptlist = new Object();
  this.promptlist[EXPERIMENT.practice] = ["Name as many COLORS as you can"];
  this.promptlist[EXPERIMENT.hifan] = _.shuffle([
        "Please list all of the creative, unusual uses for SOAP you can think of.",
        "Please list all of the creative, unusual uses for a ROPE you can think of.",
        "Please list all of the creative, unusual uses for a STICK you can think of.",
        "Please list all of the creative, unusual uses for a MARBLE you can think of.",
        "Please list all of the creative, unusual uses for a BALLOON you can think of."
      ]);
  this.promptlist[EXPERIMENT.lowfan] = _.shuffle([
      "Please list all of the creative, unusual uses for a CLOCK you can think of.",
      "Please list all of the creative, unusual uses for a FORK you can think of.",
      "Please list all of the creative, unusual uses for a LAMP you can think of.",
      "Please list all of the creative, unusual uses for a LENS you can think of.",
      "Please list all of the creative, unusual uses for a PEN you can think of."
    ]);

  this.timelimit = timelimit; // in milliseconds

  this.rest = 5000; // break time between trials in milliseconds, depricated

};
