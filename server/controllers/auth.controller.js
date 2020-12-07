const status = require('http-status');
const puppeteer = require('puppeteer');
const USERNAME_SELECTOR = '#ctl00_ucRight1_txtMaSV';
const PASSWORD_SELECTOR = '#ctl00_ucRight1_txtMatKhau';
const LOGIN_SELECTOR = '#ctl00_ucRight1_btnLogin';
const urlLogin = 'https://sv.ut.edu.vn';
const fs = require('fs');
const Tesseract = require('tesseract.js');
const md5 = require('crypto-js/md5');

module.exports.login = async (req, res) => {
  const { mssv, password } = req.body;

  // init page
  var message = '';
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('dialog', async (dialog) => {
    message = await dialog.message();
    await dialog.dismiss();
    return res.status(status.UNAUTHORIZED).json({
      message,
    });
  });
  await page.goto(urlLogin);

  // enter mssv and password
  await page.click(USERNAME_SELECTOR);
  await page.keyboard.type(mssv);
  await page.click(PASSWORD_SELECTOR);
  await page.keyboard.type(password);

  // get code
  let isCorrectCode = true;
  let code = '';
  while (true) {
    if (isCorrectCode === false) {
      await page.click('#imgRefresh');
    }
    await page.waitForSelector('#imgSecurityCode');
    let md5Code = await page.evaluate(
      () => document.getElementById('txtSecurityCodeValue').value
    );

    await page.waitForSelector('#imgSecurityCode');
    let imgCode = await page.evaluate(() => {
      const img = document.getElementById('imgSecurityCode');
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      var ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      var dataURL = canvas.toDataURL('image/png');
      return dataURL;
    });

    try {
      code = (await Tesseract.recognize(imgCode)).data.text.replace('\n', '');
    } catch (err) {
      res.status(status.INTERNAL_SERVER_ERROR).json({ message: err.message });
    }

    if (md5(code).toString() !== md5Code) isCorrectCode = false;
    else break;
  }

  //enter code
  await page.click('#ctl00_ucRight1_txtSercurityCode');
  await page.keyboard.type(code);

  // login
  await page.click(LOGIN_SELECTOR);
  await page.waitForNavigation({ waitUntil: 'networkidle0' });
  const cookies = await page.cookies();
  const fullname = await page.evaluate(() => {
    const fullname = document.getElementById('ctl00_ucRight1_Span2');
    if (fullname) return fullname.innerText;
    return '';
  });

  await browser.close();
  if (!message)
    return res.json({
      mssv,
      fullname,
      token: cookies.find((i) => i.name === 'ASP.NET_SessionId').value,
    });
};

module.exports.logout = async (req, res) => {
  return res.json({
    message: 'Logout successful',
  });
};
