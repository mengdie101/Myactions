/**
   * 常见问题
   */
  const faqTable = async (flow1, flow2) => {
    const table = new UITable();
    table.showSeparators = true;
    try {
      let faqData = new Request(
        'https://gitee.com/script_djg/scriptable/raw/master/WeatherLock/faq.json',
      );
      faqData = await faqData.loadJSON();
      faqData.data.forEach((item, i) => {
        let header = new UITableRow();
        header.backgroundColor = Color.dynamic(
          new Color('F5F5F5'),
          new Color('000000'),
        );
        if(item.name){
          let heading = header.addText(item.name);
          heading.titleFont = Font.mediumSystemFont(17);
          heading.centerAligned();
          table.addRow(header);
        }
        item.item.forEach((faq) => {
          let row = new UITableRow();
          row.height = parseFloat(faq['height']);
          let rowtext = row.addText(faq['question'], faq['answer']);
          rowtext.titleFont = Font.mediumSystemFont(16);
          rowtext.titleColor = faq['url'] ? Color.red() : Color.blue();
          rowtext.subtitleFont = Font.systemFont(14);
          rowtext.subtitleColor = Color.dynamic(
            new Color('000000', 0.7),
            new Color('ffffff', 0.7),
          );
          if(faq['url']){
            row.onSelect = async () => {
	  		  await Safari.open(faq['url'])
		    }
          }
          table.addRow(row);
        });
      })
      let info = new UITableRow();
      info.height = parseFloat(faqData.height);
      let desc = info.addText(faqData.update);
      desc.titleFont = Font.mediumSystemFont(14);
      desc.titleColor = new Color('000000', 0.4)
      table.addRow(info);
      await table.present();
    } catch (e) {
      await generateAlert("啊～哦～貌似又断网了", ['知道了']);
    }
  }
  
  const generateAlert = async (message, options, title) => {
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
  
  //await faqTable()
  module.exports = faqTable;