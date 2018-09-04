const HOST_DOMAIN = window.location.host;
const COUCHDB_ROOT = window.couchDBRoot;
const QUIZ_DATABASE_NAME = `quizzes`;

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
		this.questions = result.data.questions;
	});


	// The title appears at the top of the quiz
	this.title = "";
	this.questions = [];

	// Take the question's input, and move it to its guesses.
	this.submitQuestion = function(question) {
		_.defaults(question, {"guesses": []});
		question.guesses.push(question.input);
		question.input = "";
	};

	// Evaluate one of the question's guesses
	this.evaluateAnswer = function(question, guess) {
		const solutions = question.solutions;
		const allowedResponses = _.flatMap(solutions, (solution) => {
			return _.union([solution.canonicalName], solution.alternatives);
		});
		return (_.some(allowedResponses, (allowedResponse) => { return _.toUpper(allowedResponse) === _.toUpper(guess) }));
	};

	this.guessIsValidForSolution = function(guess, solution) {
    const allowedResponses = _.union([solution.canonicalName], solution.alternatives);
    return (_.some(allowedResponses, (allowedResponse) => { return _.toUpper(allowedResponse) === _.toUpper(guess) }));
	};

	// Get the canonical answer for a given question
	this.interpretCanonicalAnswer = function(question, guess) {
		const solutions = question.solutions;
		const acceptedSolution = _.find(solutions, (solution) => {
			return this.guessIsValidForSolution(guess, solution);
		});

		if (_.isObjectLike(acceptedSolution)) {
			return acceptedSolution.canonicalName;
		} else {
			return guess;
		}
	};

	// Submit the quiz to the database so that it can be shared!
	this.submit = function() {
		console.log("submitting results");
		const submissionID = "test-"+makeRandomSubmissionID();
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
			const sharableURL = `http://${HOST_DOMAIN}/${QUIZ_ID}?ref=${submissionID}`;
			this.sharableURL = sharableURL;
		})
	};

	this.questionHasUnknownSolutions = function(question) {
    return !_.every(question.solutions, (solution) => {
			return _.some(question.guesses, (guess) => {
				return this.guessIsValidForSolution(guess, solution);
			})
    })
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