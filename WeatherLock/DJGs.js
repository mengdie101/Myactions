// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: cyan; icon-glyph: feather;
/* ------------------------------------------
Script      : 「大舅哥」开发环境
Author      : DJG
Version     : 1.0
Description : 仅支持锁屏天气脚本调用
Platform    : 微信公众号「大舅哥科技」
Docs        : gitee.com/script_djg/scriptable
------------------------------------------ */

const RUNTIME_VERSION = "1.0"

class DJG {
  constructor(arg) {
    this.arg = arg;
    this.init();
    this.package = 'WeatherLock/package.json';
    this.updataUrl = '';
  }

  init() {
    this._actions = {};
    this._actionsIcon = {};
    this.SETTING_KEY = this.hash(Script.name());
    // 文件管理器
    this.FM = FileManager.local();
    this.MGR_DOCU = this.FM.libraryDirectory();
    // 用于模块存储
    this.MODULE_FOLDER = this.FM.joinPath(
      this.MGR_DOCU, 'module/'
    );
    // 图片管理
    this.IMAGE_FOLDER = this.FM.joinPath(
      this.MGR_DOCU, 'images/'
    );
    this.MGR_PATH = this.FM.joinPath(
      this.MGR_DOCU, `${this.SETTING_KEY}/`,
    );
    // 缓存管理
    this.CACHE_DOCU = this.FM.cacheDirectory();
    this.CACHE_PATH = this.FM.joinPath(
      this.CACHE_DOCU, `${this.SETTING_KEY}/`,
    );
    this.widgetConfig();
    this.createDirectory();
  }
  
  widgetConfig (flag = true) {
    this.settings = flag ? this.getSettings() : {};
    this.settings.refreshAfterDate = this.settings.refreshAfterDate || '30';// 数据刷新间隔
    this.settings.locTime = this.settings.locTime || '30';// 定位刷新间隔
    this.settings.fontColor = this.settings.fontColor || '#FFFFFF';// 字体颜色
    this.settings.shadowColor = this.settings.shadowColor || '';// 字体阴影
    this.settings.bgColor = this.settings.bgColor || '#008B8B';// 背景颜色
  }
  
  createDirectory () {
    this.FM.createDirectory(this.MODULE_FOLDER,true);
    this.FM.createDirectory(this.IMAGE_FOLDER,true);
    this.FM.createDirectory(this.MGR_PATH,true);
    this.FM.createDirectory(this.CACHE_PATH,true);
  }
  
  /**
   * 字体颜色设置透明度
   */
  colorAlpha (alpha) {
    const color = new Color(this.settings.fontColor, alpha);
    return color;
  }
  
  // 判断是否到达更新时间
  isUpdata(cacheKey, useCache = true, time = parseInt(this.settings.refreshAfterDate)) {
    time = time < 5 ? 5 : time;
    let name = typeof useCache === 'string' ? useCache : this.name;
    const nowTime = +new Date;
    let lastTime = nowTime;
    Keychain.contains(cacheKey) ? 
      lastTime = parseInt(Keychain.get(cacheKey)) : Keychain.set(cacheKey, String(lastTime));
    let _lastTime = Math.floor((nowTime-lastTime)/60000)
    if(useCache) log(`${name}：缓存${_lastTime}分钟前，有效期${time}分钟`);
    if(lastTime < (nowTime - 1000*60*time) || lastTime == nowTime) {
      Keychain.set(cacheKey, String(nowTime));
      return true;
    }else { return false;}
  }
  
  // 版本检测
  async versionCheck () {
    const url = this.getUrl(this.package);
  	let versionData = await this.httpGet(url);
    let req = versionData[this.ID];
    if(req.version != this.version){
      let title = "💥新版本"+req.version;
      let message = req.notes + "\n版本更新尽在⬇️\n「大舅哥科技」公众号" + req.updateTime;;
      let idx = await this.generateAlert(message, ['立即更新','暂不更新'], title);
      if (idx === 0) Safari.open(this.updataUrl);
    }else {
      let title = "暂无更新";
      let message = req.version + req.notes + "\n- 如无法预览，可尝试重置\n- 也可在基础设置左上角查看" + req.updateTime;
      await this.generateAlert(message, ['知道了'], title);
    }
  }
  
  /**
   * 注册点击操作菜单
   * @param {string} name 操作函数名
   * @param {func} func 点击后执行的函数
   */
  registerAction(name, func, icon = { name: 'gearshape', color: '#FF6347' }) {
    this._actions[name] = func.bind(this);
    this._actionsIcon[name] = icon;
  }
  
  /**
   * base64 编码字符串
   * @param {string} str 要编码的字符串
   */
  base64Encode(str) {
    const data = Data.fromString(str);
    return data.toBase64String();
  }

  /**
   * base64解码数据 返回字符串
   * @param {string} b64 base64编码的数据
   */
  base64Decode(b64) {
    const data = Data.fromBase64String(b64);
    return data.toRawString();
  }

  /**
   * hash 加密字符串
   * @param {string} str 要加密成哈希值的数据
   */
  hash(string) {
    let hash2 = 0, i, chr;
    for (i = 0; i < string.length; i++) {
      chr = string.charCodeAt(i);
      hash2 = (hash2 << 5) - hash2 + chr;
      hash2 |= 0;
    }
    return `hash_${hash2}`;
  }
  
  getUrl(fileName) {
    const repository = "https://gitee.com/script_djg/scriptable/raw/master/";
    return `${repository}${fileName}`;
  }
  
  /**
   * 天气请求接口
   * @param {string} url 请求的url
   * @param {string} cacheKey 缓存key
   * @return {json | null}
   */
  async http_get (url, cacheKey = "caiyunWeatherLock") {
    cacheKey = this.hash(cacheKey);
    let cache = null;
    const localCache = this.loadStringCache(cacheKey);
    if (this.isUpdata(cacheKey.slice(-8), true) || !localCache){
      try {
        let req = new Request(url)
        cache = await req.loadJSON();
      } catch (e) {console.error(`${this.name}：请求失败：${e}`)};
    }
    if(cache) {
      this.saveStringCache(cacheKey, JSON.stringify(cache));
    } else {
      cache = JSON.parse(localCache);
    }
    return cache;
  }
  
  /**
   * HTTP 请求接口
   * @param {string} url 请求的url
   * @param {bool} useCache 是否采用离线缓存（请求失败后获取上一次结果）
   * @param {bool} json 返回数据是否为 json，默认 true
   * @return {string | json | null}
   */
  async httpGet (url, json = true, useCache = true, options = null, method = 'GET') {
    let str = url + options?.headers?.cookie + options?.body;
    let cacheKey = this.hash(str);
    let cache = null;
    const localCache = this.loadStringCache(cacheKey);
    if (this.isUpdata(cacheKey.slice(-8), useCache) || !localCache){
      try {
        let req = new Request(url)
        req.method = method
        if(options){
          Object.keys(options).forEach((key) => {
            req[key] = options[key];
          });
        }
        cache = await (json ? req.loadJSON() : req.loadString());
      } catch (e) {console.error(`${this.name}：请求失败：${e}`)};
    }
    if(cache && useCache) {
      this.saveStringCache(cacheKey, json ? JSON.stringify(cache) : cache);
    } else {
      cache = json ? JSON.parse(localCache) : localCache;
    }
    return cache;
  }
  
  loadStringCache(cacheKey, path = this.CACHE_PATH) {
    const cacheFile = this.FM.joinPath(path, cacheKey);
    const fileExists = this.FM.fileExists(cacheFile);
    let cacheString = '';
    if (fileExists) {
      cacheString = this.FM.readString(cacheFile);
    }
    return cacheString;
  }

  saveStringCache(cacheKey, content, path = this.CACHE_PATH) {
    const cacheFile = this.FM.joinPath(path, cacheKey);
    this.FM.writeString(cacheFile, content);
  }
  
  async getImageByUrl (url, path = this.CACHE_PATH) {
    const cacheKey = this.hash(url);
    let cacheImg = this.loadImgCache(cacheKey, path);
    if (cacheImg != undefined && cacheImg != null) {
      return cacheImg;
    }
    try {
      const req = new Request(url)
      cacheImg = await req.loadImage()
      // 存储到缓存
      this.saveImgCache(cacheKey, cacheImg, path);
      return cacheImg;
    } catch (e) {
      console.error(e);
      // 没有缓存+失败情况下，返回自定义的绘制图片（红色背景）
      let ctx = new DrawContext()
      ctx.size = new Size(100, 100)
      ctx.setFillColor(Color.red())
      ctx.fillRect(new Rect(0, 0, 100, 100))
      return await ctx.getImage()
    }
  }
  
  saveImgCache(cacheKey, img, path) {
    const cacheFile = this.FM.joinPath(path, `${cacheKey}.png`);
    this.FM.writeImage(cacheFile, img);
  }

  loadImgCache(cacheKey, path) {
    const cacheFile = this.FM.joinPath(path, `${cacheKey}.png`);
    const fileExists = this.FM.fileExists(cacheFile);
    let img = undefined;
    if (fileExists) {
      img = Image.fromFile(cacheFile);
    }
    return img;
  }
  
  /**
   * @description 导入模块，不存在即下载模块
   * @param {string} moduleName 模块名module/faqTable.js
   */
  async require (moduleName) {
    const path = this.MODULE_FOLDER;
    const cacheKey = `${moduleName}.js`;
    let localCache = this.loadStringCache(cacheKey, path);
    if (!localCache) {
      const url = this.getUrl(`WeatherLock/module/${cacheKey}`);
      let req = new Request(url);
      localCache = await req.loadString();
      if (localCache) this.saveStringCache(cacheKey, localCache, path);
    }
    if (localCache) {
      moduleName = this.FM.joinPath(path, cacheKey);
      return importModule(moduleName);
    }
  }
  
  /**
   * 背景高斯模糊
   * @param {img} Image
   * @param {blur} Int 模糊值
   * @param {blur} Int 透明度
   */
  async blurImage(img, blur = this.settings.bgBlur, opacity = this.settings.bgBlurOpacity) {
    const blurImage = await this.require("blurImage");
    return await blurImage(img, blur, opacity);
  }
  
  /**
   * 给图片加一层半透明遮罩
   * @param {Image} img 要处理的图片
   * @param {string} color 遮罩背景颜色
   * @param {float} opacity 透明度
   */
  async shadowImage (img, color = this.settings.bgColor, opacity = this.settings.bgOpacity) {
    let ctx = new DrawContext();
    // 获取图片的尺寸
    ctx.size = img.size
    ctx.drawImageInRect(img, new Rect(0, 0, img.size['width'], img.size['height']))
    ctx.setFillColor(new Color(color, parseFloat(opacity)))
    ctx.fillRect(new Rect(0, 0, img.size['width'], img.size['height']))
    return ctx.getImage()
  }
  
  shadowCanvas(canvas, rect, alpha, round, color = "#000"){
    const path = new Path();
    path.addRoundedRect(rect, round, round);
    path.closeSubpath();
    canvas.setFillColor(new Color(color, alpha));
    canvas.addPath(path);
    canvas.fillPath();
  }
  
  // 图像裁剪
  cropImage(img, rect) {
    let draw = new DrawContext();
    draw.size = new Size(rect.width, rect.height);
    draw.drawImageAtPoint(img, new Point(-rect.x, -rect.y));
    return draw.getImage();
  }
  
  /**
   * 获取设备分辨率
   * @returns {json}
   */
  getScreenResolution() {
    const isPhone = Device.model() == "iPhone";
    let {height, width} = Device.screenResolution();
    if(!isPhone) {
      width = 1125, height = 2436;
    }
    return {"height": height, "width": width}
  }
  
  // ######创建画布######
  makeCanvas(size) {
    this.fontColor = this.settings.fontColor;
    this.shadowColor = this.settings.shadowColor;
    this.bgColor = this.settings.bgColor;
    const canvas = new DrawContext();
    canvas.opaque = false;
    canvas.respectScreenScale = true;
    canvas.size = new Size(size.width, size.height);;
    return canvas;
  }
  // ######画线######
  drawLine(canvas, x1, y1, x2, y2, width, color = this.widgetColor){
    const path = new Path()
    path.move(new Point(Math.round(x1),Math.round(y1)))
    path.addLine(new Point(Math.round(x2),Math.round(y2)))
    canvas.addPath(path)
    canvas.setStrokeColor(color)
    canvas.setLineWidth(width)
    canvas.strokePath()  
  }
  
  // ######绘制文字#######  
  drawText(canvas, rect, text, font, fontsize, alignment, color=this.settings.fontColor, opacity=1){
    canvas.setFont(this.allfonts(font, fontsize))
    canvas.setTextColor(new Color(color, opacity))
    if(alignment == "left") {canvas.setTextAlignedLeft()}
    if(alignment == "center") {canvas.setTextAlignedCenter()}
    if(alignment == "right") {canvas.setTextAlignedRight()}
    canvas.drawTextInRect(text, rect)  
  }
  
  // ######画实心柱######
  fillRect (canvas,x,y,width,height,cornerradio,color=this.fontColor){  
    let path = new Path()  
    let rect = new Rect(x, y, width, height)  
    path.addRoundedRect(rect, cornerradio, cornerradio)  
    canvas.addPath(path)  
    canvas.setFillColor(color)  
    canvas.fillPath()  
  }
  
  // ######画实心园######
  drawPoint(canvas,x1,y1,diaofPoint,color=this.fontColor){  
    let currPath = new Path()
    currPath.addEllipse(new Rect(x1, y1, diaofPoint, diaofPoint))
    canvas.addPath(currPath)
    canvas.setFillColor(color)
    canvas.fillPath()  
  }
  
  // 套壳
  async shell (image) {
    const iphoneImg = await this.getImageByUrl(this.getUrl('image/shell.png'), this.IMAGE_FOLDER);
    const size = iphoneImg.size;
    let {width, height} = image.size;
    const canvas = this.makeCanvas(size);
    canvas.setFillColor(new Color(this.settings.bgColor));
    canvas.fillRect(new Rect(0, 0, size.width, size.height));
    canvas.drawImageInRect(image, new Rect(93, 60, 1125, 1125*height/width));
    canvas.drawImageAtPoint(iphoneImg, new Point(0, 0));
    return canvas.getImage();
  }
  
  /**
   * 获取图标
   * @param {string} weather 天气描述
   * @param {string} jsonStr weatherIcon｜weatherDesc｜weatherOneIcon｜weatherSF
   * @param {int} index|size 天气图标编号|图标大小
   * @return {string}
   */
  async getIcon(weather, jsonStr = "weatherIcon", index = 1) {
    const weatherDes = await this.require("weatherInfo");
    let iconName = weatherDes()[jsonStr][weather];
    switch (jsonStr) {
      case 'weatherIcon':
        if(!iconName) iconName = "PARTLY_CLOUDY_DAY";
        let iconUrl = this.getUrl(`image/weatherIcon/icon${index}/${iconName}.png`);
        return await this.getImageByUrl(iconUrl);
      case 'weatherSF':
        if(!iconName) iconName = "cloud.fill";
        const sf = SFSymbol.named(iconName);
        sf.applyFont(Font.systemFont(index));
        return sf.image;
    }
  }
  
  /**
   * @param message 描述内容
   * @param options 按钮
   * @returns {Promise<number>}
   */
  async generateAlert(message, options, title) {
    let alert = new Alert();
    title && (alert.title = title);
    alert.message = title ? '\n' + message : message;
    if(options) {
      for (const option of options) {
        alert.addAction(option);
      }
    }
    return await alert.presentAlert();
  }
  
  // 输入菜单
  async setCustomAction(title, desc, opt, flag = true, notify = true) {
    const a = new Alert();
    a.title = title;
    a.message = !desc ? '' : '\n'+desc;
    Object.keys(opt).forEach((key) => {
      flag ? a.addTextField(opt[key], this.settings[key]) : a.addTextField(opt[key], this.djgSettings[key]);
    });
    a.addAction('确定');
    a.addCancelAction('取消');
    const id = await a.presentAlert();
    if (id === -1) return false;
    const data = {};
    Object.keys(opt).forEach(async (key, index) => {
      let temp = a.textFieldValue(index);
      data[key] = temp;
    });
    flag ? this.settings = { ...this.settings, ...data } : this.djgSettings = { ...this.djgSettings, ...data };
    this.saveSettings(notify, flag);
    return true;
  };
  
  // * @param {flag} true 默认单选
  async setChoiceAction(title, desc, opt, flag = true, choice = 'choiceAction') {
    let caches = {};
    const choiceData = this.settings[choice] || 'a';
    choiceData.split('').map(a => {caches[a] = true})
    const sign = 'abcdefghijklmnopqrstuvwxyz';
    for(let i in opt) opt[i] = [sign[i], opt[i]]
    const a = new Alert();
    a.title = title;
    a.message = desc;
    opt.map(k => {
      let _id = k[0]
      let _name = k[1]
      a.addAction(caches[_id] ? `${_name} ✅` : `${_name} ☑️`)
    })
    a.addCancelAction("完成设置")
    const id = await a.presentSheet();
    if (id === -1) return this.saveSettings();
    if(flag) {
      this.settings[choice] = opt[id][0];
      this.saveSettings();
    }else {
      let _arg = opt[id]
      caches[_arg[0]] ? caches[_arg[0]] = false : caches[_arg[0]] = true
      let _caches = []
      for (let k in caches) {
        if (caches[k]) {
          _caches.push(k)
        }
      }
      this.settings[choice] = _caches.join('');
      for(let i in opt) opt[i] = opt[i][1];
      await this.setChoiceAction(title, desc, opt, false);
    }
  };
  
  /**
   * 设置组件内容
   * @returns {Promise<void>}
   */
  async setWidgetConfig() {
    const table = new UITable();
    table.showSeparators = true;
    await this.renderDJGTables(table);
    await table.present();
  };
  
  async preferences(table, arrs, outfit) {
    const header = new UITableRow();
    const heading = header.addText(outfit);
    heading.titleFont = Font.mediumSystemFont(17);
    heading.centerAligned();
    table.addRow(header);
    for (const item of arrs) {
      const row = new UITableRow();
      if (item.explain) {
        row.height = 36
    	row.backgroundColor = Color.dynamic(
      	  new Color('F2F1F6'),
      	  new Color('000000'),
    	);
    	const title = row.addText(item.explain, ' ');
    	title.subtitleFont = Font.systemFont(7);
        title.titleFont = Font.systemFont(13);
    	title.titleColor = Color.dynamic(
      	  new Color('000000', 0.6),
      	  new Color('FFFFFF', 0.6),
    	);
      } else if (item.title) {
      	row.dismissOnSelect = !!item.dismissOnSelect;
      	if (item.url) {
          const img = await this.getImageByUrl(item.url, this.IMAGE_FOLDER);
          const rowIcon = row.addImage(img)
          rowIcon.widthWeight = 100;
      	}
      	if (item.icon) {
          const icon = item.icon || {};
          const image = await this.drawTableIcon(icon.name, icon.color, item.cornerWidth);
          const imageCell = row.addImage(image);
          imageCell.widthWeight = 100;
      	}
      	const rowTitle = row.addText(item.title);
      	rowTitle.widthWeight = 400;
      	rowTitle.titleFont = Font.systemFont(16);
        let isArray = Array.isArray(item.val);
      	if (item.val) {
          const valText = row.addText(`${item.val}`.toUpperCase());
          valText.widthWeight = 500;
          valText.rightAligned();
          valText.titleColor = Color.blue();
          valText.titleFont = Font.mediumSystemFont(16);
      	} else {
          const url = "https://gitee.com/scriptxx_djg/imgebed/raw/master/menu/Ue5thScBQAMJ.png";
          const img = await this.getImageByUrl(url, this.IMAGE_FOLDER);
          const imgCell = UITableCell.image(img)
          imgCell.rightAligned();
          imgCell.widthWeight = 500;
          row.addCell(imgCell);
      	}
      	if (item.onClick) row.onSelect = () => item.onClick(item, row);
      }
      table.addRow(row);
    }
    table.reload();
  };
  
  async drawTableIcon (icon = 'square.grid.2x2', color = '#FF7F00', cornerWidth = 42) {
    const cacheKey = this.hash(icon + color);
    let img = this.loadImgCache(cacheKey, this.IMAGE_FOLDER);
    if(img) return img;
    
    const sfi = SFSymbol.named(icon);
    sfi.applyFont(Font.mediumSystemFont(30));
    const imgData = Data.fromPNG(sfi.image).toBase64String();
    const html = `
    <img id="sourceImg" src="data:image/png;base64,${imgData}" />
    <img id="silhouetteImg" src="" />
    <canvas id="mainCanvas" />`;
    const js = `
    var canvas = document.createElement("canvas");
    var sourceImg = document.getElementById("sourceImg");
    var silhouetteImg = document.getElementById("silhouetteImg");
    var ctx = canvas.getContext('2d');
    var size = sourceImg.width > sourceImg.height ? sourceImg.width : sourceImg.height;
    canvas.width = size;
    canvas.height = size;
    ctx.drawImage(sourceImg, (canvas.width - sourceImg.width) / 2, (canvas.height - sourceImg.height) / 2);
    var imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    var pix = imgData.data;
    // 将图像转换为剪影
    for (var i=0, n = pix.length; i < n; i+= 4){
      //set red to 0 设置为红色到0
      pix[i] = 255;
      //set green to 0 设置绿色到0
      pix[i+1] = 255;
      //set blue to 0 设置为蓝色到0
      pix[i+2] = 255;
      //retain the alpha value 保留阿尔法值
      pix[i+3] = pix[i+3];
    }
    ctx.putImageData(imgData,0,0);
    silhouetteImg.src = canvas.toDataURL();
    output=canvas.toDataURL()`;
    let wv = new WebView();
    await wv.loadHTML(html);
    const base64Image = await wv.evaluateJavaScript(js);
    const iconImage = await new Request(base64Image).loadImage();
    const image = iconImage;
    
    const size = new Size(160, 160);
    const ctx = new DrawContext();
    ctx.opaque = false;
    ctx.respectScreenScale = true;
    ctx.size = size;
    const path = new Path();
    const rect = new Rect(0, 0, size.width, size.width);

    path.addRoundedRect(rect, cornerWidth, cornerWidth);
    path.closeSubpath();
    ctx.setFillColor(new Color(color));
    ctx.addPath(path);
    ctx.fillPath();
    const rate = 36;
    const iw = size.width - rate;
    const x = (size.width - iw) / 2;
    ctx.drawImageInRect(image, new Rect(x, x, iw, iw));
    
    img = ctx.getImage();
    this.saveImgCache(cacheKey, img, this.IMAGE_FOLDER);
    return img;
  };
  
  async renderDJGTables(table) {
    const basicSettings = [
      {
        title: '刷新间隔',
        val: this.settings.refreshAfterDate,
        icon: {name: "arrow.clockwise", color: "#1890ff"},
        onClick: async () => {
          await this.setCustomAction(
            '刷新间隔',
            '数据刷新间隔，避免频繁访问报错，单位：分钟', {
              refreshAfterDate: '刷新间隔',
            }
          );
        }
      },
      {
        title: "字体颜色",
        icon: {name: "photo.fill", color: "#d48806"},
        onClick: async () => {
          await this.setCustomAction("字体颜色", "请自行百度搜寻颜色(Hex 颜色)", {fontColor:'字体颜色'});
       }
      },
      {
        title: "背景颜色",
        icon: {name: "photo.on.rectangle", color: "#fa8c16"},
        onClick: async () => {
          await this.setCustomAction("背景颜色", "请自行百度搜寻颜色(Hex 颜色)", {bgColor:'背景颜色'});
        }
      }
    ];
    table.removeAllRows();
    let topRow = new UITableRow();
    let buttonCell1 = topRow.addButton('常见问题');
    buttonCell1.widthWeight = 0.25;
    buttonCell1.onTap = async () => {
      const faqTable = await this.require('faqTable_Weather');
      await faqTable();
    }
    let buttonCell4 = topRow.addButton('交流群');
    buttonCell4.widthWeight = 0.25;
    buttonCell4.rightAligned();
    buttonCell4.onTap = async () => {
      await Safari.open('https://jq.qq.com/?_wv=1027&k=bfguZi01');
    }
    table.addRow(topRow);
    let header = new UITableRow();
    let heading = header.addText('还原设置');
    heading.titleFont = Font.mediumSystemFont(17);
    heading.centerAligned();
    table.addRow(header);
    let row1 = new UITableRow();
    let rowtext1 = row1.addText(
      '重置缓存',
      '若数据显示错误，可尝试此操作',
    );
    rowtext1.titleFont = Font.systemFont(16);
    rowtext1.subtitleFont = Font.systemFont(12);
    rowtext1.subtitleColor = new Color('999999');
    row1.onSelect = async () => {
      const option = ['取消', '重置'];
      const message = '所有在线请求的数据缓存将会被清空！\n⚠️重置成功后⚠️\n请重新运行此桌面小组件！';
      const index = await this.generateAlert(message, option);
      if (index === 0) return;
      this.FM.remove(this.CACHE_PATH);
      this.FM.remove(this.MODULE_FOLDER);
      this.createDirectory();
      this.notify('重置缓存成功', '请重新运行此桌面小组件！');
    };
    table.addRow(row1);
    let row2 = new UITableRow();
    let rowtext2 = row2.addText(
      '还原设置参数',
      '若需要恢复默认参数，可尝试此操作',
    );
    rowtext2.titleFont = Font.systemFont(16);
    rowtext2.subtitleFont = Font.systemFont(12);
    rowtext2.subtitleColor = new Color('999999');
    row2.onSelect = async () => {
      const option = ['取消', '重置'];
      const message = '基础设置中的所有参数将会重置为默认值，重置后请重新打开设置菜单！';
      const index = await this.generateAlert(message, option);
      if (index === 0) return;
      this.widgetConfig(false);
      this.saveSettings(false);
      this.notify('还原设置成功', '请重新运行此桌面小组件！');
    };
    table.addRow(row2);
    await this.preferences(table, basicSettings, '基础设置');
    let imgRow = new UITableRow();
    imgRow.height = 200;
    let img = imgRow.addImage(await this.getImageByUrl('https://gitee.com/scriptxx_djg/imgebed/raw/master/DJG/settings/weixin.png',this.IMAGE_FOLDER
    ));
    img.centerAligned();
    table.addRow(imgRow);
  }
  
  /**
   * 弹出一个通知
   * @param {string} title 通知标题
   * @param {string} body 通知内容
   * @param {string} url 点击后打开的URL
   */
  async notify(title, body, opts = {openURL:"", sound:"alert"}) {
    try {
      let n = new Notification();
      n = Object.assign(n, opts);
      n.title = title;
      n.body = body;
      return await n.schedule();
    } catch (e) {throw new Error(e)}
  }

  /**
   * 获取当前插件的设置
   * @param {boolean} json 是否为json格式
   */
  getSettings(json = true, flag = true) {
    let res = json ? {} : '';
    let key = flag ? this.SETTING_KEY : this.DJG_KEY;
    let cache = '';
    if (Keychain.contains(key)) {
      cache = Keychain.get(key);
    }
    if (json) {
      try {
        res = JSON.parse(cache);
      } catch (e) {}
    } else {
      res = cache;
    }
    return res;
  }

  /**
   * 存储当前设置
   * @param {bool} notify 是否通知提示
   */
  saveSettings(notify = true, flag = true) {
    let key = flag ? this.SETTING_KEY : this.DJG_KEY;
    let setDemo = flag ? this.settings : this.djgSettings;
    let res =
      typeof setDemo === 'object'
        ? JSON.stringify(setDemo)
        : String(setDemo);
    Keychain.set(key, res);
    if (notify) this.notify('设置成功', '桌面组件稍后将自动刷新');
  }
  
  /**
   * 获取定位
   * @param {string} time 刷新间隔
   */
  async getLocation(time = this.settings.locTime) {
    let location = null;
    const isInApp = config.runsInApp;
    const cacheKey = 'DJGs_location';
    if (!Keychain.contains(cacheKey) || this.isUpdata('DJGs_uptime', "位置获取", parseInt(time))) {
      if (isInApp) {
        this.notify('正在获取位置', '此组件需要获取位置信息\n请耐心等待几秒😊');
        try {
          location = await Location.current();
        }catch(e){
          console.error(`${this.name}：${e}`);
          await this.generateAlert('请检查位置权限或网络设置', ['知道了'], '⚠️定位失败');
        }
        if(location) {
          Keychain.set(cacheKey, JSON.stringify(location));
          this.notify('位置获取成功', '桌面组件将稍后刷新。');
        }
      }
    }
    if (!location && Keychain.contains(cacheKey)) {
      location = JSON.parse(Keychain.get(cacheKey));
    }
    return location;
  }
  
  /**
   * 匹配地址
   * @param {string} location 详细地址
   * @param {string} match 区域
   * @return string
   */
  getAddress (location, match = '区') {
    const matchs = ['省','壮族自治区','回族自治区','自治州','维吾尔自治区','自治区','市','区','县','镇','路'];
    let index = matchs.findIndex(item =>{
      return item == match
    })
    let regStr = '';
    for(let i = 0; i < index+1; i++){
      regStr = i === 0 ? matchs[i] : `${regStr}|${matchs[i]}`;
    };
    let address = null;
    let citys = location.split(' ');
    index = citys.findIndex(item =>{
      return item.indexOf(match) != -1;
    });
    if(index!=-1)citys = citys.splice(0, index+1);
    let reg = RegExp(eval(`/${regStr}/g`));
    citys.forEach(function (item, index) {
      const str = citys[index].match(reg);
      if (str){
        address = citys[index];
      }
    })
    return address;
  }
  
  // 字体
  allfonts (fontName, fontSize) {
    const fontGenerator = {
      ultralight: function () {return Font.ultraLightSystemFont(fontSize)},
      light: function () {return Font.lightSystemFont(fontSize)},
      regular: function () {return Font.regularSystemFont(fontSize)},
      regularRounded: function () {return Font.regularRoundedSystemFont(fontSize)},
      medium: function () {return Font.mediumSystemFont(fontSize)},
      semibold: function () {return Font.semiboldSystemFont(fontSize)},
      bold: function () {return Font.boldSystemFont(fontSize)},
      heavy: function () {return Font.heavySystemFont(fontSize)},
      black: function () {return Font.blackSystemFont(fontSize)},
      italic: function () {return Font.italicSystemFont(fontSize)},
      lightMonospaced: function () {return Font.lightMonospacedSystemFont(fontSize)},
      boldRounded: function () {return Font.boldRoundedSystemFont(fontSize)},
    }
    const systemFont = fontGenerator[fontName];
    if (systemFont) {return systemFont()}
    return Font.systemFont(fontSize);
  }
  
  getDate() {
    Object.defineProperty(Date.prototype, "toJSON", {
	  enumerable: false,
	  configurable: true,
	  writable: true,
	  value: function () {
  		const df = new DateFormatter();
  		df.locale = "zh_cn";
  		df.dateFormat = "yyyy-MM-dd hh:mm:ss";
		return df.string(this);
	  }
    });
    return new Date();
  }
  
  /**
    * 格式化时间
    * @param {string} fmt 如 yyyy-MM-dd hh:mm:ss
    * @param {Date} date 日期
    * @returns {string}
    */
  dateFormat(fmt, date) {
    let ret;
    const opt = {
        "y+": date.getFullYear().toString(),        // 年
        "M+": (date.getMonth() + 1).toString(),     // 月
        "d+": date.getDate().toString(),            // 日
        "h+": date.getHours().toString(),           // 时
        "m+": date.getMinutes().toString(),         // 分
        "s+": date.getSeconds().toString()          // 秒
        // 有其他格式化字符需求可以继续添加，必须转化成字符串
    };
    for (let k in opt) {
        ret = new RegExp("(" + k + ")").exec(fmt);
        if (ret) {
            fmt = fmt.replace(ret[1], (ret[1].length == 1) ? (opt[k]) : (opt[k].padStart(ret[1].length, "0")))
        };
    };
    return fmt;
  }
  
  getTimeNum(time){
  	if (!time) return +new Date;
  	let date = new Date(time)
  	return Date.parse(date);
  }
  
  // 获取天气预报数据
  async getWeather(location){
    let weatherData = {};
    let url = `https://api.caiyunapp.com/v2.5/${this.settings.key}/${location.longitude},${location.latitude}/hourly.json`;
    let json = await this.http_get(url);
    weatherData.todayWeather = json.result.hourly.skycon[0].value;
    weatherData.temps = [];
    json.result.hourly.temperature.splice(0,10).forEach(function (item) {
      let temps = {};
      temps.time = item.datetime.match(/T(\d*):/)[1];
      temps.temp = item.value;
      weatherData.temps.push(temps);
    });
    return weatherData;
  }
  
  // 彩云天气
  async inputKey(){
    let title = "彩云天气key";
    let message = "· 如果没有key，点击申请";
    const idx = await this.generateAlert(message, ['申请key','输入key'], title);
    if(idx === 0) {
      const alert = new Alert()
    	title = '彩云令牌申请说明'
    	message = `在彩云官网注册账号后，选择个人开发者，输入正确的信息后，进入填写令牌申请信息页面：\n\r
    应用类别选择：彩云天气API
    应用名：Scriptable
    应用链接：在App Store复制该app链接
    应用开发情况：填写类似于"组件开发"、"开发天气小组件"等内容，自由发挥，最好不要完全一样\n\r
    开发者: DJG\n\r
    温馨提示：如果填写正确，最快一般是第二天会审核通过，并会有短信或邮件提醒。但如果因为某些原因，长时间不通过的，可以编辑邮件发送至彩云官方。`
      await this.generateAlert(message, ['已知晓'], title);
    	//alert.addCancelAction('知道了')
    	//await alert.presentAlert()
      await Safari.open('https://dashboard.caiyunapp.com/user/sign_up/');
    }else {
      await this.setCustomAction("输入彩云key", "只有输入正确的彩云key\n组件才会生效", {
        key: "此处输入彩云key",
      });
    }
  }
}

// @base.end
const Runing = async (Weather) => {
  let M = null;
  if (config.runsInApp) {
    log(`[*] Hello！`)
    log(`[*] 感谢使用锁屏天气`)
    log(`[-] 关注抖音：大舅哥科技`)
    log(`[+] 抖音有你更加精彩！`)
    log(`[/] 当前环境：${RUNTIME_VERSION}`)
    M = new Weather();
    // 弹出选择菜单
    const actions = M['_actions'];
    const table = new UITable();
    const onClick = async (item) => {
      image = await M.render();
      image = await M.shell(image);
      QuickLook.present(image, false);
    };
    const preview = [
      {
        icon: {name: "photo.tv", color: "#1890ff"},
        title: '效果预览',
        onClick,
      }
    ];
    let topRow = new UITableRow();
    topRow.height = 60;
    let leftText = topRow.addButton('➕关注');
    leftText.widthWeight = 0.3;
    leftText.onTap = async () => {
      await Safari.open('https://v.douyin.com/ePRqdq1/');
    };
    let centerRow = topRow.addImage(await M.getImageByUrl('https://gitee.com/script_djg/scriptable/raw/master/image/settings/dog.png', M.IMAGE_FOLDER));
    centerRow.widthWeight = 0.4;
    centerRow.centerAligned();
    let rightText = topRow.addButton('更新检测');
    rightText.widthWeight = 0.3;
    rightText.rightAligned();
    rightText.onTap = async () => {
      await M.versionCheck();
    };
    table.addRow(topRow)
    await M.preferences(table, preview, '锁屏天气');
    const extra = [];
    for (let _ in actions) {
      const iconItem = M._actionsIcon[_];
      const isUrl = typeof iconItem === 'string';
      const actionItem = {
        title: _,
        onClick: actions[_],
      };
      if (isUrl) {
        actionItem.url = iconItem;
      } else {
        actionItem.icon = iconItem;
      }
      extra.push(actionItem);
    }
    await M.preferences(table, extra, '配置组件');
    let imgRow = new UITableRow();
    imgRow.height = 200;
    let img = imgRow.addImage(await M.getImageByUrl('https://gitee.com/scriptxx_djg/imgebed/raw/master/DJG/settings/weixin.png', M.IMAGE_FOLDER));
    img.centerAligned();
    table.addRow(imgRow);
    return table.present();
  } else {
    M = new Weather(args.shortcutParameter);
    const image = await M.render();
    const imgData = Data.fromPNG(image).toBase64String();
    Script.setShortcutOutput(imgData);
    Script.complete();
  }
};
//  await new DJG().setWidgetConfig();
module.exports = { DJG, Runing };  