(function () {

    var api = {
        Settings: {},
        Run: function ($) {
            //App Code here
        },
        Start: function ($) {
            //Get the *.myshopify.com domain
            var shop = Shopify.shop;

            //Load the store settings
            api.LoadSettings(shop, function (settings) {
                //Save app settings
                api.Settings = settings;

                //Load the app
                api.Run($);
            });
        },
        ExecuteJSONP: function (url, parameters, callback) {
            //Prepare a function name that will be called when the JSONP request has loaded.
            //It should be unique, to prevent accidentally calling it multiple times.
            var callbackName = "MyApp-JSONPCallback-" + new Date().getMilliseconds();

            //Make the callback function available to the global scope, 
            //otherwise it can't be called when the settings are loaded.
            window[callbackName] = callback;

            //Convert the parameters into a querystring
            var kvps = ["callback=" + callbackName];
            var keys = Object.getOwnPropertyNames(parameters);

            for (var i = 0; i < keys.length; i++) {
                var key = keys[i];
                kvps.push(key + "=" + parameters[key]);
            }

            //Add a unique parameter to the querystring, to overcome browser caching.
            kvps.push("uid=" + new Date().getMilliseconds());

            var qs = "?" + kvps.join("&");

            //Build the script element, passing along the shop name and the load function's name
            var script = document.createElement("script");
            script.src = url + qs;
            script.async = true;
            script.type = "text/javascript";

            //Append the script to the document's head to execute it.
            document.head.appendChild(script);
        },
        LoadSettings: function (shop, callback) {
            //Prepare a function to handle when the settings are loaded.
            var settingsLoaded = function (settings) {
                //Return the settings to the Start function so it can continue loading.
                callback(settings);
            };

            //Get the settings
            api.ExecuteJSONP("http://shopify.bestpredict.com/widget/settings", { shop: shop }, settingsLoaded);
        },
        LoadScript: function (url, callback) {

            var script = document.createElement("script");
            script.type = "text/javascript";

            if (script.readyState) {  //IE
                script.onreadystatechange = function () {
                    if (script.readyState == "loaded" ||
                            script.readyState == "complete") {
                        script.onreadystatechange = null;
                        callback();
                    }
                };
            } else {  //Others
                script.onload = function () {
                    callback();
                };
            }

            script.src = url;
            document.getElementsByTagName("head")[0].appendChild(script);

        }
    };

    if ((typeof jQuery === 'undefined') || (parseFloat(jQuery.fn.jquery) < 1.7)) {
        api.LoadScript('//ajax.googleapis.com/ajax/libs/jquery/1.11.3/jquery.min.js', function () {
            api.Start(jQuery.noConflict(true));
        });
    } else {
        api.Start(jQuery.noConflict(true));
    }

    //For debugging.
    window["bestpredict_app"] = api;
}());