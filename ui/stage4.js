/* ASIAGOLD UI v0.4.9 | STAGE 4: Controlled Implementation (UI-only) */
(() => {
  "use strict";

  const LS = Object.freeze({
    currentOfficeId: "asiagold.currentOfficeId",
    currentRole: "asiagold.currentRole",
    offices: "asiagold.offices",
    orders: "asiagold.orders",
    inventory: "asiagold.inventory",
    chats: "asiagold.chats",
    contacts: "asiagold.contacts",
    seeded: "asiagold.seeded_v1",
  });

  const ROLES = Object.freeze({
    customer: "customer",
    sales_manager: "sales_manager",
    office_order_manager: "office_order_manager",
    system_admin: "system_admin",
  });

  const ORDER_STATUS = Object.freeze({
    IN_PROGRESS: "IN_PROGRESS",
    SENT_TO_FACTORY: "SENT_TO_FACTORY",
    CANCELLED: "CANCELLED",
    REJECTED: "REJECTED",
    DELIVERED: "DELIVERED",
    COMPLETED: "COMPLETED",
  });

  const ACTIVE_STATUSES = new Set([ORDER_STATUS.IN_PROGRESS, ORDER_STATUS.SENT_TO_FACTORY]);
  const ARCHIVE_STATUSES = new Set([
    ORDER_STATUS.CANCELLED,
    ORDER_STATUS.REJECTED,
    ORDER_STATUS.DELIVERED,
    ORDER_STATUS.COMPLETED,
  ]);

  function nowIso() {
    return new Date().toISOString();
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

  function genId(prefix) {
    return `${prefix}-${Math.random().toString(16).slice(2)}-${Date.now().toString(16)}`;
  }

  function seedOnce() {
    if (localStorage.getItem(LS.seeded) === "1") return;

    const office1 = {
      id: "office-teh",
      name: "دفتر تهران",
      customers: [
        { id: "cust-001", name: "مشتری نمونه", phone: "09120000000", creditLimitWeight: 250 },
        { id: "cust-002", name: "فروشگاه نمونه", phone: "09350000000", creditLimitWeight: 120 },
      ],
      suppliers: [{ id: "sup-001", name: "کارخانه نمونه" }],
      _session: { customerId: "cust-001", userNameByRole: {} },
    };

    const office2 = {
      id: "office-msh",
      name: "دفتر مشهد",
      customers: [{ id: "cust-101", name: "مشتری مشهد", phone: "09151111111", creditLimitWeight: 180 }],
      suppliers: [{ id: "sup-101", name: "کارخانه خراسان" }],
      _session: { customerId: "cust-101", userNameByRole: {} },
    };

    const orders = [
      {
        id: "ord-0001",
        code: "AG-2025-0001",
        createdAt: nowIso(),
        officeId: office1.id,
        customerId: "cust-001",
        status: ORDER_STATUS.IN_PROGRESS,
        items: [
          { name: "النگو", weight: 18.4, count: 1 },
          { name: "زنجیر", weight: 12.1, count: 1 },
        ],
        notes: "سفارش نمونه (امانی)",
        returns: [],
        blocked: false,
        updatedAt: nowIso(),
      },
      {
        id: "ord-0002",
        code: "AG-2025-0002",
        createdAt: nowIso(),
        officeId: office1.id,
        customerId: "cust-002",
        status: ORDER_STATUS.SENT_TO_FACTORY,
        items: [{ name: "دستبند", weight: 9.65, count: 1 }],
        notes: "",
        returns: [],
        blocked: false,
        updatedAt: nowIso(),
      },
      {
        id: "ord-0101",
        code: "AG-2025-0101",
        createdAt: nowIso(),
        officeId: office2.id,
        customerId: "cust-101",
        status: ORDER_STATUS.DELIVERED,
        items: [{ name: "گوشواره", weight: 6.2, count: 1 }],
        notes: "",
        returns: [{ id: "ret-1", at: nowIso(), weight: 1.1, note: "مرجوعی جزئی" }],
        blocked: false,
        updatedAt: nowIso(),
      },
    ];

    const inventory = [
      { id: "inv-001", officeId: office1.id, name: "النگو", weight: 120.0, count: 8, updatedAt: nowIso() },
      { id: "inv-002", officeId: office1.id, name: "زنجیر", weight: 75.5, count: 12, updatedAt: nowIso() },
      { id: "inv-003", officeId: office1.id, name: "دستبند", weight: 54.2, count: 9, updatedAt: nowIso() },
      { id: "inv-101", officeId: office2.id, name: "گوشواره", weight: 44.4, count: 15, updatedAt: nowIso() },
    ];

    const chats = [
      {
        id: "chat-0002",
        officeId: office1.id,
        orderId: "ord-0002",
        createdAt: nowIso(),
        messages: [
          {
            id: "m-1",
            at: nowIso(),
            role: ROLES.office_order_manager,
            name: "مدیر سفارش",
            text: "سفارش به کارخانه ارسال شد. در صورت نیاز پیام بگذارید.",
          },
        ],
      },
    ];

    const contacts = [
      {
        officeId: office1.id,
        phone: "02100000000",
        telegram: "https://t.me/asiagold",
        email: "support@asiagold.example",
        directChat: { messages: [] },
      },
      {
        officeId: office2.id,
        phone: "05100000000",
        telegram: "https://t.me/asiagold_msh",
        email: "mashhad@asiagold.example",
        directChat: { messages: [] },
      },
    ];

    writeJson(LS.offices, [office1, office2]);
    writeJson(LS.orders, orders);
    writeJson(LS.inventory, inventory);
    writeJson(LS.chats, chats);
    writeJson(LS.contacts, contacts);
    localStorage.setItem(LS.currentOfficeId, office1.id);
    localStorage.setItem(LS.currentRole, "");
    localStorage.setItem(LS.seeded, "1");
  }

  function getOffices() {
    return readJson(LS.offices, []);
  }

  function setOffices(offices) {
    writeJson(LS.offices, offices);
  }

  function getOrders() {
    return readJson(LS.orders, []);
  }

  function setOrders(orders) {
    writeJson(LS.orders, orders);
  }

  function getInventory() {
    return readJson(LS.inventory, []);
  }

  function setInventory(items) {
    writeJson(LS.inventory, items);
  }

  function getChats() {
    return readJson(LS.chats, []);
  }

  function setChats(chats) {
    writeJson(LS.chats, chats);
  }

  function getContacts() {
    return readJson(LS.contacts, []);
  }

  function setContacts(contacts) {
    writeJson(LS.contacts, contacts);
  }

  function getCurrentRole() {
    const raw = (localStorage.getItem(LS.currentRole) || "").trim();
    return Object.values(ROLES).includes(raw) ? raw : "";
  }

  function setCurrentRole(role) {
    localStorage.setItem(LS.currentRole, role);
  }

  function getCurrentOfficeId() {
    return (localStorage.getItem(LS.currentOfficeId) || "").trim();
  }

  function setCurrentOfficeId(officeId) {
    localStorage.setItem(LS.currentOfficeId, officeId);
  }

  function ensureOfficeId() {
    const offices = getOffices();
    const current = getCurrentOfficeId();
    if (current && offices.some((o) => o.id === current)) return;
    if (offices[0]?.id) setCurrentOfficeId(offices[0].id);
  }

  function findOffice(officeId) {
    return getOffices().find((o) => o.id === officeId) || null;
  }

  function roleLabel(role) {
    if (role === ROLES.customer) return "مشتری";
    if (role === ROLES.sales_manager) return "مدیر فروش (مشاهده)";
    if (role === ROLES.office_order_manager) return "مدیر سفارش دفتر";
    if (role === ROLES.system_admin) return "ادمین سیستم";
    return "";
  }

  function statusLabel(st) {
    if (st === ORDER_STATUS.IN_PROGRESS) return "در جریان";
    if (st === ORDER_STATUS.SENT_TO_FACTORY) return "ارسال به کارخانه";
    if (st === ORDER_STATUS.CANCELLED) return "لغو شده";
    if (st === ORDER_STATUS.REJECTED) return "رد شده";
    if (st === ORDER_STATUS.DELIVERED) return "تحویل شده";
    if (st === ORDER_STATUS.COMPLETED) return "تکمیل شده";
    return st || "";
  }

  function canDeleteChat(role) {
    return role === ROLES.system_admin;
  }

  function canSeeInventory(role) {
    return role !== ROLES.customer;
  }

  function isReadOnly(role) {
    return role === ROLES.sales_manager;
  }

  function canSendToFactory(role) {
    return role === ROLES.office_order_manager;
  }

  function canEditCredit(role) {
    return role === ROLES.office_order_manager || role === ROLES.system_admin;
  }

  function isCustomer(role) {
    return role === ROLES.customer;
  }

  seedOnce();
  ensureOfficeId();

  const els = {
    body: document.body,
    appbar: document.getElementById("ag-appbar"),
    back: document.getElementById("ag-back"),
    title: document.getElementById("ag-title"),
    login: document.getElementById("ag-login"),
    app: document.getElementById("ag-app"),
    view: document.getElementById("ag-view"),
    role: document.getElementById("ag-role"),
    phone: document.getElementById("ag-phone"),
    name: document.getElementById("ag-name"),
    enter: document.getElementById("ag-enter"),
  };

  if (!els.view || !els.enter || !els.role) return;

  let adminOfficeFilterId = "ALL";

  function setTitle(text) {
    if (els.title) els.title.textContent = text || "";
  }

  function setMode(mode) {
    const isLogin = mode === "login";
    const entering = !isLogin && els.body.classList.contains("ag-mode-entering");
    els.body.classList.toggle("ag-mode-login", isLogin);
    els.body.classList.toggle("ag-mode-app", !isLogin);
    if (els.login) els.login.hidden = entering ? false : !isLogin;
    if (els.app) els.app.hidden = isLogin;
  }

  function beginEnterAppTransition() {
    if (els.app) els.app.hidden = false;
    els.body.classList.add("ag-mode-entering");
    els.body.classList.remove("ag-mode-login");
    els.body.classList.add("ag-mode-app");
    window.setTimeout(() => {
      if (els.login) els.login.hidden = true;
      els.body.classList.remove("ag-mode-entering");
    }, 560);
  }

  function logoutToLogin() {
    setCurrentRole("");
    setMode("login");
    setTitle("");
    try {
      history.replaceState(null, "", "#/");
    } catch {}
  }

  function parseRoute() {
    const raw = (location.hash || "").replace(/^#/, "");
    const parts = raw.split("/").filter(Boolean);
    if (parts.length === 0) return { name: "dashboard" };
    if (parts[0] === "dashboard") return { name: "dashboard" };
    if (parts[0] === "orders" && (parts[1] === "active" || parts[1] === "archive")) return { name: "orders", kind: parts[1] };
    if (parts[0] === "order" && parts[1]) return { name: "order", id: parts[1] };
    if (parts[0] === "order-new") return { name: "order-new" };
    if (parts[0] === "inventory") return { name: "inventory", id: parts[1] || "" };
    if (parts[0] === "inventory-import") return { name: "inventory-import" };
    if (parts[0] === "contact-chat") return { name: "contact-chat" };
    return { name: "dashboard" };
  }

  function nav(to, replace = false) {
    const hash = to.startsWith("#") ? to : `#${to}`;
    try {
      if (replace) history.replaceState(null, "", hash);
      else location.hash = hash;
    } catch {
      location.hash = hash;
    }
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatDateFa(iso) {
    const d = iso ? new Date(iso) : new Date();
    try {
      return new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium" }).format(d);
    } catch {
      return d.toLocaleDateString();
    }
  }

  function toFixedWeight(weight) {
    const n = Number(weight);
    if (!Number.isFinite(n)) return "0";
    const fixed = Math.round(n * 1000) / 1000;
    return String(fixed).replace(/\.0+$/, "").replace(/(\.\d*[1-9])0+$/, "$1");
  }

  function sumOrderWeight(items) {
    return (items || []).reduce((acc, it) => acc + (Number(it?.weight) || 0), 0);
  }

  function genOrderCode(seq) {
    const y = new Date().getFullYear();
    const n = String(seq).padStart(4, "0");
    return `AG-${y}-${n}`;
  }

  function findCustomer(office, customerId) {
    return (office?.customers || []).find((c) => c.id === customerId) || null;
  }

  function getActiveCustomerId(office) {
    return office?._session?.customerId || office?.customers?.[0]?.id || "";
  }

  function getSessionNameForRole(office, role) {
    const name = office?._session?.userNameByRole?.[role];
    return (name || "").trim() || roleLabel(role);
  }

  function scopedOrders(role, officeId) {
    const orders = getOrders();
    if (role === ROLES.system_admin) return orders;
    if (!officeId) return [];
    const office = findOffice(officeId);
    if (role === ROLES.customer) {
      const cid = getActiveCustomerId(office);
      return orders.filter((o) => o.officeId === officeId && o.customerId === cid);
    }
    return orders.filter((o) => o.officeId === officeId);
  }

  function updateOrder(orderId, updater) {
    const orders = getOrders();
    const idx = orders.findIndex((o) => o.id === orderId);
    if (idx < 0) return null;
    const next = { ...orders[idx] };
    updater(next);
    next.updatedAt = nowIso();
    orders[idx] = next;
    setOrders(orders);
    return next;
  }

  function ensureChatForOrder(order, role) {
    if (!order) return;
    const st = order.status;
    const eligible = st === ORDER_STATUS.SENT_TO_FACTORY || st === ORDER_STATUS.DELIVERED || st === ORDER_STATUS.COMPLETED;
    if (!eligible) return;
    const chats = getChats();
    if (chats.some((c) => c.orderId === order.id)) return;
    const office = findOffice(order.officeId);
    chats.push({
      id: genId("chat"),
      officeId: order.officeId,
      orderId: order.id,
      createdAt: nowIso(),
      messages: [
        {
          id: genId("m"),
          at: nowIso(),
          role,
          name: getSessionNameForRole(office, role),
          text: "چت سفارش فعال شد.",
        },
      ],
    });
    setChats(chats);
  }

  function computeInProgressCount(orders) {
    return orders.filter((o) => o.status === ORDER_STATUS.IN_PROGRESS).length;
  }

  function computeInProgressWeight(orders) {
    return orders
      .filter((o) => o.status === ORDER_STATUS.IN_PROGRESS)
      .reduce((acc, o) => acc + sumOrderWeight(o.items), 0);
  }

  function renderBadge(text, variant) {
    const cls = variant ? ` ag-badge-${variant}` : "";
    return `<span class="ag-badge${cls}">${escapeHtml(text)}</span>`;
  }

  function renderContactManagerSection(officeId) {
    const contact = getContacts().find((c) => c.officeId === officeId) || null;
    const phone = contact?.phone || "";
    const telegram = contact?.telegram || "";
    const email = contact?.email || "";
    return `
      <section class="ag-s4-section" aria-label="مدیریت ارتباطات">
        <div class="ag-s4-section-title">مدیریت ارتباطات</div>
        <div class="ag-list">
          <button class="ag-list-item" type="button" data-nav="#/contact-chat">
            <div class="ag-li-main">
              <div class="ag-li-title">چت مستقیم</div>
              <div class="ag-li-sub">پشتیبانی دفتر (لوکال)</div>
            </div>
            <div class="ag-li-meta">ورود</div>
          </button>
          <a class="ag-list-item" href="${escapeHtml(phone ? `tel:${phone}` : "#")}" ${phone ? "" : 'aria-disabled="true"'}>
            <div class="ag-li-main">
              <div class="ag-li-title">تلفن</div>
              <div class="ag-li-sub">${escapeHtml(phone || "—")}</div>
            </div>
            <div class="ag-li-meta">تماس</div>
          </a>
          <a class="ag-list-item" href="${escapeHtml(telegram || "#")}" target="_blank" rel="noreferrer" ${telegram ? "" : 'aria-disabled="true"'}>
            <div class="ag-li-main">
              <div class="ag-li-title">تلگرام</div>
              <div class="ag-li-sub">${escapeHtml(telegram || "—")}</div>
            </div>
            <div class="ag-li-meta">باز کردن</div>
          </a>
          <a class="ag-list-item" href="${escapeHtml(email ? `mailto:${email}` : "#")}" ${email ? "" : 'aria-disabled="true"'}>
            <div class="ag-li-main">
              <div class="ag-li-title">ایمیل</div>
              <div class="ag-li-sub">${escapeHtml(email || "—")}</div>
            </div>
            <div class="ag-li-meta">ارسال</div>
          </a>
        </div>
      </section>
    `;
  }

  function renderBasketSummarySection(orders) {
    const count = computeInProgressCount(orders);
    const weight = computeInProgressWeight(orders);
    const sentCount = orders.filter((o) => o.status === ORDER_STATUS.SENT_TO_FACTORY).length;
    const sentWeight = orders
      .filter((o) => o.status === ORDER_STATUS.SENT_TO_FACTORY)
      .reduce((acc, o) => acc + sumOrderWeight(o.items), 0);

    const bar = (a, b) => {
      const x = Math.max(0, Number(a) || 0);
      const y = Math.max(0, Number(b) || 0);
      const t = x + y;
      const px = t ? Math.round((x / t) * 100) : 0;
      const py = Math.max(0, 100 - px);
      return `
        <div class="ag-stackbar" aria-hidden="true">
          <span class="a" style="width:${px}%"></span>
          <span class="b" style="width:${py}%"></span>
        </div>
      `;
    };

    return `
      <section class="ag-s4-section" aria-label="سبد">
        <div class="ag-s4-section-title">سبد (در جریان)</div>
        <div class="ag-kpi">
          <div class="ag-kpi-row"><span>تعداد</span><strong>${escapeHtml(count)}</strong></div>
          ${bar(count, sentCount)}
          <div class="ag-kpi-row"><span>وزن</span><strong>${escapeHtml(toFixedWeight(weight))} گرم</strong></div>
          ${bar(weight, sentWeight)}
        </div>
      </section>
    `;
  }

  function upsertSessionUserName(officeId, role, name) {
    const offices = getOffices();
    const idx = offices.findIndex((o) => o.id === officeId);
    if (idx < 0) return;
    const office = { ...offices[idx] };
    const session = { ...(office._session || {}) };
    const byRole = { ...(session.userNameByRole || {}) };
    byRole[role] = (name || "").trim();
    session.userNameByRole = byRole;
    office._session = session;
    offices[idx] = office;
    setOffices(offices);
  }

  function upsertCustomerSession(officeId, phone, name) {
    const offices = getOffices();
    const idx = offices.findIndex((o) => o.id === officeId);
    if (idx < 0) return;
    const office = { ...offices[idx] };
    const customers = Array.isArray(office.customers) ? office.customers.slice() : [];
    const normalizedPhone = String(phone || "").trim();
    const normalizedName = String(name || "").trim();
    let customer = customers.find((c) => String(c.phone || "").trim() === normalizedPhone) || null;
    if (!customer && normalizedPhone) {
      customer = { id: genId("cust"), name: normalizedName || "مشتری", phone: normalizedPhone, creditLimitWeight: 0 };
      customers.push(customer);
    }
    if (customer && normalizedName && customer.name !== normalizedName) customer = { ...customer, name: normalizedName };
    if (!customer) return;
    const cIdx = customers.findIndex((c) => c.id === customer.id);
    if (cIdx >= 0) customers[cIdx] = customer;
    office.customers = customers;
    office._session = { ...(office._session || {}), customerId: customer.id, userNameByRole: { ...(office._session?.userNameByRole || {}) } };
    offices[idx] = office;
    setOffices(offices);
  }

  function renderDashboard() {
    const role = getCurrentRole();
    const officeId = getCurrentOfficeId();
    const office = officeId ? findOffice(officeId) : null;
    if (!role) {
      setMode("login");
      return;
    }
    setTitle("داشبورد");

    const orders = scopedOrders(role, officeId);
    const count = computeInProgressCount(orders);
    const weight = computeInProgressWeight(orders);

    const headerOffice = role === ROLES.system_admin ? "نمای کلی سیستم" : office?.name || "";

    const debtBlock = (() => {
      if (role !== ROLES.customer || !office) return "";
      const cid = getActiveCustomerId(office);
      const myOrders = getOrders().filter((o) => o.officeId === office.id && o.customerId === cid);
      const debtOrders = myOrders.filter((o) => o.status === ORDER_STATUS.SENT_TO_FACTORY || o.status === ORDER_STATUS.DELIVERED);
      const debtWeight = debtOrders.reduce((acc, o) => acc + sumOrderWeight(o.items), 0);
      return `
        <section class="ag-s4-section" aria-label="بدهی">
          <div class="ag-s4-section-title">بدهی وزنی</div>
          <div class="ag-kpi">
            <div class="ag-kpi-row"><span>وزن بدهی (ارسال/تحویل)</span><strong>${escapeHtml(toFixedWeight(debtWeight))} گرم</strong></div>
          </div>
        </section>
      `;
    })();

    const officesBlock = (() => {
      if (role !== ROLES.system_admin) return "";
      const offices = getOffices();
      return `
        <section class="ag-s4-section" aria-label="دفاتر">
          <div class="ag-s4-section-title">دفاتر</div>
          <div class="ag-list">
            ${offices
              .map((o) => {
                return `
                  <button class="ag-list-item" type="button" data-action="admin-set-office" data-office-id="${escapeHtml(o.id)}">
                    <div class="ag-li-main">
                      <div class="ag-li-title">${escapeHtml(o.name)}</div>
                      <div class="ag-li-sub">ورود به سطح دفتر</div>
                    </div>
                    <div class="ag-li-meta">ورود</div>
                  </button>
                `;
              })
              .join("")}
          </div>
        </section>
      `;
    })();

    const quickNav = `
      <section class="ag-s4-section" aria-label="منو">
        <div class="ag-s4-section-title">دسترسی سریع</div>
        <div class="ag-list">
          ${
            isCustomer(role)
              ? `
                <button class="ag-list-item" type="button" data-nav="#/order-new">
                  <div class="ag-li-main">
                    <div class="ag-li-title">سفارش جدید</div>
                    <div class="ag-li-sub">ثبت سفارش (امانی / وزن‌محور)</div>
                  </div>
                  <div class="ag-li-meta">ایجاد</div>
                </button>
              `
              : ""
          }
          <button class="ag-list-item" type="button" data-nav="#/orders/active">
            <div class="ag-li-main">
              <div class="ag-li-title">سفارش‌ها (فعال)</div>
              <div class="ag-li-sub">در جریان / ارسال به کارخانه</div>
            </div>
            <div class="ag-li-meta">ورود</div>
          </button>
          <button class="ag-list-item" type="button" data-nav="#/orders/archive">
            <div class="ag-li-main">
              <div class="ag-li-title">سفارش‌ها (آرشیو)</div>
              <div class="ag-li-sub">لغو / رد / تحویل / تکمیل</div>
            </div>
            <div class="ag-li-meta">ورود</div>
          </button>
          ${
            canSeeInventory(role)
              ? `
                <button class="ag-list-item" type="button" data-nav="#/inventory">
                  <div class="ag-li-main">
                    <div class="ag-li-title">موجودی</div>
                    <div class="ag-li-sub">${escapeHtml(isReadOnly(role) ? "مشاهده" : "عملیاتی")}</div>
                  </div>
                  <div class="ag-li-meta">ورود</div>
                </button>
              `
              : ""
          }
          <button class="ag-list-item" type="button" data-action="logout">
            <div class="ag-li-main">
              <div class="ag-li-title">خروج</div>
              <div class="ag-li-sub">بازگشت به صفحه ورود</div>
            </div>
            <div class="ag-li-meta">خروج</div>
          </button>
        </div>
      </section>
    `;

    els.view.innerHTML = `
      <section class="ag-s4-section" aria-label="داشبورد">
        <div class="ag-s4-head">
          <div>
            <div class="ag-s4-role">${escapeHtml(roleLabel(role))}</div>
            <div class="ag-s4-office">${escapeHtml(headerOffice)}</div>
          </div>
        </div>
        <div class="ag-kpi">
          <div class="ag-kpi-row"><span>سفارش‌های در جریان</span><strong>${escapeHtml(count)}</strong></div>
          <div class="ag-kpi-row"><span>وزن در جریان</span><strong>${escapeHtml(toFixedWeight(weight))} گرم</strong></div>
        </div>
      </section>
      ${renderBasketSummarySection(orders)}
      ${officesBlock}
      ${debtBlock}
      ${quickNav}
      ${renderContactManagerSection(officeId)}
    `;
  }

  function renderOrdersList(kind) {
    const role = getCurrentRole();
    if (!role) return renderDashboard();
    const officeId = getCurrentOfficeId();
    const ordersAll = scopedOrders(role, officeId);
    const offices = getOffices();
    const orders =
      role === ROLES.system_admin && adminOfficeFilterId !== "ALL"
        ? ordersAll.filter((o) => o.officeId === adminOfficeFilterId)
        : ordersAll;
    const filterSet = kind === "archive" ? ARCHIVE_STATUSES : ACTIVE_STATUSES;
    const list = orders.filter((o) => filterSet.has(o.status)).filter((o) => !(kind === "active" && (o.status === ORDER_STATUS.DELIVERED || o.status === ORDER_STATUS.COMPLETED)));
    const title = kind === "archive" ? "سفارش‌ها (آرشیو)" : "سفارش‌ها (فعال)";
    setTitle(title);

    const adminFilterUi =
      role !== ROLES.system_admin
        ? ""
        : `
          <section class="ag-s4-section" aria-label="فیلتر دفتر">
            <div class="ag-s4-section-title">فیلتر دفتر</div>
            <select class="ag-select" data-action="admin-office-filter" aria-label="انتخاب دفتر">
              <option value="ALL" ${adminOfficeFilterId === "ALL" ? "selected" : ""}>همه دفاتر</option>
              ${offices
                .map((o) => `<option value="${escapeHtml(o.id)}" ${adminOfficeFilterId === o.id ? "selected" : ""}>${escapeHtml(o.name)}</option>`)
                .join("")}
            </select>
          </section>
        `;

    const htmlRows =
      list.length === 0
        ? `<div class="ag-empty">موردی برای نمایش وجود ندارد.</div>`
        : `<div class="ag-list">
          ${list
            .slice()
            .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
            .map((o) => {
              const oOffice = findOffice(o.officeId);
              const cust = oOffice ? findCustomer(oOffice, o.customerId) : null;
              const weight = sumOrderWeight(o.items);
              const blocked = o.blocked ? `<span class="ag-badge ag-badge-danger">مسدود</span>` : "";
              const officePart = role === ROLES.system_admin ? ` • ${escapeHtml(oOffice?.name || "")}` : "";
              return `
                <button class="ag-list-item" type="button" data-nav="#/order/${escapeHtml(o.id)}">
                  <div class="ag-li-main">
                    <div class="ag-li-title">${escapeHtml(o.code)} ${blocked}</div>
                    <div class="ag-li-sub">${escapeHtml(cust?.name || "—")} • ${escapeHtml(formatDateFa(o.createdAt))}${officePart}</div>
                  </div>
                  <div class="ag-li-meta">
                    <span class="ag-badge">${escapeHtml(statusLabel(o.status))}</span>
                    <div class="ag-li-weight">${escapeHtml(toFixedWeight(weight))}g</div>
                  </div>
                </button>
              `;
            })
            .join("")}
        </div>`;

    els.view.innerHTML = `
      ${renderBasketSummarySection(ordersAll)}
      ${adminFilterUi}
      <section class="ag-s4-section" aria-label="${escapeHtml(title)}">
        <div class="ag-s4-section-title">${escapeHtml(title)}</div>
        ${htmlRows}
      </section>
    `;
  }

  function renderOrderDetail(orderId) {
    const role = getCurrentRole();
    if (!role) return renderDashboard();
    const order = getOrders().find((o) => o.id === orderId) || null;
    if (!order) {
      els.view.innerHTML = `<div class="ag-empty">سفارش پیدا نشد.</div>`;
      setTitle("جزئیات سفارش");
      return;
    }

    const office = findOffice(order.officeId);
    const customer = office ? findCustomer(office, order.customerId) : null;
    const weight = sumOrderWeight(order.items);

    ensureChatForOrder(order, ROLES.office_order_manager);
    const chat = getChats().find((c) => c.orderId === order.id) || null;

    const blocked = order.blocked ? renderBadge("مسدود", "danger") : "";
    const status = renderBadge(statusLabel(order.status), order.status === ORDER_STATUS.IN_PROGRESS ? "gold" : "muted");

    const itemsHtml =
      (order.items || []).length === 0
        ? `<div class="ag-empty">قلمی ثبت نشده است.</div>`
        : `
          <div class="ag-table" role="table" aria-label="اقلام سفارش">
            ${(order.items || [])
              .map((it, i) => {
                const name = it?.name || `قلم ${i + 1}`;
                const w = toFixedWeight(it?.weight || 0);
                const c = it?.count ?? "—";
                return `
                  <div class="ag-tr" role="row">
                    <div class="ag-td" role="cell"><strong>${escapeHtml(name)}</strong></div>
                    <div class="ag-td" role="cell">${escapeHtml(w)} گرم</div>
                    <div class="ag-td" role="cell">${escapeHtml(c)} عدد</div>
                  </div>
                `;
              })
              .join("")}
          </div>
        `;

    const creditBlock = (() => {
      if (!office || !customer) return "";
      if (role === ROLES.customer) return "";
      const canEdit = canEditCredit(role);
      return `
        <section class="ag-s4-section" aria-label="اعتبار مشتری">
          <div class="ag-s4-section-title">اعتبار مشتری (وزنی)</div>
          <div class="ag-kpi">
            <div class="ag-kpi-row"><span>حد اعتبار</span><strong>${escapeHtml(toFixedWeight(customer.creditLimitWeight || 0))} گرم</strong></div>
          </div>
          ${
            canEdit
              ? `
                <div class="ag-formline" style="margin-top:10px;">
                  <label class="ag-label" for="ag-credit">تنظیم حد اعتبار (گرم)</label>
                  <input class="ag-input" id="ag-credit" inputmode="decimal" value="${escapeHtml(customer.creditLimitWeight ?? 0)}" />
                  <button class="ag-primary" type="button" data-action="save-credit" data-customer-id="${escapeHtml(customer.id)}">ذخیره اعتبار</button>
                </div>
              `
              : `<div class="ag-hint">فقط مشاهده</div>`
          }
        </section>
      `;
    })();

    const editItemsBlock = (() => {
      const allowed = (role === ROLES.customer && order.status === ORDER_STATUS.IN_PROGRESS) || role === ROLES.office_order_manager;
      if (!allowed) return "";
      if (role === ROLES.sales_manager) return "";
      if (order.blocked) return "";
      return `
        <section class="ag-s4-section" aria-label="ویرایش اقلام">
          <div class="ag-s4-section-title">ویرایش اقلام</div>
          <div class="ag-formgrid">
            ${(order.items || [])
              .map((it, i) => {
                return `
                  <div class="ag-formline">
                    <label class="ag-label">نام</label>
                    <input class="ag-input" value="${escapeHtml(it?.name || "")}" data-field="item-name" data-index="${i}" />
                  </div>
                  <div class="ag-formline">
                    <label class="ag-label">وزن (گرم)</label>
                    <input class="ag-input" inputmode="decimal" value="${escapeHtml(it?.weight ?? 0)}" data-field="item-weight" data-index="${i}" />
                  </div>
                  <div class="ag-formline">
                    <label class="ag-label">تعداد</label>
                    <input class="ag-input" inputmode="numeric" value="${escapeHtml(it?.count ?? 0)}" data-field="item-count" data-index="${i}" />
                  </div>
                `;
              })
              .join("")}
          </div>
          <button class="ag-primary" type="button" data-action="save-items" data-order-id="${escapeHtml(order.id)}">ذخیره اقلام</button>
        </section>
      `;
    })();

    const actions = (() => {
      const btns = [];
      if (role === ROLES.system_admin) {
        btns.push(
          order.blocked
            ? `<button class="ag-danger" type="button" data-action="unblock-order" data-order-id="${escapeHtml(order.id)}">رفع مسدودی سفارش</button>`
            : `<button class="ag-danger" type="button" data-action="block-order" data-order-id="${escapeHtml(order.id)}">مسدود کردن سفارش</button>`
        );
      }

      if (!order.blocked) {
        if (role === ROLES.customer && order.status === ORDER_STATUS.IN_PROGRESS) {
          btns.push(`<button class="ag-danger" type="button" data-action="cancel-order" data-order-id="${escapeHtml(order.id)}">لغو سفارش</button>`);
        }

        if (canSendToFactory(role) && order.status === ORDER_STATUS.IN_PROGRESS) {
          btns.push(`<button class="ag-primary" type="button" data-action="send-to-factory" data-order-id="${escapeHtml(order.id)}">ارسال به کارخانه</button>`);
          btns.push(`<button class="ag-danger" type="button" data-action="reject-order" data-order-id="${escapeHtml(order.id)}">رد سفارش</button>`);
        }

        if (canSendToFactory(role) && order.status === ORDER_STATUS.SENT_TO_FACTORY) {
          btns.push(`<button class="ag-primary" type="button" data-action="mark-delivered" data-order-id="${escapeHtml(order.id)}">علامت‌گذاری تحویل</button>`);
        }

        if (canSendToFactory(role) && order.status === ORDER_STATUS.DELIVERED) {
          btns.push(`<button class="ag-primary" type="button" data-action="mark-completed" data-order-id="${escapeHtml(order.id)}">تکمیل سفارش</button>`);
        }
      }

      if (btns.length === 0) return "";
      return `
        <section class="ag-s4-section" aria-label="اقدامات">
          <div class="ag-s4-section-title">اقدامات</div>
          <div class="ag-actions">${btns.join("")}</div>
        </section>
      `;
    })();

    const returnBlock = (() => {
      const list = (order.returns || []).length
        ? `
            <div class="ag-list">
              ${(order.returns || [])
                .map((r) => {
                  return `
                    <div class="ag-note">
                      <div class="ag-note-title">${escapeHtml(toFixedWeight(r.weight))} گرم</div>
                      <div class="ag-note-sub">${escapeHtml(formatDateFa(r.at))}${r.note ? ` • ${escapeHtml(r.note)}` : ""}</div>
                    </div>
                  `;
                })
                .join("")}
            </div>
          `
        : `<div class="ag-empty">مرجوعی ثبت نشده است.</div>`;

      const canReturn =
        role === ROLES.customer && !order.blocked && (order.status === ORDER_STATUS.DELIVERED || order.status === ORDER_STATUS.COMPLETED);

      return `
        <section class="ag-s4-section" aria-label="مرجوعی">
          <div class="ag-s4-section-title">مرجوعی</div>
          ${list}
          ${
            canReturn
              ? `
                <div class="ag-formline" style="margin-top:10px;">
                  <label class="ag-label" for="ag-return-weight">وزن مرجوعی (گرم)</label>
                  <input class="ag-input" id="ag-return-weight" inputmode="decimal" placeholder="مثال: 1.25" />
                  <label class="ag-label" for="ag-return-note">توضیح</label>
                  <input class="ag-input" id="ag-return-note" placeholder="اختیاری" />
                  <button class="ag-primary" type="button" data-action="add-return" data-order-id="${escapeHtml(order.id)}">ثبت مرجوعی</button>
                </div>
              `
              : `<div class="ag-hint">ثبت مرجوعی فقط پس از تحویل فعال است.</div>`
          }
        </section>
      `;
    })();

    const chatBlock = (() => {
      if (!chat) {
        return `
          <section class="ag-s4-section" aria-label="چت سفارش">
            <div class="ag-s4-section-title">چت سفارش</div>
            <div class="ag-empty">چت پس از ارسال به کارخانه فعال می‌شود.</div>
          </section>
        `;
      }

      const messages = (chat.messages || [])
        .map((m) => {
          const mine = m.role === role;
          const name = m.name || roleLabel(m.role);
          return `
            <div class="ag-chat-msg ${mine ? "mine" : ""}">
              <div class="ag-chat-meta">${escapeHtml(name)} • ${escapeHtml(formatDateFa(m.at))}</div>
              <div class="ag-chat-bubble">${escapeHtml(m.text || "")}</div>
            </div>
          `;
        })
        .join("");

      return `
        <section class="ag-s4-section" aria-label="چت سفارش">
          <div class="ag-s4-section-title">چت سفارش</div>
          <div class="ag-chat">
            <div class="ag-chat-list" aria-label="پیام‌ها">${messages || `<div class="ag-empty">پیامی ثبت نشده است.</div>`}</div>
            <div class="ag-chat-compose">
              <input class="ag-input" id="ag-chat-text" placeholder="پیام..." />
              <button class="ag-primary" type="button" data-action="send-chat" data-order-id="${escapeHtml(order.id)}">ارسال</button>
            </div>
            ${canDeleteChat(role) ? `<button class="ag-danger" type="button" data-action="delete-chat" data-order-id="${escapeHtml(order.id)}">حذف چت (فقط ادمین)</button>` : ""}
          </div>
        </section>
      `;
    })();

    setTitle("جزئیات سفارش");
    els.view.innerHTML = `
      <section class="ag-s4-section" aria-label="اطلاعات سفارش">
        <div class="ag-s4-section-title">اطلاعات سفارش</div>
        <div class="ag-kpi">
          <div class="ag-kpi-row"><span>کد</span><strong>${escapeHtml(order.code)} ${blocked}</strong></div>
          <div class="ag-kpi-row"><span>تاریخ</span><strong>${escapeHtml(formatDateFa(order.createdAt))}</strong></div>
          <div class="ag-kpi-row"><span>دفتر</span><strong>${escapeHtml(office?.name || "—")}</strong></div>
          <div class="ag-kpi-row"><span>وضعیت</span><strong>${status}</strong></div>
          <div class="ag-kpi-row"><span>مشتری</span><strong>${escapeHtml(customer?.name || "—")}</strong></div>
          <div class="ag-kpi-row"><span>وزن کل</span><strong>${escapeHtml(toFixedWeight(weight))} گرم</strong></div>
        </div>
      </section>
      <section class="ag-s4-section" aria-label="اقلام">
        <div class="ag-s4-section-title">اقلام</div>
        ${itemsHtml}
      </section>
      ${creditBlock}
      ${editItemsBlock}
      ${actions}
      ${returnBlock}
      ${chatBlock}
    `;
  }

  function renderNewOrder() {
    const role = getCurrentRole();
    const officeId = getCurrentOfficeId();
    const office = findOffice(officeId);
    if (!role) return renderDashboard();
    if (role !== ROLES.customer) return nav("/dashboard", true);

    setTitle("سفارش جدید");
    const customerId = getActiveCustomerId(office);
    const customer = office ? findCustomer(office, customerId) : null;

    els.view.innerHTML = `
      <section class="ag-s4-section" aria-label="سفارش جدید">
        <div class="ag-s4-section-title">سفارش جدید</div>
        <div class="ag-hint">ثبت سفارش فقط وزن‌محور است (امانی). هیچ قیمت/پرداختی وجود ندارد.</div>

        <div class="ag-kpi" style="margin-top:10px;">
          <div class="ag-kpi-row"><span>مشتری</span><strong>${escapeHtml(customer?.name || "—")}</strong></div>
          <div class="ag-kpi-row"><span>دفتر</span><strong>${escapeHtml(office?.name || "—")}</strong></div>
        </div>

        <div class="ag-formline" style="margin-top:12px;">
          <label class="ag-label" for="ag-new-item-name">نام قلم</label>
          <input class="ag-input" id="ag-new-item-name" placeholder="مثال: النگو" />
          <label class="ag-label" for="ag-new-item-weight">وزن (گرم)</label>
          <input class="ag-input" id="ag-new-item-weight" inputmode="decimal" placeholder="مثال: 12.5" />
          <label class="ag-label" for="ag-new-item-count">تعداد</label>
          <input class="ag-input" id="ag-new-item-count" inputmode="numeric" placeholder="مثال: 1" />
          <button class="ag-ghost" type="button" data-action="add-draft-item">افزودن به لیست</button>
        </div>

        <div class="ag-s4-subsection" aria-label="اقلام پیش‌نویس">
          <div class="ag-s4-section-title">اقلام پیش‌نویس</div>
          <div id="ag-draft-items" class="ag-empty">هنوز قلمی اضافه نشده است.</div>
        </div>

        <div class="ag-formline" style="margin-top:12px;">
          <label class="ag-label" for="ag-new-notes">یادداشت</label>
          <input class="ag-input" id="ag-new-notes" placeholder="اختیاری" />
          <button class="ag-primary" type="button" data-action="create-order">ایجاد سفارش</button>
        </div>
      </section>
    `;

    renderDraftItems();
  }

  let draftItems = [];

  function renderDraftItems() {
    const host = document.getElementById("ag-draft-items");
    if (!host) return;
    if (draftItems.length === 0) {
      host.className = "ag-empty";
      host.textContent = "هنوز قلمی اضافه نشده است.";
      return;
    }
    host.className = "ag-list";
    host.innerHTML = draftItems
      .map((it, i) => {
        const sub = `${toFixedWeight(it.weight)} گرم • ${it.count} عدد`;
        return `
          <button class="ag-list-item" type="button" data-action="remove-draft-item" data-index="${i}">
            <div class="ag-li-main">
              <div class="ag-li-title">${escapeHtml(it.name)}</div>
              <div class="ag-li-sub">${escapeHtml(sub)}</div>
            </div>
            <div class="ag-li-meta">حذف</div>
          </button>
        `;
      })
      .join("");
  }

  function renderInventory(route) {
    const role = getCurrentRole();
    if (!role) return renderDashboard();
    if (!canSeeInventory(role)) return nav("/dashboard", true);

    const officeId = getCurrentOfficeId();
    const items = getInventory();

    if (route?.id) {
      const inv = items.find((x) => x.id === route.id) || null;
      if (!inv) {
        els.view.innerHTML = `<div class="ag-empty">مورد موجودی پیدا نشد.</div>`;
        setTitle("موجودی");
        return;
      }
      if (role !== ROLES.system_admin && inv.officeId !== officeId) return nav("/inventory", true);

      const office = findOffice(inv.officeId);
      const canEdit = role === ROLES.office_order_manager;
      setTitle("جزئیات موجودی");
      els.view.innerHTML = `
        <section class="ag-s4-section" aria-label="جزئیات موجودی">
          <div class="ag-s4-section-title">جزئیات موجودی</div>
          <div class="ag-kpi">
            <div class="ag-kpi-row"><span>دفتر</span><strong>${escapeHtml(office?.name || "—")}</strong></div>
            <div class="ag-kpi-row"><span>عنوان</span><strong>${escapeHtml(inv.name || "—")}</strong></div>
            <div class="ag-kpi-row"><span>وزن</span><strong>${escapeHtml(toFixedWeight(inv.weight || 0))} گرم</strong></div>
            <div class="ag-kpi-row"><span>تعداد</span><strong>${escapeHtml(inv.count ?? 0)} عدد</strong></div>
          </div>
          ${
            canEdit
              ? `
                <div class="ag-formgrid" style="margin-top:12px;">
                  <div class="ag-formline">
                    <label class="ag-label" for="ag-inv-weight">وزن (گرم)</label>
                    <input class="ag-input" id="ag-inv-weight" inputmode="decimal" value="${escapeHtml(inv.weight ?? 0)}" />
                  </div>
                  <div class="ag-formline">
                    <label class="ag-label" for="ag-inv-count">تعداد</label>
                    <input class="ag-input" id="ag-inv-count" inputmode="numeric" value="${escapeHtml(inv.count ?? 0)}" />
                  </div>
                </div>
                <button class="ag-primary" type="button" data-action="save-inventory" data-inv-id="${escapeHtml(inv.id)}">ذخیره تغییرات</button>
              `
              : `<div class="ag-hint">این بخش فقط برای مشاهده است.</div>`
          }
        </section>
      `;
      return;
    }

    const visible = role === ROLES.system_admin ? items : items.filter((it) => it.officeId === officeId);
    setTitle("موجودی");
    els.view.innerHTML = `
      <section class="ag-s4-section" aria-label="موجودی">
        <div class="ag-s4-section-title">موجودی</div>
        <div class="ag-list">
          ${
            role === ROLES.office_order_manager
              ? `
                <button class="ag-list-item" type="button" data-nav="#/inventory-import">
                  <div class="ag-li-main">
                    <div class="ag-li-title">ورود از اکسل (نمایشی)</div>
                    <div class="ag-li-sub">فقط UI Mock</div>
                  </div>
                  <div class="ag-li-meta">باز کردن</div>
                </button>
              `
              : ""
          }
          ${
            visible.length
              ? visible
                  .map((it) => {
                    const ofc = findOffice(it.officeId);
                    const meta = `${toFixedWeight(it.weight || 0)}g • ${it.count ?? 0}x`;
                    const sub = role === ROLES.system_admin ? `${ofc?.name || ""}` : "";
                    return `
                      <button class="ag-list-item" type="button" data-nav="#/inventory/${escapeHtml(it.id)}">
                        <div class="ag-li-main">
                          <div class="ag-li-title">${escapeHtml(it.name || "—")}</div>
                          <div class="ag-li-sub">${escapeHtml(sub || " ")}</div>
                        </div>
                        <div class="ag-li-meta">${escapeHtml(meta)}</div>
                      </button>
                    `;
                  })
                  .join("")
              : `<div class="ag-empty">موجودی ثبت نشده است.</div>`
          }
        </div>
      </section>
    `;
  }

  function renderInventoryImport() {
    const role = getCurrentRole();
    if (!role) return renderDashboard();
    if (role !== ROLES.office_order_manager) return nav("/inventory", true);
    setTitle("ورود از اکسل");
    els.view.innerHTML = `
      <section class="ag-s4-section" aria-label="ورود از اکسل">
        <div class="ag-s4-section-title">ورود از اکسل (UI Mock)</div>
        <div class="ag-hint">در STAGE 4 این بخش فقط نمایشی است و فایل پردازش نمی‌شود.</div>
        <div class="ag-list" style="margin-top:10px;">
          <button class="ag-list-item" type="button" data-action="mock-import">
            <div class="ag-li-main">
              <div class="ag-li-title">شبیه‌سازی ورود</div>
              <div class="ag-li-sub">افزودن/به‌روزرسانی چند ردیف نمونه</div>
            </div>
            <div class="ag-li-meta">اجرا</div>
          </button>
        </div>
      </section>
    `;
  }

  function renderContactChat() {
    const role = getCurrentRole();
    const officeId = getCurrentOfficeId();
    if (!role) return renderDashboard();
    const office = findOffice(officeId);
    const contacts = getContacts();
    const contact = contacts.find((c) => c.officeId === officeId) || null;
    const msgs = (contact?.directChat?.messages || []).slice();

    setTitle("چت پشتیبانی");
    els.view.innerHTML = `
      <section class="ag-s4-section" aria-label="چت پشتیبانی">
        <div class="ag-s4-section-title">چت پشتیبانی</div>
        <div class="ag-chat">
          <div class="ag-chat-list" aria-label="پیام‌ها">
            ${
              msgs.length
                ? msgs
                    .map((m) => {
                      const mine = m.role === role;
                      const name = m.name || roleLabel(m.role);
                      return `
                        <div class="ag-chat-msg ${mine ? "mine" : ""}">
                          <div class="ag-chat-meta">${escapeHtml(name)} • ${escapeHtml(formatDateFa(m.at))}</div>
                          <div class="ag-chat-bubble">${escapeHtml(m.text || "")}</div>
                        </div>
                      `;
                    })
                    .join("")
                : `<div class="ag-empty">پیامی وجود ندارد.</div>`
            }
          </div>
          <div class="ag-chat-compose">
            <input class="ag-input" id="ag-contact-chat-text" placeholder="پیام..." />
            <button class="ag-primary" type="button" data-action="send-contact-chat">ارسال</button>
          </div>
          <div class="ag-hint">این چت فقط در همین مرورگر/دستگاه ذخیره می‌شود.</div>
        </div>
      </section>
      ${renderContactManagerSection(officeId)}
    `;

    window.setTimeout(() => {
      const list = document.querySelector(".ag-chat-list");
      if (list) list.scrollTop = list.scrollHeight;
    }, 0);
  }

  function renderApp() {
    const role = getCurrentRole();
    if (!role) {
      setMode("login");
      return;
    }
    setMode("app");
    const route = parseRoute();
    if (route.name === "dashboard") return renderDashboard();
    if (route.name === "orders") return renderOrdersList(route.kind);
    if (route.name === "order") return renderOrderDetail(route.id);
    if (route.name === "order-new") return renderNewOrder();
    if (route.name === "inventory") return renderInventory(route);
    if (route.name === "inventory-import") return renderInventoryImport();
    if (route.name === "contact-chat") return renderContactChat();
    return renderDashboard();
  }

  // Login
  els.enter.addEventListener("click", () => {
    const role = (els.role.value || "").trim();
    if (!Object.values(ROLES).includes(role)) return;
    const officeId = getCurrentOfficeId();
    setCurrentRole(role);
    upsertSessionUserName(officeId, role, els.name?.value || "");
    if (role === ROLES.customer) upsertCustomerSession(officeId, els.phone?.value || "", els.name?.value || "");
    beginEnterAppTransition();
    nav("/dashboard", true);
    renderApp();
  });

  // Back
  if (els.back) {
    els.back.addEventListener("click", () => {
      const role = getCurrentRole();
      if (!role) return logoutToLogin();
      if (location.hash === "#/dashboard" || location.hash === "#/" || !location.hash) return;
      if (history.length >= 2) history.back();
      else nav("/dashboard", true);
    });
  }

  // Delegated actions
  document.addEventListener("click", (e) => {
    const navEl = e.target.closest("[data-nav]");
    if (navEl) {
      const to = navEl.getAttribute("data-nav") || "#/dashboard";
      nav(to.replace(/^#/, "/"));
      renderApp();
      return;
    }

    const actionEl = e.target.closest("[data-action]");
    if (!actionEl) return;
    const action = actionEl.getAttribute("data-action");
    const role = getCurrentRole();

    if (action === "logout") return logoutToLogin();

    if (action === "admin-set-office") {
      if (role !== ROLES.system_admin) return;
      const officeId = actionEl.getAttribute("data-office-id") || "";
      if (!officeId) return;
      setCurrentOfficeId(officeId);
      adminOfficeFilterId = officeId;
      nav("/orders/active", true);
      renderApp();
      return;
    }

    if (action === "save-credit") {
      if (!canEditCredit(role)) return;
      const route = parseRoute();
      if (route.name !== "order") return;
      const order = getOrders().find((o) => o.id === route.id) || null;
      if (!order) return;
      const customerId = actionEl.getAttribute("data-customer-id") || "";
      if (!customerId) return;
      const next = Number(document.getElementById("ag-credit")?.value);
      if (!Number.isFinite(next) || next < 0) return;

      const offices = getOffices();
      const oIdx = offices.findIndex((o) => o.id === order.officeId);
      if (oIdx < 0) return;
      const customers = (offices[oIdx].customers || []).slice();
      const cIdx = customers.findIndex((c) => c.id === customerId);
      if (cIdx < 0) return;
      customers[cIdx] = { ...customers[cIdx], creditLimitWeight: next };
      offices[oIdx] = { ...offices[oIdx], customers };
      setOffices(offices);
      renderApp();
      return;
    }

    if (action === "save-items") {
      const orderId = actionEl.getAttribute("data-order-id") || "";
      const order = getOrders().find((o) => o.id === orderId) || null;
      if (!order) return;
      if (role === ROLES.sales_manager) return;
      if (order.blocked) return;
      const allowed = (role === ROLES.customer && order.status === ORDER_STATUS.IN_PROGRESS) || role === ROLES.office_order_manager;
      if (!allowed) return;

      const nextItems = (order.items || []).map((it) => ({ ...it }));
      for (const el of document.querySelectorAll('[data-field="item-name"]')) {
        const i = Number(el.getAttribute("data-index"));
        if (!Number.isInteger(i) || i < 0 || i >= nextItems.length) continue;
        nextItems[i].name = String(el.value || "").trim();
      }
      for (const el of document.querySelectorAll('[data-field="item-weight"]')) {
        const i = Number(el.getAttribute("data-index"));
        if (!Number.isInteger(i) || i < 0 || i >= nextItems.length) continue;
        const n = Number(el.value);
        if (!Number.isFinite(n) || n < 0) continue;
        nextItems[i].weight = n;
      }
      for (const el of document.querySelectorAll('[data-field="item-count"]')) {
        const i = Number(el.getAttribute("data-index"));
        if (!Number.isInteger(i) || i < 0 || i >= nextItems.length) continue;
        const n = Number(el.value);
        if (!Number.isFinite(n) || n < 0) continue;
        nextItems[i].count = Math.floor(n);
      }

      updateOrder(orderId, (o) => {
        o.items = nextItems;
      });
      renderApp();
      return;
    }

    if (action === "cancel-order") {
      if (role !== ROLES.customer) return;
      const orderId = actionEl.getAttribute("data-order-id") || "";
      const order = getOrders().find((o) => o.id === orderId) || null;
      if (!order) return;
      if (order.blocked) return;
      if (order.status !== ORDER_STATUS.IN_PROGRESS) return;
      updateOrder(orderId, (o) => {
        o.status = ORDER_STATUS.CANCELLED;
      });
      nav("/orders/archive", true);
      renderApp();
      return;
    }

    if (action === "reject-order") {
      if (!canSendToFactory(role)) return;
      const orderId = actionEl.getAttribute("data-order-id") || "";
      const order = getOrders().find((o) => o.id === orderId) || null;
      if (!order) return;
      if (order.blocked) return;
      if (order.status !== ORDER_STATUS.IN_PROGRESS) return;
      updateOrder(orderId, (o) => {
        o.status = ORDER_STATUS.REJECTED;
      });
      nav("/orders/archive", true);
      renderApp();
      return;
    }

    if (action === "send-to-factory") {
      if (!canSendToFactory(role)) return;
      const orderId = actionEl.getAttribute("data-order-id") || "";
      const order = getOrders().find((o) => o.id === orderId) || null;
      if (!order) return;
      if (order.blocked) return;
      if (order.status !== ORDER_STATUS.IN_PROGRESS) return;
      const updated = updateOrder(orderId, (o) => {
        o.status = ORDER_STATUS.SENT_TO_FACTORY;
      });
      if (updated) ensureChatForOrder(updated, role);
      renderApp();
      return;
    }

    if (action === "mark-delivered") {
      if (!canSendToFactory(role)) return;
      const orderId = actionEl.getAttribute("data-order-id") || "";
      const order = getOrders().find((o) => o.id === orderId) || null;
      if (!order) return;
      if (order.blocked) return;
      if (order.status !== ORDER_STATUS.SENT_TO_FACTORY) return;
      updateOrder(orderId, (o) => {
        o.status = ORDER_STATUS.DELIVERED;
      });
      nav("/orders/archive", true);
      renderApp();
      return;
    }

    if (action === "mark-completed") {
      if (!canSendToFactory(role)) return;
      const orderId = actionEl.getAttribute("data-order-id") || "";
      const order = getOrders().find((o) => o.id === orderId) || null;
      if (!order) return;
      if (order.blocked) return;
      if (order.status !== ORDER_STATUS.DELIVERED) return;
      updateOrder(orderId, (o) => {
        o.status = ORDER_STATUS.COMPLETED;
      });
      nav("/orders/archive", true);
      renderApp();
      return;
    }

    if (action === "block-order") {
      if (role !== ROLES.system_admin) return;
      const orderId = actionEl.getAttribute("data-order-id") || "";
      updateOrder(orderId, (o) => {
        o.blocked = true;
      });
      renderApp();
      return;
    }

    if (action === "unblock-order") {
      if (role !== ROLES.system_admin) return;
      const orderId = actionEl.getAttribute("data-order-id") || "";
      updateOrder(orderId, (o) => {
        o.blocked = false;
      });
      renderApp();
      return;
    }

    if (action === "add-return") {
      if (role !== ROLES.customer) return;
      const orderId = actionEl.getAttribute("data-order-id") || "";
      const order = getOrders().find((o) => o.id === orderId) || null;
      if (!order) return;
      if (order.blocked) return;
      const eligible = order.status === ORDER_STATUS.DELIVERED || order.status === ORDER_STATUS.COMPLETED;
      if (!eligible) return;
      const w = Number(document.getElementById("ag-return-weight")?.value);
      const note = String(document.getElementById("ag-return-note")?.value || "").trim();
      if (!Number.isFinite(w) || w <= 0) return;
      updateOrder(orderId, (o) => {
        const returns = Array.isArray(o.returns) ? o.returns.slice() : [];
        returns.push({ id: genId("ret"), at: nowIso(), weight: w, note });
        o.returns = returns;
      });
      renderApp();
      return;
    }

    if (action === "send-chat") {
      const orderId = actionEl.getAttribute("data-order-id") || "";
      const order = getOrders().find((o) => o.id === orderId) || null;
      if (!order) return;
      const txt = String(document.getElementById("ag-chat-text")?.value || "").trim();
      if (!txt) return;
      const office = findOffice(order.officeId);
      const chats = getChats();
      const idx = chats.findIndex((c) => c.orderId === orderId);
      if (idx < 0) return;
      const chat = { ...chats[idx] };
      const messages = Array.isArray(chat.messages) ? chat.messages.slice() : [];
      messages.push({ id: genId("m"), at: nowIso(), role, name: getSessionNameForRole(office, role), text: txt });
      chat.messages = messages;
      chats[idx] = chat;
      setChats(chats);
      renderApp();
      return;
    }

    if (action === "delete-chat") {
      if (!canDeleteChat(role)) return;
      const orderId = actionEl.getAttribute("data-order-id") || "";
      setChats(getChats().filter((c) => c.orderId !== orderId));
      renderApp();
      return;
    }

    if (action === "send-contact-chat") {
      const officeId = getCurrentOfficeId();
      const office = findOffice(officeId);
      if (!office) return;
      const txt = String(document.getElementById("ag-contact-chat-text")?.value || "").trim();
      if (!txt) return;
      const contacts = getContacts().slice();
      const idx = contacts.findIndex((c) => c.officeId === officeId);
      if (idx < 0) return;
      const next = { ...contacts[idx] };
      const directChat = { ...(next.directChat || {}) };
      const messages = Array.isArray(directChat.messages) ? directChat.messages.slice() : [];
      messages.push({ id: genId("m"), at: nowIso(), role, name: getSessionNameForRole(office, role), text: txt });
      directChat.messages = messages;
      next.directChat = directChat;
      contacts[idx] = next;
      setContacts(contacts);
      renderApp();
      return;
    }

    if (action === "add-draft-item") {
      if (role !== ROLES.customer) return;
      const name = String(document.getElementById("ag-new-item-name")?.value || "").trim();
      const weight = Number(document.getElementById("ag-new-item-weight")?.value);
      const count = Number(document.getElementById("ag-new-item-count")?.value);
      if (!name) return;
      if (!Number.isFinite(weight) || weight <= 0) return;
      const c = Number.isFinite(count) && count > 0 ? Math.floor(count) : 1;
      draftItems.push({ name, weight, count: c });
      renderDraftItems();
      return;
    }

    if (action === "remove-draft-item") {
      if (role !== ROLES.customer) return;
      const i = Number(actionEl.getAttribute("data-index"));
      if (!Number.isInteger(i) || i < 0 || i >= draftItems.length) return;
      draftItems.splice(i, 1);
      renderDraftItems();
      return;
    }

    if (action === "create-order") {
      if (role !== ROLES.customer) return;
      if (draftItems.length === 0) return;
      const officeId = getCurrentOfficeId();
      const office = findOffice(officeId);
      if (!office) return;
      const orders = getOrders().slice();
      const id = genId("ord");
      const customerId = getActiveCustomerId(office);
      const notes = String(document.getElementById("ag-new-notes")?.value || "").trim();
      const order = {
        id,
        code: genOrderCode(orders.length + 1),
        createdAt: nowIso(),
        officeId,
        customerId,
        status: ORDER_STATUS.IN_PROGRESS,
        items: draftItems.map((x) => ({ ...x })),
        notes,
        returns: [],
        blocked: false,
        updatedAt: nowIso(),
      };
      orders.push(order);
      setOrders(orders);
      draftItems = [];
      nav(`/order/${id}`, true);
      renderApp();
      return;
    }

    if (action === "save-inventory") {
      if (role !== ROLES.office_order_manager) return;
      const invId = actionEl.getAttribute("data-inv-id") || "";
      const items = getInventory().slice();
      const idx = items.findIndex((x) => x.id === invId);
      if (idx < 0) return;
      const w = Number(document.getElementById("ag-inv-weight")?.value);
      const c = Number(document.getElementById("ag-inv-count")?.value);
      if (!Number.isFinite(w) || w < 0) return;
      if (!Number.isFinite(c) || c < 0) return;
      items[idx] = { ...items[idx], weight: w, count: Math.floor(c), updatedAt: nowIso() };
      setInventory(items);
      renderApp();
      return;
    }

    if (action === "mock-import") {
      if (role !== ROLES.office_order_manager) return;
      const officeId = getCurrentOfficeId();
      const items = getInventory().slice();
      const upserts = [
        { name: "حلقه", weight: 33.3, count: 4 },
        { name: "گردنبند", weight: 61.7, count: 6 },
      ];
      for (const u of upserts) {
        const idx = items.findIndex((x) => x.officeId === officeId && x.name === u.name);
        if (idx >= 0) items[idx] = { ...items[idx], weight: u.weight, count: u.count, updatedAt: nowIso() };
        else items.push({ id: genId("inv"), officeId, name: u.name, weight: u.weight, count: u.count, updatedAt: nowIso() });
      }
      setInventory(items);
      nav("/inventory", true);
      renderApp();
      return;
    }
  });

  document.addEventListener("change", (e) => {
    const sel = e.target.closest('[data-action="admin-office-filter"]');
    if (!sel) return;
    if (getCurrentRole() !== ROLES.system_admin) return;
    adminOfficeFilterId = String(sel.value || "ALL");
    renderApp();
  });

  window.addEventListener("hashchange", renderApp);

  // Initial boot
  const role = getCurrentRole();
  if (role) {
    setMode("app");
    renderApp();
  } else {
    setMode("login");
    setTitle("");
  }
})();
