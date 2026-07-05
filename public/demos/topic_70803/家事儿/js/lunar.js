const Lunar = {
    lunarInfo: [
        0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2,
        0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977,
        0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970,
        0x06566, 0x0d4a0, 0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950,
        0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557,
        0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5b0, 0x14573, 0x052b0, 0x0a9a8, 0x0e950, 0x06aa0,
        0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0,
        0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b6a0, 0x195a6,
        0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570,
        0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x055c0, 0x0ab60, 0x096d5, 0x092e0,
        0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5,
        0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930,
        0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530,
        0x05aa0, 0x076a3, 0x096d0, 0x04afb, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45,
        0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0,
        0x14b63, 0x09370, 0x049f8, 0x04970, 0x064b0, 0x168a6, 0x0ea50, 0x06b20, 0x1a6c4, 0x0aae0,
        0x0a2e0, 0x0d2e3, 0x0c960, 0x0d557, 0x0d4a0, 0x0da50, 0x05d55, 0x056a0, 0x0a6d0, 0x055d4,
        0x052d0, 0x0a9b8, 0x0a950, 0x0b4a0, 0x0b6a6, 0x0ad50, 0x055a0, 0x0aba4, 0x0a5b0, 0x052b0,
        0x0b273, 0x06930, 0x07337, 0x06aa0, 0x0ad50, 0x14b55, 0x04b60, 0x0a570, 0x054e4, 0x0d160,
        0x0e968, 0x0d520, 0x0daa0, 0x16aa6, 0x056d0, 0x04ae0, 0x0a9d4, 0x0a2d0, 0x0d150, 0x0f252,
        0x0d520
    ],

    Gan: ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'],
    Zhi: ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'],
    Animals: ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'],
    nStr1: ['日', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'],
    nStr2: ['初', '十', '廿', '卅'],
    monthName: ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊'],

    lYearDays(y) {
        let i, sum = 348;
        for (i = 0x8000; i > 0x8; i >>= 1) {
            sum += (this.lunarInfo[y - 1900] & i) ? 1 : 0;
        }
        return (sum + this.leapDays(y));
    },

    leapMonth(y) {
        return (this.lunarInfo[y - 1900] & 0xf);
    },

    leapDays(y) {
        if (this.leapMonth(y)) {
            return ((this.lunarInfo[y - 1900] & 0x10000) ? 30 : 29);
        } else {
            return (0);
        }
    },

    monthDays(y, m) {
        return ((this.lunarInfo[y - 1900] & (0x10000 >> m)) ? 30 : 29);
    },

    toLunar(date) {
        let i, leap = 0, temp = 0;
        let baseYear = 1900;
        let baseDate = new Date(1900, 0, 31);
        let offset = Math.floor((date - baseDate) / 86400000);

        for (i = 1900; i < 2100 && offset > 0; i++) {
            temp = this.lYearDays(i);
            offset -= temp;
        }
        if (offset < 0) {
            offset += temp;
            i--;
        }

        let year = i;
        leap = this.leapMonth(i);
        let isLeap = false;

        for (i = 1; i < 13 && offset > 0; i++) {
            if (leap > 0 && i === (leap + 1) && isLeap === false) {
                --i;
                isLeap = true;
                temp = this.leapDays(year);
            } else {
                temp = this.monthDays(year, i);
            }

            if (isLeap === true && i === (leap + 1)) isLeap = false;
            offset -= temp;
        }

        if (offset === 0 && leap > 0 && i === leap + 1) {
            if (isLeap) {
                isLeap = false;
            } else {
                isLeap = true;
                --i;
            }
        }

        if (offset < 0) {
            offset += temp;
            --i;
        }

        let month = i;
        let day = offset + 1;

        return { year, month, day, isLeap };
    },

    toSolar(lunarYear, lunarMonth, lunarDay, isLeap) {
        let i, leap = 0, temp = 0;
        let baseYear = 1900;
        let baseDate = new Date(1900, 0, 31);
        let offset = 0;

        for (i = 1900; i < lunarYear; i++) {
            offset += this.lYearDays(i);
        }

        leap = this.leapMonth(lunarYear);
        let isAdd = false;

        for (i = 1; i < lunarMonth; i++) {
            if (leap <= 0 || i !== leap + 1 || isAdd === false) {
                temp = this.monthDays(lunarYear, i);
            } else {
                temp = this.leapDays(lunarYear);
            }
            if (i === leap && isLeap) {
                isAdd = true;
                offset += this.leapDays(lunarYear);
            } else {
                offset += temp;
            }
        }

        if (isLeap && leap === lunarMonth) {
            offset += this.leapDays(lunarYear);
        } else {
            offset += this.monthDays(lunarYear, lunarMonth);
        }

        offset += lunarDay - 1;

        let resultDate = new Date(baseDate.getTime() + offset * 86400000);
        return {
            year: resultDate.getFullYear(),
            month: resultDate.getMonth() + 1,
            day: resultDate.getDate()
        };
    },

    lunarToSolarYear(lunarMonth, lunarDay, targetYear, isLeap = false) {
        try {
            let result = this.toSolar(targetYear, lunarMonth, lunarDay, isLeap);
            let resultDate = new Date(result.year, result.month - 1, result.day);
            if (resultDate.getFullYear() !== targetYear) {
                result = this.toSolar(targetYear, lunarMonth, lunarDay - 1, isLeap);
                resultDate = new Date(result.year, result.month - 1, result.day);
            }
            return result;
        } catch (e) {
            return null;
        }
    },

    getAnimalZodiac(year) {
        return this.Animals[(year - 4) % 12];
    },

    getGanZhi(year) {
        return this.Gan[(year - 4) % 10] + this.Zhi[(year - 4) % 12];
    },

    toChinaDay(d) {
        let s;
        switch (d) {
            case 10:
                s = '初十';
                break;
            case 20:
                s = '二十';
                break;
            case 30:
                s = '三十';
                break;
            default:
                s = this.nStr2[Math.floor(d / 10)];
                s += this.nStr1[d % 10];
        }
        return (s);
    },

    toChinaMonth(m, isLeap) {
        return (isLeap ? '闰' : '') + this.monthName[m - 1] + '月';
    },

    formatLunar(lunar) {
        return `${lunar.year}年${this.toChinaMonth(lunar.month, lunar.isLeap)}${this.toChinaDay(lunar.day)}`;
    },

    getDaysInMonth(year, month) {
        return new Date(year, month, 0).getDate();
    },

    getUpcomingEventsThisYear(events) {
        const today = new Date();
        const thisYear = today.getFullYear();
        const result = [];

        events.forEach(event => {
            let solarDate;
            let eventYear = event.year || thisYear;

            if (event.isLunar) {
                for (let y = thisYear; y <= thisYear + 1; y++) {
                    const s = this.lunarToSolarYear(event.month, event.day, y);
                    if (s) {
                        const d = new Date(s.year, s.month - 1, s.day);
                        if (d >= today) {
                            solarDate = d;
                            break;
                        }
                    }
                }
            } else {
                let y = event.repeatYearly ? thisYear : eventYear;
                while (true) {
                    const maxDay = this.getDaysInMonth(y, event.month);
                    const day = Math.min(event.day, maxDay);
                    const d = new Date(y, event.month - 1, day);
                    if (d >= today || !event.repeatYearly) {
                        solarDate = d;
                        break;
                    }
                    y++;
                }
            }

            if (solarDate) {
                const diffDays = Math.ceil((solarDate - today) / (1000 * 60 * 60 * 24));
                if (diffDays <= 365) {
                    result.push({
                        ...event,
                        solarDate,
                        diffDays
                    });
                }
            }
        });

        return result.sort((a, b) => a.diffDays - b.diffDays);
    }
};
