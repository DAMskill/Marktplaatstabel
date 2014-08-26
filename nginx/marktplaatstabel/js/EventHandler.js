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
 *
 */
var EventHandler = (function() {

    "use strict";

    var domChangeTimers = null;
    var domChangeDelay = 500;

    function init(uniqueID) {

        if (domChangeTimers === null)
            domChangeTimers = {};

        if (uniqueID in domChangeTimers)
            clearInterval(domChangeTimers[uniqueID]);

        return uniqueID;
    }

    /* To prevent isActive() from returning true before completion of filling out form */
    function reserveSlot(uniqueIDString) {
        var uniqueID = init(uniqueIDString);
        domChangeTimers[uniqueID] = null;
    }

    function waitForConditionAndExecute(uniqueIDString, condition, action, delayInMilliseconds, callback) {

        var uniqueID = init(uniqueIDString);

        domChangeTimers[uniqueID] = setInterval(function() {
            try {

                if (typeof callback==="function")
                    callback();

                if (condition()) {
                    if (action() !== false) {
                        clearInterval(domChangeTimers[uniqueID]);
                        delete domChangeTimers[uniqueID];
                    }
                }
            } catch (error) {
                // Clicking records too fast generating too many timers
                // will result in IE Permission denied errors.
                location.reload(true);
            }
        }, delayInMilliseconds || domChangeDelay);
    }

    function clearAllIntervals() {
        if (domChangeTimers===null) return;
        $.each(Object.keys(domChangeTimers), function(ix,val) {
                clearInterval(domChangeTimers[val]);
        });
        domChangeTimers = {};
    }

    function isActive() {
        return domChangeTimers !== null && Object.keys(domChangeTimers).length > 0;
    }

    function getDomChangeTimers() {
        return domChangeTimers;
    }

    return {
        "waitForConditionAndExecute": waitForConditionAndExecute,
        "isActive": isActive,
        "clearAllIntervals": clearAllIntervals,
        "reserveSlot": reserveSlot,
        "getDomChangeTimers": getDomChangeTimers
    }

})();
