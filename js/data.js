// ============================================
// 五一行程数据 - 高德坐标系 (GCJ-02)
// ============================================

const FAMILY = {
  members: [
    { name: "程老师", role: "爸爸", age: 59, emoji: "👨‍🦳", color: "#4a90d9", desc: "资深领航员", voice: "安全第一，慢慢开！" },
    { name: "都老师", role: "妈妈", age: 56, emoji: "👩‍🦳", color: "#e85d75", desc: "美食鉴赏家", voice: "该吃饭啦，别饿着！" },
    { name: "小庆", role: "儿子", age: null, emoji: "👨", color: "#27ae60", desc: "首席司机🚗", voice: "放心，我开车稳得很！" },
    { name: "香香", role: "儿媳", age: null, emoji: "👩", color: "#f39c12", desc: "替补司机📸", voice: "这里好美，快帮我拍照！" }
  ]
};

// 天气数据（模拟）
const WEATHER_DATA = {
  "高邮": { temp: "18-26°C", icon: "☀️", mood: "阳光明媚，适合出游", clothes: "薄长袖+防晒衣" },
  "连云港": { temp: "16-24°C", icon: "⛅", mood: "海风习习，凉爽宜人", clothes: "薄外套+长裤" },
  "日照": { temp: "17-25°C", icon: "☀️", mood: "阳光灿烂，海边完美", clothes: "短袖+防晒+外套" },
  "徐州": { temp: "19-28°C", icon: "☀️", mood: "温暖舒适，适合漫步", clothes: "薄长袖+休闲装" }
};

// 美食打卡清单
const FOOD_CHECKLIST = {
  "高邮": ["高邮阳春面", "蒲包肉", "高邮咸鸭蛋", "界首茶干"],
  "连云港": ["海鲜面", "清蒸海鱼", "蒜蓉扇贝", "凉粉"],
  "日照": ["海鲜水饺", "鲅鱼饺子", "小海鲜拼盘", "海沙子面"],
  "徐州": ["地锅鸡", "烙馍卷馓子", "蛙鱼", "sha汤", "蜜三刀", "徐州烧烤"]
};

// 家庭群聊消息
const CHAT_MESSAGES = [
  { sender: "都老师", emoji: "👩‍🦳", text: "早上好！今天几点出发呀？", time: "07:00" },
  { sender: "小庆", emoji: "👨", text: "程老师，导航已就绪，准备出发！", time: "07:30" },
  { sender: "程老师", emoji: "👨‍🦳", text: "好，我检查一下车况", time: "07:35" },
  { sender: "香香", emoji: "👩", text: "我带了零食和充电宝~", time: "07:40" },
  { sender: "都老师", emoji: "👩‍🦳", text: "记得给我拍美照哦", time: "07:45" },
  { sender: "小庆", emoji: "👨", text: "出发！🚗💨", time: "08:00" }
];

// 2. 时光轴数据
const TIMELINE_DATA = [
  { day: 1, date: '5/1', city: '高邮', emoji: '🏮', active: true },
  { day: 2, date: '5/2', city: '连云港', emoji: '🌊', active: false },
  { day: 3, date: '5/3', city: '日照', emoji: '🏖️', active: false },
  { day: 4, date: '5/4', city: '徐州', emoji: '🏛️', active: false },
  { day: 5, date: '5/5', city: '合肥', emoji: '🏠', active: false }
];

// 4. 打卡集章数据
const STAMP_DATA = [
  { name: '南门大街', emoji: '🏮', city: '高邮' },
  { name: '盂城驿', emoji: '📯', city: '高邮' },
  { name: '连岛沙滩', emoji: '🏖️', city: '连云港' },
  { name: '海上云台山', emoji: '⛰️', city: '连云港' },
  { name: '万平口', emoji: '🌊', city: '日照' },
  { name: '灯塔景区', emoji: '🗼', city: '日照' },
  { name: '云龙湖', emoji: '🏞️', city: '徐州' },
  { name: '户部山', emoji: '🏛️', city: '徐州' },
  { name: '东夷小镇', emoji: '🏮', city: '日照' }
];

// 6. 拍照姿势
const PHOTO_POSES = [
  { name: '海边跳跃', emoji: '🏃', desc: '背对镜头，跳起来' },
  { name: '古镇回眸', emoji: '💃', desc: '侧身回头，微笑' },
  { name: '举高高', emoji: '🙌', desc: '双手举过头顶' },
  { name: '背影杀', emoji: '🚶', desc: '背对镜头走路' },
  { name: '比个心', emoji: '❤️', desc: '双手比心' }
];

// 7. 方言翻译
const DIALECT_DATA = {
  '连云港': [
    { cn: '你好', local: '侬好', pinyin: 'nong hao' },
    { cn: '吃饭了吗', local: '七饭了伐', pinyin: 'qi fan le fa' },
    { cn: '谢谢', local: '霞霞', pinyin: 'xia xia' },
    { cn: '再见', local: '再会', pinyin: 'zai hui' }
  ],
  '徐州': [
    { cn: '你好', local: '您好', pinyin: 'nin hao' },
    { cn: '吃饭了吗', local: '喝汤了吗', pinyin: 'he tang le ma' },
    { cn: '谢谢', local: '多谢', pinyin: 'duo xie' },
    { cn: '再见', local: '白白了', pinyin: 'bai bai le' }
  ]
};

// 8. 美食雷达
const FOOD_RADAR = [
  { name: '高邮阳春面', score: 9.2, distance: '0.5km', price: '¥15' },
  { name: '蒲包肉', score: 8.8, distance: '0.3km', price: '¥20' },
  { name: '海鲜水饺', score: 9.0, distance: '1.2km', price: '¥35' },
  { name: '地锅鸡', score: 9.5, distance: '0.8km', price: '¥68' }
];

// 10. 行李清单
const PACKING_LIST = [
  { category: '证件', items: ['身份证', '驾驶证', '行驶证'] },
  { category: '衣物', items: ['薄长袖', '防晒衣', '薄外套', '沙滩鞋'] },
  { category: '电子', items: ['手机充电器', '充电宝', '相机', '车载充电器'] },
  { category: '药品', items: ['晕车药', '创可贴', '防晒霜', '驱蚊水'] },
  { category: '其他', items: ['雨伞', '墨镜', '零食', '矿泉水'] }
];

// 11. 日出日落
const SUN_TIMES = {
  '高邮': { sunrise: '05:28', sunset: '18:52' },
  '连云港': { sunrise: '05:15', sunset: '18:45' },
  '日照': { sunrise: '05:12', sunset: '18:48' },
  '徐州': { sunrise: '05:22', sunset: '18:55' }
};

const TRIP_DATA = {
  title: "🚗 小庆一家五一自驾游",
  subtitle: "程老师👨‍🦳 都老师👩‍🦳 小庆👨 香香👩 · 高邮→连云港→日照→徐州",
  startPoint: {
    name: "华地伟星龙川时代",
    address: "安徽省合肥市肥西县",
    lnglat: [117.1285, 31.7198],
    type: "start"
  },
  days: [
    {
      day: 1,
      date: "5月1日",
      weekday: "周五",
      theme: "高邮快闪 → 连云港海边",
      themeColor: "#e74c3c",
      route: "龙川时代 → 高邮 → 连云港连岛",
      distance: "约373km",
      driveTime: "约4.5小时（含高邮停留）",
      hotel: {
        name: "连岛海景酒店/民宿",
        area: "连云港连岛景区",
        tip: "提前预订，五一海边住宿紧张"
      },
      schedule: [
        {
          time: "06:30",
          title: "起床出发",
          desc: "早餐、装车，越早越好，避开合肥出城高峰",
          icon: "🌅",
          type: "prepare"
        },
        {
          time: "07:00",
          title: "正式出发（小庆驾驶）",
          desc: "小庆驾驶，程老师副驾导航。华地伟星龙川时代 → 高邮南门大街",
          icon: "🚗",
          type: "drive",
          nav: {
            name: "高邮南门大街",
            address: "江苏省扬州市高邮市南门大街",
            lnglat: [119.4365, 32.7841]
          }
        },
        {
          time: "08:30-09:00",
          title: "抵达高邮",
          desc: "五一车流预留30分钟缓冲",
          icon: "📍",
          type: "arrive"
        },
        {
          time: "09:00-10:30",
          title: "南门大街逛吃",
          desc: "历史老街、市井烟火、打卡老街门头。盂城驿外围拍照即可，不进去",
          icon: "🏮",
          type: "sight",
          nav: {
            name: "高邮南门大街",
            address: "江苏省扬州市高邮市南门大街",
            lnglat: [119.4365, 32.7841]
          },
          tips: ["拍照打卡点：老街门头、青石板路", "时间紧，控制在1.5小时内"]
        },
        {
          time: "10:30-11:30",
          title: "高邮早午餐",
          desc: "必吃：阳春面、蒲包肉、高邮咸鸭蛋。打包2个咸鸭蛋路上吃",
          icon: "🍜",
          type: "food",
          nav: {
            name: "高邮南门大街小吃",
            address: "高邮南门大街",
            lnglat: [119.4365, 32.7841]
          },
          foods: ["高邮阳春面", "蒲包肉", "高邮咸鸭蛋", "界首茶干"]
        },
        {
          time: "11:40",
          title: "出发连云港（小庆继续）",
          desc: "小庆继续驾驶，香香可以在服务区换班。高邮 → 连云港连岛大沙湾",
          icon: "🚗",
          type: "drive",
          nav: {
            name: "连岛大沙湾游乐园",
            address: "江苏省连云港市连云区连岛街道",
            lnglat: [119.4608, 34.7556]
          }
        },
        {
          time: "14:00-14:30",
          title: "抵达连岛",
          desc: "预留堵车缓冲，五一车流较大",
          icon: "📍",
          type: "arrive"
        },
        {
          time: "14:30-18:00",
          title: "大沙湾沙滩休闲",
          desc: "踏浪、拍照、吹海风。下午光线好，适合拍海景人像",
          icon: "🏖️",
          type: "sight",
          nav: {
            name: "连岛大沙湾游乐园",
            address: "江苏省连云港市连云区连岛街道",
            lnglat: [119.4608, 34.7556]
          },
          tips: ["带好防晒霜和墨镜", "海边风大，备一件外套", "沙滩鞋比拖鞋实用"]
        },
        {
          time: "18:30",
          title: "海鲜大排档晚餐",
          desc: "大众点评找评分4.5+，避开拉客的店",
          icon: "🦐",
          type: "food",
          foods: ["清蒸海鱼", "蒜蓉扇贝", "海鲜大咖"]
        },
        {
          time: "19:30",
          title: "入住酒店",
          desc: "连岛海景民宿/酒店，提前预订",
          icon: "🏨",
          type: "hotel"
        },
        {
          time: "20:00",
          title: "海边散步",
          desc: "吹晚风、听海浪，早点休息",
          icon: "🌙",
          type: "rest"
        }
      ]
    },
    {
      day: 2,
      date: "5月2日",
      weekday: "周六",
      theme: "连云港全天深度 · 山海结合",
      themeColor: "#3498db",
      route: "连岛 → 海上云台山 → 墟沟",
      distance: "岛内+往返约40km",
      driveTime: "轻松",
      hotel: {
        name: "连岛海景酒店/民宿",
        area: "连云港连岛景区",
        tip: "不换酒店，省心"
      },
      schedule: [
        {
          time: "08:00",
          title: "起床早餐",
          desc: "酒店自助或周边早餐",
          icon: "🌅",
          type: "prepare"
        },
        {
          time: "08:40-12:00",
          title: "连岛全线深度游",
          desc: "苏马湾生态栈道 → 临海悬崖公路 → 跨海步道。山海景观全程慢慢逛",
          icon: "🌊",
          type: "sight",
          nav: {
            name: "连岛苏马湾",
            address: "江苏省连云港市连云区连岛",
            lnglat: [119.4523, 34.7489]
          },
          tips: ["栈道约3km，穿舒适运动鞋", "带好水和零食", "观景台拍照绝佳"]
        },
        {
          time: "12:00-13:00",
          title: "景区周边简餐",
          desc: "海鲜面、小炒，不吃太饱",
          icon: "🍜",
          type: "food",
          foods: ["海鲜面", "小炒", "凉粉"]
        },
        {
          time: "13:00-14:00",
          title: "午休避晒",
          desc: "车内或酒店休息，避开正午暴晒",
          icon: "😴",
          type: "rest"
        },
        {
          time: "14:30-17:30",
          title: "海上云台山",
          desc: "山顶观景台俯瞰连云港港+连岛，山海景观震撼。门票60，景交车20",
          icon: "⛰️",
          type: "sight",
          nav: {
            name: "海上云台山风景区",
            address: "江苏省连云港市连云区宿城街道",
            lnglat: [119.3856, 34.6987]
          },
          tips: ["建议买景交车上山，节省体力", "山顶风大，带外套", "俯瞰港口和连岛全景"]
        },
        {
          time: "18:00",
          title: "墟沟市区晚餐",
          desc: "换口味，吃徐州烧烤或本地菜，不吃重复海鲜",
          icon: "🍖",
          type: "food",
          nav: {
            name: "墟沟美食街",
            address: "江苏省连云港市连云区墟沟",
            lnglat: [119.4189, 34.7392]
          }
        },
        {
          time: "19:30",
          title: "墟沟商圈散步",
          desc: "采购零食，为明天去日照备点吃的",
          icon: "🛒",
          type: "rest"
        },
        {
          time: "20:30",
          title: "回酒店休息",
          desc: "继续入住连岛",
          icon: "🏨",
          type: "hotel"
        }
      ]
    },
    {
      day: 3,
      date: "5月3日",
      weekday: "周日",
      theme: "连云港 → 日照 · 海岸休闲",
      themeColor: "#f39c12",
      route: "连云港 → 日照万平口 → 灯塔 → 东夷小镇",
      distance: "约82km",
      driveTime: "约1小时",
      hotel: {
        name: "万平口附近海边酒店",
        area: "日照万平口风景区",
        tip: "选海景房，早上看日出"
      },
      schedule: [
        {
          time: "08:00",
          title: "起床早餐，退房",
          desc: "收拾行李，准备出发",
          icon: "🌅",
          type: "prepare"
        },
        {
          time: "09:00",
          title: "出发日照",
          desc: "车程短，全程轻松",
          icon: "🚗",
          type: "drive",
          nav: {
            name: "万平口风景区2号门",
            address: "山东省日照市东港区万平口",
            lnglat: [119.5389, 35.4187]
          }
        },
        {
          time: "10:00",
          title: "抵达日照",
          desc: "停车：万平口2号门停车场",
          icon: "📍",
          type: "arrive"
        },
        {
          time: "10:10-12:30",
          title: "万平口风景区",
          desc: "网红打卡点、潮汐塔、沙滩漫步。2号门进，拍照最佳",
          icon: "🏖️",
          type: "sight",
          nav: {
            name: "万平口风景区2号门",
            address: "山东省日照市东港区万平口",
            lnglat: [119.5389, 35.4187]
          },
          tips: ["2号门拍照最好看", "潮汐塔可登高远望", "沙滩细腻适合光脚"]
        },
        {
          time: "12:30-14:00",
          title: "日照午餐",
          desc: "必吃：海鲜水饺、鲅鱼饺子、本地小海鲜拼盘",
          icon: "🥟",
          type: "food",
          foods: ["海鲜水饺", "鲅鱼饺子", "本地小海鲜拼盘", "海沙子面"]
        },
        {
          time: "14:00-15:00",
          title: "酒店入住+午休",
          desc: "万平口附近酒店，稍作休整",
          icon: "🏨",
          type: "hotel"
        },
        {
          time: "15:30-18:00",
          title: "灯塔风景区 + 阳光海岸绿道",
          desc: "礁石滩、海边栈道、看海发呆。节奏缓慢",
          icon: "🗼",
          type: "sight",
          nav: {
            name: "日照灯塔风景区",
            address: "山东省日照市东港区灯塔广场",
            lnglat: [119.5312, 35.4123]
          },
          tips: ["礁石滩拍照注意安全", "绿道适合骑行", "傍晚光线最美"]
        },
        {
          time: "18:30-20:30",
          title: "东夷小镇",
          desc: "古风街区、小吃合集、夜景拍照。日照版'夫子庙'",
          icon: "🏮",
          type: "sight",
          nav: {
            name: "东夷小镇",
            address: "山东省日照市东港区碧海路",
            lnglat: [119.5423, 35.4234]
          },
          tips: ["夜景比白天好看", "小吃多但价格偏高", "适合拍照打卡"]
        },
        {
          time: "21:00",
          title: "回酒店休息",
          desc: "为次日长途去徐州蓄力",
          icon: "🌙",
          type: "rest"
        }
      ]
    },
    {
      day: 4,
      date: "5月4日",
      weekday: "周一",
      theme: "日照 → 徐州 · 深度慢玩",
      themeColor: "#9b59b6",
      route: "日照 → 徐州市区 → 云龙湖 → 富国街",
      distance: "约326km",
      driveTime: "约3.5-4小时",
      hotel: {
        name: "徐州市中心/云龙区酒店",
        area: "徐州市云龙区",
        tip: "位置核心，方便第二天出发"
      },
      schedule: [
        {
          time: "07:00",
          title: "早起早餐，退房",
          desc: "今天车程最长，早点出发",
          icon: "🌅",
          type: "prepare"
        },
        {
          time: "07:40",
          title: "出发徐州（小庆驾驶）",
          desc: "小庆驾驶，今天路程最长，香香随时替补。日照 → 徐州云龙湖",
          icon: "🚗",
          type: "drive",
          nav: {
            name: "云龙湖风景区",
            address: "江苏省徐州市泉山区湖东路",
            lnglat: [117.1823, 34.2312]
          }
        },
        {
          time: "11:00-11:30",
          title: "抵达徐州",
          desc: "预留堵车缓冲",
          icon: "📍",
          type: "arrive"
        },
        {
          time: "11:40-13:30",
          title: "徐州地道午餐",
          desc: "必吃：地锅鸡、烙馍卷馓子。推荐：老家地锅/百味地锅，早到避免排队",
          icon: "🍗",
          type: "food",
          nav: {
            name: "老家地锅鸡",
            address: "江苏省徐州市泉山区",
            lnglat: [117.1856, 34.2567]
          },
          foods: ["地锅鸡", "烙馍卷馓子", "蛙鱼", "sha汤", "蜜三刀"]
        },
        {
          time: "14:00",
          title: "酒店入住",
          desc: "市中心/云龙区酒店，稍作休整",
          icon: "🏨",
          type: "hotel"
        },
        {
          time: "14:30-18:30",
          title: "云龙湖深度慢游 ⭐",
          desc: "环湖骑行/散步（租车20-30/h）、苏公岛、小南湖。只玩这一个地方，真正慢下来",
          icon: "🚴",
          type: "sight",
          nav: {
            name: "云龙湖风景区",
            address: "江苏省徐州市泉山区湖东路",
            lnglat: [117.1823, 34.2312]
          },
          tips: ["环湖一圈约13km，建议租自行车", "苏公岛拍照好看", "小南湖最安静", "4小时才够慢"]
        },
        {
          time: "18:30-20:30",
          title: "富国街夜市逛吃",
          desc: "徐州烟火气最浓的地方。蛙鱼、sha汤、蜜三刀、烧烤",
          icon: "🌃",
          type: "food",
          nav: {
            name: "富国街夜市",
            address: "江苏省徐州市泉山区富国街",
            lnglat: [117.1923, 34.2612]
          },
          foods: ["蛙鱼", "sha汤", "蜜三刀", "徐州烧烤", "菜煎饼"]
        },
        {
          time: "21:00",
          title: "回酒店休息",
          desc: "位置核心，方便明天出发",
          icon: "🏨",
          type: "hotel"
        }
      ]
    },
    {
      day: 5,
      date: "5月5日",
      weekday: "周二",
      theme: "徐州半日 → 返程",
      themeColor: "#27ae60",
      route: "徐州 → 回龙窝/户部山 → 合肥龙川时代",
      distance: "约358km",
      driveTime: "约3.5-4.5小时（返程高峰）",
      schedule: [
        {
          time: "07:30",
          title: "起床",
          desc: "不用太早，但也别太晚",
          icon: "🌅",
          type: "prepare"
        },
        {
          time: "08:00-09:30",
          title: "古街晨游",
          desc: "回龙窝 或 户部山（二选一）。早上人少，拍照好看",
          icon: "🏮",
          type: "sight",
          nav: {
            name: "回龙窝历史文化街区",
            address: "江苏省徐州市云龙区解放路",
            lnglat: [117.1956, 34.2512]
          },
          tips: ["回龙窝更文艺，户部山更历史", "早上8-9点人最少", "适合拍古风照片"]
        },
        {
          time: "10:00",
          title: "正式返程（小庆+香香轮换）",
          desc: "小庆主开前半程，香香替补后半程。徐州 → 华地伟星龙川时代。路线：连霍高速 → 合肥绕城 → 金寨南路",
          icon: "🚗",
          type: "drive",
          nav: {
            name: "华地伟星龙川时代",
            address: "安徽省合肥市肥西县",
            lnglat: [117.1285, 31.7198]
          }
        },
        {
          time: "14:00-14:30",
          title: "平安到家 🎉",
          desc: "五一返程高峰，预留4小时。恭喜完成5天完美旅程！",
          icon: "🏠",
          type: "arrive"
        }
      ]
    }
  ],
  tips: {
    packing: ["身份证/驾驶证", "防晒霜+墨镜", "薄长袖+防晒衣", "海边外套（风大）", "沙滩鞋", "充电宝", "车载充电器", "零食饮料"],
    driving: ["每天上午早出发，避开10点后拥堵", "高速服务区提前加油", "连霍高速蚌埠-合肥段易堵，预留缓冲", "备用路线：宁洛高速", "小庆主要开车，香香偶尔替补", "每2小时服务区休息，换人换手"],
    food: ["高邮咸鸭蛋可打包", "徐州蜜三刀买特产", "海鲜干货日照可买"]
  }
};

// 所有导航点位汇总（用于总览地图）
const ALL_NAV_POINTS = [
  { name: "华地伟星龙川时代", lnglat: [117.1285, 31.7198], day: 0 },
  { name: "高邮南门大街", lnglat: [119.4365, 32.7841], day: 1 },
  { name: "连岛大沙湾", lnglat: [119.4608, 34.7556], day: 1 },
  { name: "海上云台山", lnglat: [119.3856, 34.6987], day: 2 },
  { name: "万平口风景区", lnglat: [119.5389, 35.4187], day: 3 },
  { name: "日照灯塔风景区", lnglat: [119.5312, 35.4123], day: 3 },
  { name: "东夷小镇", lnglat: [119.5423, 35.4234], day: 3 },
  { name: "云龙湖风景区", lnglat: [117.1823, 34.2312], day: 4 },
  { name: "富国街夜市", lnglat: [117.1923, 34.2612], day: 4 },
  { name: "回龙窝历史文化街区", lnglat: [117.1956, 34.2512], day: 5 },
  { name: "华地伟星龙川时代", lnglat: [117.1285, 31.7198], day: 5 }
];
