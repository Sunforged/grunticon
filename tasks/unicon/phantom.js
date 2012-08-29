
/*global phantom:true*/
/*global window:true*/
/*global btoa:true*/


 var  inputdir = "icons/",//phantom.args[1],
      outputdir = "temp/",//phantom.args[2],
      fs = require( "fs" ),
      assets = "assets/",
      pngout =  "png/",
      files = fs.list(  inputdir ),
      currfile = 0,
      pngcssrules = [],
      pngdatacssrules = [],
      datacssrules = [],
      htmlpreviewbody = [],
      fallbackcss = "icons.fallback.css",
      pngdatacss = "icons.data.png.css",
      datacss = "icons.data.css";



    // create new temp dir
    //fs.removeTree( outputdir );
    fs.makeDirectory( outputdir );


    function nextFile(){
      currfile++;
      processFile();
    }

    function finishUp(){
      // make the preview HTML file - omg so ghetto sorry
      var htmldoc = fs.read( assets + "preview.html" ),
        asyncCSS = fs.read( assets + "asyncCSS.js" );

      // add async loader to the top
      htmldoc = htmldoc.replace( /<script>/, "<script>\n\t" + asyncCSS );

      // add icons to the body
      htmldoc = htmldoc.replace( /<\/body>/, htmlpreviewbody.join( "\n\t" ) + "\n</body>" );

      fs.write( outputdir + "preview.html", htmldoc );

      // write CSS file
      fs.write( outputdir + fallbackcss, pngcssrules.join( "\n\n" ) );
      fs.write( outputdir + pngdatacss, pngdatacssrules.join( "\n\n" ) );
      fs.write( outputdir + datacss, datacssrules.join( "\n\n" ) );
      fs.write( outputdir + "asyncCSS.js", asyncCSS );
    }

    function processFile(){
      var theFile = files[ currfile ];

      if( theFile ){
        if( theFile.match( /\.svg$/i ) ){
          (function(){
            var page = require( "webpage" ).create(),
              svgdata = fs.read(  inputdir + theFile ),
              svgdatauri = "data:image/svg+xml;base64,",
              pngdatauri = "data:image/png;base64,",
              filename = theFile,
              filenamenoext = filename.replace( /\.svg$/i, "" ),
              frag = window.document.createElement( "div" ),
              svgelem, height, width;

            // get rid of anything outside of the svg element
            if( svgdata ){
              frag.innerHTML = svgdata;
              svgelem = frag.querySelector( "svg" );
              width = svgelem.getAttribute( "width" );
              height = svgelem.getAttribute( "height" );
            }

            svgdatauri += btoa(svgdata);

            pngcssrules.push( ".icon-" + filenamenoext + " { background-image: url(" + pngout + filenamenoext + ".png" + "); background-repeat: no-repeat; }" );
            datacssrules.push( ".icon-" + filenamenoext + " { background-image: url(" + svgdatauri + "); background-repeat: no-repeat; }" );

            htmlpreviewbody.push( '<pre><code>.icon-' + filenamenoext + ':</code></pre><div class="icon-' + filenamenoext + '" style="width: '+ width +'; height: '+ height +'"></div><hr/>' );

            // open svg file in webkit to make a png
            page.viewportSize = {  width: parseFloat(width), height: parseFloat(height) };
            page.open(  inputdir + theFile, function( status ){

              // create png file
              page.render( outputdir + pngout + filenamenoext + ".png" );

              // create png data URI
              pngdatacssrules.push( ".icon-" + filenamenoext + " { background-image: url(" +  pngdatauri + page.renderBase64( "png" ) + "); background-repeat: no-repeat; }" );

              // process the next svg
              nextFile();
            } );
          }());
        }
        else {
          nextFile();
        }
      }
      else {
        finishUp();
        grunt.verbose.write( "Unicon finished!" );
        phantom.exit();
      }
    }



    processFile();

    