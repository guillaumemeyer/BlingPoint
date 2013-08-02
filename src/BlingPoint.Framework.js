/**
 * BlingPoint Framework Module
 * @module Framework
 */
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

	
	
	// Initialize blingpoint framework common objects
	function InitWeb() {

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
				blingpoint.plugins.loadPlugIns();
			},
			function (sender, args) {
				blingpoint.log.error('request failed ' + args.get_message() + '\n' + args.get_stackTrace());
			}
		);

	}

	ExecuteOrDelayUntilScriptLoaded(InitWeb,"sp.js");




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
				callBackFunctionOnSuccess();
			},
			function (sender, args){
				blingpoint.log.warn('Failed to provision field into host web. Error:' + sender.statusCode);
				callBackFunctionOnError();
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
				callBackFunctionOnSuccess();
			},
			function (sender, args){
				blingpoint.log.warn('Failed to provision content type into host web. Error:' + sender.statusCode);
				callBackFunctionOnError();
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
				callBackFunctionOnError();
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
					callBackFunctionOnSuccess();
				},
				function (sender, args) {
					blingpoint.log.warn('Failed to add field to content type. Error:' + sender.statusCode);
					callBackFunctionOnError();
				}
			);
		}
		else {
			blingpoint.log.warn('Failed to add field to content type - check the content type exists!');
			callBackFunctionOnError();
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
				callBackFunctionOnError();
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
				callBackFunctionOnSuccess();
			},
			function (sender, args) {
				blingpoint.log.warn('Request failed. ' + args.get_message() + '\n' + args.get_stackTrace());
				callBackFunctionOnError();
			}
		);
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
	PlugIns
	-------------------------------------------------------------*/
	function SetupPlugInSystem() {

		function provisionBlingPointPlugInSystem() {
			createBlingPointPlugInList();
		}
		function createBlingPointPlugInList() {
			$p.lists.createList('BlingPointPlugIns', SP.ListTemplateType.genericList, false, createBlingPointPlugInContentType, null);	
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
			$p.schema.addExistingContentTypetoList('BlingPointPlugIns', 'BlingPointPlugIn', null, null);
		}
		provisionBlingPointPlugInSystem();
	}

	function LoadPlugIns() {

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
			}, 
			function(sender, args){
				blingpoint.log.error('request failed ' + args.get_message() + '\n' + args.get_stackTrace());
				blingpoint.log.error('If the list BlingPointPlugIns does not exist, <a href="javascript:$p.plugins.setupPlugInSystem();">click here to setup BlingPoint !</a>');
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
	function CreateList(listName, listTemplate, displayInQuickLaunch, callBackFunctionOnSuccess, callBackFunctionOnError) {

		//Let's create list creation information object 
		var listCreationInfo = new SP.ListCreationInformation(); 

		// Nom de la liste
		listCreationInfo.set_title(listName);
		
		/*
		Définition du type
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
				callBackFunctionOnSuccess();
			},
			function (sender, args){
				handleManagedError("Operation was cancelled...", sender, args);
				blingpoint.log.warn("List creation operation was cancelled...", false);
				callBackFunctionOnError();
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
	window[ BLINGPOINT_PLUGINS_NAMESPACE ].loadPlugIns = LoadPlugIns;
	window[ BLINGPOINT_PLUGINS_NAMESPACE ].setupPlugInSystem = SetupPlugInSystem;

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
