#!/usr/bin/env node
const os = require("os");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const PID_FILE = path.join(__dirname, "nx-cache-server.pid");

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
        stdio: ["ignore", process.stdout, process.stderr],
        //stdio: "inherit",
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
} else {
    console.log("Usage: node index.js <start|stop> [args]");
    process.exit(1);
}
