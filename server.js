const express=require('express');
const port=3000;

const app=express();
app.use(express.json());
app.use(express.static(__dirname + '/public'));

app.get('/',(res,req)=>{
    res.sendFile (__dirname + '/index.html');
});

app.listen(port,()=>{
    console.log(`Server is running on http://localhost:${port}`);
});
