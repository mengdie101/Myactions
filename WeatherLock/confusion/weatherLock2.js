// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: cyan; icon-glyph: feather;
/* ------------------------------------------
Script      : 锁屏天气 Ⅱ
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
    this.ID = "DJGs-102";
    this.version = "V1.0";
    this.shortcutUrl = 'https://www.icloud.com/shortcuts/8e9cb6b19165467090cf7c923aa3718c';
    this.up = 'https://gitee.com/script_djg/scriptable/raw/master/image/triangle_up.png';
    this.down = 'https://gitee.com/script_djg/scriptable/raw/master/image/triangle_down.png';
    
    this.Run();
  }
  
  async render () {
    this.settings.x = this.settings.x || '20';
    this.settings.y = this.settings.y || '170';
    this.settings.shadowY = this.settings.shadowY || "1350";
    this.settings.alpha = this.settings.alpha || "0.1";
    this.settings.round = this.settings.round || "30";
    const weatherLockImage = await this.drawing();
  	return weatherLockImage;
  }
  
  async drawing (){try{
    const {nowWeather, futureWeather, city} = this.getWeatherInfo();
    const {width, height} = this.getScreenResolution();;
    let x = parseInt(this.settings.x); // 边框间隔
    let y = height/2 + parseInt(this.settings.y);// 整体高度
    let jsonStr = "weatherSF";
    
    const drawingBox = this.makeCanvas({width:885, height:600});
    let icon = await this.getIcon(nowWeather.weather);
    let r = new Rect(392, 0, 100, 90);
    drawingBox.drawImageInRect(icon, r);
    r = new Rect(340, 125, 200, 80);
    this.drawText(drawingBox, r, nowWeather.weather, "bold", 35, "center");
    r = new Rect(340, 180, 200, 80);
    this.drawText(drawingBox, r, city, "bold", 35, "center");
    r = new Rect(540, 320, 300, 110);
    this.drawText(drawingBox, r, nowWeather.nowTemp.split('C')[0], "regularRounded", 100, "right");
    
    icon = await this.getImageByUrl(this.up);
    drawingBox.drawImageInRect(icon, new Rect(650, 460, 45, 40));
    icon = await this.getImageByUrl(this.down);
    drawingBox.drawImageInRect(icon, new Rect(750, 460, 45, 40));
    
    r = new Rect(690, 460, 60, 40);
    this.drawText(drawingBox, r, nowWeather.maxTemp.split('C')[0], "regularRounded", 30, "center");
    r = new Rect(790, 460, 60, 40);
    this.drawText(drawingBox, r, nowWeather.minTemp.split('C')[0], "regularRounded", 30, "center");
    r = new Rect(560, 530, 80, 40);
    this.drawText(drawingBox, r, '日出', "bold", 30, "left");
    r = new Rect(625, 530, 80, 40);
    this.drawText(drawingBox, r, nowWeather.sunrise, "regularRounded", 30, "left");
    r = new Rect(710, 530, 80, 40);
    this.drawText(drawingBox, r, '日落', "bold", 30, "left");
    r = new Rect(775, 530, 80, 40);
    this.drawText(drawingBox, r, nowWeather.sunset, "regularRounded", 30, "left");
    for(let i = 0; i < 3; i++) {
      icon = await this.getIcon(futureWeather[i].weather);
      drawingBox.drawImageInRect(icon, new Rect(20, 250+i*120, 90, 85));
      r = new Rect(140, 255+i*120, 200, 40);
      this.drawText(drawingBox, r, futureWeather[i].week, "bold", 30, "left");
      r = new Rect(140, 300+i*120, 200, 40);
      this.drawText(drawingBox, r, futureWeather[i].temp, "regularRounded", 27, "left");
    }
    
    let box = drawingBox.getImage();
    
    const canvas = this.makeCanvas({width, height});
    r = new Rect(0, parseFloat(this.settings.shadowY), width, height);
    this.shadowCanvas(canvas, r, parseFloat(this.settings.alpha), parseFloat(this.settings.round));
    let boxWidth = width - 2*x;
    let boxHeight = boxWidth*box.size.height/box.size.width; 
    r = new Rect(x, y, boxWidth, boxHeight);
    canvas.drawImageInRect(box, r);
    return canvas.getImage();}catch(e){log(e)}
  }
  
  // 取得天气信息
  getWeatherInfo(){
    let nowWeather = {}, futureWeather = [], city;
    let weatherInfo = this.arg;
    if(weatherInfo) {
      const todayWeather = weatherInfo.today;
      nowWeather.weather = todayWeather.weather;
      nowWeather.nowTemp = todayWeather.nowTemp.replace('C', '');
      nowWeather.maxTemp = todayWeather.maxTemp.replace('C', '');
      nowWeather.minTemp = todayWeather.minTemp.replace('C', '');
      nowWeather.sunrise = todayWeather.sunrise;
      nowWeather.sunset = todayWeather.sunset;
      
      weatherInfo.futureWeather.forEach(function (item) {
        const dates = item.date.split(' ');
        let json = {};
        json.week = dates[1].replace('星期', '周');
        json.weather = item.weather;
        json.temp = item.temp.replaceAll('C', '');
        json.date = dates[0];
        futureWeather.push(json);
      })
      // 强制排序
      futureWeather.sort(function(a, b){return new Date(a.date).getTime() - new Date(b.date).getTime()});
      city = this.getAddress (weatherInfo.location);
    } else {
      nowWeather = {weather: "局部阵雨", nowTemp: "27°",maxTemp: "25°",minTemp: "19°", sunrise: "07:40", sunset: "18:30"};
      futureWeather = [
      {"week":"周二","weather":"多云","temp":"18°~21°"},
      {"week":"周三","weather":"晴朗","temp":"18°~20°"},
      {"week":"周四","weather":"晴朗","temp":"18°~22°"}];
      city = '杭州市';
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
        const message = "1、左右两边的间隔，如：100\n2、整体高度，数值大高度低\n3、阴影高度，数值大高度低\n4、背景阴影的圆角大小\n5、背景阴影的透明度";
        await this.setCustomAction("参数设置", message, {
          x: "边框宽度，如：20",
          y: "整体高度，如：120",
          shadowY: "阴影高度，如：1300",
          round: "阴影圆角，如：30",
          alpha: "阴影透明，如：0.1"
        });
      }, {name: 'slider.horizontal.3', color: '#EE7942' });
    };
  }
}
// @组件代码结束
await Runing(Weather)