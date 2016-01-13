(function () {

    var api = {
        Settings: {},
        PageInformation: {
            CustomerId: '',
            PageUrl: '',
            PageType: '',
            ResourceType: '',
            ResourceId: '',
        },
        Run: function ($) {

            var pages = {
                Product: function () {
                    alert("On Product Page!");
                },
                Cart: function () {
                    alert("On Cart Page!");
                },
                Home: function () {
                    alert("On Home Page!");
                }
            }

            //App Code here
            var pageInfo = __st;

            api.PageInformation.CustomerId = pageInfo.cid;

            api.PageInformation.PageUrl = pageInfo.pageurl;

            api.PageInformation.PageType = pageInfo.p;//product, collection, page, home, cart, blog, article...

            api.PageInformation.ResourceType = pageInfo.rtyp;//product, collection, blog, article ...

            api.PageInformation.ResourceId = pageInfo.rid;//holds the resource id so product id on the product page


            var pageType = api.PageInformation.PageType;

            if (pageType == "product") {
                pages.Product();
            }
            else if (pageType == "home") {
                pages.Home();
            }
            else if (pageType == "cart") {
                pages.Cart();
            }

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
            var nowMilli = new Date().getMilliseconds();

            //Prepare a function name that will be called when the JSONP request has loaded.
            //It should be unique, to prevent accidentally calling it multiple times.
            var callbackName = "bestpredict-JSONPCallback-" + nowMilli;

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
            kvps.push("uid=" + nowMilli);

            var qs = "?" + kvps.join("&");

            //Build the script element, passing along the shop name and the load function's name
            var script = document.createElement("script");
            script.type = "text/javascript";
            script.async = true;
            script.src = url + qs;

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
            api.ExecuteJSONP("http://shopify.bestpredict.com/api/settings", { shop: shop }, settingsLoaded);
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