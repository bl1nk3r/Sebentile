 //using $scope to bind data models from the UI to the angular script (interchangeably)
angular.module('BSCIMS')
	
	//this service retrieves and globally stores all objectives (with a default status of "unapproved") to be used by any controller
	.service('allObjectives', ['$http', function ($http){
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
				$rootScope.PF = resp.PFNum;
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

			}).error(function (resp) {
			});
		}

		$scope.getLoggedUser();

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
	}]) // end manageEMployees controller

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
 	}]) // end hrRolesController

 	.controller('adminController',['$scope','$http','manageEmployeeData', function($scope, $http, manageEmployeeData){
 	}]) // end adminController

	// Brian
   .controller('empRoleController', ['allObjectives','$http','$scope', function (allObjectives, $http, $scope) {
   		$scope.financeObjective = {};
   		$scope.gotFinBCW = false;
   		$scope.BCWStat = "Lock";
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
				$scope.clearFinObjectivesErrors();https://github.com/bl1nk3r/Sebentile/archive/master.zip
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

	    // retrieve Objectives : Brian
	    $scope.retrieveObjectives = function () {
			allObjectives.getObjectives().success(function (res) {
				$scope.subFinObj = [];
				$scope.subCustObj = [];
				$scope.subIntObj = [];
				$scope.subLearnObj = [];
				$scope.empObjectives = res;
				
				for (var i = 0; i<res.length; i++) {
					if (res[i].pespective == "finance") {
						$scope.subFinObj.push(res[i]);
					} else if (res[i].pespective == "customer") {
						$scope.subCustObj.push(res[i]);
					} else if (res[i].pespective == "internal") {
						$scope.subIntObj.push(res[i]);
					} else if (res[i].pespective == "learn") {
						$scope.subLearnObj.push(res[i]);
					};
				};				
			})
			.error(function () {
				console.log('There is an error');
			});		
		}

		$scope.retrieveObjectives();

		//Brian
		$scope.sendObjs = function() {
			$http.post("/submitEmpObjectives", $scope.empObjectives).success(function (res) {
				$('#successObjSubmit').slideDown();
				console.log(res);
			}).error(function (res) {
				console.log(res);
			});
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
	}

	//Checkbox invokes 'captureObj' function that pushes content into 'pendingObj' array [needs to toggle]
	$scope.captureFinObj = function(objID, description, DSO) {
		$scope.capChecked = !$scope.capChecked;	
		console.log($scope.capChecked);	
		/*$scope.objIDArray.push(objID);
		$scope.pointer = {objID, description, DSO};
		$scope.pendingObj.push({pendingID: $scope.pointer.objID, pendingDescription: $scope.pointer.description, pendingDSO: $scope.pointer.DSO});
	
		if ( $scope.capChecked == false) {
			//var index = $scope.pendingObj.indexOf($scope.pointer);

			for (var index = 0; index < $scope.pendingObj.length; index++){
				if ($scope.pointer.objID == $scope.pendingObj[index].pendingID) {
					console.log("The index is Below")
					console.log(index);
				}
				else {
					console.log("Error caught!");
				}
				$scope.index = index;
			}

			$scope.pendingObj.splice(index, 1);
			console.log("After unchecking we get the index: ")
			console.log(index);
		}
		else {
			var index = $scope.pendingObj.indexOf($scope.pointer);
			console.log("capChecked is true");
			console.log(index);
		}*/

		/*var array = ["one", "two", "three", "four"];
			console.log(array);
			array.splice(2, 2, "this", "was", "spliced");
			console.log("The spliced array is :")
			console.log(array);

		for (var index = 0; index < $scope.objIDArray.length; index++){
			if ($scope.pointer.objID == $scope.pendingObj[index].pendingID) {
				console.log("The index is Below")
				console.log(index);
			}
			else {
				console.log("Error caught!");
			}
		}
			*/

		/*console.log("Pending Objectives before splice:")
		console.log($scope.pendingObj.pendingID);*/
	}
	$scope.captureCustObj = function(objID, description, DSO) {
		$scope.capChecked = !$scope.capChecked;	
		console.log($scope.capChecked);	
		/*$scope.objIDArray.push(objID);
		$scope.pointer = {objID, description, DSO};
		$scope.pendingObj.push({pendingID: $scope.pointer.objID, pendingDescription: $scope.pointer.description, pendingDSO: $scope.pointer.DSO});
	
		if ( $scope.capChecked == false) {
			//var index = $scope.pendingObj.indexOf($scope.pointer);

			for (var index = 0; index < $scope.pendingObj.length; index++){
				if ($scope.pointer.objID == $scope.pendingObj[index].pendingID) {
					console.log("The index is Below")
					console.log(index);
				}
				else {
					console.log("Error caught!");
				}
				$scope.index = index;
			}

			$scope.pendingObj.splice(index, 1);
			console.log("After unchecking we get the index: ")
			console.log(index);
		}
		else {
			var index = $scope.pendingObj.indexOf($scope.pointer);
			console.log("capChecked is true");
			console.log(index);
		}*/

		/*var array = ["one", "two", "three", "four"];
			console.log(array);
			array.splice(2, 2, "this", "was", "spliced");
			console.log("The spliced array is :")
			console.log(array);

		for (var index = 0; index < $scope.objIDArray.length; index++){
			if ($scope.pointer.objID == $scope.pendingObj[index].pendingID) {
				console.log("The index is Below")
				console.log(index);
			}
			else {
				console.log("Error caught!");
			}
		}
			*/

		/*console.log("Pending Objectives before splice:")
		console.log($scope.pendingObj.pendingID);*/
	}
	$scope.captureIntObj = function(objID, description, DSO) {
		$scope.capChecked = !$scope.capChecked;	
		console.log($scope.capChecked);	
		/*$scope.objIDArray.push(objID);
		$scope.pointer = {objID, description, DSO};
		$scope.pendingObj.push({pendingID: $scope.pointer.objID, pendingDescription: $scope.pointer.description, pendingDSO: $scope.pointer.DSO});
	
		if ( $scope.capChecked == false) {
			//var index = $scope.pendingObj.indexOf($scope.pointer);

			for (var index = 0; index < $scope.pendingObj.length; index++){
				if ($scope.pointer.objID == $scope.pendingObj[index].pendingID) {
					console.log("The index is Below")
					console.log(index);
				}
				else {
					console.log("Error caught!");
				}
				$scope.index = index;
			}

			$scope.pendingObj.splice(index, 1);
			console.log("After unchecking we get the index: ")
			console.log(index);
		}
		else {
			var index = $scope.pendingObj.indexOf($scope.pointer);
			console.log("capChecked is true");
			console.log(index);
		}*/

		/*var array = ["one", "two", "three", "four"];
			console.log(array);
			array.splice(2, 2, "this", "was", "spliced");
			console.log("The spliced array is :")
			console.log(array);

		for (var index = 0; index < $scope.objIDArray.length; index++){
			if ($scope.pointer.objID == $scope.pendingObj[index].pendingID) {
				console.log("The index is Below")
				console.log(index);
			}
			else {
				console.log("Error caught!");
			}
		}
			*/

		/*console.log("Pending Objectives before splice:")
		console.log($scope.pendingObj.pendingID);*/
	}
	$scope.captureLearnObj = function(objID, description, DSO) {
		$scope.capChecked = !$scope.capChecked;	
		console.log($scope.capChecked);	
		/*$scope.objIDArray.push(objID);
		$scope.pointer = {objID, description, DSO};
		$scope.pendingObj.push({pendingID: $scope.pointer.objID, pendingDescription: $scope.pointer.description, pendingDSO: $scope.pointer.DSO});
	
		if ( $scope.capChecked == false) {
			//var index = $scope.pendingObj.indexOf($scope.pointer);

			for (var index = 0; index < $scope.pendingObj.length; index++){
				if ($scope.pointer.objID == $scope.pendingObj[index].pendingID) {
					console.log("The index is Below")
					console.log(index);
				}
				else {
					console.log("Error caught!");
				}
				$scope.index = index;
			}

			$scope.pendingObj.splice(index, 1);
			console.log("After unchecking we get the index: ")
			console.log(index);
		}
		else {
			var index = $scope.pendingObj.indexOf($scope.pointer);
			console.log("capChecked is true");
			console.log(index);
		}*/

		/*var array = ["one", "two", "three", "four"];
			console.log(array);
			array.splice(2, 2, "this", "was", "spliced");
			console.log("The spliced array is :")
			console.log(array);

		for (var index = 0; index < $scope.objIDArray.length; index++){
			if ($scope.pointer.objID == $scope.pendingObj[index].pendingID) {
				console.log("The index is Below")
				console.log(index);
			}
			else {
				console.log("Error caught!");
			}
		}
			*/

		/*console.log("Pending Objectives before splice:")
		console.log($scope.pendingObj.pendingID);*/
	}
	
	var IDs = $scope.objIDArray;
}])

/***********************************************************************************************************************************************
********************************************************COMPILE OBJECTIVE CONTROLLER*************************************************************
************************************************************************************************************************************************/
   .controller('compileController', ['approvedObjectives', 'unApprovedObjectives' ,'$scope','$rootScope', '$http', function (approvedObjectives, unApprovedObjectives,$scope, $rootScope, $http) {

	$scope.appFinIDArray = [];
	$scope.appCustIDArray = [];
	$scope.appIntIDArray = [];
	$scope.appLearnIDArray = [];
	
	$scope.appFinObjective = [];
	$scope.appCustObjective = [];
	$scope.appIntObjective = [];
	$scope.appLearnObjective = [];

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
		approvedObjectives.getApproved()
		.success(function (res) {
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
			console.log('There is an error with compile socrecard! (BUG FOUND)');
		});		
	}

	/*$scope.captureFinApp = function(objID, finDes, finDSO, finOneDef, finTwoDef, finThreeDef, finFourDef, finFiveDef) {
		//console.log(obj);
		$scope.appFinIDArray.push(objID);
		$scope.appFinObjective.push({id: objID, finDes: finDes, finDSO: finDSO, finOneDef: finOneDef, finTwoDef: finTwoDef, finThreeDef: finThreeDef, finFourDef: finFourDef, finFiveDef: finFiveDef, perspective: "Financial"});
	
		//console.log("Content of finance array");
		//console.log($scope.appFinObjective);

		console.log($scope.appFinIDArray.length);

		for (var index = 0; index < $scope.appFinIDArray.length; index++){
			//console.log($scope.appFinIDArray[index]);
		}
		//console.log("Fin Spans")
		//console.log($scope.appFinIDArray.length);
		$scope.finRowSpan = $scope.appFinIDArray.length;

	}

	$scope.captureCustApp = function(objID, custDes, custDSO, custOneDef, custTwoDef, custThreeDef, custFourDef, custFiveDef) {
		//console.log(obj);
		$scope.appCustIDArray.push(objID);
		$scope.appCustObjective.push({id: objID, custDes: custDes, custDSO: custDSO, custOneDef: custOneDef, custTwoDef: custTwoDef, custThreeDef: custThreeDef, custFourDef: custFourDef, custFiveDef: custFiveDef, perspective: "Customer"});
	
		//console.log("Content of customer array");
		//console.log($scope.appCustObjective);
		

		for (var index = 0; index < $scope.appCustIDArray.length; index++){
			//console.log($scope.appCustIDArray[index]);
		}
		//console.log("Cust Spans")
		//console.log($scope.appCustObj.length);
		$scope.custRowSpan = $scope.appCustIDArray.length;

	}

	$scope.captureIntApp = function(objID, intDes, intDSO, intOneDef, intTwoDef, intThreeDef, intFourDef, intFiveDef) {
		//console.log(obj);
		$scope.appIntIDArray.push(objID);
		$scope.appIntObjective.push({id: objID, intDes: intDes, intDSO: intDSO, intOneDef: intOneDef, intTwoDef: intTwoDef, intThreeDef: intThreeDef, intFourDef: intFourDef, intFiveDef: intFiveDef, perspective: "Internal Process"});
	
		//console.log("Content of internal array");
		//console.log($scope.appIntObjective);
		

		for (var index = 0; index < $scope.appIntIDArray.length; index++){
			//console.log($scope.appIntIDArray[index]);
		}
		//console.log("Int Spans")
		//console.log($scope.appIntObj.length);
		$scope.intRowSpan = $scope.appIntIDArray.length;

	}

	$scope.captureLearnApp = function(objID, learnDes, learnDSO, learnOneDef, learnTwoDef, learnThreeDef, learnFourDef, learnFiveDef) {
		//console.log(obj);
		$scope.appLearnIDArray.push(objID);
		$scope.appLearnObjective.push({id: objID, learnDes: learnDes, learnDSO: learnDSO, learnOneDef: learnOneDef, learnTwoDef: learnTwoDef, learnThreeDef: learnThreeDef, learnFourDef: learnFourDef, learnFiveDef: learnFiveDef, perspective: "Learning & Growth"});
	
		//console.log("Content of learn array");
		//console.log($scope.appLearnObjective);
		

		for (var index = 0; index < $scope.appLearnIDArray.length; index++){
			//console.log($scope.appLearnIDArray[index]);
		}

		//console.log("Learn Spans")
		//console.log($scope.appLearnObj.length);
		$scope.learnRowSpan = $scope.appLearnIDArray.length;

	}*/

	$scope.scorecardCreate = function() {

		/*for (var index = 0; index < $scope.appFinIDArray.length; index++){
			console.log($scope.appFinObjective);
			$http.post("/createScoreCardRoute:/" + $scope.appFinIDArray[index] , $scope.compileController)
			.success(function (response) {
				$scope.finRowSpan = $scope.appFinIDArray.length;
				//console.log($scope.finRowSpan);
				$scope.finObjs = response;
				//console.log($scope.finObjs);
			})
			.error(function (response) {
				console.log("Error");
			})
		}*/

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

		/*for (var index = 0; index < $scope.appCustIDArray.length; index++){
			console.log($scope.appCustObjective);
			$http.post("/createScoreCardRoute:/" + $scope.appCustIDArray[index] , $scope.compileController)
			.success(function (response) {
				$scope.custRowSpan = $scope.appCustIDArray.length;
				//console.log(response);
				console.log($scope.custRowSpan);
				$scope.custObjs = response;
			})
			.error(function (response) {
				console.log("Error");
			})
		}*/

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

		/*for (var index = 0; index < $scope.appIntIDArray.length; index++){
			console.log($scope.appIntObjective);
			$http.post("/createScoreCardRoute:/" + $scope.appIntIDArray[index] , $scope.compileController)
			.success(function (response) {
				$scope.intRowSpan = $scope.appIntIDArray.length;
				//console.log(response);
				console.log($scope.intRowSpan);
				$scope.intObjs = response;
			})
			.error(function (response) {
				console.log("Error");
			})
		}*/

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

		/*for (var index = 0; index < $scope.appLearnIDArray.length; index++){
			console.log($scope.appLearnObjective);
			$http.post("/createScoreCardRoute:/" + $scope.appLearnIDArray[index] , $scope.compileController)
			.success(function (response) {
				$scope.learnRowSpan = $scope.appLearnIDArray.length;
				//console.log(response);
				console.log($scope.learnRowSpan);
				$scope.learnObjs = response;
			})
			.error(function (response) {
				console.log("Error");
			})
		}*/
		
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

		/*if ($scope.finRowSpan == 0) {
			$scope.hasFinSCErrors = true;
		}
		else if ($scope.finRowSpan > 0) {
			$scope.hasFinSCErrors = false;
		}

		if ($scope.custRowSpan == 0) {
			$scope.hasCustSCErrors = true;
		}
		else if ($scope.custRowSpan > 0) {
			$scope.hasCustSCErrors = false;
		}

		if ($scope.intRowSpan == 0) {
			$scope.hasIntSCErrors = true;
		}
		else if ($scope.intRowSpan > 0) {
			$scope.hasIntSCErrors = false;
		}

		if ($scope.learnRowSpan == 0) {
			$scope.hasLearnSCErrors = true;
		}
		else if ($scope.learnRowSpan > 0) {
			$scope.hasLearnSCErrors = false;
		}*/

		//Creates the Scorecard if (and only if) there are (approved) objectives to fill into the table
		if ($scope.finRowSpan > 0 && $scope.custRowSpan > 0 && $scope.intRowSpan > 0 && $scope.learnRowSpan > 0) {
			$scope.scorecardReady = true;
		}
	}

	$scope.initScorecard = function() {
		approvedObjectives.getApproved()
		.success(function (res) {

			console.log("initScorecard gives:")
			//for(var i = 0; i<res.length; i++) {
				//console.log(res[i]._id);
				$http.post("/initScorecardRoute:/", res)
				.success(function (res) {
					console.log("initScorecard posted successfully!")
					//console.log(res[i]._id);
				})
				.error(function (res) {
					console.log(res);
				});
			//}
		})
		.error (function () {
			console.log("initScorecard is throwing errors!!!");
		});
	}  

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

	$scope.captureComment = function (Obj) {
		var singleObj = $scope.singleObj;
		singleObj[1] = Obj.comment;
		$scope.selfEvalObjs[Obj._id] = singleObj;
		console.log($scope.selfEvalObjs);
	}

	$scope.selfEvaluate = function () {
		console.log($scope.appFinObj.length);
		for (var i = 0; i < $scope.appFinObj.length; i++) {
			if (Number($scope.appFinObj[i].rating) == 0) {
				$scope.hasFinSCErrors = true;
				$scope.finSCErrorMsg = "Enter all Finance ratings";
				return;
			}
		}
		/*$scope.hasSelfEvalErrors = true;
		$scope.selfEvalrrorMsg = "Fill all ratings";
   		var objectives = $scope.selfEvalObjs;
   		console.log(objectives);
   		$http.post("/empSelfEvaluate", objectives).success(function (res, err) {
			if (err) {
				console.log(err);
			} else {
				console.log(res);
			}
		});*/
   	}	

	$scope.getAllKPAs = function() {
		approvedObjectives.getApproved().success(function(res){
			$scope.appFinObj = [];
			$scope.appCustObj = [];
			$scope.appIntObj = [];
			$scope.appLearnObj = [];
			$scope.kpi = [];

			res.forEach(function(kpi){
	       		$scope.kpi.push(kpi);
	        	if (kpi.perspective == "finance") {
	          		$scope.appFinObj.push(kpi);
	        	} else if (kpi.perspective == "customer") {
					$scope.appCustObj.push(kpi);
				}
				else if (kpi.perspective == "internal") {
					$scope.appIntObj.push(kpi);
				}
				else if (kpi.perspective == "learn") {
					$scope.appLearnObj.push(kpi);
				}
	      	});
	      	console.log($scope.appFinObj);
			/*
			for (var i = 0; i<res.length; i++) {
				$scope.kpi.push(res[i]);
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
			}*/
		});
	};	
	$scope.addSelfEvaluation = function(id){
		console.log($scope.kpi.DSO);
		/*
		$http.put('/completeSelfEval/'+ $scope.kpi._id, $scope.kpiAttachment, $scope.kpiComment, $scope.kpiRating).success(function (response){
			console.log(response);
			
		});*/

	};
	/*
	//remove function 
	$scope.remove = function (id){
		console.log(id);
		$http.delete('/contactList/' + id).success(function(response) {
			refresh();
		});
	};//end of remove
	 
	$scope.edit = function(id) {
		console.log(id);
		$http.get('/contactList/' + id).success(function(response) {
			$scope.contact = response;
		});

	};

	$scope.update = function(id) {
		console.log($scope.contact._id);
		$http.put('/contactList/' + $scope.contact._id, $scope.contact).success(function(response){
			refresh();
		})
	};
*/
	

//}//end of self evaluation controller



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

		/* SELF EVAlUATION CONTROLLER*/


   }]);
