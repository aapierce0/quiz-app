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
const args = argParser.parseArgs();

const app = express();

const jsPath = Path.join(__dirname, 'WebSite', 'js');
app.use('/js', express.static(jsPath));


app.all('/', function (request, response, next) {
    const indexPath = Path.join(__dirname, 'WebSite', 'index.html');
    response.sendFile(indexPath);
});

app.get('/:quizID', function (request, response, next) {
    const quizPath = Path.join(__dirname, 'WebSite', 'quiz.html');
    response.sendFile(quizPath);
});

const portNumber = args.port;
app.listen(portNumber, function() {
    console.log(`Listening on port ${portNumber}`);
});