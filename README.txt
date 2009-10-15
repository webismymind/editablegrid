EditableGrid v1.0.0
===================

Introduction
------------

EditableGrid is a Javascript library that will allow you to make tables editable in your web sites and applications.
EditableGrid focuses on simplicity: only a few lines of code are required to get your first table up and running.

You can use the EditableGrid library in two ways:

1) Hook up to an existing HTML table. 
   This approach can be very useful for using EditableGrid on an existing web application.

2) Build you EditableGrid from a XML description of the table structure and contents.
   This approach is recommended if you're writing a new web application (or if you are want to improve an existing web application).

This will only influence the way you create your editable grid.
The way you can customize it and use it afterwards is identical in both cases.

A first example
---------------

The library is very simple to use, so the best way to start is just to check out an example.
First have a look at the result: open up demo.html in your favorite browser.
This example will let you edit cells of various types (string, numeric, enum, email, boolean, date).
It will also let you sort columns and remove rows.

In order to get you started, we provide a simplified version of this demo, so let's start with this.
In file demo.html at line 12, you can just replace "demo.js" with "demo_simple.js" and refresh the file in your browser.
What you'll see is the same editable grid, but with some features removed.

Now let's see the code behind this demo:
- demo.html: main html page
- demo.css: some styles to make our table prettier
- demo.xml: xml file containing the table structure and contents
- demo_simple.js: javascript source to create our editable grid

The HTML page is very simple: all it does is include the necessary javascript and css files and create some divs.
The CSS file is a very simple and classical stylesheet.

The XML file contains two parts:

1) The table structure, enclosed in the <metadata> tag.

   Declaring the structure of your table consists in declaring a list of column, giving the following information for each:
   - name: this name can for example be the name of the corresponding field in a database (or anything else you may find useful to known which data is being edited)
   - label: this label will be used in the table header (if not given the name is used) 
   - type: type can one of the following: string, integer, double, email, boolean, date, html (if not given, string is assumed)
   - is the column editable or not (if not specified, it won't be editable)

   For string and email columns, you can also specifiy the desired length of the text field used when editing these values, like this: string(40) or email(24).
   The default length is 12 for string and 32 for email. 

   Numeric columns will be applied a specific style: bold and aligned to the right.
   Also, when a numeric cell is edited, the user cannot appply its changes if he entered an invalid numeric value.
   For emails and dates also, we check that the entered value is a valid email address or date.
   
   You can also specifiy a list of predefined values for each column.
   In this case, when a cell is edited, the user will be presented with a drop-down list containing these predefined values.  

2) The table contents, eclosed in the <data> tag.

   This is basically a list of rows, each row containing a value for each column.
   It is recommended to name your columns: this way you can give them in any order and skip some columns if you want. 
   But naming the columns is not mandatory: the order used in metadata must then be respected.
   You can also assign an unique id with each row (for example, the id of the row in a database).

Now let's analyse the Javascript file demo_simple.js.
In this file, all we do is to create an EditableGrid object and specify two things:

1) A function that will be called when the grid has been fully loaded.
   Here we simply display a message and render the loaded grid in our div "tablecontent" using out css style "testgrid"

2) A function that will be called each time a cell has been modified by the uses.
   Here we just display a message showing the new value.
   In real life, it's here that you can for example update your database (with an AJAX request). 

When the EditableGrid object is created, we use to load the XMl file demo.xml.

And that's it for the basics of using EditableGrid.

Improving our first example
---------------------------

You remember we asked you to replace "demo.js" with "demo_simple.js" in demo.html.
Well now that you are ready to see the real power of EditableGrid, you can use "demo.js" again.

In this part, we'll see how to customize our editable grid using 3 mechanisms:
- cell and header renderers that allow you to custyimze the way cells values are displayed
- cell validators that will allow you to tell when a value entered by the user is valid or not
- enum providers that will allow you to dynamically build the list of possibile values for a column
 
The demo.js will bring following new features to our example:
- show more details when a cell has been modified
- display an information icon in the table header for some columns
- display unit in the HEIGHT column
- add a validator to check that the age must be between inside the bounds [16, 100[   
- propose a list of countries that depends on the selected continent
- use a flag image to display the selected country
- clear the selected country when another continent is selected
- possibility to attach to an existing HTML table

[TO BE CONTINUED...]



 