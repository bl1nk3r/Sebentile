var bsc = angular.module('BSCIMS', ['ngRoute']);

	bsc.service('allObjectives', ['$http', function ($http){
		this.getObjectives = function () {
			return $http.post("/getAllObjectives");
		}
	}]) 

	.service('pendingObjectives', ['$http', function ($http) {
 		this.getPending = function() {
 			return $http.post('/getPendingObjectives');
 		}
 	}])

 	.service('approvedObjectives', ['$http', function ($http) {
 		this.getApproved = function() {
 			return $http.post('/getApprovedObjectives');
 		}
 	}])

 	.service('unApprovedObjectives', ['$http', function ($http) {
 		this.getApproved = function() {
 			return $http.post('/getUnapprovedObjectives');
 		}
	}])

	.service('manageEmployeeData', ['$http', '$q', function ($http, $q) {
		this.insertEmp = function(emp) {
			return $http.post('/addEmp', emp);
		}

		this.authenticate = function(loginEmp) {
			return $http.post('empAuthenticate', loginEmp);
		}

		this.getEmps = function() {
			var deferred = $q.defer();
			$http.post('/showAllEmps').success(function (res) {
				deferred.resolve(res);
				console.log(res);
			}).error(function (res) {
				deferred.reject(res);
			});

			return deferred.promise;	
		}

		this.getEmpsWithPending = function() {
			var deferred = $q.defer();
			$http.post('/showEmpsWithPending').success(function (res) {
				deferred.resolve(res);
				console.log(res);
			}).error(function (res) {
				deferred.reject(res);
			});

			return deferred.promise;	
		}

		this.getDivs = function() {
			var deferred = $q.defer();
			$http.post('/showAllDivisions').success(function (res) {
				deferred.resolve(res);

				//console.log(res);
			}).error(function (res) {
				deferred.reject(res);
			});

			return deferred.promise;	
		}

		this.getLoggedInEmp = function () {
		return $http.post('/getLoggedInEmp');

		this.lastLogIn = null;
		}
	}])

	.controller('manageEmployees', ['$q', '$scope', '$rootScope', '$http', 'manageEmployeeData', 
		function ($q, $scope, $rootScope, $http, manageEmployeeData) {

		$scope.loginStatus = true,
		$scope.hasUserInfo = false,
		$scope.loginState = "Not logged in!",
		//Below are the login access roles : Supervisor, Employee and HR officer
		$scope.supervisorRole = false,
		$scope.isSup = false,
		$scope.empRole = false,
		$scope.isEmp = false,
		$scope.HRRole = false,
		$scope.isHR = false,
		$scope.adminRole = false,
		$scope.isAdmin = false,
		$scope.loginError = "Enter Your ID!",
		$scope.hasLoginError = false,
		$scope.empRole.checked = true;

		$scope.logout = function () {
			$http.post('/logout').success(function(resp) {
					
			});
		}

		$scope.getLoggedUser = function () {
			$http.post("/getLoggedInEmp").success(function(resp){
				console.log(resp.PFNum);
				$rootScope.PF = resp.PFNum;
				console.log($rootScope.PF);
				$scope.logdUser = resp;
				$scope.loggedUserName = resp.empName;

				if (resp.currentRoles.indexOf('employee') !== -1){
					$scope.isEmp = true;
				}
				if (resp.currentRoles.indexOf('supervisor') !== -1) {
					$scope.isSup = true;
				}
				if (resp.currentRoles.indexOf('HR') !== -1) {
					$scope.isHR = true;
				}
				if (resp.currentRoles.indexOf('admin') !== -1) {
					$scope.isAdmin = true;
				}

				console.log($scope.isHR);

			}).error(function (resp) {
			});
		}

		$scope.getLoggedUser();

		//validate user access role after capturing from login form and throw appropriate errors
		$scope.validate = function() {

			$scope.loginErrorMsgs = [],
			$scope.userFormRoles = [];

			var userRoleError = "Opt for at least one role!",
				user_Pass_Error = "Incorrect username / password combination!",
				supervisorRoleError = "You currently don't have a supervisor role!",
				HRRoleError = "You seem not to be an HR officer!",

				//retrieve login values from login form
				loginEmp = {empName: $scope.empName, password: $scope.password}; 

				manageEmployeeData.authenticate(loginEmp).success(function (data) {

					$scope.employeeName = data.empName,
					$scope.employeePassword = data.password,
					$scope.employeeRoles  = data.roles,
					$scope.employeePF = data.PFNum;

					if($scope.empName != $scope.employeeName && $scope.password != $scope.employeePassword) {

						$scope.loginErrorMsgs.push(user_Pass_Error),
						$scope.hasLoginError = true;
					}	
					else if (!$scope.supervisorRole && !$scope.employeeRole && !$scope.HRRole) {

						$scope.loginErrorMsgs.push(userRoleError),
						$scope.hasLoginError = true;
					}	
					else if ($scope.supervisorRole && ($scope.employeeRoles.indexOf("supervisor") <= -1)) {

						$scope.loginErrorMsgs.push(supervisorRoleError),
						$scope.hasLoginError = true;
					}
					else if ($scope.HRRole && ($scope.employeeRoles.indexOf("HR") <= -1)) {

						$scope.loginErrorMsgs.push(HRRoleError),
						$scope.hasLoginError = true;
					}
					else {

						$scope.loginState = "Logged In";

						var loggedInEmp = { employeeName: $scope.employeeName, employeePassword: $scope.employeePassword, employeeRoles: $scope.employeeRoles};

						//Store information of currently logged in user in a service
						manageEmployeeData.setCurrentLoggedInEmp (loggedInEmp);

						//initialize current employee with the employee object defined above
						$scope.currentEmp = loggedInEmp;

						//match employee roles from the form with the ones in DB
						if ($scope.supervisorRole && ($scope.employeeRoles.indexOf("supervisor") > -1)) {
							$scope.isSupervisor = true;
						}

						if ($scope.HRRole && ($scope.employeeRoles.indexOf("HR") > -1)) {
							$scope.isHR = true;
						}
						if ($scope.employeeRole && ($scope.employeeRoles.indexOf("employee") > -1)) {
							$scope.isHR = true;
						}
					} //end 'if' of 'else'

				}).error(function (error){}); 
			} //end of validate function

			$scope.addEmp = function(){

			$scope.hasAddEmpError = false;
			$scope.addEmpErrorMsgs = [];
			$scope.empInserted = false;
			$scope.empInsertedMsg = '';

			var passwordMissMatchError = "Passwords do not match"
			    ,empRoleError = "Assign at least one role to the user"
			    ,emptyEmpNameError = "Username cannot be empty"
			    ,emptyPasswordError = "Password cannot be empty"
			    ,emptyPassword2Error = "Password two cannot be empty"
			    ,emptyFirstNameError = "Firstname cannot be empty"
			    ,emptyLastNameError = "Lastname cannot be empty"
			    ,emptyStationError = "Station cannot be empty";

			//check if fields are filled
			if ($scope.employeeName == null){

				$scope.addEmpErrorMsgs.push(emptyEmpNameError);
				$scope.hasAddEmpError = true;
			} 
			else if ($scope.employeePassword == null){

				$scope.addEmpErrorMsgs.push(emptyPasswordError);
				$scope.hasAddEmpError = true;
			} 
			else if ($scope.employeePassword2 == null){

				$scope.addEmpErrorMsgs.push(emptyPassword2Error);
				$scope.hasAddEmpError = true;
			} 
			else if ($scope.firstname == undefined){

				$scope.addEmpErrorMsgs.push(emptyFirstNameError);
				$scope.hasAddEmpError = true;
			} 
			else if ($scope.lastname == undefined){

				$scope.addEmpErrorMsgs.push(emptyLastNameError);
				$scope.hasAddEmpError = true;
			} 
			else if (!$scope.supervisorRole && !$scope.HRRole && !$scope.employeeRole) {

				$scope.addEmpErrorMsgs.push(empRoleError);
				$scope.hasAddEmpError = true;
			}

			//check if entered passwords match
			else if ($scope.employeePassword !== $scope.employeePassword2) {

				$scope.addEmpErrorMsgs.push(passwordMissMatchError);
				$scope.hasAddEmpError = true;
			} 
			else {
				//initial employee roles
				$scope.employee = false;
				$scope.supervisor = false;
				$scope.HR = false;

				//store employee roles selected
				var empRoles = [];

				if ($scope.employeeRole) {
					empRoles.push("employee");
				}
				if ($scope.supervisorRole){
					empRoles.push("supervisor");
				}
				if ($scope.HRRole){
					empRoles.push("HR");
				}

				//create user object from form
				var newEmp = {empName:$scope.empName, password:$scope.password, firstname:$scope.firstname, lastname:$scope.lastname, roles:empRoles};

				manageEmpData.insertEmp(newEmp)
		            .success(function (res) {
		            	$scope.empInsertedMsg = res;
		                $scope.empInserted = true;
		            
		                $scope.clearNewEmp();
		            })
		            .error(function (error) {
		                $scope.addEmpErrorMsgs.push(error);
						$scope.hasAddEmpError = true;
		            });
		    }
		}//add employee function ends

		$scope.showEmployees = function() {
			manageEmployeeData.getEmps()
				.then(function (data) {
					$scope.emps = data;

					console.log(data);
				});
		}

		$scope.clearNewEmp = function() {
			$scope.empName = '',
			$scope.employeePassword = '',
			$scope.employeePassword2 = '',
			$scope.firstname = '',
			$scope.lastname = '',
			$scope.supervisorRole = '',
			$scope.employeeRole = '',
			$scope.HRRole = '';
		}

		$scope.clearLogin = function() {
			$scope.empName = '',
			$scope.password = '',
			$scope.supervisorRole = '',
			$scope.employeeRole = '',
			$scope.HRRole = '';
		}
	}])

    .controller('hrRolesController',['$scope','$http','manageEmployeeData', function($scope, $http, manageEmployeeData){
		$scope.getDivisions = function () {
			manageEmployeeData.getDivs()
				.then (function (data) {

					var arr = data;
					for( var i = 0; i < arr.length; i++){
						$scope.division = data[i];
						$scope.sections = $scope.division.Department[i].Section;
						$scope.departments = $scope.division.Department;
						$scope.employees = $scope.division.Department[i].Section[i].Employee;
					}
				});
		}

		$scope.getDivisions();

		$scope.getSecEmployees = function (section,dept,div) {
			$scope.section = section;
			var deptIndex = null;
			var secIndex = null;
			var div = {divName : div};
			$http.post('/getSecEmployees', div).success(function(resp) {
				var secDiv = resp[0];
				$scope.divDepartments = secDiv.Department;

				for (var i=0; i < $scope.divDepartments.length; i++) {
				  	if ($scope.divDepartments[i].DeptName == dept) {
				  		deptIndex = i;
				  		$scope.depSections = secDiv.Department[deptIndex].Section;

					  	for (var n=0; n < $scope.depSections.length; n++) {
					  		if ($scope.depSections[n].SecName == section) {
					  			var secIndex = n;
					  			$scope.secEmployees = $scope.depSections[secIndex].Employee;
					  		}
				  		}
				  	}
				}

			});
		}

		$scope.getEmpObjectives = function (pfnum, name) {
			$scope.empName = name;
			var emp = {pfno:pfnum};
			console.log(pfnum);
			$http.post('/getEmpObjectives', emp).success(function(resp) {
				console.log(resp);
			});
		}
    }])

	.controller('adminController',['$scope','$http','manageEmployeeData', function($scope, $http, manageEmployeeData){
		
	 }])

	// Brian
   .controller('empRoleController', ['allObjectives','approvedObjectives','unApprovedObjectives','$rootScope','$http','$scope', function (approvedObjectives, unApprovedObjectives, $rootScope, allObjectives, $http, $scope) {
   		$scope.empObjective = {};
   		$scope.gotFinBCW = false;
   		$scope.BCWStat = "Lock";
   		$scope.showBCT = false;
   		$scope.showOtherMatrixTypes = false;
   		$scope.showTimeMatrix = false;
   		$scope.showSubErr = false;
		$scope.showSubMsg = "There are no Approved Objectives to submit for now, Create Objectives or if this problem persists contact your IT Administrator.";
		$scope.approvedKPAs = [];
   		
   		$scope.empObjective.metrixType = '--Select matrix--';
   		$scope.objPerspDropdownMenu = '--Select a Perspective--';
   		$scope.finObjWeightSum = 0;
   		$(".form_datetime").datetimepicker({format: 'yyyy-mm-dd', autoclose:true, todayBtn:true, weekStart: 1, todayHighlight: 1, startView: 2, minView: 2, forceParse: 0});
   		//by Mlandvo
		$scope.tester = "";
		$scope.appFinArr = [];
		$scope.appCustArr = [];
		$scope.appIntArr = [];
		$scope.appLearnArr = [];
		$scope.showSubErr = true;
		$scope.showSubMsg = "There are no Approved Objectives to submit for now, Create Objectives. If this problem persists contact your IT Administrator.";
	   	$scope.unactionedKPAs = [];

		$scope.showSCardErr = false;
		$scope.showSCardMsg = "Your Perfomance contract is not ready yet. There are no Approved Objectives to work on for now ... Please Contact your supervisor or try again later.";

		$scope.showEvalErr = true;
		$scope.showEvalMsg = "There are no Approved Objectives to evaluate for now ... Please try again later.";
		//end
		$scope.approvedKPAs = [];
		$scope.unapprovedKPAs = [];
		$scope.act = 0;
		$scope.finRowSpan = 0;
		$scope.custRowSpan = 0;
		$scope.intRowSpan = 0;
		$scope.learnRowSpan = 0;

   		$scope.captureBrdCatWeighting = function (val) {
   			if ($scope.empObjective.finBrdCatWeighting != null) {
   				$scope.empObjective.finBrdCatWeighting = val;	
   			}
   			
   			$scope.gotFinBCW = !$scope.gotFinBCW;

   			if ($scope.BCWStat == 'Lock') {
   				$scope.BCWStat = "Unlock";
   			} else if ($scope.BCWStat == 'Unlock') {
   				$scope.BCWStat = "Lock";
   			};
   		};

   		$scope.changeShowBCT = function () {
   			$scope.showBCT = !$scope.showBCT;
   		}

   		$scope.changeShowMatrix = function (type) {

   			if (type == "time") {
   				$scope.showOtherMatrixTypes = false;
   				$scope.showTimeMatrix = !$scope.showTimeMatrix;
   			} else if (type == "--Select--") {
   				$scope.showOtherMatrixTypes = false;
   				$scope.showTimeMatrix = false;
   			} else {
   				$scope.showTimeMatrix = false;
   				$scope.showOtherMatrixTypes = !$scope.showOtherMatrixTypes;
   			}
   		}

   		// retrieve approved objectives : Brian
	    $scope.getAprdObjectives = function () {

			$http.post("/getAllApprovedObjectives").success(function (res) {				
				if(res.length > 0){
					for (var i = 0; i<res.length; i++) {
						$scope.approvedKPAs.push(res[i]);
					};
							
				} else if(res.length <= 0){
					$scope.showSubErrAprvd = true;

				}	
			})
			.error(function () {
				console.log('There is an error');
			});	
		}

		$scope.getAprdObjectives();

		$scope.createObjective = function () { 

			// define function variables
			$scope.finObjError = [],
			$scope.createObjectiveErrorMsgs = [],
			$scope.hasCreateObjErrors = false;
			$scope.hasFinKPAError = false;
			$scope.hasFinKPIError = false;

			$scope.clearEmpObjectivesErrors = function () {
				$scope.finObjError = [],
				$scope.createObjectiveErrorMsgs = [],
				$scope.hasCreateObjErrors = false;
				$scope.hasFinKPAError = false;
				$scope.hasFinKPIError = false;
			}

			if (Number($scope.finObjWeightSum) > Number($scope.empObjective.finBrdCatWeighting)) {
				console.log("Detailed weighting now exceeding broad category")
			}

			console.log("Sum weight is : ");
			console.log($scope.finObjWeightSum);
		
			// define create finance objective errors
			var generalErrorMsg = "Please ensure that all fields are filled!"
				objDescriptionError = "The 'Key Performance Area' field is mandatory!",
				objDSOError = "Please define the Key Performance Indicator!",
				poorOptionsSelectError = "Select a minimum metric above!",
				unsatOptionsSelectError = "Select an unsatisfactory metric above!",
				targetOptionsSelectError = "Verfiy the 'Target Met' metric above!",
				exceedOptionsSelectError = "Select an exceed metric above!",
				outstandOptionsSelectError = "Select an outstanding metric above!",
				poorOptionsDefError = "Define the poor metric above!",
				unsatOptionsDefError = "Define the unsatisfactory metric above!",
				targetOptionsDefError = "Define the 'Target Met' metric above!",
				exceedOptionsDefError = "Define the exceed metric above!",
				outstandOptionsDefError = "Define the outstanding metric above!";

			
		    	$http.post("/createEmpObjective", $scope.empObjective).success(function (resp){
		    		var returnEmpObjective = resp;
		    		$scope.empObjective = {};
		    		$scope.finObjWeightSum += Number(returnFinObjective.finDetailedWeighting);
		    		$scope.empObjective.finBrdCatWeighting = returnEmpObjective.finBrdCatWeighting;
		    		$scope.empObjective.metrixType = returnEmpObjective.metrixType;
		    		$('#successObjAlert1').slideDown();
		    	});
		    //}
	    };

	    // close objective creation : Brian
	    $scope.closeObjCreation = function () {
	    	$scope.empObjective = null;
	    	$('#financePerspDiv').hide(500);	
			$('#customerPerspDiv').hide(500);
			$('#internalPerspDiv').hide(500);	
			$('#learnPerspDiv').hide(500);
	    	$scope.objPerspDropdownMenu = '--Select a Perspective--';
	    }

		$scope.renderFinancePerspective = function (response) {
			$scope.financePerspective = response;
		};

		$scope.retrieveEmpObjectives = function() {
			$http.get("/retrieveEmpObjectives")
			.success(function (res, err) {
				if (err) {console.log(err);}
				console.log(res);
			});
		};

		$scope.removeEmpObjective = function (id) {
			$http.delete("/financePerspectiveController" + id)
			.success(function (response) {
				$scope.retrieve();
			});
		};

		//annyang environment (voice command functionality)
		var commands = {
			'create objective' : function() {
				$scope.$apply();
			}
		}

		//Mlandvo
		$scope.retrieveApproved = function () {
			$http.post('/getApprovedObjectives')
			.success(function (res) {
				$scope.scorecardHeight = res.length + 1;
				$scope.allKP = [];
				/*
				$scope.appCustObj = [];
				$scope.appIntObj = [];
				$scope.appLearnObj = [];*/

				if (res.length > 0) {
					for (var i = 0; i<res.length; i++) {
						//if (res[i].perspective == "finance") {
							$scope.allKP.push(res[i]);
							console.log($scope.allKP);
						/*	
						}
						else if (res[i].perspective == "customer") {
							$scope.appCustObj.push(res[i]);
						}
						else if (res[i].perspective == "internal") {
							$scope.appIntObj.push(res[i]);
						}
						else if (res[i].perspective == "learn") {
							$scope.appLearnObj.push(res[i]);
						}*/
					}
				}
				else if (res.length <= 0){
					$scope.showSCardErr = true;
				}

				
			})
			.error(function () {
				console.log('There is an error with compile socrecard! (BUG FOUND)');
			});		
		};	

		$scope.incrementObjRating = function(Obj) {
			var singleObj = $scope.singleObj;
			if (Number(Obj.rating) < 5) {
				Obj.rating +=1;
			} else {
				Obj.rating +=0;
			} 
			singleObj[0] = Obj.rating;
			$scope.selfEvalObjs[Obj._id] = singleObj;
			console.log($scope.selfEvalObjs);
		};
		// decrease objective rating
		$scope.decrementObjRating = function(Obj) {
			var singleObj = $scope.singleObj;
			if (Number(Obj.rating) > 0) {
				Obj.rating -=1;
			} else {
				Obj.rating -=0;
			}
			
			singleObj[0] = Obj.rating;
			$scope.selfEvalObjs[Obj._id] = singleObj;
		};
		//By Mlandvo
		$scope.upload = function (files) {
			console.log("uploading files");
	        if (files && files.length) {
	            for (var i = 0; i < files.length; i++) {
	                var file = files[i];
	                upload({
	                    url: '/uploads/',
	                    fields: {
	                        //'username': $scope.username
	                    },
	                    file: file
	                })
	                .progress(function (evt) {
		                var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
		                $scope.log = 'progress: ' + progressPercentage + '% ' + evt.config.file.name + '\n' + $scope.log;
	                })
	                .success(function (data, status, headers, config) {
		                $timeout(function() {
		                    $scope.log = 'file: ' + config.file.name + ', Response: ' + JSON.stringify(data) + '\n' + $scope.log;
		                });
	               	});
	            }
	        }
	    };
		//By Mlandvo
		$scope.selfEvaluate = function () {
			//console.log($scope.appFinObj.length);
			for (var i = 0; i < $scope.allKP.length; i++) {
				if (Number($scope.allKP[i].rating) == 0) {
					$scope.hasFinSCErrors = true;
					$scope.finSCErrorMsg = "Rate all Finance Objectives";
					return;
				}
			}
			/*
			for (var i = 0; i < $scope.appCustObj.length; i++) {
				if (Number($scope.appCustObj[i].rating) == 0) {
					$scope.hasCustSCErrors = true;
					$scope.custSCErrorMsg = "Rate all Customer Objectives";
					return;
				}
			}
			for (var i = 0; i < $scope.appIntObj.length; i++) {
				if (Number($scope.appIntObj[i].rating) == 0) {
					$scope.hasIntSCErrors = true;
					$scope.intSCErrorMsg = "Rate all Internal Business Objectives";
					return;
				}
			}
			for (var i = 0; i < $scope.appLearnObj.length; i++) {
				if (Number($scope.appLearnObj[i].rating) == 0) {
					$scope.hasLearnSCErrors = true;
					$scope.learnSCErrorMsg = "Rate all Learning & Growth Objectives";
					return;
				}
			}*/
	   	};	
	   	// By Mlandvo
		$scope.getAllKPAs = function() {
			$http.post('/getApprovedObjectives')
			.success(function (res) {
				$scope.allKP = [];
				$scope.allk = false;
				$scope.appFin = true;
				console.log("Ran getAllKPAs finction and got");
				console.log(res.length);
				if(res.length > 0){
					$scope.allk = true;
					res.forEach(function (kpi) {
		          		$scope.allKP.push(kpi);
		      		})
		      		
				}
				else if(res.length <= 0){
					$scope.showEvalErr = false;
					
				}
				console.log($scope.allKP);
			})
		};
		//By Mlandvo 
		$scope.updateKPA = function (Obj) {
			//call function that will get evaluated objectives on scorecard
			var id = Obj._id;
			var empComment = Obj.empComment;
			var perspective = Obj.perspective;
			var rating = Obj.rating;
			var value = Obj.value;
			//var detailedWeig = Obj.finDetailedWeighting || Obj.custDetailedWeighting || Obj.learnDetailedWeighting || Obj.intDetailedWeighting;
			var dweight = 0;
			var weightedRating = 0;
			var score = 0;
			var finScore = 0;
			var custScore = 0;
			var learnScore = 0;
			var intScore = 0;
			var status = Obj.status;
			var updateKPA = {};
			var detailedWeig = 0;
			var rating = value;
			var totalScore = 0;

			if (Obj.finDetailedWeighting >0) {
				detailedWeig = Obj.finDetailedWeighting;
			}
			else if (Obj.custDetailedWeighting>0) {
				detailedWeig = Obj.custDetailedWeighting;
			}
			else if (Obj.learnDetailedWeighting>0) {
				detailedWeig = Obj.learnDetailedWeighting;
			}
			else if (Obj.intDetailedWeighting>0) {
				detailedWeig = Obj.intDetailedWeighting;
			};

			if (rating >= 0) {
				status = "evaluatedByEmp"
				dweight = detailedWeig/100;
				weightedRating =  value * dweight;
				
				if(perspective == "finance"){
					finScore += weightedRating;		
				}
				else if(perspective == "customer"){
					custScore += weightedRating;	
				}
				else if(perspective == "internal"){
					learnScore += weightedRating;	
				}
				else if(perspective == "learn"){
					intScore += weightedRating;	
				};
			};

			if (finScore>=0) {
				updateKPA = {id: id, status: status, empComment : empComment, rating: value, weightedRating: weightedRating, score: finScore };
				if (updateKPA.score == 5) {
					$scope.hasErrors = true;
					$scope.errorMsg = "Attach files for evidence to continue with evaluation";
					return updateKPA;
				};
				$http.put('/completeSelfEval', updateKPA).success(function (resp) {
		            $scope.kpaUpdatedMsg = resp;
		            $scope.kpaUpdated = true;
		            console.log($scope.kpaUpdatedMsg);
		        }).error(function () {
		            console.log("An error occured");
		        });
			}
			else if (custScore>=0) {
				updateKPA = {id: id, status: status, empComment : empComment, rating: value, weightedRating: weightedRating, score: custScore };
				if (updateKPA.score == 5) {
					$scope.hasErrors = true;
					$scope.errorMsg = "Attach files for evidence to continue with evaluation";
					return updateKPA;
				}
				$http.put('/completeSelfEval', updateKPA).success(function (resp) {
		            $scope.kpaUpdatedMsg = resp;
		            $scope.kpaUpdated = true;
		            console.log($scope.kpaUpdatedMsg);
		        }).error(function () {
		            console.log("An error occured");
		        });
			}
			else if (learnScore>=0) {
				updateKPA = {id: id, status: status, empComment : empComment, rating: value, weightedRating: weightedRating, score: learnScore };
				if (updateKPA.score == 5) {
					$scope.hasErrors = true;
					$scope.errorMsg = "Attach files for evidence to continue with evaluation";
					return updateKPA;
				}
				$http.put('/completeSelfEval', updateKPA).success(function (resp) {
		            $scope.kpaUpdatedMsg = resp;
		            $scope.kpaUpdated = true;
		            console.log($scope.kpaUpdatedMsg);
		        }).error(function () {
		            console.log("An error occured");
		        });
			}
			else if (intScore>=0) {
				updateKPA = {id: id, status: status, empComment : empComment, rating: value, weightedRating: weightedRating, score: intScore };
				if (updateKPA.score == 5) {
					$scope.hasErrors = true;
					$scope.errorMsg = "Attach files for evidence to continue with evaluation";
					return updateKPA;
				}
				$http.put('/completeSelfEval', updateKPA).success(function (resp) {
		            $scope.kpaUpdatedMsg = resp;
		            $scope.kpaUpdated = true;
		            console.log($scope.kpaUpdatedMsg);
		        }).error(function () {
		            console.log("An error occured");
		        });
			}
		};	
		//By Mlandvo
		$scope.getEvalKPAs = function () {
				
			console.log("getting evaluated KPAs");
			$http.post('/getEvalKPAs').success(function (data) {
				console.log("got evaluated KPAs");
				//console.log(res);
	  			for (var i = 0; i<data.length; i++) {
	  				$scope.scorecardHeights = data.length + 1;
					if (data[i].perspective == "finance") {
						$scope.appFinArr.push(data[i]);
						$scope.finRowSpan += $scope.appFinArr.length;
					}
					else if (data[i].perspective == "customer") {
						$scope.appCustArr.push(data[i]);
						$scope.custRowSpan += $scope.appCustArr.length;
					}
					else if (data[i].perspective == "internal") {
						$scope.appIntArr.push(data[i]);
						$scope.intRowSpan += $scope.appIntArr.length;
					}
					else if (data[i].perspective == "learn") {
						$scope.appLearnArr.push(data[i]);
						$scope.learnRowSpan += $scope.appLearnArr.length;
					}
				}//end for loop
				console.log("I am the scorecard height variable");
				console.log($scope.scorecardHeights);
				console.log("length");
				console.log($scope.appFinArr.length);
			}).error (function (error) {
				console.log(error);
			})		
		};//end master func

		// retrieve Objectivez : Mlandvo
	    $scope.getObjectivez = function () {
	    	console.log("get objectives called");
	    	
			$http.post("/getAllObjectives").success(function (res) {				
				//$scope.empObjectives = res;
				//console.log(res);
				console.log(res.length);
				if(res.length > 0){
					$scope.showSubErr = false;
					$scope.unactionedKPAs = res;
					console.log($scope.unactionedKPAs);	
					console.log("KPAs in array");
							
				}
				else if(res.length <= 0){
					$scope.showSubErr = true;
					console.log("logging for result less than zero");
					console.log($scope.showSubErr);
				}
				
			})
			.error(function () {
				console.log('There is an error');
			});	
			
		}
		$scope.clearSubmitModal = function () {
			$scope.unactionedKPAs = null;
			$scope.showSubErr = true;
		};
		//$scope.getObjectivez();

		$scope.getKPA = function (Obj) {
			var id = Obj._id;
			console.log(id);
			console.log("get kpa function called + response");
			$http.post("/getKPA/" + id)
				.success(function (res) {
					
				console.log(res);
				$scope.kpaID = res._id;
			});
		};

		//By Mlandvo
		$scope.submitKPAs = function (kpaID) {
			console.log("submit function called");
			//$scope.send = true;
			var toBeSent = [];
			var toBeDeleted = [];
			var id = $scope.kpaID;
			//console.log(Obj);
			//console.log(typeof(id));
			$http.post("/objectivesSubmitted_status_changed/" + id)
					.success(function (res) {
						//$('#successObjSubmit').slideDown();
						console.log(res);
						console.log("KPA uphanded");
						$scope.getObjectivez().$apply();
				})
				.error(function (res) {
					console.log(res);
					});
			};//end of function

		$scope.delKPA = function (kpaID) {
			console.log("Delete kpa function called");
			var id = $scope.kpaID;
			$http.post("/deleteKPA/" + id)
				.success(function (response) {
				console.log(response);
				$scope.getObjectivez().$apply();
			});

		};
		// retrieve getUnactndObjectives : Brian
	    $scope.getUnactndObjectives = function () {
	    	
			$http.post("/getAllObjectives").success(function (res) {	
				console.log(res);			
				if(res.length > 0){
					$scope.showSubErr = false;
					$scope.unactionedKPAs = res;
				} else if(res.length <= 0){
					$scope.showSubErrUactd = true;
				}	
			})
			.error(function () {
				console.log('There is an error');
			});	
		}
		$scope.getUnactndObjectives();

		//console.log("whats wrong");

		//$scope.getUnactndObjectives();	

		// retrieve getUnaprdObjectives : Brian
	    $scope.getUnaprdObjectives = function () {
	    	
			$http.post("/getAllUnapprovedObjectives").success(function (res) {				

				if(res.length > 0){
					for (var i = 0; i<res.length; i++) {
						$scope.unapprovedKPAs.push(res[i]);
					};		
				} else if(res.length <= 0){
					$scope.showSubErrUnAprvd = true;
					console.log("there should be an error");
					console.log($scope.showSubErrUnAprvd);
					$scope.showSubMsg = "There are no unapproved objectives";
				}	
			})
			.error(function () {
				console.log('There is an error');
			});	
		}
		$scope.getUnaprdObjectives();

		// retrieve approved objectives : Brian
	    $scope.getAprdObjectives = function () {

			$http.post("/getAllApprovedObjectives").success(function (res) {				
				if(res.length > 0){
					for (var i = 0; i<res.length; i++) {
						$scope.approvedKPAs.push(res[i]);
					};
							
				} else if(res.length <= 0){
					$scope.showSubErrAprvd = true;

				}	
			})
			.error(function () {
				console.log('There is an error');
			});	
		}

		$scope.getAprdObjectives();

		// retrieve objective to be edited : Brian
		$scope.getEditObjective = function (objId) {
			var obj = {id:objId};
			$http.post("/getEditObjective",obj).success(function (res) {				
				if(res){
					$scope.editObj = res;
				} else {
					$scope.hasEditObj = false;
				}
			})
			.error(function () {
				console.log('There is an error');
			});	
		}

		// edit objectives : Brian
		$scope.editObjective = function (obj) {
			$http.post("/editObjective",obj).success(function (res) {				
				if(res){
					console.log(success);
				} else {
					console.log('error');
				}
					
			})
			.error(function () {
				console.log('There is an error');
			});	
		}

		// remove objectives : Brian
		$scope.removeRejectedObj = function (objId) {
			var obj = {id:objId};
			$http.post("/removeRejectedObj",obj).success(function (res) {				
				if(res){
					console.log(success);
				} else {
					console.log('error');
				}
			})
			.error(function () {
				console.log('There is an error');
			});	
		}
	}])

   .controller('submitObjController', ['allObjectives', '$scope','$rootScope', '$http', function (allObjectives,$scope, $rootScope, $http) {
	   	$scope.index = 0;
		$scope.objIDArray = [];
		$scope.pendingObj = [];
		$scope.hasSendObjErrors = false;
		$scope.capChecked = true;
		$scope.sendObjErrorMsg = "Cannot send empty objectives - make sure you select from above!"

		//Checkbox invokes 'captureObj' function that pushes content into 'pendingObj' array [needs to toggle]
		$scope.captureFinObj = function(objID, description, DSO) {
			$scope.capChecked = !$scope.capChecked;	
			console.log($scope.capChecked);	
		}
		$scope.captureCustObj = function(objID, description, DSO) {
			$scope.capChecked = !$scope.capChecked;	
			console.log($scope.capChecked);	
		}
		$scope.captureIntObj = function(objID, description, DSO) {
			$scope.capChecked = !$scope.capChecked;	
			console.log($scope.capChecked);	
		}
		$scope.captureLearnObj = function(objID, description, DSO) {
			$scope.capChecked = !$scope.capChecked;	
			console.log($scope.capChecked);	
		}
	}])

   .controller('compileController', ['allObjectives','approvedObjectives','unApprovedObjectives','$scope','$rootScope', '$http', function (approvedObjectives,allObjectives,unApprovedObjectives,$scope,$rootScope, $http) {
		$scope.appFinIDArray = [];
		$scope.appCustIDArray = [];
		$scope.appIntIDArray = [];
		$scope.appLearnIDArray = [];
		$scope.appFinObjective = [];
		$scope.appCustObjective = [];
		$scope.appIntObjective = [];
		$scope.appLearnObjective = [];
		//by Mlandvo
		$scope.tester = "";
		$scope.appFinArr = [];
		$scope.appCustArr = [];
		$scope.appIntArr = [];
		$scope.appLearnArr = [];
		$scope.showSubErr = true;
		$scope.showSubMsg = "There are no Approved Objectives to submit for now, Create Objectives. If this problem persists contact your IT Administrator.";
	   	$scope.unactionedKPAs = [];

		$scope.showSCardErr = false;
		$scope.showSCardMsg = "Your Perfomance contract is not ready yet. There are no Approved Objectives to work on for now ... Please Contact your supervisor or try again later.";

		$scope.showEvalErr = true;
		$scope.showEvalMsg = "There are no Approved Objectives to evaluate for now ... Please try again later.";
		//end
		$scope.approvedKPAs = [];
		$scope.unapprovedKPAs = [];
		$scope.act = 0;
		$scope.finRowSpan = 0;
		$scope.custRowSpan = 0;
		$scope.intRowSpan = 0;
		$scope.learnRowSpan = 0;
		$scope.selfEvalObjs = {};
		$scope.singleObj = [];
		$scope.hasSelfEvalErrors = false;
		$scope.scorecardReady = false;
		$scope.hasCompileSCErrors = false;
		$scope.hasFinSCErrors     = false;
		$scope.hasCustSCErrors = false;
		$scope.hasIntSCErrors = false;
		$scope.hasLearnSCErrors = false;
		$scope.generalErrorMsg = "Select atleast one KPA from the above!";
		$scope.finSCErrorMsg = "Choose one of the Finance Objectives";
		$scope.custSCErrorMsg = "Choose one of the Customer Objectives";
		$scope.intSCErrorMsg = "Choose one of the Internal Business Objectives";
		$scope.learnSCErrorMsg = "Choose one of the Learning & Growth Objectives";
		
		$scope.retrieveApproved = function () {
			$http.post('/getApprovedObjectives')
			.success(function (res) {
				$scope.scorecardHeight = res.length + 1;
				$scope.allKP = [];
				/*
				$scope.appCustObj = [];
				$scope.appIntObj = [];
				$scope.appLearnObj = [];*/

				if (res.length > 0) {
					for (var i = 0; i<res.length; i++) {
						//if (res[i].perspective == "finance") {
							$scope.allKP.push(res[i]);
							console.log($scope.allKP);
						/*	
						}
						else if (res[i].perspective == "customer") {
							$scope.appCustObj.push(res[i]);
						}
						else if (res[i].perspective == "internal") {
							$scope.appIntObj.push(res[i]);
						}
						else if (res[i].perspective == "learn") {
							$scope.appLearnObj.push(res[i]);
						}*/
					}
				}
				else if (res.length <= 0){
					$scope.showSCardErr = true;
				}

				
			})
			.error(function () {
				console.log('There is an error with compile socrecard! (BUG FOUND)');
			});		
		};	
/*
		$scope.scorecardCreate = function() {

			for (var index = 0; index < $scope.appFinObj.length; index++){
				console.log($scope.appFinObj);
				$http.post("/createScoreCardRoute:/" + $scope.appFinObj[index]._id , $scope.compileController)
				.success(function (response) {
					$scope.finRowSpan = $scope.appFinObj.length;
					//console.log($scope.finRowSpan);
					$scope.finObjs = response;
					//console.log($scope.finObjs);
				})
				.error(function (response) {
					console.log("Error with Fin Obj for SC_create");
				})
			}
			$scope.finRowSpan = $scope.appFinObj.length;
			console.log($scope.finRowSpan);

			for (var index = 0; index < $scope.appCustObj.length; index++){
				console.log($scope.appCustObj);
				$http.post("/createScoreCardRoute:/" + $scope.appCustObj[index]._id , $scope.compileController)
				.success(function (response) {
					$scope.custRowSpan = $scope.appCustObj.length;
					//console.log(response);
					console.log($scope.custRowSpan);
					$scope.custObjs = response;
				})
				.error(function (response) {
					console.log("Error with Cust Obj for SC_create");
				})
			}

			$scope.custRowSpan = $scope.appCustObj.length;
			console.log($scope.custRowSpan);
			for (var index = 0; index < $scope.appIntObj.length; index++){
				console.log($scope.appIntObj);
				$http.post("/createScoreCardRoute:/" + $scope.appIntObj[index]._id , $scope.compileController)
				.success(function (response) {
					$scope.intRowSpan = $scope.appIntObj.length;
					//console.log(response);
					console.log($scope.intRowSpan);
					$scope.intObjs = response;
				})
				.error(function (response) {
					console.log("Error with Int Obj for SC_create");
				})
			}
	 		$scope.intRowSpan = $scope.appIntObj.length;
			console.log($scope.intRowSpan);
			for (var index = 0; index < $scope.appLearnObj.length; index++){
				console.log($scope.appLearnObj);
				$http.post("/createScoreCardRoute:/" + $scope.appLearnObj[index]._id , $scope.compileController)
				.success(function (response) {
					$scope.learnRowSpan = $scope.appLearnObj.length;
					//console.log(response);
					console.log($scope.learnRowSpan);
					$scope.learnObjs = response;
				})
				.error(function (response) {
					console.log("Error with Learn Obj for SC_create");
				})
			}
			$scope.learnRowSpan = $scope.appLearnObj.length;
			console.log($scope.learnRowSpan);
			//Creates the Scorecard if (and only if) there are (approved) objectives to fill into the table
			if ($scope.finRowSpan > 0 && $scope.custRowSpan > 0 && $scope.intRowSpan > 0 && $scope.learnRowSpan > 0) {
				$scope.scorecardReady = true;
			}
		};
		/*
		$scope.initScorecard = function() {
			approvedObjectives.getApproved()
			.success(function (res) {
				console.log("initScorecard gives:")
					$http.post("/initScorecardRoute:/", res)
					.success(function (res) {
						console.log("initScorecard posted successfully!")
					})
					.error(function (res) {
						console.log(res);
					});
			})
			.error (function () {
				console.log("initScorecard is throwing errors!!!");
			});
		};  */
		// increase objective rating
		$scope.incrementObjRating = function(Obj) {
			var singleObj = $scope.singleObj;
			if (Number(Obj.rating) < 5) {
				Obj.rating +=1;
			} else {
				Obj.rating +=0;
			} 
			singleObj[0] = Obj.rating;
			$scope.selfEvalObjs[Obj._id] = singleObj;
			console.log($scope.selfEvalObjs);
		};
		// decrease objective rating
		$scope.decrementObjRating = function(Obj) {
			var singleObj = $scope.singleObj;
			if (Number(Obj.rating) > 0) {
				Obj.rating -=1;
			} else {
				Obj.rating -=0;
			}
			
			singleObj[0] = Obj.rating;
			$scope.selfEvalObjs[Obj._id] = singleObj;
		};
		//By Mlandvo
		$scope.upload = function (files) {
			console.log("uploading files");
	        if (files && files.length) {
	            for (var i = 0; i < files.length; i++) {
	                var file = files[i];
	                upload({
	                    url: '/uploads/',
	                    fields: {
	                        //'username': $scope.username
	                    },
	                    file: file
	                })
	                .progress(function (evt) {
		                var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
		                $scope.log = 'progress: ' + progressPercentage + '% ' + evt.config.file.name + '\n' + $scope.log;
	                })
	                .success(function (data, status, headers, config) {
		                $timeout(function() {
		                    $scope.log = 'file: ' + config.file.name + ', Response: ' + JSON.stringify(data) + '\n' + $scope.log;
		                });
	               	});
	            }
	        }
	    };
		//By Mlandvo
		$scope.selfEvaluate = function () {
			//console.log($scope.appFinObj.length);
			for (var i = 0; i < $scope.appFinObj.length; i++) {
				if (Number($scope.appFinObj[i].rating) == 0) {
					$scope.hasFinSCErrors = true;
					$scope.finSCErrorMsg = "Rate all Finance Objectives";
					return;
				}
			}
			for (var i = 0; i < $scope.appCustObj.length; i++) {
				if (Number($scope.appCustObj[i].rating) == 0) {
					$scope.hasCustSCErrors = true;
					$scope.custSCErrorMsg = "Rate all Customer Objectives";
					return;
				}
			}
			for (var i = 0; i < $scope.appIntObj.length; i++) {
				if (Number($scope.appIntObj[i].rating) == 0) {
					$scope.hasIntSCErrors = true;
					$scope.intSCErrorMsg = "Rate all Internal Business Objectives";
					return;
				}
			}
			for (var i = 0; i < $scope.appLearnObj.length; i++) {
				if (Number($scope.appLearnObj[i].rating) == 0) {
					$scope.hasLearnSCErrors = true;
					$scope.learnSCErrorMsg = "Rate all Learning & Growth Objectives";
					return;
				}
			}
	   	};	
	   	// By Mlandvo
		$scope.getAllKPAs = function() {
			$http.post('/getApprovedObjectives')
			.success(function (res) {
				$scope.appFinOb = [];
				$scope.appCustOb = [];
				$scope.appIntOb = [];
				$scope.appLearnOb = [];
				$scope.appFin = true;
				$scope.appCust = true;
				$scope.appInt = true;
				$scope.appLearn = true;
				console.log("Ran getAllKPAs finction and got");
				console.log(res.length);
				if(res.length > 0){
					res.forEach(function (kpi) {
			        	if (kpi.perspective == "finance") {
			        		console.log(kpi);
			        		console.log(kpi.perspective);
			          		$scope.appFinOb.push(kpi);
			          		console.log($scope.appFinOb);
			          		$scope.appFin = false;	        		
			        	} 
			        	else if (kpi.perspective == "customer") {
							$scope.appCustOb.push(kpi);
							$scope.appCust = false;
						}
						else if (kpi.perspective == "internal") {
							$scope.appIntOb.push(kpi);
							$scope.appInt = false;
						}
						else if (kpi.perspective == "learn") {
							$scope.appLearnOb.push(kpi);
							$scope.appLearn = false;
						}
		      		})
		      		$scope.showEvalErr = true;
		      		console.log("Array contents");
		      		console.log($scope.appFinOb);
				}
				else if(res.length <= 0){
					$scope.showEvalErr = false;
					console.log("logging for result less than zero");
					console.log($scope.showEvalErr);
				}
				
			})
		};
		//By Mlandvo 
		$scope.updateKPA = function (Obj) {
			//call function that will get evaluated objectives on scorecard
			var id = Obj._id;
			var empComment = Obj.empComment;
			var perspective = Obj.perspective;
			var rating = Obj.rating;
			var value = Obj.value;
			//var detailedWeig = Obj.finDetailedWeighting || Obj.custDetailedWeighting || Obj.learnDetailedWeighting || Obj.intDetailedWeighting;
			var dweight = 0;
			var weightedRating = 0;
			var score = 0;
			var finScore = 0;
			var custScore = 0;
			var learnScore = 0;
			var intScore = 0;
			var status = Obj.status;
			var updateKPA = {};
			var detailedWeig = 0;
			var rating = value;
			var totalScore = 0;

			if (Obj.finDetailedWeighting >0) {
				detailedWeig = Obj.finDetailedWeighting;
			}
			else if (Obj.custDetailedWeighting>0) {
				detailedWeig = Obj.custDetailedWeighting;
			}
			else if (Obj.learnDetailedWeighting>0) {
				detailedWeig = Obj.learnDetailedWeighting;
			}
			else if (Obj.intDetailedWeighting>0) {
				detailedWeig = Obj.intDetailedWeighting;
			};

			if (rating >= 0) {
				status = "evaluatedByEmp"
				dweight = detailedWeig/100;
				weightedRating =  value * dweight;
				
				if(perspective == "finance"){
					finScore += weightedRating;		
				}
				else if(perspective == "customer"){
					custScore += weightedRating;	
				}
				else if(perspective == "internal"){
					learnScore += weightedRating;	
				}
				else if(perspective == "learn"){
					intScore += weightedRating;	
				};
			};

			if (finScore>=0) {
				updateKPA = {id: id, status: status, empComment : empComment, rating: value, weightedRating: weightedRating, score: finScore };
				if (updateKPA.score == 5) {
					$scope.hasErrors = true;
					$scope.errorMsg = "Attach files for evidence to continue with evaluation";
					return updateKPA;
				};
				$http.put('/completeSelfEval', updateKPA).success(function (resp) {
		            $scope.kpaUpdatedMsg = resp;
		            $scope.kpaUpdated = true;
		            console.log($scope.kpaUpdatedMsg);
		        }).error(function () {
		            console.log("An error occured");
		        });
			}
			else if (custScore>=0) {
				updateKPA = {id: id, status: status, empComment : empComment, rating: value, weightedRating: weightedRating, score: custScore };
				if (updateKPA.score == 5) {
					$scope.hasErrors = true;
					$scope.errorMsg = "Attach files for evidence to continue with evaluation";
					return updateKPA;
				}
				$http.put('/completeSelfEval', updateKPA).success(function (resp) {
		            $scope.kpaUpdatedMsg = resp;
		            $scope.kpaUpdated = true;
		            console.log($scope.kpaUpdatedMsg);
		        }).error(function () {
		            console.log("An error occured");
		        });
			}
			else if (learnScore>=0) {
				updateKPA = {id: id, status: status, empComment : empComment, rating: value, weightedRating: weightedRating, score: learnScore };
				if (updateKPA.score == 5) {
					$scope.hasErrors = true;
					$scope.errorMsg = "Attach files for evidence to continue with evaluation";
					return updateKPA;
				}
				$http.put('/completeSelfEval', updateKPA).success(function (resp) {
		            $scope.kpaUpdatedMsg = resp;
		            $scope.kpaUpdated = true;
		            console.log($scope.kpaUpdatedMsg);
		        }).error(function () {
		            console.log("An error occured");
		        });
			}
			else if (intScore>=0) {
				updateKPA = {id: id, status: status, empComment : empComment, rating: value, weightedRating: weightedRating, score: intScore };
				if (updateKPA.score == 5) {
					$scope.hasErrors = true;
					$scope.errorMsg = "Attach files for evidence to continue with evaluation";
					return updateKPA;
				}
				$http.put('/completeSelfEval', updateKPA).success(function (resp) {
		            $scope.kpaUpdatedMsg = resp;
		            $scope.kpaUpdated = true;
		            console.log($scope.kpaUpdatedMsg);
		        }).error(function () {
		            console.log("An error occured");
		        });
			}
		};	
		//By Mlandvo
		$scope.getEvalKPAs = function () {
				
			console.log("getting evaluated KPAs");
			$http.post('/getEvalKPAs').success(function (data) {
				console.log("got evaluated KPAs");
				//console.log(res);
	  			for (var i = 0; i<data.length; i++) {
	  				$scope.scorecardHeights = data.length + 1;
					if (data[i].perspective == "finance") {
						$scope.appFinArr.push(data[i]);
						$scope.finRowSpan += $scope.appFinArr.length;
					}
					else if (data[i].perspective == "customer") {
						$scope.appCustArr.push(data[i]);
						$scope.custRowSpan += $scope.appCustArr.length;
					}
					else if (data[i].perspective == "internal") {
						$scope.appIntArr.push(data[i]);
						$scope.intRowSpan += $scope.appIntArr.length;
					}
					else if (data[i].perspective == "learn") {
						$scope.appLearnArr.push(data[i]);
						$scope.learnRowSpan += $scope.appLearnArr.length;
					}
				}//end for loop
				console.log("I am the scorecard height variable");
				console.log($scope.scorecardHeights);
				console.log("length");
				console.log($scope.appFinArr.length);
			}).error (function (error) {
				console.log(error);
			})		
		};//end master func

		// retrieve Objectivez : Mlandvo
	    $scope.getObjectivez = function () {
	    	console.log("get objectives called");
	    	
			$http.post("/getAllObjectives").success(function (res) {				
				//$scope.empObjectives = res;
				//console.log(res);
				console.log(res.length);
				if(res.length > 0){
					$scope.showSubErr = false;
					$scope.unactionedKPAs = res;
					console.log($scope.unactionedKPAs);	
					console.log("KPAs in array");
							
				}
				else if(res.length <= 0){
					$scope.showSubErr = true;
					console.log("logging for result less than zero");
					console.log($scope.showSubErr);
				}
				
			})
			.error(function () {
				console.log('There is an error');
			});	
			
		}
		$scope.clearSubmitModal = function () {
			$scope.unactionedKPAs = null;
			$scope.showSubErr = true;
		};
		//$scope.getObjectivez();

		$scope.getKPA = function (Obj) {
			var id = Obj._id;
			console.log(id);
			console.log("get kpa function called + response");
			$http.post("/getKPA/" + id)
				.success(function (res) {
					
				console.log(res);
				$scope.kpaID = res._id;
			});
		};

		//By Mlandvo
		$scope.submitKPAs = function (kpaID) {
			console.log("submit function called");
			//$scope.send = true;
			var toBeSent = [];
			var toBeDeleted = [];
			var id = $scope.kpaID;
			//console.log(Obj);
			//console.log(typeof(id));
			$http.post("/objectivesSubmitted_status_changed/" + id)
					.success(function (res) {
						//$('#successObjSubmit').slideDown();
						console.log(res);
						console.log("KPA uphanded");
						$scope.getObjectivez().$apply();
				})
				.error(function (res) {
					console.log(res);
					});
			};//end of function

		$scope.delKPA = function (kpaID) {
			console.log("Delete kpa function called");
			var id = $scope.kpaID;
			$http.post("/deleteKPA/" + id)
				.success(function (response) {
				console.log(response);
				$scope.getObjectivez().$apply();
			});

		};
		// retrieve getUnactndObjectives : Brian
	    $scope.getUnactndObjectives = function () {
	    	
			$http.post("/getAllObjectives").success(function (res) {	
				console.log(res);			
				if(res.length > 0){
					$scope.showSubErr = false;
					$scope.unactionedKPAs = res;
				} else if(res.length <= 0){
					$scope.showSubErrUactd = true;
				}	
			})
			.error(function () {
				console.log('There is an error');
			});	
		}
		$scope.getUnactndObjectives();

		//console.log("whats wrong");

		//$scope.getUnactndObjectives();	

		// retrieve getUnaprdObjectives : Brian
	    $scope.getUnaprdObjectives = function () {
	    	
			$http.post("/getAllUnapprovedObjectives").success(function (res) {				

				if(res.length > 0){
					for (var i = 0; i<res.length; i++) {
						$scope.unapprovedKPAs.push(res[i]);
					};		
				} else if(res.length <= 0){
					$scope.showSubErrUnAprvd = true;
					console.log("there should be an error");
					console.log($scope.showSubErrUnAprvd);
					$scope.showSubMsg = "There are no unapproved objectives";
				}	
			})
			.error(function () {
				console.log('There is an error');
			});	
		}
		$scope.getUnaprdObjectives();

		// retrieve approved objectives : Brian
	    $scope.getAprdObjectives = function () {

			$http.post("/getAllApprovedObjectives").success(function (res) {				
				if(res.length > 0){
					for (var i = 0; i<res.length; i++) {
						$scope.approvedKPAs.push(res[i]);
					};
							
				} else if(res.length <= 0){
					$scope.showSubErrAprvd = true;

				}	
			})
			.error(function () {
				console.log('There is an error');
			});	
		}

		$scope.getAprdObjectives();

		// retrieve objective to be edited : Brian
		$scope.getEditObjective = function (objId) {
			var obj = {id:objId};
			$http.post("/getEditObjective",obj).success(function (res) {				
				if(res){
					$scope.editObj = res;
				} else {
					$scope.hasEditObj = false;
				}
			})
			.error(function () {
				console.log('There is an error');
			});	
		}

		// edit objectives : Brian
		$scope.editObjective = function (obj) {
			$http.post("/editObjective",obj).success(function (res) {				
				if(res){
					console.log(success);
				} else {
					console.log('error');
				}
					
			})
			.error(function () {
				console.log('There is an error');
			});	
		}

		// remove objectives : Brian
		$scope.removeRejectedObj = function (objId) {
			var obj = {id:objId};
			$http.post("/removeRejectedObj",obj).success(function (res) {				
				if(res){
					console.log(success);
				} else {
					console.log('error');
				}
			})
			.error(function () {
				console.log('There is an error');
			});	
		}
	}])	

	.controller('empPanelInfoCtrl', ['allObjectives', 'pendingObjectives', 'approvedObjectives', 'unApprovedObjectives', '$scope', function (allObjectives, pendingObjectives, approvedObjectives, unApprovedObjectives, $scope) {

		allObjectives.getObjectives()
		.success(function (res) {
			$scope.unapprovedVal = res.length;
			//console.log("Response is:");
			//console.log(res);
		});

		pendingObjectives.getPending()
		.success(function (res) {       
			$scope.pendingVal = res.length;
		});

		approvedObjectives.getApproved()
		.success(function (res) {       
			$scope.approvedVal = res.length;
		});
	}])
 
    .controller('supRoleController', ['pendingObjectives', 'approvedObjectives', '$scope', '$http', function (pendingObjectives, approvedObjectives, $scope, $http) {
   		//Initial variables used in "Edit Objective" button for Finance Objective
   		$scope.financeEditLabel = true;
   		$scope.financeUnedittable = true;
   		$scope.finDSOUnedittable = true;
   		$scope.finDescriptionUnedittable = true;
   		$scope.finMetricOneUnedittable = true;
   		$scope.finMetricTwoUnedittable = true;
   		$scope.finMetricThreeUnedittable = true;
   		$scope.finMetricFourUnedittable = true;
   		$scope.finMetricFiveUnedittable = true;
   		$scope.financeEditLabelText = "Unlock Objective";

		//Initial variables used in "Edit Objective" button for Customer Objective
		$scope.customerEditLabel = true;
   		$scope.customerUnedittable = true;
   		$scope.customerEditLabelText = "Unlock Objective";

   		//Initial variables used in "Edit Objective" button for internal Objective
   		$scope.isRejected = false;

		$scope.internalEditLabel = true;
   		$scope.internalUnedittable = true;
   		$scope.internalEditLabelText = "Unlock Objective";

		//Initial variables used in "Edit Objective" button for Learn Objective
		$scope.learnEditLabel = true;
   		$scope.learnUnedittable = true;
   		$scope.learnEditLabelText = "Unlock Objective";

   		//Leave table of employees visible (rather than toggling between 'show and hide') 
   		$scope.empKPAs = true;

   		$scope.retrieveEmpObjs = function (empPF, empName) {
			//console.log(empPF);
			//console.log(empName)
			//$scope.empAlias = {};

			$scope.empAlias = {PF: empPF, Name: empName};
			console.log($scope.empAlias);

			pendingObjectives.getPending()
			.success(function (res) {
				//This works just fine, objectives are received and displayed
				//console.log("Response is:")
				//console.log(res);

				//for( var i = 0; i< res.length)

				console.log("Pending objectives are as follows:")
				$scope.empObjArray = res;
				//console.log($scope.empObjArray);
				console.log("PF is:::");
				console.log(empPF);

				$scope.specificEmpFinObjs = []
				$scope.specificEmpCustObjs = []
				$scope.specificEmpIntObjs = []
				$scope.specificEmpLearnObjs = [];

				
				for (var i = 0; i < $scope.empObjArray.length; i++){
					//console.log($scope.empObjArray[i].PFNum);
					//console.log($scope.empObjArray.length);
					if (empPF == $scope.empObjArray[i].PFNum) {

						if ($scope.empObjArray[i].perspective = "finance"){
							$scope.specificEmpFinObjs[i] = $scope.empObjArray[i];
						}
						 if ($scope.empObjArray[i].perspective = "customer"){
							$scope.specificEmpCustObjs[i] = $scope.empObjArray[i];
							//console.log("So now Cust :");
							//console.log($scope.specificEmpCustObjs[i].description);
						} 
						if ($scope.empObjArray[i].perspective = "internal"){
							$scope.specificEmpIntObjs[i] = $scope.empObjArray[i];
							//console.log("So now Int:");
							//console.log($scope.specificEmpIntObjs[i].description);
						}
						if ($scope.empObjArray[i].perspective = "learning"){
							$scope.specificEmpLearnObjs[i] = $scope.empObjArray[i];
							//console.log("So now Learn:");
							//console.log($scope.specificEmpLearnObjs[i].description);
						}
						else {
							console.log("No other Objectives found!");
						}
					}
				}
			})
			.error(function () {
				console.log("Buzzer sound!!!");
			});



		}

   		//Edit Finance Objective Button logic for toggling between states of "Edit" && "Lock"
   		$scope.editempObjective = function(iden) {
   			$scope.financeUnedittable = !$scope.financeUnedittable;
   			$scope.financeEditLabel = !$scope.financeEditLabel;

			 if ($scope.financeEditLabel === false) {
	   			$scope.financeEditLabelText = "Lock Objective";
	   		}
	   		else if ($scope.financeEditLabel === true) {
	   			$scope.financeEditLabelText = "Unlock Objective";
	   		}

   			console.log($scope.financeEditLabelText);
   		}

   		$scope.rejectempObjective = function() {
   			$scope.isRejected = true;
   			console.log($scope.isRejected);
   		}
   		//Edit Customer Objective Button logic for toggling between states of "Edit" && "Lock"
   		$scope.editCustomerObjective = function() {
   			$scope.customerUnedittable = !$scope.customerUnedittable;
   			$scope.customerEditLabel = !$scope.customerEditLabel;

			 if ($scope.customerEditLabel === false) {
	   			$scope.customerEditLabelText = "Lock Objective";
	   		}
	   		else if ($scope.customerEditLabel === true) {
	   			$scope.customerEditLabelText = "Edit Objective";
	   		}

   			console.log($scope.customerEditLabelText);
   		}
   		//Edit Internal Objective Button logic for toggling between states of "Edit" && "Lock"
   		$scope.editInternalObjective = function() {
   			$scope.internalUnedittable = !$scope.internalUnedittable;
   			$scope.internalEditLabel = !$scope.internalEditLabel;

			 if ($scope.internalEditLabel === false) {
	   			$scope.internalEditLabelText = "Lock Objective";
	   		}
	   		else if ($scope.internalEditLabel === true) {
	   			$scope.internalEditLabelText = "Edit Objective";
	   		}

   			console.log($scope.internalEditLabelText);
   		}
   		//Edit Learn Objective Button logic for toggling between states of "Edit" && "Lock"
   		$scope.editLearnObjective = function() {
   			$scope.learnUnedittable = !$scope.learnUnedittable;
   			$scope.learnEditLabel = !$scope.learnEditLabel;

			 if ($scope.learnEditLabel === false) {
	   			$scope.learnEditLabelText = "Lock Objective";
	   		}
	   		else if ($scope.learnEditLabel === true) {
	   			$scope.learnEditLabelText = "Edit Objective";
	   		}

   			console.log($scope.learnEditLabelText);
   		}

   		pendingObjectives.getPending()
   		.success(function (res) {
   			$scope.empKPAVal = res.length;
   		});

   		$scope.retrieveApproved = function (empPF, empName) {
			approvedObjectives.getApproved()
			.success(function (res) {
				
					$scope.empAlias = {PF: empPF, Name: empName};
					console.log($scope.empAlias);
					console.log(res);
					$scope.scorecardHeight = res.length + 1;
					console.log("Score card height is:")

					console.log($scope.scorecardHeight);
					$scope.appFinObj = [];
					$scope.appCustObj = [];
					$scope.appIntObj = [];
					$scope.appLearnObj = [];

					for (var i = 0; i<res.length; i++) {
						if (res[i].perspective == "finance") {
							$scope.appFinObj.push(res[i]);
						}
						else if (res[i].perspective == "customer") {
							$scope.appCustObj.push(res[i]);
						}
						else if (res[i].perspective == "internal") {
							$scope.appIntObj.push(res[i]);
						}
						else if (res[i].perspective == "learn") {
							$scope.appLearnObj.push(res[i]);
						}
					}
					console.log("Finance items :")
				 	console.log($scope.appFinObj);
				 	for (var k =0; k<$scope.appFinObj.length; k++) {
				 		console.log($scope.appFinObj[k]._id);
				 	}

			})
			.error(function () {
	   			console.log("Could not retrieve Approved Objectives");
	   		});
		}

   		//toggle display of Employee information with KPAs
   		/*$scope.empKPAs = false;
   			$scope.toggleEmpKPA = function() {
   				$scope.empKPAs = !$scope.empKPAs;
   		}*/

   		$scope.getEmps = function() {
   			//getSecEmployees.success(function (res) {
   				console.log(res);
   			//});
   		}

   		$scope.retrieveEmployees = function () {
   			$http.post('/getEmpsPendingObjs').success( function (response) {
   				//console.log(response);
   				$scope.emps = response;


   			})
		}

		$scope.approveempObjective = function (id, PFNum, finDescription, finDSO, finOneDef, finTwoDef, finThreeDef, finFourDef, finFiveDef) {
			$scope.approveFinObj = {PF: PFNum, description: finDescription, DSO: finDSO, oneDef: finOneDef, twoDef: finTwoDef, threeDef: finThreeDef, fourDef: finFourDef, fiveDef: finFiveDef, perspective: "finance"}
			$http.post('/approveempObjective/' + id, $scope.approveFinObj)
			.success(function () {
				$('#successObjAlert12').show(500);
			})
			.error(function (err) {
				console.log("Objective empty!!");
			})
		}

		/*$scope.rejectempObjective = function (id) {
			$http.post('/rejectempObjective/' + id)
			.success(function () {
				$('#successObjAlertFinReject').show(500);
			})
			.error(function (err) {
				console.log("Objective empty!!");
			})
		}*/

		$scope.approveCustomerObjective = function (id, PFNum, custDescription, custDSO, custOneDef, custTwoDef, custThreeDef, custFourDef, custFiveDef) {
			$scope.approveCustObj = {PF: PFNum, description: custDescription, DSO: custDSO, oneDef: custOneDef, twoDef: custTwoDef, threeDef: custThreeDef, fourDef: custFourDef, fiveDef: custFiveDef, perspective: "customer"}
			$http.post('/approveCustomerObjective/' + id, $scope.approveCustObj)
			.success(function () {
				$('#successObjAlert22').show(500);
			})
			.error(function (err) {
				console.log(err);
			})
		}

		$scope.approveInternalObjective = function (id, PFNum, intDescription, intDSO, intOneDef, intTwoDef, intThreeDef, intFourDef, intFiveDef) {
			$scope.approveIntObj = {PF: PFNum, description: intDescription, DSO: intDSO, oneDef: intOneDef, twoDef: intTwoDef, threeDef: intThreeDef, fourDef: intFourDef, fiveDef: intFiveDef, perspective: "internal"}
			$http.post('/approveInternalObjective/' + id, $scope.approveIntObj)
			.success(function () {
				$('#successObjAlert32').show(500);
			})
			.error(function (err) {
				console.log(err);
			})
		}

		$scope.approveLearnObjective = function (id, PFNum, learnDescription, learnDSO, learnOneDef, learnTwoDef, learnThreeDef, learnFourDef, learnFiveDef) {
			$scope.approveLearnObj = {PF: PFNum, description: learnDescription, DSO: learnDSO, oneDef: learnOneDef, twoDef: learnTwoDef, threeDef: learnThreeDef, fourDef: learnFourDef, fiveDef: learnFiveDef, perspective: "learn"}
			$http.post('/approveLearnObjective/' + id, $scope.approveLearnObj)
			.success(function () {
				$('#successObjAlert42').show(500);
			})
			.error(function (err) {
				console.log(err);
			})
		}
    }])

    .controller('supEmpObjsCtrl', ['pendingObjectives', '$scope', function (pendingObjectives, $scope) {

   		$scope.retrieveEmpObjs = function (empPF, empName) {
			//console.log(empPF);
			//console.log(empName)
			//$scope.empAlias = {};

			$scope.empAlias = {PF: empPF, Name: empName};
			console.log($scope.empAlias);

			pendingObjectives.getPending()
			.success(function (res) {
				//This works just fine, objectives are received and displayed
				//console.log("Response is:")
				//console.log(res);

				//for( var i = 0; i< res.length)

				console.log("Pending objectives are as follows:")
				$scope.empObjArray = res;
				console.log($scope.empObjArray);

				$scope.specificEmpFinObjs = [];
				$scope.specificEmpCustObjs = [];
				$scope.specificEmpIntObjs = [];
				$scope.specificEmpLearnObjs = [];

				
				for (var i = 0; i < $scope.empObjArray.length; i++){
					//console.log($scope.empObjArray[i].PFNum);
					//console.log($scope.empObjArray.length);
					if (empPF == $scope.empObjArray[i].PFNum) {

						if ($scope.empObjArray[i].perspective == "finance"){
							$scope.specificEmpFinObjs.push($scope.empObjArray[i]);
						}
						 if ($scope.empObjArray[i].perspective == "customer"){
							$scope.specificEmpCustObjs.push($scope.empObjArray[i]);
							//console.log("So now Cust :");
							//console.log($scope.specificEmpCustObjs[i].description);
						} 
						if ($scope.empObjArray[i].perspective == "internal"){
							$scope.specificEmpIntObjs.push($scope.empObjArray[i]);
							//console.log("So now Int:");
							//console.log($scope.specificEmpIntObjs[i].description);
						}
						if ($scope.empObjArray[i].perspective =="learn"){
							$scope.specificEmpLearnObjs.push($scope.empObjArray[i]);
							//console.log("So now Learn:");
							//console.log($scope.specificEmpLearnObjs[i].description);
						}
						else {
							console.log("No other Objectives found!");
						}
					}
				}
			})
			.error(function () {
				console.log("Buzzer sound!!!");
			});
		}
		/* SELF EVAlUATION CONTROLLER*/
    }])

 	.controller('ctrl560cfdc514d04f8439306951', ['$scope', '$http', function($scope, $http) {
      	$scope.initCompIcon = 'glyphicon glyphicon-tower';
     	$scope.initCompStructType = 'company';
     	$scope.initCompParObjId = '0';
     	$scope.listOfPos = null;

     	$scope.myTree = [];

     	$scope.structType = [{
         disp: "Division",
         val: "division"
     	}, {
         disp: "Department",
         val: "department"
     }, {
         disp: "Section",
         val: "section"
     }, {
         disp: "Subsection",
         val: "subsection"
     }, {
         disp: "Position",
         val: "position"
     }];

     //$("#obj560cf73114d04f843930692a").hide();

     setTimeout(function(){
        $('#tree').treeview({
          data: $scope.myTree //$scope.getTree()
        });
     },1500);

     $scope.func560d4856d00d941c304c7254 = function() {
         $http.post('/route560d4856d00d941c304c7254').success(function(resp) {
             $scope.listOfPos = resp;
             console.log(resp);
         });

     }

     $scope.getPerspectives = function() {
         $http.post('/getPerspectives').success(function(resp) {
             $scope.listOfPersp = resp;
             console.log(resp);
         });

     }
     
     //Get all perspectives
     $scope.getPerspectives();

     $scope.getPositions = function() {
         $http.post('/getPositions').success(function(resp) {
             $scope.listOfPos = resp;
             console.log(resp);
         });

     }
     
     //Get all positions
     $scope.getPositions();

     $scope.func560d4856d00d941c304c7254();


     $scope.$on('begin560d000d14d04f84393069550', function(event, data) {
         $scope.func560d000d14d04f84393069550()
     });

     $scope.$on('end560d4062da6ba58814600b161', function(event, data) {
         $scope.func560d4062da6ba58814600b162()
     });

     $scope.func560d000d14d04f84393069550 = function() {
         $http.post('/route560d000d14d04f84393069550', {
             name: $scope.structInitCompName,
             icon: $scope.initCompIcon,
             parentObjid: $scope.initCompParObjId,
             structType: $scope.initCompStructType

         }).success(function(resp) {
             $scope.myTree = [];
             $scope.func55df0ed0b2bc8bc76c51da16();
             $scope.getPositions();
             setTimeout(function(){
                $('#tree').treeview({
                  data: $scope.myTree //$scope.getTree()
                });
             },1000);
             console.log(resp);
             $scope.$broadcast('end560d000d14d04f84393069550', 'Composite');
         });

     }

     $scope.func55df0ed0b2bc8bc76c51da16 = function() {
         $http.post('/route55df0ed0b2bc8bc76c51da16').success(function(resp) {
             $scope.structPar = resp;
             console.log(resp);
         });

         $http.post('/getStructure').success(function(resp) {
         	 $scope.myTree = [];
             $scope.myTree.push(resp.nodeData);
             console.log($scope.myTree);
         });

     }

     $scope.func55df0ed0b2bc8bc76c51da16();

     $scope.func55df11e094e05079749e0a04 = function() {
         var structIcon = '';

         if ($scope.structureType == "company") {
             structIcon = "glyphicon glyphicon-tower"
         } else if ($scope.structureType == "division") {
             structIcon = "glyphicon glyphicon-tasks"
         } else if ($scope.structureType == "department") {
             structIcon = "glyphicon glyphicon-home"
         } else if ($scope.structureType == "section") {
             structIcon = "glyphicon glyphicon-file"
         } else if ($scope.structureType == "subsection") {
             structIcon = "glyphicon glyphicon-th"
         } else if ($scope.structureType == "position") {
             structIcon = "glyphicon glyphicon-link"
         } else if ($scope.structureType == "employee") {
             structIcon = "glyphicon glyphicon-user"
         };

         $http.post('/route55df11e094e05079749e0a04', {
             parentObjid: $scope.parentObjid,
             name: $scope.name,
             structType: $scope.structureType,
             structCompoAddBtn: $scope.structCompoAddBtn,
             icon: structIcon
         }).success(function(resp) {
         	$scope.func55df0ed0b2bc8bc76c51da16();
         	$scope.getPositions();
             setTimeout(function(){
                $('#tree').treeview({
                  data: $scope.myTree //$scope.getTree()
                });
             },1000);
             console.log(resp);
         });

     }

     $scope.func560d4062da6ba58814600b162 = function() {

         $scope.perspName = "";
         console.log($scope.listOfPersp);

     }

     $scope.func560d4062da6ba58814600b16 = function() {

         $scope.$broadcast('begin560d000d14d04f84393069550', 'Composite start');

     }

     $scope.$on('end560d000d14d04f84393069550', function(event, data) {
         $scope.func560d000d14d04f84393069551()
     });

     $scope.$on('end560d4062da6ba58814600b160', function(event, data) {
         $scope.func560d4062da6ba58814600b161()
     });

     $scope.func560d000d14d04f84393069551 = function() {
         $http.post('/route560d000d14d04f84393069551').success(function(resp) {
             $scope.structInitCompName = "";
             $scope.$broadcast('end560d000d14d04f84393069551', 'Composite');
         });

     }

     $scope.func560d4062da6ba58814600b161 = function() {
         $http.post('/route560d4062da6ba58814600b161').success(function(resp) {
             $scope.listOfPersp = resp;
             $scope.$broadcast('end560d4062da6ba58814600b161', 'Composite');
         });

     }

     $scope.saveNewPerspective = function() {
         $http.post('/saveNewPerspective',{
         	perspName:$scope.perspName
         }).success(function(resp) {
             $scope.perspName = "";
             $scope.listOfPersp = resp;
             console.log(resp);
         });

     }

     $scope.saveNewEmployee = function() {
         $http.post('/saveNewEmployee',{
         	fname:$scope.newEmpFName,
         	mname:$scope.newEmpMName,
         	lname:$scope.newEmpLName,
         	natid:$scope.newEmpNatId,
         	empno:$scope.newEmpNum,
         	empos:$scope.newEmpPos,
         	empName: $scope.newEmpFName+" "+ $scope.newEmpLName,
         	position: $scope.newEmpPos,
         	PFNum: $scope.newEmpNum,
         	userName: "sec"+$scope.newEmpNum,
         	password: "admin",
         	roles: ["employee"]
         }).success(function(resp) {
             $scope.newEmpFName = "";
             $scope.newEmpMName = "";
             $scope.newEmpLName = "";
             $scope.newEmpNatId = "";
             $scope.newEmpNum = "";
             $scope.newEmpPos = "";

             console.log(resp);
         });

     }
 	}])

	.controller('customerPerspectiveController', function ($scope, $http) {})
	.controller('financePerspectiveController', function ($scope, $http) {})
	.controller('learnPerspectiveController', function ($scope, $http) {})
	.controller('internalPerspectiveController', function ($scope, $http) {});