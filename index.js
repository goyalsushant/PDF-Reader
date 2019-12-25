var express = require('express')
var pdfReader = require('pdfreader')
var fs = require('fs')
var MongoCLient = require('mongodb').MongoClient;

var dbUrl = 'mongodb://result:result123@ds357708.mlab.com:57708/ipu_result'

var pdfReaderObj = new pdfReader.PdfReader
var sem1 = require('./1.json')
var sem2 = require('./2.json')
var sem3 = require('./3.json')
var sem4 = require('./4.json')
var sem5 = require('./5.json')
var sem6 = require('./6.json')
var sem7 = require('./7.json')
var sem8 = require('./8.json')

var files = [sem1, sem2, sem3, sem4, sem5, sem6, sem7, sem8];
const app = express()
const port = 3000
var instituteName = '';
var rows = {}; // indexed by y-position
var allStudentData = {};
var subject_codes = {}

MongoCLient.connect(dbUrl, (err, db) => {
  console.log("cONNECTED");
  db.close()
})

function printRows() {
  var pageString = '';
  Object.keys(rows) // => array of y-positions (type: float)
    .sort((y1, y2) => parseFloat(y1) - parseFloat(y2)) // sort float positions
    .forEach(y => {
      pageString = pageString + (rows[y] ? rows[y] : []) + ' '
    });
  if (pageString.length != 0) {
    var pageString = pageString.replace('TEC,HNOLOGY', 'TECHNOLOGY')
    var pageString = pageString.replace('ADMINISTRA,TION', 'ADMINISTRATION')
    var pageString = pageString.replace('ENGINE,ERS', 'ENGINEERS')
    var pageString = pageString.replace('CERTIFICATI,ON', 'CERTIFICATION')
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
          'percentage': (totalMarks/subjectChosen.length).toFixed(2),
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
  fs.writeFile("7.json", jsonContent, 'utf8', function(err) {
    if(err) {
        return console.log(err);
    }
    res.send('The file was saved!');
    console.log("The file was saved!");
  });
})

app.get('/:sem/:id', (req, res) => {
  res.send(files[parseInt(req.params.sem)-1][req.params.id])
})
app.listen(port, () => console.log(`Example app listening on port ${port}`))

pdfReaderObj.parseFileItems("sample_full_7.pdf", function (err, item) {
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