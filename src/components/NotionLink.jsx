import React from 'react';
import { ExternalLink } from 'lucide-react';

export default function NotionLink() {
  return (
    <a
      href="https://www.notion.so/Segundo-Cerebro-5d019a1a076345989474c3741930bd89"
      target="_blank"
      rel="noopener noreferrer"
      className="p-6 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark group transition-all duration-300 hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500 flex flex-col items-center justify-center text-center space-y-3 cursor-pointer"
    >
      <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
        <ExternalLink size={24} className="text-blue-600 dark:text-blue-400" />
      </div>
      <div>
        <h2 className="font-semibold text-text-light dark:text-text-dark group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
          Segundo Cerebro
        </h2>
        <p className="text-sm text-textMuted-light dark:text-textMuted-dark mt-1">
          Abrir Notion
        </p>
      </div>
    </a>
  );
}
