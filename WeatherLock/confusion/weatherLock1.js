// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: cyan; icon-glyph: feather;
/* ------------------------------------------
Script      : 锁屏天气 Ⅰ
Author      : DJG
Version     : 1.0.0
Description : 配合快捷指令使用，请勿添加到桌面
Platform    : 微信公众号「大舅哥科技」
Docs        : gitee.com/script_djg/scriptable
------------------------------------------ */

const { DJG, Runing } = importModule("./DJGs");

// @组件代码开始
class Weather extends DJG {
  constructor(arg) {
    super(arg);
    this.name = '锁屏天气 Ⅰ';
    this.ID = "DJGs-101";
    this.version = "V1.0";
    this.shortcutUrl = 'https://www.icloud.com/shortcuts/4346093864a54c1da714515be3b98916';
    this.humidity = 'https://gitee.com/script_djg/scriptable/raw/master/image/humidity.PNG';
    this.refresh = 'https://gitee.com/script_djg/scriptable/raw/master/image/icon_ref.png';
    
    this.Run();
  }
  
  async render () {
    this.settings.x = this.settings.x || '120';
    this.settings.y = this.settings.y || '620';
    const weatherLockImage = await this.drawing();
  	return weatherLockImage;
  }
  
  async drawing (){
    const {nowWeather, futureWeather, city} = this.getWeatherInfo();
    const {width, height} = this.getScreenResolution();;
    let x = parseInt(this.settings.x); // 边框间隔
    let y = height/2 + parseInt(this.settings.y);// 整体高度
    let jsonStr = "weatherSF";
    
    const drawingBox = this.makeCanvas({width:885, height:600});
    let icon = await this.getIcon(nowWeather.weather, jsonStr, 90);
    let r = new Rect(0, 0, icon.size.width, icon.size.height);
    drawingBox.drawImageInRect(icon, r);
    r = new Rect(icon.size.width + 50, 0, 200, 80);
    this.drawText(drawingBox, r, nowWeather.nowTemp.split('C')[0], "regularRounded", 80, "left");
    icon = await this.getImageByUrl(this.humidity);
    r = new Rect(0, 130, 40, 40);
    drawingBox.drawImageInRect(icon, r);
    r = new Rect(50, 130, 90, 35);
    this.drawText(drawingBox, r, nowWeather.probability+"%", "bold", 35, "left")
    r = new Rect(150, 130, 150, 37);
    this.drawText(drawingBox, r, nowWeather.temp.replace(/C/g, ''), "bold", 35, "center");
    icon = await this.getImageByUrl(this.refresh);
    drawingBox.drawImageInRect(icon, new Rect(2, 210, 40, 40));
    const upTime = this.dateFormat('MM/dd hh:mm', new Date())
    r = new Rect(60, 210, 235, 40);
    this.drawText(drawingBox, r, upTime, "bold", 35, "left");
    for(let i = 0; i < 3; i++) {
      r = new Rect(400+i*180+5, 10, 90, 40);
      this.drawText(drawingBox, r, futureWeather[i].week, "bold", 38, "center");
      icon = await this.getIcon(futureWeather[i].weather);
      drawingBox.drawImageInRect(icon, new Rect(400+i*180, 90, 95, 87));
      r = new Rect(400+i*180-35, 210, 180, 36);
      this.drawText(drawingBox, r, futureWeather[i].temp.replace(/C/g, ''), "bold", 33, "center");
    }
    r = new Rect(242, 345, 400, 80)
    this.drawText(drawingBox, r, city + " • " + nowWeather.weather, "bold", 40, "center");
    const box = drawingBox.getImage();
    
    const canvas = this.makeCanvas({width, height});
    let boxWidth = width - 2*x;
    let boxHeight = boxWidth*box.size.height/box.size.width; 
    r = new Rect(x, y, boxWidth, boxHeight);
    canvas.drawImageInRect(box, r);
    return canvas.getImage();
  }
  
  // 取得天气信息
  getWeatherInfo(){
    let nowWeather = {}, futureWeather = [], city;
    let weatherInfo = this.arg;
    if(weatherInfo) {
      nowWeather.weather = weatherInfo.weather;
      nowWeather.temp = weatherInfo.temp;
      nowWeather.nowTemp = weatherInfo.nowTemp;
      nowWeather.probability = weatherInfo.probability;
      
      weatherInfo.weathers.forEach(function (item, index) {
        const dates = item.date.split(' ');
        let json = {};
        json.week = dates[1].replace('星期', '周');
        json.weather = item.weather;
        json.temp = item.temp;
        json.date = dates[0];
        futureWeather.push(json);
      })
      // 强制排序
      futureWeather.sort(function(a, b){return new Date(a.date).getTime() - new Date(b.date).getTime()});
      city = this.getAddress (weatherInfo.location);
    } else {
      nowWeather = {"weather":"局部多云","temp":"18°C~22°C","nowTemp":"19°C","probability":"30"}
      futureWeather = [
      {"week":"周二","weather":"晴朗无云","temp":"11°~32°"},
      {"week":"周三","weather":"局部多云","temp":"22°~28°"},
      {"week":"周四","weather":"有雪","temp":"11°~33°"}];
      city = '台湾省';
    }
    
    return {nowWeather, futureWeather, city};
  }
  
  // 添加设置信息
  Run() {
    if (config.runsInApp) {
      this.registerAction("基础设置", this.setWidgetConfig);
      this.registerAction("快捷指令", async () => {
        Safari.open(this.shortcutUrl);
      }, {name: 'location.circle', color: '#66CD00' });
      this.registerAction("参数设置", async () => {
        const message = "1、左右两边的间隔，如：100\n2、整体高度，数值大高度低";
        await this.setCustomAction("参数设置", message, {
          x: "边框宽度",
          y: "整体高度"
        });
      }, {name: 'slider.horizontal.3', color: '#EE7942' });
    };
  }
}
// @组件代码结束
await Runing(Weather)