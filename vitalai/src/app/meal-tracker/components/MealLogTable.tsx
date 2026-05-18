'use client';

import React, { useState, useMemo } from 'react';
import { Search, Filter, Trash2, Edit2, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, X, Check } from 'lucide-react';
import { toast } from 'sonner';
import DeleteConfirmModal from './DeleteConfirmModal';
import { useMeals, Meal } from '@/context/MealContext';

type SortKey = keyof Meal;
type SortDir = 'asc' | 'desc';

const mealTypeColors: Record<string, string> = {
  Breakfast: 'bg-warning-light text-warning',
  Lunch: 'bg-success-light text-success',
  Dinner: 'bg-cyan-light text-cyan',
  Snack: 'bg-muted text-muted-foreground',
};

const MEAL_TYPES = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Snack'] as const;
const PAGE_SIZE_OPTIONS = [5, 10, 20];

export default function MealLogTable() {
  const { meals, deleteMeal, bulkDeleteMeals, updateMeal, isLoading: loading } = useMeals();
  const [search, setSearch] = useState('');
  const [mealTypeFilter, setMealTypeFilter] = useState<string>('All');
  const [sortKey, setSortKey] = useState<SortKey>('loggedAt');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<Meal | null>(null);
  const [bulkDeletePending, setBulkDeletePending] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCalories, setEditCalories] = useState<string>('');
  const [exitingIds, setExitingIds] = useState<Set<string>>(new Set());

  // Filter + search
  const filtered = useMemo(() => {
    return meals.filter((m) => {
      const matchSearch = m.name.toLowerCase().includes(search.toLowerCase());
      const matchType = mealTypeFilter === 'All' || m.mealType === mealTypeFilter;
      return matchSearch && matchType;
    });
  }, [meals, search, mealTypeFilter]);

  // Sort
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === 'number' && typeof bv === 'number') {
        return sortDir === 'asc' ? av - bv : bv - av;
      }
      return sortDir === 'asc'
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
  }, [filtered, sortKey, sortDir]);

  // Paginate
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paginated = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const toggleRow = (id: string) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedRows.size === paginated.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(paginated.map((m) => m.id)));
    }
  };

  const confirmDelete = (meal: Meal) => {
    setDeleteTarget(meal);
  };

  const executeDelete = (id: string) => {
    deleteMeal(id);
    toast.success('Meal deleted successfully');
    setDeleteTarget(null);
  };

  const executeBulkDelete = () => {
    const ids = Array.from(selectedRows);
    bulkDeleteMeals(ids);
    setSelectedRows(new Set());
    setBulkDeletePending(false);
    toast.success(`${ids.length} meal${ids.length > 1 ? 's' : ''} deleted`);
  };

  const startEdit = (meal: Meal) => {
    setEditingId(meal.id);
    setEditCalories(String(meal.calories));
  };

  const saveEdit = (id: string) => {
    const newCal = parseInt(editCalories, 10);
    if (!isNaN(newCal) && newCal > 0) {
      updateMeal(id, { calories: newCal });

      toast.success('Calories updated');
    }
    setEditingId(null);
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ChevronUp className="w-3 h-3 opacity-20" />;
    return sortDir === 'asc' ? (
      <ChevronUp className="w-3 h-3 text-primary" />
    ) : (
      <ChevronDown className="w-3 h-3 text-primary" />
    );
  };

  const totalCalories = filtered.reduce((s, m) => s + m.calories, 0);

  return (
    <>
      <div className="card-base overflow-hidden">
        {/* Table header controls */}
        <div className="px-5 py-4 border-b border-border flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <h3 className="text-base font-semibold text-foreground">Meal Log</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {filtered.length} entries · {totalCalories.toLocaleString()} kcal total
            </p>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search meals..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="input-field pl-8 py-2 text-sm"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Meal type filter */}
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            {MEAL_TYPES.map((t) => (
              <button
                key={`filter-${t}`}
                onClick={() => { setMealTypeFilter(t); setCurrentPage(1); }}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                  mealTypeFilter === t
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Bulk action bar */}
        {selectedRows.size > 0 && (
          <div className="px-5 py-3 bg-primary-light border-b border-primary/20 flex items-center gap-3 slide-up">
            <span className="text-sm font-semibold text-primary">{selectedRows.size} selected</span>
            <button
              onClick={() => setBulkDeletePending(true)}
              className="flex items-center gap-1.5 text-xs font-semibold text-danger bg-danger-light px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Selected
            </button>
            <button
              onClick={() => setSelectedRows(new Set())}
              className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground ml-auto"
            >
              <X className="w-3.5 h-3.5" />
              Clear selection
            </button>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="table-th w-10">
                  <input
                    type="checkbox"
                    checked={paginated.length > 0 && selectedRows.size === paginated.length}
                    onChange={toggleAll}
                    className="w-4 h-4 rounded border-input text-primary focus:ring-ring"
                    aria-label="Select all rows"
                  />
                </th>
                {[
                  { key: 'name' as SortKey, label: 'Meal Name' },
                  { key: 'mealType' as SortKey, label: 'Type' },
                  { key: 'calories' as SortKey, label: 'Calories' },
                  { key: 'grams' as SortKey, label: 'Serving' },
                  { key: 'protein' as SortKey, label: 'Protein' },
                  { key: 'carbs' as SortKey, label: 'Carbs' },
                  { key: 'fat' as SortKey, label: 'Fat' },
                  { key: 'loggedAt' as SortKey, label: 'Logged' },
                  { key: 'aiConfidence' as SortKey, label: 'AI Conf.' },
                ].map((col) => (
                  <th
                    key={`th-${col.key}`}
                    className="table-th cursor-pointer select-none hover:text-foreground transition-colors"
                    onClick={() => handleSort(col.key)}
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      <SortIcon col={col.key} />
                    </div>
                  </th>
                ))}
                <th className="table-th text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center py-16">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-3xl">🔍</span>
                      <p className="text-sm font-semibold text-foreground">No meals found</p>
                      <p className="text-xs text-muted-foreground">
                        {search ? `No results for "${search}" — try a different search` : 'No meals match the selected filter'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map((meal) => {
                  const isExiting = exitingIds.has(meal.id);
                  const isEditing = editingId === meal.id;
                  const calPct = Math.min(Math.round((meal.calories / 600) * 100), 100);

                  return (
                    <tr
                      key={meal.id}
                      className={`table-row-hover group transition-all duration-300 ${
                        isExiting ? 'opacity-0 scale-95' : 'opacity-100'
                      } ${selectedRows.has(meal.id) ? 'bg-primary-light/30' : ''}`}
                    >
                      {/* Checkbox */}
                      <td className="table-td w-10">
                        <input
                          type="checkbox"
                          checked={selectedRows.has(meal.id)}
                          onChange={() => toggleRow(meal.id)}
                          className="w-4 h-4 rounded border-input text-primary focus:ring-ring"
                          aria-label={`Select ${meal.name}`}
                        />
                      </td>

                      {/* Meal name */}
                      <td className="table-td max-w-[200px]">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-medium text-foreground truncate block">{meal.name}</span>
                          <div className="flex items-center gap-1.5">
                            {meal.source === 'ai' && (
                              <span className="text-xs text-primary font-medium">✦ AI</span>
                            )}
                            {meal.source === 'manual' && (
                              <span className="text-xs text-muted-foreground font-medium">Manual</span>
                            )}
                            {/* Calorie bar */}
                            <div className="w-16 h-1 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary/60 rounded-full"
                                style={{ width: `${calPct}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Meal type */}
                      <td className="table-td">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${mealTypeColors[meal.mealType]}`}>
                          {meal.mealType}
                        </span>
                      </td>

                      {/* Calories — editable */}
                      <td className="table-td">
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={editCalories}
                              onChange={(e) => setEditCalories(e.target.value)}
                              className="input-field py-1 px-2 w-20 text-sm font-tabular"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveEdit(meal.id);
                                if (e.key === 'Escape') setEditingId(null);
                              }}
                            />
                            <button
                              onClick={() => saveEdit(meal.id)}
                              className="p-1 rounded text-success hover:bg-success-light transition-colors"
                              aria-label="Save calories"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1 rounded text-muted-foreground hover:bg-muted transition-colors"
                              aria-label="Cancel edit"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-sm font-bold text-foreground font-tabular">
                            {meal.calories.toLocaleString()}
                            <span className="text-xs font-normal text-muted-foreground ml-0.5">kcal</span>
                          </span>
                        )}
                      </td>

                      {/* Grams */}
                      <td className="table-td">
                        <span className="text-sm text-foreground font-tabular">{meal.grams}g</span>
                      </td>

                      {/* Protein */}
                      <td className="table-td">
                        <span className="text-sm font-medium text-secondary font-tabular">{meal.protein}g</span>
                      </td>

                      {/* Carbs */}
                      <td className="table-td">
                        <span className="text-sm font-medium text-primary font-tabular">{meal.carbs}g</span>
                      </td>

                      {/* Fat */}
                      <td className="table-td">
                        <span className="text-sm font-medium text-warning font-tabular">{meal.fat}g</span>
                      </td>

                      {/* Time */}
                      <td className="table-td">
                        <span className="text-sm text-muted-foreground font-tabular">{meal.loggedAt}</span>
                      </td>

                      {/* AI Confidence */}
                      <td className="table-td">
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${meal.aiConfidence >= 0.9 ? 'bg-success' : meal.aiConfidence >= 0.8 ? 'bg-warning' : 'bg-danger'}`}
                              style={{ width: `${meal.aiConfidence * 100}%` }}
                            />
                          </div>
                          <span className={`text-xs font-bold font-tabular ${meal.aiConfidence >= 0.9 ? 'text-success' : meal.aiConfidence >= 0.8 ? 'text-warning' : 'text-danger'}`}>
                            {Math.round(meal.aiConfidence * 100)}%
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="table-td text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                          <button
                            onClick={() => startEdit(meal)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-secondary hover:bg-cyan-light transition-all"
                            aria-label={`Edit calories for ${meal.name}`}
                            title="Edit calorie value"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => confirmDelete(meal)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-danger hover:bg-danger-light transition-all"
                            aria-label={`Delete ${meal.name}`}
                            title="Delete this meal entry — cannot be undone"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-5 py-4 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">
              Showing {Math.min((currentPage - 1) * pageSize + 1, sorted.length)}–{Math.min(currentPage * pageSize, sorted.length)} of {sorted.length} entries
            </span>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>Show</span>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                className="border border-border rounded-md px-1.5 py-0.5 text-xs bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {PAGE_SIZE_OPTIONS.map((s) => (
                  <option key={`pagesize-${s}`} value={s}>{s}</option>
                ))}
              </select>
              <span>per page</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="First page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
              .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                if (idx > 0 && typeof arr[idx - 1] === 'number' && (p as number) - (arr[idx - 1] as number) > 1) {
                  acc.push('...');
                }
                acc.push(p);
                return acc;
              }, [])
              .map((item, idx) =>
                item === '...' ? (
                  <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground text-sm">…</span>
                ) : (
                  <button
                    key={`page-${item}`}
                    onClick={() => setCurrentPage(item as number)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                      currentPage === item
                        ? 'bg-primary text-primary-foreground font-bold'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    {item}
                  </button>
                )
              )}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Last page"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Delete confirm modal */}
      {deleteTarget && (
        <DeleteConfirmModal
          mealName={deleteTarget.name}
          onConfirm={() => executeDelete(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* Bulk delete confirm */}
      {bulkDeletePending && (
        <DeleteConfirmModal
          mealName={`${selectedRows.size} selected meal${selectedRows.size > 1 ? 's' : ''}`}
          onConfirm={executeBulkDelete}
          onCancel={() => setBulkDeletePending(false)}
          isBulk
        />
      )}
    </>
  );
}