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
