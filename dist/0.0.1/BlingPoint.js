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
/**
 * BlingPoint Log Module
 * @module Log
 */
( function() {

	var BLINGPOINT_ROOT_NAMESPACE = 'blingpoint';
	var BLINGPOINT_LOG_NAMESPACE = 'log';

	// Init namespaces
	window[ BLINGPOINT_LOG_NAMESPACE ] = {};
	
	var IE6_POSITION_FIXED = true; // enable IE6 {position:fixed}
	
	var bbird;
	var outputList;
	var cache = [];
	
	var state = getState();
	var classes = {};
	var profiler = {};
	var IDs = {
		blackbird: 'blackbird',
		checkbox: 'bbVis',
		filters: 'bbFilters',
		controls: 'bbControls',
		size: 'bbSize'
	};
	var messageTypes = { //order of these properties imply render order of filter controls
		debug: true,
		info: true,
		warn: true,
		error: true,
		profile: true
	};
	
	
	/**
	Builds BlingPoint Logviewer Markup
	@method generateMarkup
	@return {string} BlingPoint Logviewer node
	*/
	function generateMarkup() { //build markup
		var spans = [];
		for ( var type in messageTypes ) {
			spans.push( [ '<span class="', type, '" type="', type, '"></span>'].join( '' ) );
		}

		var newNode = document.createElement( 'DIV' );
		newNode.id = IDs.blackbird;
		newNode.style.display = 'none';
		newNode.innerHTML = [
			'<div class="header">',
				'<div class="left">',
					'<div id="', IDs.filters, '" class="filters" title="click to filter by message type">', spans.join( '' ), '</div>',
				'</div>',
				'<div class="right">',
					'<div id="', IDs.controls, '" class="controls">',
						'<span id="', IDs.size ,'" title="contract" op="resize"></span>',
						'<span class="clear" title="clear" op="clear"></span>',
						'<span class="close" title="close" op="close"></span>',
					'</div>',
				'</div>',
			'</div>',
			'<div class="main">',
				'<div class="left"></div><div class="mainBody">',
					'<ol>', cache.join( '' ), '</ol>',
				'</div><div class="right"></div>',
			'</div>',
			'<div class="footer">',
				'<div class="left"><label for="', IDs.checkbox, '"><input type="checkbox" id="', IDs.checkbox, '" />Visible on page load</label></div>',
				'<div class="right"></div>',
			'</div>'
		].join( '' );
		return newNode;
	}

	function backgroundImage() { //(IE6 only) change <BODY> tag's background to resolve {position:fixed} support
		var bodyTag = document.getElementsByTagName( 'BODY' )[ 0 ];
		
		if ( bodyTag.currentStyle && IE6_POSITION_FIXED ) {
			if (bodyTag.currentStyle.backgroundImage == 'none' ) {
				bodyTag.style.backgroundImage = 'url(about:blank)';
			}
			if (bodyTag.currentStyle.backgroundAttachment == 'scroll' ) {
				bodyTag.style.backgroundAttachment = 'fixed';
			}
		}
	}

	function addMessage( type, content ) { //adds a message to the output list
		content = ( content.constructor == Array ) ? content.join( '' ) : content;
		if ( outputList ) {
			var newMsg = document.createElement( 'LI' );
			newMsg.className = type;
			newMsg.innerHTML = [ '<span class="icon"></span>', content ].join( '' );
			outputList.appendChild( newMsg );
			scrollToBottom();
		} else {
			//cache.push( [ '<li class="', type, '"><span class="icon"></span>', content, '</li>' ].join( '' ) );
		}
	}
	
	function clear() { //clear list output
		outputList.innerHTML = '';
	}
	
	function clickControl( evt ) {
		if ( !evt ) evt = window.event;
		var el = ( evt.target ) ? evt.target : evt.srcElement;

		if ( el.tagName == 'SPAN' ) {
			switch ( el.getAttributeNode( 'op' ).nodeValue ) {
				case 'resize': resize(); break;
				case 'clear':  clear();  break;
				case 'close':  hide();   break;
			}
		}
	}
	
	function clickFilter( evt ) { //show/hide a specific message type
		if ( !evt ) evt = window.event;
		var span = ( evt.target ) ? evt.target : evt.srcElement;

		if ( span && span.tagName == 'SPAN' ) {

			var type = span.getAttributeNode( 'type' ).nodeValue;

			if ( evt.altKey ) {
				var filters = document.getElementById( IDs.filters ).getElementsByTagName( 'SPAN' );

				var active = 0;
				for ( var entry in messageTypes ) {
					if ( messageTypes[ entry ] ) active++;
				}
				var oneActiveFilter = ( active == 1 && messageTypes[ type ] );

				for ( var i = 0; filters[ i ]; i++ ) {
					var spanType = filters[ i ].getAttributeNode( 'type' ).nodeValue;

					filters[ i ].className = ( oneActiveFilter || ( spanType == type ) ) ? spanType : spanType + 'Disabled';
					messageTypes[ spanType ] = oneActiveFilter || ( spanType == type );
				}
			}
			else {
				messageTypes[ type ] = ! messageTypes[ type ];
				span.className = ( messageTypes[ type ] ) ? type : type + 'Disabled';
			}

			//build outputList's class from messageTypes object
			var disabledTypes = [];
			for ( var distype in messageTypes ) {
				if ( ! messageTypes[ distype ] ) disabledTypes.push( distype );
			}
			disabledTypes.push( '' );
			outputList.className = disabledTypes.join( 'Hidden ' );

			scrollToBottom();
		}
	}

	function clickVis( evt ) {
		if ( !evt ) evt = window.event;
		var el = ( evt.target ) ? evt.target : evt.srcElement;

		state.load = el.checked;
		setState();
	}
	
	
	function scrollToBottom() { //scroll list output to the bottom
		outputList.scrollTop = outputList.scrollHeight;
	}
	
	function isVisible() { //determine the visibility
		return ( bbird.style.display == 'block' );
	}

	function hide() { 
		bbird.style.display = 'none';
	}
			
	function show() {
		var body = document.getElementsByTagName( 'BODY' )[ 0 ];
		body.removeChild( bbird );
		body.appendChild( bbird );
		bbird.style.display = 'block';
		bbird.style.zIndex = '15000';
	}
	
	//sets the position
	function reposition( position ) {
		if ( position === undefined || position === null ) {
			position = ( state && state.pos === null ) ? 1 : ( state.pos + 1 ) % 4; //set to initial position ('topRight') or move to next position
		}
				
		switch ( position ) {
			case 0: classes[ 0 ] = 'bbTopLeft'; break;
			case 1: classes[ 0 ] = 'bbTopRight'; break;
			case 2: classes[ 0 ] = 'bbBottomLeft'; break;
			case 3: classes[ 0 ] = 'bbBottomRight'; break;
		}
		state.pos = position;
		setState();
	}

	function resize( size ) {
		if ( size === undefined || size === null ) {
			size = ( state && state.size === null ) ? 0 : ( state.size + 1 ) % 2;
		}

		classes[ 1 ] = ( size === 0 ) ? 'bbSmall' : 'bbLarge';

		var span = document.getElementById( IDs.size );
		span.title = ( size === 1 ) ? 'small' : 'large';
		span.className = span.title;

		state.size = size;
		setState();
		scrollToBottom();
	}

	function setState() {
		var props = [];
		for ( var entry in state ) {
			var value = ( state[ entry ] && state[ entry ].constructor === String ) ? '"' + state[ entry ] + '"' : state[ entry ]; 
			props.push( entry + ':' + value );
		}
		props = props.join( ',' );
		
		var expiration = new Date();
		expiration.setDate( expiration.getDate() + 14 );
		document.cookie = [ 'blackbird={', props, '}; expires=', expiration.toUTCString() ,';' ].join( '' );

		var newClass = [];
		for ( var word in classes ) {
			newClass.push( classes[ word ] );
		}
		bbird.className = newClass.join( ' ' );
	}
	
	function getState() {
		var re = new RegExp( /blackbird=({[^;]+})(;|\b|$)/ );
		var match = re.exec( document.cookie );
		return ( match && match[ 1 ] ) ? eval( '(' + match[ 1 ] + ')' ) : { pos:null, size:null, load:null };
	}
	
	//event handler for 'keyup' event for window
	function readKey( evt ) {
		if ( !evt ) evt = window.event;
		var code = 113; //F2 key
					
		if ( evt && evt.keyCode == code ) {
					
			var visible = isVisible();
					
			if ( visible && evt.shiftKey && evt.altKey ) clear();
			else if (visible && evt.shiftKey ) reposition();
			else if ( !evt.shiftKey && !evt.altKey ) {
				( visible ) ? hide() : show();
			}
		}
	}

	//event management ( thanks John Resig )
	function addEvent( obj, type, fn ) {
		var obj = ( obj.constructor === String ) ? document.getElementById( obj ) : obj;
		if ( obj.attachEvent ) {
			obj[ 'e' + type + fn ] = fn;
			obj[ type + fn ] = function(){ obj[ 'e' + type + fn ]( window.event ) };
			obj.attachEvent( 'on' + type, obj[ type + fn ] );
		} else obj.addEventListener( type, fn, false );
	}
	function removeEvent( obj, type, fn ) {
		var obj = ( obj.constructor === String ) ? document.getElementById( obj ) : obj;
		if ( obj.detachEvent ) {
			obj.detachEvent( 'on' + type, obj[ type + fn ] );
			obj[ type + fn ] = null;
		}
		else obj.removeEventListener( type, fn, false );
	}


	function InitBlackbird() {
		var body = document.getElementsByTagName( 'BODY' )[ 0 ];
		bbird = body.appendChild( generateMarkup() );
		outputList = bbird.getElementsByTagName( 'OL' )[ 0 ];
	
		backgroundImage();
	
		//add events
		addEvent( IDs.checkbox, 'click', clickVis );
		addEvent( IDs.filters, 'click', clickFilter );
		addEvent( IDs.controls, 'click', clickControl );
		addEvent( document, 'keyup', readKey);

		resize( state.size );
		reposition( state.pos );
		if ( state.load ) {
			show();
			document.getElementById( IDs.checkbox ).checked = true; 
		}

		scrollToBottom();

		window[ BLINGPOINT_LOG_NAMESPACE ].init = function() {
			show();
			window[ BLINGPOINT_LOG_NAMESPACE ].error( [ '<b>', BLINGPOINT_LOG_NAMESPACE, '</b> can only be initialized once' ] );
		};

		addEvent( window, 'unload', function() {
			removeEvent( IDs.checkbox, 'click', clickVis );
			removeEvent( IDs.filters, 'click', clickFilter );
			removeEvent( IDs.controls, 'click', clickControl );
			removeEvent( document, 'keyup', readKey );
		});
		
		window[ BLINGPOINT_LOG_NAMESPACE ].info('BlingPoint LogViewer Loaded');
		
	}



	// Public functions mapping
	window[ BLINGPOINT_LOG_NAMESPACE ] = {
		initBlackbird:
			function() { InitBlackbird(); },
		toggle:
			function() { ( isVisible() ) ? hide() : show(); },
		resize:
			function() { resize(); },
		clear:
			function() { clear(); },
		move:
			function() { reposition(); },
		debug: 
			function( msg ) { addMessage( 'debug', msg ); },
		warn:
			function( msg ) { addMessage( 'warn', msg ); },
		info:
			function( msg ) { addMessage( 'info', msg ); },
		error:
			function( msg ) { addMessage( 'error', msg ); },
		profile: 
			function( label ) {
				var currentTime = new Date(); //record the current time when profile() is executed
				
				if ( label === undefined || label === '' ) {
					addMessage( 'error', '<b>ERROR:</b> Please specify a label for your profile statement' );
				}
				else if ( profiler[ label ] ) {
					addMessage( 'profile', [ label, ': ', currentTime - profiler[ label ],	'ms' ].join( '' ) );
					delete profiler[ label ];
				}
				else {
					profiler[ label ] = currentTime;
					addMessage( 'profile', label );
				}
				return currentTime;
			}
	};
	
	
	// Define Parent NameSpace
	window[ BLINGPOINT_ROOT_NAMESPACE ].log = window[BLINGPOINT_LOG_NAMESPACE];
	
	
})();

blingpoint.log.initBlackbird();

if (BlingPointDevMode == true) {
	blingpoint.log.toggle();
	blingpoint.log.profile('scriptLoading')
}/**
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
/**
 * BlingPoint Framework Module
 * @module Framework
 */
var ctx;
var hostCtx;
var web;
var hostWeb;
var user;

( function() {
	
	var BLINGPOINT_ROOT_NAMESPACE = 'blingpoint';
	var BLINGPOINT_ITEMS_NAMESPACE = 'items';
	
	// Init namespaces
	window[ BLINGPOINT_ITEMS_NAMESPACE ] = {};

	
	
	// Initialize blingpoint framework common objects
	function InitWeb() {

		if (BlingPointDevMode === true) {
			blingpoint.log.profile('contextLoading');
		}

		ctx = SP.ClientContext.get_current();
		web = ctx.get_web();
		ctx.load(web);
		user = ctx.get_web().get_currentUser();
		ctx.load(user);

		ctx.executeQueryAsync(
			function() {
				log.info('Web Context loaded');
				log.debug('web title:' + web.get_title());
				log.debug('Description:' + web.get_description());
				log.debug('ID:' + web.get_id());
				log.debug('Created Date:' + web.get_created());
				log.debug('Web Url:' + web.get_serverRelativeUrl());
				log.info('Current user loaded');
				log.debug('ID:' + user.get_id());
				log.debug('User title:' + user.get_title());
				log.debug('Email:' + user.get_email());

				if ( hostWebUrl !== undefined && hostWebUrl !== null && appWebUrl !== undefined && appWebUrl !== null ) {
					
					blingpoint.log.debug('App context detected, loading both SPHost context');

					var factory = new SP.ProxyWebRequestExecutorFactory(appWebUrl);
					ctx.set_webRequestExecutorFactory(factory);
					var hostCtx = new SP.AppContextSite(ctx, hostWebUrl);
					hostWeb = hostCtx.get_web();
					ctx.load(hostWeb);
					ctx.executeQueryAsync(
						function() {
							log.info('Host Web Context loaded');
							log.debug('Host web title:' + hostWeb.get_title());
							log.debug('Host Description:' + hostWeb.get_description());
							log.debug('Host ID:' + hostWeb.get_id());
							log.debug('Host Created Date:' + hostWeb.get_created());
							log.debug('Host Web Url:' + hostWeb.get_serverRelativeUrl());
							if (BlingPointDevMode === true) {
								blingpoint.log.profile('contextLoading');
							}
						},
						function (sender, args) {
							if (BlingPointDevMode === true) {
								blingpoint.log.profile('contextLoading');
							}
							if (args.get_errorTypeName() == 'System.UnauthorizedAccessException') {
								blingpoint.log.error('Your App is not authorized to access Host Web. Check your App manifest.');
								blingpoint.log.error(args.get_message() + '\n' + args.get_stackTrace());
							}
							else {
								blingpoint.log.error('request failed ' + args.get_message() + '\n' + args.get_stackTrace());
							}
						}
					);
				}
				else {
					if (BlingPointDevMode === true) {
						blingpoint.log.profile('contextLoading');
					}
					blingpoint.plugins.loadPlugIns();
				}
			},
			function (sender, args) {
				if (BlingPointDevMode === true) {
					blingpoint.log.profile('contextLoading');
				}
				blingpoint.log.error('request failed ' + args.get_message() + '\n' + args.get_stackTrace());
			}
		);

	}

	var hostWebUrl = blingpoint.global.getUrlParameters().SPHostUrl;
	var appWebUrl = blingpoint.global.getUrlParameters().SPAppWebUrl;
	if ( hostWebUrl !== undefined && hostWebUrl !== null && appWebUrl !== undefined && appWebUrl !== null ) {
		// Loading SP.Runtime
		blingpoint.loader.addScriptToPage('/_layouts/15/SP.RequestExecutor.js');
		ExecuteOrDelayUntilScriptLoaded(InitWeb,"SP.RequestExecutor.js");
	}
	else {
		ExecuteOrDelayUntilScriptLoaded(InitWeb,"sp.js");
	}
	
	


	
	/*-------------------------------------------------------------
	Items
	-------------------------------------------------------------*/
	function CreateItem(listName, itemTitle, callBackFunction) {

		//Retrieve the lists
		var lists = web.get_lists();
		//Get the Cars List
		var list = lists.getByTitle(listName);
		//Create new IteamCreationInformation
		var itemCreationInfo = new SP.ListItemCreationInformation();
		//the addItem takes the itemCreationInformation object
		//and returns the listItem
		var listItem = list.addItem(itemCreationInfo);
		//Set the title of the list Item
		//to the value in the txtCar
		listItem.set_item('Title', itemTitle);
		//Call Update the listItem
		listItem.update();
		//Finally execute the operation

		ctx.executeQueryAsync(
			function () {

				var createdItemId;
				
				createdItemId = listItem.get_id();
				blingpoint.log.debug(createdItemId);
				//blingpoint.items.lastCreatedItemId = listItem.get_id();
				blingpoint.ui.addNotification('created', false);
				
				callBackFunction(createdItemId);
				
			},
			function (sender, args) {
				blingpoint.global.handleManagedError("Operation was cancelled...", sender, args);
				blingpoint.log.debug('Error');
				blingpoint.ui.addNotification("Operation was cancelled...", false);
			}
		);
	}

	function UpdateItem(listName, itemId, column, value, callBackFunction) {

		ExecuteOrDelayUntilScriptLoaded(function(){

			var list = web.get_lists().getByTitle(listName);
			var oListItem = list.getItemById(itemId);
			
			/*-------------------------------------------------------------
			Use user ID for the value param for people fields
			
			Date : Use a Date object (eg : var now = new Date(); )
			
			Use this snippet for lookupf fields :
			var _newLookupField = new SP.FieldLookupValue();
			newLookupField.set_lookupId(10) -> Updated with some lookup value for Department column
			currentItem.set_item(‘Department’, newLookupField);
			currentItem.update();
			// Call context.executeQueryAsync again
			-------------------------------------------------------------*/
			
			/*
			Field  – How to Get\set it
			Title – SP.ListItem.get_item(‘Title‘);
			ID – SP.ListItem.get_id();
			Url -SP.ListItem.get_item(‘urlfieldname‘).get_url()
			Description – SP.ListItem.get_item(‘descriptionfieldname‘).get_description();
			Current Version – SP.ListItem.get_item(“_UIVersionString“);
			Lookup field – SP.ListItem.get_item(‘LookupFieldName’).get_lookupValue();
			Choice Field – SP.ListItem.get_item(‘ChoiceFieldName‘);
			Created Date – SP.ListItem.get_item(“Created“);
			Modified Date – SP.ListItem.get_item(“Modified“); -> case sensitive does not work with ‘modified’
			Created By – SP.ListItem.get_item(“Author“).get_lookupValue());
			Modified by – SP.ListItem.get_item(“Editor“).get_lookupValue());
			File  – SP.ListItem.get_file();
			File Versions -  File.get_versions();.
			Content Type – SP.ListItem.get_contentType();
			Parent List – SP.ListItem.get_parentList();
			*/		

			//ctx.load(oListItem);
			oListItem.set_item(column, value);
			oListItem.update();
			
			ctx.executeQueryAsync(
				function () {
					blingpoint.log.debug('Updated');
					//blingpoint.ui.addNotification("updated", false);
					
					callBackFunction();
					
				},
				function (sender, args) {
					blingpoint.global.handleManagedError("Operation was cancelled...", sender, args);
					blingpoint.log.debug('Error');
					//blingpoint.ui.addNotification("Operation was cancelled...", false);
				}
				);

		},
		"sp.js"
		);

	}


	function UpdateItemUrl(listName, itemId, column, description, url, callBackFunction) {
		
		ExecuteOrDelayUntilScriptLoaded(function(){
			
			var list = web.get_lists().getByTitle(listName);
			var oListItem = list.getItemById(itemId);

			// context.load(<object>,'<Field1>','<Field2>','<Field3>');
			// context.load(<objectCollection>,'Include(<Field1>,<Field2>,<Field3>');

			ctx.load(oListItem,column);

			ctx.executeQueryAsync(
				function () {

					var oFieldUrlValue;
					//oUrlField = oListItem.get_item(column);
					oFieldUrlValue = new SP.FieldUrlValue();
					oFieldUrlValue.set_url(url);
					oFieldUrlValue.set_description(description);
					oListItem.set_item(column, oFieldUrlValue);
					
					oListItem.update();

					ctx.executeQueryAsync(
						function () {
							log.debug('Updated');
							//blingpoint.ui.addNotification("updated", false);
							
							callBackFunction();
							
						},
						function (sender, args) {
							blingpoint.global.handleManagedError("Operation was cancelled...", sender, args);
							blingpoint.log.debug('Error');
							//blingpoint.ui.addNotification("Operation was cancelled...", false);
						}
					);

				},
				function (sender, args) {
					blingpoint.global.handleManagedError("Operation was cancelled...", sender, args);
					blingpoint.log.debug('Error');
					//blingpoint.ui.addNotification("Operation was cancelled...", false);
				}
			);

		},
		"sp.js");
	}	



	/*-------------------------------------------------------------
	Namespaces
	-------------------------------------------------------------*/
	window[ BLINGPOINT_ITEMS_NAMESPACE ].updateItem = UpdateItem;
	window[ BLINGPOINT_ITEMS_NAMESPACE ].updateItemUrl = UpdateItemUrl;
	window[ BLINGPOINT_ITEMS_NAMESPACE ].createItem = CreateItem;

	window[ BLINGPOINT_ROOT_NAMESPACE ].items = window[ BLINGPOINT_ITEMS_NAMESPACE ];

})();
/**
 * BlingPoint Security Module
 * @module Security
 */

( function() {
	
	var BLINGPOINT_ROOT_NAMESPACE = 'blingpoint';
	var BLINGPOINT_SECURITY_NAMESPACE = 'security';
	
	// Init namespaces
	window[ BLINGPOINT_SECURITY_NAMESPACE]  = {};
	
	/**
	Checks if the current user is a member of the specified group
	@method currentUserIsUserMemberOf
	@return {string} BlingPoint Logviewer node
	**/
	function CurrentUserIsUserMemberOf(groupIdOrName, callbackFunctionIfMember, callbackFunctionIfNotMember) {

		var collGroup = web.get_siteGroups();
		ctx.load(collGroup);

		ctx.executeQueryAsync(

			function (sender, args) {

				var oGroup;
				if (blingpoint.global.isNumber(groupIdOrName)) {
					oGroup = collGroup.getById(groupIdOrName);
				}
				else {
					oGroup = collGroup.getByName(groupIdOrName);
				}

				var collUser = oGroup.get_users();
				ctx.load(collUser);
				ctx.executeQueryAsync(

					function (sender, args) {
						var userEnumerator = collUser.getEnumerator();
						while (userEnumerator.moveNext()) {
							var oUser = userEnumerator.get_current();
							if (oUser.get_id() == user.get_id()) {
								
								callbackFunctionIfMember();
								return;

							}
						}
						callbackFunctionIfNotMember();
						return;	

					}, 
					function (sender, args) {
						blingpoint.log.warn('Request failed. ' + args.get_message() + '\n' + args.get_stackTrace());
					}
				);
			},

			function (sender, args) {
				blingpoint.log.warn('Request failed. ' + args.get_message() + '\n' + args.get_stackTrace());
			}
		);
	}



	// Namespaces
	window[ BLINGPOINT_SECURITY_NAMESPACE ].currentUserIsUserMemberOf = CurrentUserIsUserMemberOf;
	
	window[ BLINGPOINT_ROOT_NAMESPACE ].security = window[ BLINGPOINT_SECURITY_NAMESPACE ];
	
})();
/**
 * BlingPoint UI Module
 * @module UI
 */

( function() {
	
	var BLINGPOINT_ROOT_NAMESPACE = 'blingpoint';
	var BLINGPOINT_UI_NAMESPACE = 'ui';
	
	// Init namespaces
	window[ BLINGPOINT_UI_NAMESPACE ] = {};
	
	

	function AddNotification(htmlMessage,sticky) {
		ExecuteOrDelayUntilScriptLoaded(function(){
			notificationId = SP.UI.Notify.addNotification(htmlMessage, sticky);
			log.debug(notificationId);
			return notificationId;
		},
		"sp.js"
		);  
	}

	function RemoveNotification(notificationId) {
		SP.UI.Notify.removeNotification(notificationId);
	}	

	function AddStatus(htmlMessage,color) {
		statusId = SP.UI.Status.addStatus(htmlMessage);
		SP.UI.Status.setStatusPriColor(statusId, color);
		log.debug(statusId);
		return statusId;
	}

	function RemoveStatus(statusId) {
		SP.UI.Status.removeStatus(statusId);
	}

	function RemoveAllStatus() {
		SP.UI.Status.removeAllStatus(true);
	}

	//Dialog opening 
	function OpenDialog(dialogUrl, dialogWidth, dialogHeight) { 

		ExecuteOrDelayUntilScriptLoaded(

			function() {
				
				var options = SP.UI.$create_DialogOptions(); 
				options.url = dialogUrl; 
				options.width = dialogWidth; 
				options.height = dialogHeight;
				//options.dialogReturnValueCallback = Function.createDelegate(this, this.onOpenDialogCallback); 
				options.dialogReturnValueCallback = function (result, target) { 
					if(result === SP.UI.DialogResult.OK) { 
						console.log("OK was clicked!"); 
						blingpoint.ui.addNotification('New leave application request submitted',false);
					} 
					if(result === SP.UI.DialogResult.cancel) { 
						console.log("Cancel was clicked!"); 
					} 
				};
				
				var dialog = SP.UI.ModalDialog.showModalDialog(options);
				
				//log.info(dialog.get_frameElement().id);
				
				//dialog.get_frameElement().contentWindow.document.write('<html><body>Hello World<script>alert("coucou");</script></body></html>');
				//log.info(dialog.get_frameElement().contentWindow.document.body.innerHTML);
				//log.info(dialog.get_frameElement().contentWindow.document.body.innerText);
			},
			"sp.js"
		);
	}



	// Namespaces
	window[ BLINGPOINT_UI_NAMESPACE ].addStatus = AddStatus;
	window[ BLINGPOINT_UI_NAMESPACE ].removeStatus = RemoveStatus;
	window[ BLINGPOINT_UI_NAMESPACE ].removeAllStatus = RemoveAllStatus;
	window[ BLINGPOINT_UI_NAMESPACE ].addNotification = AddNotification;
	window[ BLINGPOINT_UI_NAMESPACE ].removeNotification = RemoveNotification;
	window[ BLINGPOINT_UI_NAMESPACE ].openDialog = OpenDialog;

	window[ BLINGPOINT_ROOT_NAMESPACE ].ui = window[ BLINGPOINT_UI_NAMESPACE ];
	
})();
/**
 * BlingPoint PlugIns Module
 * @module PlugIns
 */

( function() {
	
	var BLINGPOINT_ROOT_NAMESPACE = 'blingpoint';
	var BLINGPOINT_PLUGINS_NAMESPACE = 'plugins';
	
	// Init namespaces
	window[ BLINGPOINT_PLUGINS_NAMESPACE ] = {};


	/*-------------------------------------------------------------
	PlugIns
	-------------------------------------------------------------*/
	function SetupPlugInSystem() {

		function provisionBlingPointPlugInSystem() {
			createBlingPointPlugInList();
		}
		function createBlingPointPlugInList() {
			$p.schema.createList('BlingPointPlugIns', SP.ListTemplateType.genericList, false, createBlingPointPlugInContentType, null);	
		}
		function createBlingPointPlugInContentType() {
			$p.schema.createContentTypeInHost('BlingPointPlugIn', 'BlingPoint PlugIn', 'BlingPointContentTypes', createBlingPointPlugInDescriptionField, null);
		}
		function createBlingPointPlugInDescriptionField() {
			$p.schema.createField('Text', 'PlugInDescription', 'PlugIn Description', 'BlingPointFields', false, createBlingPointPlugInUrlTriggerField, null);
		}
		function createBlingPointPlugInUrlTriggerField() {
			$p.schema.createField('Text', 'PlugInUrlTrigger', 'PlugIn URL Trigger', 'BlingPointFields', false, createBlingPointPlugInSourceUrlField, null);
		}
		function createBlingPointPlugInSourceUrlField() {
			$p.schema.createField('Text', 'PlugInSourceUrl', 'PlugIn Source URL', 'BlingPointFields', false, addBlingPointPlugInDescriptionField, null);
		}
		function addBlingPointPlugInDescriptionField() {
			$p.schema.addFieldToContentTypeInHost('BlingPointPlugIn', 'PlugInDescription', addBlingPointPlugInUrlTriggerField, null);
		}
		function addBlingPointPlugInUrlTriggerField() {
			$p.schema.addFieldToContentTypeInHost('BlingPointPlugIn', 'PlugInUrlTrigger',addBlingPointPlugInSourceUrlField, null);
		}
		function addBlingPointPlugInSourceUrlField() {
			$p.schema.addFieldToContentTypeInHost('BlingPointPlugIn', 'PlugInSourceUrl', addBlingPointPlugInContentTypeToList, null);
		}
		function addBlingPointPlugInContentTypeToList() {
			$p.schema.addExistingContentTypetoList('BlingPointPlugIns', 'BlingPointPlugIn', createBlingPointPlugInLibrary, null);
		}
		function createBlingPointPlugInLibrary() {
			$p.schema.createList('BlingPointAssets', SP.ListTemplateType.documentLibrary, false, null, null);
		}
		provisionBlingPointPlugInSystem();
	}

	function LoadPlugIns() {

		if (BlingPointDevMode === true) {
			blingpoint.log.profile('pluginsLoading');
		}

		var list = web.get_lists().getByTitle("BlingPointPlugIns");
		var camlQuery = new SP.CamlQuery();
		var q = '<View><RowLimit>500</RowLimit></View>';

		camlQuery.set_viewXml(q);
		var oListItems = list.getItems(camlQuery);

		ctx.load(oListItems, 'Include(DisplayName,Id,PlugInSource,UrlTrigger)');

		ctx.executeQueryAsync(
			function(){
				var oListEnumerator = oListItems.getEnumerator();
				//iterate though all of the items
				while (oListEnumerator.moveNext()) {
					var item = oListEnumerator.get_current();
					var title = item.get_displayName();
					var id = item.get_id();
					// If its an URL field, add ".get_url()"
					var plugInSource = item.get_item('PlugInSource');
					var urlTrigger = item.get_item('UrlTrigger');

					log.debug("Checking PlugIn : " + title);
					log.debug("PlugIn ID : " + id);
					log.debug("PlugIn URL Trigger : " + urlTrigger);

					if (blingpoint.global.checkUrl(urlTrigger)) {
						if (blingpoint.global.check(plugInSource,".js")) {
							log.info("Loading PlugIn : " + title);
							blingpoint.loader.addScriptToPage(plugInSource);
						}
						if (blingpoint.global.check(plugInSource,".css")) {
							log.info("Loading PlugIn : " + title);
							blingpoint.loader.addCssToPage(plugInSource);
						}
					}

				}
				if (BlingPointDevMode === true) {
					blingpoint.log.profile('pluginsLoading');
				}
			}, 
			function(sender, args){
				if (BlingPointDevMode === true) {
					blingpoint.log.profile('pluginsLoading');
				}
				blingpoint.log.error('request failed ' + args.get_message() + '\n' + args.get_stackTrace());
				blingpoint.log.error('If the list BlingPointPlugIns does not exist, <a href="javascript:$p.plugins.setupPlugInSystem();">click here to setup BlingPoint !</a>');
			}
		);
	}	



	// Namespaces
	window[ BLINGPOINT_PLUGINS_NAMESPACE ].loadPlugIns = LoadPlugIns;
	window[ BLINGPOINT_PLUGINS_NAMESPACE ].setupPlugInSystem = SetupPlugInSystem;

	window[ BLINGPOINT_ROOT_NAMESPACE ].plugins = window[ BLINGPOINT_PLUGINS_NAMESPACE ];
	
})();
/**
 * BlingPoint Parameters Module
 * @module Parameters
 */

( function() {
	
	var BLINGPOINT_ROOT_NAMESPACE = 'blingpoint';
	var BLINGPOINT_PARAMETERS_NAMESPACE = 'parameters';
	
	// Init namespaces
	window[ BLINGPOINT_PARAMETERS_NAMESPACE]  = {};
	
	
	/*-------------------------------------------------------------
		Parameters
	-------------------------------------------------------------*/

	function SetWebSiteProperty(property, propertyValue) {

		var props = web.get_allProperties();

		props.set_item(property, propertyValue);
		web.update();

		ctx.executeQueryAsync(
			function (sender, args) {
				blingpoint.log.debug('WebSite property ' + property + ' = ' + propertyValue);
			},
			function (sender, args) {
				blingpoint.log.warn('Request failed. ' + args.get_message() + '\n' + args.get_stackTrace());
			}
		);
	}
 
 
	function GetWebSiteProperty(property, callBackFunction) {

		var props = web.get_allProperties();
		var propertyValue = props.get_item(property);

		ctx.executeQueryAsync(
			function (sender, args) {
				callBackFunction(propertyValue);
			},
			function (sender, args) {
				blingpoint.log.warn('Request failed. ' + args.get_message() + '\n' + args.get_stackTrace());
			}
		);
	}
 


	// Namespaces
	window[ BLINGPOINT_PARAMETERS_NAMESPACE ].setWebSiteProperty = SetWebSiteProperty;
	window[ BLINGPOINT_PARAMETERS_NAMESPACE ].getWebSiteProperty = GetWebSiteProperty;

	window[ BLINGPOINT_ROOT_NAMESPACE ].parameters = window[ BLINGPOINT_PARAMETERS_NAMESPACE ];

})();
/**
 * BlingPoint Schema Module
 * @module Schema
 */

( function() {
	
	var BLINGPOINT_ROOT_NAMESPACE = 'blingpoint';
	var BLINGPOINT_SCHEMA_NAMESPACE = 'schema';
	
	// Init namespaces
	window[ BLINGPOINT_SCHEMA_NAMESPACE ] = {};
	


	function CreateField (fieldType, fieldName, fieldDisplayName, fieldGroup, fieldHidden, callBackFunctionOnSuccess, callBackFunctionOnError) {

        var fields = web.get_fields();
 
        var fieldXml = "<Field Type='" + fieldType + "' DisplayName='" + fieldDisplayName + "' Name='" + fieldName + 
            "' Group='" + fieldGroup + "' Hidden='" + fieldHidden + "'></Field>";
 
        /*
        See XML Fields reference : http://msdn.microsoft.com/en-us/library/aa979575.aspx
        */

		var createdField = fields.addFieldAsXml(fieldXml, false, SP.AddFieldOptions.AddToNoContentType);

		ctx.load(fields);
		ctx.load(createdField);
		ctx.executeQueryAsync(
			function(){
				blingpoint.log.debug('Field provisioned in host web successfully.');
				blingpoint.global.executeCallback(callBackFunctionOnSuccess);
			},
			function (sender, args){
				blingpoint.log.warn('Failed to provision field into host web. Error:' + sender.statusCode);
				blingpoint.global.executeCallback(callBackFunctionOnError);
			}
		);
	}


	function CreateContentTypeInHost (ctypeName, ctypeDescription, ctypeGroup, callBackFunctionOnSuccess, callBackFunctionOnError) {
		hostWebContentTypes = web.get_contentTypes();
		var cTypeInfo = new SP.ContentTypeCreationInformation();
		cTypeInfo.set_name(ctypeName);
		cTypeInfo.set_description(ctypeDescription);
		cTypeInfo.set_group(ctypeGroup);
		hostWebContentTypes.add(cTypeInfo);
		ctx.load(hostWebContentTypes);
		ctx.executeQueryAsync(
			function(){
				blingpoint.log.debug('Content type provisioned in host web successfully.');
				blingpoint.global.executeCallback(callBackFunctionOnSuccess);
			},
			function (sender, args){
				blingpoint.log.warn('Failed to provision content type into host web. Error:' + sender.statusCode);
				blingpoint.global.executeCallback(callBackFunctionOnError);
			}
		);
	}


	function AddFieldToContentTypeInHost (ctypeName, fieldInternalName, callBackFunctionOnSuccess, callBackFunctionOnError) {

		createdFieldInternalName = fieldInternalName;
		createdContentTypeName = ctypeName;

		// re-fetch created items..
		createdField = web.get_fields().getByInternalNameOrTitle(fieldInternalName);
		ctx.load(createdField);

		hostWebContentTypes = web.get_contentTypes();
		ctx.load(hostWebContentTypes);

		ctx.executeQueryAsync(
			function() {
				performAddFieldToContentTypeInHost(createdContentTypeName, createdFieldInternalName, callBackFunctionOnSuccess, callBackFunctionOnError);
			},
			function (sender, args) {
				blingpoint.log.warn('Failed to re-fetch field and content type. Error:' + sender.statusCode);
				blingpoint.global.executeCallback(callBackFunctionOnError);
			}
		);

	}

    function performAddFieldToContentTypeInHost (ctypeName, fieldInternalName, callBackFunctionOnSuccess, callBackFunctionOnError) {
        // iterate content types, find passed one, THEN add field..
        var cTypeFound = false;
        var createdContentType;

        var contentTypeEnumerator = hostWebContentTypes.getEnumerator();
        while (contentTypeEnumerator.moveNext()) {
            var contentType = contentTypeEnumerator.get_current();
            if (contentType.get_name() === ctypeName) {
                cTypeFound = true;
                createdContentType = contentType;
                break;
            }
        }

		if (cTypeFound) {
			// - NOT the below line - SP.FieldCollection doesn't appear to have an add() method when fetched from content type..
			//contentType.get_fields.add(fieldInternalName)
			// - instead, this..
			var fieldRef = new SP.FieldLinkCreationInformation();
			fieldRef.set_field(createdField);

			createdContentType.get_fieldLinks().add(fieldRef);
			// specify push down..
			createdContentType.update(true);

			ctx.load(createdContentType);
			ctx.executeQueryAsync(
				function () {
					blingpoint.log.debug('Field added to content type in host web successfully.');
					blingpoint.global.executeCallback(callBackFunctionOnSuccess);
				},
				function (sender, args) {
					blingpoint.log.warn('Failed to add field to content type. Error:' + sender.statusCode);
					blingpoint.global.executeCallback(callBackFunctionOnError);
				}
			);
		}
		else {
			blingpoint.log.warn('Failed to add field to content type - check the content type exists!');
			blingpoint.global.executeCallback(callBackFunctionOnError);
		}
    }


	function AddExistingContentTypetoList(listName, contentTypeName, callBackFunctionOnSuccess, callBackFunctionOnError) {
        
        var contentTypeCollection;
        var contentType;
        var listCollection;
        var list;
        var listContentTypeColl;

        var clientContext = ctx;
        
        // Retrieve content type by name
        hostWebContentTypes = web.get_contentTypes();
		ctx.load(hostWebContentTypes);

		ctx.executeQueryAsync(
			function() {
				var contentTypeEnumerator = hostWebContentTypes.getEnumerator();
				while (contentTypeEnumerator.moveNext()) {
					var contentType = contentTypeEnumerator.get_current();
					if (contentType.get_name() === contentTypeName) {
						performAddExistingContentTypetoList(listName, contentType, callBackFunctionOnSuccess, callBackFunctionOnError);
					}
				}
			},
			function (sender, args) {
				blingpoint.log.warn('Request failed. ' + args.get_message() + '\n' + args.get_stackTrace());
				blingpoint.global.executeCallback(callBackFunctionOnError);
			}
		);
	} 


	function performAddExistingContentTypetoList(listName, contentType, callBackFunctionOnSuccess, callBackFunctionOnError) {
		listCollection = web.get_lists();
		list = listCollection.getByTitle(listName);
		listContentTypeColl = list.get_contentTypes();
		listContentTypeColl.addExistingContentType(contentType);
		ctx.load(listContentTypeColl);
		ctx.executeQueryAsync(
			function () {
				blingpoint.log.debug('Content Type added successfully');
				blingpoint.global.executeCallback(callBackFunctionOnSuccess);
			},
			function (sender, args) {
				blingpoint.log.warn('Request failed. ' + args.get_message() + '\n' + args.get_stackTrace());
				blingpoint.global.executeCallback(callBackFunctionOnError);
			}
		);
	}


	function CreateList(listName, listTemplate, displayInQuickLaunch, callBackFunctionOnSuccess, callBackFunctionOnError) {

		//Let's create list creation information object 
		var listCreationInfo = new SP.ListCreationInformation(); 
		listCreationInfo.set_title(listName);
		
		/*
		Type definition
		// Référence : http://msdn.microsoft.com/en-us/library/jj245053.aspx
		*/
		if (listTemplate !== null) {
			listCreationInfo.set_templateType(listTemplate);
		}
		else {
			listCreationInfo.set_templateType(SP.ListTemplateType.genericList); 
		}
		
		// Affichage dans le QuickLaunch
		// Référence : http://msdn.microsoft.com/en-us/library/ee556266.aspx
		switch (displayInQuickLaunch) {
			case true:
			listCreationInfo.set_quickLaunchOption(SP.QuickLaunchOptions.on); 
			break;
			case false:
			listCreationInfo.set_quickLaunchOption(SP.QuickLaunchOptions.off); 
			break;
			default:
			listCreationInfo.set_quickLaunchOption(SP.QuickLaunchOptions.off); 
			break;
		}

		// Création de la liste
		var oList = web.get_lists().add(listCreationInfo); 
		
		ctx.load(oList);
	
		//Execute the actual script 
		ctx.executeQueryAsync(
			function(){
				blingpoint.log.info("List <b>" + oList.get_title() + "</b> created...", false);
				blingpoint.global.executeCallback(callBackFunctionOnSuccess);
			},
			function (sender, args){
				handleManagedError("Operation was cancelled...", sender, args);
				blingpoint.log.warn("List creation operation was cancelled...", false);
				blingpoint.global.executeCallback(callBackFunctionOnError);
			}
		); 

	}

	/*-------------------------------------------------------------
		Sites
	-------------------------------------------------------------*/
	function CreateSite(siteTitle, siteDescription, siteUrl, siteLanguage, siteTemplate, inheritsPermissions, callBackFunctionOnSuccess, callBackFunctionOnError) {

		// siteLanguage : http://technet.microsoft.com/en-us/library/ff463597.aspx
		// siteTemplate : https://www.nothingbutsharepoint.com/sites/devwiki/SP2010Dev/Pages/Site%20Templates%20in%20SharePoint%202010.aspx
		// Exemple : CreateSite('monblog','madesc','blog1',1033, 'BLOG#0', true);
		// Blank : STS#1
	
		var webCreateInfo = new SP.WebCreationInformation();
		webCreateInfo.set_title(siteTitle);
		webCreateInfo.set_description(siteDescription);
		webCreateInfo.set_url(siteUrl);
		webCreateInfo.set_language(siteLanguage);
		webCreateInfo.set_webTemplate(siteTemplate);
		webCreateInfo.set_useSamePermissionsAsParentSite(inheritsPermissions);

		oNewWebsite = web.get_webs().add(webCreateInfo);

		ctx.load(oNewWebsite);
		ctx.executeQueryAsync(
			function (sender, args) {
				var createdSiteUrl;
				createdSiteUrl = oNewWebsite.get_serverRelativeUrl();
				log.info('Site Created');
				log.debug('Site Url : ' + createdSiteUrl);
				blingpoint.global.executeCallback(callBackFunctionOnSuccess);
			},
			function (sender, args) {
				log.warn('Site creation failed : ' + args.get_message() + '\n' + args.get_stackTrace());
				blingpoint.global.executeCallback(callBackFunctionOnError);
			}

		);
	}
	

	/*-------------------------------------------------------------
	Namespaces
	-------------------------------------------------------------*/
	window[ BLINGPOINT_SCHEMA_NAMESPACE ].createField = CreateField;
	window[ BLINGPOINT_SCHEMA_NAMESPACE ].createContentTypeInHost = CreateContentTypeInHost;
	window[ BLINGPOINT_SCHEMA_NAMESPACE ].addFieldToContentTypeInHost = AddFieldToContentTypeInHost;
	window[ BLINGPOINT_SCHEMA_NAMESPACE ].addExistingContentTypetoList = AddExistingContentTypetoList;
	window[ BLINGPOINT_SCHEMA_NAMESPACE ].createList = CreateList;
	window[ BLINGPOINT_SCHEMA_NAMESPACE ].createSite = CreateSite;

	window[ BLINGPOINT_ROOT_NAMESPACE ].schema = window[ BLINGPOINT_SCHEMA_NAMESPACE ];

})();

if (BlingPointDevMode === true) {
	blingpoint.log.profile('scriptLoading');
}