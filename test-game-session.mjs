import assert from "node:assert/strict";
import { GAME_REGISTRY, getGameById, getAvailableGames } from "./src/game-registry.js";
import { createGameSession, toSupabaseGameSession } from "./src/game-session.js";

assert.equal(new Set(GAME_REGISTRY.map(g => g.id)).size, GAME_REGISTRY.length, "IDs must be unique");
assert.ok(getGameById("misi-berdikari"));
assert.ok(getAvailableGames().every(g => g.route && g.status === "live"));

let times = [
  new Date("2026-10-21T10:00:00.000Z"), // start
  new Date("2026-10-21T10:00:01.000Z"), // first attempt
  new Date("2026-10-21T10:00:02.000Z"), // second attempt
  new Date("2026-10-21T10:00:05.000Z")  // completion
];
const session = createGameSession({
  gameId: "peneroka-braille",
  skillCodes: ["braille-cell-recognition"],
  clock: () => times.shift() || new Date("2026-10-21T10:00:05.000Z"),
  idFactory: () => "123e4567-e89b-42d3-a456-426614174000"
});
session.recordAttempt({ skillCode: "braille-cell-recognition", correct: true });
session.recordAttempt({ skillCode: "braille-cell-recognition", correct: false, hintUsed: true });
session.setTaskProgress({ completed: 2, total: 3 });
const completed = session.complete({ score: 75 });
assert.equal(completed.attempts, 2);
assert.equal(completed.correctAttempts, 1);
assert.equal(completed.hintsUsed, 1);
assert.equal(completed.status, "completed");
const payload = toSupabaseGameSession(completed, {
  studentId: "223e4567-e89b-42d3-a456-426614174000",
  createdBy: "323e4567-e89b-42d3-a456-426614174000"
});
assert.equal(payload.game_slug, "peneroka-braille");
assert.equal(payload.attempts, 2);
assert.equal(payload.hints_used, 1);
assert.equal(payload.duration_seconds, 5);
assert.equal(payload.result_summary.tasks_completed, 2);
assert.throws(() => session.recordAttempt({ correct: true }), /Sesi sudah ditamatkan/);
const cancelled = createGameSession({ gameId: "test", idFactory: () => "423e4567-e89b-42d3-a456-426614174000" });
cancelled.cancel();
assert.throws(() => toSupabaseGameSession(cancelled.getSnapshot(), { studentId: "s", createdBy: "u" }), /Hanya sesi yang selesai/);
assert.throws(() => toSupabaseGameSession(completed, { studentId: "s" }), /diperlukan/);
console.log("PASS: registry IDs unique and available routes valid");
console.log("PASS: attempts, hints, progress and completion metrics");
console.log("PASS: Supabase payload mapping and duration");
console.log("PASS: finalized/cancelled sessions rejected from further use/sync");
