/**
 * 本地存储管理模块
 * 使用 localStorage 持久化存储健康卡数据
 */

const Storage = {
    KEYS: {
        PERSONS: 'jikou_persons',
        FAMILIES: 'jikou_families',
        DISCLAIMER: 'jikou_disclaimer_accepted',
        ELDER_MODE: 'jikou_elder_mode'
    },

    // 个人健康卡 CRUD
    getPersons() {
        try {
            const data = localStorage.getItem(this.KEYS.PERSONS);
            return data ? JSON.parse(data) : [];
        } catch (err) {
            console.warn('Storage.getPersons 失败:', err);
            return [];
        }
    },

    savePerson(person) {
        try {
            const persons = this.getPersons();
            const index = persons.findIndex(p => p.id === person.id);
            if (index >= 0) {
                persons[index] = person;
            } else {
                person.id = person.id || Date.now().toString();
                persons.push(person);
            }
            localStorage.setItem(this.KEYS.PERSONS, JSON.stringify(persons));
            return person;
        } catch (err) {
            console.warn('Storage.savePerson 失败:', err);
            return null;
        }
    },

    deletePerson(id) {
        try {
            const persons = this.getPersons().filter(p => p.id !== id);
            localStorage.setItem(this.KEYS.PERSONS, JSON.stringify(persons));
            // 同时从家庭组中移除
            const families = this.getFamilies();
            families.forEach(f => {
                f.members = f.members.filter(m => m !== id);
            });
            localStorage.setItem(this.KEYS.FAMILIES, JSON.stringify(families));
        } catch (err) {
            console.warn('Storage.deletePerson 失败:', err);
        }
    },

    getPerson(id) {
        return this.getPersons().find(p => p.id === id);
    },

    // 家庭组 CRUD
    getFamilies() {
        try {
            const data = localStorage.getItem(this.KEYS.FAMILIES);
            return data ? JSON.parse(data) : [];
        } catch (err) {
            console.warn('Storage.getFamilies 失败:', err);
            return [];
        }
    },

    saveFamily(family) {
        try {
            const families = this.getFamilies();
            const index = families.findIndex(f => f.id === family.id);
            if (index >= 0) {
                families[index] = family;
            } else {
                family.id = family.id || Date.now().toString();
                families.push(family);
            }
            localStorage.setItem(this.KEYS.FAMILIES, JSON.stringify(families));
            return family;
        } catch (err) {
            console.warn('Storage.saveFamily 失败:', err);
            return null;
        }
    },

    deleteFamily(id) {
        try {
            const families = this.getFamilies().filter(f => f.id !== id);
            localStorage.setItem(this.KEYS.FAMILIES, JSON.stringify(families));
        } catch (err) {
            console.warn('Storage.deleteFamily 失败:', err);
        }
    },

    getFamily(id) {
        return this.getFamilies().find(f => f.id === id);
    },

    // 免责声明
    isDisclaimerAccepted() {
        try {
            return localStorage.getItem(this.KEYS.DISCLAIMER) === 'true';
        } catch (err) {
            return false;
        }
    },

    acceptDisclaimer() {
        try {
            localStorage.setItem(this.KEYS.DISCLAIMER, 'true');
        } catch (err) {
            console.warn('Storage.acceptDisclaimer 失败:', err);
        }
    },

    // 长辈模式
    getElderMode() {
        try {
            return localStorage.getItem(this.KEYS.ELDER_MODE) === 'true';
        } catch (err) {
            return false;
        }
    },

    setElderMode(enabled) {
        try {
            localStorage.setItem(this.KEYS.ELDER_MODE, enabled ? 'true' : 'false');
        } catch (err) {
            console.warn('Storage.setElderMode 失败:', err);
        }
    },

    // 获取家庭组成员详情
    getFamilyMembers(familyId) {
        try {
            const family = this.getFamily(familyId);
            if (!family) return [];
            const persons = this.getPersons();
            return family.members.map(id => persons.find(p => p.id === id)).filter(Boolean);
        } catch (err) {
            console.warn('Storage.getFamilyMembers 失败:', err);
            return [];
        }
    },

    // 清空所有数据（调试用）
    clearAll() {
        localStorage.removeItem(this.KEYS.PERSONS);
        localStorage.removeItem(this.KEYS.FAMILIES);
        localStorage.removeItem(this.KEYS.DISCLAIMER);
    }
};
