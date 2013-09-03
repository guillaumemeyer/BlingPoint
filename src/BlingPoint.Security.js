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

		var collGroup = blingpointWeb.get_siteGroups();
		blingpointContext.load(collGroup);

		blingpointContext.executeQueryAsync(

			function (sender, args) {

				var oGroup;
				if (blingpoint.global.isNumber(groupIdOrName)) {
					oGroup = collGroup.getById(groupIdOrName);
				}
				else {
					oGroup = collGroup.getByName(groupIdOrName);
				}

				var collUser = oGroup.get_users();
				blingpointContext.load(collUser);
				blingpointContext.executeQueryAsync(

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
