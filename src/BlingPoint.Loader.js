/**
 * BlingPoint Loader Module
 * @module Loader
 */

var BlingPointDevMode;

( function() {
	
	var BLINGPOINT_ALIAS_1 = '$p';
	var BLINGPOINT_ALIAS_2 = '$P';

	var BLINGPOINT_ROOT_NAMESPACE = 'blingpoint';
	var BLINGPOINT_LOADER_NAMESPACE = 'loader';
	
	// Initialize namespaces
	window[ BLINGPOINT_ROOT_NAMESPACE ] = {};
	window[ BLINGPOINT_LOADER_NAMESPACE ] = {};
	
	/**
	Returns BlingPoint loading URL
	@method getScriptUrl
	@return {string} BlingPoint loading URL
	**/
	function GetScriptUrl(){
		var scripts = document.getElementsByTagName('script');
		for (i=0;i<scripts.length;i++){
			var blingPointDevPosition = scripts[i].src.toLowerCase().indexOf('blingpoint.js');
			if (blingPointDevPosition > -1) {
				BlingPointDevMode=true;
				return scripts[i].src.substring(0,blingPointDevPosition);
			}
			var blingPointMinPosition = scripts[i].src.toLowerCase().indexOf('blingpoint.min.js');
			if (blingPointMinPosition > -1) {
				BlingPointDevMode=false;
				return scripts[i].src.substring(0,blingPointMinPosition);
			}
		}
	}

	var CDN_PATH = GetScriptUrl();
	
	/**
	Loads a CSS file
	@method addCssToPage
	@param {string} cssUrl URL of the CSS file to load
	@return {boolean} True if CSS file is loaded successfully
	**/
	function AddCssToPage(cssUrl)
	{
		var s = document.createElement("link") ;
		s.type = "text/css" ;
		s.rel = "Stylesheet";
		s.href = cssUrl ;
		var head = document.head || document.getElementsByTagName("head")[0] ;
		head.appendChild(s) ;
		
		return true;
	} 
	
	/**
	Loads a script file
	@method addScriptToPage
	@param {string} scriptUrl URL of the script file to load
	@return {boolean} True if the script file is loaded successfully
	**/
	function AddScriptToPage(scriptUrl)
	{	
		var s = document.createElement("script") ;
		s.type = "text/JavaScript" ;
		s.src = scriptUrl ;
		s.async = false ;
		var head = document.head || document.getElementsByTagName("head")[0] ;
		head.appendChild(s) ;

		return true;
	}
	
	// Loads blackbird CSS
	var BLACKBIRD_CSS_URL = CDN_PATH + "BlackbirdJs/blackbird.min.css";
	AddCssToPage(BLACKBIRD_CSS_URL);

	// Public functions mapping
	window[ BLINGPOINT_LOADER_NAMESPACE ].addCssToPage = AddCssToPage;
	window[ BLINGPOINT_LOADER_NAMESPACE ].addScriptToPage = AddScriptToPage;
	
	window[ BLINGPOINT_ROOT_NAMESPACE ].loader = window[BLINGPOINT_LOADER_NAMESPACE];

	// Define Alias
	window[ BLINGPOINT_ALIAS_1 ] = window[BLINGPOINT_ROOT_NAMESPACE];
	window[ BLINGPOINT_ALIAS_2 ] = window[BLINGPOINT_ROOT_NAMESPACE];
	
})();
