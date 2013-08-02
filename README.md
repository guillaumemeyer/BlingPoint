# BlingPoint

BlingPoint is a JS runtime &amp; framework for easily building instrumented, modular and robust SharePoint solutions that relies on the best design principles.  
Its name comes from its root namespace "$P" that derives from the JQuery one "$".

BlingPoint provides an easy to use, lightweight and efficient library of tools and features to ease development of powerful, modular &amp; robust SharePoint solutions :
- Embedded logging &amp; diagnostic system
- Simple profiling tool
- Application parameters Management
- Scripts & CSS dynamic loading
- PlugIn Management System
- Schema provisioning
- Script-oriented syntax
- More to come... Stay Tuned !

## GET STARTED
- Public API are documented through YuiDoc generation, see dist\version\docs\ folder.
- Checkout the code at <a href='https://github.com/guillaumemeyer/BlingPoint'>Github</a>
And don't hesitate to fork and send a pull request for any cool example of yours as well!
- Support ? Join the <a href='https://www.yammer.com/blingpoint'>BlingPoint community</a>
- Follow <a href='https://twitter.com/blingpoint'>@blingpoint on Twitter</a> 
- Troubleshooting? <a href='https://github.com/guillaumemeyer/BlingPoint/issues/new'>Open an issue</a>

## ABOUT
As a single minified javascript file, BlingPoint is easy to deploy :
- Using <a href="javascript:(function(){_my_script=document.createElement('SCRIPT');_my_script.type='text/javascript';_my_script.src='https://www.eryemconseil.com/wp-content/BlingPoint/BlingPoint.min.js?random='+Math.floor(Math.random()*10001);document.getElementsByTagName('head')[0].appendChild(_my_script);})();">this bookmarklet</a> to inject it dynamically into any SharePoint page
- By registering a script tag in your site MasterPage
- Using a Sandbox solution to register a new ScriptLink

## LICENCE
BlingPoint is released under the terms of the MIT license.  
  
Copyright (c) 2012-2013 Guillaume Meyer
Permission is hereby granted, free of charge, to any person obtaining a
copy of this software and associated documentation files (the "Software"),
to deal in the Software without restriction, including without limitation
the rights to use, copy, modify, merge, publish, distribute, sublicense,
and/or sell copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included
in all copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
DEALINGS IN THE SOFTWARE.
