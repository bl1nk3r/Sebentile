 //using $scope to bind data models from the UI to the angular script (interchangeably)
var bsc = angular.module('BSCIMS', ['ngRoute']);

/***********************************************************************************************************************************************
***********************************************GLOBAL SERVICES**********************************************************************************
***********************************************************************************************************************************************/

	 //this service retrieves and globally stores all objectives (with a default status of "unapproved") to be used by any controller
	 bsc.service('allObjectives', ['$http', function ($http){
			this.getObjectives = function () {
				return $http.post("/getAllObjectives");
			}
		}]) 

	//while this one does the same only for objectives that have been sent for processing or approval (with a status of  "sent_for_approval")
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

	 	/*.controller('allObjectivesCtrl', ['allObjectives', '$scope', function(allObjectives, $scope){
	 		$scope.allObjectives = allObjectives;
	 	}])*/


/***********************************************************************************************************************************************
*********************************************************MANAGE EMPLOYEES***********************************************************************
***********************************************************************************************************************************************/
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

/***********************************************************************************************************************************************
********************************************************EMPLOYEE CONTROLLER*********************************************************************
***********************************************************************************************************************************************/
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

 /*************************************************************************************************************************************************************************************************
 ********************************************************HUMAN RESOURCE CONTROLLER*****************************************************************************************************************
 *************************************************************************************************************************************************************************************************/

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

 /*************************************************************************************************************************************************************************************************
 ********************************************************ADMINISTRATOR  CONTROLLER*****************************************************************************************************************
 *************************************************************************************************************************************************************************************************/

 .controller('adminController',['$scope','$http','manageEmployeeData', function($scope, $http, manageEmployeeData){
	
 }])


/***********************************************************************************************************************************************
*****************************************************FINANCE PERSPECTIVE CONTROLLER*************************************************************
************************************************************************************************************************************************/
   .controller('financePerspectiveController', function ($scope, $rootScope, $http) {
		
	//$scope.PF = $rootScope.PF;
	//console.log($rootScope.PF);
		
	$scope.poorOptions = [{ label: '-Select metric-', value: 0},
						  { label: '>15% budget variance', value: 15 },
    				      { label: '>16% budget variance', value: 16 },
  					      { label: '>17% budget variance', value: 17 },
  					      { label: '>18% budget variance', value: 18 }
  					     ];

  	$scope.unsatOptions = [{ label: '-Select metric-', value: 0},
				           { label: '>19% budget variance', value: 19 },
    			           { label: '>20% budget variance', value: 20 },
  				           { label: '>21% budget variance', value: 21 },
  				           { label: '>22% budget variance', value: 22 }
  				          ];

  	$scope.targetOptions = [{ label: '-Select metric-', value: 0},
						    { label: '9% budget variance  ', value: 9 },
    				        { label: '10% budget variance ', value: 10 },
  					        { label: '11% budget variance ', value: 11 }
  					       ];

  	$scope.exceedOptions = [{ label: '-Select metric-', value: 0},
					        { label: '<5% budget variance ', value: 5 },
    				        { label: '<6% budget variance ', value: 6 },
  					        { label: '<7% budget variance ', value: 7 }
  					       ];

  	$scope.outstandOptions = [{ label: '-Select metric-', value: 0},
						      { label: '0% budget variance', value: 00 },
    				          { label: '1% budget variance', value: 16 }
  					         ];

  	$scope.monitorChange = function() {
  		console.log($scope.poorOptions);
  	}

	$scope.submitFinanceObjective = function (PF) { 
		
		$scope.finObjError = [],
		$scope.createObjectiveErrorMsgs = [],
		$scope.hasCreateObjErrors = false;
		$scope.hasFinKPAError = false;
		$scope.hasFinKPIError = false;
	
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

		if ($scope.financePerspectiveController.description == null) {

			$scope.hasFinKPAError = true,
			$scope.finObjError.push(objDescriptionError);
		}
		else if ($scope.financePerspectiveController.DSO == null) {

			$scope.hasFinKPIError = true,
			$scope.finObjError.push(objDSOError);
		}
		else if ($scope.poorOptions.value == 0) {

			$scope.hasCreateObjErrors = true,
			$scope.createObjectiveErrorMsgs.push(poorOptionsSelectError);
		}
		else if ($scope.unsatOptions.value == 0) {

			$scope.hasCreateObjErrors = true,
			$scope.createObjectiveErrorMsgs.push(unsatOptionsSelectError);
		}
		else if ($scope.targetOptions.value == 0) {

			$scope.hasCreateObjErrors = true,
			$scope.createObjectiveErrorMsgs.push(targetOptionsSelectError);
		}
		else if ($scope.exceedOptions.value == 0) {

			$scope.hasCreateObjErrors = true,
			$scope.createObjectiveErrorMsgs.push(exceedOptionsSelectError);
		}
		else if ($scope.outstandOptions.value == 0) {

			$scope.hasCreateObjErrors = true,
			$scope.createObjectiveErrorMsgs.push(outstandOptionsSelectError);
		}
		else if ($scope.financePerspectiveController.metricOneDef == null) {

			$scope.hasCreateObjErrors = true,
			$scope.createObjectiveErrorMsgs.push(poorOptionsDefError);
		}
		else if ($scope.financePerspectiveController.metricTwoDef == null) {

			$scope.hasCreateObjErrors = true,
			$scope.createObjectiveErrorMsgs.push(unsatOptionsDefError);
		}
		else if ($scope.financePerspectiveController.metricThreeDef == null) {

			$scope.hasCreateObjErrors = true,
			$scope.createObjectiveErrorMsgs.push(targetOptionsDefError);
		}
		else if ($scope.financePerspectiveController.metricFourDef == null) {

			$scope.hasCreateObjErrors = true,
			$scope.createObjectiveErrorMsgs.push(exceedOptionsDefError);
		}
		else if ($scope.financePerspectiveController.metricFiveDef == null) {

			$scope.hasCreateObjErrors = true,
			$scope.createObjectiveErrorMsgs.push(outstandOptionsDefError);
		}
		else {

	    	$http.post("/financePerspectiveController", $scope.financePerspectiveController)
	    	.success(function (resp){
	    		//console.log(resp);
	    		$scope.Objective = resp;
	    		console.log($scope.Objective);
	    		$('#successObjAlert1').slideDown();
	    	});
	    }
    };	

	$scope.renderFinancePerspective = function (response) {
		$scope.financePerspective = response;
	};

	$scope.retrieveFinanceObjectives = function() {
		$http.get("/retrieveFinanceObjectives")
		.success(function (res, err) {
			if (err) {console.log(err);}
			console.log(res);
		});
		//.success($scope.renderFinancePerspective);
	};


	$scope.removeFinanceObjective = function (id) {
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

	annyang.addCommands(commands);
	annyang.debug();
	annyang.start();
})

	.controller('adminController',['$scope','$http','manageEmployeeData', function ($scope, $http, manageEmployeeData){
 	}]) // end adminController

	// Brian
   .controller('empRoleController', ['allObjectives','$http','$scope', function (allObjectives, $http, $scope) {
   		$scope.financeObjective = {};
   		$scope.gotFinBCW = false;
   		$scope.BCWStat = "Lock";
   		$scope.showSubErr = false;
		$scope.showSubMsg = "There are no Approved Objectives to submit for now, Create Objectives or if this problem persists contact your IT Administrator.";
   		
   		$scope.financeObjective.metrixType = '--Select matrix--';
   		$scope.objPerspDropdownMenu = '--Select a Perspective--';
   		$scope.finObjWeightSum = 0;
   		$(".form_datetime").datetimepicker({format: 'yyyy-mm-dd', autoclose:true, todayBtn:true, weekStart: 1, todayHighlight: 1, startView: 2, minView: 2, forceParse: 0});

   		// capture finace broad category weighting
   		$scope.captureFinBrdCatWeighting = function (val) {

   			if ($scope.financeObjective.finBrdCatWeighting != null) {
   				$scope.financeObjective.finBrdCatWeighting = val;	
   			}
   			
   			$scope.gotFinBCW = !$scope.gotFinBCW;

   			if ($scope.BCWStat == 'Lock') {
   				$scope.BCWStat = "Unlock";
   			} else if ($scope.BCWStat == 'Unlock') {
   				$scope.BCWStat = "Lock";
   			};
   		};

   		// submit finace objectives : Brian
		$scope.submitFinanceObjective = function () { 

			// define function variables
			$scope.finObjError = [],
			$scope.createObjectiveErrorMsgs = [],
			$scope.hasCreateObjErrors = false;
			$scope.hasFinKPAError = false;
			$scope.hasFinKPIError = false;

			$scope.clearFinObjectivesErrors = function () {
				$scope.finObjError = [],
				$scope.createObjectiveErrorMsgs = [],
				$scope.hasCreateObjErrors = false;
				$scope.hasFinKPAError = false;
				$scope.hasFinKPIError = false;
			}

			if (Number($scope.finObjWeightSum) > Number($scope.financeObjective.finBrdCatWeighting)) {
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

			// capture create finance objective errors
			/*if ($scope.financeObjective.description == null) {
				$scope.clearFinObjectivesErrors();
				$scope.hasFinKPAError = true,
				$scope.finObjError.push(objDescriptionError);

			} else if ($scope.financeObjective.DSO == null) {
				$scope.clearFinObjectivesErrors();
				$scope.hasFinKPIError = true,
				$scope.finObjError.push(objDSOError);

			} else if ($scope.financeObjective.metricOneDef == null) {
				$scope.clearFinObjectivesErrors();
				$scope.hasCreateObjErrors = true,
				$scope.createObjectiveErrorMsgs.push(poorOptionsDefError);

			} else if ($scope.financeObjective.metricTwoDef == null) {
				$scope.clearFinObjectivesErrors();
				$scope.hasCreateObjErrors = true,
				$scope.createObjectiveErrorMsgs.push(unsatOptionsDefError);

			} else if ($scope.financeObjective.metricThreeDef == null) {
				$scope.clearFinObjectivesErrors();
				$scope.hasCreateObjErrors = true,
				$scope.createObjectiveErrorMsgs.push(targetOptionsDefError);

			} else if ($scope.financeObjective.metricFourDef == null) {
				$scope.clearFinObjectivesErrors();
				$scope.hasCreateObjErrors = true,
				$scope.createObjectiveErrorMsgs.push(exceedOptionsDefError);

			} else if ($scope.financeObjective.metricFiveDef == null) {
				$scope.clearFinObjectivesErrors();
				$scope.hasCreateObjErrors = true,
				$scope.createObjectiveErrorMsgs.push(outstandOptionsDefError);

			} else {*/
		    	$http.post("/createFinanceObjective", $scope.financeObjective).success(function (resp){
		    		var returnFinObjective = resp;
		    		$scope.financeObjective = {};
		    		$scope.finObjWeightSum += Number(returnFinObjective.finDetailedWeighting);
		    		$scope.financeObjective.finBrdCatWeighting = returnFinObjective.finBrdCatWeighting;
		    		$scope.financeObjective.metrixType = returnFinObjective.metrixType;
		    		$('#successObjAlert1').slideDown();
		    	});
		    //}
	    };

	    // close objective creation : Brian
	    $scope.closeObjCreation = function () {
	    	$scope.financeObjective = null;
	    	$('#financePerspDiv').hide(500);	
			$('#customerPerspDiv').hide(500);
			$('#internalPerspDiv').hide(500);	
			$('#learnPerspDiv').hide(500);
	    	$scope.objPerspDropdownMenu = '--Select a Perspective--';
	    }

	    

		//$scope.retrieveObjectives();
		/*
		//Brian
		$scope.sendObjs = function() {
			$http.post("/submitEmpObjectives", $scope.empObjectives).success(function (res) {
				$('#successObjSubmit').slideDown();
				console.log(res);
			}).error(function (res) {
				console.log(res);
			});
		};*/

		$scope.renderFinancePerspective = function (response) {
			$scope.financePerspective = response;
		};

		$scope.retrieveFinanceObjectives = function() {
			$http.get("/retrieveFinanceObjectives")
			.success(function (res, err) {
				if (err) {console.log(err);}
				console.log(res);
			});
			//.success($scope.renderFinancePerspective);
		};

		$scope.removeFinanceObjective = function (id) {
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
	}]) // end empRoleController
/***********************************************************************************************************************************************
*****************************************************CUSTOMER PERSPECTIVE CONTROLLER*************************************************************
************************************************************************************************************************************************/
    .controller('customerPerspectiveController', function ($scope, $http) {
		
	$scope.poorOptions = [{ label: '-Select metric-', value: 0},
						  { label: '>70% Sys malfunctions', value: 15 },
    				      { label: '>80% Sys malfunctions', value: 15 },
  					      { label: '>90% Sys malfunctions', value: 15 },
  					      { label: '>95% Sys malfunctions', value: 15 },
  					      { label: '>98% Sys malfunctions', value: 15 }
  					     ];

  	$scope.unsatOptions = [{ label: '-Select metric-', value: 0},
				           { label: '>80% Sys malfunctions', value: 15 },
    			           { label: '>82% Sys malfunctions', value: 15 },
  				           { label: '>83% Sys malfunctions', value: 15 }
  				          ];

  	$scope.targetOptions = [{ label: '-Select metric-', value: 0},
						    { label: '>89% Sys malfunctions', value: 15 },
    				        { label: '>89% Sys malfunctions', value: 15 },
  					        { label: '>89% Sys malfunctions', value: 15 }
  					       ];

  	$scope.exceedOptions = [{ label: '-Select metric-', value: 0},
					        { label: '>94% Sys malfunctions', value: 15 },
  					        { label: '>95% Sys malfunctions', value: 15 },
  					        { label: '>96% Sys malfunctions ', value: 15 }
  					       ];

  	$scope.outstandOptions = [{ label: '-Select metric-', value: 0},
						      { label: '>98% Sys malfunctions', value: 15 },
    				          { label: '>99% Sys malfunctions', value: 15 }
  					         ];
  	$scope.perspective = "customer",
  	$scope.status = "unapproved";

		$scope.submitCustomerObjective = function() {

			$scope.createObjectiveErrorMsgs = [],
			$scope.hasCreateObjErrors = false;
			$scope.hasCustKPAError = false;
			$scope.hasCustKPIError = false;
			$scope.custObjError = [];

			var objDescriptionError = "The 'Key Performance Area' field is mandatory!",
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

			if ($scope.customerPerspectiveController.description == null) {

				$scope.hasCustKPAError = true,
				$scope.custObjError.push(objDescriptionError);
			}
			else if ($scope.customerPerspectiveController.DSO == null) {

				$scope.hasCustKPIError = true,
				$scope.custObjError.push(objDSOError);
			}
			else if ($scope.poorOptions.value == 0) {

				$scope.hasCreateObjErrors = true,
				$scope.createObjectiveErrorMsgs.push(poorOptionsSelectError);
			}
			else if ($scope.unsatOptions.value == 0) {

				$scope.hasCreateObjErrors = true,
				$scope.createObjectiveErrorMsgs.push(unsatOptionsSelectError);
			}
			else if ($scope.targetOptions.value == 0) {

				$scope.hasCreateObjErrors = true,
				$scope.createObjectiveErrorMsgs.push(targetOptionsSelectError);
			}
			else if ($scope.exceedOptions.value == 0) {

				$scope.hasCreateObjErrors = true,
				$scope.createObjectiveErrorMsgs.push(exceedOptionsSelectError);
			}
			else if ($scope.outstandOptions.value == 0) {

				$scope.hasCreateObjErrors = true,
				$scope.createObjectiveErrorMsgs.push(outstandOptionsSelectError);
			}
			else if ($scope.customerPerspectiveController.metricOneDef == null) {

				$scope.hasCreateObjErrors = true,
				$scope.createObjectiveErrorMsgs.push(poorOptionsDefError);
			}
			else if ($scope.customerPerspectiveController.metricTwoDef == null) {

				$scope.hasCreateObjErrors = true,
				$scope.createObjectiveErrorMsgs.push(unsatOptionsDefError);
			}
			else if ($scope.customerPerspectiveController.metricThreeDef == null) {

				$scope.hasCreateObjErrors = true,
				$scope.createObjectiveErrorMsgs.push(targetOptionsDefError);
			}
			else if ($scope.customerPerspectiveController.metricFourDef == null) {

				$scope.hasCreateObjErrors = true,
				$scope.createObjectiveErrorMsgs.push(exceedOptionsDefError);
			}
			else if ($scope.customerPerspectiveController.metricFiveDef == null) {

				$scope.hasCreateObjErrors = true,
				$scope.createObjectiveErrorMsgs.push(outstandOptionsDefError);
			}
			else {

				console.log($scope.customerPerspectiveController);
		    	$http.post("/customerPerspectiveController", $scope.customerPerspectiveController)
		    	.success(function(resp){
		    		//console.log(resp);
		    		$('#successObjAlert2').slideDown();
		    	});
		    }
	    };	

		$scope.renderCustomerPerspective = function(response) {
			$scope.customerPerspective = response;
		};

		$scope.retrieve = function() {
			$http.get("/customerPerspective")
			.success($scope.renderCustomerPerspective);
		};

		//hasn't been tested yet! <TODO>
		$scope.removeCustomerObjective = function(id) {
			$http.delete("/customerPerspectiveController" + id)
			.success(function (response) {
				$scope.retrieve();
			});
		};
})

/***********************************************************************************************************************************************
*****************************************************LEARN PERSPECTIVE CONTROLLER***************************************************************
************************************************************************************************************************************************/
   .controller('learnPerspectiveController', function ($scope, $http) {

	$scope.poorOptions = [{ label: '-Select metric-', value: 0},
						  { label: 'Support submitted on 8th', value: 15 },
    				      { label: 'Support submitted on 9th', value: 15 }
  					     ];

  	$scope.unsatOptions = [{ label: '-Select metric-', value: 0},
				           { label: 'Support submitted on 6th', value: 15 },
				           { label: 'Support submitted on 7th', value: 15 }
  				          ];

  	$scope.targetOptions = [{ label: '-Select metric-', value: 0},
						    { label: 'Support submitted on 5th', value: 15 },
						    { label: 'Support submitted on 4th', value: 15 }
  					       ];

  	$scope.exceedOptions = [{ label: '-Select metric-', value: 0},
					        { label: 'Support submitted on 3rd', value: 15 },
						    { label: 'Support submitted on 2nd', value: 15 }
  					       ];

  	$scope.outstandOptions = [{ label: '-Select metric-', value: 0},
						      { label: 'Support submitted on 1st', value: 15 }
  					         ];
  	$scope.perspective = "learn",
  	$scope.status = "unapproved";


		$scope.submitLearnObjective = function() {

			$scope.createObjectiveErrorMsgs = [],
			$scope.hasCreateObjErrors = false;
			$scope.hasLearnKPAError = false;
			$scope.hasLearnKPIError = false;
			$scope.learnObjError = [];

			var objDescriptionError = "The 'Key Performance Area' field is mandatory!",
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

			if ($scope.learnPerspectiveController.description == null) {

				$scope.hasLearnKPAError = true,
				$scope.learnObjError.push(objDescriptionError);
			}
			else if ($scope.learnPerspectiveController.DSO == null) {

				$scope.hasLearnKPIError = true,
				$scope.learnObjError.push(objDSOError);
			}
			else if ($scope.poorOptions.value == 0) {

				$scope.hasCreateObjErrors = true,
				$scope.createObjectiveErrorMsgs.push(poorOptionsSelectError);
			}
			else if ($scope.unsatOptions.value == 0) {

				$scope.hasCreateObjErrors = true,
				$scope.createObjectiveErrorMsgs.push(unsatOptionsSelectError);
			}
			else if ($scope.targetOptions.value == 0) {

				$scope.hasCreateObjErrors = true,
				$scope.createObjectiveErrorMsgs.push(targetOptionsSelectError);
			}
			else if ($scope.exceedOptions.value == 0) {

				$scope.hasCreateObjErrors = true,
				$scope.createObjectiveErrorMsgs.push(exceedOptionsSelectError);
			}
			else if ($scope.outstandOptions.value == 0) {

				$scope.hasCreateObjErrors = true,
				$scope.createObjectiveErrorMsgs.push(outstandOptionsSelectError);
			}
			else if ($scope.learnPerspectiveController.metricOneDef == null) {

				$scope.hasCreateObjErrors = true,
				$scope.createObjectiveErrorMsgs.push(poorOptionsDefError);
			}
			else if ($scope.learnPerspectiveController.metricTwoDef == null) {

				$scope.hasCreateObjErrors = true,
				$scope.createObjectiveErrorMsgs.push(unsatOptionsDefError);
			}
			else if ($scope.learnPerspectiveController.metricThreeDef == null) {

				$scope.hasCreateObjErrors = true,
				$scope.createObjectiveErrorMsgs.push(targetOptionsDefError);
			}
			else if ($scope.learnPerspectiveController.metricFourDef == null) {

				$scope.hasCreateObjErrors = true,
				$scope.createObjectiveErrorMsgs.push(exceedOptionsDefError);
			}
			else if ($scope.learnPerspectiveController.metricFiveDef == null) {

				$scope.hasCreateObjErrors = true,
				$scope.createObjectiveErrorMsgs.push(outstandOptionsDefError);
			}
			else {
				console.log($scope.learnPerspectiveController);
		    	$http.post("/learnPerspectiveController", $scope.learnPerspectiveController)
		    	.success(function(resp){
		    		//console.log(resp);
		    		$('#successObjAlert4').slideDown();

		    	});
		    }
	    };	

		$scope.renderLearnPerspective = function(response) {
			$scope.learnPerspective = response;
		};

		$scope.retrieve = function() {
			$http.get("/learnPerspective")
			.success($scope.renderLearnPerspective);
		};

		//hasn't been tested yet! <TODO>
		$scope.removeLearnObjective = function(id) {
			$http.delete("/learnPerspectiveController" + id)
			.success(function(response) {
				$scope.retrieve();
			});
		};
})

/***********************************************************************************************************************************************
*****************************************************INTERNAL PERSPECTIVE CONTROLLER*************************************************************
************************************************************************************************************************************************/
   .controller('internalPerspectiveController', function ($scope, $http) {
	
	$scope.poorOptions = [{ label: '-Select metric-', value: 0},
						  { label: '60% participation', value: 15 },
    				      { label: '58% participation', value: 15 },
    				      { label: '56% participation', value: 15 }
  					     ];

  	$scope.unsatOptions = [{ label: '-Select metric-', value: 0},
				           { label: '60% participation', value: 15 },
    				       { label: '58% participation', value: 15 },
    				       { label: '56% participation', value: 15 }
  				          ];

  	$scope.targetOptions = [{ label: '-Select metric-', value: 0},
						    { label: '60% participation', value: 15 },
    				        { label: '58% participation', value: 15 },
    				        { label: '56% participation', value: 15 }
  					       ];

  	$scope.exceedOptions = [{ label: '-Select metric-', value: 0},
					        { label: '60% participation', value: 15 },
    				        { label: '58% participation', value: 15 },
    				        { label: '56% participation', value: 15 }
  					       ];

  	$scope.outstandOptions = [{ label: '-Select metric-', value: 0},
						      { label: '60% participation', value: 15 },
    				          { label: '58% participation', value: 15 },
    				          { label: '56% participation', value: 15 }
  					         ];

  	$scope.perspective = "internal",
  	$scope.status = "unapproved";

		$scope.submitInternalObjective = function() {

			$scope.createObjectiveErrorMsgs = [],
			$scope.intObjError = [],
			$scope.hasIntKPAError = false,
			$scope.hasIntKPIError = false,
			$scope.hasCreateObjErrors = false;

			var objDescriptionError = "The 'Key Performance Area' field is mandatory!",
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

			if ($scope.internalPerspectiveController.description == null) {

				$scope.hasIntKPAError = true,
				$scope.intObjError.push(objDescriptionError);
			}
			else if ($scope.internalPerspectiveController.DSO == null) {

				$scope.hasIntKPIError = true,
				$scope.intObjError.push(objDSOError);
			}
			else if ($scope.poorOptions.value == 0) {

				$scope.hasCreateObjErrors = true,
				$scope.createObjectiveErrorMsgs.push(poorOptionsSelectError);
			}
			else if ($scope.unsatOptions.value == 0) {

				$scope.hasCreateObjErrors = true,
				$scope.createObjectiveErrorMsgs.push(unsatOptionsSelectError);
			}
			else if ($scope.targetOptions.value == 0) {

				$scope.hasCreateObjErrors = true,
				$scope.createObjectiveErrorMsgs.push(targetOptionsSelectError);
			}
			else if ($scope.exceedOptions.value == 0) {

				$scope.hasCreateObjErrors = true,
				$scope.createObjectiveErrorMsgs.push(exceedOptionsSelectError);
			}
			else if ($scope.outstandOptions.value == 0) {

				$scope.hasCreateObjErrors = true,
				$scope.createObjectiveErrorMsgs.push(outstandOptionsSelectError);
			}
			else if ($scope.internalPerspectiveController.metricOneDef == null) {

				$scope.hasCreateObjErrors = true,
				$scope.createObjectiveErrorMsgs.push(poorOptionsDefError);
			}
			else if ($scope.internalPerspectiveController.metricTwoDef == null) {

				$scope.hasCreateObjErrors = true,
				$scope.createObjectiveErrorMsgs.push(unsatOptionsDefError);
			}
			else if ($scope.internalPerspectiveController.metricThreeDef == null) {

				$scope.hasCreateObjErrors = true,
				$scope.createObjectiveErrorMsgs.push(targetOptionsDefError);
			}
			else if ($scope.internalPerspectiveController.metricFourDef == null) {

				$scope.hasCreateObjErrors = true,
				$scope.createObjectiveErrorMsgs.push(exceedOptionsDefError);
			}
			else if ($scope.internalPerspectiveController.metricFiveDef == null) {

				$scope.hasCreateObjErrors = true,
				$scope.createObjectiveErrorMsgs.push(outstandOptionsDefError);
			}
			else {
				console.log($scope.internalPerspectiveController);
		    	$http.post("/internalPerspectiveController", $scope.internalPerspectiveController)
		    	.success(function (resp){
		    		//console.log(resp);
		    		$('#successObjAlert3').slideDown();
		    	});
		    }
	    };	

		$scope.renderInternalPerspective = function(response) {
			$scope.internalPerspective = response;
		};

		$scope.retrieve = function() {
			$http.get("/internalPerspective")
			.success($scope.renderInternalPerspective);
		};

		//hasn't been tested yet! <TODO>
		$scope.removeInternalObjective = function(id) {
			$http.delete("/internalPerspectiveController" + id)
			.success(function (response) {
				$scope.retrieve();
			});
		};
})

/***********************************************************************************************************************************************
*****************************************************SUBMIT OBJECTIVE CONTROLLER*************************************************************
************************************************************************************************************************************************/
   .controller('submitObjController', ['allObjectives', '$scope','$rootScope', '$http', function (allObjectives,$scope, $rootScope, $http) {
   	$scope.index = 0;
	$scope.objIDArray = [];
	$scope.pendingObj = [];
	$scope.hasSendObjErrors = false;
	$scope.capChecked = true;
	$scope.sendObjErrorMsg = "Cannot send empty objectives - make sure you select from above!"
/*
	$scope.retrieveObjectives = function () {
			allObjectives.getObjectives()
			.success(function (res) {
			$scope.subFinObj = [];
			$scope.subCustObj = [];
			$scope.subIntObj = [];
			$scope.subLearnObj = [];

			for (var i = 0; i<res.length; i++) {
				if (res[i].perspective == "finance") {
					$scope.subFinObj.push(res[i]);
				}
				else if (res[i].perspective == "customer") {
					$scope.subCustObj.push(res[i]);
				}
				else if (res[i].perspective == "internal") {
					$scope.subIntObj.push(res[i]);
				}
				else if (res[i].perspective == "learn") {
					$scope.subLearnObj.push(res[i]);
				}
			}
			})
			.error(function () {
				console.log('There is an error');
			});		
	}*/

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
	
	//var IDs = $scope.objIDArray;

}])

/***********************************************************************************************************************************************
********************************************************COMPILE OBJECTIVE CONTROLLER*************************************************************
************************************************************************************************************************************************/
   .controller('compileController', ['allObjectives','approvedObjectives','unApprovedObjectives' ,'$scope','$rootScope', '$http', function (approvedObjectives,allObjectives,unApprovedObjectives,$scope, $rootScope, $http) {
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
			$scope.appFinObj = [];
			$scope.appCustObj = [];
			$scope.appIntObj = [];
			$scope.appLearnObj = [];

			if (res.length > 0) {
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
			}
			else if (res.length <= 0){
				$scope.showSCardErr = true;
			}

			
		})
		.error(function () {
			console.log('There is an error with compile socrecard! (BUG FOUND)');
		});		
	};	

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
			$scope.appFinObj = [];
			$scope.appCustObj = [];
			$scope.appIntObj = [];
			$scope.appLearnObj = [];
			console.log("Ran getAllKPAs finction");
			console.log(res.length);
			if(res.length > 0){
				res.forEach(function (kpi) {
		        	if (kpi.perspective == "finance") {
		          		$scope.appFinObj.push(kpi);	        		
		        	} 
		        	else if (kpi.perspective == "customer") {
						$scope.appCustObj.push(kpi);
					}
					else if (kpi.perspective == "internal") {
						$scope.appIntObj.push(kpi);
					}
					else if (kpi.perspective == "learn") {
						$scope.appLearnObj.push(kpi);
					}
	      		})
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
				for (var i = 0; i<res.length; i++) {
					$scope.unactionedKPAs.push(res[i]);
				};
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
	$scope.getObjectivez();	
	//By Mlandvo
	$scope.submitKPAs = function(Obj) {
		console.log("Function called");
		//$scope.send = true;
		var toBeSent = [];
		var toBeDeleted = [];
		var id = Obj._id;
		console.log(Obj);
		console.log(typeof(id));
		if (Obj.send == "true") {
			$http.post("/objectivesSubmitted_status_changed/" + id)
				.success(function (res) {
					//$('#successObjSubmit').slideDown();
					console.log(res);
					console.log("KPA uphanded");
			})
			.error(function (res) {
				console.log(res);
				});
		}else if(Obj.send == "false"){
			$scope.popDelete = true;
			
			$http.post("/deleteKPA/" + id)
				.success(function (response) {
				console.log(response);
			});
		}	
	}//end of function

	$scope.confirmBox = function () {
		$scope.pressed = true;
	};
}])	
 
/***********************************************************************************************************************************************
*****************************************************EMPLOYEE PANEL CONTROLLER******************************************************************
************************************************************************************************************************************************/

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

/***********************************************************************************************************************************************
*****************************************************SUPERVISORVISOR PANEL CONTROLLER*************************************************************
************************************************************************************************************************************************/
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
   		$scope.editFinanceObjective = function(iden) {
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

   		$scope.rejectFinanceObjective = function() {
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

		$scope.approveFinanceObjective = function (id, PFNum, finDescription, finDSO, finOneDef, finTwoDef, finThreeDef, finFourDef, finFiveDef) {
			$scope.approveFinObj = {PF: PFNum, description: finDescription, DSO: finDSO, oneDef: finOneDef, twoDef: finTwoDef, threeDef: finThreeDef, fourDef: finFourDef, fiveDef: finFiveDef, perspective: "finance"}
			$http.post('/approveFinanceObjective/' + id, $scope.approveFinObj)
			.success(function () {
				$('#successObjAlert12').show(500);
			})
			.error(function (err) {
				console.log("Objective empty!!");
			})
		}

		/*$scope.rejectFinanceObjective = function (id) {
			$http.post('/rejectFinanceObjective/' + id)
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
				console.log("Response is:::")
				console.log(res);

				//for( var i = 0; i< res.length)

				console.log("Pending objectives are as follows:")
				$scope.empObjArray = res;
				console.log($scope.empObjArray);
				console.log("PF is:::");
				console.log(empPF);
				for (var i = 0; i < $scope.empObjArray.length; i++){
					//console.log($scope.empObjArray[i].PFNum);
					if (empPF == $scope.empObjArray[i].PFNum) {

						if ($scope.empObjArray[i].perspective = "finance"){
							$scope.specificEmpFinObjs = $scope.empObjArray[i];
							console.log("So now Fin :");
							//console.log($scope.specificEmpFinObjs.empObjArray[i]);
						}
						else if ($scope.empObjArray[i].perspective = "customer"){
							$scope.specificEmpCustObjs = $scope.empObjArray[i];
							console.log("So now Cust :");
							console.log($scope.specificEmpCustObjs.description);
						}
						else if ($scope.empObjArray[i].perspective = "internal"){
							$scope.specificEmpIntObjs = $scope.empObjArray[i];
							console.log("So now Int:");
							console.log($scope.specificEmpIntObjs.description);
						}
						else if ($scope.empObjArray[i].perspective = "learning"){
							$scope.specificEmpLearnObjs = $scope.empObjArray[i];
							console.log("So now Learn:");
							console.log($scope.specificEmpLearnObjs.description);
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


   }]);