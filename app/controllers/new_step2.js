/**
 * Controller for the edit screen
 *
 * @class Controllers.edit
 * @uses core
 */
var APP = require("core");
var UTIL = require("utilities");
var DATE = require("alloy/moment");
var HTTP = require("http");
var COMMONS = require("ca-commons");
var BUFFER = require("ca-editbuffer");

var MODEL_MODEL = require("models/ca-model")();
var UI_MODEL = require("models/ca-ui")();
var OBJECT_DETAILS = require("models/ca-object-details")();
var OBJECT_EDIT = require("models/ca-object-edit")();

var CONFIG = arguments[0];

var FLAG_SAVE = false;

// Pseudo constants
var ca_main_tables = ["ca_entities", "ca_object_lots", "ca_storage_locations", "ca_places", "ca_collections", "ca_loans", "ca_movements"];

// Initializes original values and target buffer where modified values will go
//Ti.App.EDIT = {};



$.heading.text = "New ";
$.heading.text += CONFIG.type_info.display_label;

// Temporary fixing the table we"re editing, need to come through CONFIG after
$.TABLE = "ca_objects";
// List of all screen
$.SCREENS = [];
// Index of the screen we want to display, default -1 (first available)
$.SCREEN = "";

$.UI_CODE = "";

// Global variable for this controller to store the object details
$.RECORD = {};

// Global variable to store default values for an empty bundle
$.EMPTY_BUNDLE = {};

$.init = function() {

	// loading url & cache validity from settings
	CONFIG.validity = APP.Settings.CollectiveAccess.urlForHierarchy.cache;
	//alert(CONFIG.type_info);
	// Initiating CA db model class
	MODEL_MODEL.init($.TABLE);
	// Initiating CA available UIs class
	UI_MODEL.init();
	// Initiating detail fetching for object
	CONFIG.obj_data = {};
	//alert(CONFIG.type_info);
	CONFIG.obj_data.info1 = CONFIG.type_info.item_id;
	//OBJECT_DETAILS.init($.TABLE);
	// Initiating edit model for object
	var timestamp = new Date().getTime();
	CONFIG.obj_data.false_id = "new_"+ timestamp;
	APP.log("debug", CONFIG.obj_data.false_id);
	OBJECT_EDIT.init($.TABLE, CONFIG.obj_data.false_id);

	// Credentials are inside app.json file
	APP.ca_login=APP.Settings.CollectiveAccess.login;
	APP.ca_password=APP.Settings.CollectiveAccess.password;

	// Defining global variables for styling
	Alloy.Globals.primaryColor =  APP.Settings.colors.primary;
	Alloy.Globals.secondaryColor = APP.Settings.colors.secondary;
	Alloy.Globals.fieldsColor = APP.Settings.colors.secondary;

	$.screenButtonsScrollView.setBackgroundColor(APP.Settings.colors.primary);
	$.NavigationBar.setBackgroundColor(APP.Settings.colors.primary);

	APP.authString = 'Basic ' +Titanium.Utils.base64encode(APP.ca_login+':'+APP.ca_password);

	// Loading CA database model (metadatas & fields) & filling cache
	CONFIG.model_url = APP.Settings.CollectiveAccess.urlBase+"/"+APP.Settings.CollectiveAccess.urlForModel.url;
	CONFIG.model_url_validity = APP.Settings.CollectiveAccess.urlForModel.cache;

	// Loading CA screens & uis & filling cache
	CONFIG.ui_url = APP.Settings.CollectiveAccess.urlForUis.url;
	CONFIG.ui_url_validity = APP.Settings.CollectiveAccess.urlForUis.cache;

	$.retrieveData();




	// uiRetrieveData is called from objectRetrieveCallbackFunctions : we need to have the values available before displaying bundles
	//$.uiRetrieveData();

	// Loading object details
	// Loading URL for object details, replacing ID by the current object_id
	/*CONFIG.object_url = APP.Settings.CollectiveAccess.urlForObjectDetails.url.replace(/ID/g,CONFIG.obj_data.false_id);
	CONFIG.object_url_validity = APP.Settings.CollectiveAccess.urlForObjectDetails.cache;

	// Loading URL for base object edition data, replacing ID by the current object_id
	CONFIG.base_edit_url = APP.Settings.CollectiveAccess.urlForObjectEdit.url.replace(/ID/g,CONFIG.obj_data.false_id);
	CONFIG.base_edit_url_validity = APP.Settings.CollectiveAccess.urlForObjectEdit.cache;
	*/
	// objectRetrieveData is called from modelRetrieveCallbackFunctions : we need to have the metadata elements available before
	//$.objectRetrieveData();

	if(CONFIG.isChild === true) {
		$.NavigationBar.showBack(function(_event) {
			APP.removeChild();
		});
	} else {
		if(APP.Settings.useSlideMenu) {
			$.NavigationBar.showMenu(function(_event) {
				APP.toggleMenu();
			});
		} else {
			$.NavigationBar.showSettings(function(_event) {
				//APP.openSettings();
			});
		}
	}

	//$.NavigationBar.text = "Archivio Teatro Regio";
};

$.retrieveData = function(_force, _callback){
	$.modelRetrieveData(_force, _callback);
}

$.modelRetrieveCallbackFunctions = function () {
	$.modelHandleData(MODEL_MODEL.getElementsByType(CONFIG.type_info.idno));
};

/**
 * Retrieves the model data
 * @param {Object} _force Whether to force the request or not (ignores cached data)
 * @param {Object} _callback The function to run on data retrieval
 */
$.modelRetrieveData = function(_force, _callback) {
	if(COMMONS.isCacheValid(CONFIG.model_url,CONFIG.model_url_validity)) {
		APP.log("debug","ca-model cache is valid");
	} else {
		APP.log("debug","ca-model cache is invalid");
	};

		MODEL_MODEL.fetch({
			url: CONFIG.model_url,
			authString: APP.authString,
			cache: 0,
			callback: function() {
				$.modelRetrieveCallbackFunctions();

				if(typeof _callback !== "undefined") {
					_callback();
				}
			},
			error: function() {
				$.updateRightButtonRefresh();
				Ti.API.log("debug","Connexion failed. Please retry.");
				if(typeof _callback !== "undefined") {
					_callback();
				}
			}
		});

};

/**
 * Handles the data return
 * @param {Object} _data The returned data
 */
$.modelHandleData = function(_data) {
	CONFIG.elements= _data;
	//APP.log("debug", CONFIG.elements);
	$.objectRetrieveData();
};

$.uiRetrieveCallbackFunctions = function() {
	// Getting default (aka first) available ui for the record type we have

	$.UI_CODE = UI_MODEL.getFirstAvailableUIForTable($.TABLE).code;
	// Fetching defaulft (aka first) available screen for this UI
	if($.SCREEN == "") {
		$.uiHandleData(UI_MODEL.getFirstAvailableScreenWithContentForUI($.TABLE,$.UI_CODE));
	} else {
		$.uiHandleData(UI_MODEL.getContentForScreen($.TABLE,$.UI_CODE,$.SCREEN));
	}
};

$.uiRetrieveData = function(_force, _callback) {

	// Initializes original values and target buffer where modified values will go
	/*Ti.App.EDIT = {};
	Ti.App.EDIT.VALUES = {};
	Ti.App.EDIT.BUFFER = {};*/

	if(COMMONS.isCacheValid(CONFIG.ui_url,CONFIG.ui_url_validity)) {
		$.uiRetrieveCallbackFunctions();
	} else {

		UI_MODEL.fetch({
			url: CONFIG.ui_url,
			authString: APP.authString,
			cache: 0,
			callback: function() {
				$.uiRetrieveCallbackFunctions();

				if(typeof _callback !== "undefined") {
					_callback();
				}
			},
			error: function() {
				$.updateRightButtonRefresh();
				var dialog = Ti.UI.createAlertDialog({
					    message: 'Connexion failed. Please retry.',
					    ok: 'OK',
					    title: 'Error'
					  }).show();

				if(typeof _callback !== "undefined") {
					_callback();
				}
			}
		});
	}
};

$.uiHandleData = function(_data) {
	//APP.openLoading();

	//////////////////////////////////////////////////////////////////////////
	////////////////SCREENS TOP MENU SECTION//////////////////////////////////

	// If the list of the screens is not initiated, populate it from the model
	//informations : Screen names and labels
	//PROBLEM: WE NEED INFORMATIONS ABOUT TYPE RESTRICTION HERE

	//if($.SCREENS.length == 0) {
	$.SCREENS = UI_MODEL.getAllScreensWithContentForUI($.TABLE,$.UI_CODE);
	//}

	// Create a label for each screen defined for this object type, and add it to $.screenButtonsScrollView
	var labels= [];
	if ($.screenButtonsScrollView.children.length == 0) {
		for(var index in $.SCREENS) {
			if(typeof ($.SCREENS[index].content!= "undefined")) {
				if ((typeof $.SCREENS[index].content.typeRestrictions) != "undefined") {
					var type_restrictions = $.SCREENS[index].content.typeRestrictions;
					if(type_restrictions[CONFIG.type_info.item_id]!= null){
						var labelMargin = Ti.UI.createView();
						$.addClass(labelMargin,"buttonMargin");
						var label = Ti.UI.createLabel({
						    color: '#000',
						    text: $.SCREENS[index].preferred_labels,
						    textAlign: 'center',
						    code:$.SCREENS[index].code
						});
						$.addClass(label,"button");
						labelMargin.add(label);
						$.screenButtonsScrollView.add(labelMargin);
					}
				} else {
					var labelMargin = Ti.UI.createView();
					$.addClass(labelMargin,"buttonMargin");
					var label = Ti.UI.createLabel({
					    color: '#000',
					    text: $.SCREENS[index].preferred_labels,
					    textAlign: 'center',
					    code:$.SCREENS[index].code
					});
					$.addClass(label,"button");
					labelMargin.add(label);
					$.screenButtonsScrollView.add(labelMargin);
				}

			}

		}
	}
	//////////////////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////////

	var rows=[];

	var i = 0;

	//////////////////////////////////////////////////////////////////////////
	////////////////////////BUNDLES SECTION///////////////////////////////////

	// error handling if _data has not been rightly fetched back
	if (typeof _data != "undefined") {
		//APP.log("debug", "UI HANDLE DATA DATA:")
		//APP.log("debug", _data);
		if (typeof _data.content != "undefined") {
			// If we have some content back
			//FILTER SCREENS patern. Has been moved on the right place
			/*
			if (typeof _data.content.typeRestrictions != "undefined") {
				var type_restrictions = _data.content.typeRestrictions;
				APP.log("debug", type_restrictions);
				if(type_restrictions[CONFIG.type_info.item_id]== null){
					alert("no!");
				}
				else{
					alert(type_restrictions[CONFIG.type_info.item_id]);
				}
			} else {
				alert("type restrictions undefined => yes");
			}*/
			//END OF FILTER SCREENS
			//APP.log("debug", _data.content);
			var screen_content = _data.content.screen_content;
			for(var bundle in screen_content) {
				var bundle_code = screen_content[bundle].bundle_code;
				if(i<50) {
					// Test if we're in presence of an attribute
					if (bundle_code.substring(0, 13) == "ca_attribute_") {

						// If the bundle described in the screen corresponds to sthg in the model, display it
						var attribute = bundle_code.replace(/^ca_attribute_/,"");

						APP.log("debug", "ATTRIBUT:");
						APP.log("debug", attribute);

						//this test is not so useful because it doesn't filter metadatas by object type
						if (MODEL_MODEL.hasElementInfo("ca_objects", attribute) > 0) {
							if(CONFIG.elements.indexOf(attribute)== -1){
								APP.log("debug", "attribute not found");
							}
							else {
								APP.log("debug", CONFIG.elements[CONFIG.elements.indexOf(attribute)]);
								APP.log("debug", "attribute found");
								var values = $.EMPTY_BUNDLE;

								var element_data = MODEL_MODEL.getElementInfo("ca_objects", attribute);

								var row = Alloy.createController("edit_metadata_bundle", {
									bundle_code:bundle_code,
									content:element_data,
									values:values,
									newport_id:{0:i}
								}).getView();
								rows.push(row);
							}
						}
					} else {

						if (bundle_code == "ca_object_representations")
						{
							var row = Alloy.createController("edit_media_photo", {
								bundle_code:bundle_code,
							}).getView();
							rows.push(row);
						}
						else
						{
							var attribute = bundle_code;
							APP.log("debug", "INTRINSIC FIELD");
							APP.log("debug", attribute);
							//TODO:
							//DISPLAY INTRINSIC FIELDS
						}
					}

				};
				i++;
			};
		}
	}
	//////////////////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////////


	$.bundles.removeAllChildren();
	$.bundles.setData(rows);
	for(var x=0; x<rows.length; x++) {
		$.bundles.add(rows[x]);
		// Close loading on the last view addition
		if(x==(rows.length - 1)) {
		}
	}
	APP.closeLoading();


	// Adding button to save the modifications
	$.updateRightButtonSave();
};


$.objectRetrieveData = function() {
	$.EMPTY_BUNDLE = OBJECT_EDIT.getBundleValueForEmptyOne();

	$.uiRetrieveData();

}

$.objectHandleData = function(_data) {
}

$.screenButtonsScrollView.addEventListener("click", function(_event) {
	// Getting screen code from the code parameter inside the label
	APP.openLoading();
	$.SCREEN = _event.source.code;
	//$.modelRetrieveData();

	setTimeout(function() {
				$.uiRetrieveData();

		   	},500);

	//_event.source.code => ce qu'on veut
});

/*
 * SAVE BUTTON
 */
 save = function () {
 	if ($.hasChanged == true) {
		APP.log("debug","------SAVE-----");

		var itWorked = OBJECT_EDIT.saveChanges();
		//APP.log("debug", "saveChanges worked");

		if(itWorked) {
			//ici, essayer d'envoyer vers le serveur
			if (Titanium.Network.networkType == Titanium.Network.NETWORK_WIFI )
			{
				var dataWasSentSuccessfully = OBJECT_EDIT.sendDataToServerForNewObject(CONFIG);
				if (dataWasSentSuccessfully) {
					$.byeByeUserChoice();
				}

			}
			else
			{
				var dialog = Ti.UI.createAlertDialog({
					title: 'No signal',
				    message: 'Your item will be uploaded as soon a wi-fi will be available',
				    ok: 'OK'
				});
				dialog.show();
				//go back to main page
				// or ask the user: edit another new object, or go back to main page
			}

		} else alert ("echec");

 	}
	else {
		var dialog = Ti.UI.createAlertDialog({
			title: 'Save',
		    message: 'No modification to save',
		    ok: 'OK'
		});
		dialog.show();
	}
 }
$.updateRightButtonSave = function() {
	if(!FLAG_SAVE){
		FLAG_SAVE =true;
		$.NavigationBar.showRight({
			image: "/images/check.png",

			callback: function() {

				var dialog = Ti.UI.createAlertDialog({
				    cancel: 2,
				    buttonNames: ['Save', 'Revert the modifications', 'Cancel'],
				    message: 'Would you like to save your modifications ?',
				    title: 'Save'
				});
				dialog.addEventListener('click', function(e){
					if (e.index === e.source.cancel){
						// Cancel
						Ti.API.info('The cancel button was clicked');
					} else if (e.index == 1) {
						// Revert = reload ui data
						OBJECT_EDIT.cleanEditUpdatesTable();
						$.objectRetrieveData();

					} else if (e.index == 0) {
						// Save
						save();
					}
				});
				dialog.show();
			}
		});
	}
}


$.updateRightButtonRefresh = function() {
	$.NavigationBar.showRight({
		image: "/images/refresh.png",
		callback: function() {
			MODEL_MODEL.fetch({
				url: CONFIG.model_url,
				authString: APP.authString,
				cache: 0,
				callback: function() {
					$.modelRetrieveCallbackFunctions();

					if(typeof _callback !== "undefined") {
						_callback();
					}
				},
				error: function() {
					var dialog = Ti.UI.createAlertDialog({
					    message: 'Connexion failed. Please retry.',
					    ok: 'OK',
					    title: 'Error'
					  }).show();
					if(typeof _callback !== "undefined") {
						_callback();
					}
				}
			});
		}
	});
}

$.byeByeUserChoice = function() {

	var dialog = Ti.UI.createAlertDialog({
		title: 'Success',
	    message: 'Your new object has been saved. What do you want to do?',
	    buttonNames: [ 'Stay on this object for further edition', 'Create another new object', 'Go back to the main page'],
	});
	dialog.addEventListener('click', function(e){
		if (e.index === 1){
			// back to first "new" screen, for a fresh new procedure
			//opens "new"
			Ti.API.info('ANOTHER NEW OBJECT');
			APP.addChild("new", {}, true);
		}
		else
		{
			if (e.index == 2) {
			// go back to the main page
			//opens "main"
				Ti.API.info('BACK TO MAIN PAGE');
				APP.addChild("main", {}, true);
			}
			else
			{
				if (e.index == 0) {
					// stay on this object
					//opens "edit"
					APP.log("debug", "STAY ON THIS OBJECT FOR FURTHER MODIFS");
					APP.log("debug", CONFIG),
					APP.addChild("edit", CONFIG , true);
				}
			}
		}
	});
	dialog.show();
}

Ti.App.addEventListener('event_haschanged', function(e) {

	$.hasChanged = true;
	APP.log("debug", "DEBUG Ti.App.addEventListener");
	//APP.log("debug", e.config);
	var attribute = e.config.bundle_code.replace(/^ca_attribute_/,"");
	APP.log("debug", attribute);

	// Inserting into the temp table
	var vals = {is_origin : 0, is_modified : 0, is_new : 1 };
	vals[e.config.element] = e.value;
	vals.bundle = attribute;
	var new_values2 = [];
	new_values2[0]=vals;
	APP.log("debug",new_values2);
	OBJECT_EDIT.insertTempAddition(e.config.element, new_values2);


});

$.init();
