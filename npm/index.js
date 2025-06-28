#!/usr/bin/env node
const os = require("os");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const PID_FILE = path.join(__dirname, "nx-cache-server.pid");
const RUN_JSON_DEFAULT = path.join(".",".nx","cache","run.json");
const DEFAULT_STATS_JSON = "cache-stats.json";

const binPath = (() => {
    const platform = os.platform();
    if (platform === "win32")
        return path.join(__dirname, "bin", "win", "nx-cache-server.exe");
    if (platform === "linux")
        return path.join(__dirname, "bin", "linux", "nx-cache-server");
    if (platform === "darwin")
        return path.join(__dirname, "bin", "mac", "nx-cache-server");
    throw new Error(`Unsupported platform: ${platform}`);
})();

const command = process.argv[2];

/**
 * Compute statistics for a Nx run.json input.
 * @param {{run: any, tasks: any[]}} data
 */
function computeStats(data) {
    const runCommand = data?.run?.command ?? "<unknown>";
    const tasks = Array.isArray(data?.tasks) ? data.tasks : [];
  
    const buckets = {
      local: [],
      remote: [],
      none: [],
    };
  
    for (const t of tasks) {
      switch (t.cacheStatus) {
        case "local-cache-hit":
          buckets.local.push({taskId:t.taskId, hash:t.hash});
          break;
        case "remote-cache-hit":
          buckets.remote.push({taskId:t.taskId, hash:t.hash});
          break;
        default:
          buckets.none.push({taskId:t.taskId, hash:t.hash});
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
  function printStats(stats) {
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
  
    const printIdList = (title, tasks) => {
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
  function ensureDir(filePath) {
    const dir = path.dirname(filePath);
    fs.mkdirSync(dir, { recursive: true });
  }

if (command === "start") {
    if (fs.existsSync(PID_FILE)) {
        console.error("Server is already running.");
        process.exit(1);
    }
    // Check for --verbose flag
    const args = process.argv.slice(3);
    const verboseIdx = args.indexOf("--verbose");
    const env = { ...process.env,RUST_LOG: "info" }; // Default to info level logging
    if (verboseIdx !== -1) {
        env.RUST_LOG = "trace";
        args.splice(verboseIdx, 1); // Remove --verbose from args passed to the binary
    }

    const proc = spawn(binPath, args, {
    
        detached: true,
        stdio: 'ignore',
        env:env,
        
    });

    //exit node if the child process exits
    // proc.on("exit", (code) => {
    //     console.log(`nx-cache-server exited with code ${code}`);
    //     fs.unlinkSync(PID_FILE);
    //     process.exit(code);
    // });

    fs.writeFileSync(PID_FILE, proc.pid.toString());
    proc.unref();
    console.log(`nx-cache-server started with pid: ${proc.pid}`);
} else if (command === "stop") {
    if (!fs.existsSync(PID_FILE)) {
        console.error("No running server found.");
        process.exit(1);
    }
    const pid = parseInt(fs.readFileSync(PID_FILE, "utf8"), 10);
    try {
        process.kill(pid);
        fs.unlinkSync(PID_FILE);
        console.log(`nx-cache-server with pid ${pid} stopped.`);
    } catch (err) {
        console.error(`Failed to stop process ${pid}:`, err.message);
        fs.unlinkSync(PID_FILE);
        process.exit(1);
    }
} else if (command === "cache-stats") {
    // Syntax: node index.js cache-stats [path/to/run.json] [--json [outfile]]
    const rawArgs = process.argv.slice(3);
  
    let runJsonPath = RUN_JSON_DEFAULT;
    let wantJson = false;
    let jsonOutPath = DEFAULT_STATS_JSON;
  
    const jsonFlagIdx = rawArgs.indexOf("--json");
    if (jsonFlagIdx !== -1) {
      wantJson = true;

      // Remove the flag and optional filename from rawArgs to leave only the run.json path (if any)
      rawArgs.splice(jsonFlagIdx, 1); // remove --json
      if (jsonFlagIdx < rawArgs.length && !rawArgs[jsonFlagIdx].startsWith("--")) {
        rawArgs.splice(jsonFlagIdx, 1); // remove filename if we consumed it above
      }
    }
  
    // The remaining first arg, if any, is the run.json path
    if (rawArgs[0]) runJsonPath = path.resolve(rawArgs[0]);
    else runJsonPath = RUN_JSON_DEFAULT;
  
    if (!fs.existsSync(runJsonPath)) {
      console.error(`Could not find run.json at \"${runJsonPath}\".`);
      process.exit(1);
    }
  
    try {
      const raw = fs.readFileSync(runJsonPath, "utf8");
      const data = JSON.parse(raw);

   
  
      const stats = computeStats(data);
      
      //create a valid name according to the data
      jsonOutPath = `${stats.command.replaceAll(" ","_")}.json`;  
  
      if (wantJson) {
        // If there is an argument immediately after --json and it does not start with "--", treat it as filename
        if (rawArgs[jsonFlagIdx + 1] && !rawArgs[jsonFlagIdx + 1].startsWith("--")) {
            jsonOutPath = rawArgs[jsonFlagIdx + 1];
          }
        const outPath = path.resolve(jsonOutPath);
        ensureDir(outPath);
        fs.writeFileSync(outPath, JSON.stringify(stats, null, 2));
        console.log(`\nStats written to ${outPath}`);
      }else{
        printStats(stats);
      }
    } catch (err) {
      console.error(`Failed to read or parse \"${runJsonPath}\":`, err.message);
      process.exit(1);
    }
  } else {
    console.log("Usage: node index.js <start|stop|cache-stats> [args]\n\n  cache-stats options:\n    [path]           Path to run.json (default ./.nx/run.json)\n    --json [file]    Also emit stats as JSON (default ./[nx-command]json)\n  ");
    process.exit(1);
  }
