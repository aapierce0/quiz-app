import * as express from "express";
import * as Path from "path";
import * as request from "request";
import * as chalk from "chalk";
import * as LaunchOptions from "./launch-options";


// Main execution routine.
function main() {

    // Parse the command-line arguments
    const args = LaunchOptions.parse();

    // Make sure the provided database is available.
    testDatabaseConnection(args, (error) => {
        if (error) {
            console.error(chalk.default.bgRed("err"), "Something is wrong with the database connection (see below). Aborting.");
            console.error(chalk.default.bgRed("err"), error.message);
        } else {

            // There was no error with the database, so the app is cleared for launch.
            launchApplication(args);
        }
    });
}







// Verifies that the database root provided is valid
function testDatabaseConnection(args: LaunchOptions.DatabaseArguments, callback: (error?: Error) => void) {
    console.log(`Ensuring CouchDB server is online at ${args.databaseRoot}`);
    ensureCouchDBIsOnline(args, (error) => {
        if (error) { callback(error); return }

        const databaseName = "quizzes";
        console.log(`Ensuring CouchDB server contains database named "${databaseName}"`);
        ensureCouchDBHasDatabase(args, databaseName, (error) => {
            callback(error);
        });
    });
}


// Make sure that the CouchDB server is online and listening
function ensureCouchDBIsOnline(args: LaunchOptions.DatabaseArguments, callback: (error?: Error) => void) {
    const timeoutSeconds = 2;
    const requestOptions = {
        timeout: timeoutSeconds * 1000
    };

    request(args.databaseRoot, requestOptions, function (error, response, body) {

        // If the request generated an error, indicate that
        if (error) {
            const myError = new Error(`Unable to reach CouchDB server at ${args.databaseRoot} :: ${error.message}`);
            callback(myError);
            return;
        }

        // Make sure the body is JSON
        let jsonObject: any;
        try {
            jsonObject = JSON.parse(body);
        } catch (error) {
            const myError = new Error(`${args.databaseRoot} appears to be online, but is not a valid CouchDB root :: ${error.message}`);
            callback(myError);
            return;
        }

        // Make sure the object has a property named "couchdb"
        if (typeof jsonObject.couchdb === "string") {
            callback();
        } else {
            const myError = new Error(`${args.databaseRoot} appears to be online, but is not a valid CouchDB root :: JSON object missing "couchdb" attribute`);
            callback(myError);
            return;
        }
    });
}

// Make sure that the couch db server contains a database with the given name
function ensureCouchDBHasDatabase(args: LaunchOptions.DatabaseArguments, databaseName: string, callback: (error?: Error) => void) {
    const timeoutSeconds = 2;
    const requestOptions = {
        timeout: timeoutSeconds * 1000
    };

    const requestPath = `${args.databaseRoot}/${databaseName}`;
    request(requestPath, requestOptions, function (error, response, body) {

        // If the request generated an error, indicate that
        if (error) {
            const myError = new Error(`Unable to find "${databaseName}" database in CouchDB server at ${args.databaseRoot} :: ${error.message}`);
            callback(myError);
            return;
        }

        // Make sure the body is JSON
        let jsonObject: any;
        try {
            jsonObject = JSON.parse(body);
        } catch (error) {
            const myError = new Error(`${requestPath} did not return JSON, as epxected :: ${error.message}`);
            callback(myError);
            return;
        }

        // Make sure the object's db_name equals the input
        if (jsonObject.db_name === databaseName) {
            callback();
            return;
        } else {
            const myError = new Error(`The databse "${databaseName}" doesn't exist in ${args.databaseRoot}`);
            callback(myError);
            return;
        }
    });
}


// Use the command-line arguments to launch the application
function launchApplication(args: LaunchOptions.Arguments) {

    // Create a new application
    const app = express();

    // Configure the application for the quiz
    configureApplication(app, args);

    // Start the server.
    const portNumber = args.port;
    app.listen(portNumber, function() {
        console.log(`Listening on port ${portNumber}`);
    });
}

// Configure the express application to run this application
function configureApplication(app: express.Application, args: LaunchOptions.Arguments) {

    // Assign the static javascript library path
    const jsPath = Path.join(__dirname, 'WebSite', 'js');
    app.use('/js', express.static(jsPath));

    // Assign the static css library path
    const cssPath = Path.join(__dirname, 'WebSite', 'css');
    app.use('/css', express.static(cssPath));

    // Route all requests to images to the img directory
    const imgPath = Path.join(__dirname, 'WebSite', 'img');
    app.use('/img', express.static(imgPath));

    // The root path goes to index.html
    app.all('/', function (request, response, next) {
        const indexPath = Path.join(__dirname, 'WebSite', 'index.html');
        response.sendFile(indexPath);
    });

    // db_connection.js is generated on-the-fly
    app.all('/db_connection.js', function (request, response, next) {
        const jsString = `window.couchDBRoot = ${JSON.stringify(args.databaseRoot)};`;
        response.end(jsString);
    });

    // The quiz page goes to quiz.html.
    app.get('/:quizID', function (request, response, next) {
        const quizPath = Path.join(__dirname, 'WebSite', 'quiz.html');
        response.sendFile(quizPath);
    });
}

main();