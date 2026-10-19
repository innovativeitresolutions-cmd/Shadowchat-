// Planning labels and due dates are unverified, browser-local metadata only.
export function planningOwner(value) {
  if (value == null || value === "") return "";
  if (typeof value !== "string") throw new TypeError("Suggested owner must be text.");
  const name = value.trim().replace(/\s+/g, " ");
  if (name.length > 80 || [...name].some(c => c.charCodeAt(0) < 32)) {
    throw new RangeError("Suggested owner must be at most 80 safe characters.");
  }
  return name;
}

export function planningDate(value) {
  if (value == null || value === "") return "";
  if (typeof value !== "string" || !/^(?:20[0-9]{2}|2100)-[0-9]{2}-[0-9]{2}$/.test(value)) {
    throw new RangeError("Use a valid YYYY-MM-DD planning date.");
  }
  const time = Date.parse(value + "T00:00:00Z");
  if (!Number.isFinite(time) || new Date(time).toISOString().slice(0, 10) !== value) {
    throw new RangeError("Invalid calendar date.");
  }
  return value;
}

export function safePlanningField(value, parse) {
  try { return parse(value); } catch { return ""; }
}

export function impactScheduleSummary(campaign, today) {
  const day = planningDate(today);
  if (!day) throw new RangeError("UTC summary date required.");
  const now = Date.parse(day + "T00:00:00Z");
  const tasks = Array.isArray(campaign?.tasks) ? campaign.tasks : [];
  const result = { open: 0, completed: 0, unassigned: 0, scheduled: 0, overdue: 0, dueSoon: 0 };
  for (const task of tasks) {
    if (!task) continue;
    if (task.done === true) { result.completed++; continue; }
    result.open++;
    if (!safePlanningField(task.ownerLabel, planningOwner)) result.unassigned++;
    const due = safePlanningField(task.dueDate, planningDate);
    if (!due) continue;
    result.scheduled++;
    const difference = Date.parse(due + "T00:00:00Z") - now;
    if (difference < 0) result.overdue++;
    else if (difference <= 7 * 86400000) result.dueSoon++;
  }
  return result;
}
