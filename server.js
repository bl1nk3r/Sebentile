var http  = require ('http') 											
   ,fs    = require ('fs')   											
   ,path  = require ('path') 												
   ,cache = {};	
 
var express = require('express') 											
   ,session = require('express-session')	 								
   ,cookieParser = require('cookie-parser')									
   ,bodyParser = require('body-parser')  									
   ,favicon = require('serve-favicon')										
   ,sendgrid = require('sendgrid')('bl1nk3r', 'SendGrid-api')	 		    
   ,mandrill = require('node-mandrill')('Mandrill-api')
   ,ejs      = require('ejs')
   ,flash    = require('connect-flash');

var mongojs = require("mongojs") 
    ,host = "127.0.0.1"	
    ,port = "27017"				
    ,db = mongojs("sebentiledb", ["Objectives","Division","Transaction","Document","Employees", "Scorecard", "structure", "perspective"]);

var boolStruct = require('./routes/boolstruct');


var bsc = express()
   .use(express.static(__dirname + '/public'))
   .set('views', __dirname + '/public/views')
   .set('view engine', 'ejs')
 
   .use(bodyParser.urlencoded({ extended: false}))
   .use(bodyParser.json())
   .use(bodyParser.text())
   .use(bodyParser.raw())
   .use(cookieParser())

   .use(session({
       secret: 'secret',
       maxAge: new Date(Date.now() + 3600000),
   }))

	.get('/login', function (req, res){
   		var msg = {error: 'none'};

   		if (req.session.loggdUser) {
   			res.render('main');
   		} else {
   			res.render('login', msg);
   		}
	})

    .get('/', function (req, res){
    	if (!req.session.loggdUser) {
   			res.redirect('/login');
   		} else {
   			res.render('main');
   		}
	})

    .post('/login', function (req, res){
   		var user = {
   			userName: req.body.username,
   			password: req.body.password,
   		};
  
   		if (req.body.username == '' || req.body.password == '') {
   			res.render('login', {error: 'Please fill in all fields'});
   		} else {
	   		var formRoles = [];
	   		var currRoles = [];

	   		db.Employees.findOne(user, function (err, data) {
	   			if (data) {
					if (req.body.empRole == 'on') {
						formRoles.push('employee');
					}
					if (req.body.supervisorRole == 'on') {
						formRoles.push('supervisor');
					}
					if (req.body.HRRole == 'on') {
						formRoles.push('HR');
					}
					if (req.body.adminRole == 'on') {
						formRoles.push('admin');
					}

					if (formRoles.length == 0) {
						res.render('login', {error: 'Choose atleast one role!'});
					} else if ((formRoles.indexOf('employee') !== -1) && (data.roles.indexOf('employee') == -1)) {
	   					res.render('login', {error: 'You do not have access to emp role'});
	   				} else if ((formRoles.indexOf('supervisor')  !== -1) && (data.roles.indexOf('supervisor') == -1)) {
	   					res.render('login', {error: 'You do not have access to sup role'});
	   				} else	if ((formRoles.indexOf('HR')  !== -1) && (data.roles.indexOf('HR') == -1)) {
	   					res.render('login', {error: 'You do not have access to HR role'});
	   				} else	if ((formRoles.indexOf('admin')  !== -1) && (data.roles.indexOf('admin') == -1)) {
	   					res.render('login', {error: 'You do not have access to admin role'});
	   				} else {
	   					// create an array of roles that the user has choosen
	   					if ((formRoles.indexOf('employee') !== -1) && (data.roles.indexOf('employee') !== -1)) {
							currRoles.push('employee');
		   				}
		   				if ((formRoles.indexOf('supervisor') !== -1) && (data.roles.indexOf('supervisor') !== -1)) {
		   					currRoles.push('supervisor');
		   				}
		   				if ((formRoles.indexOf('HR') !== -1) && (data.roles.indexOf('HR') !== -1)) {
		   					currRoles.push('HR');
		   				}
		   				if ((formRoles.indexOf('admin') !== -1) && (data.roles.indexOf('admin') !== -1)) {
		   					currRoles.push('admin');
		   				}
		   				
	   					req.session.loggdUser = {userName:data.userName,empName:data.empName,PFNum:data.PFNum,dbRoles:data.roles, currentRoles:currRoles};
		   				res.redirect('/');
	   				}
	   			} else {
	   				var msg = {error: 'Incorrect credentials, login again'};
	   				res.render('login', msg);
	   			}
	   			for (var i = 0; i< currRoles.length; i++) {
	   				console.log(currRoles[i]);
	   			}
   			})
		}
	})
  
	.get('*', function(req, res) {
   		if (!req.session.loggdUser) {
   			res.redirect('/login');
   		} else {
   			res.redirect('/');
   		}
    })

	.post('/logout', function (req, res) {
		req.session.destroy();
		res.redirect('/login');
	})


    // Brian
    .post("/getAllObjectives", function (req, res) {
		db.Objectives.find({status: "unactioned"}, function (err, docs) {
			if (err) {
				console.log("There is an error");
			} else { 
				res.json(docs);
			}	
		});
	})
	
    // Brian
    .post("/getAllUnactionedObjectives", function (req, res) {
		db.Objectives.find({status: "unactioned"}, function (err, docs) {
			if (err) {
				console.log("There is an error");
			} else { 
				res.json(docs);
			}	
		});
	})

    // Brian
	.post("/getAllUnapprovedObjectives", function (req, res) {
		db.Objectives.find({status: "rejected"}, function (err, docs) {
			if (err) {
				console.log("There is an error");
			} else { 
				res.json(docs);
			}	
		});
	})

	// Brian
	.post("/getEditObjective", function (req, res) {
		var id = req.body.id;
		db.Objectives.findOne({_id: mongojs.ObjectId(id)}, function (err, doc) {
			if (err) {
				console.log("There is an error");
			} else { 
				res.json(doc);
			}	
		});
	})

	// Brian
	.post("/removeRejectedObj", function (req, res) {
		var id = req.body.id;
		db.Objectives.remove({_id:mongojs.ObjectId(id)}, function (err, doc) {
			if (err) {
				console.log("There is an error");
			} else { 
				res.send('Done');
			}	
		});
	})

	// Brian
	.post("/editObjective", function (req, res) {
		var obj = req.body;
		obj['status'] = 'unactioned';
		obj['_id'] = mongojs.ObjectId(obj._id);
		db.Objectives.save(obj, function (err, doc) {
			if (err) {
				console.log("There is an error");
			} else { 
				res.json(doc);
			}	
		});
	})

	// Brian
	.post("/getAllApprovedObjectives", function ( req, res) {
		db.Objectives.find({status: "approved"}, function (err, docs) {
			if (err) {
				console.log("There is an error");
			} else { 
				res.json(docs);
			}	
		});
	})

	// Brian
	.post("/getPendingObjectives", function ( req, res) {
		db.Objectives.find({status: "sent_for_approval"}, function (err, docs) {
			if (err) {
				console.log("There is an error");
			} else { 
				res.json(docs);
			}	
		});
	})

	// Brian
	.post("/getApprovedObjectives", function ( req, res) {
		db.Objectives.find({status: "approved"}, function (err, docs) {
			if (err) {
				console.log("There is an error");
			} else { 
				res.json(docs);
			}
		});
	})
	
	//get all KPAs by Mlandvo
	.post("/getKPAs", function (req, res) {
   		console.log("Retrieving all aproved KPAs");
		db.Objectives.find({status: "approved"}, function (err, data) {
			if (err || !data) {
				console.log("No Approved KPA's found");
			} else { 
				res.send(data);
			
			}
		});
	})

	//by Mlandvo
    .post("/getEvalKPAs", function ( req, res) {
	   		console.log("getting evaluated KPAs");
			db.Objectives.find({status: "evaluatedByEmp"}, function ( err, data) {
				if ( err || !data) {
					console.log("There is an error getting KPAs");
					res.send("No Evaluated KPAs found");
				} else { 
					res.send(data);
				}	
			});
	})

	// by Mlandvo
	.put('/completeSelfEval/', function (req, res) {
		var kpa = req.body;
		var id = String(kpa.id);
        var rating = Number(kpa.rating);
		console.log(req.body);
		db.Objectives.findAndModify({query:{_id: mongojs.ObjectId(id)},
			update: {$set: {status:kpa.status, empComment:kpa.empComment, rating:rating, weightedRating:kpa.weightedRating, score:kpa.score}},
			new: true}, function (err, data) {
				res.send("Evaluationn completed for current KPA");
			});
		
	})

	//By Mlandvo
	.post('/file-upload/', function (req, res, next) {
    	console.log(req.body);
    	console.log("server uploading");
    	//console.log(req.file);
		var filename    = req.files.file.name;
        var tmpFilepath="./upload/"+ guid();
        fs.rename(req.files.file.path,tmpFilepath);
        fs.createReadStream(tmpFilepath)
          .on('end', function() {
         console.log("file Saved");
      	})
          .on('error', function() {
           console.log("error encountered");
           // res.send('ERR');
          })
          // and pipe it to gfs
          .pipe(writestream);
            writestream.on('close', function (file) {
            fs.unlink(tmpFilepath);

        });
	})

	.post("/getUnapprovedObjectives", function ( req, res) {
			db.Objectives.find({status: "approved"}, function (err, docs) {
				if (err) {
					console.log("There is an error");
				} else { 
					res.json(docs);
				}
			});
	})

   .post("/showAllDivisions", function (req, res) {
		db.Division.find(function (err, doc){
			if ( err || !doc) {
                res.send("No divisions found");
            } else {
                res.json(doc);
            }
		});
	})

	.post("/getSecEmployees", function (req, res) {
		var div = req.body.divName;
		db.Division.find({DivName: div},function (err, doc){
			if ( err || !doc) {
                res.send("No Employees found");
            } else {
                res.send(doc);
            }
		});
	})

	.post("/getLoggedInEmp", function (req, res) {
		res.send(req.session.loggdUser);
	})

	.post("/getEmpObjectives", function (req, res) {
		var pfnum = Number(req.body.pfno);
		console.log(pfnum);
		db.Objectives.find({PFNum: pfnum},function (err, doc){
			if ( err || !doc) {
                res.send("No objectives found");
            } else {
                res.send(doc);
            }
		});
	})

    .post("/financePerspectiveController", function (req, res) {
		
		db.Objectives.insert(req.body, function (err, doc) {
			//Update existing objectives and assert a 'status' field - set to unapproved
			console.log("USER PF:");
			console.log(req.session.loggdUser.PFNum);
			db.Objectives.update({description: req.body.description}, {$set : {status: "unapproved", perspective: "finance", PFNum: req.session.loggdUser.PFNum}}, {multi: false}, 
				function (err, doc) {
					res.json(doc);
					//console.log(doc);
			});
		})
	})

	// create finance objective : by Brian
    .post("/createEmpObjective", function (req, res) {
		
		var finObjective = req.body;
		var matrixType = req.body.metrixType;

		finObjective['owner'] = req.session.loggdUser.PFNum;
		finObjective['pespective'] = 'finance';
		finObjective['status'] = 'unactioned';
		finObjective['empComment'] = '';
		finObjective['supComment'] = '';
		finObjective['rating'] = '';
		finObjective['score'] = '';
		finObjective['creationDate'] = Date();

		if (matrixType == "time") {
			finObjective['metricOneDef'] = {value:1,from:finObjective.metricOneFrom,To:finObjective.metricOneTo};
			finObjective['metricTwoDef'] = {value:2,from:finObjective.metricTwoFrom,To:finObjective.metricTwoTo};
			finObjective['metricThreeDef'] = {value:3,from:finObjective.metricThreeFrom,To:finObjective.metricThreeTo};
			finObjective['metricFourDef'] = {value:4,from:finObjective.metricFourFrom,To:finObjective.metricFourTo};
			finObjective['metricFiveDef'] = {value:5,from:finObjective.metricFiveFrom,To:finObjective.metricFiveTo};

			delete finObjective.metricOneFrom;
			delete finObjective.metricOneTo;
			delete finObjective.metricTwoFrom;
			delete finObjective.metricTwoTo;
			delete finObjective.metricThreeFrom;
			delete finObjective.metricThreeTo;
			delete finObjective.metricFourFrom;
			delete finObjective.metricFourTo;
			delete finObjective.metricFiveFrom;
			delete finObjective.metricFiveTo;

		} else {
			finObjective['metricOneDef'] = {label:finObjective.metricOneDef, value:1};
			finObjective['metricTwoDef'] = {label:finObjective.metricTwoDef, value:2};
			finObjective['metricThreeDef'] = {label:finObjective.metricThreeDef, value:3};
			finObjective['metricFourDef'] = {label:finObjective.metricFourDef, value:4};
			finObjective['metricFiveDef'] = {label:finObjective.metricFiveDef, value:5};
		}

		db.Objectives.insert(finObjective, function (err, doc) {
			res.json(doc);
		})
	})

	// submit objectives : Brian
	.post("/submitEmpObjectives", function (req, res) {
		var objectives = req.body;
		var length = objectives.length;
		var objId = '';

		// loop through objectives from controller and change their status to sent for approval
		for (var i = 0; i<length; i++) {
			objId = objectives[i]._id;

			db.Objectives.update({ _id: mongojs.ObjectId(objId)}, {$set : {status: "sent_for_approval"}}, {multi: false}, function (err, doc) {		
				if (err) {																															
					res.json(err);																												
				}
			});
		};

		res.json("Objectives Sent");

		mandrill('/messages/send', {
			message: {
			to: [{email: 'jay.rego.14@gmail.com', name: 'Mamba'}],
			from_email: 'objectives@bscims.sec',
			subject: "You have objectives!",
			text: "An employee has sent you objectives for review... View : 127.0.0.1:3002/login.html"
			}
		}, function (error, response) {
			if (error) {
				console.log(JSON.stringify(error));
			}
			else {
				console.log(response);
			}
		});
	})

	.delete("/financePerspectiveController/:id", function (req, res) {
		var id = req.params.id;
		console.log(id);
		db.Objectives.remove({_id: mongojs.ObjectID(id)}, function (err, doc) {
			res.json(doc);
		});
	})

/*****************************************************************************************************************************************
**********************************SERVER OPERATIONS FOR CUSTOMER PERSPECTIVE OBJECTIVES***************************************************
******************************************************************************************************************************************/
	.get("/customerPerspective", function (req, res) {
		db.Objectives.find(function(err, docs) {
			res.json(docs);
		});
	})

	.post("/customerPerspectiveController", function (req, res) {
		var svc = req.body;
		//res.send("Success");
		db.Objectives.insert(req.body, function (err, doc) {
			//res.json(doc);
			db.Objectives.update({description: req.body.description}, {$set : {status: "unapproved", perspective: "customer", PFNum: req.session.loggdUser.PFNum}}, {multi: false}, 
				function (err, doc) {
				res.json(doc);
				//console.log(doc);
			});
		});
	})

	.delete("/customerPerspectiveController/:id", function (req, res) {
		var id = req.params.id;
		console.log(id);
		db.Objectives.remove({_id: mongojs.ObjectID(id)}, function (err, doc) {
			res.json(doc);
		});
	})

/*****************************************************************************************************************************************
***************************SERVER OPERATIONS FOR INTERNAL PERSPECTIVE OBJECTIVES**********************************************************
**************************************************************************/
	.get("/internalPerspective", function (req, res) {
		db.Objectives.find(function (err, docs) {
			res.json(docs);
		});
	})

	.post("/internalPerspectiveController", function (req, res) {
		var svc = req.body;
		//res.send("Success");
		db.Objectives.insert(req.body, function (err, doc) {
			//res.json(doc);
			db.Objectives.update({description: req.body.description}, {$set : {status: "unapproved", perspective: "internal", PFNum: req.session.loggdUser.PFNum}}, {multi: false}, 
				function (err, doc) {
				res.json(doc);
				//console.log(doc);
			});
		});
	})

	.delete("/internalPerspectiveController/:id", function (req, res) {
		var id = req.params.id;
		console.log(id);
		db.Objectives.remove({_id: mongojs.ObjectID(id)}, function (err, doc) {
			res.json(doc);
		});
	})

/******************************************************************************************************************************************
*********************************SERVER OPERATIONS FOR LEARN & GROWTH PERSPECTIVE OBJECTIVES***********************************************
*******************************************************************************************************************************************/
	.get("/learnPerspective", function (req, res) {
		db.Objectives.find(function (err, docs) {
			res.json(docs);
		});
	})

	.post("/learnPerspectiveController", function (req, res) {
		var svc = req.body;
		//res.send("Success");
		db.Objectives.insert(req.body, function (err, doc) {
			//res.json(doc);
			db.Objectives.update({description: req.body.description}, {$set : {status: "unapproved", perspective: "learn", PFNum: req.session.loggdUser.PFNum}}, {multi: false}, 
				function (err, doc) {
				res.json(doc);
				//console.log(doc);
			});
		});
	})

	.delete("/learnPerspectiveController/:id", function (req, res) {
		var id = req.params.id;
		console.log(id);
		db.Objectives.remove({_id: mongojs.ObjectID(id)}, function (err, doc) {
			res.json(doc);
		});
	})

/******************************************************************************************************************************************
***********************************SUBMIT OBJECTIVE OPERATION (CHANGES STATUS OF OBJECTIVE)************************************************
******************************************************************************************************************************************/

	.post("/objectivesSubmitted_status_changed/:id", function (req, res) {
		var ID = req.params.id;
		console.log(ID);
		
		//Updating status of sent objectives to distinguish them from unsent in order for Supervisor to have access to them
		db.Objectives.update({ _id: mongojs.ObjectId(ID)}, {$set : {status: "sent_for_approval"}}, {multi: false}, function (err, doc) {		
			if (err) {																															
				console.log(err);																												
			} 
			else {
				res.json(doc);
				console.log(doc);
			}
		});

		mandrill('/messages/send', {
			message: {
			to: [{email: 'jay.rego.14@gmail.com', name: 'Mamba'}],
			from_email: 'objectives@bscims.sec',
			subject: "You have objectives!",
			text: "An employee has sent you objectives for review... View : 127.0.0.1:3002/login.html"
			}
		}, function (error, response) {
			if (error) {
				console.log(JSON.stringify(error));
			}
			else {
				console.log(response);
			}
		});		
	})
 	//By Mlandvo
 	.post("/deleteKPA/:id", function (req, res) {
		var id = String(req.params.id);
		console.log(id);
		console.log(typeof(id));
		db.Objectives.remove({_id: db.ObjectId(req.params.id)}, function (err, docs) {
			if (err) {
				console.log(err);
				res.json(err);
			}
			else {
				res.json(docs);
				console.log("KPA deleted");
			}
			
		});
	})

	.post('/getKPA/:id', function (req, res) {
        var id = String(req.params.id);
        db.Objectives.findOne({_id: db.ObjectId(req.params.id)}, function (err, data) {
            if (err || !data) {
                res.send("KPA not in database");
            } else {
                res.send(data);
            } 
        });
    })
 
	.post('/getEmpsPendingObjs', function (req, res) {
		db.Employees.find( function (err, cur) {
			if (err) {
				console.log(err.message);
			}
			else {
				res.json(cur);
				//console.log(cur);
			}
		})
	})


/******************************************************************************************************************************************
***********************************SUBMIT OBJECTIVE OPERATION (CHANGES STATUS OF OBJECTIVE)************************************************
******************************************************************************************************************************************/

	.post("/createScoreCardRoute:/:id", function (req, res) {
		var ID = req.params.id;
		//console.log(req.body);
		
		//Updating status of sent objectives to distinguish them from unsent in order for Supervisor to have access to them
		db.Objectives.findOne({ _id: mongojs.ObjectId(ID)}, function (err, doc) {		
			if (err) {																															
				console.log(err);																												
			} 
			else {
				res.json(doc);
				//console.log(doc);
			}
		});

		/*db.Scorecard.insert(req.params.ID, function (err, doc) {
			if (err) {
				console.log(err);
			}
			else {
				res.json(doc);
			}
		});*/
	})

/******************************************************************************************************************************************
***********************************INITIALIZE SCORECARD OPERATION (ON "CLOSE" BUTTON CLICK ************************************************
******************************************************************************************************************************************/

	.post("/initScorecardRoute:/", function (req, res) {
		//var ID = req.params.id;
		//var SC = req.body;
		//console.log(ID);
		var ID =req.body;
		//console.log(ID);
		
		for (var i = 0; i<ID.length; i++){
			db.Objectives.findOne({ _id: mongojs.ObjectId(ID[i]._id)}, function (err, doc) {		
				if (err) {																															
					console.log(err);																												
				} 
				else {
					//res.json(doc);
					console.log(doc);
					db.Scorecard.insert({"Objectives_ID": doc._id, "Createdby:": doc.PFNum, "DateCreated": Date()}, function (err, doc) {
						if (err) {

							console.log(err);
						}
						else {
							//res.json(doc);
							console.log("here:");
							console.log(doc);
						}
					});
				}
			});
		}
	})

/******************************************************************************************************************************************
***********************************APPROVE FINANCE OBJECTIVE OPERATION (CHANGES STATUS OF OBJECTIVE)***************************************
******************************************************************************************************************************************/
	.post('/approveFinanceObjective/:id', function (req, res) {
		var ID = req.params.id
			,persp = req.params.perspective
			,finUpdate = req.body;

		console.log("The expected ID is:")
		console.log(ID);
		db.Objectives.update({_id: mongojs.ObjectId(ID)}, {$set: {status: "approved", description: finUpdate.description, DSO: finUpdate.DSO, 
													metricOneDef: finUpdate.oneDef, metricTwoDef: finUpdate.twoDef, metricThreeDef: finUpdate.threeDef,
													metricFourDef: finUpdate.fourDef, metricFiveDef: finUpdate.fiveUpdate}}, {multi: false}, function (err, doc) {
			if (err) {
				console.log(err);
			}
			else {
				res.json(doc);
				console.log("Approved objectives:")
				console.log(doc);
			}
		})
		
	})

	/*.post('/rejectFinanceObjective/:id', function (req, res) {
		var ID = req.params.id;

		console.log("The expected ID is:")
		console.log(ID);
		db.Objectives.update({_id: mongojs.ObjectId(ID)}, {$set: {status: "unapproved" }}, {multi: false}, function (err, doc) {
			if (err) {
				console.log(err);
			}
			else {
				res.json(doc);
				console.log("Unapproved objectives:")
				console.log(doc);
			}
		})
		
	})*/
/*HR Module Routes*/

.post('/route560d000d14d04f84393069550', function(req, res) {
    query = req.body;

    db.structure.insert(query, function(err, saved) {
        if (err) res.send('Error!');
        else {
            res.send('Success!')
        }
    });

})

 .post('/route55df0ed0b2bc8bc76c51da16', function(req, res) {
    query = req.body;

    db.structure.find(function(err, data) {
        if (err) res.send('Error!');
        else {
            //var boolStruct = require('./routes/boolstruct');
            res.send(data)
        }
    });

})

.post('/route55df11e094e05079749e0a04', function(req, res) {
    query = req.body;

    db.structure.insert(query, function(err, saved) {
        if (err) res.send('Error!');
        else {
            res.send('Success!')
        }
    });

})

.post('/saveNewPerspective', function(req, res) {
    query = req.body;

    db.perspective.insert(query, function(err, saved) {
        if (err) res.send('Error!');
        else {
        	db.perspective.find(function(err1, resp){
        		if (err1) res.send('Error!');
        		res.send(resp);
        	});
            
        }
    });

})

.post('/saveNewEmployee', function(req, res) {
    query = req.body;

    db.Employees.insert(query, function(err, saved) {
        if (err) res.send('Error!');
        else {
        	db.Employees.find(function(err1, resp){
        		if (err1) res.send('Error!');
        		res.send(resp);
        	});
            
        }
    });

})

.post('/getPerspectives', function(req, res) {
    db.perspective.find( function(err, resp) {
        if (err) res.send('Error!');
        else {
            res.send(resp);
        }
    });

})

.post('/getPositions', function(req, res) {
    db.structure.find({"structType":"position"}, function(err, resp) {
        if (err) res.send('Error!');
        else {
            res.send(resp);
        }
    });

})

.post('/getStructure', function(req, res) {
    var myTree = new boolStruct();
    myTree.init();

    setTimeout(function() {
        myTree.render();
        //console.dir(myTree.treeData[0]);
        //console.log(myTree.depth());
        
        
    }, 300);

    setTimeout(function(){
        //console.log(myTree.showStruct());
        res.send(myTree.showStruct());
    },600);

})

.post('/route560d000d14d04f84393069551', function(req, res) {
    query = req.body;

    db.perspective.find(function(err, data) {
        if (err) res.send('Error!');
        else {
            res.send(data)
        }
    });

})

.post('/route560d4856d00d941c304c7254', function(req, res) {
    query = req.body;

    db.structure.find({
        "structType": "position"
    }, function(err, data) {
        if (err) res.send('Error!');
        else {
            res.send(data)
        }
    });

})


//Log on the console the 'init' of the server
console.log("Server initialized on port 3003...");

module.exports = bsc;
