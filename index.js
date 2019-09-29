var express = require('express')
var pdfReader = require('pdfreader')
var pdfReaderObj = new pdfReader.PdfReader

const app = express()
const port = 3000

var rows = {}; // indexed by y-position
 
function printRows() {
  Object.keys(rows) // => array of y-positions (type: float)
    .sort((y1, y2) => parseFloat(y1) - parseFloat(y2)) // sort float positions
    .forEach(y => console.log((rows[y] || []).join("")));
}

app.get('/', (req,res)=>{
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
})

app.listen(port, ()=> console.log(`Example app listening on port ${port}`))