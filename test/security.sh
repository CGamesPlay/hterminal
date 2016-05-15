#!/bin/bash

echo "Scripts should not execute:"
hterminal printf '<iframe srcDoc="%s"></iframe>passed' '<script>window.top.document.write("fail")</script>'
read

echo "Image should fail to load:"
hterminal printf '<img src="http://placehold.it/350x150" />'
read

echo "Custom tags are prevented, this should not be colored."
hterminal printf '<style type="text/css">.group { background: red }</style>'
hterminal printf '<p style="background: red">Testing</p>'
read
