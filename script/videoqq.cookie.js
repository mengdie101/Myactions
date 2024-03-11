const cookieName = '腾讯视频cookie'
const cookieKey = 'videoqq_pc_cookie'
const authUrlKey = 'videoqq_ref_url'
const appcookie = "videoqq_cookie"
const config = {
  cookie: {},
  headers: {}
};
let headers = {
    'Referer' : `https://film.video.qq.com/`,
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/537.51.1 (KHTML, like Gecko) Mobile/11A465 QQLiveBrowser/8.10.40 AppType/UN WebKitCore/WKWebView iOS GDTTangramMobSDK/4.370.6 GDTMobSDK/4.370.6 cellPhone/iPhone 12 AppBuild/25027'
}

const chavy = init()
const cookieVal = $request.headers['Cookie']
if (cookieVal) {
  if ($request.url.indexOf('auth_refresh') > 0) {
    const authurl = $request.url
    const authHeader = JSON.stringify($request.headers)
    if (cookieVal) chavy.setdata(cookieVal, cookieKey)
    if (authurl) chavy.setdata(authurl, authUrlKey)
    chavy.msg(`${cookieName}`, '获取Cookie: 成功', '')
    chavy.log(`[${cookieName}] 获取Cookie: 成功, Cookie: ${cookieVal}`)
    chavy.log(`[${cookieName}] 获取Cookie: 成功, AuthUrl: ${authurl}`)
  }
  else if (typeof $request != "undefined") {
    console.log("- 正在获取cookie，请稍后")
    GetCookie()
    chavy.done()
  }
}

function GetCookie() {
  if ("object" == typeof $request) {
    if (typeof $request.headers.cookie != 'undefined') {
      config.headers.Cookie = $request.headers.cookie;
    } else if (typeof $request.headers.Cookie != 'undefined') {
      config.headers.Cookie = $request.headers.Cookie;
    }
    config.cookie = getAuth(config.headers.Cookie);

    if (config.cookie.vdevice_qimei36) {
      console.log("- cookie获取成功");

      chavy.setdata(Object.keys(config.cookie).map(i => i + '=' + config.cookie[i]).join('; '), appcookie)
      ? chavy.msg(cookieName, "cookie catch success", "获得 cookie 成功")
      : chavy.msg(cookieName, "cookie catch failed", "获得 cookie 失败")
    } else {
      console.log("- 尚未登录, 请登录后再重新获取cookie");
    }   
  }
  chavy.done();
}

function getAuth(cookie) {
    let needParams = [""]
    //适配微信登录
    if (cookie) {
        if (cookie.includes("main_login=wx")) {
            needParams = ["vdevice_qimei36", "video_platform", "pgv_pvid", "pgv_info", "video_omgid", "main_login", "access_token", "appid", "openid", "vuserid", "vusession"]
        } else if (cookie.includes("main_login=qq")) {
            needParams = ["vdevice_qimei36", "video_platform", "pgv_pvid", "video_omgid", "main_login", "vqq_access_token", "vqq_appid", "vqq_openid", "vqq_vuserid", "vqq_vusession"]
        } else {
            console.log("getAuth - 无法提取有效cookie参数")
        }
    }
    const obj = {}
    if (cookie) {
        cookie.split('; ').forEach(t => {
            const [key, val] = t.split(/\=(.*)$/, 2)
            needParams.indexOf(key) !== -1 && (obj[key] = val)
        })
    }
    return obj
}


function init() {
  isSurge = () => {
    return undefined === this.$httpClient ? false : true
  }
  isQuanX = () => {
    return undefined === this.$task ? false : true
  }
  getdata = (key) => {
    if (isSurge()) return $persistentStore.read(key)
    if (isQuanX()) return $prefs.valueForKey(key)
  }
  setdata = (key, val) => {
    if (isSurge()) return $persistentStore.write(key, val)
    if (isQuanX()) return $prefs.setValueForKey(key, val)
  }
  msg = (title, subtitle, body) => {
    if (isSurge()) $notification.post(title, subtitle, body)
    if (isQuanX()) $notify(title, subtitle, body)
  }
  log = (message) => console.log(message)
  get = (url, cb) => {
    if (isSurge()) {
      $httpClient.get(url, cb)
    }
    if (isQuanX()) {
      url.method = 'GET'
      $task.fetch(url).then((resp) => cb(null, {}, resp.body))
    }
  }
  post = (url, cb) => {
    if (isSurge()) {
      $httpClient.post(url, cb)
    }
    if (isQuanX()) {
      url.method = 'POST'
      $task.fetch(url).then((resp) => cb(null, {}, resp.body))
    }
  }
  done = (value = {}) => {
    $done(value)
  }
  return { isSurge, isQuanX, msg, log, getdata, setdata, get, post, done }
}
chavy.done()
