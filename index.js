var express = require('express')
var pdfReader = require('pdfreader')
var pdfReaderObj = new pdfReader.PdfReader

const app = express()
const port = 3000
var instituteName = '';
var rows = {}; // indexed by y-position

function printRows() {
  var pageString = '';
  Object.keys(rows) // => array of y-positions (type: float)
    .sort((y1, y2) => parseFloat(y1) - parseFloat(y2)) // sort float positions
    .forEach(y => {
      pageString = pageString + (rows[y] ? rows[y] : []) + ' '
    });
  if (pageString.length != 0) {
    if (getInstituteName(pageString) != '') {
      instituteName = getInstituteName(pageString)
      var subjectPageString = pageString.split('Pass Marks')[1].split(',')
      var n = 0
      var subject_codes = {}
      while (11 * n + 2 < subjectPageString.length) {
        subject_codes[subjectPageString[11 * n + 2]] = subjectPageString[11 * n + 4]
        n++
      }
    } else {
      pageString = pageString.substr(pageString.indexOf(instituteName) + instituteName.length)
      var enrollmentNumbers = pageString.match(/[\d+]{11},/g)
      var enrolIndex = 0
      var studentString = []
      // enrollmentNumbers.forEach(enrollment => {
      //   pageString.substr(some, pageString.indexOf(enrollment))
      //   pageString = pageString 
      // }) 
      // console.log(enrollmentNumbers);
      // console.log(enrollmentNumbers.length);
      while (enrolIndex <= (enrollmentNumbers.length - 1)) {
        fullStudentString = pageString.slice(pageString.indexOf(enrollmentNumbers[enrolIndex]), pageString.indexOf(enrollmentNumbers[enrolIndex + 1]))
        studentString.push(fullStudentString.substr(0, fullStudentString.indexOf('SchemeID:')))
        enrolIndex++
      }
      console.log(studentString);
      // var updatedSubjectCodes = subjectCodes.map(value => {
      //   var updatedValue;
      //   // updatedValue = value.trim()
      //   updatedValue = value.substr(0, value.indexOf('(') != -1 ? value.indexOf('(') : value.length)
      //   return updatedValue
      // })
    }
  }
}
app.get('/', (req, res) => {
  res.send('Hello World !!')
})

app.listen(port, () => console.log(`Example app listening on port ${port}`))

pdfReaderObj.parseFileItems("sample_2.pdf", function (err, item) {
  if (!item || item.page) {
    // end of file, or page
    printRows();
    rows = {}; // clear rows for next page
  } else if (item.text) {
    // accumulate text items into rows object, per line
    (rows[item.y] = rows[item.y] || []).push(item.text);
  }
});

function getInstituteName(pageText) {
  return pageText.slice(pageText.search('Institution:') + 'Institution:'.length, pageText.search('S.No.'))
  // return pageText.slice(pageText.search('Institution:')+ 'Institution:'.length, pageText.search('S.No.')).replace(',','')
}