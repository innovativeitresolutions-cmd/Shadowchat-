import { makePlan } from "./planner-core.mjs";

const form = document.getElementById("planner-form");
const result = document.getElementById("planner-result");
const output = document.getElementById("planner-output");
const feedback = document.getElementById("planner-feedback");
const download = document.getElementById("planner-download");
let lastPlan = null;

form.addEventListener("submit", event => {
  event.preventDefault();
  lastPlan = null;
  try {
    lastPlan = makePlan({
      type: form.elements.namedItem("type").value,
      goal: form.elements.namedItem("goal").value,
      minutes: form.elements.namedItem("minutes").value
    });
    output.textContent = lastPlan.markdown;
    result.hidden = false;
    feedback.textContent = "Your plan is ready. It was generated entirely on this device.";
    result.scrollIntoView({ behavior: "smooth", block: "nearest" });
  } catch {
    output.textContent = "";
    result.hidden = true;
    feedback.textContent = "Enter a short goal and choose a supported workflow and time limit.";
  }
});
download.addEventListener("click", () => {
  if (!lastPlan) return;
  const data = new Blob([lastPlan.markdown], {type: "text/markdown"});
  const url = URL.createObjectURL(data);
  const link = document.createElement("a");
  link.href = url;
  link.download = "hopeai-" + form.elements.namedItem("type").value + "-plan.md";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  feedback.textContent = "Plan exported to this device.";
});
