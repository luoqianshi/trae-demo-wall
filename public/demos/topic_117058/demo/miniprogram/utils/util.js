const padZero = n => (n < 10 ? '0' + n : '' + n);

const formatClock = timeStr => {
  if (!timeStr) return '';
  const date = new Date(timeStr);
  return `${date.getHours()}:${padZero(date.getMinutes())}`;
};

const formatDate = dateStr => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${padZero(date.getMonth() + 1)}-${padZero(date.getDate())}`;
};

module.exports = {
  padZero,
  formatClock,
  formatDate
};
