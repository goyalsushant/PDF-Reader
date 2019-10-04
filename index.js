var express = require('express')
var pdfReader = require('pdfreader')
var pdfReaderObj = new pdfReader.PdfReader

const app = express()
const port = 3000

var rows = {}; // indexed by y-position

function printRows() {
  var pageString = '';
  Object.keys(rows) // => array of y-positions (type: float)
    .sort((y1, y2) => parseFloat(y1) - parseFloat(y2)) // sort float positions
    .forEach(y => {
      pageString = pageString + (rows[y] ? rows[y] : []) + ' '
    });
    console.log(pageString.slice(pageString.search('Institution:')+ 'Institution:'.length, pageString.search('S.No.')).replace(',',''))
}

app.get('/', (req,res)=>{
    res.send('Hello World !!')
})

app.listen(port, ()=> console.log(`Example app listening on port ${port}`))

pdfReaderObj.parseFileItems("sample_page_1.pdf", function(err,item) {
    if (!item || item.page) {
      // end of file, or page
      printRows();
      rows = {}; // clear rows for next page
    } else if (item.text) {
      // accumulate text items into rows object, per line
      (rows[item.y] = rows[item.y] || []).push(item.text);
    }
  });