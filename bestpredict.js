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
        MoneyFormat: '$ {{amount}}',
        DownloadAndPopulate: function (options) {
            // Override defaults with arguments
            // $.extend({}, options);
            api.Get(options.url, {
                productId: options.productId,
                userId: options.userId,
                type: options.type,
            }, function (res) {
                res.forEach(function (item) {
                    var hasQueryString = item.url.indexOf("?") > -1;
                    item.url = item.url + (hasQueryString ? "&" : "?") + "bestpredict_from=" + options.productId;
                });
                api.RunTemplate(options.template, { products: res }, options.location, options.noImageUrl);
            });
        },
        PageActions: {
            Product: function () {
                api.Get("/api/view", {
                    productId: api.PageInformation.ResourceId,
                    pageUrl: api.PageInformation.PageUrl,
                    customerId: api.PageInformation.CustomerId
                });
            }
        },
        Urls: [
            { key: 'similar-viewed', action: 'Predict' },
            { key: 'similar-bought', action: 'Predict' },
            { key: 'history', action: 'Predict' },
            { key: 'trending', action: 'Predict' },
            { key: 'top', action: 'Predict' },
        ],

        Run: function ($) {

            api.ReadShopifyPageInformation();

            /*var pageType = api.PageInformation.PageType;

            if (pageType == "product") {
                api.PageActions.Product();
            }*/
            /*else if (pageType == "home") { }
            else if (pageType == "cart") { }*/

            var recommendElement = document.getElementsByName('bestpredict-recommendation');

            Array.prototype.forEach.call(recommendElement, function (elem) {
                var recommendType = elem.attributes.getNamedItem("recommendation-type").value//elem.dataset.recommendationType;
                var action = api.Urls.find(function (obj) { return obj.key == recommendType; }).action;

                var template = elem.attributes.getNamedItem("template").value;//elem.dataset.template;
                var productId = elem.attributes.getNamedItem("product").value;
                var userId = elem.attributes.getNamedItem("user").value;
                var moneyFormat = elem.attributes.getNamedItem("money-format").value;
                var noImageUrl = elem.attributes.getNamedItem("no-image").value;

                api.MoneyFormat = moneyFormat;//this is a hack for now.

                api.DownloadAndPopulate(
                {
                    productId: productId,
                    userId: userId,
                    url: "/api/" + action,
                    template: "#" + template,
                    location: "#" + elem.id,
                    type: recommendType,
                    noImageUrl: noImageUrl,
                });

            });
        },
        ReadShopifyPageInformation: function () {

            if (typeof variable !== typeof __st ? true : false)
                return;

            var pageInfo = __st;

            api.PageInformation.CustomerId = pageInfo.cid ? pageInfo.cid : "";

            api.PageInformation.PageUrl = pageInfo.pageurl;

            api.PageInformation.PageType = pageInfo.p;//product, collection, page, home, cart, blog, article...

            api.PageInformation.ResourceType = pageInfo.rtyp;//product, collection, blog, article ...

            api.PageInformation.ResourceId = pageInfo.rid;//holds the resource id so product id on the product page, collection id on the collection page and so on

            api.MoneyFormat = Shopify.money_format;
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
        RunTemplate: function (template, context, location, noImageUrl) {
            //move the next two lines
            var engine = api.GetTemplateEngine(noImageUrl);

            var source = '';

            var pageTemplate = $(template);

            if (pageTemplate.length > 0) {
                source = pageTemplate.html();
            }

            var html = engine.Template.parse(source).render(context);

            $(location).html(html).show();
        },
        GetTemplateEngine: function (noImageUrl) {
            var engine = require('liquid');
            engine.Partial.registerTemplates();

            engine.Template.registerFilter({
                img_url: function (input, type) {

                    if (input == null || input.length == 0)
                        return noImageUrl;

                    return String(input).replace(/\.([0-9a-z]+)(?:[\?#]|$)/i, "_" + type + "$&");
                },

                money: function (input) {
                    var formatted = api.Helpers.formatMoney(input);

                    return api.Helpers.formatCurrancy(formatted);
                }
            });

            return engine;
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
        },
        Helpers: {
            formatCurrancy: function (val, format) {
                //return api.MoneyFormat.replace("{{amount}}", val);

                return Shopify.formatMoney(val, format);
            },
            formatMoney: function (n, decPlaces, thouSeparator, decSeparator) {
                decPlaces = isNaN(decPlaces = Math.abs(decPlaces)) ? 2 : decPlaces;
                decSeparator = decSeparator == undefined ? "." : decSeparator;
                thouSeparator = thouSeparator == undefined ? "," : thouSeparator;

                var sign = n < 0 ? "-" : "",
                  i = parseInt(n = Math.abs(+n || 0).toFixed(decPlaces)) + "",
                  j = (j = i.length) > 3 ? j % 3 : 0;

                return sign + (j ? i.substr(0, j) + thouSeparator : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + thouSeparator) + (decPlaces ? decSeparator + Math.abs(n - i).toFixed(decPlaces).slice(2) : "");
            }
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