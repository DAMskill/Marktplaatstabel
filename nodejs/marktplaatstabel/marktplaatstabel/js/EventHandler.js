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
        this.allIntervals=[];
    }

    /* reserveSlot is used to prevent isActive() from returning true before
     * completion of filling out form.
     */
    EventHandler.prototype.reserveSlot = function(uniqueIDString) {
        clearTimers(this, uniqueIDString);
        this.domChangeTimer[uniqueIDString] = null;
    }

    EventHandler.prototype.cancelSlot = function(uniqueIDString) {
        if (uniqueIDString in this.domChangeTimer)
            delete this.domChangeTimer[uniqueIDString];
    }

    EventHandler.prototype.waitForConditionAndExecute = 
        function(uniqueIDString, condition, action, delayInMilliseconds, callback, maxRetries) 
    {
        clearTimers(this, uniqueIDString);

        this.domChangeTimer[uniqueIDString] = {};
        this.domChangeTimer[uniqueIDString].maxRetries = maxRetries;
        this.domChangeTimer[uniqueIDString].interval   = [];

        var _this = this;
        var interval = (
            setInterval(function() { 
                intervalFunction.call(_this, uniqueIDString, condition, action, callback) 
            }, delayInMilliseconds || this.domChangeDelay));

        this.allIntervals.push(interval);
        this.domChangeTimer[uniqueIDString].interval.push(interval);
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
                        clearTimers(this, uniqueIDString);
                        delete this.domChangeTimer[uniqueIDString];
                    }
                }
            }
            else {
                clearTimers(this, uniqueIDString);
                this.domChangeErrors.push(capitalizeFirstLetter(uniqueIDString) + " of waarde niet gevonden.");
                delete this.domChangeTimer[uniqueIDString];
            }

        } catch (error) {
            this.domChangeErrors.push("Softwarefout: " + error);
            recoverFromError(this);
        }
    }

    // FIXME: race condition fix
    function recoverFromError(_this) {
        _this.allIntervals.forEach(function(interval) {
            clearInterval(interval);
        });
        _this.allIntervals=[];
        _this.clearAllIntervals();
    }

    EventHandler.prototype.clearAllIntervals = function() {

        if (this.domChangeTimer===null) return;

        var _this = this;
        Object.keys(this.domChangeTimer, function(key) {
            if (typeof _this.domChangeTimer[key]==='Object' && 'interval' in _this.domChangeTimer[key])
                clearTimers(_this, key);
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

    EventHandler.prototype.clearErrors = function() {
        this.domChangeErrors = [];
    }

    function clearTimers(_this, uniqueIDString) {

        if (_this.domChangeTimer === null)
            _this.domChangeTimer = {};

        if (uniqueIDString in _this.domChangeTimer) {
            if (_this.domChangeTimer[uniqueIDString]!==null) {
                _this.domChangeTimer[uniqueIDString].interval.forEach(function(interval) {
                    clearInterval(interval);
                });
            }
        }
    }

    function capitalizeFirstLetter(string)
    {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    return EventHandler;

})();
