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

/* 
 * EventHandler
 * ============
 * Wait until event (condition) occurs then execute handler (action).
 */

var EventHandler = (function() {

    "use strict";

    function EventHandler() {
        this.domChangeTimer = null;
        this.domChangeDelay = 500;
        this.domChangeErrors = [];
    }

    /* reserveSlot is used to prevent isActive() from returning true before
     * completion of filling out form.
     */
    EventHandler.prototype.reserveSlot = function(uniqueIDString) {
        clearTimer.call(this, uniqueIDString);
        this.domChangeTimer[uniqueIDString] = null;
    }

    EventHandler.prototype.cancelSlot = function(uniqueIDString) {
        if (uniqueIDString in this.domChangeTimer)
            delete this.domChangeTimer[uniqueIDString];
    }

    EventHandler.prototype.waitForConditionAndExecute = 
        function(uniqueIDString, condition, action, delayInMilliseconds, callback, maxRetries) 
    {
        var uniqueID = clearTimer.call(this, uniqueIDString);

        this.domChangeTimer[uniqueIDString] = {};
        this.domChangeTimer[uniqueIDString].maxRetries = maxRetries;

        var _this = this;
        this.domChangeTimer[uniqueIDString].interval = 
            setInterval(function() { intervalFunction.call(_this, uniqueIDString, condition, action, callback) }, 
                            delayInMilliseconds || this.domChangeDelay);
    }

    function intervalFunction(uniqueIDString, condition, action, callback) {

        try {
            var maxRetries = this.domChangeTimer[uniqueIDString].maxRetries;

            if (typeof maxRetries === 'undefined' || this.domChangeTimer[uniqueIDString].maxRetries-- > 0)
            {
                if (typeof callback==="function")
                    callback();

                if (condition()) {
                    if (action() !== false) {
                        clearInterval(this.domChangeTimer[uniqueIDString].interval);
                        delete this.domChangeTimer[uniqueIDString];
                    }
                }
            }
            else {
                clearInterval(this.domChangeTimer[uniqueIDString].interval);
                this.domChangeErrors.push(capitalizeFirstLetter(uniqueIDString) + " of waarde niet gevonden.");
                delete this.domChangeTimer[uniqueIDString];
            }

        } catch (error) {
            // Clicking records too fast generating too many timers
            // will result in IE Permission denied errors.
            location.reload(true);
        }
    }

    EventHandler.prototype.clearAllIntervals = function() {

        if (this.domChangeTimer===null) return;

        $.each(this.domChangeTimer, function(timer) {
            if (typeof this.domChangeTimer[timer]==='Object' && 'interval' in this.domChangeTimer[timer])
                clearInterval(this.domChangeTimer[timer].interval);
        });

        this.domChangeTimer = {};
    }

    EventHandler.prototype.isActive = function() {
        return this.domChangeTimer !== null && Object.keys(this.domChangeTimer).length > 0;
    }

    EventHandler.prototype.getDomChangeTimer = function() {
        return this.domChangeTimer;
    }

    EventHandler.prototype.getErrors = function() {
        return this.domChangeErrors;
    }

    function clearTimer(uniqueIDString) {

        if (this.domChangeTimer === null)
            this.domChangeTimer = {};

        if (uniqueIDString in this.domChangeTimer) {
            if (this.domChangeTimer[uniqueIDString]!==null)
                clearInterval(this.domChangeTimer[uniqueIDString].interval);
        }
    }

    function capitalizeFirstLetter(string)
    {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    return EventHandler;

})();
