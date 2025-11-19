import React from 'react';
import { RequestStatus } from '../../types';

const statusColors: Record<RequestStatus, string> = {
  [RequestStatus.SENT]: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  [RequestStatus.VIEWED]: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
  [RequestStatus.IN_PROGRESS]: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  [RequestStatus.WAITING_CLIENT]: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  [RequestStatus.RESOLVED]: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  [RequestStatus.CANCELLED]: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
};

export const StatusBadge: React.FC<{ status: RequestStatus }> = ({ status }) => {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status]}`}>
      {status}
    </span>
  );
};

export const PriorityBadge: React.FC<{ priority: string }> = ({ priority }) => {
  const colors: Record<string, string> = {
    Low: "text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-400",
    Medium: "text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400",
    High: "text-orange-600 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400",
    Critical: "text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400"
  };
  
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors[priority] || colors.Low}`}>
      {priority}
    </span>
  );
};