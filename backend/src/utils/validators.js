export const isPositiveInt = (v) => {
  const n = Number(v);
  return Number.isInteger(n) && n >= 0;
};

export const isValidDateString = (s) => {
  if (!s) return false;
  const d = new Date(s);
  return !Number.isNaN(d.getTime());
};
