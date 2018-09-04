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

// The database arguments class
export interface DatabaseArguments {
    databaseRoot: string;
}

// The arguments from launching the application
export interface Arguments extends DatabaseArguments {
    port: number;
}

export function parse() : Arguments {
    return argParser.parseArgs() as Arguments;
}


