"use strict";
import exp from "node:constants";
import { randomBytes } from "node:crypto";

let id = null;

export default function genId() {
  if (!id) {
    id = randomBytes(20);
    Buffer.from("-AT0001-").copy(id, 0);
  }
  return id;
}
