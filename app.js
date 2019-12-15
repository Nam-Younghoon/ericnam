var fs = require('fs');
var ejs = require('ejs');
var mysql = require('mysql');
var express = require('express');
var bodyParser = require('body-parser');
var crypto = require('crypto');
var path = require('path');
var cookieParser = require('cookie-parser');


var client = mysql.createConnection({
  user:'root',
  password:'960523',
  database:'term'
});
client.connect();

var app = express();

app.set('view engine', 'ejs');




app.use(bodyParser.urlencoded({
  extended: false
}));

app.use(cookieParser());


app.get('/map', function(request, response){
  var cookie = request.cookies.user;
  var admin = request.cookies.admin;
  if(cookie||admin){
  fs.readFile('map.html', 'utf8', function(error, data){
    response.send(data);
  });
} else { response.redirect('/');}
});


app.get('/', function(request, response){

  fs.readFile('login.html', 'utf8', function(error, data){
    response.send(data);
  });
});

app.get('/main', function(request, response){
  var cookie = request.cookies.user;
  var admin = request.cookies.admin;
  if(cookie||admin){
  fs.readFile('main.html', 'utf8', function(error, data){
    response.send(data);
  });
} else { response.redirect('/');}
});

app.post('/', function(request, response){
       var email = request.body.email; // post로 받게 된 email(=ID)
       var password = request.body.password; // post로 받게 된 password


       client.query('SELECT * FROM accounts WHERE email=?', [email],
          function(error, results){
         if(error){
           console.log(error);
           response.redirect('/');
         } else {
           if(results.length>0){
             if(results[0].email != 'huny3410@naver.com' && results[0].password == password){
               response.cookie('user', email, {maxAge: 900000, httpOnly:true});
               response.redirect('/main');
             } else if(results[0].email == 'huny3410@naver.com' && results[0].password == password){
               response.cookie('admin', email, {maxAge: 900000, httpOnly:true});
               response.redirect('/main');
             }
             else {
               console.log(error);
               response.redirect('/');
             }
           } else {
             console.log(error);
             response.write('<script language="javascript"> alert("Please register"); window.location.href=("/");</script>');

           }
         }
       });
     });

app.get('/register', function(request, response){
  fs.readFile('register.html', 'utf8', function(error, data){
    response.send(data);
  });
});

app.post('/register', function(request, response){
    var body = request.body;

    try{
      var name = body.name;
      var email = body.email;
      var password = body.password;

      var key = 'myeky';
      var cipher = crypto.createCipher('aes192', key);
      var decipher = crypto.createDecipher('aes192', key);
      cipher.update(password, 'utf8', 'base64');
      var cipheredOutput = cipher.final('base64');

        client.query("SELECT * FROM accounts WHERE email=?",
         [body.email], function(error, data){
           if(data.length==0){
             client.query('INSERT INTO accounts(name, email, password) VALUES(?,?,?)',
             [body.name, body.email, body.password], function(request, response){
               console.log(name, email, password);
             });
           }
           else {
             response.redirect('/register');
           }
         });
         decipher.update(cipheredOutput, 'base64', 'utf8');
         var decipheredOutput = decipher.final('utf8');

         console.log('원문 : '+password);
         console.log('암호화 : '+cipheredOutput);
         console.log('복호화 : '+decipheredOutput);
        response.redirect('/');

    } catch(err){
      console.log(err);
    }

  });

  app.get('/list', function(request, response){
    var cookie = request.cookies.user;
    var admin = request.cookies.admin;
    if(cookie||admin){
    fs.readFile('list.html', 'utf8', function(error,data){
      client.query('SELECT * FROM board', function (error, results){
        response.send(ejs.render(data, {
          data:results
        }));
      });
    });
  } else {
    response.redirect('/');
  }
  });

  app.get('/list/:title', function(request, response){
    var cookie = request.cookies.user;
    var admin = request.cookies.admin;
    if(cookie||admin){
    fs.readFile('read.html', 'utf8', function(error, data){
      client.query('SELECT * FROM board WHERE title=?', [request.params.title], function(err, results){
        response.send(ejs.render(data, {
          data:results[0]
        }));
      });

      client.query('UPDATE board SET hit = hit + 1 WHERE title = ?', [request.params.title], function(){});
    });

      client.query('SELECT * FROM comment_notify WHERE title=?', [request.params.title], function(){});
    } else {
      response.redirect('/');
    }
  });

  app.get('/insert_notify', function(request, response){
    var user = request.cookies.admin;
    if(user=='huny3410@naver.com'){
    fs.readFile('insert_notify.html', 'utf8', function(error, data){
      response.send(data);
    });
  } else { response.write('<script language="javascript"> alert("You Are Not ADMIN"); window.location.href=("/list");</script>');}
  });

  app.post('/insert_notify', function(request, response){

    client.query('INSERT INTO board (title, name, content) values (?,?,?)', [
      request.body.title, request.body.name, request.body.content], function(){
          response.redirect('/list');
      });
  });

  app.get('/list_user', function(request, response){
    var cookie = request.cookies.user;
    var admin = request.cookies.admin;
    if(cookie||admin){
    fs.readFile('list_user.html', 'utf8', function(error,data){
      client.query('SELECT * FROM board_user', function(error, results){
        response.send(ejs.render(data, {
          data:results
        }));
      });
    });
  } else {
    response.redirect('/');
  }
  });

  app.get('/list_user/:title', function(request, response){
    var cookie = request.cookies.user;
    var admin = request.cookies.admin;
    if(cookie||admin){
    fs.readFile('read_user.html', 'utf8', function(error, data){
      client.query('SELECT * FROM board_user WHERE title=?', [request.params.title], function(err, results){
        response.send(ejs.render(data, {
          data:results[0]
        }));
      });

      client.query('UPDATE board_user SET hit = hit + 1 WHERE title = ?', [request.params.title], function(){});
    });
  } else{
    response.redirect('/');
  }
  });

  app.get('/insert_user', function(request, response){
    var cookie = request.cookies.user;
    var admin = request.cookies.admin;
    if(cookie||admin){
    fs.readFile('insert_user.html', 'utf8', function(error, data){
      response.send(data);
    });
  } else {
    response.redirect('/');
  }
  });

  app.post('/insert_user', function(request, response){

    client.query('INSERT INTO board_user (title, name, content) values (?,?,?)', [
      request.body.title, request.body.name, request.body.content], function(){
          response.redirect('/list_user');
      });
  });

  app.get('/edit/:title', function(request, response){
    var user = request.cookies.admin;
    if(user=='huny3410@naver.com'){
      fs.readFile('read_modify.html', 'utf8', function(error, data){
        client.query('SELECT * FROM board WHERE title=?', [request.params.title], function(error, results){
          response.send(ejs.render(data, {
            data:results[0]
          }));
        });
      });

  } else { response.write('<script language="javascript"> alert("You Are Not ADMIN"); window.location.href=("/list");</script>');}
  });



  app.post('/edit/:title', function(request, response){
    client.query('UPDATE board SET title=?, content=? WHERE title=?', [request.body.title, request.body.content, request.params.title], function(){
      response.redirect('/list');
    });
  });


  app.get('/edit_user/:title', function(request, response){
    var cookie = request.cookies.user;
    var admin = request.cookies.admin;
    if(cookie||admin){
    fs.readFile('read_user_modify.html', 'utf8', function(error, data){
      client.query('SELECT * FROM board_user WHERE title=?', [request.params.title], function(error, results){
        response.send(ejs.render(data, {
          data:results[0]
        }));
      });
    })
} else {
  response.redirect('/');
}
  });

  app.post('/edit_user/:title', function(request, response){
    client.query('UPDATE board_user SET title=?, content=? WHERE title=?', [request.body.title, request.body.content, request.params.title], function(){
      response.redirect('/list_user');
    });
  });

app.get('/delete/:title', function(request, response){
  var user = request.cookies.admin;
  if(user=='huny3410@naver.com'){
    client.query('DELETE FROM board WHERE title=?', [request.params.title], function(){
      response.redirect('/list');
    })}
   else { response.write('<script language="javascript"> alert("You Are Not ADMIN"); window.location.href=("/list"); </script>')};
});

app.get('/delete_user/:title', function(request, response){
  var cookie = request.cookies.user;
  var admin = request.cookies.admin;
  if(cookie||admin){
  client.query('DELETE FROM board_user WHERE title=?', [request.params.title], function(){
    response.redirect('/list_user');
  });
} else{
  response.redirect('/');
}
});

app.get('/logout', function(request, response){
  response.clearCookie('user');
  response.clearCookie('admin');
  response.redirect('/');
});

app.listen(8080, function(){
  console.log('Server running at localhost:8080');
});
