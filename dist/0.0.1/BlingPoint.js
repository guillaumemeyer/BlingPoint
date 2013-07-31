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
/**
 * BlingPoint Log Module
 * @module Log
 */
( function() {

	var BLINGPOINT_ROOT_NAMESPACE = 'blingpoint';
	var BLINGPOINT_LOG_NAMESPACE = 'log';

	// Initialize namespaces
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
	Builds the log viewer markup
	@method generateMarkup
	@return {string} DIV markup
	**/
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
	
	/**
	Clear log viewer output
	@method clear
	**/
	function clear() { 
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

	//event management
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

	/**
	Initialize log viewer
	@method initBlackbird
	**/
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
		
		window[ BLINGPOINT_LOG_NAMESPACE ].debug('BlingPoint LogViewer Loaded');
		
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
//****************************
// BlingPoint Framework
//****************************

var ctx;
var web;
var user;

( function() {
	
	var BLINGPOINT_ROOT_NAMESPACE = 'blingpoint';
	var BLINGPOINT_PLUGINS_NAMESPACE = 'plugins';
	var BLINGPOINT_SCHEMA_NAMESPACE = 'schema';
	var BLINGPOINT_SECURITY_NAMESPACE = 'security';
	var BLINGPOINT_PARAMETERS_NAMESPACE = 'parameters';
	var BLINGPOINT_UI_NAMESPACE = 'ui';
	var BLINGPOINT_SITES_NAMESPACE = 'sites';
	var BLINGPOINT_LISTS_NAMESPACE = 'lists';
	var BLINGPOINT_ITEMS_NAMESPACE = 'items';
	
	// Init namespaces
	window[ BLINGPOINT_PLUGINS_NAMESPACE ] = {};
	window[ BLINGPOINT_SCHEMA_NAMESPACE ] = {};
	window[ BLINGPOINT_SECURITY_NAMESPACE]  = {};
	window[ BLINGPOINT_PARAMETERS_NAMESPACE]  = {};
	window[ BLINGPOINT_UI_NAMESPACE ] = {};
	window[ BLINGPOINT_SITES_NAMESPACE ] = {};
	window[ BLINGPOINT_LISTS_NAMESPACE ] = {};
	window[ BLINGPOINT_ITEMS_NAMESPACE ] = {};

	
	
	/*-------------------------------------------------------------
		Init
		-------------------------------------------------------------*/

		function InitWeb() {

			ctx = SP.ClientContext.get_current();
			web = ctx.get_web();
			ctx.load(web);
			user = ctx.get_web().get_currentUser();
			ctx.load(user);

			ctx.executeQueryAsync(
				Function.createDelegate(this, onInitWebSucceeded), 
				Function.createDelegate(this, onInitWebFailed)
				);

		}

		ExecuteOrDelayUntilScriptLoaded(InitWeb,"sp.js");


		function onInitWebSucceeded() {

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

			blingpoint.plugins.loadPlugIns();

		}

		function onInitWebFailed(sender, args){
			blingpoint.log.error('request failed ' + args.get_message() + '\n' + args.get_stackTrace());
		}








	function CreateField (fieldType, fieldName, fieldDisplayName, fieldGroup, fieldHidden) {

        var fields = web.get_fields();
 
        var fieldXml = "<Field Type='" + fieldType + "' DisplayName='" + fieldDisplayName + "' Name='" + fieldName + 
            "' Group='" + fieldGroup + "' Hidden='" + fieldHidden + "'></Field>";
 
        /*
		Text, Number, DateTime, Note, HTML, Image, URL, Boolean, Choice, MultiChoice, Lookup, LookupMulti

		Sharepoint Field Types - Elements.xml
		Single Line of Text:
		field id="{FDDC4E38-25E0-4FD9-92E7-D17F34A5AB12}" description="My Content ID of Item" staticname="ContentID" name="ContentID" displayname="ContentID" type="Text" group="Sample Site Columns" sourceid="http://schemas.microsoft.com/sharepoint/v3"

		Number:
		Field ID="{13b3652a-d543-465d-91cb-a9d625637855}" StaticName="Read_Times" Name ="Read_Times" DisplayName ="Read_Times" Description="Read Time count of Item" Type="Number" Group ="Sample Site Columns" SourceID ="http://schemas.microsoft.com/sharepoint/v3"

		Date Time:
		Field ID="{d076e4d5-c785-4c04-8b56-c1f021721749}" StaticName="CreateDate" Name="CreateDate" DisplayName="Create_Date" Description="Create Date of Item" Group="Sample Site Columns" Type="DateTime" Format="DateOnly" SourceID="http://schemas.microsoft.com/sharepoint/v3/fields"

		Multiple lines of text:
		Field ID="{2ae59f08-0fb0-4a9c-8a31-a180161b1029}" StaticName="PublisherDescription" Name="PublisherDescription" Description="Publisher Description of Item" DisplayName="Publisher_Description" Type="Note" RichText="FALSE" NumLines="6" Group="Sample Site Columns" SourceID="http://schemas.microsoft.com/sharepoint/v3/fields"

		Rich Text HTML:
		Field ID="{13cd0291-df15-4278-9894-630913e4d2b9}" StaticName="AccrediterDescription" Name="AccrediterDescription" DisplayName="Accrediter_Description" Description="Accrediter Description of Item" Type="Note" NumLines="6" RichText="TRUE" RichTextMode="FullHtml" Group="Sample Site Columns" SourceID="http://schemas.microsoft.com/sharepoint/v3/fields"

		Publishing HTML:
		Field ID="{E2CC0231-FA6C-4F90-839C-118C304DFCF1}" StaticName="PMediaDescription" Name="PMediaDescription" DisplayName="MediaDescription" Type="HTML" RichText="TRUE" RichTextMode="ThemeHtml" Group="Site Columns" SourceID="http://schemas.microsoft.com/sharepoint/v3" UnlimitedLengthInDocumentLibrary ="TRUE"

		Publishing Image:
		field id="{148e8191-afe7-4422-b1d1-7202eda667f1}" description="Image 1 link of Item" staticname="PImageID1" name="PImageID1" displayname="Image_ID1" type="Image" group="My Site Columns" sourceid="http://schemas.microsoft.com/sharepoint/v3" richtext="TRUE" richtextmode="ThemeHtml">


		HyperLink & Image:
		Field ID="{635a2031-2088-4413-b54e-d2af5daf08bf}" StaticName="ImageAuthor" Name="ImageAuthor" DisplayName="Image_Author" Description="Author Image" Type="URL" Format="Image" Group="Sample Site Columns" SourceID="http://schemas.microsoft.com/sharepoint/v3/fields"


		YES/No Boolean:
		<Field ID="{11018312-58f9-4eb0-867d-71298f82d98d}" Name="isActive" StaticName="isActive" DisplayName="isActive" Description="Select if Item is Active" Group="Sample Site Columns" SourceID="http://schemas.microsoft.com/sharepoint/v3" Type="Boolean"&gt;
		<default>0</default>
		</FIELD>

		CHOICES:
		<Field ID="{67f8faa4-e3ee-44bf-a3b4-6e7fc9c6b9fe}" Name="Market" StaticName="Market" DisplayName="Market" Description="Market of the Country" Group="Sample Site Columns" SourceID="http://schemas.microsoft.com/sharepoint/v3" Type="Choice"&gt;
		<choices>
		choice>Gold</choice
		</choices>
		</FIELD>

		MultiSelect:
		<Field Type="MultiChoice" DisplayName="Labels_Selected" FillInChoice="FALSE" Group="Sample Site Columns" ID="{2fdf0ba7-0052-4e9f-80f6-e7669ac4ae4f}" SourceID="http://schemas.microsoft.com/sharepoint/v3" StaticName="LabelsSelected" Name="LabelsSelected"&gt;
		</FIELD>

		Lookup Columns:
		Field Type="Lookup" ID="{FE45AC76-C0E2-46C8-A047-E8C43C10315C}" Name="LU_Country" StaticName="LU_Country" DisplayName="LU_Country" Required="FALSE" List="Lists/Region Country Master" ShowField="RollOutCountry" UnlimitedLengthInDocumentLibrary="FALSE" SourceID="http://schemas.microsoft.com/sharepoint/v3/fields" Group="Sample Site Columns"

		Multi Lookup Columns:
		Field Type="LookupMulti" Mult="TRUE" ID="{85062ACF-315B-460A-B756-2230A5FE082F}" Name="LU_Language" StaticName="LU_Language" DisplayName="LU_Language" Required="FALSE" List="Lists/Language Master" ShowField="Title" UnlimitedLengthInDocumentLibrary="FALSE" SourceID="http://schemas.microsoft.com/sharepoint/v3/fields" Group="Sample Site Columns"

		Lookup with Additional Field Lookup column:
		Field Type="Lookup" ID="{9AA2985D-AA17-4EA2-9556-9B0E112A64F6}" Name="LU_ApplicationType" StaticName="LU_ApplicationType" DisplayName="LU_ApplicationType" Required="FALSE" List="Lists/Application Type" ShowField="ApplicationType" UnlimitedLengthInDocumentLibrary="FALSE" SourceID="http://schemas.microsoft.com/sharepoint/v3/fields" Group="Sample Site Columns"

		Field Type="Lookup" ID="{668D51C4-804D-43E7-8211-950AE3BCD9A3}" Name="LU_ApplicationType_ID" StaticName="LU_ApplicationType_ID" DisplayName="LU_ApplicationType_ID" List="Lists/Application Type" ShowField="ApplicationTypeID" FieldRef="9AA2985D-AA17-4EA2-9556-9B0E112A64F6" ReadOnly="TRUE" UnlimitedLengthInDocumentLibrary="FALSE" SourceID="http://schemas.microsoft.com/sharepoint/v3/fields" Group="Sample Site Columns"

        */


        var createdField = fields.addFieldAsXml(fieldXml, false, SP.AddFieldOptions.AddToNoContentType);
 
        ctx.load(fields);
        ctx.load(createdField);
        ctx.executeQueryAsync(onProvisionFieldSuccess, onProvisionFieldFail);
    }

    function onProvisionFieldSuccess () {
        blingpoint.log.debug('Field provisioned in host web successfully.');
    }

    function onProvisionFieldFail (sender, args) {
        blingpoint.log.warn('Failed to provision field into host web. Error:' + sender.statusCode);
    }


	function CreateContentTypeInHost (ctypeName, ctypeDescription, ctypeGroup) {
        hostWebContentTypes = web.get_contentTypes();
        var cTypeInfo = new SP.ContentTypeCreationInformation();
        cTypeInfo.set_name(ctypeName);
        cTypeInfo.set_description(ctypeDescription);
        cTypeInfo.set_group(ctypeGroup);
        hostWebContentTypes.add(cTypeInfo);
        ctx.load(hostWebContentTypes);
        ctx.executeQueryAsync(onProvisionContentTypeSuccess, onProvisionContentTypeFail);
    }

    function onProvisionContentTypeSuccess () {
        blingpoint.log.debug('Content type provisioned in host web successfully.');
     }

    function onProvisionContentTypeFail (sender, args) {
        blingpoint.log.warn('Failed to provision content type into host web. Error:' + sender.statusCode);
    }


	function AddFieldToContentTypeInHost (ctypeName, fieldInternalName) {
        
        createdFieldInternalName = fieldInternalName;
        createdContentTypeName = ctypeName;
 
        // re-fetch created items..
        createdField = web.get_fields().getByInternalNameOrTitle(fieldInternalName);
        ctx.load(createdField);
        
        hostWebContentTypes = web.get_contentTypes();
        ctx.load(hostWebContentTypes);
       
        ctx.executeQueryAsync(onItemsRefetchedSuccess, onItemsRefetchedFail);
        }

    function onItemsRefetchedSuccess () {
        performAddFieldToContentTypeInHost(createdContentTypeName, createdFieldInternalName);
    }

    function onItemsRefetchedFail (sender, args) {
        blingpoint.log.warn('Failed to re-fetch field and content type. Error:' + sender.statusCode);
    }

    function performAddFieldToContentTypeInHost (ctypeName, fieldInternalName) {
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
            ctx.executeQueryAsync(onAddFieldToContentTypeSuccess, onAddFieldToContentTypeFail);
        }
        else {
            blingpoint.log.warn('Failed to add field to content type - check the content type exists!');
        }
    }

    function onAddFieldToContentTypeSuccess () {
        blingpoint.log.debug('Field added to content type in host web successfully.');
    }
    
    function onAddFieldToContentTypeFail (sender, args) {
        blingpoint.log.warn('Failed to add field to content type. Error:' + sender.statusCode);
    }





	function AddExistingContentTypetoList(listName, ContentTypeId) {
        
        var contentTypeCollection;
        var contentType;
        var listCollection;
        var list;
        var listContentTypeColl;

        var clientContext = ctx;
        
        contentTypeCollection = web.get_contentTypes();
        contentType = contentTypeCollection.getById(ContentTypeId);
        listCollection = web.get_lists();
        list = listCollection.getByTitle(listName);
        listContentTypeColl = list.get_contentTypes();
        listContentTypeColl.addExistingContentType(contentType);
        ctx.load(listContentTypeColl);
        ctx.executeQueryAsync(onaAdExistingContentTypetoListSucceeded, onAddExistingContentTypetoListFailed);
    
    } 

    function onaAdExistingContentTypetoListSucceeded() {
		blingpoint.log.debug('Content Type added successfully');
    } 
    
    function onAddExistingContentTypetoListFailed(sender, args) {
        blingpoint.log.warn('Request failed. ' + args.get_message() + '\n' + args.get_stackTrace());
    }



function IsUserMemberOf(groupIdOrName, callbackFunctionIfMember, callbackFunctionIfNotMember) {

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
 



	/*-------------------------------------------------------------
		Store
		-------------------------------------------------------------*/
		function LoadPlugIns() {

			var list = web.get_lists().getByTitle("BlingPointPlugIns");
			var camlQuery = new SP.CamlQuery();
			var q = '<View><RowLimit>50</RowLimit></View>';

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
				}, 
				function(sender, args){
					blingpoint.log.error('request failed ' + args.get_message() + '\n' + args.get_stackTrace());	
				}
			);
		}	


	/*-------------------------------------------------------------
		UI
		-------------------------------------------------------------*/
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


	/*-------------------------------------------------------------
		Sites
	-------------------------------------------------------------*/
	function CreateSite(siteTitle, siteDescription, siteUrl, siteLanguage, siteTemplate, inheritsPermissions, callBackFunction) {

	// siteLanguage : http://technet.microsoft.com/en-us/library/ff463597.aspx
	// siteTemplate : https://www.nothingbutsharepoint.com/sites/devwiki/SP2010Dev/Pages/Site%20Templates%20in%20SharePoint%202010.aspx
	// Exemple : czaCreateSite('monblog','madesc','blog1',1033, 'BLOG#0', true);
	// Blank : STS#1
	
	ExecuteOrDelayUntilScriptLoaded(
		
		function() {

			var webCreateInfo = new SP.WebCreationInformation();
			webCreateInfo.set_title(siteTitle);
			webCreateInfo.set_description(siteDescription);
			webCreateInfo.set_url(siteUrl);
			webCreateInfo.set_language(siteLanguage);
			webCreateInfo.set_webTemplate(siteTemplate);
			webCreateInfo.set_useSamePermissionsAsParentSite(inheritsPermissions);

			oNewWebsite = web.get_webs().add(webCreateInfo);

				// Charger dans le load les propriétés à initialiser
				//clientContext.load(this.oNewWebsite,'Title', 'Created','ServerRelativeUrl');

				ctx.load(oNewWebsite);

				ctx.executeQueryAsync(

					function (sender, args) {
						
						var createdSiteUrl;
						
						createdSiteUrl = oNewWebsite.get_serverRelativeUrl();
						
						log.info('Site Created');
						log.debug('Site Url : ' + createdSiteUrl);

						callBackFunction(createdSiteUrl);
						
					},

					function (sender, args) {
						log.warn('Site creation failed : ' + args.get_message() + '\n' + args.get_stackTrace());
					}

					);
				
			},
			"sp.js"
			);  

}

	/*-------------------------------------------------------------
		Lists
		-------------------------------------------------------------*/
		function CreateList(listName, listTemplate, displayInQuickLaunch) {

		//Let's create list creation information object 
		var listCreationInfo = new SP.ListCreationInformation(); 

		// Nom de la liste
		listCreationInfo.set_title(listName);
		
		// Définition du type
		// Référence : http://msdn.microsoft.com/fr-fr/library/ee549420(en-us).aspx
		/*
			SP.ListTemplateType.GenericList
			SP.ListTemplateType.DocumentLibrary
			SP.ListTemplateType.Survey
			SP.ListTemplateType.Announcements
			SP.ListTemplateType.Contacts
			SP.ListTemplateType.Events
			SP.ListTemplateType.Tasks
			SP.ListTemplateType.DiscussionBoard
			SP.ListTemplateType.PictureLibrary
			SP.ListTemplateType.DataSources
			SP.ListTemplateType.XmlForm
			SP.ListTemplateType.NoCodeWorkflows
			SP.ListTemplateType.WorkflowProcess
			SP.ListTemplateType.WebPageLibrary
			SP.ListTemplateType.CustomGrid
			SP.ListTemplateType.WorkflowHistory
			SP.ListTemplateType.GanttTasks
			SP.ListTemplateType.IssuesTracking
		*/
		switch (listTemplate) {
			case 100:
			listCreationInfo.set_templateType(SP.ListTemplateType.genericList); 
			break;
			case 104:
			listCreationInfo.set_templateType(SP.ListTemplateType.announcements); 
			break;
			default: 
			listCreationInfo.set_templateType(SP.ListTemplateType.announcements); 
			break;
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
				log.debug('Created');
				blingpoint.ui.addNotification("List <b>" + oList.get_title() + "</b> created...", false);
			},
			function(sender, args){
				handleManagedError("Operation was cancelled...", sender, args);
				log.debug('Error');
				blingpoint.ui.addNotification("Operation was cancelled...", false);
			}
			); 

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

		"sp.js");

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
		window[ BLINGPOINT_PLUGINS_NAMESPACE ].loadPlugIns = LoadPlugIns;

		window[ BLINGPOINT_SCHEMA_NAMESPACE ].createField = CreateField;
		window[ BLINGPOINT_SCHEMA_NAMESPACE ].createContentTypeInHost = CreateContentTypeInHost;
		window[ BLINGPOINT_SCHEMA_NAMESPACE ].addFieldToContentTypeInHost = AddFieldToContentTypeInHost;
		window[ BLINGPOINT_SCHEMA_NAMESPACE ].addExistingContentTypetoList = AddExistingContentTypetoList;
		
		window[ BLINGPOINT_SECURITY_NAMESPACE ].isUserMemberOf = IsUserMemberOf;

		window[ BLINGPOINT_PARAMETERS_NAMESPACE ].setWebSiteProperty = SetWebSiteProperty;
		window[ BLINGPOINT_PARAMETERS_NAMESPACE ].getWebSiteProperty = GetWebSiteProperty;


		window[ BLINGPOINT_UI_NAMESPACE ].addStatus = AddStatus;
		window[ BLINGPOINT_UI_NAMESPACE ].removeStatus = RemoveStatus;
		window[ BLINGPOINT_UI_NAMESPACE ].removeAllStatus = RemoveAllStatus;
		window[ BLINGPOINT_UI_NAMESPACE ].addNotification = AddNotification;
		window[ BLINGPOINT_UI_NAMESPACE ].removeNotification = RemoveNotification;
		window[ BLINGPOINT_UI_NAMESPACE ].openDialog = OpenDialog;

		window[ BLINGPOINT_SITES_NAMESPACE ].createSite = CreateSite;

		window[ BLINGPOINT_LISTS_NAMESPACE ].createList = CreateList;

		window[ BLINGPOINT_ITEMS_NAMESPACE ].updateItem = UpdateItem;
		window[ BLINGPOINT_ITEMS_NAMESPACE ].updateItemUrl = UpdateItemUrl;
		window[ BLINGPOINT_ITEMS_NAMESPACE ].createItem = CreateItem;

		window[ BLINGPOINT_ROOT_NAMESPACE ].plugins = window[ BLINGPOINT_PLUGINS_NAMESPACE ];
		window[ BLINGPOINT_ROOT_NAMESPACE ].schema = window[ BLINGPOINT_SCHEMA_NAMESPACE ];
		window[ BLINGPOINT_ROOT_NAMESPACE ].security = window[ BLINGPOINT_SECURITY_NAMESPACE ];
		window[ BLINGPOINT_ROOT_NAMESPACE ].parameters = window[ BLINGPOINT_PARAMETERS_NAMESPACE ];
		window[ BLINGPOINT_ROOT_NAMESPACE ].ui = window[ BLINGPOINT_UI_NAMESPACE ];
		window[ BLINGPOINT_ROOT_NAMESPACE ].sites = window[ BLINGPOINT_SITES_NAMESPACE ];
		window[ BLINGPOINT_ROOT_NAMESPACE ].lists = window[ BLINGPOINT_LISTS_NAMESPACE ];
		window[ BLINGPOINT_ROOT_NAMESPACE ].items = window[ BLINGPOINT_ITEMS_NAMESPACE ];

	})();
