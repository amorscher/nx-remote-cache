import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { PID_FILE, start } from "./cmds/start.js";
import { stop } from "./cmds/stop.js";

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
            start(args.verbose,args.pidFile);
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

    .command("cache-stats", "stopping the cache server", () => {
        console.log(`👋  Fetching cache stats...`);
    })

    .demandCommand(1)
    .strict()
    .version()
    .help()
    .parse();
