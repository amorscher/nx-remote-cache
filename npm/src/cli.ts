import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { PID_FILE, start } from "./cmds/start.js";
import { stop } from "./cmds/stop.js";
import { RUN_JSON_DEFAULT, statistics } from "./cmds/statistics.js";

yargs(hideBin(process.argv))
    .command("start", "start the cache server",
        y => y
            .option('verbose', {
                type: 'boolean',
                alias: 'v',
                describe: 'use verbose logging',
                default: false,
            })
            .option('pidFile', {
                type: 'string',
                alias: 'p',
                describe: 'where to creat the pid file',
                default: PID_FILE,
            }),
        (args) => {
            start(args.verbose, args.pidFile);
        })

    .command("stop", "stopping the cache server", y => y
        .option('pidFile', {
            type: 'string',
            alias: 'p',
            describe: 'where to creat the pid file',
            default: PID_FILE,
        }), (argv) => {
            stop(argv.pidFile);
        })

    .command("cache-stats", "get some statistics about the last run",
        y => y
            .option('runJsonPath', {
                type: 'string',
                alias: 'j',
                describe: 'location of the run.json produced by nx',
                default: RUN_JSON_DEFAULT,
            })
            .option('json', {
                alias: 'j',
                type: 'string',           // but we’ll also allow it as a bare flag
                describe:
                    'Write summary to a file. Use `--json myfile.json` to name it. ' +
                    'Use bare `--json` to get a derived name which will be ./[nx-command]json',
            }), (argv) => {
                let jsonOutConfig: undefined | { providedFileName?: string } = undefined;
                if (argv.json !== undefined) {
                    if (typeof argv.json === 'string' && argv.json.trim()) {
                        // case: --json somefile.json
                        jsonOutConfig = { providedFileName: argv.json };

                    } else {
                        jsonOutConfig = {};
                    }
                }
                statistics(argv.runJsonPath, jsonOutConfig);
            })

    .demandCommand(1)
    .strict()
    .version()
    .help()
    .parse();
