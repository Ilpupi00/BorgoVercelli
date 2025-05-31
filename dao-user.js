'use strict';

const sqlite=require('./db');
const bcrypt=require('bcrypt');


exports.createUser=function(user){
    return new Promise((resolve,reject)=>{
        const sql = 'INSERT INTO UTENTI (id,nome'
    })

}


