var express = require('express')
var pdfReader = require('pdfreader')
var pdfReaderObj = new pdfReader.PdfReader

const app = express()
const port = 3000

app.get('/',(req,res) => res.send('Hello World'))

app.listen(port, ()=> console.log(`Example app listening on port ${port}`))

pdfReaderObj.parseFileItems("sample.pdf", function(err, item) {
    if (err) callback(err);
    else if (!item) callback();
    else if (item.text) console.log(item.text);
  });