import { ChildProcess } from "child_process";
import { jest } from "@jest/globals";

// ---------------------------------------------------------------------------
// Global mocks
// ---------------------------------------------------------------------------

// 1  keep the real implementation so we can restore it later
const realExit = process.exit;

// 2  build a Jest mock with the right “never” signature
export const exitMock = jest.fn(((_code?: number) => {
    throw new Error("exit");
    // do NOTHING (or throw if you want the spec to fail immediately)
}) as never);

// 1  keep the real implementation so we can restore it later
const realKill = process.exit;

// 2  build a Jest mock with the right “never” signature
export const killMock = jest.fn(((_pid: number) => true));

// Mock spawn so no external process is created
const mockUnref = jest.fn();
let mockSpawn = jest.fn(() => ({ pid: 42, unref: mockUnref } as unknown as ChildProcess));
jest.mock("child_process", () => ({ spawn: mockSpawn }));


const existsSyncMock = jest.fn(() => false);
const unlinkSyncMock = jest.fn(() => { });
const readFileSyncMock = jest.fn(() => "10");
jest.mock("fs", () => ({
    existsSync: existsSyncMock,
    readFileSync: readFileSyncMock,
    unlinkSync: unlinkSyncMock
}))


const platformMock = jest.fn(() => "linux");

jest.mock("os", () => ({
    platform: platformMock,
}))

// ---------------------------------------------------------------------------
// Module under test
// ---------------------------------------------------------------------------

import { PID_FILE } from "./start";
import { stop } from "./stop";


describe("stop", () => {

    beforeAll(() => {
        (process as any).kill = killMock;
        (process as any).exit = exitMock;
    });
    afterEach(() => {
        jest.clearAllMocks();   // reset call counts
        jest.restoreAllMocks(); // restore any spies (e.g. os.platform)
    });
    afterAll(() => {
        (process as any).exit = realKill;
        (process as any).exit = realExit;
    });

    it("should kill server process if found", () => {
        // GIVEN
        existsSyncMock.mockReturnValue(true);

        // WHEN
        stop();

        // THEN
        // THEN
        expect(killMock).toHaveBeenCalledWith(10);
        expect(unlinkSyncMock).toHaveBeenCalledWith(PID_FILE);

    });



    it("should exit if process cannot be found", () => {
        // GIVEN
        existsSyncMock.mockReturnValue(false);

        // WHEN--> our mock exit throws an error to stop execution
        expect(() => stop()).toThrow();


        // THEN
        expect(exitMock).toHaveBeenCalledWith(1);
        expect(killMock).not.toHaveBeenCalled();
        expect(unlinkSyncMock).not.toHaveBeenCalledWith();
    });

    it("should exit if kill throws error", () => {
        // GIVEN
        existsSyncMock.mockReturnValue(true);
        killMock.mockImplementation(() => { throw new Error("Error") })

        // WHEN--> our mock exit throws an error to stop execution
        expect(() => stop()).toThrow();

        // THEN
        expect(exitMock).toHaveBeenCalledWith(1);
        expect(killMock).toHaveBeenCalledWith(10);
        expect(unlinkSyncMock).toHaveBeenCalledWith(PID_FILE);
    });
});
