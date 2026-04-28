// ============================================
// 天气预报 - Open-Meteo API
// 获取2026年五一期间（5月1日-5月5日）逐日预报
// ============================================

(function() {
  'use strict';

  const OPEN_METEO_BASE = 'https://api.open-meteo.com/v1';

  // 行程日期配置
  const TRIP_DATES = ['2026-05-01', '2026-05-02', '2026-05-03', '2026-05-04', '2026-05-05'];

  // 城市经纬度
  const CITY_COORDS = {
    '高邮': { lat: 32.7841, lon: 119.4365 },
    '连云港': { lat: 34.7556, lon: 119.4608 },
    '日照': { lat: 35.4187, lon: 119.5389 },
    '徐州': { lat: 34.2312, lon: 117.1823 }
  };

  // 预报数据缓存：{ 城市: { 日期: 数据 } }
  let forecastCache = {};
  let lastUpdateTime = null;

  /**
   * 获取指定城市、指定日期的预报
   */
  async function fetchForecast(cityName, date) {
    const coords = CITY_COORDS[cityName];
    if (!coords) throw new Error('未知城市: ' + cityName);

    const url = `${OPEN_METEO_BASE}/forecast?latitude=${coords.lat}&longitude=${coords.lon}&daily=weather_code,temperature_2m_max,temperature_2m_min,uv_index_max&timezone=Asia/Shanghai&start_date=${date}&end_date=${date}`;

    const response = await fetch(url);
    if (!response.ok) throw new Error('HTTP ' + response.status);

    const data = await response.json();
    const day = data.daily;

    return {
      city: cityName,
      date: date,
      maxTemp: Math.round(day.temperature_2m_max[0]),
      minTemp: Math.round(day.temperature_2m_min[0]),
      weatherCode: day.weather_code[0],
      uvIndex: day.uv_index_max[0]
    };
  }

  /**
   * 获取城市5天完整预报
   */
  async function fetchCityForecast(cityName) {
    const coords = CITY_COORDS[cityName];
    const start = TRIP_DATES[0];
    const end = TRIP_DATES[TRIP_DATES.length - 1];

    const url = `${OPEN_METEO_BASE}/forecast?latitude=${coords.lat}&longitude=${coords.lon}&daily=weather_code,temperature_2m_max,temperature_2m_min,uv_index_max&timezone=Asia/Shanghai&start_date=${start}&end_date=${end}`;

    const response = await fetch(url);
    if (!response.ok) throw new Error('HTTP ' + response.status);

    const data = await response.json();
    const daily = data.daily;

    const result = {};
    for (let i = 0; i < daily.time.length; i++) {
      result[daily.time[i]] = {
        city: cityName,
        date: daily.time[i],
        maxTemp: Math.round(daily.temperature_2m_max[i]),
        minTemp: Math.round(daily.temperature_2m_min[i]),
        weatherCode: daily.weather_code[i],
        uvIndex: daily.uv_index_max[i]
      };
    }
    return result;
  }

  /**
   * WMO天气代码转中文
   */
  function codeToWeather(code) {
    const map = {
      0: '晴', 1: '晴间多云', 2: '多云', 3: '阴',
      45: '雾', 48: '雾凇',
      51: '毛毛雨', 53: '小雨', 55: '中雨',
      56: '冻毛毛雨', 57: '冻雨',
      61: '小雨', 63: '中雨', 65: '大雨',
      66: '冻小雨', 67: '冻大雨',
      71: '小雪', 73: '中雪', 75: '大雪', 77: '雪粒',
      80: '阵雨', 81: '强阵雨', 82: '暴雨',
      85: '阵雪', 86: '强阵雪',
      95: '雷雨', 96: '雷雨伴冰雹', 99: '强雷雨伴冰雹'
    };
    return map[code] || '多云';
  }

  /**
   * WMO天气代码转Emoji
   */
  function codeToEmoji(code) {
    if (code === 0 || code === 1) return '☀️';
    if (code === 2) return '🌤️';
    if (code === 3) return '☁️';
    if (code === 45 || code === 48) return '🌫️';
    if (code >= 51 && code <= 57) return '🌦️';
    if (code >= 61 && code <= 67) return '🌧️';
    if (code >= 71 && code <= 77) return '❄️';
    if (code >= 80 && code <= 82) return '⛈️';
    if (code >= 85 && code <= 86) return '🌨️';
    if (code >= 95) return '⛈️';
    return '🌤️';
  }

  /**
   * 天气转心情描述
   */
  function weatherToMood(weather, maxTemp) {
    if (weather.includes('雨')) return '有雨，记得带伞☔';
    if (weather.includes('雪')) return '下雪了，注意保暖❄️';
    if (weather.includes('雾')) return '能见度低，开车小心🌫️';
    if (weather.includes('雷')) return '雷雨天气，注意安全⛈️';
    if (maxTemp >= 30) return '天气炎热，注意防暑🌞';
    if (maxTemp <= 15) return '天气较凉，多穿点🧥';
    if (weather.includes('晴')) return '阳光明媚，适合出游☀️';
    if (weather.includes('云')) return '多云天气，舒适宜人⛅';
    return '天气不错，玩得开心🌤️';
  }

  /**
   * 天气转穿衣建议
   */
  function weatherToClothes(weather, maxTemp, minTemp) {
    if (weather.includes('雨')) return '雨衣/雨伞+防滑鞋';
    if (weather.includes('雪')) return '羽绒服+保暖内衣+雪地靴';
    if (maxTemp >= 30) return '短袖+防晒衣+墨镜';
    if (maxTemp >= 25) return '短袖+薄外套（备用）';
    if (maxTemp >= 20) return '薄长袖+外套';
    if (minTemp <= 12) return '厚外套+长袖';
    return '长袖+中等厚度外套';
  }

  /**
   * 加载所有城市预报
   */
  async function loadAllForecasts() {
    const cities = Object.keys(CITY_COORDS);
    const promises = cities.map(city =>
      fetchCityForecast(city).catch(err => {
        console.warn(`获取${city}预报失败:`, err);
        return null;
      })
    );

    const results = await Promise.all(promises);

    results.forEach((cityData, idx) => {
      if (cityData) {
        const cityName = cities[idx];
        forecastCache[cityName] = cityData;
      }
    });

    lastUpdateTime = new Date();

    window.dispatchEvent(new CustomEvent('forecastLoaded', {
      detail: { cache: forecastCache, time: lastUpdateTime }
    }));

    return forecastCache;
  }

  /**
   * 获取指定城市、指定日期的预报数据
   */
  function getForecast(cityName, dateStr) {
    const cityData = forecastCache[cityName];
    if (!cityData) return null;

    const dayData = cityData[dateStr];
    if (!dayData) return null;

    const weather = codeToWeather(dayData.weatherCode);
    return {
      city: cityName,
      date: dateStr,
      temp: `${dayData.minTemp}~${dayData.maxTemp}°C`,
      icon: codeToEmoji(dayData.weatherCode),
      weather: weather,
      mood: weatherToMood(weather, dayData.maxTemp),
      clothes: weatherToClothes(weather, dayData.maxTemp, dayData.minTemp),
      uvIndex: dayData.uvIndex,
      raw: dayData
    };
  }

  /**
   * 根据dayIndex获取对应日期的预报
   */
  function getForecastByDayIndex(cityName, dayIndex) {
    const dateStr = TRIP_DATES[dayIndex];
    if (!dateStr) return null;
    return getForecast(cityName, dateStr);
  }

  /**
   * 获取实时天气（顶部播报员用）
   */
  async function fetchLiveWeather(cityName) {
    const coords = CITY_COORDS[cityName];
    const url = `${OPEN_METEO_BASE}/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,weather_code&timezone=Asia/Shanghai`;

    const response = await fetch(url);
    const data = await response.json();
    const current = data.current;

    return {
      city: cityName,
      temperature: Math.round(current.temperature_2m),
      weatherCode: current.weather_code
    };
  }

  /**
   * 获取所有城市实时天气（播报员用）
   */
  async function refreshLiveWeather() {
    const cities = Object.keys(CITY_COORDS);
    const promises = cities.map(city =>
      fetchLiveWeather(city).catch(() => null)
    );
    const results = await Promise.all(promises);
    return results.filter(r => r !== null);
  }

  // 公开API
  window.WeatherAPI = {
    loadForecasts: loadAllForecasts,
    getForecast: getForecast,
    getForecastByDay: getForecastByDayIndex,
    refreshLive: refreshLiveWeather,
    getCache: () => forecastCache,
    codeToEmoji: codeToEmoji,
    TRIP_DATES: TRIP_DATES
  };

})();
