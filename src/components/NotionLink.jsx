import { ExternalLink } from 'lucide-react';

export default function NotionLink() {
  return (
    <a
      href="https://www.notion.so/Segundo-Cerebro-5d019a1a076345989474c3741930bd89"
      target="_blank"
      rel="noopener noreferrer"
      className="p-6 rounded-3xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark dark:backdrop-blur-md group transition-all duration-300 ease-soft-out shadow-soft-sm dark:shadow-soft-dark-sm hover:scale-[1.015] hover:shadow-soft-md dark:hover:shadow-soft-dark-md hover:border-neutral-400 dark:hover:border-neutral-500 active:scale-[0.99] flex flex-col items-center justify-center text-center space-y-3 cursor-pointer"
    >
      <div className="w-12 h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800/40 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 ease-soft-out">
        <ExternalLink size={24} className="text-neutral-900 dark:text-neutral-100" />
      </div>
      <div>
        <h2 className="font-semibold text-text-light dark:text-text-dark group-hover:text-neutral-900 dark:group-hover:text-neutral-100 transition-colors duration-300 ease-soft-out">
          Segundo Cerebro
        </h2>
        <p className="text-sm text-textMuted-light dark:text-textMuted-dark mt-1">
          Abrir Notion
        </p>
      </div>
    </a>
  );
}
