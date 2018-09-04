const HOST_DOMAIN = window.location.host;
const COUCHDB_ROOT = window.couchDBRoot;
const QUIZ_DATABASE_NAME = `quizzes`;




function QuizSolution(json) {
  this.canonicalName = json.canonicalName;
  this.alternatives = json.alternatives;
  this.hints = json.hints;
}

/// Indicates whether the provided guess is valid for this solution
QuizSolution.prototype.matches = function(guess) {
	const allowedResponses = _.union([this.canonicalName], this.alternatives);
  return (_.some(allowedResponses, (allowedResponse) => { return caseInsensitiveCompare(allowedResponse, guess) }));
};

function QuizQuestion(json) {
  this.content = json.content;
  this.solutions = json.solutions.map((solution) => { return new QuizSolution(solution) });

  // bound to the input text field of the question
  this.input = "";

  // list of guesses (strings) input by the user
  this.guesses = [];
}

/// Returns the matching solution for a given guess
QuizQuestion.prototype.findSolution = function(guess) {
	return _.find(this.solutions, (solution) => {
		return solution.matches(guess);
	});
};

QuizQuestion.prototype.commitInput = function() {
	const guess = this.input;

	// The guess must be a string, and it cannot be zero characters
	if (typeof guess !== "string" || guess.length === 0) {
		return;
	}

	// Append the guess to the list of guesses, and clear the input.
	this.guesses.push(guess);
	this.input = "";
};

QuizQuestion.prototype.knownSolutions = function() {
  return _.filter(this.solutions, (solution) => {
    return _.some(this.guesses, (guess) => {
      return solution.matches(guess);
    })
  });
};

QuizQuestion.prototype.unknownSolutions = function() {
	return _.reject(this.solutions, (solution) => {
		return _.some(this.guesses, (guess) => {
			return solution.matches(guess);
		})
	});
};





const app = angular.module('QuizApp', []);

app.controller('QuizController', ['$http', function($http) {
	const path = window.location.pathname;
	const pathComponents = path.split("/");
	const QUIZ_ID = pathComponents.pop();
	const QUIZ_DOC_ID = `quiz:${QUIZ_ID}`;

	$http.get(`${COUCHDB_ROOT}/${QUIZ_DATABASE_NAME}/${QUIZ_DOC_ID}`).then((result) => {
		console.log(result);
		this.title = result.data.title;
		this.description = JSON.stringify(result.data);
		this.questions = result.data.questions.map((questionJSON) => {
			return new QuizQuestion(questionJSON);
		});
	});


	// The title appears at the top of the quiz
	this.title = "";
	this.questions = [];

	// Take the question's input, and move it to its guesses.
	this.submitQuestion = function(question) {
		question.commitInput();
	};

	// Evaluate one of the question's guesses
	this.evaluateAnswer = function(question, guess) {
		return question.findSolution(guess) !== undefined;
	};

	this.guessIsValidForSolution = function(guess, solution) {
    return solution.matches(guess);
	};

	// Get the canonical answer for a given question
	this.interpretCanonicalAnswer = function(question, guess) {
		const solution = question.findSolution(guess) || {};
		return solution.canonicalName || guess;
	};

	// Submit the quiz to the database so that it can be shared!
	this.submit = function() {
		const submissionID = makeRandomSubmissionID();
		const guesses = this.questions.map((question) => {
			return question.guesses || [];
		});

		const submission = {
			"_id": `submission:${submissionID}`,
			"type": "submission",
			"quiz_id": `quiz:${QUIZ_ID}`,
			"answers": guesses
		};

		$http.put(`${COUCHDB_ROOT}/${QUIZ_DATABASE_NAME}/submission:${submissionID}`, submission).then((result) => {
			this.sharableURL = `http://${HOST_DOMAIN}/${QUIZ_ID}?ref=${submissionID}`;
		})
	};

	this.questionHasUnknownSolutions = function(question) {
    return question.unknownSolutions().length > 0;
  };


	const searchParams = parseQueryString(location.search);
	const competingAttempt = searchParams.ref;
	if (competingAttempt) {
		$http.get(`${COUCHDB_ROOT}/${QUIZ_DATABASE_NAME}/submission:${competingAttempt}`).then((result) => {
			console.log(result);
			this.competitor = result.data;
			this.competitor.shownAnswers = {};
		})
	}

	this.theirAnswersForQuestion = function(questionIndex) {
		if (this.competitor) {
			return this.competitor.answers[questionIndex];
		} else {
			return [];
		}
	};

	this.showTheirAnswersButtonTitle = function() {
		if (this.competitor.name) {
			return `Show ${this.competitor.name}'s Answers`;
		} else {
			return "Show Their Answers";
		}
	}

}]);

app.controller('QuizListController', ['$http', function($http) {

	this.quizzes = [];
	this.output = "";

	this.reloadQuizzes = function() {
    $http.get(`${COUCHDB_ROOT}/${QUIZ_DATABASE_NAME}/_design/quizzes/_view/list_quizzes`).then((result) => {
    	const rows = result.data.rows;
    	this.quizzes = rows.map((row) => {
    		let quiz = row.value;
    		quiz.href = `/${row.key}`;
    		return quiz;
    	});
      this.output = JSON.stringify(result.data.rows);
    });
	};

	this.reloadQuizzes();

}]);