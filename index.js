var express = require('express')
var pdfReader = require('pdfreader')
var fs = require('fs')
var pdfReaderObj = new pdfReader.PdfReader

const app = express()
const port = 3000
var instituteName = '';
var rows = {}; // indexed by y-position
var allStudentData = {};
var subject_codes = {}

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
      while (11 * n + 2 < subjectPageString.length) {
        subject_codes[subjectPageString[11 * n + 2]] = subjectPageString[11 * n + 4]  
        n++
      }
      subjectLength = Object.keys(subject_codes).length
    } else {
      pageString = pageString.substr(pageString.indexOf(instituteName) + instituteName.length)
      var enrollmentNumbers = pageString.match(/[\d+]{11},/g)
      var enrolIndex = 0
      var studentString = []
      while (enrolIndex <= (enrollmentNumbers.length - 1)) {
        fullStudentString = pageString.slice(pageString.indexOf(enrollmentNumbers[enrolIndex]), pageString.indexOf(enrollmentNumbers[enrolIndex + 1]))
        studentString.push(fullStudentString.substr(0, fullStudentString.indexOf('SchemeID:')))
        enrolIndex++
      }
      var updatedSubjectCodes = studentString.map(value => {
        var updatedValue;
        var studentEnroll = value.split(',')[0]
        updatedValue = value.split(/\([^)]*\)[,  ]*/)
        var subjectChosen = []
        var index
        subjectChosen.push(value.split(',')[1].replace(/\([^)]*\)[,  ]*/, ''))
        for (index = 1; index < updatedValue.length-1; index++) {
          subjectChosen.push(updatedValue[index])
        }
        studentName = value.slice(value.indexOf(value.match(/[a-zA-Z]/)), value.indexOf('SID:')).trim()
        marksString = updatedValue[index].replace('-,', ' - ').slice(updatedValue[index].indexOf('SID:')+4).trim().split(',')
        marksArray = {}
        totalMarks = 0
        for (index=0; index<marksString.length;index++){
          var marks = marksString[index].trim().split(' ')
          if(subject_codes.hasOwnProperty(subjectChosen[index])) {
            subjectName = subject_codes[subjectChosen[index]]
          }
          if (index === 0) {
            internalMarks = isNaN(parseInt(marks[2])) ? 0 : parseInt(marks[2])
            externalMarks = isNaN(parseInt(marks[4])) ? 0 : parseInt(marks[4])
            subjectTotal = internalMarks + externalMarks
            marksArray[subjectName] = {
              'internal': internalMarks,
              'external': externalMarks,
              'total': subjectTotal,
            }
            totalMarks+=subjectTotal
          }
          else {
            internalMarks = isNaN(parseInt(marks[0])) ? 0 : parseInt(marks[0])
            externalMarks = isNaN(parseInt(marks[2])) ? 0 : parseInt(marks[2])
            subjectTotal = internalMarks + externalMarks
            marksArray[subjectName] = {
              'internal': internalMarks,
              'external': externalMarks,
              'total': subjectTotal,
            }
            totalMarks+=subjectTotal
          }
        }
        allStudentData[studentEnroll] = {
          'name': studentName,
          'institute': instituteName.replace(',','').trim(),
          'enrollment_number': studentEnroll,
          'total_marks': totalMarks,
          'percentage': (totalMarks/subjectLength).toFixed(2),
          'marks': marksArray,
        }
        return updatedValue
      })
    }
  }
}

app.get('/', (req, res) => {
  res.send('Hello World !!')
})

app.get('/data', (req, res) => {
  jsonContent = JSON.stringify(allStudentData, null, 4)
  fs.writeFile("1.json", jsonContent, 'utf8', function(err) {
    if(err) {
        return console.log(err);
    }
    console.log("The file was saved!");
  });
})

app.listen(port, () => console.log(`Example app listening on port ${port}`))

pdfReaderObj.parseFileItems("sample_full_1.pdf", function (err, item) {
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
}