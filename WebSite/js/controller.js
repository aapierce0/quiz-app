angular.module('QuizApp', []).controller('QuizController', ['$http', function($http) {
	const path = window.location.pathname;
	const pathComponents = path.split("/");
	const quizSlug = pathComponents.pop();

	const HOST_DOMAIN = `elginoscars.com`;
	const COUCHDB_ROOT = `https://db.${HOST_DOMAIN}`;
	const QUIZ_DATABASE_NAME = `quizzes`;
	const QUIZ_ID = quizSlug;
	const QUIZ_DOC_ID = `quiz:${QUIZ_ID}`;

	$http.get(`${COUCHDB_ROOT}/${QUIZ_DATABASE_NAME}/${QUIZ_DOC_ID}`).then((result) => {
		console.log(result);
		this.description = JSON.stringify(result.data);
		this.questions = result.data.questions;
	})


	// The title appears at the top of the quiz
	this.title = "";
	this.questions = [];

	// Take the question's input, and move it to its guesses.
	this.submitQuestion = function(question) {
		_.defaults(question, {"guesses": []});
		question.guesses.push(question.input);
		question.input = "";
	}

	// Evaluate one of the question's guesses
	this.evaluateAnswer = function(question, guess) {
		const solutions = question.solutions;
		const allowedResponses = _.flatMap(solutions, (solution) => {
			return _.union([solution.canonicalName], solution.alternatives);
		})
		return (_.some(allowedResponses, (allowedResponse) => { return allowedResponse == guess }));
	}

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
			const sharableURL = `http://${HOST_DOMAIN}/?ref=${submissionID}`;
			this.sharableURL = sharableURL;
		})
	}


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
	}

	this.showTheirAnswersButtonTitle = function() {
		if (this.competitor.name) {
			return `Show ${this.competitor.name}'s Answers`;
		} else {
			return "Show Their Answers";
		}
	}


}])
console.log("Loaded!");