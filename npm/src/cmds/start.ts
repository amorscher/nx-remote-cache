import  * as path from "path"
import * as os from "os"
import {existsSync,  writeFileSync} from "fs"
import {spawn} from "child_process"

export const PID_FILE = path.join(__dirname, "nx-cache-server.pid");

const binPath = (() => {
    const platform = os.platform();
    if (platform === "win32")
        return path.join(__dirname, "..","..","bin", "win", "nx-cache-server.exe");
    if (platform === "linux")
        return path.join(__dirname, "..","..","bin", "linux", "nx-cache-server");
    if (platform === "darwin")
        return path.join(__dirname, "..","..","bin", "mac", "nx-cache-server");
    throw new Error(`Unsupported platform: ${platform}`);
});

export function start(verbose: boolean,pidFilePath = PID_FILE){

        const execPath = binPath();
        if (existsSync(pidFilePath)) {
            console.error("Server is already running.");
            process.exit(1);
        }
        // Check for --verbose flag

        const env = { ...process.env,RUST_LOG: "info" }; // Default to info level logging
        if (verbose) {
            env.RUST_LOG = "trace";
        }
    
        const proc = spawn(execPath, {       
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
    
        writeFileSync(pidFilePath, proc.pid?.toString()??"not-available");
        proc.unref();
        console.log(`nx-cache-server started with pid: ${proc.pid}`);
}

