var express = require('express');
var Sequelize = require('sequelize');
var expressHandlebars = require('express-handlebars');
var bodyParser = require('body-parser');
var PORT = process.env.NODE_ENV || 3000;
var bcrypt = require('bcryptjs');
var session = require('express-session');
//requiring passport last
var passport = require('passport');
var passportLocal = require('passport-local');


var app = express();

//middleware init
app.use(passport.initialize());
app.use(passport.session());

app.engine('handlebars',expressHandlebars({
  defaultLayout :'main'
}));

app.set('view engine','handlebars');

var connection = new Sequelize ('RBC_authentication_db','root');

app.use(bodyParser.urlencoded({
  extended :false
}));

app.use(session({
  secret: 'quackbird noodletown',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: true }
}));

//passport use methed as callback when being authenticated
passport.use(new passportLocal.Strategy(function(username, usertype, password, done) {
    //check password in db
    Users.findOne({
        where: {
            username: username,
            userType: userType
        }
    }).then(function(user) {
        //check password against hash
        if(user){
            bcrypt.compare(password, user.dataValues.password, function(err, user) {
                if (user) {
                  //if password is correct authenticate the user with cookie
                  done(null, { id: username, username: username });
                } else{
                  done(null, null);
                }
            });
        } else {
            done(null, null);
        }
    });

}));

//change the object used to authenticate to a smaller token, and protects the server from attacks
passport.serializeUser(function(user, done) {
    done(null, user.id);
});
passport.deserializeUser(function(id, done) {
    done(null, { id: id, name: id });
});

var Users = connection.define ('user',{
  username : {
    type : Sequelize.STRING,
    unique : true,
    allowNull: false,
    updatedAt: 'last_update',
    createdAt: 'date_of_creation'
  },
  usertype: {
    type: Sequelize.STRING,
    unique : true,
    allowNull: false
  },
  password: {
    type:Sequelize.STRING,
    unique:false,
    allowNull:false,
   }}, {
    hooks: {
      beforeCreate : function(input){
        input.password = bcrypt.hashSync(input.password,10);
      }
    }
});

var Students = connection.define ('user',{
  student_name : {
    type : Sequelize.STRING,
    unique : true,
    allowNull: false,
  }
});

//test data
Students.bulkCreate([
  { student_name: 'Dan'},
  { student_name: 'Jeremy'},
  { student_name: 'Daryll'}
]);

app.get('/',function(req,res){
  res.render('login',{msg:req.query.msg});
});

app.post('/save',function(req,res){
  Users.create(req.body).then(function(results){
    res.redirect('/?msg=Account Created');
  }).catch(function(err){
    res.redirect('/?msg='+ err.errors[0].message);
  });
});

//check login with db
app.post('/check', passport.authenticate('local', {
    successRedirect: '/events',
    failureRedirect: '/?msg=Login Credentials do not work'
}));

app.get('/events', function(req,res){
  Students.findAll({}).then(function(results){
    res.render('students',{results});
  });
});

app.get('/home', function(req, res){
  res.send("You're on a secure page!!");
});

connection.sync({ force: true }).then(function(){
  app.listen(PORT,function(){
    console.log("Application is listening on PORT %s",PORT);
  });
});
