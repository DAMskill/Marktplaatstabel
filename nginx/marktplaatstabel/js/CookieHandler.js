/*******************************************************************************
 * Copyright (c) 2014 Ivo van Kamp
 *
 * This file is part of Marktplaatstabel.
 *
 * Marktplaatstabel is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Marktplaatstabel is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *******************************************************************************/

var CookieHandler = (function() {

    "use strict";

    function setCookie(name, value, days) {

        if (days) {
            var date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            var expirationDate = "; expires=" + date.toGMTString();
        } else return false;

        document.cookie = name + "=" + value + expirationDate + "; path=/";
        return true;
    }

    function getCookie(name) {
        var nameEQ = name + "=";
        var ca = document.cookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }

    function delCookie(name) {
        var expirationDate = "; expires=Thu, 01-Jan-1970 00:00:01 GMT";
        document.cookie = name + "=" + expirationDate + "; path=/";
    }

    function isUserLoggedIn() {
        var loggedInCookie = getCookie("LoggedIn");
        return loggedInCookie==="true";
    }

    return {
        "setCookie": setCookie,
        "getCookie": getCookie,
        "delCookie": delCookie,
        "isUserLoggedIn": isUserLoggedIn
    }

})();
