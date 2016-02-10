(function () {
    var api = {
        Settings: {},
        Shop: "",
        Server: "//recommender.shopify.bestpredict.com",
        PageInformation: {
            CustomerId: '',
            PageUrl: '',
            PageType: '',
            ResourceType: '',
            ResourceId: '',
        },
        DownloadAndPopulate: function (options) {
            api.Get(options.url, {
                productId: options.productId,
                userId: api.PageInformation.CustomerId
            }, function (res) {
                api.RunTemplate(options.template, { products: res }, options.location);
            });
        },
        PageActions: {
            Product: function () {
                /*                api.DownloadAndPopulate(api.PageInformation.ResourceId, "/api/Predict",
                                    "#bestpredict-item-recommend-template",
                                    "#bestpredict-item-recommend");*/
            },
            Cart: function () {
            },
            Home: function () {
            },
        },
        Urls: [
            { key: 'similar-viewed', value: 'Predict' },
            { key: 'similar-bought', value: 'Predict' },
            { key: 'history', value: 'Predict' },
            { key: 'trending', value: 'Predict' },
            { key: 'top', value: 'Predict' },
        ],

        Run: function ($) {

            api.ReadShopifyPageInformation();

            var pageType = api.PageInformation.PageType;

            if (pageType == "product") {
                api.PageActions.Product();
            }
            else if (pageType == "home") {
                api.PageActions.Home();
            }
            else if (pageType == "cart") {
                api.PageActions.Cart();
            }

            var recommendElement = document.getElementsByName('bestpredict-recommendation');

            Array.prototype.forEach.call(recommendElement, function (elem) {
                var recommendType = elem.attributes.getNamedItem("recommendation-type").value//elem.dataset.recommendationType;
                var action = api.Urls.find(function (obj) { return obj.key == recommendType; }).value;

                var template = elem.attributes.getNamedItem("template").value;//elem.dataset.template;

                api.DownloadAndPopulate(
                {
                    productId: api.PageInformation.ResourceId,
                    url: "/api/" + action,
                    template: "#" + template,
                    location: "#" + elem.id
                });

            });
        },
        ReadShopifyPageInformation: function () {

            var pageInfo = __st;

            api.PageInformation.CustomerId = pageInfo.cid ? pageInfo.cid : "";

            api.PageInformation.PageUrl = pageInfo.pageurl;

            api.PageInformation.PageType = pageInfo.p;//product, collection, page, home, cart, blog, article...

            api.PageInformation.ResourceType = pageInfo.rtyp;//product, collection, blog, article ...

            api.PageInformation.ResourceId = pageInfo.rid;//holds the resource id so product id on the product page, collection id on the collection page and so on

        },
        Start: function ($) {
            //Get the *.myshopify.com domain
            api.Shop = Shopify.shop;

            //Load the store settings
            api.LoadSettings(function (settings) {
                //Save app settings
                api.Settings = settings;

                api.LoadScript(api.Server + '/scripts/liquid.min.js', function () {
                    //Load the app
                    api.Run($);
                });

            });
        },
        RunTemplate: function (template, context, location) {
            //move the next two lines
            var Liquid = require('liquid');
            Liquid.Partial.registerTemplates();


            var source = '';

            var pageTemplate = $(template);

            if (pageTemplate.length > 0) {
                source = pageTemplate.html();
            }

            var html = Liquid.Template.parse(source).render(context);

            $(location).html(html).show();
        },
        Get: function (url, parameters, callback) {
            if (!parameters) {
                parameters = {};
            }

            parameters.shop = api.Shop;

            jQuery.get(api.Server + url, parameters, callback);
        },
        ExecuteJSONP: function (url, parameters, callback) {
            var nowMilli = new Date().getMilliseconds();

            //Prepare a function name that will be called when the JSONP request has loaded.
            //It should be unique, to prevent accidentally calling it multiple times.
            var callbackName = "bestpredict_JSONPCallback_" + nowMilli;

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
            kvps.push("shop=" + api.Shop);

            var qs = "?" + kvps.join("&");

            //Build the script element, passing along the shop name and the load function's name
            var script = document.createElement("script");
            script.type = "text/javascript";
            script.async = true;
            script.src = api.Server + url + qs;

            //Append the script to the document's head to execute it.
            document.head.appendChild(script);
        },
        LoadSettings: function (callback) {
            //Prepare a function to handle when the settings are loaded.
            var settingsLoaded = function (settings) {
                //Return the settings to the Start function so it can continue loading.
                callback(settings);
            };

            //Get the settings
            api.Get("/api/settings", {}, settingsLoaded);
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