/* utils.js
 *
 */
/******
*******/
// Object to hold the state of the experiment.
// adapted from jhamrick's mental rotation experiment
var State = function () { // object called State (note it is not all caps)

    // One of the phases defined in EXPERIMENT
    this.experiment_phase;
    // 0 (false) or 1 (true)
    this.instructions;
    // Trial index
    this.index;
    // One of the phases defined in TRIAL
    this.trial_phase; // makes attributes, values to be filled in

    // Update the experiment phase. Defaults to EXPERIMENT.practice
    this.set_experiment_phase = function (experiment_phase) {
        if (experiment_phase != undefined) {
            this.experiment_phase = experiment_phase;
        } else {
            this.experiment_phase = EXPERIMENT.practice;
        }
    };

    this.set_instructions = function (instructions) {
        if (instructions != undefined) {
            this.instructions = instructions;
        } else {
            this.instructions = 1;
        }
    };

    // Update the trial index. Defaults to 0.
    this.set_index = function (index) {
        if (index != undefined) {
            this.index = index;
        } else {
            this.index = 0;
        }
    };

    // Update the trial phase. Defaults to TRIAL.prompton to show instructions for the block
    this.set_trial_phase = function (trial_phase) {
        if (!this.instructions) {
            if (trial_phase != undefined) {
                this.trial_phase = trial_phase;
            } else {
                this.trial_phase = TRIAL.prompton;
            }
        } else {
            this.trial_phase = undefined;
        }
    };

    // Set the URL hash based on the current state. If
    // this.instructions is 1, then it will look like:
    //
    //     <experiment_phase>-<instructions>-<index>
    //
    // Otherwise, if this.instructions is 0, it will be:
    //
    //     <experiment_phase>-<instructions>-<index>-<trial_phase>
    //
    // Returns the URL hash string.
    this.set_hash = function () {
        var parts = [
            this.experiment_phase,
            this.instructions,
            this.index
        ];

        if (!this.instructions) {
            parts[parts.length] = this.trial_phase;
        }

        var hash = parts.join("-");
        window.location.hash = hash;
        return hash;
    };

    // Update the State object based on the URL hash
    this.load_hash = function () {
        // get the URL hash, and remove the # from the front
        var hash = window.location.hash.slice(1);

        if (window.location.hash == "") {
            // no hash is present, so use the defaults
            this.set_experiment_phase();
            this.set_instructions();
            this.set_index();
            this.set_trial_phase();

        } else {
            // split the hash into its components and set them
            var parts = hash.split("-").map(
                function (item) {
                    return parseInt(item);
                });
            this.set_experiment_phase(parts[0]);
            this.set_instructions(parts[1]);
            this.set_index(parts[2]);
            this.set_trial_phase(parts[3]);
        }
    };

    // Return a list of the state's properties in human-readable form,
    // to be recorded as data in the database
    this.as_data = function () {
        var experiment_phase;
        var instructions = Boolean(this.instructions);
        var index = this.index;

        // Find the name of the experiment phase
        for (item in EXPERIMENT) {
            if (EXPERIMENT[item] == this.experiment_phase) {
                experiment_phase = item;
                break;
            }
        }

        return {
            'experiment_phase': experiment_phase,
            'instructions': instructions,
            'index': index,
        };
    };

    // Initialize the State object components
    this.load_hash();
};

// Object to properly format rows of data
var DataRecord = function () {
    this.update = function (other) {
        _.extend(this, other);
    };
};

function debug(msg) {
    if ($c.debug) {
        console.log(msg);
    }
}

/***********
* helper functions
************/

function show_children(container) { // shows all the children of the div for each sub page
  var childs = container.children;
  for (var i = 0; i < childs.length; i++) {
    childs[i].style.display = 'block';
  }
};

function show_prompt(prompt){ // shows the prompt in the correct location
  var show_me = document.getElementById('prompt-show');
  var p = document.createTextNode(prompt);
  show_me.appendChild(p);
};

function hide_children(container) { // shows all the children of the div for each sub page
  var childs = container.children;
  for (var i = 0; i < childs.length; i++) {
    childs[i].style.display = 'none';
  }
};

function clear_prompt_field() {
  var divy = document.getElementById('prompt-show');
  divy.textContent = "";
}

function replace_prompt(text) {
  var divy = document.getElementById('prompt-show');
  divy.textContent = text;
}

function getRandomInt(min, max) {
 min = Math.ceil(min);
 max = Math.floor(max);
 return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
};

function AssertException(message) { this.message = message; }
AssertException.prototype.toString = function () {
	return 'AssertException: ' + this.message;
};

function assert(exp, message) {
	if (!exp) {
		throw new AssertException(message);
	}
}
