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
  const [requestsAll, setRequestsAll] = useState<IssueRequest[]>([]);
  // Unread indicators for per-request messages
  const [unreadReqIds, setUnreadReqIds] = useState<Set<number>>(new Set());
  const [reqLastMsgAt, setReqLastMsgAt] = useState<Record<number, string>>({});
  const [requests, setRequests] = useState<IssueRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestsPrimed, setRequestsPrimed] = useState(false);
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
  const [requestsStatus, setRequestsStatus] = useState<"pending" | "approved" | "submitted" | "rejected" | "all">("pending");
  // FIX: Removed unused 'approveAllPendingOpen'
  // Admin student list sort
  const [studentSort, setStudentSort] = useState<"roll" | "newest">("newest");
  // Admin: student requests modal
  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [studentModalUser, setStudentModalUser] = useState<{ id: number; name?: string; email?: string } | null>(null);
  const [studentModalStatus, setStudentModalStatus] = useState<"pending" | "approved" | "submitted" | "rejected" | "all">("pending");
  const [studentModalLoading, setStudentModalLoading] = useState(false);
  const [studentModalRequests, setStudentModalRequests] = useState<IssueRequest[]>([]);

  const openStudentRequests = async (user: { id: number; name?: string; email?: string }) => {
    setStudentModalUser(user);
    setStudentModalStatus(requestsStatus);
    setStudentModalOpen(true);
    setStudentModalLoading(true);
    try {
      // Instant derive from cached requestsAll
      let list = (requestsAll || []).filter((x) => (x.user?.id === user.id) || (x.user_id === user.id));
      if (requestsStatus === "submitted") {
        list = list.filter((x) => x.status === "approved" && (x.submission_status === "submitted" || x.submission_status === "not_required"));
      } else if (requestsStatus === "approved") {
        list = list.filter((x) => x.status === "approved" && !(x.submission_status === "submitted" || x.submission_status === "not_required"));
      } else if (requestsStatus !== "all") {
        list = list.filter((x) => x.status === requestsStatus);
      }
      setStudentModalRequests(list);
      // No background fetch here; sockets keep requestsAll fresh
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

  // Load all requests for admin once per status change context; derive UI instantly from local state
  useEffect(() => {
    if (!(user?.role === "admin" || user?.role === "faculty")) return;
    // If we've already primed the data via initial fetch or sockets, just derive view
    if (requestsPrimed) {
      const all = requestsAll;
      const derived = (() => {
        if (requestsStatus === "all") return all;
        if (requestsStatus === "submitted") return all.filter((x) => x.status === "approved" && (x.submission_status === "submitted" || x.submission_status === "not_required"));
        if (requestsStatus === "approved") return all.filter((x) => x.status === "approved" && !(x.submission_status === "submitted" || x.submission_status === "not_required"));
        return all.filter((x) => x.status === requestsStatus);
      })();
      setRequests(derived);
      return;
    }
    setRequestsLoading(true);
    const url = `${API_URL}/issue-requests/?scope=all`;
    fetch(url, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        const all = Array.isArray(d) ? d : [];
        setRequestsAll(all);
        setRequestsPrimed(true);
        const derived = (() => {
          if (requestsStatus === "all") return all;
          if (requestsStatus === "submitted") return all.filter((x) => x.status === "approved" && (x.submission_status === "submitted" || x.submission_status === "not_required"));
          if (requestsStatus === "approved") return all.filter((x) => x.status === "approved" && !(x.submission_status === "submitted" || x.submission_status === "not_required"));
          return all.filter((x) => x.status === requestsStatus);
        })();
        setRequests(derived);
      })
      .catch(() => { setRequestsAll([]); setRequests([]); })
      .finally(() => setRequestsLoading(false));
  }, [user, requestsStatus, requestsPrimed]);

  // Real-time: listen to streams and refetch lists on updates
  const [issueWsTick, setIssueWsTick] = useState(0);

  // Avoid socket reconnects on simple UI state changes by tracking latest values in refs
  const activeSubRef = useRef<number | null>(null);
  useEffect(() => { activeSubRef.current = activeSubcategory ?? null; }, [activeSubcategory]);
  const requestsStatusRef = useRef(requestsStatus);
  useEffect(() => { requestsStatusRef.current = requestsStatus; }, [requestsStatus]);
  const requestsAllRef = useRef<IssueRequest[]>([]);
  useEffect(() => { requestsAllRef.current = requestsAll; }, [requestsAll]);

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

    const applyDerived = (all: IssueRequest[]) => {
      const status = requestsStatusRef.current as "pending" | "approved" | "submitted" | "rejected" | "all";
      const derived = (() => {
        if (status === "all") return all;
        if (status === "submitted") return all.filter((x) => x.status === "approved" && (x.submission_status === "submitted" || x.submission_status === "not_required"));
        if (status === "approved") return all.filter((x) => x.status === "approved" && !(x.submission_status === "submitted" || x.submission_status === "not_required"));
        return all.filter((x) => x.status === status);
      })();
      setRequests(derived);
    };
    // Removed refetchStudentPending; student list updates via WS patches

    issueWS.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        const event = msg?.event as string | undefined;
        const payload = msg?.payload as any;
        if (!event) return;
        if (user.role === 'student') {
          if (event === 'issue_request.created') {
            // If it's mine and pending, prepend
            if (payload?.user?.id && payload.user.id === (user as any).id) {
              if (payload?.status === 'pending') setMyRequests((arr) => [payload as IssueRequest, ...arr]);
            }
          } else if (event === 'issue_request.updated') {
            // If it's mine, patch
            setMyRequests((arr) => arr.map((r) => (r.id === payload?.id ? { ...r, ...payload } as IssueRequest : r)));
          } else if (event === 'issue_request.message') {
            const reqId = (payload?.issue_request_id as number) || undefined;
            const at = (payload?.created_at as string) || undefined;
            const creatorId = (payload?.creator_id as number) || undefined;
            if (reqId) {
              // Only mark unread when the other side sent the message
              const myId = (user as any)?.id as number | undefined;
              if (!myId || (creatorId && creatorId !== myId)) {
                setUnreadReqIds((prev) => new Set(prev).add(reqId));
                if (at) setReqLastMsgAt((m) => ({ ...m, [reqId]: at }));
              }
              // Bubble up a DOM event so modals can append live messages
              try {
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('issue-request-message', { detail: payload }));
                }
              } catch {}
            }
          }
        }

        if (user.role === 'admin' || user.role === 'faculty') {
          if (event === 'issue_request.created') {
            setRequestsAll((all) => {
              const next = [payload as IssueRequest, ...all];
              applyDerived(next);
              return next;
            });
          } else if (event === 'issue_request.updated') {
            setRequestsAll((all) => {
              const next = all.map((r) => (r.id === payload?.id ? { ...r, ...payload } as IssueRequest : r));
              applyDerived(next);
              return next;
            });
          } else if (event === 'issue_request.rejected') {
            const id = payload?.id as number | undefined;
            if (id) {
              setRequestsAll((all) => {
                const next = all.map((r) => (r.id === id ? { ...r, status: 'rejected' } : r));
                applyDerived(next);
                return next;
              });
            }
          // Ignore 'approved' and 'bulk_approved' noisy events; rely on 'updated' for consistency
          } else if (event === 'issue_request.bulk_rejected') {
            const ids = (payload?.ids as number[]) || [];
            if (ids.length) {
              setRequestsAll((all) => {
                const next = all.map((r) => (ids.includes(r.id) ? { ...r, status: 'rejected' } : r));
                applyDerived(next);
                return next;
              });
            }
          } else if (event === 'issue_request.message') {
            const reqId = (payload?.issue_request_id as number) || undefined;
            const at = (payload?.created_at as string) || undefined;
            const creatorId = (payload?.creator_id as number) || undefined;
            if (reqId) {
              const myId = (user as any)?.id as number | undefined;
              if (!myId || (creatorId && creatorId !== myId)) {
                setUnreadReqIds((prev) => new Set(prev).add(reqId));
                if (at) setReqLastMsgAt((m) => ({ ...m, [reqId]: at }));
              }
              // Bubble up a DOM event so modals can append live messages
              try {
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('issue-request-message', { detail: payload }));
                }
              } catch {}
            }
          }
        }
      } catch {
        // Fallback: no-op on bad WS message
      } finally {
        // No wsTick increments; avoid triggering redundant GETs in student view
      }
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
      (async () => {
        try {
          const urls = [
            `${API_URL}/issue-requests/?status=pending`,
            `${API_URL}/issue-requests/?status=approved`,
            `${API_URL}/issue-requests/?status=rejected`,
          ];
          const resps = await Promise.all(urls.map((u) => fetch(u, { credentials: "include" }).catch(() => null)));
          const jsons = await Promise.all(resps.map((r) => (r && r.ok ? r.json() : Promise.resolve([]))));
          const combinedMap = new Map<number, IssueRequest>();
          for (const arr of jsons) {
            if (!Array.isArray(arr)) continue;
            for (const it of arr as IssueRequest[]) {
              combinedMap.set(it.id, it);
            }
          }
          setMyRequests(Array.from(combinedMap.values()));
        } catch {
          setMyRequests([]);
        } finally {
          setMyReqLoading(false);
        }
      })();
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
    const map = new Map<number, { id: number; name?: string; email?: string; count: number; newestAt?: string; lastRemark?: string; lastApprovedAt?: string; lastReturnBy?: string | null; hasUnread?: boolean; unreadCount?: number }>();
    // When viewing Submitted: include a student only if ALL their approved requests are submitted
    if (requestsStatus === "submitted") {
      const byStudent: Record<number, IssueRequest[]> = {};
      for (const r of requests) {
        if (r.status !== "approved") continue; // we fetched approved here
        const sid = (r.user?.id as number | undefined) ?? (r.user_id as number | undefined);
        if (!sid) continue;
        (byStudent[sid] ||= []).push(r);
      }
      for (const [sidStr, arr] of Object.entries(byStudent)) {
        const sid = Number(sidStr);
        const allSubmitted = arr.every((x) => x.submission_status === "submitted" || x.submission_status === "not_required");
        if (!allSubmitted) continue; // skip student until everything submitted
        const submittedOnly = arr.filter((x) => x.submission_status === "submitted" || x.submission_status === "not_required");
        if (submittedOnly.length === 0) continue;
        const base = submittedOnly[0];
        const name = base.user?.name;
        const email = base.user?.email;
        const entry = { id: sid, name, email, count: submittedOnly.length, newestAt: base.created_at, lastRemark: base.remarks, lastApprovedAt: base.approved_at || undefined, lastReturnBy: base.return_by ?? null };
        // refine newest and meta by latest created_at in submittedOnly
        for (const r of submittedOnly) {
          if (!entry.newestAt || (r.created_at && r.created_at > entry.newestAt)) entry.newestAt = r.created_at;
          if (r.approved_at && entry.newestAt && r.created_at >= entry.newestAt) entry.lastApprovedAt = r.approved_at;
          if (typeof r.return_by !== 'undefined' && entry.newestAt && r.created_at >= entry.newestAt) entry.lastReturnBy = r.return_by ?? null;
          if (r.remarks && entry.newestAt && r.created_at >= entry.newestAt) entry.lastRemark = r.remarks;
        }
        map.set(sid, entry);
      }
    } else {
      for (const r of requests) {
        const id = (r.user?.id as number | undefined) ?? (r.user_id as number | undefined);
        if (!id) continue;
        const name = r.user?.name;
        const email = r.user?.email;
        if (!map.has(id)) map.set(id, { id, name, email, count: 0, newestAt: r.created_at, lastRemark: r.remarks, lastApprovedAt: r.approved_at || undefined, lastReturnBy: r.return_by ?? null, hasUnread: false, unreadCount: 0 });
        const entry = map.get(id)!;
        entry.name = entry.name ?? name;
        entry.email = entry.email ?? email;
        entry.count += 1;
        if (!entry.newestAt || (r.created_at && r.created_at > entry.newestAt)) entry.newestAt = r.created_at;
        if (r.created_at && entry.newestAt && r.created_at >= entry.newestAt) {
          entry.lastRemark = r.remarks ?? entry.lastRemark;
          if (r.approved_at) entry.lastApprovedAt = r.approved_at;
          if (typeof r.return_by !== 'undefined') entry.lastReturnBy = r.return_by ?? null;
        }
        if (unreadReqIds.has(r.id)) {
          entry.hasUnread = true;
          entry.unreadCount = (entry.unreadCount || 0) + 1;
        }
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
  }, [requests, studentSort, unreadReqIds]);

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
            <StudentMyRequests
              wsTick={issueWsTick}
              optItems={myRequests}
              optLoading={myReqLoading}
              unreadIds={unreadReqIds}
              onOpenThread={(reqId) => setUnreadReqIds((prev) => { const n = new Set(prev); n.delete(reqId); return n; })}
            />
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

              {/* Status tabs: pending/approved/submitted/rejected/all */}
              <div className="mb-3">
                {(["pending","approved","submitted","rejected","all"] as const).map((t) => (
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
                <div className="py-10 text-center text-slate-500">No {requestsStatus} requests</div>
              ) : (
                <div className="space-y-3">
                  {paginatedStudents.map((stu) => (
                    <div key={stu.id} className="rounded-lg border p-3 hover:bg-slate-50 cursor-pointer" onClick={() => openStudentRequests({ id: stu.id, name: stu.name, email: stu.email })}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-slate-800 truncate flex items-center gap-2">
                            <span>Roll No.: {stu.name || `User ${stu.id}`}</span>
                            {stu.hasUnread ? <span className="inline-block w-2 h-2 rounded-full bg-indigo-600" title={`${stu.unreadCount || 1} unread`}></span> : null}
                          </div>
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
        onApprove={async ({ returnDays, returnDate, remark, markSubmitted }) => {
          if (!activeAdminReq) return;
          try {
            // Optimistic remove from list
            setRequests((arr) => arr.filter((r) => r.id !== activeAdminReq.id));
            // Also remove from the student modal list if open
            setStudentModalRequests((arr) => arr.filter((r) => r.id !== activeAdminReq.id));
            // Optimistically update master cache: mark as approved (and optionally submitted)
            const nowIso = new Date().toISOString();
            const computeReturnBy = () => {
              if (returnDate) return returnDate;
              const days = returnDays && Number.isFinite(returnDays) ? Number(returnDays) : 7;
              const dt = new Date();
              dt.setDate(dt.getDate() + days);
              return dt.toISOString();
            };
            const rbIso = computeReturnBy();
            let nextAll: IssueRequest[] = [];
            setRequestsAll((arr) => {
              nextAll = arr.map((r) => r.id === activeAdminReq.id ? {
                ...r,
                status: "approved",
                approved_at: nowIso,
                return_by: rbIso,
                remarks: markSubmitted
                  ? (() => {
                      try {
                        const ist = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour12: false });
                        return `Submitted on ${ist} IST`;
                      } catch { return r.remarks; }
                    })()
                  : (remark ?? r.remarks),
                submission_status: markSubmitted ? "submitted" : (r.submission_status ?? "pending"),
                submitted_at: markSubmitted ? nowIso : r.submitted_at,
              } : r);
              return nextAll;
            });
            // Re-derive current tab instantly from nextAll
            {
              const all = nextAll;
              const derived = (() => {
                if (requestsStatus === "all") return all;
                if (requestsStatus === "submitted") return all.filter((x) => x.status === "approved" && (x.submission_status === "submitted" || x.submission_status === "not_required"));
                if (requestsStatus === "approved") return all.filter((x) => x.status === "approved" && !(x.submission_status === "submitted" || x.submission_status === "not_required"));
                return all.filter((x) => x.status === requestsStatus);
              })();
              setRequests(derived);
            }
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
            // Fire-and-forget mark submitted if requested; revert optimistically if it fails
            if (markSubmitted) {
              fetch(`${API_URL}/issue-requests/${activeAdminReq.id}/submit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                // Let backend produce IST-formatted default remark
                body: JSON.stringify({ notify_email: true }),
              }).then((r) => {
                if (!r.ok) throw new Error("submit.failed");
              }).catch(() => {
                // Don't revert immediately; consumables auto-submit on approval and may 409/400 here.
                setSuccessMessage("Failed to mark submitted — will recheck");
                setTimeout(() => { refetchActiveSubcategory(); }, 1200);
              });
            }
          } finally {
            setApproveOpen(false);
            setActiveAdminReq(null);
          }
        }}
        isBusy={false}
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
        unreadIds={unreadReqIds}
        lastMsgAt={reqLastMsgAt}
        onChangeStatus={async (s) => {
          setStudentModalStatus(s);
          if (!studentModalUser) return;
          setStudentModalLoading(true);
          try {
            // Instant derive from requestsAll
            let list = (requestsAll || []).filter((x) => x.user?.id === studentModalUser.id || x.user_id === studentModalUser.id);
            if (s === "submitted") list = list.filter((x) => x.status === "approved" && (x.submission_status === "submitted" || x.submission_status === "not_required"));
            else if (s === "approved") list = list.filter((x) => x.status === "approved" && !(x.submission_status === "submitted" || x.submission_status === "not_required"));
            else if (s !== "all") list = list.filter((x) => x.status === s);
            setStudentModalRequests(list);
            // No background fetch; rely on socket updates
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
        onOpenThread={(reqId) => setUnreadReqIds((prev) => { const n = new Set(prev); n.delete(reqId); return n; })}
        onMarkSubmitted={(ids) => {
          if (!Array.isArray(ids) || ids.length === 0) return;
          // Optimistically mark submitted in the student modal list
          setStudentModalRequests((arr) => arr.map((r) => ids.includes(r.id) ? {
            ...r,
            submission_status: "submitted",
            submitted_at: new Date().toISOString(),
            remarks: (() => { try { const ist = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour12: false }); return `Submitted on ${ist} IST`; } catch { return r.remarks; } })(),
          } : r));
          // Also reflect immediately in the global admin requests list for grouping
          setRequestsAll((arr) => arr.map((r) => ids.includes(r.id) ? {
            ...r,
            submission_status: "submitted",
            submitted_at: new Date().toISOString(),
            remarks: (() => { try { const ist = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour12: false }); return `Submitted on ${ist} IST`; } catch { return r.remarks; } })(),
          } : r));
          setRequests((arr) => arr.map((r) => ids.includes(r.id) ? {
            ...r,
            submission_status: "submitted",
            submitted_at: new Date().toISOString(),
            remarks: (() => { try { const ist = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour12: false }); return `Submitted on ${ist} IST`; } catch { return r.remarks; } })(),
          } : r));
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

function StudentMyRequests({ wsTick, optItems, optLoading, unreadIds, onOpenThread }: { wsTick: number; optItems?: IssueRequest[]; optLoading?: boolean; unreadIds?: Set<number>; onOpenThread?: (reqId: number) => void }) {
  const [tab, setTab] = useState<"pending" | "approved" | "submitted" | "rejected">("pending");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<IssueRequest[]>([]);
  const [page, setPage] = useState(1);
  const [sortOpt, setSortOpt] = useState<"newest" | "oldest">("newest");
  const [msgOpenFor, setMsgOpenFor] = useState<number | null>(null);
  const [msgLoading, setMsgLoading] = useState(false);
  const [thread, setThread] = useState<Array<{ id: number; text: string; created_at: string; sender?: string }>>([]);
  const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/instruments`;

  useEffect(() => {
    // Socket-first derivation: if optItems provided, derive per tab without fetching
    if (Array.isArray(optItems)) {
      let arr = optItems.slice();
      if (tab === "submitted") {
        arr = arr.filter((x) => x.status === "approved" && (x.submission_status === "submitted" || x.submission_status === "not_required"));
      } else if (tab === "approved") {
        arr = arr.filter((x) => x.status === "approved" && !(x.submission_status === "submitted" || x.submission_status === "not_required"));
      } else {
        arr = arr.filter((x) => x.status === tab);
      }
      setItems(arr);
      setLoading(false);
      setPage(1);
      return;
    }
    // Fallback fetch only if no optItems available
    (async () => {
      setLoading(true);
      try {
        const statusToFetch = tab === "submitted" ? "approved" : tab;
        const r = await fetch(`${API_URL}/issue-requests/?status=${statusToFetch}`, { credentials: "include" });
        const d = await r.json();
        let arr = Array.isArray(d) ? d : [];
        if (tab === "submitted") {
          arr = arr.filter((x: IssueRequest) => x.status === "approved" && (x.submission_status === "submitted" || x.submission_status === "not_required"));
        } else if (tab === "approved") {
          arr = arr.filter((x: IssueRequest) => x.status === "approved" && !(x.submission_status === "submitted" || x.submission_status === "not_required"));
        }
        setItems(arr);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
        setPage(1);
      }
    })();
  }, [tab, wsTick, API_URL, optItems]);

  const finalItems = items;
  const finalLoading = optItems ? false : loading || (tab === "pending" && !!optLoading);

  // Apply sorting for Approved/Submitted/Rejected
  const itemsSorted = (() => {
    if (tab === "approved") {
      const key = (r: IssueRequest) => r.approved_at || r.created_at || "";
      return finalItems.slice().sort((a, b) => sortOpt === "newest" ? (key(b) || "").localeCompare(key(a) || "") : (key(a) || "").localeCompare(key(b) || ""));
    }
    if (tab === "submitted") {
      const key = (r: IssueRequest) => r.submitted_at || r.created_at || "";
      return finalItems.slice().sort((a, b) => sortOpt === "newest" ? (key(b) || "").localeCompare(key(a) || "") : (key(a) || "").localeCompare(key(b) || ""));
    }
    if (tab === "rejected") {
      const key = (r: IssueRequest) => r.created_at || "";
      return finalItems.slice().sort((a, b) => sortOpt === "newest" ? (key(b) || "").localeCompare(key(a) || "") : (key(a) || "").localeCompare(key(b) || ""));
    }
    return finalItems;
  })();

  const pageSize = PAGE_SIZE;
  const totalPages = Math.ceil(itemsSorted.length / pageSize) || 1;
  const pageLocal = Math.min(page, totalPages);
  const paged = itemsSorted.slice((pageLocal - 1) * pageSize, pageLocal * pageSize);

  // Live-append new messages from socket when thread is open
  useEffect(() => {
    const handler = (e: Event) => {
      try {
        const detail = (e as CustomEvent).detail as any;
        const reqId = detail?.issue_request_id as number | undefined;
        if (!reqId || reqId !== msgOpenFor) return;
        const text = (detail?.text as string) || "";
        const id = (detail?.id as number) || Math.floor(Math.random() * 1e9);
        const created_at = (detail?.created_at as string) || new Date().toISOString();
        const sender = detail?.msg_type === 'system' ? 'System' : (detail?.sender || 'Admin');
        setThread((arr) => [...arr, { id, text, created_at, sender }]);
      } catch {}
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('issue-request-message', handler as EventListener);
      return () => window.removeEventListener('issue-request-message', handler as EventListener);
    }
  }, [msgOpenFor]);

  return (
    <>
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
          {(["pending", "approved", "submitted", "rejected"] as const).map((t) => (
            <button key={t} className={`text-xs px-3 py-1.5 rounded-md border ${tab === t ? "bg-indigo-50 border-indigo-400" : "hover:bg-slate-50"} cursor-pointer`} onClick={() => setTab(t)}>
              {t[0].toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>
      {(tab === "approved" || tab === "submitted" || tab === "rejected") && (
        <div className="mb-2 flex items-center gap-2 text-xs">
          <span className="text-slate-600">Sort:</span>
          <select className="rounded border px-2 py-1 bg-white" value={sortOpt} onChange={(e) => setSortOpt(e.target.value as any)}>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
          </select>
        </div>
      )}
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
                <div className="mt-2">
                  <button
                    className="rounded-md border dialog-divider-login px-2 py-1 text-xs hover:bg-slate-50 cursor-pointer"
                    onClick={async () => {
                      setMsgOpenFor(req.id);
                      setMsgLoading(true);
                      try {
                        const r = await fetch(`${API_URL}/issue-requests/${req.id}/messages`, { credentials: "include" });
                        const d = await r.json();
                        setThread(Array.isArray(d) ? d : []);
                      } catch {
                        setThread([]);
                      } finally {
                        setMsgLoading(false);
                        if (onOpenThread) onOpenThread(req.id);
                      }
                    }}
                  >
                    Messages
                    {unreadIds?.has(req.id) && (
                      <span className="ml-1 inline-block w-2 h-2 rounded-full bg-indigo-600 align-middle" />
                    )}
                  </button>
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
    {msgOpenFor != null && (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
        <div className="dialog-surface-login w-full max-w-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-lg font-semibold text-slate-800">Messages</div>
            <button className="rounded-md border dialog-divider-login px-2 py-1 text-slate-600 hover:bg-slate-50 cursor-pointer" onClick={() => { setMsgOpenFor(null); setThread([]); }}>✕</button>
          </div>
          {msgLoading ? (
            <div className="py-8 text-center text-slate-500 text-sm">Loading…</div>
          ) : thread.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-sm">No messages</div>
          ) : (
            <div className="space-y-2 max-h-[50vh] overflow-y-auto">
              {thread.map((m) => (
                <div key={m.id} className="rounded-md border dialog-divider-login p-2">
                  <div className="text-xs text-slate-500 flex items-center justify-between">
                    <span>{m.sender || "System"}</span>
                    <span>{new Date(m.created_at).toLocaleString()}</span>
                  </div>
                  <div className="text-sm text-slate-800 mt-1 whitespace-pre-wrap">{m.text}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )}
    </>
  );
}