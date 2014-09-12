	local cookies = ngx.header.set_cookie 
	local newCookies = {}

        -- Filter existing cookies
	if cookies then
            if type(cookies) ~= "table" then cookies = {cookies} end

            for i, cookie in ipairs(cookies) do

                    if not string.find(cookie, "FLASH=") then 

                        -- Lua find login session cookie MpSecurity
                        if string.find(cookie, "MpSecurity") then 

                            local loggedInCookie = "LoggedIn=false; Path=/; Secure"
                            -- Check if MpSecurity is a hexadecimal string
                            local from, to, err = ngx.re.find(cookie, "MpSecurity=[A-z0-9]{84}.*", "jo")
                            if from then
                                loggedInCookie = "LoggedIn=true; Path=/; Secure"
                            end
                            table.insert(newCookies, loggedInCookie) 
                        end

                        -- RFC 6265: If the server omits the Domain attribute, the user agent will return the cookie only to the origin server.
                        local newCookie = string.gsub(cookie, "([dD]omain)=[%w_-\\\\.]+;?", "")
                        table.insert(newCookies, newCookie) 
                    end
            end 
        end

        -- Add cookie to accept cookies on marktplaats.nl (Art. 11.7a Tw)
	local expires = 365*24*60*60
	local newCookie = "CookieOptIn=true; Path=/; Expires=" .. ngx.cookie_time(ngx.time() + expires)
	table.insert(newCookies, newCookie) 
	ngx.header.set_cookie = newCookies 

        -- All redirects to localhost
	local location = ngx.header.location;
	if location then
		local newlocation = ngx.re.gsub(location, "http(s)?://www.marktplaats.nl", "http$1://localhost")
		ngx.header.location = newlocation
	end
