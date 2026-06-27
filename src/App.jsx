import { useState, useEffect, useContext, createContext, useCallback, useMemo, useRef } from "react";
import {
  Wallet, TrendingUp, TrendingDown, Plus, Search, Filter, Trash2,
  Download, Upload, Sun, Moon, AlertTriangle, CheckCircle2, X,
  ChevronDown, DollarSign, BarChart3, List, Settings2, Tag,
  Calendar, ArrowUpRight, ArrowDownRight, FileJson, FileText
} from "lucide-react";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend
} from "recharts";

// ─── Constants ───────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: "food", label: "Food & Dining", color: "#8b5cf6" },
  { id: "transport", label: "Transport", color: "#06b6d4" },
  { id: "utilities", label: "Utilities", color: "#f59e0b" },
  { id: "entertainment", label: "Entertainment", color: "#ec4899" },
  { id: "health", label: "Health", color: "#10b981" },
  { id: "shopping", label: "Shopping", color: "#f97316" },
  { id: "housing", label: "Housing", color: "#6366f1" },
  { id: "salary", label: "Salary", color: "#22c55e" },
  { id: "freelance", label: "Freelance", color: "#14b8a6" },
  { id: "investment", label: "Investment", color: "#a855f7" },
  { id: "other", label: "Other", color: "#94a3b8" },
];

const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));
const STORAGE_KEY = "expense_tracker_v2";

function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function fmt(n) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n);
}

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const SEED_TRANSACTIONS = [
  { id: genId(), title: "Monthly salary", amount: 5500, type: "income", category: "salary", date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10) },
  { id: genId(), title: "Groceries", amount: 120, type: "expense", category: "food", date: new Date(new Date().getFullYear(), new Date().getMonth(), 5).toISOString().slice(0, 10) },
  { id: genId(), title: "Netflix", amount: 18, type: "expense", category: "entertainment", date: new Date(new Date().getFullYear(), new Date().getMonth(), 7).toISOString().slice(0, 10) },
  { id: genId(), title: "Electricity bill", amount: 95, type: "expense", category: "utilities", date: new Date(new Date().getFullYear(), new Date().getMonth(), 10).toISOString().slice(0, 10) },
  { id: genId(), title: "Freelance project", amount: 800, type: "income", category: "freelance", date: new Date(new Date().getFullYear(), new Date().getMonth(), 12).toISOString().slice(0, 10) },
  { id: genId(), title: "Restaurant dinner", amount: 68, type: "expense", category: "food", date: new Date(new Date().getFullYear(), new Date().getMonth(), 14).toISOString().slice(0, 10) },
  { id: genId(), title: "Gym membership", amount: 45, type: "expense", category: "health", date: new Date(new Date().getFullYear(), new Date().getMonth(), 15).toISOString().slice(0, 10) },
  { id: genId(), title: "Uber rides", amount: 32, type: "expense", category: "transport", date: new Date(new Date().getFullYear(), new Date().getMonth(), 18).toISOString().slice(0, 10) },
];

// ─── Context ─────────────────────────────────────────────────────────────────

const AppCtx = createContext(null);
function useApp() { return useContext(AppCtx); }

function loadStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function AppProvider({ children }) {
  const saved = loadStorage();
  const [dark, setDark] = useState(saved?.dark ?? true);
  const [transactions, setTransactions] = useState(saved?.transactions ?? SEED_TRANSACTIONS);
  const [budget, setBudget] = useState(saved?.budget ?? 2000);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ dark, transactions, budget }));
    } catch {}
  }, [dark, transactions, budget]);

  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type, id: genId() });
    setTimeout(() => setToast(null), 3200);
  }, []);

  const addTransaction = useCallback((tx) => {
    setTransactions(prev => [{ ...tx, id: genId() }, ...prev]);
    showToast("Transaction added");
  }, [showToast]);

  const deleteTransaction = useCallback((id) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    showToast("Transaction deleted", "error");
  }, [showToast]);

  const now = new Date();
  const thisMonth = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const totalIncome = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const monthlyExpense = thisMonth.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  const value = {
    dark, setDark,
    transactions, addTransaction, deleteTransaction, setTransactions,
    budget, setBudget,
    toast,
    totalIncome, totalExpense, monthlyExpense,
    showToast,
  };

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast() {
  const { toast, dark } = useApp();
  if (!toast) return null;
  const isErr = toast.type === "error";
  return (
    <div
      key={toast.id}
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl text-sm font-medium transition-all duration-300 ${
        dark
          ? isErr ? "bg-red-500/20 border border-red-500/30 text-red-300" : "bg-violet-500/20 border border-violet-500/30 text-violet-300"
          : isErr ? "bg-red-50 border border-red-200 text-red-700" : "bg-violet-50 border border-violet-200 text-violet-700"
      }`}
    >
      {isErr ? <X size={15} /> : <CheckCircle2 size={15} />}
      {toast.msg}
    </div>
  );
}

// ─── Summary Cards ────────────────────────────────────────────────────────────

function SummaryCard({ icon: Icon, label, value, accent, dark, sub }) {
  return (
    <div className={`rounded-2xl p-5 flex flex-col gap-3 border transition-all duration-200 hover:scale-[1.01] ${
      dark ? "bg-slate-800/60 border-slate-700/50 hover:border-slate-600" : "bg-white border-slate-200 hover:border-slate-300 shadow-sm"
    }`}>
      <div className="flex items-center justify-between">
        <span className={`text-sm font-medium ${dark ? "text-slate-400" : "text-slate-500"}`}>{label}</span>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${accent}`}>
          <Icon size={16} className="text-white" />
        </div>
      </div>
      <div>
        <p className={`text-2xl font-semibold tracking-tight ${dark ? "text-white" : "text-slate-900"}`}>{value}</p>
        {sub && <p className={`text-xs mt-1 ${dark ? "text-slate-500" : "text-slate-400"}`}>{sub}</p>}
      </div>
    </div>
  );
}

// ─── Category Chart ───────────────────────────────────────────────────────────

function CategoryChart({ dark }) {
  const { transactions } = useApp();
  const data = useMemo(() => {
    const map = {};
    transactions.filter(t => t.type === "expense").forEach(t => {
      map[t.category] = (map[t.category] || 0) + t.amount;
    });
    return Object.entries(map)
      .map(([k, v]) => ({ name: CATEGORY_MAP[k]?.label || k, value: v, color: CATEGORY_MAP[k]?.color || "#94a3b8" }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [transactions]);

  if (!data.length) return (
    <div className={`flex flex-col items-center justify-center h-48 ${dark ? "text-slate-500" : "text-slate-400"}`}>
      <BarChart3 size={32} className="mb-2 opacity-40" />
      <p className="text-sm">No expense data yet</p>
    </div>
  );

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
          {data.map((entry, i) => <Cell key={i} fill={entry.color} strokeWidth={0} />)}
        </Pie>
        <Tooltip
          formatter={(v) => [fmt(v), "Amount"]}
          contentStyle={{
            background: dark ? "#1e293b" : "#ffffff",
            border: dark ? "1px solid #334155" : "1px solid #e2e8f0",
            borderRadius: "10px",
            color: dark ? "#f1f5f9" : "#0f172a",
            fontSize: "13px",
          }}
        />
        <Legend
          formatter={(value) => <span style={{ color: dark ? "#94a3b8" : "#64748b", fontSize: "12px" }}>{value}</span>}
          iconType="circle"
          iconSize={8}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

function MonthlyChart({ dark }) {
  const { transactions } = useApp();
  const data = useMemo(() => {
    const months = {};
    transactions.forEach(t => {
      const d = new Date(t.date);
      const key = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      if (!months[key]) months[key] = { month: key, income: 0, expense: 0 };
      months[key][t.type] += t.amount;
    });
    return Object.values(months).slice(-6);
  }, [transactions]);

  if (!data.length) return null;

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} barSize={16} barCategoryGap="30%">
        <XAxis dataKey="month" tick={{ fill: dark ? "#64748b" : "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: dark ? "#64748b" : "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v >= 1000 ? (v/1000).toFixed(1)+"k" : v}`} />
        <Tooltip
          formatter={(v, name) => [fmt(v), name.charAt(0).toUpperCase() + name.slice(1)]}
          contentStyle={{
            background: dark ? "#1e293b" : "#ffffff",
            border: dark ? "1px solid #334155" : "1px solid #e2e8f0",
            borderRadius: "10px",
            color: dark ? "#f1f5f9" : "#0f172a",
            fontSize: "13px",
          }}
        />
        <Bar dataKey="income" fill="#22c55e" radius={[4, 4, 0, 0]} />
        <Bar dataKey="expense" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Budget Tracker ───────────────────────────────────────────────────────────

function BudgetTracker({ dark }) {
  const { budget, setBudget, monthlyExpense, showToast } = useApp();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(budget);
  const pct = budget > 0 ? Math.min((monthlyExpense / budget) * 100, 100) : 0;
  const over80 = pct >= 80 && pct < 100;
  const over100 = pct >= 100;

  const barColor = over100 ? "#ef4444" : over80 ? "#f59e0b" : "#8b5cf6";

  function save() {
    const n = parseFloat(draft);
    if (!isNaN(n) && n > 0) { setBudget(n); showToast("Budget updated"); }
    setEditing(false);
  }

  return (
    <div className={`rounded-2xl p-5 border ${dark ? "bg-slate-800/60 border-slate-700/50" : "bg-white border-slate-200 shadow-sm"}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className={`text-sm font-semibold ${dark ? "text-slate-200" : "text-slate-700"}`}>Monthly Budget</h3>
          <p className={`text-xs mt-0.5 ${dark ? "text-slate-500" : "text-slate-400"}`}>
            {fmt(monthlyExpense)} of {fmt(budget)} spent
          </p>
        </div>
        {editing ? (
          <div className="flex items-center gap-2">
            <input
              className={`w-28 text-sm px-3 py-1.5 rounded-lg border outline-none ${dark ? "bg-slate-700 border-slate-600 text-white" : "bg-slate-50 border-slate-300 text-slate-900"}`}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => e.key === "Enter" && save()}
              autoFocus
            />
            <button onClick={save} className="text-xs px-3 py-1.5 bg-violet-600 text-white rounded-lg hover:bg-violet-500 transition-colors">Save</button>
          </div>
        ) : (
          <button onClick={() => { setDraft(budget); setEditing(true); }}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${dark ? "border-slate-600 text-slate-400 hover:text-slate-200 hover:border-slate-500" : "border-slate-200 text-slate-500 hover:text-slate-700"}`}>
            Edit
          </button>
        )}
      </div>

      <div className={`h-2.5 rounded-full overflow-hidden ${dark ? "bg-slate-700" : "bg-slate-100"}`}>
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%`, background: barColor }}
        />
      </div>

      <div className="flex items-center justify-between mt-2.5">
        <span className={`text-xs font-medium`} style={{ color: barColor }}>{pct.toFixed(1)}% used</span>
        <span className={`text-xs ${dark ? "text-slate-500" : "text-slate-400"}`}>{fmt(Math.max(budget - monthlyExpense, 0))} left</span>
      </div>

      {(over80 || over100) && (
        <div className={`mt-4 flex items-start gap-2.5 p-3 rounded-xl text-xs ${
          over100
            ? dark ? "bg-red-500/10 border border-red-500/20 text-red-400" : "bg-red-50 border border-red-200 text-red-600"
            : dark ? "bg-amber-500/10 border border-amber-500/20 text-amber-400" : "bg-amber-50 border border-amber-200 text-amber-600"
        }`}>
          <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
          <span>{over100 ? "You've exceeded your monthly budget." : "You've used over 80% of your budget."}</span>
        </div>
      )}
    </div>
  );
}

// ─── Transaction Form ─────────────────────────────────────────────────────────

const EMPTY_FORM = { title: "", amount: "", type: "expense", category: "food", date: new Date().toISOString().slice(0, 10) };

function TransactionForm({ onClose, dark }) {
  const { addTransaction } = useApp();
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: "" })); }

  function validate() {
    const e = {};
    if (!form.title.trim()) e.title = "Required";
    if (!form.amount || isNaN(form.amount) || parseFloat(form.amount) <= 0) e.amount = "Enter a valid amount";
    if (!form.date) e.date = "Required";
    return e;
  }

  function submit() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    addTransaction({ ...form, amount: parseFloat(form.amount) });
    onClose();
  }

  const incomeCategories = CATEGORIES.filter(c => ["salary", "freelance", "investment", "other"].includes(c.id));
  const expenseCategories = CATEGORIES.filter(c => !["salary", "freelance", "investment"].includes(c.id));
  const cats = form.type === "income" ? incomeCategories : expenseCategories;

  const field = `text-sm px-3.5 py-2.5 rounded-xl border outline-none transition-colors w-full ${
    dark ? "bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-violet-500" 
         : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-violet-400"
  }`;
  const label = `text-xs font-medium mb-1.5 block ${dark ? "text-slate-400" : "text-slate-500"}`;
  const err = `text-xs mt-1 text-red-400`;

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full max-w-md rounded-2xl p-6 z-50 shadow-2xl ${dark ? "bg-slate-800 border border-slate-700" : "bg-white border border-slate-200"}`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-base font-semibold ${dark ? "text-white" : "text-slate-900"}`}>Add transaction</h2>
          <button onClick={onClose} className={`p-1.5 rounded-lg transition-colors ${dark ? "hover:bg-slate-700 text-slate-400" : "hover:bg-slate-100 text-slate-500"}`}>
            <X size={16} />
          </button>
        </div>

        {/* Type toggle */}
        <div className={`flex rounded-xl p-1 mb-5 ${dark ? "bg-slate-900/50" : "bg-slate-100"}`}>
          {["expense", "income"].map(t => (
            <button key={t} onClick={() => { set("type", t); set("category", t === "income" ? "salary" : "food"); }}
              className={`flex-1 py-2 text-sm rounded-lg font-medium transition-all ${
                form.type === t
                  ? t === "income"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-violet-600 text-white shadow-sm"
                  : dark ? "text-slate-400 hover:text-slate-300" : "text-slate-500 hover:text-slate-700"
              }`}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <div>
            <label className={label}>Title</label>
            <input className={field} placeholder="e.g. Monthly salary" value={form.title} onChange={e => set("title", e.target.value)} />
            {errors.title && <p className={err}>{errors.title}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label}>Amount (USD)</label>
              <input type="number" min="0" step="0.01" className={field} placeholder="0.00" value={form.amount} onChange={e => set("amount", e.target.value)} />
              {errors.amount && <p className={err}>{errors.amount}</p>}
            </div>
            <div>
              <label className={label}>Date</label>
              <input type="date" className={field} value={form.date} onChange={e => set("date", e.target.value)} />
              {errors.date && <p className={err}>{errors.date}</p>}
            </div>
          </div>

          <div>
            <label className={label}>Category</label>
            <select className={field} value={form.category} onChange={e => set("category", e.target.value)}>
              {cats.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
        </div>

        <button onClick={submit}
          className={`mt-6 w-full py-2.5 rounded-xl text-sm font-semibold transition-colors ${
            form.type === "income" ? "bg-emerald-600 hover:bg-emerald-500 text-white" : "bg-violet-600 hover:bg-violet-500 text-white"
          }`}>
          Add {form.type}
        </button>
      </div>
    </div>
  );
}

// ─── Transaction Item ─────────────────────────────────────────────────────────

function TxItem({ tx, dark }) {
  const { deleteTransaction } = useApp();
  const cat = CATEGORY_MAP[tx.category] || CATEGORY_MAP.other;
  const isIncome = tx.type === "income";

  return (
    <div className={`flex items-center gap-3 px-4 py-3.5 group transition-colors ${dark ? "hover:bg-slate-700/30" : "hover:bg-slate-50"}`}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: cat.color + "20" }}>
        <Tag size={14} style={{ color: cat.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${dark ? "text-slate-200" : "text-slate-800"}`}>{tx.title}</p>
        <p className={`text-xs mt-0.5 ${dark ? "text-slate-500" : "text-slate-400"}`}>
          {cat.label} · {fmtDate(tx.date)}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <span className={`text-sm font-semibold ${isIncome ? "text-emerald-400" : dark ? "text-slate-300" : "text-slate-700"}`}>
          {isIncome ? "+" : "−"}{fmt(tx.amount)}
        </span>
        <button onClick={() => deleteTransaction(tx.id)}
          className={`opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all ${dark ? "hover:bg-red-500/20 text-slate-500 hover:text-red-400" : "hover:bg-red-50 text-slate-400 hover:text-red-500"}`}>
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

// ─── Transaction List ─────────────────────────────────────────────────────────

function TransactionList({ dark }) {
  const { transactions } = useApp();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [catFilter, setCatFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    return transactions.filter(t => {
      const q = search.toLowerCase();
      const matchSearch = !q || t.title.toLowerCase().includes(q) || CATEGORY_MAP[t.category]?.label.toLowerCase().includes(q);
      const matchType = typeFilter === "all" || t.type === typeFilter;
      const matchCat = catFilter === "all" || t.category === catFilter;
      return matchSearch && matchType && matchCat;
    });
  }, [transactions, search, typeFilter, catFilter]);

  const inputClass = `text-sm px-3.5 py-2.5 rounded-xl border outline-none transition-colors ${
    dark ? "bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-violet-500" 
         : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-violet-400"
  }`;
  const selectClass = `text-sm px-3 py-2 rounded-xl border outline-none ${
    dark ? "bg-slate-800 border-slate-700 text-slate-300" : "bg-white border-slate-200 text-slate-700"
  }`;

  return (
    <div className={`rounded-2xl border overflow-hidden ${dark ? "bg-slate-800/60 border-slate-700/50" : "bg-white border-slate-200 shadow-sm"}`}>
      <div className="p-4 border-b border-slate-700/40">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={14} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${dark ? "text-slate-500" : "text-slate-400"}`} />
            <input className={`${inputClass} pl-9 w-full`} placeholder="Search transactions…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button onClick={() => setShowFilters(f => !f)}
            className={`px-3.5 py-2.5 rounded-xl border text-sm transition-colors flex items-center gap-1.5 ${
              showFilters
                ? "bg-violet-600 border-violet-600 text-white"
                : dark ? "border-slate-700 text-slate-400 hover:border-slate-600" : "border-slate-200 text-slate-500 hover:border-slate-300"
            }`}>
            <Filter size={14} /> Filters
          </button>
        </div>
        {showFilters && (
          <div className="flex gap-2 mt-3 flex-wrap">
            <select className={selectClass} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
              <option value="all">All types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
            <select className={selectClass} value={catFilter} onChange={e => setCatFilter(e.target.value)}>
              <option value="all">All categories</option>
              {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
            {(typeFilter !== "all" || catFilter !== "all" || search) && (
              <button onClick={() => { setTypeFilter("all"); setCatFilter("all"); setSearch(""); }}
                className={`text-xs px-3 py-2 rounded-xl border transition-colors ${dark ? "border-slate-700 text-slate-400 hover:text-slate-200" : "border-slate-200 text-slate-400 hover:text-slate-600"}`}>
                Clear all
              </button>
            )}
          </div>
        )}
      </div>

      <div className="divide-y divide-slate-700/30">
        {filtered.length === 0 ? (
          <div className={`flex flex-col items-center py-14 ${dark ? "text-slate-500" : "text-slate-400"}`}>
            <List size={28} className="mb-2 opacity-40" />
            <p className="text-sm">No transactions match your filters</p>
          </div>
        ) : (
          filtered.map(tx => <TxItem key={tx.id} tx={tx} dark={dark} />)
        )}
      </div>

      {filtered.length > 0 && (
        <div className={`px-4 py-3 text-xs border-t ${dark ? "border-slate-700/40 text-slate-500" : "border-slate-100 text-slate-400"}`}>
          {filtered.length} transaction{filtered.length !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}

// ─── Data Export/Import ───────────────────────────────────────────────────────

function DataPanel({ dark }) {
  const { transactions, setTransactions, showToast } = useApp();
  const fileRef = useRef();

  function exportJSON() {
    const blob = new Blob([JSON.stringify(transactions, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "transactions.json"; a.click();
    URL.revokeObjectURL(url);
    showToast("Exported as JSON");
  }

  function exportCSV() {
    const header = "id,title,amount,type,category,date";
    const rows = transactions.map(t => `${t.id},"${t.title}",${t.amount},${t.type},${t.category},${t.date}`);
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "transactions.csv"; a.click();
    URL.revokeObjectURL(url);
    showToast("Exported as CSV");
  }

  function importJSON(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result);
        if (Array.isArray(data)) {
          setTransactions(data);
          showToast(`Imported ${data.length} transactions`);
        } else throw new Error();
      } catch { showToast("Invalid JSON file", "error"); }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  const btnClass = `flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all hover:scale-[1.02] active:scale-[0.98] ${
    dark ? "border-slate-600 text-slate-300 hover:border-slate-500 hover:bg-slate-700/50" : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
  }`;

  return (
    <div className={`rounded-2xl p-5 border ${dark ? "bg-slate-800/60 border-slate-700/50" : "bg-white border-slate-200 shadow-sm"}`}>
      <h3 className={`text-sm font-semibold mb-4 ${dark ? "text-slate-200" : "text-slate-700"}`}>Data portability</h3>
      <div className="flex flex-wrap gap-2">
        <button className={btnClass} onClick={exportJSON}><FileJson size={15} />Export JSON</button>
        <button className={btnClass} onClick={exportCSV}><FileText size={15} />Export CSV</button>
        <button className={btnClass} onClick={() => fileRef.current?.click()}><Upload size={15} />Import JSON</button>
        <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={importJSON} />
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

function Dashboard({ dark }) {
  const { totalIncome, totalExpense, monthlyExpense } = useApp();
  const balance = totalIncome - totalExpense;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard icon={Wallet} label="Net Balance" value={fmt(balance)} accent="bg-violet-600" dark={dark}
          sub={balance >= 0 ? "Looking healthy" : "Spending exceeds income"} />
        <SummaryCard icon={ArrowUpRight} label="Total Income" value={fmt(totalIncome)} accent="bg-emerald-600" dark={dark} />
        <SummaryCard icon={ArrowDownRight} label="Total Expenses" value={fmt(totalExpense)} accent="bg-rose-500" dark={dark} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className={`rounded-2xl p-5 border ${dark ? "bg-slate-800/60 border-slate-700/50" : "bg-white border-slate-200 shadow-sm"}`}>
          <h3 className={`text-sm font-semibold mb-4 ${dark ? "text-slate-200" : "text-slate-700"}`}>Expenses by category</h3>
          <CategoryChart dark={dark} />
        </div>
        <div className={`rounded-2xl p-5 border ${dark ? "bg-slate-800/60 border-slate-700/50" : "bg-white border-slate-200 shadow-sm"}`}>
          <h3 className={`text-sm font-semibold mb-4 ${dark ? "text-slate-200" : "text-slate-700"}`}>Monthly overview</h3>
          <MonthlyChart dark={dark} />
          <div className="flex gap-4 mt-2 justify-center">
            {[{ color: "#22c55e", label: "Income" }, { color: "#8b5cf6", label: "Expense" }].map(item => (
              <div key={item.label} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                <span className={`text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <BudgetTracker dark={dark} />
      <DataPanel dark={dark} />
    </div>
  );
}

// ─── App Shell ────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3 },
  { id: "transactions", label: "Transactions", icon: List },
];

function App() {
  const { dark, setDark, transactions } = useApp();
  const [tab, setTab] = useState("dashboard");
  const [showForm, setShowForm] = useState(false);

  const bg = dark ? "bg-slate-900 text-slate-100" : "bg-slate-50 text-slate-900";

  return (
    <div className={`min-h-screen ${bg} transition-colors duration-200`}>
      {/* Header */}
      <header className={`sticky top-0 z-30 border-b ${dark ? "bg-slate-900/90 border-slate-800" : "bg-white/90 border-slate-200"} backdrop-blur-md`}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center">
              <DollarSign size={14} className="text-white" />
            </div>
            <span className={`text-sm font-semibold ${dark ? "text-white" : "text-slate-900"}`}>Fintrack</span>
          </div>

          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-1">
            {NAV_ITEMS.map(item => {
              const Icon = item.icon;
              return (
                <button key={item.id} onClick={() => setTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    tab === item.id
                      ? dark ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-900"
                      : dark ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-700"
                  }`}>
                  <Icon size={15} />{item.label}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <button onClick={() => setDark(d => !d)}
              className={`p-2 rounded-xl transition-colors ${dark ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-500"}`}>
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-colors">
              <Plus size={15} /> Add
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <div className="mb-6">
          <h1 className={`text-xl font-semibold ${dark ? "text-white" : "text-slate-900"}`}>
            {tab === "dashboard" ? "Overview" : "Transactions"}
          </h1>
          <p className={`text-sm mt-0.5 ${dark ? "text-slate-400" : "text-slate-500"}`}>
            {tab === "dashboard" ? "Your financial snapshot at a glance" : `${transactions.length} total transactions`}
          </p>
        </div>

        {tab === "dashboard" ? <Dashboard dark={dark} /> : <TransactionList dark={dark} />}
      </main>

      {/* Mobile bottom nav */}
      <div className={`sm:hidden fixed bottom-0 inset-x-0 border-t z-30 ${dark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
        <div className="flex">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            return (
              <button key={item.id} onClick={() => setTab(item.id)}
                className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
                  tab === item.id
                    ? "text-violet-500"
                    : dark ? "text-slate-500" : "text-slate-400"
                }`}>
                <Icon size={20} />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {showForm && <TransactionForm onClose={() => setShowForm(false)} dark={dark} />}
      <Toast />

      {/* Mobile bottom nav spacer */}
      <div className="h-16 sm:hidden" />
    </div>
  );
}

export default function Root() {
  return (
    <AppProvider>
      <App />
    </AppProvider>
  );
}