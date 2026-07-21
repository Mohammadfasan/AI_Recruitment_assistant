import React from 'react';

const Table = ({
  headers = [],
  data = [],
  renderRow,
  emptyMessage = 'No data available',
  onSort,
  sortConfig = { key: '', direction: '' }
}) => {
  const handleSortClick = (key) => {
    if (!onSort) return;
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    onSort(key, direction);
  };

  return (
    <div className="w-full overflow-x-auto border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 shadow-xs">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
            {headers.map((h, i) => (
              <th
                key={i}
                className={`py-3.5 px-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 select-none ${
                  h.align === 'right' ? 'text-right' : h.align === 'center' ? 'text-center' : 'text-left'
                } ${h.sortable ? 'cursor-pointer hover:text-zinc-950 dark:hover:text-zinc-50 transition-colors' : ''}`}
                onClick={() => h.sortable && handleSortClick(h.key)}
              >
                <div className={`flex items-center space-x-1 ${h.align === 'right' ? 'justify-end' : h.align === 'center' ? 'justify-center' : 'justify-start'}`}>
                  <span>{h.label}</span>
                  {h.sortable && sortConfig.key === h.key && (
                    <span>
                      {sortConfig.direction === 'ascending' ? (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
                        </svg>
                      ) : (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                        </svg>
                      )}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-sm text-zinc-700 dark:text-zinc-300">
          {data.length > 0 ? (
            data.map((item, index) => renderRow(item, index))
          ) : (
            <tr>
              <td colSpan={headers.length} className="py-12 text-center text-zinc-500 dark:text-zinc-400">
                <div className="flex flex-col items-center justify-center space-y-2">
                  <svg className="w-8 h-8 text-zinc-300 dark:text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0V9a2 2 0 00-2-2H6a2 2 0 00-2 2v2m16 4h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 15H4" />
                  </svg>
                  <span>{emptyMessage}</span>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
