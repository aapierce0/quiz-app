import * as express from 'express';
import * as Path from 'path';
import {ArgumentParser} from "argparse";

const argParser = new ArgumentParser({
    addHelp: true,
});
argParser.addArgument(['-p', '--port'], {
    help: 'Port number',
    defaultValue: 8080,
    type: 'int',
    dest: 'port',
});
argParser.addArgument(['-d', '--database'], {
    help: 'Root URL for the couchDB database',
    defaultValue: 'http://127.0.0.1:5984',
    dest: 'databaseRoot'
});

const args = argParser.parseArgs();
const app = express();

// Assign the static javascript library path
const jsPath = Path.join(__dirname, 'WebSite', 'js');
app.use('/js', express.static(jsPath));

// Assign the static css library path
const cssPath = Path.join(__dirname, 'WebSite', 'css');
app.use('/css', express.static(cssPath));


// The root path goes to index.html
app.all('/', function (request, response, next) {
    const indexPath = Path.join(__dirname, 'WebSite', 'index.html');
    response.sendFile(indexPath);
});

// db_connection.js is generated on-the-fly
app.all('/db_connection.js', function (request, response, next) {
    console.log('Writing root');
    const jsString = `window.couchDBRoot = ${JSON.stringify(args.databaseRoot)};`;
    response.end(jsString);
});

// The quiz page goes to quiz.html.
app.get('/:quizID', function (request, response, next) {
    const quizPath = Path.join(__dirname, 'WebSite', 'quiz.html');
    response.sendFile(quizPath);
});



// Start the server.
const portNumber = args.port;
app.listen(portNumber, function() {
    console.log(`Listening on port ${portNumber}`);
});