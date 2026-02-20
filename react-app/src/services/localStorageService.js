export const saveData = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const getData = (key, defaultValue = null) => {
  const raw = localStorage.getItem(key);
  if (raw === null) return defaultValue;
  try {
    return JSON.parse(raw);
  } catch (error) {
    return defaultValue;
  }
};

export const removeData = (key) => {
  localStorage.removeItem(key);
};
