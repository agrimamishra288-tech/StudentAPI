"use strict";

(() => {
  const STATE_KEY = "lab2-student-api-console";

  const dom = {
    flash: document.getElementById("flash"),
    statCount: document.getElementById("statCount"),
    statCourses: document.getElementById("statCourses"),
    statRequests: document.getElementById("statRequests"),

    newStudentBtn: document.getElementById("newStudentBtn"),
    studentForm: document.getElementById("studentForm"),
    entryTitle: document.getElementById("entryTitle"),
    cancelEntry: document.getElementById("cancelEntry"),
    fieldName: document.getElementById("fieldName"),
    fieldEmail: document.getElementById("fieldEmail"),
    fieldCourse: document.getElementById("fieldCourse"),
    fieldYear: document.getElementById("fieldYear"),
    formError: document.getElementById("formError"),
    formErrorList: document.getElementById("formErrorList"),
    saveStudent: document.getElementById("saveStudent"),

    studentRows: document.getElementById("studentRows"),
    tableNote: document.getElementById("tableNote"),
    deleteSlip: document.getElementById("deleteSlip"),
    deleteName: document.getElementById("deleteName"),
    deleteMeta: document.getElementById("deleteMeta"),
    cancelDelete: document.getElementById("cancelDelete"),
    confirmDelete: document.getElementById("confirmDelete"),

    requestForm: document.getElementById("requestForm"),
    method: document.getElementById("method"),
    path: document.getElementById("path"),
    requestBody: document.getElementById("requestBody"),
    bodyField: document.getElementById("bodyField"),
    sendBtn: document.getElementById("sendBtn"),
    draftHint: document.getElementById("draftHint"),
    responseBody: document.getElementById("responseBody"),
    statusPill: document.getElementById("statusPill"),
    responseTime: document.getElementById("responseTime"),
    checkCount: document.getElementById("checkCount"),
    checkList: document.getElementById("checkList"),
    allDone: document.getElementById("allDone"),
    liveBadge: document.getElementById("liveBadge"),
    liveText: document.getElementById("liveText")
  };

  let records = [];
  let selectedId = null;
  let editingId = null;
  let pendingDeleteId = null;
  let requestsSent = 0;
  let checks = { list: false, read: false, create: false, update: false, delete: false };
  let flashTimer = null;

  /* ---------- small helpers ---------- */

  const escapeHtml = (value) =>
    String(value).replace(/[&<>"']/g, (character) => {
      const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
      return map[character];
    });

  const padCount = (value) => String(value).padStart(2, "0");

  const demoId = () => selectedId ?? (records[0] ? records[0].id : 9999);

  function loadSessionState() {
    try {
      const saved = JSON.parse(sessionStorage.getItem(STATE_KEY) || "null");
      if (!saved || typeof saved !== "object") return;

      if (Number.isInteger(saved.requestsSent) && saved.requestsSent >= 0) {
        requestsSent = saved.requestsSent;
      }
      if (saved.checks && typeof saved.checks === "object") {
        Object.keys(checks).forEach((key) => {
          if (typeof saved.checks[key] === "boolean") checks[key] = saved.checks[key];
        });
      }
    } catch (error) {
      // sessionStorage can be unavailable; the page still works without it.
    }
  }

  function saveSessionState() {
    try {
      sessionStorage.setItem(STATE_KEY, JSON.stringify({ requestsSent, checks }));
    } catch (error) {
      // Ignore storage failures.
    }
  }

  /* ---------- HTTP ---------- */

  async function api(method, path, body = null, options = {}) {
    const { log = true, sync = true, rawBody = null } = options;
    const startedAt = performance.now();

    let response = null;
    let payload = null;
    let networkError = null;

    try {
      const requestOptions = { method, headers: {}, cache: "no-store" };

      if (rawBody !== null) {
        requestOptions.headers["Content-Type"] = "application/json";
        requestOptions.body = rawBody;
      } else if (body !== null) {
        requestOptions.headers["Content-Type"] = "application/json";
        requestOptions.body = JSON.stringify(body);
      }

      response = await fetch(path, requestOptions);
      const text = await response.text();

      if (text) {
        try {
          payload = JSON.parse(text);
        } catch (error) {
          payload = { raw: text };
        }
      }

      setLive(true);
    } catch (error) {
      networkError = error;
      setLive(false);
    }

    const elapsed = Math.round(performance.now() - startedAt);

    const result = networkError
      ? {
          ok: false,
          status: 0,
          statusText: "No response",
          networkError: true,
          elapsed,
          payload: {
            success: false,
            error: "Could not reach the API",
            details: ["Start the server with npm start, then try again."]
          }
        }
      : {
          ok: response.ok,
          status: response.status,
          statusText: response.statusText,
          networkError: false,
          elapsed,
          payload
        };

    if (log) {
      requestsSent += 1;
      updateStats();
      renderResponse(result);
      if (sync) syncRequest(method, path, body, rawBody);
      if (!result.networkError && result.ok) markEndpoint(method, path);
      saveSessionState();
    }

    return result;
  }

  function syncRequest(method, path, body, rawBody = null) {
    dom.method.value = method;
    dom.path.value = path;

    if (rawBody !== null) {
      dom.requestBody.value = rawBody;
    } else if (body !== null) {
      dom.requestBody.value = JSON.stringify(body, null, 2);
    } else {
      dom.requestBody.value = "";
    }

    toggleBody(method);
  }

  function setLive(isUp) {
    dom.liveBadge.classList.toggle("is-down", !isUp);
    dom.liveText.textContent = isUp ? "localhost:3000" : "server offline";
  }

  /* ---------- endpoint checklist ---------- */

  function markEndpoint(method, path) {
    const clean = path.split("?")[0].replace(/\/+$/, "");
    let key = null;

    if (method === "GET" && clean === "/students") key = "list";
    else if (method === "GET" && /^\/students\/\d+$/.test(clean)) key = "read";
    else if (method === "POST" && clean === "/students") key = "create";
    else if (method === "PUT" && /^\/students\/\d+$/.test(clean)) key = "update";
    else if (method === "DELETE" && /^\/students\/\d+$/.test(clean)) key = "delete";

    if (!key || checks[key]) return;

    checks[key] = true;
    renderChecks();
    saveSessionState();
  }

  function renderChecks() {
    let done = 0;
    dom.checkList.querySelectorAll("li").forEach((item) => {
      const isChecked = Boolean(checks[item.dataset.check]);
      item.classList.toggle("is-checked", isChecked);
      if (isChecked) done += 1;
    });

    dom.checkCount.textContent = `${done} / 5`;
    dom.allDone.hidden = done < 5;
  }

  /* ---------- rendering ---------- */

  function updateStats() {
    dom.statCount.textContent = padCount(records.length);

    const courses = new Set(
      records.map((student) => String(student.course).trim().toLowerCase())
    );
    dom.statCourses.textContent = padCount(courses.size);
    dom.statRequests.textContent = padCount(requestsSent);
  }

  function updateChipPaths() {
    const id = demoId();
    document.querySelectorAll(".chip[data-draft] .chip-path").forEach((element) => {
      element.textContent = `/students/${id}`;
    });
  }

  function renderTable() {
    dom.studentRows.replaceChildren();
    dom.tableNote.hidden = true;

    if (records.length === 0) {
      const row = document.createElement("tr");
      const cell = document.createElement("td");
      cell.colSpan = 5;

      const empty = document.createElement("div");
      empty.className = "empty-state";

      const message = document.createElement("p");
      message.textContent =
        "The register is empty. Add the first record, or restart the server to bring the seed data back.";

      const button = document.createElement("button");
      button.type = "button";
      button.className = "btn btn--ink";
      button.textContent = "+ Add the first student";
      button.addEventListener("click", openCreateForm);

      empty.append(message, button);
      cell.append(empty);
      row.append(cell);
      dom.studentRows.append(row);

      updateStats();
      updateChipPaths();
      return;
    }

    records.forEach((student) => {
      const row = document.createElement("tr");
      row.dataset.id = String(student.id);
      if (student.id === selectedId) row.classList.add("is-selected");

      row.innerHTML = `
        <td class="cell-id"><span class="hash">#</span>${student.id}</td>
        <td>
          <span class="student-name">${escapeHtml(student.name)}</span>
          <span class="student-email">${escapeHtml(student.email)}</span>
          <span class="student-meta">${escapeHtml(student.course)} &middot; Year ${Number(student.year)}</span>
        </td>
        <td class="cell-course">${escapeHtml(student.course)}</td>
        <td><span class="year-tag">Year ${Number(student.year)}</span></td>
        <td class="cell-actions">
          <button class="row-action" type="button" data-action="read" data-id="${student.id}">read</button>
          <button class="row-action" type="button" data-action="edit" data-id="${student.id}">edit</button>
          <button class="row-action row-action--danger" type="button" data-action="delete" data-id="${student.id}">delete</button>
        </td>
      `;

      dom.studentRows.append(row);
    });

    updateStats();
    updateChipPaths();
  }

  function highlightJson(value) {
    const json = JSON.stringify(value, null, 2);
    if (json === undefined) return "";

    const tokenPattern =
      /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g;

    let output = "";
    let cursor = 0;
    let match = tokenPattern.exec(json);

    while (match) {
      output += escapeHtml(json.slice(cursor, match.index));

      if (match[1]) {
        if (match[2]) {
          output += `<span class="tok-key">${escapeHtml(match[1])}</span>${escapeHtml(match[2])}`;
        } else {
          output += `<span class="tok-str">${escapeHtml(match[1])}</span>`;
        }
      } else if (match[3]) {
        output += `<span class="tok-bool">${escapeHtml(match[3])}</span>`;
      } else {
        output += `<span class="tok-num">${escapeHtml(match[4])}</span>`;
      }

      cursor = tokenPattern.lastIndex;
      match = tokenPattern.exec(json);
    }

    output += escapeHtml(json.slice(cursor));
    return output;
  }

  function renderResponse(result) {
    dom.statusPill.className = "status-pill";

    if (result.networkError) {
      dom.statusPill.classList.add("status-pill--bad");
      dom.statusPill.textContent = "offline";
      dom.responseTime.textContent = "";
    } else {
      const status = result.status;
      const tone =
        status >= 200 && status < 300
          ? "ok"
          : status === 404 || status >= 500
            ? "bad"
            : status >= 400
              ? "warn"
              : "idle";

      dom.statusPill.classList.add(`status-pill--${tone}`);
      dom.statusPill.textContent = `${status} ${result.statusText || ""}`.trim();
      dom.responseTime.textContent = `${result.elapsed} ms`;
    }

    dom.responseBody.innerHTML =
      result.payload === null
        ? '<span class="tok-null">No content</span>'
        : highlightJson(result.payload);
  }

  /* ---------- register actions ---------- */

  async function loadRegister(options = {}) {
    const { log = true } = options;
    const result = await api("GET", "/students", null, { log });

    if (!result.ok || !result.payload || !Array.isArray(result.payload.data)) {
      dom.tableNote.hidden = false;
      dom.tableNote.textContent = "Could not read the register. Is the server running?";
      return;
    }

    records = result.payload.data;
    if (selectedId !== null && !records.some((student) => student.id === selectedId)) {
      selectedId = null;
    }

    renderTable();
  }

  async function readStudent(id) {
    const result = await api("GET", `/students/${id}`);

    if (!result.ok) {
      showFlash(result.payload && result.payload.error ? result.payload.error : "Could not read that record.", "error");
      return;
    }

    selectedId = id;
    renderTable();
  }

  function openCreateForm() {
    closeDelete();
    editingId = null;
    dom.studentForm.reset();
    dom.formError.hidden = true;
    dom.entryTitle.textContent = "New entry";
    dom.saveStudent.textContent = "Create record";
    dom.studentForm.hidden = false;
    dom.fieldName.focus();
    dom.studentForm.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  async function openEditForm(id) {
    const result = await api("GET", `/students/${id}`);

    if (!result.ok) {
      showFlash(result.payload && result.payload.error ? result.payload.error : "Could not open that record.", "error");
      return;
    }

    closeDelete();
    const student = result.payload.data;
    editingId = student.id;
    selectedId = student.id;
    renderTable();

    dom.fieldName.value = student.name;
    dom.fieldEmail.value = student.email;
    dom.fieldCourse.value = student.course;
    dom.fieldYear.value = String(student.year);
    dom.entryTitle.textContent = `Editing #${student.id}`;
    dom.saveStudent.textContent = "Save changes";
    dom.formError.hidden = true;
    dom.studentForm.hidden = false;
    dom.fieldName.focus();
    dom.studentForm.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  function closeForm() {
    dom.studentForm.hidden = true;
    dom.studentForm.reset();
    dom.formError.hidden = true;
    editingId = null;
  }

  function showFormErrors(payload) {
    const details =
      payload && Array.isArray(payload.details) && payload.details.length > 0
        ? payload.details
        : [payload && payload.error ? payload.error : "Something went wrong."];

    dom.formErrorList.replaceChildren();
    details.forEach((message) => {
      const item = document.createElement("li");
      item.textContent = message;
      dom.formErrorList.append(item);
    });

    dom.formError.hidden = false;
  }

  async function saveStudent(event) {
    event.preventDefault();

    const isEdit = editingId !== null;
    const payload = {
      name: dom.fieldName.value.trim(),
      email: dom.fieldEmail.value.trim(),
      course: dom.fieldCourse.value.trim(),
      year: Number(dom.fieldYear.value)
    };

    dom.saveStudent.disabled = true;
    dom.saveStudent.textContent = isEdit ? "Saving..." : "Creating...";

    const result = await api(isEdit ? "PUT" : "POST", isEdit ? `/students/${editingId}` : "/students", payload);

    dom.saveStudent.disabled = false;
    dom.saveStudent.textContent = isEdit ? "Save changes" : "Create record";

    if (!result.ok) {
      showFormErrors(result.payload);
      return;
    }

    const saved = result.payload ? result.payload.data : null;
    if (saved && Number.isInteger(saved.id)) selectedId = saved.id;

    closeForm();
    await loadRegister({ log: false });
    showFlash(
      isEdit
        ? `Saved changes to #${saved ? saved.id : "record"}.`
        : `Added #${saved ? saved.id : "new record"} to the register.`
    );
  }

  function askDelete(id) {
    const student = records.find((entry) => entry.id === id);
    if (!student) {
      loadRegister({ log: false });
      return;
    }

    pendingDeleteId = id;
    selectedId = id;
    renderTable();

    dom.deleteName.textContent = student.name;
    dom.deleteMeta.textContent = `#${student.id} · ${student.course}`;
    dom.deleteSlip.hidden = false;
    dom.cancelDelete.focus();
  }

  function closeDelete() {
    pendingDeleteId = null;
    dom.deleteSlip.hidden = true;
  }

  async function confirmDelete() {
    if (pendingDeleteId === null) return;

    const id = pendingDeleteId;
    dom.confirmDelete.disabled = true;

    const result = await api("DELETE", `/students/${id}`);

    dom.confirmDelete.disabled = false;
    closeDelete();

    if (!result.ok) {
      showFlash(
        result.payload && result.payload.error ? result.payload.error : "The record could not be deleted.",
        "error"
      );
      return;
    }

    if (selectedId === id) selectedId = null;
    await loadRegister({ log: false });

    const removed = result.payload ? result.payload.data : null;
    showFlash(`Removed #${id}${removed ? ` (${removed.name})` : ""} from the register.`);
  }

  function showFlash(message, tone = "ok") {
    window.clearTimeout(flashTimer);
    dom.flash.textContent = message;
    dom.flash.className = tone === "error" ? "flash flash--error" : "flash";
    dom.flash.hidden = false;

    flashTimer = window.setTimeout(() => {
      dom.flash.hidden = true;
    }, 5200);
  }

  /* ---------- request desk ---------- */

  function toggleBody(method) {
    const needsBody = method === "POST" || method === "PUT";
    dom.bodyField.hidden = !needsBody;
    dom.requestBody.disabled = !needsBody;
  }

  function buildDraft(type) {
    const id = demoId();
    const student = records.find((entry) => entry.id === id) || null;

    switch (type) {
      case "list":
        return { method: "GET", path: "/students" };
      case "read":
        return { method: "GET", path: `/students/${id}` };
      case "create":
        return {
          method: "POST",
          path: "/students",
          body: {
            name: "Nisha Verma",
            email: `nisha.${Date.now()}@example.com`,
            course: "B.Tech CSE",
            year: 2
          }
        };
      case "update":
        return {
          method: "PUT",
          path: `/students/${id}`,
          body: student
            ? {
                name: student.name,
                email: student.email,
                course: student.course,
                year: student.year
              }
            : {
                name: "Nisha Verma",
                email: "nisha.verma@example.com",
                course: "B.Tech CSE",
                year: 2
              }
        };
      case "remove":
        return { method: "DELETE", path: `/students/${id}` };
      case "bad":
        return { method: "POST", path: "/students", body: {} };
      case "missing":
        return { method: "GET", path: "/students/9999" };
      default:
        return { method: "GET", path: "/students" };
    }
  }

  function handleDraft(type) {
    const draft = buildDraft(type);

    dom.method.value = draft.method;
    dom.path.value = draft.path;

    if (draft.body !== undefined) {
      dom.requestBody.value = JSON.stringify(draft.body, null, 2);
    } else {
      dom.requestBody.value = "";
    }

    toggleBody(draft.method);
    dom.draftHint.textContent =
      type === "remove"
        ? "Drafted a delete. Press Send only if you mean it."
        : "Drafted. Press Send to run it.";

    dom.path.focus();
    dom.path.setSelectionRange(dom.path.value.length, dom.path.value.length);
  }

  async function handleSend(event) {
    event.preventDefault();

    const method = dom.method.value;
    const path = dom.path.value.trim();

    if (!path.startsWith("/")) {
      dom.draftHint.textContent = "A path should start with /. Try /students.";
      dom.path.focus();
      return;
    }

    let body = null;
    let rawBody = null;

    if (method === "POST" || method === "PUT") {
      const raw = dom.requestBody.value.trim();
      if (raw) {
        try {
          body = JSON.parse(raw);
        } catch (error) {
          rawBody = raw;
        }
      }
    }

    dom.sendBtn.disabled = true;
    dom.sendBtn.textContent = "Wait";

    const result = await api(method, path, body, { sync: false, rawBody });

    dom.sendBtn.disabled = false;
    dom.sendBtn.textContent = "Send";
    dom.draftHint.textContent = result.networkError
      ? "No answer. Run npm start in the project folder."
      : result.ok
        ? "Done. The register is in sync."
        : "The API answered. Check the status code above.";

    if (result.ok && ["POST", "PUT", "DELETE"].includes(method)) {
      if (method === "POST" && result.payload && result.payload.data && Number.isInteger(result.payload.data.id)) {
        selectedId = result.payload.data.id;
      }
      if (method === "DELETE") {
        const match = path.match(/^\/students\/(\d+)/);
        if (match && selectedId === Number(match[1])) selectedId = null;
      }
      await loadRegister({ log: false });
    }
  }

  /* ---------- events ---------- */

  function handleRowClick(event) {
    const actionButton = event.target.closest("button[data-action]");

    if (actionButton) {
      const id = Number(actionButton.dataset.id);
      const action = actionButton.dataset.action;

      if (action === "read") readStudent(id);
      else if (action === "edit") openEditForm(id);
      else if (action === "delete") askDelete(id);
      return;
    }

    const row = event.target.closest("tr[data-id]");
    if (row) readStudent(Number(row.dataset.id));
  }

  function bindEvents() {
    dom.newStudentBtn.addEventListener("click", openCreateForm);
    dom.cancelEntry.addEventListener("click", closeForm);
    dom.studentForm.addEventListener("submit", saveStudent);

    dom.studentRows.addEventListener("click", handleRowClick);
    dom.cancelDelete.addEventListener("click", closeDelete);
    dom.confirmDelete.addEventListener("click", confirmDelete);

    dom.requestForm.addEventListener("submit", handleSend);
    dom.method.addEventListener("change", () => toggleBody(dom.method.value));

    dom.requestBody.addEventListener("keydown", (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        dom.requestForm.requestSubmit();
      }
    });

    document.querySelectorAll(".chip[data-draft]").forEach((chip) => {
      chip.addEventListener("click", () => handleDraft(chip.dataset.draft));
    });
  }

  /* ---------- boot ---------- */

  loadSessionState();
  bindEvents();
  renderChecks();
  updateStats();
  updateChipPaths();
  loadRegister();
})();
