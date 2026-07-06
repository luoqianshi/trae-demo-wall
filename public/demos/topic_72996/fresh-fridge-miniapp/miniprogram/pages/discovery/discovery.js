const app = getApp()
const Cloud = require('../../utils/cloud.js')
const Regions = require('../../data/regions.js')
const StorageUtils = require('../../utils/storage.js')

const SEASONS = [
  { key: 'spring', name: '春', icon: '🌸', months: [3, 4, 5], color: '#FF9FB5' },
  { key: 'summer', name: '夏', icon: '☀️', months: [6, 7, 8], color: '#FFB347' },
  { key: 'autumn', name: '秋', icon: '🍂', months: [9, 10, 11], color: '#D4835B' },
  { key: 'winter', name: '冬', icon: '❄️', months: [12, 1, 2], color: '#6BB5FF' }
]

const PAGE_SIZE = 20

Page({
  data: {
    activeTab: 'season',
    seasons: SEASONS,
    activeSeason: '',
    seasonFoods: [],
    seasonPage: 1,
    seasonHasMore: true,
    seasonLoading: false,

    provinces: [],
    cities: [],
    districts: [],
    provinceIndex: 0,
    cityIndex: 0,
    districtIndex: 0,
    selectedProvince: '',
    selectedCity: '',
    selectedDistrict: '',
    regionTab: 'local',
    regionFoods: [],
    regionPage: 1,
    regionHasMore: true,
    regionLoading: false,

    showRegionPicker: false,
    pickerProvinces: [],
    pickerCities: [],
    pickerDistricts: [],
    pickerProvinceIndex: 0,
    pickerCityIndex: 0,
    pickerDistrictIndex: 0
  },

  onLoad: function (options) {
    const currentSeason = app.globalData.currentSeason || this.getCurrentSeasonByMonth()
    const userInfo = StorageUtils.getUserInfo() || {}

    const provinces = Regions.getProvinces()
    let provinceIndex = 0
    let selectedProvince = provinces[0] ? provinces[0].name : ''

    if (userInfo.hometownProvince) {
      const idx = provinces.findIndex(p => p.name.includes(userInfo.hometownProvince))
      if (idx > -1) {
        provinceIndex = idx
        selectedProvince = provinces[idx].name
      }
    }

    const cities = Regions.getCities(provinces[provinceIndex].code)
    let cityIndex = 0
    let selectedCity = cities[0] ? cities[0].name : ''

    if (userInfo.hometownCity) {
      const idx = cities.findIndex(c => c.name.includes(userInfo.hometownCity))
      if (idx > -1) {
        cityIndex = idx
        selectedCity = cities[idx].name
      }
    }

    const districts = cities[cityIndex] ? Regions.getDistricts(cities[cityIndex].code) : []
    let districtIndex = 0
    let selectedDistrict = districts[0] ? districts[0].name : ''

    if (userInfo.hometownDistrict) {
      const idx = districts.findIndex(d => d.name.includes(userInfo.hometownDistrict))
      if (idx > -1) {
        districtIndex = idx
        selectedDistrict = districts[idx].name
      }
    }

    this.setData({
      activeSeason: currentSeason,
      provinces,
      cities,
      districts,
      provinceIndex,
      cityIndex,
      districtIndex,
      selectedProvince,
      selectedCity,
      selectedDistrict
    })

    this.loadSeasonFoods(true)
  },

  getCurrentSeasonByMonth: function () {
    const month = new Date().getMonth() + 1
    if (month >= 3 && month <= 5) return 'spring'
    if (month >= 6 && month <= 8) return 'summer'
    if (month >= 9 && month <= 11) return 'autumn'
    return 'winter'
  },

  onTabChange: function (e) {
    const tab = e.currentTarget.dataset.tab
    if (tab === this.data.activeTab) return

    this.setData({ activeTab: tab })

    if (tab === 'season' && this.data.seasonFoods.length === 0) {
      this.loadSeasonFoods(true)
    } else if (tab === 'region' && this.data.regionFoods.length === 0) {
      this.loadRegionFoods(true)
    }
  },

  onSeasonTap: function (e) {
    const seasonKey = e.currentTarget.dataset.season
    if (seasonKey === this.data.activeSeason) return

    this.setData({
      activeSeason: seasonKey,
      seasonFoods: [],
      seasonPage: 1,
      seasonHasMore: true
    })

    this.loadSeasonFoods(true)
  },

  loadSeasonFoods: function (refresh = false) {
    if (this.data.seasonLoading) return
    if (!refresh && !this.data.seasonHasMore) return

    this.setData({ seasonLoading: true })

    const season = SEASONS.find(s => s.key === this.data.activeSeason)
    const page = refresh ? 1 : this.data.seasonPage

    const query = {}
    if (season) {
      query.months = season.months
    }

    Cloud.callFunction('foodCRUD', {
      action: 'list',
      query,
      page,
      pageSize: PAGE_SIZE,
      sortBy: 'hotScore',
      sortOrder: 'desc'
    }).then(res => {
      if (res.success && res.data && res.data.success) {
        const newList = (res.data.data && res.data.data.list) || []
        const foods = refresh ? newList : this.data.seasonFoods.concat(newList)

        this.setData({
          seasonFoods: foods,
          seasonPage: page + 1,
          seasonHasMore: res.data.data ? res.data.data.hasMore !== false : false,
          seasonLoading: false
        })
      } else {
        this.setData({ seasonLoading: false })
      }

      if (refresh) {
        wx.stopPullDownRefresh()
      }
    }).catch(() => {
      this.setData({ seasonLoading: false })
      if (refresh) {
        wx.stopPullDownRefresh()
      }
    })
  },

  onRegionTabChange: function (e) {
    const tab = e.currentTarget.dataset.tab
    if (tab === this.data.regionTab) return

    this.setData({
      regionTab: tab,
      regionFoods: [],
      regionPage: 1,
      regionHasMore: true
    })

    this.loadRegionFoods(true)
  },

  loadRegionFoods: function (refresh = false) {
    if (this.data.regionLoading) return
    if (!refresh && !this.data.regionHasMore) return

    this.setData({ regionLoading: true })

    const page = refresh ? 1 : this.data.regionPage
    const query = {}

    if (this.data.selectedProvince) {
      query.originProvince = this.data.selectedProvince
    }
    if (this.data.selectedCity) {
      query.originCity = this.data.selectedCity
    }

    if (this.data.regionTab === 'local') {
      query.canMail = false
    } else {
      query.canMail = true
    }

    Cloud.callFunction('foodCRUD', {
      action: 'list',
      query,
      page,
      pageSize: PAGE_SIZE,
      sortBy: 'hotScore',
      sortOrder: 'desc'
    }).then(res => {
      if (res.success && res.data && res.data.success) {
        const newList = (res.data.data && res.data.data.list) || []
        const foods = refresh ? newList : this.data.regionFoods.concat(newList)

        this.setData({
          regionFoods: foods,
          regionPage: page + 1,
          regionHasMore: res.data.data ? res.data.data.hasMore !== false : false,
          regionLoading: false
        })
      } else {
        this.setData({ regionLoading: false })
      }

      if (refresh) {
        wx.stopPullDownRefresh()
      }
    }).catch(() => {
      this.setData({ regionLoading: false })
      if (refresh) {
        wx.stopPullDownRefresh()
      }
    })
  },

  openRegionPicker: function () {
    const pickerProvinces = this.data.provinces
    const pickerCities = this.data.cities
    const pickerDistricts = this.data.districts

    this.setData({
      showRegionPicker: true,
      pickerProvinces,
      pickerCities,
      pickerDistricts,
      pickerProvinceIndex: this.data.provinceIndex,
      pickerCityIndex: this.data.cityIndex,
      pickerDistrictIndex: this.data.districtIndex
    })
  },

  closeRegionPicker: function () {
    this.setData({ showRegionPicker: false })
  },

  onPickerChange: function (e) {
    const values = e.detail.value
    const newProvinceIndex = values[0]
    const newCityIndex = values[1]
    const newDistrictIndex = values[2]

    let pickerCities = this.data.pickerCities
    let pickerDistricts = this.data.pickerDistricts
    let finalCityIndex = newCityIndex
    let finalDistrictIndex = newDistrictIndex

    if (newProvinceIndex !== this.data.pickerProvinceIndex) {
      const province = this.data.pickerProvinces[newProvinceIndex]
      pickerCities = Regions.getCities(province.code)
      finalCityIndex = 0
      const firstCity = pickerCities[0]
      pickerDistricts = firstCity ? Regions.getDistricts(firstCity.code) : []
      finalDistrictIndex = 0
    } else if (newCityIndex !== this.data.pickerCityIndex) {
      const city = pickerCities[newCityIndex]
      pickerDistricts = city ? Regions.getDistricts(city.code) : []
      finalDistrictIndex = 0
    }

    this.setData({
      pickerProvinceIndex: newProvinceIndex,
      pickerCityIndex: finalCityIndex,
      pickerDistrictIndex: finalDistrictIndex,
      pickerCities,
      pickerDistricts
    })
  },

  confirmRegionPicker: function () {
    const province = this.data.pickerProvinces[this.data.pickerProvinceIndex]
    const city = this.data.pickerCities[this.data.pickerCityIndex]
    const district = this.data.pickerDistricts[this.data.pickerDistrictIndex]

    this.setData({
      showRegionPicker: false,
      provinceIndex: this.data.pickerProvinceIndex,
      cityIndex: this.data.pickerCityIndex,
      districtIndex: this.data.pickerDistrictIndex,
      cities: this.data.pickerCities,
      districts: this.data.pickerDistricts,
      selectedProvince: province ? province.name : '',
      selectedCity: city ? city.name : '',
      selectedDistrict: district ? district.name : '',
      regionFoods: [],
      regionPage: 1,
      regionHasMore: true
    })

    this.loadRegionFoods(true)
  },

  onFoodTap: function (e) {
    const foodId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/foodDetail/foodDetail?id=${foodId}`
    })
  },

  onPullDownRefresh: function () {
    if (this.data.activeTab === 'season') {
      this.setData({
        seasonFoods: [],
        seasonPage: 1,
        seasonHasMore: true
      })
      this.loadSeasonFoods(true)
    } else {
      this.setData({
        regionFoods: [],
        regionPage: 1,
        regionHasMore: true
      })
      this.loadRegionFoods(true)
    }
  },

  onReachBottom: function () {
    if (this.data.activeTab === 'season') {
      this.loadSeasonFoods(false)
    } else {
      this.loadRegionFoods(false)
    }
  },

  formatSeasonMonths: function (months) {
    if (!months || months.length === 0) return ''
    return months.map(m => m + '月').join('/')
  },

  onImageError: function (e) {
    const id = e.currentTarget.dataset.id
    const fallback = 'https://placehold.co/300x300/FF6B35/FFFFFF?text=Food'

    const replaceImage = (list) => {
      if (!list || list.length === 0) return list
      return list.map(item => {
        if (item._id === id) {
          return { ...item, images: [fallback] }
        }
        return item
      })
    }

    this.setData({
      seasonFoods: replaceImage(this.data.seasonFoods),
      regionFoods: replaceImage(this.data.regionFoods)
    })
  }
})
