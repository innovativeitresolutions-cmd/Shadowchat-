import {
  PLAN_TEMPLATES, createHopePlan, normalizeHopePlan, toggleHopeStep, progressOf,
  createImpactWorkspace, normalizeImpactWorkspace, addImpactTask,
  toggleImpactTask, removeImpactTask, handoffCampaignToHope
} from "./workflows.mjs";

// Enhances the existing browser-local engineering beta; does not claim backend storage.
function errorFor(form, message) {
  let status = form.querySelector("[data-workspace-error]");
  if (!status) {
    status = document.createElement("p");
    status.className = "bad";
    status.setAttribute("role", "alert");
    status.dataset.workspaceError = "true";
    form.append(status);
  }
  status.textContent = message;
}

function progressHtml(steps, escapeHtml) {
  const p = progressOf(steps);
  return '<div class="workspace-progress">' +
    '<div class="item-row"><span class="muted">Completed actions</span><strong>' +
    p.done + '/' + p.total + ' (' + p.percent + '%)</strong></div>' +
    '<div class="progress" role="progressbar" aria-label="Actions completed" aria-valuenow="' +
    p.percent + '" aria-valuemin="0" aria-valuemax="100"><span style="width:' +
    p.percent + '%"></span></div></div>';
}

function renderHopeList(plans, escapeHtml) {
  if (!plans.length) return '<div class="empty">Create your first action plan. Work is stored in this browser only.</div>';
  return plans.map((plan, index) => {
    const tasks = plan.steps.map((step) => {
      return '<li class="workspace-task"><button type="button" class="btn workspace-step' +
        (step.done ? ' is-done' : '') + '" data-hope-toggle="' + index +
        '" data-step-id="' + escapeHtml(step.id) + '" aria-pressed="' + Boolean(step.done) +
        '"><span aria-hidden="true">' + (step.done ? '✓' : '○') + '</span> ' +
        escapeHtml(step.title) + '</button></li>';
    }).join('');
    return '<article class="item stack"><div class="item-row"><div><span class="pill">' +
      escapeHtml(plan.template) + '</span><h3 class="workspace-heading">' +
      escapeHtml(plan.goal) + '</h3></div><button type="button" class="btn danger" data-hope-delete="' +
      index + '" aria-label="Delete plan ' + escapeHtml(plan.goal) + '">Delete</button></div>' +
      progressHtml(plan.steps, escapeHtml) + '<ol class="workspace-tasks">' + tasks + '</ol>' +
      (plan.sourceCampaignId ? '<span class="pill">Created from an Impact campaign</span>' : '') +
      '</article>';
  }).join('');
}

function renderImpactList(campaigns, escapeHtml) {
  if (!campaigns.length) return '<div class="empty">No campaign plans yet. Create one and add actions to track actual work.</div>';
  return campaigns.map((campaign, index) => {
    const tasks = campaign.tasks.map((task) =>
      '<li class="workspace-task"><button type="button" class="btn workspace-step' +
      (task.done ? ' is-done' : '') + '" data-impact-toggle="' + index + '" data-task-id="' +
      escapeHtml(task.id) + '" aria-pressed="' + Boolean(task.done) + '">' +
      (task.done ? '✓ ' : '○ ') + escapeHtml(task.title) + '</button>' +
      '<button class="btn danger" type="button" data-impact-remove="' + index +
      '" data-task-id="' + escapeHtml(task.id) + '" aria-label="Remove action ' +
      escapeHtml(task.title) + '">Remove</button></li>'
    ).join('');
    return '<article class="item stack"><div class="item-row"><div><h3 class="workspace-heading">' +
      escapeHtml(campaign.title) + '</h3><p>' + escapeHtml(campaign.goal) +
      '</p></div><button type="button" class="btn danger" data-impact-delete="' + index +
      '" aria-label="Delete campaign ' + escapeHtml(campaign.title) + '">Delete</button></div>' +
      '<p class="muted">Pledge intent (not received): $' +
      escapeHtml(Number(campaign.pledgeIntent).toFixed(2)) +
      ' · Donations: none · Charity verified: no</p>' +
      progressHtml(campaign.tasks, escapeHtml) +
      '<ul class="workspace-tasks">' + tasks + '</ul>' +
      '<form data-impact-action-form="' + index + '" class="workspace-action-form">' +
      '<label>Next volunteer or planning action<input name="action" maxlength="160" required placeholder="e.g. Confirm volunteer schedule"></label>' +
      '<button class="btn" type="submit">Add action</button><p role="alert" class="bad" data-workspace-error></p></form>' +
      '<button type="button" class="btn primary workspace-handoff" data-impact-handoff="' + index +
      '">Create HopeAI action plan from this campaign</button></article>';
  }).join('');
}

export function enhanceWorkspaces(area, { state, save, render, uid, go, escapeHtml }) {
  if (area === "hopeai") {
    const form = document.getElementById("hope");
    const plansArea = document.querySelector("#main section.card");
    if (!form || !plansArea) return;

    state.hope = (Array.isArray(state.hope) ? state.hope : [])
      .map((plan, i) => normalizeHopePlan(plan, i)).filter(Boolean);
    const typeLabel = document.createElement("label");
    typeLabel.textContent = "Action-plan focus";
    const typeSelect = document.createElement("select");
    typeSelect.id = "hopeTemplate";
    for (const type of Object.keys(PLAN_TEMPLATES)) {
      const option = document.createElement("option");
      option.value = type;
      option.textContent = type === "product" ? "Product & engineering" :
        type === "charity" ? "Community & charity" :
        type === "learning" ? "Education & learning" : "General";
      typeSelect.append(option);
    }
    typeLabel.append(typeSelect);
    form.insertBefore(typeLabel, form.querySelector('button'));
    const button = form.querySelector('button');
    button.textContent = "Create actionable plan";
    form.onsubmit = (event) => {
      event.preventDefault();
      try {
        state.hope.unshift(createHopePlan(document.getElementById("hopeText").value,
          typeSelect.value, uid(), new Date().toISOString()));
        save(); render();
      } catch (error) { errorFor(form, error.message); }
    };
    plansArea.innerHTML = '<h2>My action plans</h2><p class="muted">Check off steps as you finish them. Progress stays on this device.</p>' +
      '<div class="stack">' + renderHopeList(state.hope, escapeHtml) + '</div>';
    plansArea.querySelectorAll("[data-hope-toggle]").forEach((control) => {
      control.onclick = () => {
        const index = Number(control.dataset.hopeToggle);
        try {
          state.hope[index] = toggleHopeStep(state.hope[index], control.dataset.stepId);
          save(); render();
        } catch (error) { errorFor(form, error.message); }
      };
    });
    plansArea.querySelectorAll("[data-hope-delete]").forEach((control) => {
      control.onclick = () => {
        const index = Number(control.dataset.hopeDelete);
        if (window.confirm("Delete this local action plan?")) {
          state.hope.splice(index, 1); save(); render();
        }
      };
    });
  }
  if (area === "impact") {
    const form = document.getElementById("impact");
    const campaignArea = document.querySelector("#main section.card");
    if (!form || !campaignArea) return;
    state.impact = (Array.isArray(state.impact) ? state.impact : [])
      .map((campaign, i) => normalizeImpactWorkspace(campaign, i)).filter(Boolean);
    form.querySelector("button").textContent = "Create campaign action board";
    form.onsubmit = (event) => {
      event.preventDefault();
      try {
        state.impact.unshift(createImpactWorkspace({
          title: document.getElementById("it").value,
          goal: document.getElementById("ig").value,
          pledgeIntent: document.getElementById("ip").value
        }, uid(), new Date().toISOString()));
        save(); render();
      } catch (error) { errorFor(form, error.message); }
    };
    campaignArea.innerHTML = '<h2>Campaign action boards</h2><p class="muted">Plan and track local volunteer work. Pledges are not payments.</p>' +
      '<div class="stack">' + renderImpactList(state.impact, escapeHtml) + '</div>';
    campaignArea.querySelectorAll("[data-impact-action-form]").forEach((actionForm) => {
      actionForm.onsubmit = (event) => {
        event.preventDefault();
        const index = Number(actionForm.dataset.impactActionForm);
        try {
          state.impact[index] = addImpactTask(state.impact[index],
            actionForm.elements.namedItem("action").value, uid());
          save(); render();
        } catch (error) { errorFor(actionForm, error.message); }
      };
    });
    campaignArea.querySelectorAll("[data-impact-toggle]").forEach((control) => {
      control.onclick = () => {
        const index = Number(control.dataset.impactToggle);
        try {
          state.impact[index] = toggleImpactTask(state.impact[index], control.dataset.taskId);
          save(); render();
        } catch (error) { errorFor(form, error.message); }
      };
    });
    campaignArea.querySelectorAll("[data-impact-remove]").forEach((control) => {
      control.onclick = () => {
        const index = Number(control.dataset.impactRemove);
        state.impact[index] = removeImpactTask(state.impact[index], control.dataset.taskId);
        save(); render();
      };
    });
    campaignArea.querySelectorAll("[data-impact-delete]").forEach((control) => {
      control.onclick = () => {
        if (window.confirm("Delete this local campaign and its tasks?")) {
          state.impact.splice(Number(control.dataset.impactDelete), 1);
          save(); render();
        }
      };
    });
    campaignArea.querySelectorAll("[data-impact-handoff]").forEach((control) => {
      control.onclick = () => {
        try {
          state.hope = Array.isArray(state.hope) ? state.hope : [];
          state.hope.unshift(handoffCampaignToHope(
            state.impact[Number(control.dataset.impactHandoff)], uid(), new Date().toISOString()));
          save(); go("hopeai");
        } catch (error) { errorFor(form, error.message); }
      };
    });
  }
}
