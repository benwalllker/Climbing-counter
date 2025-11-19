const calculatePoints = (grade, attempts) => {
  if (grade === 0) return 0;
  if (grade === 1) return 1;
  if (grade === 2) return attempts <= 2 ? 2 : 1;
  if (grade >= 3) {
    if (attempts === 1) return 3;
    if (attempts === 2) return 2;
    return 1;
  }
  return 0;
};

export { calculatePoints };