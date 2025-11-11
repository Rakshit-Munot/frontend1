"use client";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useAuth } from "../AuthContext";
import ViewItemModal from "./components/modals/ViewItemModal";
import EditItemModal from "./components/modals/EditItemModal";
import DeleteItemModal from "./components/modals/DeleteItemModal";
import IssueRequestModal from "./components/modals/IssueRequestModal";
import AddNewModal from "./components/modals/AddNewModal";
import CartModal, { CartLine } from "./components/modals/CartModal";
import AdminApproveModal from "./components/modals/AdminApproveModal";
import AdminRejectModal from "./components/modals/AdminRejectModal";
import StudentRequestsModal from "./components/modals/StudentRequestsModal";
import BulkApproveModal from "./components/modals/BulkApproveModal";
import BulkRejectModal from "./components/modals/BulkRejectModal";
import { Category, Subcategory, Instrument, IssueRequest, UserRole, PAGE_SIZE, availableForItem as sharedAvailable } from "./components/types";
import { FiShoppingCart } from "react-icons/fi";

const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/instruments`;

export default function InstrumentsPage() {
  const { user } = useAuth();
  const role: UserRole = user?.role ?? null;

  // Core data
  const [categories, setCategories] = useState<Category[]>([]);
  const [subByCat, setSubByCat] = useState<Record<number, Subcategory[]>>({});
  // FIX: Removed unused 'loading' state
  const [error, setError] = useState("");

  // Requests (admin)
  const [requests, setRequests] = useState<IssueRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [reqSearch, setReqSearch] = useState("");
  const [page, setPage] = useState(1);
  // FIX: Removed unused 'processingId' and 'setProcessingId'
  const [selectedReqIds, setSelectedReqIds] = useState<Set<number>>(new Set());
  // FIX: Removed unused 'toggleReqSelection'
  const clearSelection = () => setSelectedReqIds(new Set());
  // FIX: Removed unused 'allSelectedOnPage'
  // const allSelectedOnPage = (arr: IssueRequest[]) => arr.length > 0 && arr.every((r) => selectedReqIds.has(r.id));
  // FIX: Removed unused 'toggleSelectPage'
  const [bulkApproveOpen, setBulkApproveOpen] = useState(false);
  const [bulkRejectOpen, setBulkRejectOpen] = useState(false);
  const [requestsStatus, setRequestsStatus] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  // FIX: Removed unused 'approveAllPendingOpen'
  // Admin student list sort
  const [studentSort, setStudentSort] = useState<"roll" | "newest">("newest");
  // Admin: student requests modal
  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [studentModalUser, setStudentModalUser] = useState<{ id: number; name?: string; email?: string } | null>(null);
  const [studentModalStatus, setStudentModalStatus] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [studentModalLoading, setStudentModalLoading] = useState(false);
  const [studentModalRequests, setStudentModalRequests] = useState<IssueRequest[]>([]);

  const openStudentRequests = async (user: { id: number; name?: string; email?: string }) => {
    setStudentModalUser(user);
    setStudentModalStatus(requestsStatus);
    setStudentModalOpen(true);
    setStudentModalLoading(true);
    try {
      const q = requestsStatus === "all" ? "" : `?status=${requestsStatus}`;
      const url = `${API_URL}/issue-requests/${q}${q ? "&" : "?"}scope=all`;
      const r = await fetch(url, { credentials: "include" });
      const d: IssueRequest[] = await r.json();
      const list = (Array.isArray(d) ? d : []).filter((x) => x.user?.id === user.id || x.user_id === user.id);
      setStudentModalRequests(list);
    } catch {
      setStudentModalRequests([]);
    } finally {
      setStudentModalLoading(false);
    }
  };

  // Browse state
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  const [categorySearch, setCategorySearch] = useState("");
  const [catPage, setCatPage] = useState(1);
  const [subcategorySearches, setSubcategorySearches] = useState<Record<number, string>>({});
  const [subPages, setSubPages] = useState<Record<number, number>>({});
  const [activeSubcategory, setActiveSubcategory] = useState<number | null>(null);
  const [itemsBySub, setItemsBySub] = useState<Record<number, Instrument[]>>({});
  const [itemsLoading, setItemsLoading] = useState(false);
  const [itemSearch, setItemSearch] = useState("");
  const [itemsPage, setItemsPage] = useState(1);

  // UI/Modals
  const [successMessage, setSuccessMessage] = useState("");
  const [issueError, setIssueError] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [showBrowse, setShowBrowse] = useState(false);

  // Item modals
  const [selectedItem, setSelectedItem] = useState<Instrument | null>(null);
  const [showView, setShowView] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [editData, setEditData] = useState<Partial<Instrument>>({});

  const [showIssue, setShowIssue] = useState(false);
  const [issueItem, setIssueItem] = useState<Instrument | null>(null);
  const [issueQty, setIssueQty] = useState("");
  // Admin: instrument sorting in inventory
  const [itemSort, setItemSort] = useState<"available" | "name" | "qty_desc" | "qty_asc">("available");

  // Cart (student)
  const [cartOpen, setCartOpen] = useState(false);
  const [cartLines, setCartLines] = useState<CartLine[]>([]);
  const [cartError, setCartError] = useState("");

  // Admin modals per-request approve/reject
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [activeAdminReq, setActiveAdminReq] = useState<IssueRequest | null>(null);
  // Modal-local busy flags to avoid cross-modal blocking
  const [approveSubmitting, setApproveSubmitting] = useState(false);
  const [rejectSubmitting, setRejectSubmitting] = useState(false);
  const [bulkApproveSubmitting, setBulkApproveSubmitting] = useState(false);
  const [bulkRejectSubmitting, setBulkRejectSubmitting] = useState(false);

  // Add New
  const [showAdd, setShowAdd] = useState(false);
  const [addTab, setAddTab] = useState<"category" | "subcategory" | "item">("category");
  const [newCatName, setNewCatName] = useState("");
  const [newSubName, setNewSubName] = useState("");
  const [newSubCatId, setNewSubCatId] = useState<number | null>(null);
  const [newItemCatId, setNewItemCatId] = useState<number | null>(null);
  const [newItemSubId, setNewItemSubId] = useState<number | null>(null);
  const [newItemName, setNewItemName] = useState("");
  const [newItemQty, setNewItemQty] = useState<number>(1);
  const [newItemConsumable, setNewItemConsumable] = useState<boolean>(true);
  const [newItemLocation, setNewItemLocation] = useState("");
  const [newItemMin, setNewItemMin] = useState<number>(1);
  const [newItemMax, setNewItemMax] = useState<number>(1);
  const [newItemDesc, setNewItemDesc] = useState("");
  const [newItemAvailable, setNewItemAvailable] = useState<boolean>(true);
  const [addError, setAddError] = useState("");

  // Inline edit for Category/Subcategory
  const [editingCatId, setEditingCatId] = useState<number | null>(null);
  const [editingCatName, setEditingCatName] = useState("");
  const [editingSub, setEditingSub] = useState<{ id: number; category_id: number } | null>(null);
  const [editingSubName, setEditingSubName] = useState("");

  // Initial load
  useEffect(() => {
    const load = async () => {
      try {
        // setLoading(true); // Removed as 'loading' is not used
        const res = await fetch(`${API_URL}/categories`, { credentials: "include" });
        if (!res.ok) throw new Error("Failed to load categories");
        const cats: Category[] = await res.json();
        setCategories(cats);
        const byCat: Record<number, Subcategory[]> = {};
        for (const c of cats) {
          const sres = await fetch(`${API_URL}/subcategories?category_id=${c.id}`, { credentials: "include" });
          byCat[c.id] = sres.ok ? await sres.json() : [];
        }
        setSubByCat(byCat);
      } catch (e: unknown) { // FIX: Changed 'any' to 'unknown'
        // FIX: Added type check for Error
        if (e instanceof Error) {
          setError(e.message ?? "Could not fetch data");
        } else {
          setError("Could not fetch data");
        }
      } finally {
        // setLoading(false); // Removed as 'loading' is not used
      }
    };
    load();
  }, []);

  // Load pending requests for admin
  useEffect(() => {
    if (user?.role === "admin" || user?.role === "faculty") {
      setRequestsLoading(true);
      const q = requestsStatus === "all" ? "" : `?status=${requestsStatus}`;
      const url = `${API_URL}/issue-requests/${q}${q ? "&" : "?"}scope=all`;
      fetch(url, { credentials: "include" })
        .then((r) => r.json())
        .then((d) => setRequests(Array.isArray(d) ? d : []))
        .catch(() => setRequests([]))
        .finally(() => setRequestsLoading(false));
    }
  }, [user, requestsStatus]);

  // Real-time: listen to streams and refetch lists on updates
  const [issueWsTick, setIssueWsTick] = useState(0);

  // Avoid socket reconnects on simple UI state changes by tracking latest values in refs
  const activeSubRef = useRef<number | null>(null);
  useEffect(() => { activeSubRef.current = activeSubcategory ?? null; }, [activeSubcategory]);
  const requestsStatusRef = useRef(requestsStatus);
  useEffect(() => { requestsStatusRef.current = requestsStatus; }, [requestsStatus]);

  useEffect(() => {
    if (!user) return;
    // WebSocket base from backend API URL when available
    let wsBase = '';
    try {
      const api = process.env.NEXT_PUBLIC_API_URL as string | undefined;
      if (api) {
        const u = new URL(api);
        const scheme = u.protocol === 'https:' ? 'wss' : 'ws';
        wsBase = `${scheme}://${u.host}`;
      } else if (typeof window !== 'undefined') {
        const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
        wsBase = `${proto}://${window.location.host}`;
      }
    } catch {
      if (typeof window !== 'undefined') {
        const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
        wsBase = `${proto}://${window.location.host}`;
      }
    }

    const issueWS = new WebSocket(`${wsBase}/ws/issue-requests/`);
    const instrWS = new WebSocket(`${wsBase}/ws/instruments/`);

    const refetchAdminRequests = () => {
      const status = requestsStatusRef.current;
      const q = status === "all" ? "" : `?status=${status}`;
      const url = `${API_URL}/issue-requests/${q}${q ? "&" : "?"}scope=all`;
      fetch(url, { credentials: "include" })
        .then((r) => r.json())
        .then((d) => setRequests(Array.isArray(d) ? d : []))
        .catch(() => {});
    };
    const refetchStudentPending = () => {
      fetch(`${API_URL}/issue-requests/?status=pending`, { credentials: "include" })
        .then((r) => r.json())
        .then((d) => setMyRequests(Array.isArray(d) ? d : []))
        .catch(() => {});
    };

    issueWS.onmessage = () => {
      if (user.role === 'admin' || user.role === 'faculty') refetchAdminRequests();
      if (user.role === 'student') refetchStudentPending();
      setIssueWsTick((x) => x + 1);
    };

    instrWS.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        const { event, payload } = msg || {};
        if (!event) return;
        if (event === 'item.updated' || event === 'item.created') {
          const sid = (payload as { sub_category_id?: number })?.sub_category_id ?? activeSubRef.current;
          if (sid) {
            fetch(`${API_URL}/items?subcategory=${sid}`, { credentials: 'include' })
              .then((r) => r.json())
              .then((data: Instrument[]) => setItemsBySub((p) => ({ ...p, [sid]: data })))
              .catch(() => {});
          }
        } else if (event === 'item.deleted') {
          const sid = (payload as { sub_category_id?: number })?.sub_category_id;
          if (sid) setItemsBySub((prev) => ({ ...prev, [sid]: (prev[sid] || []).filter((it) => it.id !== (payload as { id: number }).id) }));
        } else if (event === 'category.updated' || event === 'category.deleted') {
          // Refresh categories list and impacted subcategories
          fetch(`${API_URL}/categories`, { credentials: 'include' })
            .then((r) => r.json())
            .then((data: Category[]) => setCategories(data))
            .catch(() => {});
          // best-effort: if deleted, remove from local maps
          if (event === 'category.deleted' && (payload as { id?: number })?.id) {
            setSubByCat((prev) => {
              const next = { ...prev } as Record<number, Subcategory[]>;
              delete next[(payload as { id: number }).id as number];
              return next;
            });
          }
        } else if (event === 'subcategory.updated' || event === 'subcategory.deleted') {
          const catId = (payload as { category_id?: number })?.category_id;
          if (catId) {
            fetch(`${API_URL}/subcategories?category_id=${catId}`, { credentials: 'include' })
              .then((r) => r.json())
              .then((data: Subcategory[]) => setSubByCat((p) => ({ ...p, [catId]: data })))
              .catch(() => {});
          }
        }
      } catch {
        // ignore bad messages
      }
    };

    const sockets = [issueWS, instrWS];
    return () => { sockets.forEach((s) => { try { s.close(); } catch {} }); };
  }, [user]);

  // Load my pending requests for student (assumes API scopes to current user)
  const [myRequests, setMyRequests] = useState<IssueRequest[]>([]);
  const [myReqLoading, setMyReqLoading] = useState(false);
  useEffect(() => {
    if (user?.role === "student") {
      setMyReqLoading(true);
      fetch(`${API_URL}/issue-requests/?status=pending`, { credentials: "include" })
        .then((r) => r.json())
        .then((d) => setMyRequests(Array.isArray(d) ? d : []))
        .catch(() => setMyRequests([]))
        .finally(() => setMyReqLoading(false));
    }
  }, [user]);

  // Auto-dismiss success toasts
  useEffect(() => {
    if (!successMessage) return;
    const t = setTimeout(() => setSuccessMessage(""), 3500);
    return () => clearTimeout(t);
  }, [successMessage]);

  // Derived
  const filteredCategories = useMemo(
    () => categories.filter((c) => c.name.toLowerCase().includes(categorySearch.toLowerCase())),
    [categories, categorySearch]
  );
  const catTotalPages = Math.ceil(filteredCategories.length / PAGE_SIZE) || 1;
  const paginatedCategories = filteredCategories.slice((catPage - 1) * PAGE_SIZE, catPage * PAGE_SIZE);

  const getFilteredSubcategories = (categoryId: number) => {
    const list = subByCat[categoryId] || [];
    const term = subcategorySearches[categoryId] || "";
    return list.filter((s) => s.name.toLowerCase().includes(term.toLowerCase()));
  };
  const getPaginatedSubcategories = (categoryId: number) => {
    const list = getFilteredSubcategories(categoryId);
    const page = subPages[categoryId] || 1;
    const total = Math.ceil(list.length / PAGE_SIZE) || 1;
    const sliced = list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    return { list: sliced, total, page };
  };

  // Items for active subcategory
  useEffect(() => {
    if (activeSubcategory && !itemsBySub[activeSubcategory]) {
      setItemsLoading(true);
      fetch(`${API_URL}/items?subcategory=${activeSubcategory}`, { credentials: "include" })
        .then((r) => r.json())
        .then((data: Instrument[]) => setItemsBySub((p) => ({ ...p, [activeSubcategory]: data })))
        .catch(() => setItemsBySub((p) => ({ ...p, [activeSubcategory]: [] })))
        .finally(() => setItemsLoading(false));
    }
  }, [activeSubcategory, itemsBySub]);

  // Admin/Faculty: group requests by student for display
  const groupedStudents = useMemo(() => {
    const map = new Map<number, { id: number; name?: string; email?: string; count: number; newestAt?: string; lastRemark?: string; lastApprovedAt?: string; lastReturnBy?: string | null }>();
    for (const r of requests) {
      const id = (r.user?.id as number | undefined) ?? (r.user_id as number | undefined);
      if (!id) continue;
      const name = r.user?.name;
      const email = r.user?.email;
      if (!map.has(id)) map.set(id, { id, name, email, count: 0, newestAt: r.created_at, lastRemark: r.remarks, lastApprovedAt: r.approved_at || undefined, lastReturnBy: r.return_by ?? null });
      const entry = map.get(id)!;
      entry.name = entry.name ?? name;
      entry.email = entry.email ?? email;
      entry.count += 1;
      // track newest created_at
      if (!entry.newestAt || (r.created_at && r.created_at > entry.newestAt)) entry.newestAt = r.created_at;
      // keep latest remark/approved/return_by by created_at order (newest overrides)
      if (r.created_at && entry.newestAt && r.created_at >= entry.newestAt) {
        entry.lastRemark = r.remarks ?? entry.lastRemark;
        if (r.approved_at) entry.lastApprovedAt = r.approved_at;
        if (typeof r.return_by !== 'undefined') entry.lastReturnBy = r.return_by ?? null;
      }
    }
    // FIX: Changed 'let' to 'const'
    const arr = Array.from(map.values());
    if (studentSort === "roll") {
      arr.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    } else {
      arr.sort((a, b) => (b.newestAt || "").localeCompare(a.newestAt || ""));
    }
    return arr;
  }, [requests, studentSort]);

  // Filter students by roll/email
  const filteredStudents = groupedStudents.filter((s) => {
    const roll = s.name || "";
    const email = s.email || "";
    const q = reqSearch.toLowerCase();
    return roll.toLowerCase().includes(q) || email.toLowerCase().includes(q);
  });
  const totalPages = Math.ceil(filteredStudents.length / PAGE_SIZE) || 1;
  const paginatedStudents = filteredStudents.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Helpers
  const availableForItem = (item: Instrument) => sharedAvailable(item);
  const isItemAvailable = (item: Instrument) => availableForItem(item) > 0;
  const availability = (item: Instrument) => {
    const qty = availableForItem(item);
    if (qty === 0) return { text: "Not Available", dot: "bg-red-500", textColor: "text-red-600", chip: "bg-red-50 ring-red-200" };
    if (qty <= 5) return { text: "Low Stock", dot: "bg-red-500", textColor: "text-red-700", chip: "bg-red-50 ring-red-200" };
    return { text: "Available", dot: "bg-emerald-500", textColor: "text-emerald-600", chip: "bg-emerald-50 ring-emerald-200" };
  };
  const onSelectSub = (subcategoryId: number) => {
    setActiveSubcategory(subcategoryId);
    setItemSearch("");
    setItemsPage(1);
    setShowBrowse(false);
  };

  // Cart helpers
  const cartCount = cartLines.length;
  const addToCart = (item: Instrument) => {
    setCartError("");
    setCartLines((prev) => {
      const idx = prev.findIndex((l) => l.item.id === item.id);
      if (idx >= 0) {
        const existing = prev[idx];
        const newQty = Math.min(existing.item.max_issue_limit, (existing.qty || 0) + 1, availableForItem(item));
        const next = [...prev];
        next[idx] = { ...existing, qty: Math.max(item.min_issue_limit, newQty) };
        return next;
      }
      const startQty = Math.min(item.max_issue_limit, Math.max(item.min_issue_limit, 1), availableForItem(item));
      return [...prev, { item, qty: startQty }];
    });
  };
  const updateCartQty = (itemId: number, qty: number) => {
    setCartLines((prev) => prev.map((l) => (l.item.id === itemId ? { ...l, qty: Math.max(l.item.min_issue_limit, Math.min(l.item.max_issue_limit, Math.min(qty, availableForItem(l.item)))) } : l)));
  };
  const removeFromCart = (itemId: number) => setCartLines((prev) => prev.filter((l) => l.item.id !== itemId));
  
  // Background revalidate: refresh the currently active subcategory quietly
  const refetchActiveSubcategory = useCallback(async () => {
    if (!activeSubcategory) return;
    try {
      const r = await fetch(`${API_URL}/items?subcategory=${activeSubcategory}`, { credentials: "include" });
      if (r.ok) {
        const data: Instrument[] = await r.json();
        setItemsBySub((p) => ({ ...p, [activeSubcategory]: data }));
      }
    } catch {
      // ignore background failures
    }
  }, [activeSubcategory]); // Added dependency

  const submitCart = async () => {
    if (cartLines.length === 0) return;
    setCartError("");
    setIsBusy(true);
    try {
      // Validate before sending
      for (const line of cartLines) {
        const avail = availableForItem(line.item);
        if (line.qty < line.item.min_issue_limit || line.qty > line.item.max_issue_limit || line.qty > avail) {
          throw new Error(`Invalid qty for ${line.item.name}`);
        }
      }

      // Optimistic: close cart and clear lines immediately
      const lines = [...cartLines];
      setCartLines([]);
      setCartOpen(false);

      // Optimistic: decrement available quantities in the grid
      setItemsBySub((prev) => {
        const next: Record<number, Instrument[]> = { ...prev };
        for (const key of Object.keys(next)) {
          const k = Number(key);
          next[k] = (next[k] || []).map((it) => {
            const hit = lines.find((ln) => ln.item.id === it.id);
            if (!hit) return it;
            const reduceBy = hit.qty;
            if (it.is_consumable) {
              return { ...it, quantity: Math.max(0, (it.quantity || 0) - reduceBy) } as Instrument;
            } else {
              const base = (it.available_quantity ?? it.quantity) || 0;
              return { ...it, available_quantity: Math.max(0, base - reduceBy) } as Instrument;
            }
          });
        }
        return next;
      });

      // Optimistic: add placeholders in student's pending list
      if (user?.role === "student") {
        const now = new Date().toISOString();
        const placeholders: IssueRequest[] = lines.map((ln, i) => ({
          id: -Date.now() - i,
          item: { id: ln.item.id, name: ln.item.name },
          user_id: (user as { id?: number })?.id ?? 0, // FIX: 'any' to '{ id?: number }'
          quantity: ln.qty,
          status: "pending",
          created_at: now,
          // no remark for student-created pending placeholders
        }));
        setMyRequests((arr) => [...placeholders, ...arr]);
      }

      // Send requests sequentially (backend can be slow; UI already updated)
      for (const line of lines) {
        const res = await fetch(`${API_URL}/issue-requests/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ item_id: line.item.id, quantity: line.qty }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          // FIX: 'any' to '{ detail?: string }'
          throw new Error((data as { detail?: string }).detail || `Failed to request ${line.item.name}`);
        }
      }

      // Quiet background refresh to reconcile any drift
      setTimeout(() => { refetchActiveSubcategory(); }, 1200);
      if (user?.role === "student") {
        setMyReqLoading(true);
        fetch(`${API_URL}/issue-requests/?status=pending`, { credentials: "include" })
          .then((r) => r.json())
          .then((d) => setMyRequests(Array.isArray(d) ? d : []))
          .catch(() => setMyRequests([]))
          .finally(() => setMyReqLoading(false));
      }
    } catch (e: unknown) { // FIX: 'any' to 'unknown'
      // FIX: Added type check for Error
      if (e instanceof Error) {
        setCartError(e.message || "Failed to submit requests");
      } else {
        setCartError("Failed to submit requests");
      }
      // Best-effort reconciliation on error
      setTimeout(() => { refetchActiveSubcategory(); }, 1200);
    } finally {
      setIsBusy(false);
    }
  };


  // Optimistic helpers
  const patchItemEverywhere = (itemId: number, patch: Partial<Instrument>) => {
    setItemsBySub((prev) => {
      const next: Record<number, Instrument[]> = { ...prev };
      for (const key of Object.keys(next)) {
        const k = Number(key);
        next[k] = (next[k] || []).map((it) => (it.id === itemId ? { ...it, ...patch } : it));
      }
      return next;
    });
  };

  const removeItemEverywhere = (itemId: number) => {
    setItemsBySub((prev) => {
      const next: Record<number, Instrument[]> = { ...prev };
      for (const key of Object.keys(next)) {
        const k = Number(key);
        next[k] = (next[k] || []).filter((it) => it.id !== itemId);
      }
      return next;
    });
  };

  // Inline edit handlers (Category)
  const startEditCategory = (cat: Category) => {
    setEditingCatId(cat.id);
    setEditingCatName(cat.name);
  };
  const cancelEditCategory = () => {
    setEditingCatId(null);
    setEditingCatName("");
  };
  const saveEditCategory = async () => {
    const id = editingCatId;
    const name = editingCatName.trim();
    if (!id || !name) return cancelEditCategory();
    // Optimistic update
    const prevCats = categories;
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, name } : c)));
    cancelEditCategory();
    try {
      setIsBusy(true);
      const res = await fetch(`${API_URL}/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name }),
      });
      const data = await res.json().catch(() => ({}));
      // FIX: 'any' to '{ detail?: string }'
      if (!res.ok) throw new Error((data as { detail?: string }).detail || "Failed to update category");
      setSuccessMessage(`Category renamed to "${name}"`);
    } catch (e: unknown) { // FIX: 'any' to 'unknown'
      // Revert on error
      setCategories(prevCats);
      // FIX: Added type check for Error
      if (e instanceof Error) {
        alert(e.message || "Failed to update category");
      } else {
        alert("Failed to update category");
      }
    } finally {
      setIsBusy(false);
    }
  };

  // Inline edit handlers (Subcategory)
  const startEditSubcategory = (sub: Subcategory) => {
    setEditingSub({ id: sub.id, category_id: sub.category_id });
    setEditingSubName(sub.name);
  };
  const cancelEditSubcategory = () => {
    setEditingSub(null);
    setEditingSubName("");
  };
  const saveEditSubcategory = async () => {
    if (!editingSub) return;
    const id = editingSub.id;
    const catId = editingSub.category_id;
    const name = editingSubName.trim();
    if (!name) return cancelEditSubcategory();
    // Optimistic update
    const prevSubsForCat = (subByCat[catId] || []).slice();
    setSubByCat((prev) => ({
      ...prev,
      [catId]: (prev[catId] || []).map((s) => (s.id === id ? { ...s, name } : s)),
    }));
    cancelEditSubcategory();
    try {
      setIsBusy(true);
      const res = await fetch(`${API_URL}/subcategories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name }),
      });
      const data = await res.json().catch(() => ({}));
      // FIX: 'any' to '{ detail?: string }'
      if (!res.ok) throw new Error((data as { detail?: string }).detail || "Failed to update subcategory");
      setSuccessMessage(`Subcategory renamed to "${name}"`);
    } catch (e: unknown) { // FIX: 'any' to 'unknown'
      // Revert on error
      setSubByCat((prev) => ({ ...prev, [catId]: prevSubsForCat }));
      // FIX: Added type check for Error
      if (e instanceof Error) {
        alert(e.message || "Failed to update subcategory");
      } else {
        alert("Failed to update subcategory");
      }
    } finally {
      setIsBusy(false);
    }
  };

  // Delete handlers (Category/Subcategory)
  const deleteCategory = async (categoryId: number) => {
    if (!confirm("Delete this category?")) return;
    try {
      setIsBusy(true);
      const res = await fetch(`${API_URL}/categories/${categoryId}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        // FIX: 'any' to '{ detail?: string }'
        throw new Error((data as { detail?: string }).detail || "Failed to delete category");
      }
      setCategories((prev) => prev.filter((c) => c.id !== categoryId));
      setSubByCat((prev) => {
        const next = { ...prev } as Record<number, Subcategory[]>;
        delete next[categoryId];
        return next;
      });
      // If active subcategory belonged to this category, clear it
      const subs = subByCat[categoryId] || [];
      if (subs.some((s) => s.id === activeSubcategory)) {
        setActiveSubcategory(null);
      }
      setSuccessMessage("Category deleted");
    } catch (e: unknown) { // FIX: 'any' to 'unknown'
      // FIX: Added type check for Error
      if (e instanceof Error) {
        alert(e.message || "Failed to delete category");
      } else {
        alert("Failed to delete category");
      }
    } finally {
      setIsBusy(false);
    }
  };

  const deleteSubcategory = async (subcategoryId: number, categoryId: number) => {
    if (!confirm("Delete this subcategory?")) return;
    try {
      setIsBusy(true);
      const res = await fetch(`${API_URL}/subcategories/${subcategoryId}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        // FIX: 'any' to '{ detail?: string }'
        throw new Error((data as { detail?: string }).detail || "Failed to delete subcategory");
      }
      setSubByCat((prev) => ({
        ...prev,
        [categoryId]: (prev[categoryId] || []).filter((s) => s.id !== subcategoryId),
      }));
      if (activeSubcategory === subcategoryId) {
        setActiveSubcategory(null);
      }
      setItemsBySub((prev) => {
        const next = { ...prev } as Record<number, Instrument[]>;
        delete next[subcategoryId];
        return next;
      });
      setSuccessMessage("Subcategory deleted");
    } catch (e: unknown) { // FIX: 'any' to 'unknown'
      // FIX: Added type check for Error
      if (e instanceof Error) {
        alert(e.message || "Failed to delete subcategory");
      } else {
        alert("Failed to delete subcategory");
      }
    } finally {
      setIsBusy(false);
    }
  };

  // Submit handlers
  const submitIssue = async () => {
    if (!issueItem) return;
    const q = Number(issueQty);
    if (!Number.isFinite(q) || q <= 0) return setIssueError("Enter a valid quantity");
    const minQ = issueItem.min_issue_limit || 1;
    const maxQ = issueItem.max_issue_limit || q;
    const avail = availableForItem(issueItem);
    if (q < minQ) return setIssueError(`Minimum issue quantity is ${minQ}`);
    if (q > maxQ) return setIssueError(`Maximum issue quantity is ${maxQ}`);
    if (q > avail) return setIssueError("Requested quantity exceeds available stock");
    try {
      setIsBusy(true);
      // Optimistic: close dialog and decrement stock immediately
      const item = issueItem;
      setShowIssue(false);
      setIssueItem(null);
      setIssueQty("");
      patchItemEverywhere(item.id, item.is_consumable
        ? { quantity: Math.max(0, (item.quantity || 0) - q) }
        : { available_quantity: Math.max(0, ((item.available_quantity ?? item.quantity) || 0) - q) }
      );
      // If student, add a placeholder pending entry
      if (user?.role === "student") {
        const now = new Date().toISOString();
        const ph: IssueRequest = {
          id: -Date.now(),
          item: { id: item.id, name: item.name },
          user_id: (user as { id?: number })?.id ?? 0, // FIX: 'any' to '{ id?: number }'
          quantity: q,
          status: "pending",
          created_at: now,
          // no remark for student-created pending placeholder
        };
        setMyRequests((arr) => [ph, ...arr]);
      }

      const res = await fetch(`${API_URL}/issue-requests/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ item_id: issueItem.id, quantity: q }), // FIX: issueItem.id was used instead of item.id
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        // FIX: 'any' to '{ detail?: string }'
        throw new Error((data as { detail?: string }).detail || "Failed to send request");
      }
      // Quiet reconcile
      setTimeout(() => { refetchActiveSubcategory(); }, 1200);
    } catch (e: unknown) { // FIX: 'any' to 'unknown'
      // FIX: Added type check for Error
      if (e instanceof Error) {
        setIssueError(e.message || "Failed to send request");
      } else {
        setIssueError("Failed to send request");
      }
      // Best-effort reconcile on failure
      setTimeout(() => { refetchActiveSubcategory(); }, 1200);
    } finally {
      setIsBusy(false);
    }
  };

  const submitEdit = async () => {
    if (!selectedItem) return;
    // Build payload and do optimistic update first
    try {
      setIsBusy(true);
      const name = (editData.name ?? selectedItem.name).trim();
      if (!name) throw new Error("Name is required.");

      // Safe resolve IDs even if nested objects are missing
      const categoryId =
        (editData as { category_id?: number }).category_id ?? // FIX: 'any' to '{ category_id?: number }'
        editData.category?.id ??
        selectedItem.category_id ??
        selectedItem.category?.id;

      const subCategoryId =
        (editData as { sub_category_id?: number }).sub_category_id ?? // FIX: 'any' to '{ sub_category_id?: number }'
        editData.sub_category?.id ??
        (selectedItem as { sub_category_id?: number }).sub_category_id ?? // FIX: 'any' to '{ sub_category_id?: number }'
        selectedItem.sub_category?.id ??
        null;

      if (!categoryId) throw new Error("Category is missing for this item.");

      let payload = {
        name,
        category_id: Number(categoryId),
        sub_category_id: subCategoryId != null ? Number(subCategoryId) : null,
        quantity: Number(editData.quantity ?? selectedItem.quantity),
        is_consumable: Boolean(editData.is_consumable ?? selectedItem.is_consumable),
        is_available: (editData as { is_available?: boolean }).is_available ?? selectedItem.is_available ?? true, // FIX: 'any' to '{ is_available?: boolean }'
        location: (editData.location ?? selectedItem.location) || "",
        min_issue_limit: Number((editData.min_issue_limit ?? selectedItem.min_issue_limit) ?? 1),
        max_issue_limit: Number(
          editData.max_issue_limit ??
            selectedItem.max_issue_limit ??
            (editData.min_issue_limit ?? selectedItem.min_issue_limit ?? 1)
        ),
        description: (editData.description ?? selectedItem.description) || "",
      };
      if (payload.max_issue_limit < payload.min_issue_limit) {
        payload = { ...payload, max_issue_limit: payload.min_issue_limit };
      }
      // Optimistic UI: patch everywhere immediately
      const optimistic: Partial<Instrument> = {
        name: payload.name,
        quantity: payload.quantity,
        is_consumable: payload.is_consumable,
        is_available: payload.is_available,
        location: payload.location,
        min_issue_limit: payload.min_issue_limit,
        max_issue_limit: payload.max_issue_limit,
        description: payload.description,
      };
      patchItemEverywhere(selectedItem.id, optimistic);
      setShowEdit(false);

      // Fire request; on error revert by refetching that sub or restoring previous item
      const res = await fetch(`${API_URL}/items/${selectedItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        // FIX: 'any' to '{ detail?: string }'
        throw new Error((data as { detail?: string }).detail || "Failed to update item");
      }
      const updated: Instrument = await res.json();
      patchItemEverywhere(updated.id, updated);
      setTimeout(() => { refetchActiveSubcategory(); }, 1500);
      setSuccessMessage(`Updated ${updated.name}`);
    } catch (e: unknown) { // FIX: 'any' to 'unknown'
      // FIX: Added type check for Error
      if (e instanceof Error) {
        setIssueError(e.message || "Failed to update item");
      } else {
        setIssueError("Failed to update item");
      }
    } finally {
      setIsBusy(false);
    }
  };

  const submitDelete = async () => {
    if (!selectedItem) return;
    try {
      setIsBusy(true);
      // Optimistic remove
      const deletedId = selectedItem.id;
      removeItemEverywhere(deletedId);
      setShowDelete(false);
      setSelectedItem(null);

      const res = await fetch(`${API_URL}/items/${deletedId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Delete failed");
      setTimeout(() => { refetchActiveSubcategory(); }, 1500);
      setSuccessMessage("Item deleted");
    } catch (e: unknown) { // FIX: 'any' to 'unknown'
      // FIX: Added type check for Error
      if (e instanceof Error) {
        setIssueError(e.message || "Failed to delete item");
      } else {
        setIssueError("Failed to delete item");
      }
    } finally {
      setIsBusy(false);
    }
  };

  const submitAddCategory = async () => {
    const name = newCatName.trim();
    if (!name) return setAddError("Category name is required");
    try {
      setIsBusy(true);
      setAddError("");
      const res = await fetch(`${API_URL}/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      // FIX: 'any' to '{ detail?: string }'
      if (!res.ok) throw new Error((data as { detail?: string })?.detail || "Failed to create category");
      setCategories((c) => [...c, data]);
      setSubByCat((m) => ({ ...m, [data.id]: [] }));
      setNewCatName("");
      setSuccessMessage(`Category "${(data as { name: string }).name}" created`); // FIX: 'any' to '{ name: string }'
    } catch (e: unknown) { // FIX: 'any' to 'unknown'
      // FIX: Added type check for Error
      if (e instanceof Error) {
        setAddError(e.message || "Failed to create category");
      } else {
        setAddError("Failed to create category");
      }
    } finally {
      setIsBusy(false);
    }
  };

  const submitAddSubcategory = async () => {
    if (!newSubCatId) return setAddError("Select a category");
    const name = newSubName.trim();
    if (!name) return setAddError("Subcategory name is required");
    try {
      setIsBusy(true);
      setAddError("");
      const res = await fetch(`${API_URL}/subcategories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, category_id: newSubCatId }),
      });
      const data = await res.json();
      // FIX: 'any' to '{ detail?: string }'
      if (!res.ok) throw new Error((data as { detail?: string })?.detail || "Failed to create subcategory");
      setSubByCat((m) => ({ ...m, [data.category_id]: [...(m[data.category_id] || []), data] }));
      setNewSubName("");
      setSuccessMessage(`Subcategory "${(data as { name: string }).name}" created`); // FIX: 'any' to '{ name: string }'
    } catch (e: unknown) { // FIX: 'any' to 'unknown'
      // FIX: Added type check for Error
      if (e instanceof Error) {
        setAddError(e.message || "Failed to create subcategory");
      } else {
        setAddError("Failed to create subcategory");
      }
    } finally {
      setIsBusy(false);
    }
  };

  const submitAddItem = async () => {
    const name = newItemName.trim();
    if (!name) return setAddError("Item name is required");
    if (!newItemCatId) return setAddError("Select a category");
    if (newItemMin < 1) return setAddError("Min per issue must be at least 1");
    if (newItemMax < newItemMin) return setAddError("Max per issue must be >= Min");
    // Track optimistic temp so we can revert precisely on failure
    let tempId: number | null = null;
    const sidForOptimistic: number | null = newItemSubId ?? activeSubcategory ?? null;
    try {
      setIsBusy(true);
      setAddError("");
      const payload = {
        category_id: newItemCatId,
        sub_category_id: newItemSubId,
        name,
        quantity: Number(newItemQty),
        is_consumable: Boolean(newItemConsumable),
        is_available: Boolean(newItemAvailable),
        location: newItemLocation || "",
        min_issue_limit: Number(newItemMin),
        max_issue_limit: Number(newItemMax),
        description: newItemDesc || "",
      };
      // Optimistic insert only if targeting a specific subcategory currently visible
      if (sidForOptimistic) {
        tempId = -Date.now();
        const tempItem: Instrument = {
          id: tempId,
          name: payload.name,
          quantity: payload.quantity,
          is_consumable: payload.is_consumable,
          is_available: payload.is_available,
          location: payload.location,
          min_issue_limit: payload.min_issue_limit,
          max_issue_limit: payload.max_issue_limit,
          description: payload.description,
          available_quantity: payload.is_consumable ? payload.quantity : payload.quantity,
          category_id: payload.category_id,
          sub_category_id: sidForOptimistic,
        } as Instrument;
        setItemsBySub((prev) => ({
          ...prev,
          [sidForOptimistic!]: [...(prev[sidForOptimistic!] || []), tempItem],
        }));
      }

      const res = await fetch(`${API_URL}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      // FIX: 'any' to '{ detail?: string }'
      if (!res.ok) throw new Error((data as { detail?: string })?.detail || "Failed to create item");
      // FIX: 'any' to 'Record<string, unknown>'
      const sid = ((data as { sub_category?: { id?: number } }).sub_category?.id ?? (data as { sub_category_id?: number }).sub_category_id ?? newItemSubId ?? activeSubcategory ?? 0);
      if (sid) {
        setItemsBySub((prev) => {
          const list = prev[sid as number] || [];
          // Replace temp by server item if temp exists
          const replaced = tempId ? list.map((x) => (x.id === tempId ? data : x)) : [...list, data];
          return { ...prev, [sid as number]: replaced };
        });
      }
      setNewItemName("");
      setNewItemQty(1);
      setNewItemConsumable(true);
      setNewItemLocation("");
      setNewItemMin(1);
      setNewItemMax(1);
      setNewItemDesc("");
      setNewItemAvailable(true);
      setTimeout(() => { refetchActiveSubcategory(); }, 1500);
      setSuccessMessage(`Item "${(data as { name: string }).name}" created`); // FIX: 'any' to '{ name: string }'
    } catch (e: unknown) { // FIX: 'any' to 'unknown'
      // On failure, remove optimistic temp if present
      if (sidForOptimistic && tempId) {
        const sid = sidForOptimistic;
        setItemsBySub((prev) => ({
          ...prev,
          [sid]: (prev[sid] || []).filter((it) => it.id !== tempId),
        }));
      }
      // FIX: Added type check for Error
      if (e instanceof Error) {
        setAddError(e.message || "Failed to create item");
      } else {
        setAddError("Failed to create item");
      }
    } finally {
      setIsBusy(false);
    }
  };

  // Removed blocking loading spinner to open page instantly
  if (error) {
    return (
      <div className="min-h-screen grid place-items-center bg-gradient-to-b from-slate-50 to-white">
        <div className="dialog-surface-login p-6 max-w-md w-full">
          <p className="text-rose-600 font-medium">Failed to load</p>
          <p className="text-slate-600 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      {/* Topbar */}
      <div className="sticky top-0 z-40 border-b dialog-divider-login bg-white/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden inline-flex items-center rounded-lg border dialog-divider-login px-3 py-2 text-slate-700 hover:bg-slate-50"
              onClick={() => setShowBrowse((s) => !s)}
              aria-label="Toggle browse panel"
            >
              Browse
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-800">Component Management</h1>
              <p className="text-slate-500 text-sm">Browse inventory, request items, and manage stock</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {role === "student" && (
              <button
                onClick={() => setCartOpen(true)}
                className="relative inline-flex items-center justify-center rounded-lg border dialog-divider-login p-2 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                aria-label="Open cart"
                title="Open cart"
              >
                <FiShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[18px] h-4 px-1.5 rounded-full bg-indigo-600 text-white text-[11px] font-medium shadow ring-1 ring-white">
                    {cartCount}
                  </span>
                )}
              </button>
            )}
            {role === "admin" && (
              <button
                onClick={() => setShowAdd(true)}
                className="inline-flex items-center rounded-lg bg-indigo-600 text-white px-4 py-2 font-medium shadow-sm hover:bg-indigo-700 transition-colors cursor-pointer"
              >
                Add
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Toast */}
      {successMessage && (
        <div className="fixed top-5 right-5 z-50">
          <div className="flex items-center gap-2 rounded-xl bg-emerald-500 text-white px-4 py-2 shadow-lg">
            <span className="text-sm">{successMessage}</span>
            <button className="ml-2 text-white/80 hover:text-white" onClick={() => setSuccessMessage("")} aria-label="Dismiss">
              ×
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar / Drawer */}
        <aside
          className={`${showBrowse ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 fixed lg:static inset-y-0 left-0 w-[85%] max-w-sm lg:max-w-none lg:w-auto z-30 lg:z-auto transition-transform duration-300`}
        >
          <div className="dialog-surface-login h-full lg:h-auto overflow-hidden">

            {/* Category search */}
            <div className="p-4 border-b dialog-divider-login">
              <input
                value={categorySearch}
                onChange={(e) => { setCategorySearch(e.target.value); setCatPage(1); }}
                placeholder="Search categories"
                className="w-full px-3 py-2 rounded-lg border dialog-divider-login bg-slate-50 focus:bg-white focus:outline-none"
              />
            </div>

            {/* Category list */}
            <div className="max-h-[60vh] lg:max-h-[520px] overflow-y-auto">
              {paginatedCategories.map((cat) => {
                const expanded = expandedCategories.has(cat.id);
                const { list: subs, total: subsTotalPages, page: subsPage } = getPaginatedSubcategories(cat.id);
                const isEditingCat = editingCatId === cat.id;
                return (
                  <div key={cat.id} className="border-b dialog-divider-login last:border-b-0">
                    <div className="w-full flex items-center justify-between px-4 py-3">
                      <button
                        className="flex items-center justify-between gap-3 flex-1 text-left hover:bg-slate-50 rounded-md px-2 py-1 cursor-pointer"
                        onClick={() => {
                          const next = new Set(expandedCategories);
                          if (expanded) {
                            next.delete(cat.id);
                          } else {
                            next.add(cat.id);
                          }
                          setExpandedCategories(next);
                        }}
                        aria-expanded={expanded}
                      >
                        <div className="text-left">
                          <div className="font-medium text-slate-800 capitalize">{cat.name}</div>
                          <div className="text-xs text-slate-500">{(subByCat[cat.id] || []).length} subcategories</div>
                        </div>
                        <span className="text-slate-500 text-sm">{expanded ? "▲" : "▼"}</span>
                      </button>
                      <div className="ml-2 flex items-center gap-2">
                        {role === "admin" && (
                          <>
                            <button
                              title="Edit category"
                              className="p-1 rounded border dialog-divider-login hover:bg-slate-50 cursor-pointer"
                              onClick={() => startEditCategory(cat)}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" />
                                <path d="M14.06 4.69l3.75 3.75 1.59-1.59a1.5 1.5 0 0 0 0-2.12l-1.63-1.63a1.5 1.5 0 0 0-2.12 0l-1.59 1.59z" />
                              </svg>
                              <span className="sr-only">Edit</span>
                            </button>
                            <button
                              title="Delete category"
                              className="p-1 rounded border dialog-divider-login hover:bg-slate-50 cursor-pointer"
                              onClick={() => deleteCategory(cat.id)}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                                <path d="M3 6h18" />
                                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                <path d="M10 11v6M14 11v6" />
                              </svg>
                              <span className="sr-only">Delete</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Inline edit for category */}
                    {isEditingCat && (
                      <div className="px-4 pb-3">
                        <div className="flex items-center gap-2">
                          <input
                            value={editingCatName}
                            onChange={(e) => setEditingCatName(e.target.value)}
                            className="flex-1 px-3 py-1.5 rounded-md border dialog-divider-login bg-slate-50 focus:bg-white text-sm"
                            placeholder="Category name"
                          />
                          <button
                            className="text-xs px-2 py-1 rounded border dialog-divider-login bg-indigo-600 text-white hover:bg-indigo-700"
                            onClick={saveEditCategory}
                            disabled={isBusy}
                          >
                            OK
                          </button>
                          <button
                            className="text-xs px-2 py-1 rounded border dialog-divider-login hover:bg-slate-50"
                            onClick={cancelEditCategory}
                            disabled={isBusy}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Sub list */}
                    <div className={`${expanded ? "block" : "hidden"} px-4 pb-3`}>
                      <input
                        value={subcategorySearches[cat.id] || ""}
                        onChange={(e) => { setSubcategorySearches((p) => ({ ...p, [cat.id]: e.target.value })); setSubPages((p) => ({ ...p, [cat.id]: 1 })); }}
                        placeholder={`Search in ${cat.name}`}
                        className="w-full px-3 py-1.5 rounded-md border dialog-divider-login bg-slate-50 focus:bg-white text-sm mb-2"
                      />
                      {subs.length === 0 ? (
                        <div className="py-2 text-sm text-slate-500">No subcategories</div>
                      ) : (
                        <div className="space-y-1">
                          {subs.map((s) => {
                            const isEditingSub = editingSub?.id === s.id;
                            return (
                              <div key={s.id} className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => onSelectSub(s.id)}
                                    className={`flex-1 text-left px-3 py-2 rounded-md hover:bg-slate-50 border dialog-divider-login cursor-pointer ${
                                      activeSubcategory === s.id ? "border-indigo-400 bg-indigo-50/60" : "border-transparent"
                                    }`}
                                  >
                                    <div className="text-sm font-medium text-slate-800 capitalize">{s.name}</div>
                                    <div className="text-xs text-slate-500">View items</div>
                                  </button>
                                  {role === "admin" && (
                                    <>
                                      <button
                                        title="Edit subcategory"
                                        className="p-1 rounded border hover:bg-slate-50 cursor-pointer"
                                        onClick={() => startEditSubcategory(s)}
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                                          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" />
                                          <path d="M14.06 4.69l3.75 3.75 1.59-1.59a1.5 1.5 0 0 0 0-2.12l-1.63-1.63a1.5 1.5 0 0 0-2.12 0l-1.59 1.59z" />
                                        </svg>
                                        <span className="sr-only">Edit</span>
                                      </button>
                                      <button
                                        title="Delete subcategory"
                                        className="p-1 rounded border hover:bg-slate-50 cursor-pointer"
                                        onClick={() => deleteSubcategory(s.id, s.category_id)}
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                                          <path d="M3 6h18" />
                                          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                          <path d="M10 11v6M14 11v6" />
                                        </svg>
                                        <span className="sr-only">Delete</span>
                                      </button>
                                    </>
                                  )}
                                </div>

                                {isEditingSub && (
                                  <div className="mt-1 flex items-center gap-2 px-3">
                                    <input
                                      value={editingSubName}
                                      onChange={(e) => setEditingSubName(e.target.value)}
                                      className="flex-1 px-3 py-1.5 rounded-md border bg-slate-50 focus:bg-white text-sm"
                                      placeholder="Subcategory name"
                                    />
                                    <button
                                      className="text-xs px-2 py-1 rounded border dialog-divider-login bg-indigo-600 text-white hover:bg-indigo-700"
                                      onClick={saveEditSubcategory}
                                      disabled={isBusy}
                                    >
                                      OK
                                    </button>
                                    <button
                                      className="text-xs px-2 py-1 rounded border dialog-divider-login hover:bg-slate-50"
                                      onClick={cancelEditSubcategory}
                                      disabled={isBusy}
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                          {subsTotalPages > 1 && (
                            <div className="mt-2 flex items-center justify-center gap-2 text-xs text-slate-600">
                              <span>Page {subsPage} of {subsTotalPages}</span>
                              <div className="flex gap-1">
                                <button className="px-2 py-1 rounded border dialog-divider-login hover:bg-slate-50 disabled:opacity-50" onClick={() => setSubPages((p) => ({ ...p, [cat.id]: Math.max(1, (p[cat.id] || 1) - 1) }))} disabled={subsPage === 1}>Prev</button>
                                <button className="px-2 py-1 rounded border dialog-divider-login hover:bg-slate-50 disabled:opacity-50" onClick={() => setSubPages((p) => ({ ...p, [cat.id]: Math.min(subsTotalPages, (p[cat.id] || 1) + 1) }))} disabled={subsPage === subsTotalPages}>Next</button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {catTotalPages > 1 && (
                <div className="mt-3 flex items-center justify-center gap-2 text-xs text-slate-600">
                  <span>
                    Page {catPage} of {catTotalPages}
                  </span>
                  <div className="flex gap-1">
                    <button className="px-2 py-1 rounded border dialog-divider-login hover:bg-slate-50 disabled:opacity-50" onClick={() => setCatPage((p) => Math.max(1, p - 1))} disabled={catPage === 1}>Prev</button>
                    <button className="px-2 py-1 rounded border dialog-divider-login hover:bg-slate-50 disabled:opacity-50" onClick={() => setCatPage((p) => Math.min(catTotalPages, p + 1))} disabled={catPage === catTotalPages}>Next</button>
                  </div>
                </div>
              )}
            </div>

            {/* Close drawer button (mobile) */}
            <div className="lg:hidden p-3 border-t dialog-divider-login bg-white">
              <button
                onClick={() => setShowBrowse(false)}
                className="w-full rounded-lg border px-4 py-2 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </aside>

        {/* Main */}
        <section className="lg:col-span-3 space-y-6">
          {/* Items panel */}
          <div className="dialog-surface-login p-4 sm:p-5">
            <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-semibold text-slate-800">Inventory</h2>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] rounded-full border px-2 py-0.5 text-slate-600">
                  {activeSubcategory ? "Filtered by subcategory" : "Pick a subcategory"}
                </span>
              </div>
              <div className="relative w-full md:w-80">
                <input
                  className="w-full rounded-lg input-login-like"
                  placeholder="Search items"
                  value={itemSearch}
                  onChange={(e) => { setItemSearch(e.target.value); setItemsPage(1); }}
                />
              </div>
              {role === "admin" && (
                <div className="flex items-center gap-2">
                  <select
                    className="rounded-lg border px-2 py-2 text-xs bg-white text-black cursor-pointer"
                    value={itemSort}
                    onChange={(e) => setItemSort(e.target.value as typeof itemSort)} // FIX: 'any' to 'typeof itemSort'
                    title="Sort items"
                  >
                    <option value="available">Available first</option>
                    <option value="name">Name (A→Z)</option>
                    <option value="qty_desc">Quantity (High→Low)</option>
                    <option value="qty_asc">Quantity (Low→High)</option>
                  </select>
                </div>
              )}
            </div>

            <div className="mt-4 min-h-[240px]">
              {!activeSubcategory ? (
                <div className="py-12 text-center text-slate-500">
                  Select a subcategory from the left to view items
                </div>
              ) : itemsLoading && !itemsBySub[activeSubcategory] ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="rounded-xl border bg-white p-4 shadow-sm animate-pulse">
                      <div className="h-4 w-2/3 bg-slate-200 rounded mb-2" />
                      <div className="h-3 w-1/2 bg-slate-200 rounded mb-4" />
                      <div className="h-20 w-full bg-slate-100 rounded" />
                    </div>
                  ))}
                </div>
              ) : (itemsBySub[activeSubcategory] || []).filter((i) =>
                    i.name.toLowerCase().includes(itemSearch.toLowerCase())
                  ).length === 0 ? (
                <div className="py-12 text-center text-slate-500">No items found</div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {(() => {
                      let base = (itemsBySub[activeSubcategory] || []).filter((i) => i.name.toLowerCase().includes(itemSearch.toLowerCase()));
                      if (role === "admin") {
                        const byAvail = (a: Instrument, b: Instrument) => {
                          const avA = availableForItem(a) > 0 ? 1 : 0;
                          const avB = availableForItem(b) > 0 ? 1 : 0;
                          if (avB !== avA) return avB - avA; // available first
                          return availableForItem(b) - availableForItem(a); // tie by avail qty desc
                        };
                        if (itemSort === "available") base = base.slice().sort(byAvail);
                        else if (itemSort === "name") base = base.slice().sort((a, b) => a.name.localeCompare(b.name));
                        else if (itemSort === "qty_desc") base = base.slice().sort((a, b) => availableForItem(b) - availableForItem(a));
                        else if (itemSort === "qty_asc") base = base.slice().sort((a, b) => availableForItem(a) - availableForItem(b));
                      }
                      const itemsTotalPages = Math.ceil(base.length / PAGE_SIZE) || 1;
                      const pageLocal = Math.min(itemsPage, itemsTotalPages);
                      const paged = base.slice((pageLocal - 1) * PAGE_SIZE, pageLocal * PAGE_SIZE);
                      return paged.map((item) => {
                        const a = availability(item);
                        const available = isItemAvailable(item);
                        return (
                          <div key={item.id} className="group rounded-2xl border bg-white p-4 shadow-sm hover:shadow-lg transition cursor-pointer">
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0">
                                <div className="truncate text-base font-semibold text-slate-800">{item.name}</div>
                                <div className="mt-1 flex items-center gap-2 text-xs">
                                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 ring-1 ${a.chip} ${a.textColor}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${a.dot}`} />
                                    {a.text}
                                  </span>
                                  <span className="text-slate-400">•</span>
                                  <span className="text-slate-600">{item.is_consumable ? "Consumable" : "Non‑consumable"}</span>
                                </div>
                              </div>
                              <div className="text-right text-xs text-slate-500">
                                <div>
                                  Qty: <span className="font-medium text-slate-700">{item.quantity}</span>
                                </div>
                                <div>
                                  Avail: <span className="font-medium text-slate-700">{availableForItem(item)}</span>
                                </div>
                              </div>
                            </div>

                            <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                              {item.location && (
                                <div>
                                  <span className="text-slate-500">Location:</span> {item.location}
                                </div>
                              )}
                              <div>
                                <span className="text-slate-500">Min/Max per issue:</span> {item.min_issue_limit}/{item.max_issue_limit}
                              </div>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                              <button
                                className="rounded-md border px-3 py-1.5 text-sm hover:bg-slate-50 transition-colors cursor-pointer text-black"
                                onClick={() => {
                                  setSelectedItem(item);
                                  setShowView(true);
                                }}
                              >
                                View
                              </button>

                              {role === "admin" ? (
                                <>
                                  <button
                                    className="rounded-md bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 text-sm transition-colors cursor-pointer"
                                    onClick={() => {
                                      setSelectedItem(item);
                                      setEditData({ ...item });
                                      setShowEdit(true);
                                    }}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    className="rounded-md bg-rose-500/90 hover:bg-rose-600 text-white px-3 py-1.5 text-sm transition-colors cursor-pointer"
                                    onClick={() => {
                                      setSelectedItem(item);
                                      setShowDelete(true);
                                    }}
                                  >
                                    Delete
                                  </button>
                                </>
                              ) : role === "student" ? (
                                <div className="flex gap-2">
                                  <button
                                    className="rounded-md bg-indigo-600 text-white px-3 py-1.5 text-sm disabled:opacity-50 transition-colors cursor-pointer"
                                    onClick={() => available && addToCart(item)}
                                    disabled={!available}
                                  >
                                    Issue
                                  </button>
                                  <button
                                    className="rounded-md border px-3 py-1.5 text-sm transition-colors cursor-pointer text-black"
                                    onClick={() => setCartOpen(true)}
                                  >
                                    View Cart
                                  </button>
                                </div>
                              ) : (
                                <button
                                  className="rounded-md bg-indigo-600 text-white px-3 py-1.5 text-sm disabled:opacity-50 transition-colors cursor-pointer"
                                  onClick={() => {
                                    if (available) {
                                      setIssueItem(item);
                                      setIssueQty("");
                                      setIssueError("");
                                      setShowIssue(true);
                                    }
                                  }}
                                  disabled={!available}
                                >
                                  Request
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                  {(() => {
                    if (!activeSubcategory) return null; // Guard against null
                    const base = (itemsBySub[activeSubcategory] || []).filter((i) => i.name.toLowerCase().includes(itemSearch.toLowerCase()));
                    const itemsTotalPages = Math.ceil(base.length / PAGE_SIZE) || 1;
                    if (itemsTotalPages <= 1) return null;
                    const pageLocal = Math.min(itemsPage, itemsTotalPages);
                    return (
                      <div className="mt-3 flex items-center justify-center gap-2 text-xs text-slate-600">
                        <span>
                          Page {pageLocal} of {itemsTotalPages}
                        </span>
                        <div className="flex gap-1">
                          <button className="px-2 py-1 rounded border dialog-divider-login hover:bg-slate-50 disabled:opacity-50" onClick={() => setItemsPage((p) => Math.max(1, p - 1))} disabled={pageLocal === 1}>Prev</button>
                          <button className="px-2 py-1 rounded border dialog-divider-login hover:bg-slate-50 disabled:opacity-50" onClick={() => setItemsPage((p) => Math.min(itemsTotalPages, p + 1))} disabled={pageLocal === itemsTotalPages}>Next</button>
                        </div>
                      </div>
                    );
                  })()}
                </>
              )}
            </div>
          </div>

          {/* Student: My Requests with tabs */}
          {role === "student" && (
            <StudentMyRequests wsTick={issueWsTick} optItems={myRequests} optLoading={myReqLoading} />
          )}

          {/* Admin/Faculty: Requests (grouped by student) */}
          {(role === "admin" || role === "faculty") && (
            <div className="dialog-surface-login p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-slate-800">Requests</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">{groupedStudents.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-64 max-w-[55%] hidden sm:block">
                    <input
                      value={reqSearch}
                      onChange={(e) => {
                        setReqSearch(e.target.value);
                        setPage(1);
                      }}
                      placeholder="Search students"
                      className="w-full px-3 py-2 rounded-lg border dialog-divider-login bg-slate-50 focus:bg-white"
                    />
                  </div>
                  <select
                    className="rounded-lg border dialog-divider-login px-2 py-2 text-xs bg-white"
                    value={studentSort}
                    onChange={(e) => { setStudentSort(e.target.value as typeof studentSort); setPage(1); }} // FIX: 'any' to 'typeof studentSort'
                    title="Sort students"
                  >
                    <option value="newest">Newest first</option>
                    <option value="roll">Roll no. (A→Z)</option>
                  </select>
                  {(role === "admin" || role === "faculty") && (
                    <button
                      className="rounded-lg bg-emerald-600 text-white px-3 py-2 text-xs font-medium disabled:opacity-50 cursor-pointer hover:bg-emerald-700"
                      onClick={() => {
                        const ids = (requests || []).map((r) => r.id);
                        setSelectedReqIds(new Set(ids));
                        // Nudge modal open after selection state commits
                        setTimeout(() => setBulkApproveOpen(true), 0);
                      }}
                      disabled={requestsStatus !== "pending" || requests.length === 0 || isBusy}
                      title="Approve all pending requests"
                    >
                      Approve All
                    </button>
                  )}
                </div>
              </div>

              {/* Status tabs: pending/approved/rejected/all */}
              <div className="mb-3">
                {(["pending","approved","rejected","all"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => { setRequestsStatus(t); setPage(1); }}
                    className={`mr-2 text-xs px-3 py-1.5 rounded-md border ${requestsStatus === t ? "bg-indigo-50 border-indigo-400" : "hover:bg-slate-50"}`}
                  >
                    {t[0].toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>

              <div className="sm:hidden mb-3">
                <div className="relative">
                  <input
                    value={reqSearch}
                    onChange={(e) => {
                      setReqSearch(e.target.value);
                      setPage(1);
                    }}
                    placeholder="Search students"
                    className="w-full px-3 py-2 rounded-lg border bg-slate-50 focus:bg-white"
                  />
                </div>
              </div>

              {requestsLoading ? (
                <div className="py-10 text-center text-slate-500">Loading…</div>
              ) : filteredStudents.length === 0 ? (
                <div className="py-10 text-center text-slate-500">No pending requests</div>
              ) : (
                <div className="space-y-3">
                  {paginatedStudents.map((stu) => (
                    <div key={stu.id} className="rounded-lg border p-3 hover:bg-slate-50 cursor-pointer" onClick={() => openStudentRequests({ id: stu.id, name: stu.name, email: stu.email })}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-slate-800 truncate">Roll No.: {stu.name || `User ${stu.id}`}</div>
                          {stu.email && (
                            <div className="text-xs"><a className="text-indigo-600 hover:underline" href={`mailto:${stu.email}`} onClick={(e) => e.stopPropagation()}>{stu.email}</a></div>
                          )}
                          {stu.lastRemark && (
                            <div className="text-[11px] text-slate-600 truncate mt-0.5" title={stu.lastRemark}>
                              Remark: <span className="text-slate-700">{stu.lastRemark}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">{stu.count} {requestsStatus}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {totalPages > 1 && (
                <div className="mt-3 flex items-center justify-center gap-2 text-xs text-slate-600">
                  <span>
                    Page {page} of {totalPages}
                  </span>
                  <div className="flex gap-1">
                    <button
                      className="px-2 py-1 rounded border hover:bg-slate-50 disabled:opacity-50"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Prev
                    </button>
                    <button
                      className="px-2 py-1 rounded border hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      <ViewItemModal
        open={showView}
        item={selectedItem}
        onClose={() => setShowView(false)}
        availableForItem={availableForItem}
      />

      <EditItemModal
        open={showEdit}
        item={selectedItem}
        editData={editData}
        setEditData={(d) => setEditData(d)}
        isBusy={isBusy}
        error={issueError}
        onClose={() => setShowEdit(false)}
        onSave={submitEdit}
      />

      <DeleteItemModal
        open={showDelete}
        item={selectedItem}
        isBusy={isBusy}
        error={issueError}
        onClose={() => setShowDelete(false)}
        onConfirm={submitDelete}
      />

      <IssueRequestModal
        open={showIssue}
        item={issueItem}
        qty={issueQty}
        setQty={(v) => { setIssueQty(v); setIssueError(""); }}
        error={issueError}
        isBusy={isBusy}
        onClose={() => setShowIssue(false)}
        onSubmit={submitIssue}
        availableForItem={availableForItem}
      />

      {/* Cart modal */}
      <CartModal
        open={cartOpen}
        lines={cartLines}
        onClose={() => setCartOpen(false)}
        onUpdateQty={updateCartQty}
        onRemove={removeFromCart}
        onSubmit={submitCart}
        isBusy={isBusy}
        error={cartError}
      />

      <AddNewModal
        open={showAdd && role === "admin"}
        onClose={() => setShowAdd(false)}
        addTab={addTab}
        setAddTab={setAddTab}
        categories={categories}
        subByCat={subByCat}
        newCatName={newCatName}
        setNewCatName={setNewCatName}
        onCreateCategory={submitAddCategory}
        newSubCatId={newSubCatId}
        setNewSubCatId={setNewSubCatId}
        newSubName={newSubName}
        setNewSubName={setNewSubName}
        onCreateSubcategory={submitAddSubcategory}
        newItemCatId={newItemCatId}
        setNewItemCatId={setNewItemCatId}
        newItemSubId={newItemSubId}
        setNewItemSubId={setNewItemSubId}
        newItemName={newItemName}
        setNewItemName={setNewItemName}
        newItemQty={newItemQty}
        setNewItemQty={setNewItemQty}
        newItemConsumable={newItemConsumable}
        setNewItemConsumable={setNewItemConsumable}
        newItemLocation={newItemLocation}
        setNewItemLocation={setNewItemLocation}
        newItemMin={newItemMin}
        setNewItemMin={setNewItemMin}
        newItemMax={newItemMax}
        setNewItemMax={setNewItemMax}
        newItemDesc={newItemDesc}
        setNewItemDesc={setNewItemDesc}
        newItemAvailable={newItemAvailable}
        setNewItemAvailable={setNewItemAvailable}
        onCreateItem={submitAddItem}
        isBusy={isBusy}
        error={addError}
      />

      {/* Admin modals */}
      <AdminApproveModal
        open={approveOpen}
        student={activeAdminReq ? { roll: activeAdminReq.user?.name || String(activeAdminReq.user_id), email: activeAdminReq.user?.email || "" } : null}
        // FIX: 'any' to 'unknown' with type guards
        request={activeAdminReq ? { id: activeAdminReq.id, itemName: (typeof activeAdminReq.item === "object" && (activeAdminReq.item as { name?: string })?.name) ? (activeAdminReq.item as { name: string }).name : String(activeAdminReq.item), quantity: activeAdminReq.quantity } : null}
        onClose={() => setApproveOpen(false)}
        onApprove={async ({ returnDays, returnDate, remark }) => {
          if (!activeAdminReq) return;
          setApproveSubmitting(true);
          try {
            // Optimistic remove from list
            setRequests((arr) => arr.filter((r) => r.id !== activeAdminReq.id));
            // Also remove from the student modal list if open
            setStudentModalRequests((arr) => arr.filter((r) => r.id !== activeAdminReq.id));
            // FIX: 'any' to 'Record<string, unknown>'
            const body: Record<string, unknown> = { remarks: remark || undefined };
            if (returnDays != null) body.return_days = returnDays;
            if (returnDate) body.return_by = returnDate;
            const res = await fetch(`${API_URL}/issue-requests/${activeAdminReq.id}/approve`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify(body),
            });
            if (!res.ok) {
              const data = await res.json().catch(() => ({}));
              // FIX: 'any' to '{ detail?: string }'
              alert((data as { detail?: string }).detail || "Approval failed");
            } else {
              setTimeout(() => { refetchActiveSubcategory(); }, 1500);
            }
          } finally {
            setApproveSubmitting(false);
            setApproveOpen(false);
            setActiveAdminReq(null);
          }
        }}
        isBusy={approveSubmitting}
      />

      <AdminRejectModal
        open={rejectOpen}
        // FIX: 'any' to 'unknown' with type guards
        request={activeAdminReq ? { id: activeAdminReq.id, itemName: (typeof activeAdminReq.item === "object" && (activeAdminReq.item as { name?: string })?.name) ? (activeAdminReq.item as { name: string }).name : String(activeAdminReq.item), quantity: activeAdminReq.quantity } : null}
        onClose={() => setRejectOpen(false)}
        onReject={async ({ remark }) => {
          if (!activeAdminReq) return;
          setRejectSubmitting(true);
          try {
            // Optimistic remove
            setRequests((arr) => arr.filter((r) => r.id !== activeAdminReq.id));
            // Also remove from the student modal list if open
            setStudentModalRequests((arr) => arr.filter((r) => r.id !== activeAdminReq.id));
            // Fast reconcile to restore visible quantities
            setTimeout(() => { refetchActiveSubcategory(); }, 300);
            const res = await fetch(`${API_URL}/issue-requests/${activeAdminReq.id}/reject`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ remarks: remark }),
            });
            if (!res.ok) {
              const data = await res.json().catch(() => ({}));
              // FIX: 'any' to '{ detail?: string }'
              alert((data as { detail?: string }).detail || "Rejection failed");
            } else {
              // Follow-up reconcile a bit later in case server-side updates broadcast
              setTimeout(() => { refetchActiveSubcategory(); }, 1200);
            }
          } finally {
            setRejectSubmitting(false);
            setRejectOpen(false);
            setActiveAdminReq(null);
          }
        }}
        isBusy={rejectSubmitting}
      />

      {/* Admin: Student requests modal */}
      <StudentRequestsModal
        open={studentModalOpen}
        user={studentModalUser}
        requests={studentModalRequests}
        loading={studentModalLoading}
        status={studentModalStatus}
        onChangeStatus={async (s) => {
          setStudentModalStatus(s);
          if (!studentModalUser) return;
          setStudentModalLoading(true);
          try {
            const q = s === "all" ? "" : `?status=${s}`;
            const r = await fetch(`${API_URL}/issue-requests/${q}${q ? "&" : "?"}scope=all`, { credentials: "include" });
            const d: IssueRequest[] = await r.json();
            const list = (Array.isArray(d) ? d : []).filter((x) => x.user?.id === studentModalUser.id || x.user_id === studentModalUser.id);
            setStudentModalRequests(list);
          } catch {
            setStudentModalRequests([]);
          } finally {
            setStudentModalLoading(false);
          }
        }}
        onClose={() => setStudentModalOpen(false)}
        onApprove={(req) => { setActiveAdminReq(req); setApproveOpen(true); }}
        onReject={(req) => { setActiveAdminReq(req); setRejectOpen(true); }}
        onApproveAll={(ids) => {
          setSelectedReqIds(new Set((ids || []).filter(Boolean)));
          setTimeout(() => setBulkApproveOpen(true), 0);
        }}
        onRejectAll={(ids) => {
          setSelectedReqIds(new Set((ids || []).filter(Boolean)));
          setTimeout(() => setBulkRejectOpen(true), 0);
        }}
      />

      {/* Bulk modals */}
      <BulkApproveModal
        open={bulkApproveOpen}
        count={selectedReqIds.size}
        onClose={() => setBulkApproveOpen(false)}
        onApprove={async ({ returnDays, returnDate, remark }) => {
          setBulkApproveSubmitting(true);
          try {
            // Optimistically remove selected from list
            const ids = Array.from(selectedReqIds);
            setRequests((arr) => arr.filter((r) => !selectedReqIds.has(r.id)));
            // If student modal is open, remove there too
            setStudentModalRequests((arr) => arr.filter((r) => !selectedReqIds.has(r.id)));
            const res = await fetch(`${API_URL}/issue-requests/bulk-approve`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ ids, return_days: returnDays || undefined, return_by: returnDate || undefined, remarks: remark || undefined }),
            });
            if (!res.ok) {
              const data = await res.json().catch(() => ({}));
              // FIX: 'any' to '{ detail?: string }'
              alert((data as { detail?: string }).detail || "Bulk approve failed");
            } else {
              setTimeout(() => { refetchActiveSubcategory(); }, 1500);
            }
          } finally {
            setBulkApproveSubmitting(false);
            setBulkApproveOpen(false);
            clearSelection();
          }
        }}
        isBusy={bulkApproveSubmitting}
      />
      <BulkRejectModal
        open={bulkRejectOpen}
        count={selectedReqIds.size}
        onClose={() => setBulkRejectOpen(false)}
        onReject={async ({ remark }) => {
          setBulkRejectSubmitting(true);
          try {
            const ids = Array.from(selectedReqIds);
            setRequests((arr) => arr.filter((r) => !selectedReqIds.has(r.id)));
            // Also remove from the student modal list if open
            setStudentModalRequests((arr) => arr.filter((r) => !selectedReqIds.has(r.id)));
            // Fast reconcile to restore visible quantities
            setTimeout(() => { refetchActiveSubcategory(); }, 300);
            const res = await fetch(`${API_URL}/issue-requests/bulk-reject`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ ids, remarks: remark }),
            });
            if (!res.ok) {
              const data = await res.json().catch(() => ({}));
              // FIX: 'any' to '{ detail?: string }'
              alert((data as { detail?: string }).detail || "Bulk reject failed");
            } else {
              setTimeout(() => { refetchActiveSubcategory(); }, 1200);
            }
          } finally {
            setBulkRejectSubmitting(false);
            setBulkRejectOpen(false);
            clearSelection();
          }
        }}
        isBusy={bulkRejectSubmitting}
      />
    </div>
  );
}

function StudentMyRequests({ wsTick, optItems, optLoading }: { wsTick: number; optItems?: IssueRequest[]; optLoading?: boolean }) {
  const [tab, setTab] = useState<"pending" | "approved" | "rejected">("pending");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<IssueRequest[]>([]);
  const [page, setPage] = useState(1);
  const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/instruments`;

  useEffect(() => {
    // FIX: Moved 'load' function inside useEffect to fix exhaustive-deps
    const load = async (status: "pending" | "approved" | "rejected") => {
      setLoading(true);
      try {
        const r = await fetch(`${API_URL}/issue-requests/?status=${status}`, { credentials: "include" });
        const d = await r.json();
        setItems(Array.isArray(d) ? d : []);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    load(tab);
    setPage(1);
  }, [tab, wsTick, API_URL]); // Added API_URL as it's a dependency

  const showOptimistic = tab === "pending" && Array.isArray(optItems) && (optItems?.length || 0) > (items?.length || 0);
  const finalItems = showOptimistic ? (optItems as IssueRequest[]) : items;
  const finalLoading = tab === "pending" && optLoading ? true : loading;

  const pageSize = PAGE_SIZE;
  const totalPages = Math.ceil(finalItems.length / pageSize) || 1;
  const pageLocal = Math.min(page, totalPages);
  const paged = finalItems.slice((pageLocal - 1) * pageSize, pageLocal * pageSize);

  return (
    <div className="rounded-2xl border bg-white p-4 sm:p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-slate-800">My Requests</h3>
          {tab === "pending" && optLoading && (
            <span className="inline-flex items-center gap-1 text-xs text-indigo-700 bg-indigo-50 rounded-full px-2 py-0.5">
              <span className="w-3 h-3 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
              Syncing…
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {(["pending", "approved", "rejected"] as const).map((t) => (
            <button key={t} className={`text-xs px-3 py-1.5 rounded-md border ${tab === t ? "bg-indigo-50 border-indigo-400" : "hover:bg-slate-50"} cursor-pointer`} onClick={() => setTab(t)}>
              {t[0].toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>
      {finalLoading ? (
        <div className="py-10 text-center text-slate-500">Loading…</div>
      ) : finalItems.length === 0 ? (
        <div className="py-10 text-center text-slate-500">No {tab} requests</div>
      ) : (
        <div className="space-y-3">
          {paged.map((req) => {
            const optimistic = typeof req.id === "number" && req.id < 0;
            return (
              <div key={req.id} className={`rounded-lg border p-3 ${optimistic ? "opacity-80" : ""}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-800 truncate">
                      {/* FIX: 'any' to 'unknown' with type guards */}
                      {typeof req.item === "object" && (req.item as { name?: string })?.name ? (req.item as { name: string }).name : String(req.item)}
                    </div>
                    <div className="text-xs text-slate-500 truncate">Status: {req.status}{optimistic ? " (syncing)" : ""}</div>
                    {req.remarks && (
                      <div className="mt-1 text-xs text-slate-600 truncate" title={req.remarks}>
                        Remark: <span className="text-slate-700">{req.remarks}</span>
                      </div>
                    )}
                    {req.status === "approved" && (
                      <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-600">
                        {req.approved_at && (
                          <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5">
                            Approved: {new Date(req.approved_at).toLocaleString()}
                          </span>
                        )}
                        {req.return_by && (
                          <span className="inline-flex items-center rounded-full bg-indigo-50 text-indigo-700 px-2 py-0.5">
                            Return by: {new Date(req.return_by).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-slate-500">
                    Qty: <span className="font-medium text-slate-700">{req.quantity}</span>
                    {optimistic && (
                      <span className="ml-2 inline-flex items-center gap-1 text-[10px] text-indigo-700 bg-indigo-50 rounded-full px-1.5 py-0.5">
                        <span className="w-2.5 h-2.5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                        Syncing
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );})}
        </div>
      )}
      {totalPages > 1 && (
        <div className="mt-3 flex items-center justify-center gap-2 text-xs text-slate-600">
          <span>
            Page {pageLocal} of {totalPages}
          </span>
          <div className="flex gap-1">
            <button className="px-2 py-1 rounded border hover:bg-slate-50 disabled:opacity-50" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={pageLocal === 1}>Prev</button>
            <button className="px-2 py-1 rounded border hover:bg-slate-50 disabled:opacity-50" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={pageLocal === totalPages}>Next</button>
          </div>
        </div>
      )}
    </div>
  );
}