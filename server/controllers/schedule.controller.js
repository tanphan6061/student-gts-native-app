const status = require('http-status');
const axios = require('axios');
const qs = require('querystring');
const moment = require('moment');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const scheduleWeekURL = 'https://sv.ut.edu.vn/LichHocLichThiTuan.aspx';

const convertKeyObject = (key) => {
  key = key.toLowerCase().replace(':', '');
  switch (key) {
    case 'tiết':
      return 'lesson';
    case 'nhóm':
      return 'group';
    case 'từ sĩ số':
      return 'fromPopulation';
    case 'phòng':
      return 'room';
    case 'ghi chú':
      return 'note';
    case 'gv':
      return 'lecturers';
  }
};

const getData = (lichTable) => {
  const data = [];
  for (let keyRow = 0; keyRow < lichTable.length; keyRow++) {
    const row = lichTable[keyRow].children;
    for (let keyCell = 0; keyCell < row.length; keyCell++) {
      if (keyCell === 0) continue;
      let cell = row[keyCell];
      if (keyRow === 0) {
        data.push({
          day: cell.textContent.replace(/\s+/g, ' ').trim(),
          isToday: cell.classList.contains('current-date'),
          morning: {},
          afternoon: {},
          evening: {},
        });
        continue;
      }

      let key = 'morning';
      if (keyRow === 2) key = 'afternoon';
      else if (keyRow === 3) key = 'evening';

      cell = cell.querySelector('td > div');
      if (cell) {
        const keyData = data[keyCell - 1][key];
        if (cell.classList.contains('div-LichThi')) keyData.isExam = true;
        const cellObject = cell.querySelectorAll(
          'span:not(.span-display-header)'
        );

        for (
          let keyCellObject = 0;
          keyCellObject < cellObject.length;
          keyCellObject++
        ) {
          if (keyCellObject === 0)
            keyData.idSubject = cellObject[keyCellObject].textContent.trim();
          else if (keyCellObject === 1)
            keyData.subject = cellObject[keyCellObject].textContent.trim();
          else {
            if (keyCellObject % 2 === 0) {
              keyData[
                convertKeyObject(cellObject[keyCellObject].textContent.trim())
              ] = cellObject[keyCellObject + 1].textContent.trim();
            }
          }
        }
      }
    }
  }
  return data;
};

module.exports.getScheduleWeekByDate = async (req, res) => {
  const { date } = req.body;
  const cookie = req.token;
  if (
    !moment(date, 'DD/MM/YYYY', true).isValid() &&
    !moment(date, 'DD-MM-YYYY', true).isValid()
  )
    return res.status(status.BAD_REQUEST).json({ message: 'Invalid date' });
  axios
    .post(
      scheduleWeekURL,
      qs.stringify({
        __VIEWSTATE: null,
        ctl00$ContentPlaceHolder$txtDate: date,
      }),
      {
        headers: {
          Cookie: `ASP.NET_SessionId=${cookie};`,
        },
      }
    )
    .then((data) => {
      const { document } = new JSDOM(data.data).window;

      const isInValidToken = document.getElementById(
        'ctl00_ucRight1_txtSercurityCode'
      );
      if (isInValidToken)
        return res.status(status.FORBIDDEN).json({
          message: 'token invalid',
        });

      const lichTable = document.querySelectorAll(
        '.div-ChiTietLich > table tr'
      );

      const scheduleOfWeek = getData(lichTable);
      return res.json({ scheduleOfWeek });
    })
    .catch((err) => {
      return res.status(status.INTERNAL_SERVER_ERROR).json({
        message: err.message,
      });
    });
};
