import path from "path";
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

// Mock spawn so no external process is created
const mockUnref = jest.fn();
let mockSpawn = jest.fn(() => ({ pid: 42, unref: mockUnref } as unknown as ChildProcess));
jest.mock("child_process", () => ({ spawn: mockSpawn }));


const existsSyncMock = jest.fn(() => false);
const writeFileSyncMock = jest.fn(() => { });
jest.mock("fs", () => ({
    existsSync: existsSyncMock,
    writeFileSync: writeFileSyncMock
}))


const platformMock = jest.fn(() => "linux");

jest.mock("os", () => ({
    platform: platformMock,
}))

// ---------------------------------------------------------------------------
// Module under test
// ---------------------------------------------------------------------------

import { start, PID_FILE } from "./start";


describe("start", () => {

    beforeAll(() => {
        (process as any).exit = exitMock;
    });
    afterEach(() => {
        jest.clearAllMocks();   // reset call counts
        jest.restoreAllMocks(); // restore any spies (e.g. os.platform)
    });
    afterAll(() => {
        (process as any).exit = realExit;
    });

    it("should start server with spawn", () => {
        // GIVEN
        existsSyncMock.mockReturnValue(false);

        // WHEN
        start(false);

        // THEN
        // THEN
        expect(mockSpawn).toHaveBeenCalledWith(
            /* executable */  expect.stringMatching(new RegExp(`${"nx-cache-server".replace(/\\/g, "\\\\")}$`)),
           /* options */ expect.objectContaining({
            detached: true,                     // check whatever other flags you care about

        }));
        expect(writeFileSyncMock).toHaveBeenCalledWith(PID_FILE, "42");
        expect(mockUnref).toHaveBeenCalled();

    });

    it.each([
        ["win32", path.join("bin", "win", "nx-cache-server.exe")],
        ["linux", path.join("bin", "linux", "nx-cache-server")],
        ["darwin", path.join("bin", "mac", "nx-cache-server")],
    ])("should start correct server due to platform (%s)", (platform, suffix) => {
        // GIVEN
        platformMock.mockReturnValue(platform as NodeJS.Platform);
        existsSyncMock.mockReturnValue(false);

        // WHEN
        start(false);

        // THEN
        expect(mockSpawn).toHaveBeenCalledWith(expect.stringMatching(new RegExp(`${suffix.replace(/\\/g, "\\\\")}$`)), expect.any(Object));

    });

    it("should not start server if already started", () => {
        // GIVEN
        existsSyncMock.mockReturnValue(true);

        // WHEN
        try {
            start(false);
        } catch (e) {

        }

        // THEN
        expect(exitMock).toHaveBeenCalledWith(1);
        expect(mockSpawn).not.toHaveBeenCalled();
    });

    it("should rust log trace if verbose", () => {
        // GIVEN
        existsSyncMock.mockReturnValue(false);

        // WHEN
        start(true);

        // THEN
        expect(mockSpawn).toHaveBeenCalledWith(
           /* executable */  expect.any(String),
          /* options */ expect.objectContaining({
            detached: true,                     // check whatever other flags you care about
            env: expect.objectContaining({
                RUST_LOG: "trace",                // ✅ only this env var must match
            })
        }));
    });
});
