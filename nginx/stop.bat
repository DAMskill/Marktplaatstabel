@echo off

REM *******************************************************************************
REM * Copyright (c) 2014 Ivo van Kamp
REM *
REM * This file is part of Marktplaatstabel.
REM *
REM * Marktplaatstabel is free software: you can redistribute it and/or modify
REM * it under the terms of the GNU General Public License as published by
REM * the Free Software Foundation, either version 3 of the License, or
REM * (at your option) any later version.
REM *
REM * Marktplaatstabel is distributed in the hope that it will be useful,
REM * but WITHOUT ANY WARRANTY; without even the implied warranty of
REM * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
REM * GNU General Public License for more details.
REM *
REM * You should have received a copy of the GNU General Public License
REM * along with this program.  If not, see <http://www.gnu.org/licenses/>.
REM *******************************************************************************

set THISDIR=%~dp0
"%THISDIR%/misc/marktplaatstabel.bat" stop
