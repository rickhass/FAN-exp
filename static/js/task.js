/* task.js
 * depends on utils.js, psiturk.js
 */

// new configuration object
var $c = new CIGconfig(condition, counterbalance, 5000); // 180000ms = 3 min

// new psiturk object
var psiTurk = new PsiTurk(uniqueId, adServerLoc);
// load pages

var pages = $c.instructions.concat($c.pages);

psiTurk.preloadPages(pages);

var instructionPages = $c.instructions;

// objects to keep track of views and state
var CURRENTVIEW;
var STATE;

/******
*
* Handle the experiment including the task instruction pages (overall instructions pages are handled differently)

******/
var Instructions = function() {

    // The list of pages for this set of instructions
    this.pages = $c.block[STATE.experiment_phase];
    // Time when a page of instructions is presented
    this.timestamp;

    // Display a page of instructions, based on the current
    // STATE.index

    this.show = function() {
        debug("show block instructions");

        // Load the next page of instructions
        $(".slide").hide();
        var slide = $("#" + this.pages);
        slide.fadeIn($c.fade);

        // Update the URL hash
        STATE.set_hash();

        // Bind a handler to the "next" button. We have to wrap it in
        // an anonymous function to preserve the scope.
        var that = this;
        slide.find('.next').click(function () {
            that.record_response();
        });

        // Record the time that an instructions page is presented
        this.timestamp = new Date().getTime();
    };

    // Handler for when the "next" button is pressed
    this.record_response = function() {

        // Calculate the response time
        var rt = (new Date().getTime()) - this.timestamp;
        debug("'Next' button pressed");

        // Record the data. The format is:
        // experiment phase, instructions, index, trial_phase, response time
        var data = new DataRecord();
        data.update(STATE.as_data());
        data.update({response: "", response_time: rt});
        psiTurk.recordTrialData(data);
        debug(data);

        this.finish();
    };

    // Clean up the instructions phase and move on to the test phase
    this.finish = function() {
        debug("Done with block instructions")


        //psiTurk.finishInstructions();

        // Reset the state object for the test phase
        STATE.set_instructions(0);
        STATE.set_index();
        STATE.set_trial_phase();
        CURRENTVIEW = new Trial();
    };

    // Display the block instructions
    this.show();
};

/*****************
 *  TRIALS       *
 *****************/

var Trial = function() {

    /* Instance variables */

    // When the time response period begins
    this.timestamp;
    // Whether the object is listening for a first keypress
    this.firstListen = false;
    // Whether the object is listening for the entry of a final response
    this.listening = false;
    // Whether the last page listens for the spacebar
    this.lastlisten = false;

    // List of trials / prompts in this block of the experiment
    this.trials = $c.promptlist[STATE.experiment_phase];
    // Information about the current trial
    this.trialinfo;
    // The response they gave
    this.response;

    // Handlers to setup each phase of a trial
    this.phases = new Object();

    // Initialize a new trial. This is called either at the beginning
    // of a new trial, or if the page is reloaded between trials.
    this.init_trial = function () {
        debug("Initializing trial " + STATE.index);
        $(".phase").hide(); //hide all divs

        // If there are no more trials left, then we are at the end of
        // this phase
        if (STATE.index >= this.trials.length) {
            this.finish();
            return false;
        }

        // Load the new trialinfo
        this.trialinfo = this.trials[STATE.index];

        var that = this; // helping with scope

        // Register a handler to record first typing for RTs and IRTs
        $("#resp-input").on("input", function() {
            that.first_type();
        });

        // Register another handler to grab the response when Enter is hit and then clear
        // the field and start listening for next input
        $('#resp-input').unbind('keydown').bind('keydown', function (e) {
              if (e.which == 13) {
                that.record_response($("#resp-input").val()); // get the actual resp
              }
        });
        return true; // alerts below that the trial is initialized
    };

    // Phase 1: show the prompt
    this.phases[TRIAL.prompton] = function(that) {
        // Initialize the trial
        if (that.init_trial()) {
            clear_prompt_field(); // get rid of the message
            // Actually show the prestim element
            debug("Show PROMPT");

            var entryDiv = document.getElementById('entry');
            entryDiv.style.display = 'block';

            show_children(entryDiv);

            show_prompt(that.trialinfo);
            
            // Listening for responses
            that.firstListen = true;
            that.listening = true;
            STATE.set_trial_phase(STATE.trial_phase + 1);
            that.show();
        }
    };

    // Phase 2: display response entry field
    this.phases[TRIAL.responding] = function (that) {
        debug("responding");
        $("#resp-input").show();
        $("#resp-entry").show();
        $("#resp-input").focus(); // give focus to the input field

        if (STATE.experiment_phase === 0){ // i.e. we're practing
          var t = 30000; // 30 seconds for practice trial
        } else {
          var t = $c.timelimit; // 3 minutes for real trial
        }
        setTimeout(function () {
          STATE.set_trial_phase(STATE.trial_phase + 1);
          that.show();
        }, t); // keep responding until time expires
      };

    // Phase 3: turn prompt and responding off and wait for keypress (keyup) to begin next prompt
    this.phases[TRIAL.promptoff] = function(that) {

        if (STATE.index >= (that.trials.length - 1)){
          replace_prompt("Good work! This part of the experiment is over, you can take a short break before you move on. Press the SPACEBAR to continue.");
        }
        else {
          replace_prompt("Good work! Press the SPACEBAR move on to the next prompt in this block. Be ready to type right away!");
        }
        
        $("#resp-entry").hide(); // hide the response entry div
        that.listening = false;
        that.firstListen = false;
        setTimeout(function () {
            that.lastlisten = true; // activate the keyup function after 800 ms to avoid carryover
        }, 800);
        
        document.onkeyup = function () { // this is a simple way to use a keyup to advance (keyup is best here)
            if(that.lastlisten){
                $("#resp-input").val(""); // clear input field so it doesn't carry over
                that.lastlisten = false; // don't trigger keyup until next prompt
                STATE.set_trial_phase();
                STATE.set_index(STATE.index + 1);
                that.show();
            }
        };
    };

    // Show the current trial at the correct phase

    this.show = function () {
        // Update the URL hash
        STATE.set_hash();
        // Call the phase setup handler
        this.phases[STATE.trial_phase](this);
        // Record when this phase started
        this.timestamp = new Date().getTime();
    };

    // Record the time of the first character entered
    this.first_type = function() {
      if (!this.firstListen) return;

      // Record response time
      var rt = (new Date().getTime()) - this.timestamp;
      this.firstListen = false;

      var data = new DataRecord();
      data.update(STATE.as_data());
      data.update({prompt: this.trialinfo});
      data.update({rt: rt});
      psiTurk.recordTrialData(data);
      debug(data);

    };

    // Record a response when it is entered
    this.record_response = function(input) {
        // make sure we're listening
        if (!this.listening) return;
        // Record response time
        var rt = (new Date().getTime()) - this.timestamp;
        var data = new DataRecord();
        this.firstListen = true;
        data.update(STATE.as_data());
        data.update({prompt: this.trialinfo});
        data.update({
            entry_time: rt,
            response: input,
        });
        psiTurk.recordTrialData(data);
        debug(data);
        $("#resp-input").val(""); // clear the field
      };

    // Complete the set of trials in the test phase
    this.finish = function() {
        debug("Finish block " + STATE.experiment_phase);
        psiTurk.recordTrialData()
        // Reset the state object for the next experiment phase
	      STATE.set_experiment_phase(STATE.experiment_phase + 1);
        STATE.set_instructions();
        STATE.set_index();
        STATE.set_trial_phase();

        // If we're at the end of the experiment, submit the data to
        // mechanical turk, otherwise go on to the next experiment
        // phase and show the relevant instructions
        if (STATE.experiment_phase >= EXPERIMENT.length) {
          CURRENTVIEW = new Questionnaire();
        } else {
            CURRENTVIEW = new Instructions();
        }
    };

    // Load the trial html page
    $(".slide").hide();
    // Show the slide
    $("#trial").fadeIn($c.fade);

    // Initialize the current trial -- we need to do this here in
    // addition to in promptshow in case someone refreshes the page in
    // the middle of a trial
    if (this.init_trial()) {
        // Start the test
        this.show();
    };
};

/****************
* Questionnaire *
****************/

var Questionnaire = function() {

	var error_message = "<h1>Oops!</h1><p>Something went wrong submitting your HIT. This might happen if you lose your internet connection. Press the button to resubmit.</p><button id='resubmit'>Resubmit</button>";

	var record_responses = function() {

		psiTurk.recordTrialData({
      'phase':'postquestionnaire', 'status':'submit'
    });

		$('textarea').each( function(i, val) {
			psiTurk.recordUnstructuredData(this.id, this.value);
		});
		$('select').each( function(i, val) {
			psiTurk.recordUnstructuredData(this.id, this.value);
		});

	};

	var prompt_resubmit = function() {
		document.body.innerHTML = error_message;
		$("#resubmit").click(resubmit);
	};

  var finish = function () {
	    record_responses();
	    psiTurk.saveData({
            success: psiTurk.completeHIT,
            error: prompt_resubmit
          });
	   };

	var resubmit = function() {
		document.body.innerHTML = "<h1>Trying to resubmit...</h1>";
		reprompt = setTimeout(prompt_resubmit, 10000);
    psiTurk.saveData({
          success: psiTurk.completeHIT,
          error: prompt_resubmit
        });
	};

	// Load the questionnaire snippet
	psiTurk.showPage('postquestionnaire.html');
  // add a bunch of age options
  var select = document.getElementById("age");
  var options = _.range(18, 100);

  for (var i = 0; i < options.length; i++) {
    var opt = options[i];
    var el = document.createElement("option");
    el.textContent = opt;
    el.value = opt;
    select.appendChild(el);
  }

  psiTurk.recordTrialData({'phase':'postquestionnaire', 'status':'begin'});

	$("#next").click(finish);
};

/*******************
 * Run Task
 ******************/
$(document).ready(function() {
     psiTurk.doInstructions(
     	instructionPages, // a list of pages you want to display in sequence
     	function() {
        // Load the HTML for the trials
        // Record various unstructured data
        psiTurk.showPage("trial.html");
        psiTurk.recordUnstructuredData("condition", condition);
        psiTurk.recordUnstructuredData("counterbalance", counterbalance);

        STATE = new State();
        // Begin the experiment phase
        if (STATE.instructions) { // this is default behavior
            CURRENTVIEW = new Instructions();
        } else {
            CURRENTVIEW = new Trial(); // this catches if they closed the window
        }
      });
 });
