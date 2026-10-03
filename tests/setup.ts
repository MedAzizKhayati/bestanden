import { mock } from "bun:test";

// Server modules import "server-only", which throws outside the React server build.
mock.module("server-only", () => ({}));
