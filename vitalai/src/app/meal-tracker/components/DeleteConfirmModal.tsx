'use client';

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface DeleteConfirmModalProps {
  mealName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isBulk?: boolean;
}

export default function DeleteConfirmModal({
  mealName,
  onConfirm,
  onCancel,
  isBulk = false,
}: DeleteConfirmModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-foreground/30 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative bg-card rounded-2xl border border-border shadow-modal w-full max-w-md p-6 modal-enter">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-danger-light flex items-center justify-center">
            <AlertTriangle className="w-7 h-7 text-danger" />
          </div>

          <div>
            <h2 id="delete-modal-title" className="text-lg font-bold text-foreground mb-1">
              {isBulk ? 'Delete selected meals?' : 'Delete this meal?'}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {isBulk
                ? `You are about to permanently delete ${mealName}. This will remove them from your daily log and cannot be undone.`
                : `"${mealName}" will be permanently removed from your daily log. This cannot be undone.`}
            </p>
          </div>

          <div className="flex gap-3 w-full">
            <button
              onClick={onCancel}
              className="btn-secondary flex-1 py-2.5"
            >
              Keep It
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-2.5 bg-danger text-white font-semibold rounded-lg hover:bg-red-700 active:scale-95 transition-all duration-150"
            >
              {isBulk ? 'Delete All' : 'Delete Meal'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}