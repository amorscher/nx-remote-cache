/**
 * Root object returned by `nx run-many -t=test`
 */
export interface NxRunSummary {
    run: RunInfo;
    tasks: TaskInfo[];
  }
  
  /**
   * Top‑level metadata about the overall run
   */
  export interface RunInfo {
    command: string;
    startTime: string; // ISO 8601 timestamp
    endTime: string;   // ISO 8601 timestamp
    inner: boolean;
  }
  
  /**
   * Allowed cache‑status values you’re likely to see
   */
  export type CacheStatus =
    | 'remote-cache-hit'
    | 'local-cache-hit'
    | 'cache-miss'
    | 'none';
  
  /**
   * Individual task execution record
   */
  export interface TaskInfo {
    taskId: string;
    target: string;
    projectName: string;
    hash: string;
    startTime: string; // ISO 8601 timestamp
    endTime: string;   // ISO 8601 timestamp
    params: string;    // always a string, even if empty
    cacheStatus: CacheStatus;
    status: number;    // exit code (0 = success)
  }