/**
 * Collectiveaccess user interface for object edition model
 * 
 * @class Models.ca-model
 * @uses core
 * @uses http
 * @uses utilities
 */
var APP = require("core");
var HTTP = require("http");
var UTIL = require("utilities");
var DBNAME = "Newport";
var table =  "ca_objects";
	
function Model() {
	this.TABLE="";

	/**
	 * Initializes the model
	 * @param {Number} _id The UID of the component
	 */
	this.init = function(_ca_table) {
		APP.log("debug", "CA_OBJECT_DETAILS.init(" + _ca_table + "_details)");

		this.TABLE = _ca_table;
		var db = Ti.Database.open(DBNAME);
		var request = "CREATE TABLE IF NOT EXISTS " + _ca_table + "_details (id INTEGER PRIMARY KEY AUTOINCREMENT, object_id INTEGER, thumbnail TEXT, json TEXT);";
		APP.log("debug", request);		
		db.execute(request);

		db.close();
	};

	/**
	 * Fetches the remote data
	 * @param {Object} _params The request paramaters to send
	 * @param {String} _params.url The URL to retrieve data from
	 * @param {Function} _params.callback The function to run on data retrieval
	 * @param {Function} _params.error The function to run on error
	 * @param {Number} _params.cache The length of time to consider cached data 'warm'
	 */
	this.fetch = function(_params) {
		APP.log("debug", "CA_OBJECT_DETAILS.fetch");

		var isStale = UTIL.isStale(_params.url, _params.cache);

		if(isStale) {
			if(_params.cache !== 0 && isStale !== "new") {
				_params.callback();
			}

			HTTP.request({
				timeout: 100000,
				headers: [{name: 'Authorization', value: _params.authString}],
				type: "GET",
				format: "JSON",
				//format:"text",
				url: _params.url,
				passthrough: _params.callback,
				success: this.handleData,
				//success: this.echoData,
				failure: _params.error
			});
		} else {
			_params.callback();
		}
	};
	
	/**
	 * Useful to only log the data return when debugging
	 * @param {Object} _data The returned data
	 * @param {String} _url The URL of the remote source
	 * @param {Function} _callback The function to run on data retrieval
	 */
	this.echoData = function(_data, _url, _callback) {
		Ti.API.info(_data);
	};

	/**
	 * Handles the data return
	 * @param {Object} _data The returned data
	 * @param {String} _url The URL of the remote source
	 * @param {Function} _callback The function to run on data retrieval
	 */
	this.handleData = function(_data, _url, _callback) {
		var _ca_table = table;
		APP.log("debug", "CA_OBJECT_DETAILS.handleData");
		if(_data.ok == true) {
			APP.log("debug", "connected");
			var db = Ti.Database.open(DBNAME);
			db.execute("DELETE FROM " + _ca_table + "_detail;");
			db.execute("BEGIN TRANSACTION;");
			
			APP.ca_modele_prop = new Array();
			APP.ca_modele_values = {};
			var ca_table = "ca_objects";
			
			// Browsing data
		    /*for (var prop in _data) {
		    	var record_type = prop;
		        var _data2 = _data[prop];
		    	if(prop != "ok") {
		        	for (var prop2 in _data2) {
						var record = _data2[prop2];
		        		
		        		var request = "INSERT INTO " + _ca_table + " (id, ca_table, object_id, parent_id, idno, display_label, created) VALUES (NULL, ?, ?, ?, ?, ?, ?);";
						db.execute(request, _ca_table, record["object_id"], record["parent_id"], record["idno"], record["display_label"], record["created"]["timestamp"]);

		        		last = prop2;
	        		} 
		        }
		    }
			*/
			db.execute("INSERT OR REPLACE INTO updates (url, time) VALUES(" + UTIL.escapeString(_url) + ", " + new Date().getTime() + ");");
			db.execute("END TRANSACTION;");
			db.close();
		}

		if(_callback) {
			_callback();
		}
	};

	/**
	 * Retrieves first level info
	 */
	this.getModelFirstLevelInfo = function() {
		return APP.ca_modele_prop;
	};

	this.getMainObjectInfo = function(_id) {
		return _id;
	}

}

module.exports = function() {
	return new Model();
};