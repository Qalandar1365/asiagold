(() => {
  const STORAGE = {
    basket: "asiagold_basket_v1",
    orders: "asiagold_orders_v1",
    orderSeq: "asiagold_order_seq",
    role: "asiagold_role_v1",
  };

  const DAY_MS = 24 * 60 * 60 * 1000;
  const BASKET_TTL_MS = 4 * DAY_MS;
  const MAX_PER_ITEM = 120;

  const nfInt = new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 0 });
  const nfWeight = new Intl.NumberFormat("fa-IR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const CATALOG = [
    {
      id: "cat-bangle",
      name: "النگو",
      lines: [
        {
          id: "line-bangle-asia",
          name: "النگو آسیا",
          models: [
            { id: "model-bangle-asia-155-yellow", name: "النگو آسیا ۱۵۵ زرد", unitWeight: 4.25 },
            { id: "model-bangle-asia-155-white", name: "النگو آسیا ۱۵۵ سفید", unitWeight: 4.20 },
            { id: "model-bangle-asia-160-yellow", name: "النگو آسیا ۱۶۰ زرد", unitWeight: 4.45 },
          ],
        },
        {
          id: "line-bangle-shahrzad",
          name: "النگوی شهرزاد",
          models: [
            { id: "model-bangle-shahrzad-110-yellow", name: "النگوی شهرزاد ۱۱۰ زرد", unitWeight: 3.10 },
            { id: "model-bangle-shahrzad-115-yellow", name: "النگوی شهرزاد ۱۱۵ زرد", unitWeight: 3.30 },
          ],
        },
      ],
    },
    {
      id: "cat-ring",
      name: "انگشتر",
      lines: [
        {
          id: "line-ring-asia",
          name: "انگشتر آسیا",
          models: [
            { id: "model-ring-asia-21-yellow", name: "انگشتر آسیا ۲۱ زرد", unitWeight: 2.15 },
            { id: "model-ring-asia-23-yellow", name: "انگشتر آسیا ۲۳ زرد", unitWeight: 2.30 },
          ],
        },
      ],
    },
    {
      id: "cat-necklace",
      name: "گردنبند",
      lines: [
        {
          id: "line-necklace-asia",
          name: "گردنبند آسیا",
          models: [
            { id: "model-necklace-asia-45-yellow", name: "گردنبند آسیا ۴۵ زرد", unitWeight: 6.80 },
            { id: "model-necklace-asia-50-yellow", name: "گردنبند آسیا ۵۰ زرد", unitWeight: 7.40 },
          ],
        },
      ],
    },
  ];

  const index = (() => {
    const categoriesById = new Map();
    const linesById = new Map();
    const modelsById = new Map();
    for (const cat of CATALOG) {
      categoriesById.set(cat.id, cat);
      for (const line of cat.lines) {
        linesById.set(line.id, { ...line, categoryId: cat.id });
        for (const model of line.models) {
          modelsById.set(model.id, { ...model, categoryId: cat.id, lineId: line.id });
        }
      }
    }
    return { categoriesById, linesById, modelsById };
  })();

  const els = {
    flash: document.getElementById("flash"),
    breadcrumb: document.getElementById("breadcrumb"),
    goBasket: document.getElementById("go-basket"),
    basketTotalCount: document.getElementById("basket-total-count"),
    basketTotalWeight: document.getElementById("basket-total-weight"),

    viewCategory: document.getElementById("view-category"),
    viewList: document.getElementById("view-list"),
    viewDetail: document.getElementById("view-detail"),

    categoryGrid: document.getElementById("category-grid"),
    lineSelect: document.getElementById("line-select"),
    modelGrid: document.getElementById("model-grid"),

    backToCategory: document.getElementById("back-to-category"),
    toBasketFromList: document.getElementById("to-basket-from-list"),

    modelMeta: document.getElementById("model-meta"),
    qty: document.getElementById("qty"),
    qtyError: document.getElementById("qty-error"),
    totalWeight: document.getElementById("total-weight"),
    note: document.getElementById("note"),
    backToList: document.getElementById("back-to-list"),
    addToBasket: document.getElementById("add-to-basket"),
    maxHint: document.getElementById("max-hint"),

    basketSection: document.getElementById("basket"),
    basketEmpty: document.getElementById("basket-empty"),
    basketList: document.getElementById("basket-list"),
    backToFlow: document.getElementById("back-to-flow"),
    toConfirm: document.getElementById("to-confirm"),
    clearBasket: document.getElementById("clear-basket"),

    confirmSection: document.getElementById("confirm"),
    confirmSummary: document.getElementById("confirm-summary"),
    confirmCheck: document.getElementById("confirm-check"),
    submitOrder: document.getElementById("submit-order"),
    backToBasket: document.getElementById("back-to-basket"),

    ordersFilter: document.getElementById("orders-filter"),
    ordersSort: document.getElementById("orders-sort"),
    ordersList: document.getElementById("orders-list"),
  };

  const state = {
    step: "category", // category | list | detail | basket | confirm
    selectedCategoryId: null,
    selectedLineId: null,
    selectedModelId: null,
    editingItemId: null,
    isAdmin: false,
  };

  function nowIso() {
    return new Date().toISOString();
  }

  function safeParse(json) {
    try {
      return JSON.parse(json);
    } catch {
      return null;
    }
  }

  function escapeHtml(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function flash(message) {
    els.flash.hidden = false;
    els.flash.innerHTML = `<strong>پیام:</strong> ${escapeHtml(message)}`;
    window.clearTimeout(flash._t);
    flash._t = window.setTimeout(() => {
      els.flash.hidden = true;
    }, 5000);
  }

  function readRole() {
    return localStorage.getItem(STORAGE.role) === "admin" ? "admin" : "user";
  }

  function toLatinDigits(value) {
    const s = String(value ?? "");
    const fa = "۰۱۲۳۴۵۶۷۸۹";
    const ar = "٠١٢٣٤٥٦٧٨٩";
    return s
      .replace(/[۰-۹]/g, (d) => String(fa.indexOf(d)))
      .replace(/[٠-٩]/g, (d) => String(ar.indexOf(d)));
  }

  function readQtyValue() {
    const raw = toLatinDigits(els.qty.value).replaceAll(",", "").replaceAll("٬", "").trim();
    if (!raw) return null;
    if (!/^\d+$/.test(raw)) return null;
    const qty = readQtyValue();
    if (!Number.isSafeInteger(qty)) return null;
    return qty;
  }

  function getEmptyBasket() {
    const t = nowIso();
    return { v: 1, createdAt: t, updatedAt: t, items: [] };
  }

  function loadBasket() {
    const raw = localStorage.getItem(STORAGE.basket);
    const data = raw ? safeParse(raw) : null;
    if (!data || typeof data !== "object") return null;
    if (!Array.isArray(data.items)) return null;
    return data;
  }

  function saveBasket(basket) {
    localStorage.setItem(STORAGE.basket, JSON.stringify(basket));
  }

  function clearBasketStorage() {
    localStorage.removeItem(STORAGE.basket);
  }

  function ensureBasketNotExpired() {
    const basket = loadBasket();
    if (!basket) return getEmptyBasket();
    const createdAtMs = Date.parse(basket.createdAt);
    if (!Number.isFinite(createdAtMs)) {
      clearBasketStorage();
      return getEmptyBasket();
    }
    if (Date.now() - createdAtMs > BASKET_TTL_MS) {
      clearBasketStorage();
      flash("سبد شما به‌صورت خودکار پس از ۴ روز پاک شد.");
      return getEmptyBasket();
    }
    return basket;
  }

  function computeTotals(basket) {
    let totalCount = 0;
    let totalWeight = 0;
    for (const item of basket.items) {
      const qty = Number(item.qty);
      if (!Number.isFinite(qty) || qty <= 0) continue;
      totalCount += qty;
      const model = index.modelsById.get(item.modelId);
      if (!model) continue;
      totalWeight += qty * Number(model.unitWeight || 0);
    }
    return { totalCount, totalWeight };
  }

  function renderBasketKpis() {
    const basket = ensureBasketNotExpired();
    const { totalCount, totalWeight } = computeTotals(basket);
    els.basketTotalCount.textContent = nfInt.format(totalCount);
    els.basketTotalWeight.textContent = nfWeight.format(totalWeight);
  }

  function setStep(step) {
    state.step = step;
    els.viewCategory.hidden = step !== "category";
    els.viewList.hidden = step !== "list";
    els.viewDetail.hidden = step !== "detail";
    els.basketSection.hidden = step !== "basket";
    els.confirmSection.hidden = step !== "confirm";
    render();
  }

  function renderBreadcrumb() {
    const parts = [];
    const cat = state.selectedCategoryId ? index.categoriesById.get(state.selectedCategoryId) : null;
    const line = state.selectedLineId ? index.linesById.get(state.selectedLineId) : null;
    const model = state.selectedModelId ? index.modelsById.get(state.selectedModelId) : null;
    if (cat) parts.push(`دسته‌بندی: <strong>${escapeHtml(cat.name)}</strong>`);
    if (line) parts.push(`لاین: <strong>${escapeHtml(line.name)}</strong>`);
    if (model) parts.push(`مدل: <strong>${escapeHtml(model.name)}</strong>`);
    els.breadcrumb.innerHTML = parts.length ? parts.join(" <span class=\"muted\">/</span> ") : "برای شروع، یک دسته‌بندی را انتخاب کنید.";
  }

  function renderCategoryGrid() {
    els.categoryGrid.innerHTML = "";
    for (const cat of CATALOG) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "pill";
      btn.innerHTML = `${escapeHtml(cat.name)}<span class="pill-sub">انتخاب</span>`;
      btn.addEventListener("click", () => {
        state.selectedCategoryId = cat.id;
        state.selectedLineId = cat.lines[0]?.id || null;
        state.selectedModelId = null;
        state.editingItemId = null;
        setStep("list");
      });
      els.categoryGrid.appendChild(btn);
    }
  }

  function renderLineSelect() {
    els.lineSelect.innerHTML = "";
    const cat = state.selectedCategoryId ? index.categoriesById.get(state.selectedCategoryId) : null;
    if (!cat) return;
    for (const line of cat.lines) {
      const opt = document.createElement("option");
      opt.value = line.id;
      opt.textContent = line.name;
      els.lineSelect.appendChild(opt);
    }
    if (!state.selectedLineId || !cat.lines.some((l) => l.id === state.selectedLineId)) {
      state.selectedLineId = cat.lines[0]?.id || null;
    }
    if (state.selectedLineId) els.lineSelect.value = state.selectedLineId;
  }

  function renderModelGrid() {
    els.modelGrid.innerHTML = "";
    if (!state.selectedLineId) return;
    const line = index.linesById.get(state.selectedLineId);
    if (!line) return;
    for (const model of line.models) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "pill";
      btn.innerHTML = `${escapeHtml(model.name)}<span class="pill-sub">وزن هر عدد: ${nfWeight.format(model.unitWeight)} گرم</span>`;
      btn.addEventListener("click", () => {
        state.selectedModelId = model.id;
        state.editingItemId = null;
        prepareDetailForModel(model.id);
        setStep("detail");
      });
      els.modelGrid.appendChild(btn);
    }
  }

  function getMaxForUser() {
    return state.isAdmin ? Infinity : MAX_PER_ITEM;
  }

  function prepareDetailForModel(modelId) {
    const model = index.modelsById.get(modelId);
    if (!model) return;

    els.qtyError.hidden = true;
    els.note.value = "";
    els.qty.value = nfInt.format(1);

    els.modelMeta.innerHTML =
      `دسته‌بندی: <strong>${escapeHtml(index.categoriesById.get(model.categoryId)?.name || "—")}</strong>` +
      ` | لاین: <strong>${escapeHtml(index.linesById.get(model.lineId)?.name || "—")}</strong>` +
      ` | مدل: <strong>${escapeHtml(model.name)}</strong>` +
      `<br><span class="muted">وزن تقریبی هر عدد:</span> <strong>${nfWeight.format(model.unitWeight)}</strong> گرم`;

    els.maxHint.textContent = state.isAdmin
      ? "حالت مدیر: محدودیت سقف تعداد غیرفعال است."
      : `حداکثر تعداد در هر بار افزودن برای این مدل: ${nfInt.format(MAX_PER_ITEM)} عدد. برای تعداد بیشتر، همین مقدار را اضافه کنید و دوباره وارد همین مدل شوید.`;

    updateComputedWeight();
    updateQtyValidation();
  }

  function updateComputedWeight() {
    const model = state.selectedModelId ? index.modelsById.get(state.selectedModelId) : null;
    if (!model) {
      els.totalWeight.value = "";
      return;
    }
    const qty = readQtyValue();
    const weight = qty ? qty * Number(model.unitWeight || 0) : 0;
    els.totalWeight.value = nfWeight.format(weight);
  }

  function updateQtyValidation() {
    const max = getMaxForUser();
    const raw = String(els.qty.value ?? "");
    const qty = Number(raw);
    if (!raw.trim()) {
      els.qtyError.hidden = false;
      els.qtyError.textContent = "تعداد را وارد کنید.";
      els.addToBasket.disabled = true;
      return false;
    }
    if (qty === null || qty <= 0) {
      els.qtyError.hidden = false;
      els.qtyError.textContent = "تعداد باید عدد صحیح و مثبت باشد.";
      els.addToBasket.disabled = true;
      return false;
    }
    if (qty < 1) {
      els.qtyError.hidden = false;
      els.qtyError.textContent = "حداقل سفارش برای هر مدل: ۱ عدد.";
      els.addToBasket.disabled = true;
      return false;
    }
    if (qty > max) {
      els.qtyError.hidden = false;
      els.qtyError.textContent = `سقف مجاز در هر بار افزودن: ${nfInt.format(MAX_PER_ITEM)} عدد.`;
      els.addToBasket.disabled = true;
      return false;
    }
    els.qtyError.hidden = true;
    els.addToBasket.disabled = false;
    return true;
  }

  function newId(prefix) {
    return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
  }

  function upsertBasketItem({ modelId, qty, note, itemId }) {
    const basket = ensureBasketNotExpired();
    const t = nowIso();
    basket.updatedAt = t;
    if (itemId) {
      const idx = basket.items.findIndex((x) => x.itemId === itemId);
      if (idx >= 0) basket.items[idx] = { ...basket.items[idx], qty, note, updatedAt: t };
    } else {
      basket.items.push({ itemId: newId("item"), modelId, qty, note, createdAt: t, updatedAt: t });
    }
    saveBasket(basket);
    return basket;
  }

  function removeBasketItem(itemId) {
    const basket = ensureBasketNotExpired();
    basket.items = basket.items.filter((x) => x.itemId !== itemId);
    basket.updatedAt = nowIso();
    saveBasket(basket);
  }

  function clearBasketAll() {
    clearBasketStorage();
  }

  function loadOrders() {
    const raw = localStorage.getItem(STORAGE.orders);
    const data = raw ? safeParse(raw) : null;
    if (!Array.isArray(data)) return [];
    return data.filter((x) => x && typeof x === "object" && Array.isArray(x.items));
  }

  function saveOrders(orders) {
    localStorage.setItem(STORAGE.orders, JSON.stringify(orders));
  }

  function nextOrderId() {
    const cur = Number(localStorage.getItem(STORAGE.orderSeq) || "1000");
    const next = Number.isFinite(cur) ? cur + 1 : 1001;
    localStorage.setItem(STORAGE.orderSeq, String(next));
    return next;
  }

  function basketToOrderItems(basket) {
    const items = [];
    for (const b of basket.items) {
      const model = index.modelsById.get(b.modelId);
      if (!model) continue;
      items.push({
        itemId: b.itemId,
        categoryId: model.categoryId,
        lineId: model.lineId,
        modelId: model.id,
        qty: b.qty,
        note: b.note || "",
        unitWeight: model.unitWeight,
      });
    }
    return items;
  }

  function submitFromBasket() {
    const basket = ensureBasketNotExpired();
    if (!basket.items.length) return null;
    const items = basketToOrderItems(basket);
    if (!items.length) return null;

    const orderId = nextOrderId();
    const order = { id: orderId, createdAt: nowIso(), status: "review", items };
    const orders = loadOrders();
    orders.push(order);
    saveOrders(orders);
    clearBasketAll();
    return order;
  }

  function badgeForStatus(status) {
    switch (status) {
      case "review":
        return { cls: "badge review", label: "در حال بررسی" };
      case "approved":
        return { cls: "badge approved", label: "تایید شده" };
      case "sent":
        return { cls: "badge sent", label: "ارسال به کارخانه" };
      case "delivered":
        return { cls: "badge delivered", label: "تحویل شده" };
      case "rejected":
        return { cls: "badge rejected", label: "رد شده" };
      default:
        return { cls: "badge", label: "نامشخص" };
    }
  }

  function renderBasketList() {
    const basket = ensureBasketNotExpired();
    els.basketList.innerHTML = "";
    els.basketEmpty.hidden = basket.items.length !== 0;
    if (!basket.items.length) return;

    for (const item of basket.items) {
      const model = index.modelsById.get(item.modelId);
      const qty = Number(item.qty);
      const okQty = Number.isFinite(qty) && qty > 0;
      const unitW = model ? Number(model.unitWeight || 0) : 0;
      const totalW = okQty ? qty * unitW : 0;

      const box = document.createElement("div");
      box.className = "order";

      const titleRow = document.createElement("div");
      titleRow.className = "row";
      titleRow.innerHTML = `<strong>${escapeHtml(model?.name || "مدل نامعتبر")}</strong><span class="badge secondary">آیتم سبد</span>`;
      box.appendChild(titleRow);

      const catName = model ? index.categoriesById.get(model.categoryId)?.name : "—";
      const lineName = model ? index.linesById.get(model.lineId)?.name : "—";
      const metaRow = document.createElement("div");
      metaRow.className = "row";
      metaRow.innerHTML = `<span>مسیر</span><span>${escapeHtml(catName)} / ${escapeHtml(lineName)}</span>`;
      box.appendChild(metaRow);

      const qtyRow = document.createElement("div");
      qtyRow.className = "row";
      qtyRow.innerHTML = `<span>تعداد</span><span>${okQty ? nfInt.format(qty) : "—"}</span>`;
      box.appendChild(qtyRow);

      const wRow = document.createElement("div");
      wRow.className = "row";
      wRow.innerHTML = `<span>وزن تقریبی کل (گرم)</span><span>${nfWeight.format(totalW)}</span>`;
      box.appendChild(wRow);

      if (item.note) {
        const noteRow = document.createElement("div");
        noteRow.className = "row";
        noteRow.innerHTML = `<span>توضیحات</span><span>${escapeHtml(item.note)}</span>`;
        box.appendChild(noteRow);
      }

      const act = document.createElement("div");
      act.className = "actions";

      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "badge";
      editBtn.textContent = "ویرایش";
      editBtn.addEventListener("click", () => {
        if (!model) return;
        state.selectedCategoryId = model.categoryId;
        state.selectedLineId = model.lineId;
        state.selectedModelId = model.id;
        state.editingItemId = item.itemId;
        prepareDetailForModel(model.id);
        els.qty.value = nfInt.format(item.qty);
        els.note.value = item.note || "";
        updateComputedWeight();
        updateQtyValidation();
        setStep("detail");
        flash("در حال ویرایش آیتم سبد هستید. پس از اعمال تغییرات، «افزودن به سبد» را بزنید.");
      });

      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "badge danger";
      delBtn.textContent = "حذف";
      delBtn.addEventListener("click", () => {
        const ok = window.confirm("این آیتم از سبد حذف شود؟");
        if (!ok) return;
        removeBasketItem(item.itemId);
        render();
      });

      act.appendChild(editBtn);
      act.appendChild(delBtn);
      box.appendChild(act);
      els.basketList.appendChild(box);
    }
  }

  function renderConfirm() {
    const basket = ensureBasketNotExpired();
    const { totalCount, totalWeight } = computeTotals(basket);
    els.confirmSummary.innerHTML =
      `جمع آیتم‌ها: <strong>${nfInt.format(basket.items.length)}</strong><br>` +
      `جمع تعداد: <strong>${nfInt.format(totalCount)}</strong><br>` +
      `جمع وزن تقریبی: <strong>${nfWeight.format(totalWeight)}</strong> گرم`;
    els.submitOrder.disabled = !els.confirmCheck.checked || basket.items.length === 0;
  }

  function renderOrders() {
    const orders = loadOrders();
    const filter = els.ordersFilter.value;
    const sort = els.ordersSort.value;

    let items = [...orders];
    if (filter !== "all") items = items.filter((o) => o.status === filter);
    items.sort((a, b) => {
      const ta = Date.parse(a.createdAt);
      const tb = Date.parse(b.createdAt);
      const av = Number.isFinite(ta) ? ta : 0;
      const bv = Number.isFinite(tb) ? tb : 0;
      return sort === "old" ? av - bv : bv - av;
    });

    els.ordersList.innerHTML = "";
    if (!items.length) {
      const empty = document.createElement("div");
      empty.className = "notice";
      empty.innerHTML = "<strong>سفارشی ثبت نشده است.</strong> پس از ثبت درخواست، اینجا نمایش داده می‌شود.";
      els.ordersList.appendChild(empty);
      return;
    }

    for (const order of items) {
      const b = badgeForStatus(order.status);
      const box = document.createElement("div");
      box.className = "order";

      const head = document.createElement("div");
      head.className = "row";
      head.innerHTML = `<strong>#${escapeHtml(order.id)}</strong><span class="${b.cls}">${b.label}</span>`;
      box.appendChild(head);

      const d = new Date(order.createdAt);
      const dateText = Number.isFinite(d.getTime()) ? d.toLocaleString("fa-IR") : "—";
      const dateRow = document.createElement("div");
      dateRow.className = "row";
      dateRow.innerHTML = `<span>تاریخ ثبت</span><span>${escapeHtml(dateText)}</span>`;
      box.appendChild(dateRow);

      const count = order.items.reduce((s, x) => s + (Number(x.qty) || 0), 0);
      const weight = order.items.reduce((s, x) => s + (Number(x.qty) || 0) * (Number(x.unitWeight) || 0), 0);
      const sumRow = document.createElement("div");
      sumRow.className = "row";
      sumRow.innerHTML = `<span>جمع</span><span>${nfInt.format(count)} عدد / ${nfWeight.format(weight)} گرم</span>`;
      box.appendChild(sumRow);

      for (const it of order.items) {
        const model = index.modelsById.get(it.modelId);
        const itemRow = document.createElement("div");
        itemRow.className = "row";
        itemRow.innerHTML = `<span>${escapeHtml(model?.name || "مدل")}</span><span>${nfInt.format(Number(it.qty) || 0)} عدد</span>`;
        box.appendChild(itemRow);
      }

      els.ordersList.appendChild(box);
    }
  }

  function render() {
    renderBreadcrumb();
    renderBasketKpis();
    if (state.step === "category") renderCategoryGrid();
    if (state.step === "list") {
      renderLineSelect();
      renderModelGrid();
    }
    if (state.step === "detail" && state.selectedModelId) {
      prepareDetailForModel(state.selectedModelId);
      if (state.editingItemId) {
        const basket = ensureBasketNotExpired();
        const item = basket.items.find((x) => x.itemId === state.editingItemId);
        if (item) {
          els.qty.value = nfInt.format(item.qty);
          els.note.value = item.note || "";
          updateComputedWeight();
          updateQtyValidation();
        }
      }
    }
    if (state.step === "basket") renderBasketList();
    if (state.step === "confirm") renderConfirm();
    renderOrders();
  }

  // Events
  els.goBasket.addEventListener("click", () => setStep("basket"));
  els.backToCategory.addEventListener("click", () => setStep("category"));
  els.toBasketFromList.addEventListener("click", () => setStep("basket"));
  els.backToList.addEventListener("click", () => setStep("list"));
  els.backToFlow.addEventListener("click", () => setStep("list"));
  els.toConfirm.addEventListener("click", () => setStep("confirm"));
  els.backToBasket.addEventListener("click", () => setStep("basket"));

  els.lineSelect.addEventListener("change", () => {
    state.selectedLineId = els.lineSelect.value;
    state.selectedModelId = null;
    state.editingItemId = null;
    renderModelGrid();
    renderBreadcrumb();
  });

  els.qty.addEventListener("input", () => {
    updateComputedWeight();
    updateQtyValidation();
  });

  els.addToBasket.addEventListener("click", () => {
    const modelId = state.selectedModelId;
    const model = modelId ? index.modelsById.get(modelId) : null;
    if (!model) return;
    if (!updateQtyValidation()) return;

    const qty = readQtyValue();
    if (!qty) return;
    const note = String(els.note.value || "").trim();
    const itemId = state.editingItemId;

    upsertBasketItem({ modelId: model.id, qty, note, itemId });
    state.editingItemId = null;
    flash(itemId ? "آیتم سبد به‌روزرسانی شد." : "به سبد اضافه شد.");
    setStep("basket");
  });

  els.clearBasket.addEventListener("click", () => {
    const ok = window.confirm("سبد به‌طور کامل پاک شود؟");
    if (!ok) return;
    clearBasketAll();
    render();
    flash("سبد پاک شد.");
  });

  els.confirmCheck.addEventListener("change", () => renderConfirm());

  els.submitOrder.addEventListener("click", () => {
    if (els.submitOrder.disabled) return;
    const ok = window.confirm("ثبت درخواست انجام شود؟");
    if (!ok) return;

    const order = submitFromBasket();
    if (!order) {
      flash("سبد خالی است یا آیتم معتبر ندارد.");
      setStep("basket");
      return;
    }

    els.confirmCheck.checked = false;
    flash(`درخواست شما با شماره #${order.id} ثبت شد.`);
    setStep("category");
    renderOrders();
    document.getElementById("orders")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  els.ordersFilter.addEventListener("change", () => renderOrders());
  els.ordersSort.addEventListener("change", () => renderOrders());

  // Init
  state.isAdmin = readRole() === "admin";
  const initialBasket = ensureBasketNotExpired();
  if (initialBasket.items.length) flash("سبد شما از قبل موجود است. می‌توانید ادامه دهید.");
  setStep("category");
})();
