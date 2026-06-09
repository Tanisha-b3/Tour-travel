export function shapePage(data, total, page, limit) {
  const safePage  = Math.max(1, Number(page)  || 1);
  const safeLimit = Math.max(1, Number(limit) || 12);
  const totalNum  = Number.isFinite(Number(total)) ? Number(total) : (Array.isArray(data) ? data.length : 0);
  const totalPages = Math.max(1, Math.ceil(totalNum / safeLimit));
  return {
    data: Array.isArray(data) ? data : [],
    pagination: {
      page: safePage,
      limit: safeLimit,
      total: totalNum,
      totalPages,
      hasMore: safePage < totalPages,
    },
  };
}

export function emptyPage(page, limit) {
  return shapePage([], 0, page, limit);
}

export default { shapePage, emptyPage };