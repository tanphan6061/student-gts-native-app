const status = require('http-status');
const axios = require('axios');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const urlOverallScores = 'https://sv.ut.edu.vn/Xemdiem.aspx';

const getOverallData = (tableOverall) => {
  //get data overall
  const overall = {
    totalCredits: null,
    averageScore: {
      tenPointScale: null,
      fourPointScale: null,
    },
    creditDebt: {
      amount: null,
      percent: null,
    },
    graduationRating: null,
  };

  const averageScore = tableOverall[0].children[1].children[1].textContent
    .replace(/\s+/g, ' ')
    .trim()
    .split(' - ');
  const creditDebt = tableOverall[1].children[0].children[1].textContent
    .replace(/\s+/g, ' ')
    .trim()
    .split(' - ');

  overall.totalCredits = tableOverall[0].children[0].children[1].textContent
    .replace(/\s+/g, ' ')
    .trim();
  overall.averageScore.tenPointScale = averageScore[0];
  overall.averageScore.fourPointScale = averageScore[1];
  overall.creditDebt.amount = averageScore[0];
  overall.creditDebt.percent = averageScore[1];
  overall.graduationRating = tableOverall[1].children[1].children[1].textContent
    .replace(/\s+/g, ' ')
    .trim();
  return overall;
};

const getScoresData = (tableScores) => {
  // get data scores
  const data = [];
  let currentSubject = 0;
  let currentSemesterKey = 0;

  for (let keyRow = 3; keyRow < tableScores.length; keyRow++) {
    const row = tableScores[keyRow];
    if (row.classList.contains('quater')) {
      currentSubject = 0;
      currentSemesterKey =
        data.push({
          semester: row.textContent.replace(/\s+/g, ' ').trim(),
          subjects: [],
        }) - 1;
      continue;
    }

    data[currentSemesterKey].subjects.push({
      id: null,
      name: null,
      class: null,
      credits: null,
      attendanceScore: null,
      examScore: null,
      averageScore: {},
      classify: null,
    });
    const subject = data[currentSemesterKey].subjects[currentSubject];
    currentSubject += 1;

    const cellList = row.querySelectorAll('td');
    for (let keyCell = 1; keyCell < cellList.length; keyCell++) {
      const cellContent = cellList[keyCell].textContent
        .replace(/\s+/g, ' ')
        .trim();
      if (keyCell === 1) subject.id = cellContent;
      else if (keyCell === 2) subject.name = cellContent;
      else if (keyCell === 3) subject.class = cellContent;
      else if (keyCell === 4) subject.credits = cellContent;
      else if (keyCell === 6 && cellList.length === 17)
        subject.attendanceScore = cellContent;
      else if (
        (keyCell === 10 && cellList.length === 17) ||
        (cellList.length === 14 && keyCell === 7)
      )
        subject.examScore = cellContent;
      else if (
        (keyCell === 12 && cellList.length === 17) ||
        (cellList.length === 14 && keyCell === 9)
      )
        subject.averageScore.fourPointScale = cellContent;
      else if (
        (keyCell === 13 && cellList.length === 17) ||
        (cellList.length === 14 && keyCell === 10)
      )
        subject.averageScore.tenPointScale = cellContent;
      else if (
        (keyCell === 14 && cellList.length === 17) ||
        (cellList.length === 14 && keyCell === 11)
      )
        subject.averageScore.word = cellContent;
      else if (
        (keyCell === 15 && cellList.length === 17) ||
        (cellList.length === 14 && keyCell === 12)
      )
        subject.classify = cellContent;
    }
  }
  return data;
};

module.exports.getOverallScores = async (req, res) => {
  const cookie = req.token;

  axios
    .get(urlOverallScores, {
      headers: {
        Cookie: `ASP.NET_SessionId=${cookie};`,
      },
    })
    .then((data) => {
      const { document } = new JSDOM(data.data).window;
      const isInValidToken = document.getElementById(
        'ctl00_ucRight1_txtSercurityCode'
      );
      if (isInValidToken)
        return res.status(status.FORBIDDEN).json({
          message: 'token invalid',
        });

      const tableOverall = [
        ...document.querySelectorAll('.tblKetQuaHocTap.tntinchi tr'),
      ];
      const tableScores = [
        ...document.querySelectorAll('.tblKetQuaHocTap:not(.tntinchi) tr'),
      ].filter((i) => i.textContent.trim() !== '');

      const overall = getOverallData(tableOverall);
      const dataScores = getScoresData(tableScores);

      res.json({ overall, data: dataScores });
    })
    .catch((err) => {
      return res.status(status.INTERNAL_SERVER_ERROR).json({
        message: err.message,
      });
    });
};
