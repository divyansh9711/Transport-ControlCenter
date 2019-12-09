var express              =require("express");
var mongoose             =require("mongoose");
var User                 =require("./models/user");
var engine              =require("ejs-mate");
var passport             =require("passport");
var ejs                  =require('ejs');
var bodyparser           =require("body-parser");
var LocalStrategy        =require("passport-local");
var fetch=require("node-fetch");


var request = require('request');

const busDetails = (weekday)=>{
	var payload = {
		"endLocation": "",
		"startLocation": "",
		"timing": {
		  "weekDay": "" + weekday.toString(),
		  "startDate": "2019",
		  "startTime": "153100"
		},
		"limit": 12,
		"sortOrder": false,
		"start": 0
	};
	var options = {
		uri: 'http://intermediasutra-env.w84r34bwj9.ap-south-1.elasticbeanstalk.com/webapi/vehicle/getVehicle',
		method: 'POST',
		json: payload
	};
	return options; 
}


var passportLocalMongoose=require("passport-local-mongoose");
mongoose.connect("mongodb://localhost/bus_demo_app");

var port = process.env.PORT || 8000;
var app=express();
console.log(__dirname);
app.use(express.static(__dirname + "/images"));
app.use(express.static(__dirname + "/css"));
app.use(express.static(__dirname + "/vendor"));
app.use(express.static(__dirname + "/fonts"));
app.use(express.json());
app.use(require("express-session")({
	secret:"whats up",
		resave:false,
		saveUninitialized:false
	}));
	app.use(passport.initialize());
app.use(passport.session());
app.use(bodyparser.urlencoded({extended:true}));
app.set('view engine','ejs');
app.engine('ejs',engine);
app.set('views', __dirname + '/views');
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
app.use(function(req,res,next){
	res.locals.currentUser=req.user;
	next();
});
//Auth Routes

app.get("/",function(req,res){ 
	res.render("home");
});

app.get("/login",function(req,res){//render login form
    res.render("index");
});

app.get("/register",function(req,res){//show signUp page 
		res.render("register");
	});
	app.post("/register",function(req,res){//handling user sign up 
		User.register(new User({username:req.body.username}),req.body.password,function(err,user){
			if(err)
			res.render("register");
			else
			{
			passport.authenticate("local")(req,res,function(){
				res.redirect("/profile");})
			}
			
		})
	});

app.get("/profile/:id",isLoggedIn, function(req,res){
	//
	//res = busDetails;
	var option_1 =  busDetails(1);
	var bid=req.params.id;
	 request(option_1, function (error, response, body_1) {
		var bus_detail = [];
		var count = 0;
		var current_bus_detail = {};
		if (!error && response.statusCode == 200) {
			body_1.vehicleList.forEach(element => {
					bus_detail.push(element);
					count++;
					if(element.uId === req.params.id){
						current_bus_detail = element;
					}

			});
			console.log(current_bus_detail);
			//res.render("bus_detail",{bid:bid,bus_details:bus_detail,bus_count:count,current_bus_details:current_bus_detail});
			res.render("test",{busid:bid});		
		}
	});

	const alert = (id)=>{
		var pay = {
			"vehicleId": id,
			"alertStatus": "1"
		};
		var options = {
			uri: 'http://intermediasutra-env.w84r34bwj9.ap-south-1.elasticbeanstalk.com/webapi/liveStatus/setAlert',
			method: 'POST',
			json: pay
		};
		return options;}

	app.get("/profile/:id/escalate",isLoggedIn, function(req,res){
		var option_1 =  alert(req.params.id);
		var bid=req.params.id;
			 request(option_1, function (error, response, body_1) {
				 console.log(response);
				 //TODO reload the page
			 });
			res.redirect("/profile");
		});
	});

	app.get("/profile/:id/resolve",isLoggedIn, function(req,res){
		var option_1 =  resolve(req.params.id);
		var bid=req.params.id;
			 request(option_1, function (error, response, body_1) {
				 console.log(response);
				 //TODO reload the page
			 });
			res.redirect("/profile");
		});
		const resolve = (id)=>{
			var pay = {
				"vehicleId": id
			};
			var options = {
				uri: 'http://intermediasutra-env.w84r34bwj9.ap-south-1.elasticbeanstalk.com/webapi/liveStatus/resolve',
				method: 'POST',
				json: pay
			};
			return options;}
	//res.render("bus_detail");


	app.get("/profile",isLoggedIn,function(req,res){
				var option_1 = busDetails(1);
  
			request(option_1, function (error, response, body_1) {
				console.log(response);
			   var bus_detail = [];
			   var count = 0;
			   if (!error && response.statusCode == 200) {
				   body_1.vehicleList.forEach(element => {
						   bus_detail.push(element);
						   count++;
					   
				   });
				   res.render("profile",{bus_details:bus_detail,bus_count:count});
					   
			   }
		   });
	 }
);



app.get("/profile/:id/edit",function(req,res){
	var option_1 =  busDetails(1);
	var bid=req.params.id;
	 request(option_1, function (error, response, body_1) {
		var bus_detail = [];
		var count = 0;
		var current_bus_detail = {};
		if (!error && response.statusCode == 200) {
			body_1.vehicleList.forEach(element => {
					bus_detail.push(element);
					count++;
					if(element.uId === req.params.id){
						current_bus_detail = element;
					}
				
			});
			console.log(current_bus_detail);
						
			res.render("edit",{bid:bid,bus_details:bus_detail,bus_count:count,current_bus_details:current_bus_detail});
					
		}
	});
});

app.put("/profile/:id",function(req,res){//update route
	//var option_1 =  busDetails(1);
	var routeInfo=req.body.routeInfo;
	var startTime=req.body.startTime;
	var driverName=req.body.driverName;
	var mobileNum=req.body.mobileNum;
	var fare=req.body.fare;
	//var updateData={routeInfo:routeInfo,startTime:startTime,driverName:driverName,mobileNum:mobileNum,fare:fare};
// 	request(updateData,function(err,driverUpdate){//edit route
// //function given by mongoose
// 	if(err)
// 		console.log(err);
// 	else
// 		res.redirect("/profile/"+req.params.id);
// });
request.post('http://intermediasutra-env.w84r34bwj9.ap-south-1.elasticbeanstalk.com/webapi/vehicle/getVehicle',
'UPDATE tutorials_tbl SET tutorial_title="Learning JAVA" WHERE tutorial_id=3', (error, res, body) => {
	if (error) {
	  console.error(error)
	}
	else
	res.redirect("/profile/"+req.params.id);
  })
});

app.post("/login",passport.authenticate("local",{
			successRedirect:"/profile",
			failureRedirect:"/login"
}),);


app.get("/logout",function(req,res){
		req.logout();
		res.redirect("/login");
});


function isLoggedin(req,res,next){
	if(req.isAuthenticated()){
		return true;
	}
	return false;
}

function isLoggedIn(req,res,next){
		if(req.isAuthenticated()){
			return next();
		}
	res.redirect("/login");	
}

app.listen(8000,function(){
		console.log("server is running");
});
var fs = require('fs');

var socketServer = require('http').createServer(app);
var io = require('socket.io')(socketServer);



/* Listen for socket connection on port 3002 */
socketServer.listen(3002, function(){
console.log('Socket server listening on : 3002');
});

/* This event will emit when client connects to the socket server */


var http = require('http');

var s;
io.on('connection', function(socket){
	console.log('Sending Data');
	s = socket;
});
app.post("/emergency",(req,res)=>{
	s.emit("x",req.body);
	res.send("emergency acknowledged")
});






app.get('/video/:id', function(req, res) {
	callVideo(req,res);
});
var range;
var videoName = ""
var hasVideo = false;
app.post("/startVideo",(req,res)=>{
	  hasVideo = true;
		videoName = req.body.videoName;
		s.emit("y",req.body);
		res.send("Recieved");
});

 callVideo = function(req,res){
	
	try{
		if(hasVideo && videoName.includes(req.params.id)){
			var path = 'W:/'+videoName
			var stat = fs.statSync(path)
			var fileSize = stat.size
			range = req.headers.range
			if (range) {
	  			var parts = range.replace(/bytes=/, "").split("-")
	  			var start = parseInt(parts[0], 10)
	  			var end = parts[1]
				? parseInt(parts[1], 10)
				: fileSize-1
	  			var chunksize = (end-start)+1
	  			var file = fs.createReadStream(path, {start, end})
	  			var head = {
				'Content-Range': `bytes ${start}-${end}/${fileSize}`,
				'Accept-Ranges': 'bytes',
				'Content-Length': chunksize,
				'Content-Type': 'video/mp4',
	  		}
	  	res.writeHead(206, head);
	  	file.pipe(res);
		} else {
	  		var head = {
			'Content-Length': fileSize,
			'Content-Type': 'video/mp4',
	  	}
	  	res.writeHead(200, head)
	  	fs.createReadStream(path).pipe(res)
		}}else{setTimeout(function(){callVideo(req,res)},5000);}
	}catch(e){
		setTimeout(function(){callVideo(req,res)},5000);
	}
 }

