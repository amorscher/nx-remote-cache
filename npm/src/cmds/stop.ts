import { existsSync, readFileSync, unlinkSync } from "fs";
import { PID_FILE } from "./start";

export function stop(pidFilePath = PID_FILE):void{

        if (!existsSync(pidFilePath)) {
              console.error("No running server found.");
              process.exit(1);
          }
          const pid = parseInt(readFileSync(pidFilePath, "utf8"), 10);
          try {
              process.kill(pid);
              unlinkSync(pidFilePath);
              console.log(`nx-cache-server with pid ${pid} stopped.`);
          } catch (err:any) {      
              console.error(`Failed to stop process ${pid}:`, err?.message);        
              unlinkSync(pidFilePath);
              process.exit(1);
           
          }
}
