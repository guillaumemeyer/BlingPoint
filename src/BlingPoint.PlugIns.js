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
			$p.schema.addExistingContentTypetoList('BlingPointPlugIns', 'BlingPointPlugIn', createBlingPointPlugInLibrary, null);
		}
		function createBlingPointPlugInLibrary() {
			$p.lists.createList('BlingPointAssets', SP.ListTemplateType.documentLibrary, false, null, null);
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



	// Namespaces
	window[ BLINGPOINT_PLUGINS_NAMESPACE ].loadPlugIns = LoadPlugIns;
	window[ BLINGPOINT_PLUGINS_NAMESPACE ].setupPlugInSystem = SetupPlugInSystem;

	window[ BLINGPOINT_ROOT_NAMESPACE ].plugins = window[ BLINGPOINT_PLUGINS_NAMESPACE ];
	
})();
