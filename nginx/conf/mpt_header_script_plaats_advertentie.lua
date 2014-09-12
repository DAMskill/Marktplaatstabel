require "conf/mpt_header_script"

-- Prevent 302 redirect after XMLHttpRequest
if (ngx.status == 302) 
then
    ngx.status = 200
    ngx.header.location = nil
end
