import React from 'react';

const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', cancelText = 'Cancel', danger = false }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 dark:bg-black/70" onClick={onClose}>
            <div 
                className="bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-gray-200 dark:border-slate-700 p-6 max-w-md w-full mx-4" 
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-lg font-semibold mb-2 text-primary-deep dark:text-slate-100">
                    {title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                    {message}
                </p>
                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`px-4 py-2 rounded-md text-sm font-medium text-white transition-colors ${
                            danger 
                                ? 'bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600' 
                                : 'bg-blue-medium hover:bg-blue-dark dark:bg-blue-accent dark:hover:bg-blue-300'
                        }`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;

