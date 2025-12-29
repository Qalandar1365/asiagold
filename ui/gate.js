/* ASIAGOLD UI v0.4.9 | STAGE 4.1: Signup/Login Gate (UI-only) */
(() => {
  "use strict";

  const LS = Object.freeze({
    pendingUsers: "asiagold.pendingUsers",
    users: "asiagold.users",
    currentUser: "asiagold.currentUser",
    currentOfficeId: "asiagold.currentOfficeId",
  });

  const STATUS = Object.freeze({
    PENDING: "PENDING",
    APPROVED: "APPROVED",
    REJECTED: "REJECTED",
  });

  const ROLES = Object.freeze({
    customer: "customer",
    sales_manager: "sales_manager",
    office_order_manager: "office_order_manager",
    system_admin: "system_admin",
  });

  function nowIso() {
    return new Date().toISOString();
  }

  function genId(prefix) {
    return `${prefix}-${Math.random().toString(16).slice(2)}-${Date.now().toString(16)}`;
  }

  function safeJsonParse(raw, fallback) {
    if (raw == null || raw === "") return fallback;
    try {
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }

  function readJson(key, fallback) {
    return safeJsonParse(localStorage.getItem(key), fallback);
  }

  function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function onlyDigits(s) {
    return String(s || "").replace(/\D+/g, "");
  }

  function setLogoState(state) {
    const brand = document.getElementById("ag-brand");
    if (!brand) return;
    brand.classList.toggle("logo--hero", state === "hero");
    brand.classList.toggle("logo--app", state === "app");
  }

  function seedStaffUsersOnce() {
    const users = readJson(LS.users, []);
    if (Array.isArray(users) && users.length) return;
    const officeId = String(localStorage.getItem(LS.currentOfficeId) || "office-teh");
    const seeded = [
      { id: "staff-admin", name: "ادمین سیستم", phone: "09000000001", role: ROLES.system_admin, status: STATUS.APPROVED, createdAt: nowIso(), officeId },
      { id: "staff-oom", name: "مدیر سفارش دفتر", phone: "09000000002", role: ROLES.office_order_manager, status: STATUS.APPROVED, createdAt: nowIso(), officeId },
      { id: "staff-sm", name: "مدیر فروش", phone: "09000000003", role: ROLES.sales_manager, status: STATUS.APPROVED, createdAt: nowIso(), officeId },
    ];
    writeJson(LS.users, seeded);
  }

  function clearCurrentUser() {
    localStorage.removeItem(LS.currentUser);
  }

  function setMessage(el, text, tone) {
    if (!el) return;
    el.textContent = text || "";
    el.dataset.tone = tone || "";
  }

  setLogoState("hero");
  seedStaffUsersOnce();
  clearCurrentUser();
  if (!localStorage.getItem(LS.currentOfficeId)) localStorage.setItem(LS.currentOfficeId, "office-teh");

  const els = {
    signupName: document.getElementById("ag-signup-name"),
    signupPhone: document.getElementById("ag-signup-phone"),
    signupNote: document.getElementById("ag-signup-note"),
    signupSubmit: document.getElementById("ag-signup-submit"),
    signupMsg: document.getElementById("ag-signup-msg"),
    loginPhone: document.getElementById("ag-login-phone"),
    loginSubmit: document.getElementById("ag-login-submit"),
    loginMsg: document.getElementById("ag-login-msg"),
  };

  if (!els.signupSubmit || !els.loginSubmit) return;

  els.signupSubmit.addEventListener("click", () => {
    const name = String(els.signupName?.value || "").trim();
    const phone = onlyDigits(els.signupPhone?.value || "");
    const note = String(els.signupNote?.value || "").trim();

    if (!name || !phone) {
      setMessage(els.signupMsg, "نام و شماره موبایل الزامی است.", "bad");
      return;
    }

    const pending = readJson(LS.pendingUsers, []);
    const users = readJson(LS.users, []);
    const alreadyApproved = (users || []).some((u) => onlyDigits(u.phone) === phone && u.status === STATUS.APPROVED);
    if (alreadyApproved) {
      setMessage(els.signupMsg, "این شماره قبلاً تأیید شده است. از بخش ورود استفاده کنید.", "ok");
      return;
    }

    const alreadyPending = (pending || []).some((u) => onlyDigits(u.phone) === phone && u.status === STATUS.PENDING);
    if (alreadyPending) {
      setMessage(els.signupMsg, "ثبت‌نام شما قبلاً انجام شده است — منتظر تأیید مدیریت.", "ok");
      return;
    }

    const officeId = String(localStorage.getItem(LS.currentOfficeId) || "office-teh");
    const rec = { id: genId("pu"), name, phone, note, status: STATUS.PENDING, createdAt: nowIso(), officeId };
    writeJson(LS.pendingUsers, Array.isArray(pending) ? [...pending, rec] : [rec]);
    setMessage(els.signupMsg, "ثبت‌نام انجام شد — منتظر تأیید مدیریت", "ok");
  });

  els.loginSubmit.addEventListener("click", () => {
    const phone = onlyDigits(els.loginPhone?.value || "");
    if (!phone) {
      setMessage(els.loginMsg, "شماره موبایل را وارد کنید.", "bad");
      return;
    }

    const users = readJson(LS.users, []);
    const user = (users || []).find((u) => onlyDigits(u.phone) === phone) || null;
    if (!user) {
      const pending = readJson(LS.pendingUsers, []);
      const p = (pending || []).find((u) => onlyDigits(u.phone) === phone) || null;
      if (p && p.status === STATUS.PENDING) {
        setMessage(els.loginMsg, "ثبت‌نام انجام شده است — هنوز تأیید نشده.", "bad");
        return;
      }
      setMessage(els.loginMsg, "کاربری با این شماره پیدا نشد.", "bad");
      return;
    }

    if (user.status !== STATUS.APPROVED) {
      setMessage(els.loginMsg, "حساب شما تأیید نشده است.", "bad");
      return;
    }

    writeJson(LS.currentUser, user);
    if (user.officeId) localStorage.setItem(LS.currentOfficeId, String(user.officeId));
    window.location.href = "./app.html";
  });
})();
