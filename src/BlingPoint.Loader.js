//****************************
// BlingPoint Loader
//****************************
	
( function() {
	
	var BLINGPOINT_ALIAS_1 = '$p';
	var BLINGPOINT_ALIAS_2 = '$P';

	var BLINGPOINT_ROOT_NAMESPACE = 'blingpoint';
	var BLINGPOINT_LOADER_NAMESPACE = 'loader';
	
	// Init namespaces
	window[ BLINGPOINT_ROOT_NAMESPACE ] = {};
	window[ BLINGPOINT_LOADER_NAMESPACE ] = {};
	
	function GetScriptUrl(){
		var scripts = document.getElementsByTagName('script');
		for (i=0;i<scripts.length;i++){
			if (scripts[i].src.indexOf('BlingPoint.js') > -1)
				//return scripts[i].src;
				return scripts[i].src.substring(0,scripts[i].src.length-13);
		}
	}

	var CDN_PATH = GetScriptUrl();
	
	var BLACKBIRD_CSS_URL = CDN_PATH + "BlackbirdJs/blackbird.min.css";
	
	// Loading CSS resources
	function AddCssToPage(cssUrl)
	{
		var s = document.createElement("link") ;
		s.type = "text/css" ;
		s.rel = "Stylesheet";
		s.href = cssUrl ;
		// puis on l’insère dans la balise <head> en haut de document
		var head = document.head || document.getElementsByTagName("head")[0] ;
		head.appendChild(s) ;
		
		console.log('CSS loaded : ' + cssUrl);	
	} 
	
	// Loading Scripts
	function AddScriptToPage(scriptUrl)
	{	
		var s = document.createElement("script") ;
		s.type = "text/JavaScript" ;
		s.src = scriptUrl ;
		s.async = false ;
		// puis on l’insère dans la balise <head> en haut de document
		var head = document.head || document.getElementsByTagName("head")[0] ;
		head.appendChild(s) ;
		
		console.log('Script loaded : ' + scriptUrl);
	}
	

	AddCssToPage(BLACKBIRD_CSS_URL);

	// Public functions mapping
	window[ BLINGPOINT_LOADER_NAMESPACE ].addCssToPage = AddCssToPage;
	window[ BLINGPOINT_LOADER_NAMESPACE ].addScriptToPage = AddScriptToPage;
	
	// Define Parent NameSpace
	window[ BLINGPOINT_ROOT_NAMESPACE ].loader = window[BLINGPOINT_LOADER_NAMESPACE];

	// Define Alias
	window[ BLINGPOINT_ALIAS_1 ] = window[BLINGPOINT_ROOT_NAMESPACE];
	window[ BLINGPOINT_ALIAS_2 ] = window[BLINGPOINT_ROOT_NAMESPACE];
	
})();
