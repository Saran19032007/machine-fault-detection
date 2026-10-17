const env = require("../config/env");

// In-memory last-seen tracker, keyed by machineId.
// A machine is considered CONNECTED if we received data within the
// configured offline threshold.
const lastSeenByMachine = new Map();

function markSeen(machineId) {
  lastSeenByMachine.set(machineId, Date.now());
}

function getStatus(machineId) {
  const lastSeen = lastSeenByMachine.get(machineId);
  if (!lastSeen) {
    return { connected: false, lastSeen: null, secondsSinceLastSeen: null };
  }
  const secondsSinceLastSeen = (Date.now() - lastSeen) / 1000;
  return {
    connected: secondsSinceLastSeen <= env.DEVICE_OFFLINE_THRESHOLD_SECONDS,
    lastSeen: new Date(lastSeen).toISOString(),
    secondsSinceLastSeen: Math.round(secondsSinceLastSeen),
  };
}

function getAllStatuses() {
  const result = {};
  for (const machineId of lastSeenByMachine.keys()) {
    result[machineId] = getStatus(machineId);
  }
  return result;
}

module.exports = { markSeen, getStatus, getAllStatuses };
