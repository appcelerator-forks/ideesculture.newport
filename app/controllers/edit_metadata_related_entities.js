/**
 * Controller for entities
 * START VERSION - DOES NOT WORK PROPERLY
 * 
 * @class Controllers.text
 * @uses core
 */
var APP = require("core");
var UTIL = require("utilities");
var DATE = require("alloy/moment");
var BUFFER = require("ca-editbuffer");
var HTTP = require("http");
var HIERARCHY_MODEL = require("models/ca-objects-hierarchy")();

var CONFIG = arguments[0];
var value ="";
var max_results = 3; 
var clickWasOnceDone = false; 

$.TABLE = "ca_entities";

$.init = function() {
	// Defining value, activating or disabling textarea depending of fieldHeight, must be done before init to be available for Handlers
	if (typeof CONFIG.value == "string") {
			value = CONFIG.value;
	};

	// Initiating CA db model class
	var info1 = APP.Settings.CollectiveAccess.urlForHierarchy.info1;
	var info2 = APP.Settings.CollectiveAccess.urlForHierarchy.info2;
	HIERARCHY_MODEL.init($.TABLE, info1, info2);
	$.moreResultsButton.hide(); 
	$.entitiesResearchResultsContainer.hide(); 
	// Field title
	$.label.text=CONFIG.content.display_label+" "+CONFIG.i+" "+CONFIG.j; 
	$.entityfield.value = value;
	$.notes.text = "";
	$.entityfield.addEventListener('change', $.search);
	max_results = 3; 
};

$.fire = function(_data) {
	$.entitiesResearchResults.removeAllChildren(); 
	$.entitiesResearchResultsContainer.hide(); 
	$.moreResultsButton.hide(); 
	max_results = 3; 
	//in value we want the id of the entity
	/*APP.log("debug", "config.content:");
	APP.log("debug", CONFIG.content);
	APP.log("debug", "e.config:");
	APP.log("debug", e.config);*/
	var laconfig = CONFIG; 
	_data.type_id = _data["ca_entities.type_id"];
	laconfig.content = _data; 

	//fills the field with selected entity's display label
	$.entityfield.value = _data.display_label;

	//HERE we have to save infos about the related entity
	Ti.App.fireEvent('event_haschanged', {
		name: 'bar',
		config: laconfig,
		value: _data.entity_id
	});

}

function createRow(data) {
	var title = data.display_label ;
    var tvr = Ti.UI.createTableViewRow({
        title : title
    });

    tvr.addEventListener('click', function() {
		APP.log("fire ! ! !");
		$.fire(data); 
	});
 
    return tvr;
}

$.handleData = function(_data) {
	//afficher une barre de chargement par dessus les résultats?? 
	APP.openLoading();
	$.notes.text = "";
	var table = [];
	$.moreResultsButton.hide(); 
	$.entitiesResearchResults.removeAllChildren(); 
	// If we have data to display...
	if( typeof _data.results === 'object'){
		//APP.log("debug", _data.results);
		var max = 0, entity_nb;
		if(_data.results.length> max_results){
			max = max_results;
		}
		else {
			max = _data.results.length;
		}

		for (entity_nb = 0; entity_nb < max;  entity_nb ++ ) {
			//APP.log("debug", "resultat "+ i);
			table.push(createRow(_data.results[entity_nb]));
		/*	entity_row.addEventListener('click', function() {
				$.entitiesResearchResults.removeAllChildren(); 
			});*/
		}
		$.entitiesResearchResults.setData(table);
		if( max < _data.results.length){
			$.moreResultsButton.show();

			if(!clickWasOnceDone){
				clickwasOnceDone = true; 
				$.moreResultsButton.addEventListener("click", function(_event) {
						max_results = (max_results + 10); 
						$.handleData(_data); 
				});
			}
		}
	}else 
	{ 
		$.notes.text = "no results";
		APP.log("debug","no results :("); 
	}
	APP.closeLoading();
}


$.search = function(e){
	$.entitiesResearchResultsContainer.show(); 
	var _url = APP.Settings.CollectiveAccess.urlForEntitySearch.url.replace(/<your_query>/g, e.value);
	max_results = 3; 
	if(e.value.length >= 3) {
		if (Titanium.Network.networkType !== Titanium.Network.NETWORK_WIFI ) {
			var result = HIERARCHY_MODEL.getSearchedRecordsLocally($.TABLE, e.value);

		} else {
			var result = HIERARCHY_MODEL.getSearchedRecords($.TABLE, e.value, _url, $.handleData);
		}
		return result; 
	}

};




$.validate = function () {
	//TODO

};

$.update = function () {

};


$.init();


