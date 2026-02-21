const hasStorage = () => typeof window !== "undefined" && !!window.localStorage;

export const saveData = (key, data) => {
  if (!hasStorage()) return;
  localStorage.setItem(key, JSON.stringify(data));
};

export const getData = (key, defaultValue = null) => {
  if (!hasStorage()) return defaultValue;
  const raw = localStorage.getItem(key);
  if (raw === null) return defaultValue;
  try {
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
};

export const removeData = (key) => {
  if (!hasStorage()) return;
  localStorage.removeItem(key);
};
