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
	}]);