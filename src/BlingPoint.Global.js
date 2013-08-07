/**
 * BlingPoint Global Module
 * @module Global
 */
( function() {

	var BLINGPOINT_ROOT_NAMESPACE = 'blingpoint';
	var BLINGPOINT_GLOBAL_NAMESPACE = 'global';
	
	// Init namespaces
	window[ BLINGPOINT_GLOBAL_NAMESPACE ] = {};
	
	/**
	Catch unhandled errors
	@method handleUnhandledError
	@param {string} desc Descrpition
	@param {string} page Page
	@param {string} line Line
	@param {string} chr Character
	**/
	function HandleUnhandledError(error, url, line) {
		try {
			blingpoint.log.error("An unexpected error has occured");
			blingpoint.log.error("Description: " + error);
			blingpoint.log.error("Url: " + url);
			blingpoint.log.error("Line: " + line);
		}
		catch(err)
		{
			console.log("An unexpected error has occured");
			console.log("Description: " + err.description);
		}
	}
		
	/**
	Catch handled errors
	@method handleUnhandledError
	@param {string} customMessage Error message
	@param {string} sender Sender
	@param {string} args Arguments
	**/
	function HandleManagedError(customMessage, e) {
		blingpoint.log.warn("A managed error has occured");
		blingpoint.log.warn("Message: " + customMessage);
		blingpoint.log.warn("Name: " + e.name);
		blingpoint.log.warn("Technical message: " + e.message);
		blingpoint.log.warn("Number: " + e.number);
	}
	

	function ExecuteCallback(callbackFunction) {
		try {
			if (typeof callbackFunction !== undefined && callbackFunction !== null) {
				callbackFunction();
			}
		}
		catch(e)
		{
			HandleManagedError('An error has occurred during calling a callback method', e);
		}
	}


	/**
	Retrieves parameters and values from current URL
	@method getUrlParameters
	@return {string} vars A table of key / Value pairs
	@example blingpoint.global.getUrlParameters() => ["PARAMETERNAME", "PARAMETERVALUE"]
	@example blingpoint.global.getUrlParameters()['PARAMETERNAME'] => "PARAMETERVALUE"
	**/
	function GetUrlParameters() {
	
		var vars = [], hash;
		var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
		for(var i = 0; i < hashes.length; i++)
		{
			hash = hashes[i].split('=');
			vars.push(hash[0]);
			vars[hash[0]] = decodeURIComponent(hash[1]);
		}
		return vars;
	}
	
	/**
	Checks if the current URL matchs a specific regular expression (Case insensitive)
	@method checkUrl
	@param {string} regExp A valid JS regular expression
	@return {boolean} Returns the regex result against current URL
	@example blingpoint.global.checkUrl('/lists/mylist/')
	**/
	function CheckUrl(regExp) {
	
		// Alternative regex creation
		//Expression = /motif/drapeau
		
		var oRegExp = new RegExp(regExp,'gi');
		if(oRegExp.test(window.location.href))
		{ 
			return true;
		}  
		else
		{
			return false;
		}
	}

	/**
	Checks if a string matchs a specific regular expression (Case insensitive)
	@method check
	@param {string} inputString String to be tested
	@param {string} regExp A valid JS regular expression
	@return {boolean} Returns the regex result against current URL
	@example blingpoint.global.check('abcde','bcd') => True
	**/
	function Check(inputString, regExp) {

		var oRegExp = new RegExp(regExp,'gi');
		if(oRegExp.test(inputString))
		{ 
			return true;
		}  
		else
		{
			return false;
		}

	}

	/**
	Checks if a string is a number
	@method isNumber
	@param {string} n String to be tested
	@return {boolean} Returns true if n is a number
	@example blingpoint.global.isNumber(3) => True
	**/
	function IsNumber(n) {
		return !isNaN(parseFloat(n)) && isFinite(n);
	}
	
	// Public functions mapping
	window[ BLINGPOINT_GLOBAL_NAMESPACE ].getUrlParameters = GetUrlParameters;
	window[ BLINGPOINT_GLOBAL_NAMESPACE ].checkUrl = CheckUrl;
	window[ BLINGPOINT_GLOBAL_NAMESPACE ].check = Check;
	window[ BLINGPOINT_GLOBAL_NAMESPACE ].isNumber = IsNumber;
	window[ BLINGPOINT_GLOBAL_NAMESPACE ].handleUnhandledError = HandleUnhandledError;
	window[ BLINGPOINT_GLOBAL_NAMESPACE ].handleManagedError = HandleManagedError;
	window[ BLINGPOINT_GLOBAL_NAMESPACE ].executeCallback = ExecuteCallback;
	
	window[ BLINGPOINT_ROOT_NAMESPACE ].global = window[ BLINGPOINT_GLOBAL_NAMESPACE ];

	window.onerror = blingpoint.global.handleUnhandledError;

})();
