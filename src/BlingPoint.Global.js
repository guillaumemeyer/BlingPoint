//****************************
// BlingPoint Global
//****************************

( function() {

	//****************************
	// Global BlingPoint handlers
	//****************************
	
	
	var BLINGPOINT_ROOT_NAMESPACE = 'blingpoint';
	var BLINGPOINT_GLOBAL_NAMESPACE = 'global';
	
	// Init namespaces
	window[ BLINGPOINT_GLOBAL_NAMESPACE ] = {};
	
	//----------------------
	// Global error handling
	//----------------------
	
	function HandleUnhandledError(desc,page,line,chr) {
		
		try {
			blingpoint.log.error("An unexpected error has occured");
			blingpoint.log.error("Description: " + desc);
			blingpoint.log.error("Page: " + page);
			blingpoint.log.error("Line: " + line);
			blingpoint.log.error("Chr: " + chr);
		}
		catch(err)
		{
			console.log("An unexpected error has occured");
			console.log("Description: " + err.description);
		}
		return true;
	
	}
		
	function HandleManagedError(customMessage, sender, args) {
		
		blingpoint.log.warn("A managed error has occured");
		blingpoint.log.warn("Message: " + customMessage);
		blingpoint.log.warn("Technical message: " + args.get_message());
		blingpoint.log.warn("Stack trace: " + args.get_stackTrace());
	
		return true;
		
	}
	

	/*
	URL & Querystring Management
	*/
	function GetUrlParameters() {
	
		var vars = [], hash;
		var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
		for(var i = 0; i < hashes.length; i++)
		{
			hash = hashes[i].split('=');
			vars.push(hash[0]);
			vars[hash[0]] = hash[1];
		}
		return vars;
		/*-------------------------------------------------------------
		// Sample usage
		blingpoint.global.getUrlParameters()
		=> ["itemId", "testp"]
		blingpoint.global.getUrlParameters()['testp']
		=> "4567"
		-------------------------------------------------------------*/
	}
	
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
	
	window[ BLINGPOINT_ROOT_NAMESPACE ].global = window[ BLINGPOINT_GLOBAL_NAMESPACE ];

	window.onerror = blingpoint.global.handleUnhandledError;

})();
