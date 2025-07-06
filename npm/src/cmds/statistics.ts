import * as path from "path"

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs"
import { NxRunSummary } from "./nx.types";


export const RUN_JSON_DEFAULT = path.join(".", ".nx", "cache", "run.json");

export function statistics(runJsonPath: string = RUN_JSON_DEFAULT, jsonOutConfig?: {providedFileName?:string}): void {
    if (!existsSync(runJsonPath)) {
        console.error(`Could not find run.json at \"${runJsonPath}\".`);
        process.exit(1);
    }

    try {
        const raw = readFileSync(runJsonPath, "utf8");
        const data = JSON.parse(raw);



        const stats = computeStats(data);

        
        if (jsonOutConfig !== undefined) {
            //create a valid name according to the data
            const realOutputPath = jsonOutConfig?.providedFileName ?? `${stats.command.replaceAll(" ", "_")}.json`;
            const outPath = path.resolve(realOutputPath);
            ensureDir(outPath);
            writeFileSync(outPath, JSON.stringify(stats, null, 2));
            console.log(`\nStats written to ${outPath}`);
        } else {
            printStats(stats);
        }
    } catch (err: any) {
        if (err.message) {
            console.error(`Failed to read or parse \"${runJsonPath}\":`, err.message);
        }
        process.exit(1);
    }
}

interface NxCacheStats {
    command: string;
    totalTasks: number;
    localCacheHits: NxCacheTask[];
    remoteCacheHits: NxCacheTask[];
    noCache: NxCacheTask[]

}

interface NxCacheTask {
    taskId: string;
    hash: string;
}

/**
 * Compute statistics for a Nx run.json input.
 * @param {{run: any, tasks: any[]}} data
 */
function computeStats(data:NxRunSummary): NxCacheStats {
    const runCommand = data?.run?.command ?? "<unknown>";
    const tasks = Array.isArray(data?.tasks) ? data.tasks : [];

    const buckets: {
        local: NxCacheTask[],
        remote: NxCacheTask[],
        none: NxCacheTask[]
    } = {
        local: [],
        remote: [],
        none: [],
    };

    for (const t of tasks) {
        switch (t.cacheStatus) {
            case "local-cache-hit":
                buckets.local.push({ taskId: t.taskId, hash: t.hash });
                break;
            case "remote-cache-hit":
                buckets.remote.push({ taskId: t.taskId, hash: t.hash });
                break;
            default:
                buckets.none.push({ taskId: t.taskId, hash: t.hash });
        }
    }

    return {
        command: runCommand,
        totalTasks: tasks.length,
        localCacheHits: buckets.local,
        remoteCacheHits: buckets.remote,
        noCache: buckets.none,
    };
}

/**
 * Pretty‑prints cache statistics to stdout.
 * @param {ReturnType<typeof computeStats>} stats
 */
function printStats(stats:NxCacheStats): void {
    console.log();
    console.log("NX Cache Statistics");
    console.log("───────────────────────");
    console.log(`Command           : ${stats.command}`);
    console.log(`Tasks executed    : ${stats.totalTasks}`);
    console.log();

    console.log("Cache Status Count");
    console.log("───────────────────────");
    console.log(`Local cache hits  : ${stats.localCacheHits.length}`);
    console.log(`Remote cache hits : ${stats.remoteCacheHits.length}`);
    console.log(`None              : ${stats.noCache.length}`);
    console.log();

    const printIdList = (title: string, tasks: NxCacheTask[]) => {
        if (!tasks.length) return;
        console.log(title);
        for (const task of tasks) console.log(`  • ${task.taskId} (${task.hash})`);
        console.log();
    };

    printIdList("Local cache‑hit taskIds:", stats.localCacheHits);
    printIdList("Remote cache‑hit taskIds:", stats.remoteCacheHits);
    printIdList("No cache taskIds:", stats.noCache);
}

/**
 * Ensure the directory for a given file path exists.
 * @param {string} filePath
 */
function ensureDir(filePath: string): void {
    const dir = path.dirname(filePath);
    mkdirSync(dir, { recursive: true });
}