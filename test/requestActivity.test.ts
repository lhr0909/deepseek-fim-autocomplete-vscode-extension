import assert from "node:assert/strict";
import test from "node:test";
import { RequestActivity } from "../src/requestActivity";

test("RequestActivity reports active only while a request is open", () => {
  const activity = new RequestActivity();
  const events: boolean[] = [];
  activity.onDidChange((isActive) => events.push(isActive));

  const finish = activity.start();
  assert.equal(activity.isActive, true);

  finish();
  assert.equal(activity.isActive, false);
  assert.deepEqual(events, [true, false]);
});

test("RequestActivity stays active until all overlapping requests finish", () => {
  const activity = new RequestActivity();
  const events: boolean[] = [];
  activity.onDidChange((isActive) => events.push(isActive));

  const finishFirst = activity.start();
  const finishSecond = activity.start();
  finishFirst();

  assert.equal(activity.isActive, true);
  assert.deepEqual(events, [true]);

  finishSecond();
  assert.equal(activity.isActive, false);
  assert.deepEqual(events, [true, false]);
});

test("RequestActivity finish callbacks are idempotent", () => {
  const activity = new RequestActivity();
  const events: boolean[] = [];
  activity.onDidChange((isActive) => events.push(isActive));

  const finish = activity.start();
  finish();
  finish();

  assert.equal(activity.isActive, false);
  assert.deepEqual(events, [true, false]);
});

test("RequestActivity listeners can unsubscribe", () => {
  const activity = new RequestActivity();
  const events: boolean[] = [];
  const unsubscribe = activity.onDidChange((isActive) => events.push(isActive));

  unsubscribe();
  const finish = activity.start();
  finish();

  assert.deepEqual(events, []);
});
