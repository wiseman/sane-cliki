// Sane Lisp Wikis
// Version 0.3
// 2006-01-28
// 
// Copyright John Wiseman (http://lemonodor.com/)
// Released under the MIT license.
//
// This script is a client-side hack to fix CLiki's
// (http://cliki.net/) handling of HTML entities when editing pages.
// It also fixes the ALU wiki (which is written in Kiwi, a descendant
// of CLiki).  Currently CLiki forgets to encode entities before
// writing out the source of the page you're editing into the relevant
// <TEXTAREA> field.  One consequence of this is that if you enter
// "&amp;lt;" into the textarea, then re-edit the page, you'll see
// "&lt;".  For more ranting, see
// <http://lemonodor.com/archives/001039.html>.
// 
// Yes, this is a hack that fixes something that should be fixed in
// the server software.  But until it is fixed the right way, this may
// keep you from pulling your hair out.
//
// The only unusual thing about this script is that I couldn't figure
// out how to make it work without making another request to the
// CLiki/Kiwi server for the raw source of a page; by the time you ask
// for the innerHTML or value property of the relevent TEXTAREA, it's
// too late--The browser has realized that the TEXTAREA doesn't
// contain valid HTML and has done some crazy information-losing DWIM
// shit.  The original page source is no longer accessible via the
// DOM.  So we hit the server again.
// 
// ----------
// This is a Greasemonkey user script.
//
// To install, you need Greasemonkey: http://greasemonkey.mozdev.org/
// Then restart Firefox and revisit this script.  Under Tools, there
// will be a new menu item to "Install User Script".  Accept the
// default configuration and install.
//
// To uninstall, go to Tools/Manage User Scripts, select "Sane Lisp
// Wikis" and click Uninstall.
//
// --------------------------------------------------------------------

// ==UserScript==
// @name          Sane Lisp Wikis
// @namespace     http://lemonodor.com/
// @description   Fixes CLiki's and Kiwi's handling of HTML entities when editing pages.
// @include       http://cliki.net/edit/*
// @include       http://www.cliki.net/edit/*
// @include       http://wiki.alu.org/*
// ==/UserScript==



// My code begins.

function stringEndsWith(s1, s2) {
    var lendiff = s1.length - s2.length;
    return s1.length >= s2.length && s1.substr(lendiff, s2.length) == s2;
}

function isCLikiURL() {
    return stringEndsWith(window.location.host.toLowerCase(), "cliki.net");
}  

// Extract the (URL-encoded) name of a page from a full CLiki or Kiwi edit URL.

function pageNameFromURL(url) {
    if (isCLikiURL()) {
        return pageNameFromCLikiURL(url);
    } else {
        return pageNameFromKiwiURL(url);
    }
}

function pageNameFromCLikiURL(url) {
    var pagePattern = /edit\/(.+)(\?.*)/;
    return url.match(pagePattern)[1];
}

function pageNameFromKiwiURL(url) {
    var pagePattern = /\/(.+)\?action=edit/;
    return url.match(pagePattern)[1];
}


// Use an XMLHttpRequest to grab the source of a CLiki page.

function getCLikiPageSource(name, fn) {
    var url;
    
    url = "http://www.cliki.net/" + name + "?source";
//    GM_log("Getting source from url '" + url + "'.");
    
    GM_xmlhttpRequest({
          method: 'GET',
                url: url,
                headers: {
	        'User-agent': 'Mozilla/4.0 (compatible) Greasemonkey',
                    },
                onload: function(responseDetails) {
		if (responseDetails.status = 200) {
                    fn(responseDetails.responseText);
		} else {
                    GM_log("Unable to retrieve page " + name +
                           ", got response " + responseDetails.status +
                           " (" + responseDetails.statusText + ")");
		}
            }});
}

function getKiwiPageSource(name, fn) {
    var url;
    
    url = "http://wiki.alu.org/" + name + "?action=source";
//    GM_log("Getting source from url '" + url + "'.");
    
    GM_xmlhttpRequest({
          method: 'GET',
                url: url,
                headers: {
	        'User-agent': 'Mozilla/4.0 (compatible) Greasemonkey',
                    },
                onload: function(responseDetails) {
		if (responseDetails.status = 200) {
                    fn(responseDetails.responseText);
		} else {
                    GM_log("Unable to retrieve page " + name +
                           ", got response " + responseDetails.status +
                           " (" + responseDetails.statusText + ")");
		}
            }});
}


// Swap out the mangled page source with the good stuff.

function replaceCLikiSource(source)
{
//    GM_log("page source: " + source);
    contentTextArea = document.getElementsByTagName('textarea')[0];
    contentTextArea.value = source;
}

// When you ask CLiki for the source to a page, it gives you the raw
// source, which is ideal for our purposes.  When you ask Kiwi for the
// raw source, you get an HTML page that displays the source--which
// means it's been HTML-encoded!  Here we undo Kiwi's somewhat special
// encoding, which not only replaces '<' and '&' with their &foo
// representations, but also turns newlines into <br>s.  Criminey.

function unescapeKiwiSourceHTML(html) {
    var div = document.createElement('div');
    html = html.replace(/\<br\>/g, "\n");
    div.innerHTML = html;
    return div.childNodes[0] ? div.childNodes[0].nodeValue : '';
}

function replaceKiwiSource(source)
{
    
    var startMarker = "<table CLASS=\"viewsource\"><tr><td>";
    var endMarker = "<br></td></tr></table></div><div ID=\"ContentFooter\">";
    var markerLoc = source.indexOf(startMarker);
    if (markerLoc >= 0) {
        var sourceStart = markerLoc + startMarker.length;
        var sourceLen = source.substring(sourceStart, source.length).indexOf(endMarker);
        var pageSource = source.substr(sourceStart, sourceLen);
//        GM_log("sourceStart: " + sourceStart + ", sourceLen: " + sourceLen);
//        GM_log("page source is " + pageSource.length + " chars");
//        GM_log("page source: " + pageSource);
//        GM_log("unescaped page source is " + unescapeKiwiSourceHTML(pageSource));
        contentTextArea = document.getElementsByTagName('textarea')[0];
        contentTextArea.value = unescapeKiwiSourceHTML(pageSource);
    }
}

function fixEditForm() {
    var name;

    if (isCLikiURL()) {
//        GM_log("Fixing CLiki edit page");
        name = pageNameFromURL(window.location.href);
        getCLikiPageSource(name, replaceCLikiSource);
    } else if (stringEndsWith(window.location.href, "?action=edit")) {
//        GM_log("Fixing Kiwi edit page");
        // Disable previews
        var previewButtons = document.getElementsByName("Preview");
        if (previewButtons) {
            previewButtons[0].parentNode.removeChild(previewButtons[0]);
        }
        name = pageNameFromURL(window.location.href);
        getKiwiPageSource(name, replaceKiwiSource);
    }
}


fixEditForm();
