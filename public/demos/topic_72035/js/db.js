// ============================================
// Database Layer — IndexedDB via localForage
// ============================================

const DB = (() => {
  const stores = {};

  function init() {
    stores.companies = localforage.createInstance({
      name: 'JobHuntDB',
      storeName: 'companies'
    });
    stores.resumes = localforage.createInstance({
      name: 'JobHuntDB',
      storeName: 'resumes'
    });
    stores.config = localforage.createInstance({
      name: 'JobHuntDB',
      storeName: 'config'
    });
    stores.intel = localforage.createInstance({
      name: 'JobHuntDB',
      storeName: 'companyIntel'
    });
    stores.bookmarks = localforage.createInstance({
      name: 'JobHuntDB',
      storeName: 'filterBookmarks'
    });
  }

  // --- Companies ---
  async function getAllCompanies() {
    const result = [];
    await stores.companies.iterate((value) => {
      result.push(value);
    });
    return result;
  }

  async function getCompany(id) {
    return await stores.companies.getItem(id);
  }

  async function saveCompany(company) {
    company.updatedAt = Date.now();
    await stores.companies.setItem(company.id, company);
    return company;
  }

  async function saveCompanies(companies) {
    const now = Date.now();
    let saved = 0;
    for (const c of companies) {
      if (!c.createdAt) c.createdAt = now;
      c.updatedAt = now;
      try {
        await stores.companies.setItem(c.id, c);
        saved++;
      } catch (e) {
        console.error('[DB] Failed to save company', c.id, c.companyName, e);
      }
    }
    return saved;
  }

  async function deleteCompany(id) {
    await stores.companies.removeItem(id);
  }

  async function clearCompanies() {
    await stores.companies.clear();
  }

  // Incremental import: merge new data with existing
  async function importCompanies(newCompanies) {
    const existing = await getAllCompanies();
    const existingMap = new Map(existing.map(c => [c.id, c]));

    let added = 0, updated = 0, skipped = 0;

    for (const nc of newCompanies) {
      const ex = existingMap.get(nc.id);
      if (!ex) {
        // New company
        nc.createdAt = Date.now();
        nc.updatedAt = Date.now();
        nc.isFavorite = false;
        nc.applyStatus = '未投递';
        nc.notes = '';
        nc.tags = [];
        nc.matchScore = null;
        nc.starRating = null;
        nc.matchReason = null;
        await stores.companies.setItem(nc.id, nc);
        added++;
      } else {
        // Check if data changed (compare updateTime)
        if (nc.updateTime && ex.updateTime && nc.updateTime !== ex.updateTime) {
          // Update core fields, preserve user data
          const preserved = {
            isFavorite: ex.isFavorite,
            applyStatus: ex.applyStatus,
            notes: ex.notes,
            tags: ex.tags,
            matchScore: ex.matchScore,
            starRating: ex.starRating,
            matchReason: ex.matchReason,
            createdAt: ex.createdAt,
          };
          await stores.companies.setItem(nc.id, { ...nc, ...preserved, updatedAt: Date.now() });
          updated++;
        } else {
          skipped++;
        }
      }
    }

    return { added, updated, skipped, total: newCompanies.length };
  }

  // --- Config ---
  async function getConfig() {
    return await stores.config.getItem('userConfig') || {
      llmProvider: 'zhipu',
      apiBaseUrl: 'https://open.bigmodel.cn/api/paas/v4',
      apiKey: '',
      modelName: 'glm-4-flash',
      maxTokens: 4096,
      temperature: 0.3,
      theme: 'light',
      pageSize: 20,
    };
  }

  async function saveConfig(config) {
    await stores.config.setItem('userConfig', config);
  }

  // --- Resume ---
  async function getResume() {
    const result = [];
    await stores.resumes.iterate((v) => result.push(v));
    return result[0] || null;
  }

  async function saveResume(resume) {
    if (!resume.id) resume.id = 'resume_' + Date.now();
    resume.uploadedAt = Date.now();
    await stores.resumes.setItem(resume.id, resume);
    return resume;
  }

  // --- Intel ---
  async function getIntel(companyName) {
    return await stores.intel.getItem(companyName);
  }

  async function saveIntel(intel) {
    intel.searchedAt = Date.now();
    await stores.intel.setItem(intel.companyName, intel);
    return intel;
  }

  // --- Backup ---
  async function exportAll() {
    const companies = await getAllCompanies();
    const config = await getConfig();
    const resume = await getResume();
    return { companies, config, resume, exportDate: new Date().toISOString() };
  }

  async function clearAll() {
    await stores.companies.clear();
    await stores.resumes.clear();
    await stores.intel.clear();
  }

  return {
    init,
    getAllCompanies,
    getCompany,
    saveCompany,
    saveCompanies,
    deleteCompany,
    clearCompanies,
    importCompanies,
    getConfig,
    saveConfig,
    getResume,
    saveResume,
    getIntel,
    saveIntel,
    exportAll,
    clearAll,
  };
})();
