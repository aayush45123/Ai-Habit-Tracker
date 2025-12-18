// server/src/utils/dateIST.js

const IST_OFFSET_MIN = 330; // +05:30

export const getTodayIST = () => {
  const now = new Date();
  const ist = new Date(now.getTime() + IST_OFFSET_MIN * 60000);
  return ist.toISOString().split("T")[0];
};

export const normalizeDateIST = (date) => {
  const d = new Date(date);
  const ist = new Date(d.getTime() + IST_OFFSET_MIN * 60000);
  return ist.toISOString().split("T")[0];
};

export const getYesterdayIST = () => {
  const now = new Date();
  now.setDate(now.getDate() - 1);
  const ist = new Date(now.getTime() + IST_OFFSET_MIN * 60000);
  return ist.toISOString().split("T")[0];
};
