DIFF.js
---

This project is a heavily modified version of [jsdifflib](https://github.com/cemerick/jsdifflib).  This version is a heavily stripped down and simplified version that removes a large portion of the code that was never used.

We've also added a few configuration options to make working with this a littler easier.

Config Options:
---

|Option|Type|Default|Description|
|---|---|---|
|`targetElement`|_Object_|NULL|DOM Element where the DIFF is Rendered.|
|`oldText`|_String_|NULL|This is the Old Text we are using as a Base.|
|`newText`|_String_|NULL|This is the New Text we are comparing against the Base.|
|`oldTextLabel`|_String_|'Old Text'|Label above the Old Text.|
|`newTextLabel`|_String_|'New Text'|Label above the New Text.|
|`cutOffSize`|_Number_|NULL|Entering a number here means text that has not changed will be Cut Off.  This number is how many lines to include above and below the DIFF output containing the Cut Off text.|
|`layout`|_Enum_|'unified'|Should be either `unified` or `split`.  `unified` will combine the changes into one file. `split` will show the two files side by side.|
|`diffWords`|_Bool_|true|Setting this to true will also highlight the changed words within a changed line.  Currently only works for `unified` layout. |
|`footerText`|_String_|''|This is the text that shows up in the bottom left corner of the DIFF|
|`onLayoutChange`|_Function_|NULL|This Function gets triggers when you click the `unified` and `split` links in the footer. |

Example Usage:
---

There are multiple examples in the `examples` folder :)
