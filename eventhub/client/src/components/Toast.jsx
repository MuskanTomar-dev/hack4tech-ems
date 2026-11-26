import { createContext, useCallback, useContext, useState } from 'react';

const Ctx = createContext(() => {});
export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const toast = useCallback((message, type = 'success') => {
    const id = Math.random();
    setItems((s) => [...s, { id, message, type }]);
    setTimeout(() => setItems((s) => s.filter((i) => i.id !== id)), 4000);
  }, []);
  const colors = { success: 'bg-emerald-600', error: 'bg-red-600', info: 'bg-slate-800' };
  return (
    <Ctx.Provider value={toast}>
      {children}
      <div className="fixed right-4 top-4 z-50 flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2">
        {items.map((i) => (
          <div key={i.id} className={`${colors[i.type]} rounded-lg px-4 py-3 text-sm text-white shadow-lg`}>{i.message}</div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
