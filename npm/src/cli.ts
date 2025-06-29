#!/usr/bin/env node
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

yargs(hideBin(process.argv))
    .command("start", "start the cache server", (argv) => {
        console.log(`👋  Starting server...`);
    })

    .command("stop", "stopping the cache server", (argv) => {
        console.log(`👋  Stopping server...`);
    })

    .command("cache-stats", "stopping the cache server", (argv) => {
        console.log(`👋  Fetching cache stats...`);
    })

    .demandCommand(1)
    .strict()
    .version()
    .help()
    .parse();
