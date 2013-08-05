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



	/*-------------------------------------------------------------
	Namespaces
	-------------------------------------------------------------*/
	window[ BLINGPOINT_SCHEMA_NAMESPACE ].createField = CreateField;
	window[ BLINGPOINT_SCHEMA_NAMESPACE ].createContentTypeInHost = CreateContentTypeInHost;
	window[ BLINGPOINT_SCHEMA_NAMESPACE ].addFieldToContentTypeInHost = AddFieldToContentTypeInHost;
	window[ BLINGPOINT_SCHEMA_NAMESPACE ].addExistingContentTypetoList = AddExistingContentTypetoList;
	
	window[ BLINGPOINT_ROOT_NAMESPACE ].schema = window[ BLINGPOINT_SCHEMA_NAMESPACE ];

})();
