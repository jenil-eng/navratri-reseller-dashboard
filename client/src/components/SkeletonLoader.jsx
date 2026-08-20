import React from 'react';

export function StatCardSkeleton() {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="h-4 bg-slate-200 rounded w-24"></div>
        <div className="w-8 h-8 bg-slate-200 rounded-lg"></div>
      </div>
      <div className="h-8 bg-slate-200 rounded w-32 mb-2"></div>
      <div className="h-3 bg-slate-200 rounded w-20"></div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 8 }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden animate-pulse">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <div className="h-5 bg-slate-200 rounded w-32"></div>
        <div className="h-8 bg-slate-200 rounded w-24"></div>
      </div>
      <div className="p-4 space-y-4">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex gap-4 items-center">
            {Array.from({ length: cols }).map((_, c) => (
              <div key={c} className="h-4 bg-slate-200 rounded flex-1"></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm animate-pulse h-80 flex flex-col justify-between">
      <div className="h-5 bg-slate-200 rounded w-48 mb-4"></div>
      <div className="flex-1 bg-slate-100 rounded-xl flex items-end justify-between p-4 gap-2">
        <div className="w-8 bg-slate-200 h-1/3 rounded"></div>
        <div className="w-8 bg-slate-200 h-2/3 rounded"></div>
        <div className="w-8 bg-slate-200 h-1/2 rounded"></div>
        <div className="w-8 bg-slate-200 h-3/4 rounded"></div>
        <div className="w-8 bg-slate-200 h-2/5 rounded"></div>
      </div>
    </div>
  );
}
