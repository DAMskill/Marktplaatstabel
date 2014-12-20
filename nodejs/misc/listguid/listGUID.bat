@echo off
wmic product get identifyingnumber,name,vendor,version /FORMAT:csv | find "{" > listGUID.log
