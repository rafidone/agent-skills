function splitCents(totalCents, shares) {
  const base = Math.floor(totalCents / shares);
  return Array.from({ length: shares }, () => base);
}

module.exports = { splitCents };
