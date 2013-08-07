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
