/*
    云闪付：“🎁签到领积分” 
    *************************
    【 QX 1.0.10+ 脚本配置 】 
    *************************
    [task_local]
    31 8 * * * unipay.js,tag=云闪付签到

    [rewrite_local]
    https:\/\/youhui\.95516\.com/newsign/api/shop_items url script-request-header unipay.js,tag=云闪付签到cookie

    [MITM]
    hostname = youhui.95516.com
    ⚠️【免责声明】
------------------------------------------
1、此脚本仅用于学习研究，不保证其合法性、准确性、有效性，请根据情况自行判断，本人对此不承担任何保证责任。
2、由于此脚本仅用于学习研究，您必须在下载后 24 小时内将所有内容从您的计算机或手机或任何存储设备中完全删除，若违反规定引起任何事件本人对此均不负责。
3、请勿将此脚本用于任何商业或非法目的，若违反规定请自行对此负责。
4、此脚本涉及应用与本人无关，本人对因此引起的任何隐私泄漏或其他后果不承担任何责任。
5、本人对任何脚本引发的问题概不负责，包括但不限于由脚本错误引起的任何损失和损害。
6、如果任何单位或个人认为此脚本可能涉嫌侵犯其权利，应及时通知并提供身份证明，所有权证明，我们将在收到认证文件确认后删除此脚本。
7、所有直接或间接使用、查看此脚本的人均应该仔细阅读此声明。本人保留随时更改或补充此声明的权利。一旦您使用或复制了此脚本，即视为您已接受此免责声明。
*/


const cookieKey = 'unipay_cookieKey';
const authorizationKey = 'unipay_authorizationKey';
const userAgentKey = 'unipay_userAgentKey';
const $tool = tool();

(async () => {
  try {
    console.log("==========🍎云闪付开始!==========");
    var img = "https://is5-ssl.mzstatic.com/image/thumb/Purple114/v4/53/bc/b5/53bcb52a-6c33-67cc-0c70-faf4ffbdb71e/AppIcon-0-0-1x_U007emarketing-0-0-0-6-0-0-85-220.png";
    let isGetCookie = typeof $request !== 'undefined' && $request.method != 'OPTIONS';

    if (isGetCookie && $request.url.indexOf("https://youhui.95516.com/newsign/api/shop_items") > -1) {
      var authorizationVal = $request.headers["Authorization"];
      var cookieVal = $request.headers['Cookie'];
      var userAgentVal = $request.headers['User-Agent'];
      if (!!authorizationVal) {
        $tool.setkeyval(authorizationVal, authorizationKey);
        $tool.setkeyval(cookieVal, cookieKey);
        $tool.setkeyval(userAgentVal, userAgentKey);
        console.log("🍎Authorization:" + authorizationVal);
        console.log("🍎Cookie:" + cookieVal);
        console.log("🍎User-Agent:" + userAgentVal);
        $tool.notify("云闪付签到!", "获得Authorization", authorizationVal, { img: img });
        $done({});
      }
    } else {
      await randomDelay(1000, 5000); // 1到5秒随机延迟

      var url = 'https://youhui.95516.com/newsign/api/daily_sign_in';
      var method = 'POST';
      var headers = {
        'Content-Type': 'application/json',
        'Accept-Encoding': 'gzip, deflate, br',
        'Origin': 'https://youhui.95516.com',
        'User-Agent': $tool.getkeyval(userAgentKey),
        'Authorization': $tool.getkeyval(authorizationKey),
        'Referer': 'https://youhui.95516.com/newsign/public/app/index.html',
        'Host': 'youhui.95516.com',
        'Accept-Language': 'zh-CN,zh-Hans;q=0.9',
        'Accept': 'application/json, text/plain, */*'
      };
      var body = '';

      var myRequest = {
        url: url,
        method: method,
        headers: headers,
        body: body
      };

      $tool.post(myRequest, function(e, r, d) {
        var obj = JSON.parse(d);
        console.log(JSON.stringify(obj, null, 2));
        if (!!obj.signedIn) {
          if (obj.signedIn == true) {
            var totalDays = obj.signInDays.days;
            var currentDays = obj.signInDays.current.days;
            var msg = "本月连续签到" + currentDays + "天! 已连续签到" + totalDays + "天!";
            console.log(msg);
            $tool.notify("云闪付签到成功!", "本月连续签到" + currentDays + "天!", "已连续签到" + totalDays + "天!", { img: img });
            $done();
          } else {
            $tool.notify("云闪付签到失败!", d, d, {
              img: img
            });
            $done();
          }
        } else {
          $tool.notify("云闪付签到失败!", d, d, {
            img: img
          });
          $done();
        }
      });
    }

  } catch (e) {
    console.log("🍎error" + e);
    $tool.notify("云闪付签到错误!", e, e, {
      img: img
    });
    $done();
  }
})();


// 随机延迟函数
function randomDelay(min, max) {
  return new Promise((resolve) => {
    const randomInt = Math.round(Math.random() * (max - min) + min);
    console.log(`随机延迟${randomInt}ms……`);
    setTimeout(() => {
      console.log("延迟结束,开始主程序……");
      resolve(randomInt);
    }, randomInt);
  });
}


function tool() {
    var isLoon = typeof $httpClient != "undefined";
    var isQuanX = typeof $task != "undefined";
    var obj = {
        notify: function(title, subtitle, message, option) {
            var option_obj = {};
            if (isQuanX) {
                if (!!option) {
                    if (typeof option == "string") {
                        option_obj["open-url"] = option
                    }
                    if (!!option.url) {
                        option_obj["open-url"] = option.url
                    }
                    if (!!option.img) {
                        option_obj["media-url"] = option.img
                    }
                    $notify(title, subtitle, message, option_obj)
                } else {
                    $notify(title, subtitle, message)
                }
            }
            if (isLoon) {
                if (!!option) {
                    if (typeof option == "string") {
                        option_obj["openUrl"] = option
                    }
                    if (!!option.url) {
                        option_obj["openUrl"] = option.url
                    }
                    if (!!option.img) {
                        option_obj["mediaUrl"] = option.img
                    }
                    $notification.post(title, subtitle, message, option_obj)
                } else {
                    $notification.post(title, subtitle, message)
                }
            }
        },
        get: function(options, callback) {
            if (isQuanX) {
                if (typeof options == "string") {
                    options = {
                        url: options
                    }
                }
                options["method"] = "GET";
                $task.fetch(options).then(function(response) {
                    callback(null, adapterStatus(response), response.body)
                }, function(reason) {
                    callback(reason.error, null, null)
                })
            }
            if (isLoon) {
                $httpClient.get(options, function(error, response, body) {
                    callback(error, adapterStatus(response), body)
                })
            }
        },
        post: function(options, callback) {
            if (isQuanX) {
                if (typeof options == "string") {
                    options = {
                        url: options
                    }
                }
                options["method"] = "POST";
                $task.fetch(options).then(function(response) {
                    callback(null, adapterStatus(response), response.body)
                }, function(reason) {
                    callback(reason.error, null, null)
                })
            }
            if (isLoon) {
                $httpClient.post(options, function(error, response, body) {
                    callback(error, adapterStatus(response), body)
                })
            }
        },
        unicode: function(str) {
            return unescape(str.replace(/\\u/gi, "%u"))
        },
        decodeurl: function(str) {
            return decodeURIComponent(str)
        },
        json2str: function(obj) {
            return JSON.stringify(obj)
        },
        str2json: function(str) {
            return JSON.parse(str)
        },
        setkeyval: function(value, key) {
            if (isQuanX) {
                $prefs.setValueForKey(value, key)
            }
            if (isLoon) {
                $persistentStore.write(value, key)
            }
        },
        getkeyval: function(key) {
            if (isQuanX) {
                return $prefs.valueForKey(key)
            }
            if (isLoon) {
                return $persistentStore.read(key)
            }
        }
    };

    function adapterStatus(response) {
        if (response) {
            if (response.status) {
                response["statusCode"] = response.status
            } else {
                if (response.statusCode) {
                    response["status"] = response.statusCode
                }
            }
        }
        return response
    }
    return obj
};
