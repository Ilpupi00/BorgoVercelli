const express=require('express');
const morgan=require('morgan');
const path=require('path');
const port=3000;

const app=express();
app.use(express.json());
app.use(morgan('tiny'));

app.use(express.static('public', {
  setHeaders: (res, path) => {
    if (path.endsWith('.js') || path.endsWith('.mjs')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
  }
}));


app.get('/',(res,req)=>{
    res.sendFile (path.join(__dirname, 'public', 'index.html'));
});

app.listen(port,()=>{
    console.log(`Server is running on http://localhost:${port}`);
});
