/*
== Google Script Util Library ==
THIS FILE IS PULLED FROM VERSION CONTROL. DO NOT EDIT IT HERE.
Open the 'google-script-util' repo and edit 'src/main.js/'
Run 'build-util.sh' to log edits, then copy into 'util.gs' in your project

Projects using some version of this library:
1. SparkFundUtil
2. Sandbox
3. SparkFund File Permissions Tool
4. Portfolio Model v1.1
5. Portfolio Model v1.2
6. Queue Model v1.2
7. Portfolio Model v1.3
8. Conference Calendar
9. Project Pricing Tool ASCENDANCE TEST

== BUILD INFO ==
utc: 1439387743340
utc_print: Wed Aug 12 2015 09:55:43 GMT-0400 (EDT)
branch: master
rev: 17bcf4fd405b859205aabd3548326aae040a3e90
uname: samhage
*/

/**********************************************************************************************************************/
/********************                             MISC. FUNCITONALITY                              ********************/
/**********************************************************************************************************************/

/**********************************************************************************************************************
 * Returns a formatted version of the date and time for logging
 *
 * @return {string} The date and time
 */
function getDateTime() {
  
  var currentdate = new Date(); 
  var datetime = currentdate.getDate() + '/'
               + (currentdate.getMonth()+1)  + '/' 
               + currentdate.getFullYear() + ' @ '  
               + currentdate.getHours() + ':'  
               + currentdate.getMinutes() + ':' 
               + currentdate.getSeconds();
  return datetime;
}


/**********************************************************************************************************************
 * Returns the month, day, and year formatted according to US convention
 *
 * @return {string} The date
 */
function getUSDate() {
  
  var currentdate = new Date(); 
  var date = (currentdate.getMonth()+1)  + '/'
               + currentdate.getDate() + '/'
               + currentdate.getFullYear();
  return date;
}


/**********************************************************************************************************************
 * Format the date for comparison
 *
 * @param {Date} date A date object to be formatted
 * @return {string} The formatted date and time
 */
function formatDate( date ) { 
  return Utilities.formatDate( date, 'GMT', 'YYYY-MM-DD HH:MM:SS' );
}


/**********************************************************************************************************************
 * Deletes all triggers
 */
function deleteTriggers() {
 
  var triggers = ScriptApp.getProjectTriggers();
  var len = triggers.length;
  for ( var i = 0; i < len; i++ ) {
    ScriptApp.deleteTrigger( triggers[i] );
  }
}


/**********************************************************************************************************************
 * Calculates n choose k using the more efficient multiplicative formula
 *
 * @param {number} n
 * @param {number} k
 * @return {number} The value of n choose k
 */
function choose( n, k ) {
 
  var product = 1;
  for ( var i = 1; i <= k; i++ ) {
    product *= ( n + 1 - i ) / i;
  }
  return product;
}


/**********************************************************************************************************************/
/********************                              RANGE INTERACTION                               ********************/
/**********************************************************************************************************************/


/**********************************************************************************************************************
 * Transposes a row to a column
 *
 * @param {Object[][]} data A 2D array representing a row
 * @return {Object[][]} A 2D array representing a column with the same data
 */
function transposeRowToColumn( data ) {
  
  var height = data.length;
  var width = ( data[0] !== null ) ? data[0].length : 0;
  
  // must be one row tall
  if ( height !== 1 ) {
    throw new Error( 'transposeRowToColumn takes a single row' );
    return;
  }
  
  var column = new Array( width );
  for ( var i = 0; i < width; i++ ) {
    column[i] = [ data[0][i] ];
  }
  return column;
}


/**********************************************************************************************************************
 * Transposes a column to a row
 *
 * @param {Object[][]} data A 2D array representing a column
 * @return {Object[][]} A 2D array representing a row with the same data
 */
function transposeColumnToRow( data ) {
  
  var height = data.length;
  var width = ( data[0] !== null ) ? data[0].length : 0;
  
  // must be one column wide
  if ( width != 1 ) {
    throw new Error( 'transposeColumnToRow takes a single column' );
    return;
  }
  
  var row = [ new Array( height ) ]
  for ( var i = 0; i < height; i++ ) {
    row[0][i] = data[i][0];
  }
  return row;
}


/**********************************************************************************************************************
 * Pulls out the column string and row number from A1
 * notation of the cell (this is important because columns
 * can be of variable length)
 *
 * @param {string} cell The A1 representation of the cell
 * @return {array} split The array with the column string and row number
 */
function splitCell( cell ) {
  
  cell = cell.toUpperCase();
  var i = 0;
  while( true ) {
    if ( cell.charCodeAt(i) < 65 || cell.charCodeAt(i) > 90 ) {
      break;
    }
    i++;
  }
  var column = cell.slice(0, i);
  var row = parseInt( cell.slice(i) );
  var split = [column, row];
  return split;
}


/**********************************************************************************************************************
 * Find the first cell in a given column and sheet that matches the input value
 * starting from a given cell
 *
 * @param {string} startCell The cell to start searching from in A1 notation
 * @param {Sheet} sheet The sheet to search
 * @param {string} value The value to match
 * @return {number} The row of the first empty cell
 */
function findMatch( startCell, sheet, value ) {
  
  // extract data from desired column to improve speed
  var column = splitCell( startCell )[0];
  var range = sheet.getRange( startCell + ':' + column );
  var columnValues = range.getValues();
  
  var count = 0;
  while ( columnValues[count][0] !== value ) {
    count++;
  }
  return count + parseInt( startCell.slice(1) );
}


/**********************************************************************************************************************
 * Turn letter representation of column into integer
 *
 * @param {string} letter The letter representation of the column
 * @return {number} Number representation of column
 */
function letterToColumn( letter ) {
  
  var column = 0;
  length = letter.length;
  
  // handle multiple-letter columns
  for ( var i = 0; i < length; i++ ) {
    column += ( letter.charCodeAt(i) - 64 ) * Math.pow( 26, length - i - 1 );
  }
  return column;
}


/**********************************************************************************************************************
 * Check if one range is contained in another
 *
 * @param {range} innerRange The inner range
 * @param {range} outerRange The outer range
 * @return {boolean} True if inner is completely contained in outer (inclusive), false if not
 */
function isRangeContained( innerRange, outerRange ) {

  // get range bounds
  var innerStartRow = innerRange.getRow();
  var innerStartColumn = innerRange.getColumn();
  var innerEndRow = innerRange.getLastRow();
  var innerEndColumn = innerRange.getLastColumn();
  var outerStartRow = outerRange.getRow();
  var outerStartColumn = outerRange.getColumn();
  var outerEndRow = outerRange.getLastRow();
  var outerEndColumn = outerRange.getLastColumn();

  // check for containment
  return innerStartRow >= outerStartRow && innerStartColumn >= outerStartColumn
                                        && innerEndRow <= outerEndRow
                                        && innerEndColumn <= outerEndColumn;
}


/**********************************************************************************************************************
 * Check if a range is empty
 *
 * @param {range} range The range to check for content
 * @return {boolean} True if the range is empty, false otherwise
 */
function isEmpty( range ) {

  var data = range.getValues();
  var numRows = data.length;
  var numColumns = data[0].length;

  // return false as soon as content is found
  for ( var i = 0; i < numRows; i++ ) {
    for ( var j = 0; j < numColumns; j++ ) {
      if ( data[i][j] !== '' ) {
        return false;
      }
    }
  }
  return true;
}


/**********************************************************************************************************************/
/********************                          DATA IMPORT / EXPORT                                ********************/
/**********************************************************************************************************************/

/**********************************************************************************************************************
 * Sets the values of a range without the default gSheet requirement
 * that the input data be the exact size of the range
 *
 * @param {range} range The target range in A1 notation
 * @param {array[][]} data The data to fill the range
 * @return {range} Range for chaining
 */
function smartSetValues( range, data ) {
  
  var numDataRows = data.length;
  var numDataCols = data[0].length;
  var numEmptyRows = range.getHeight();
  var numEmptyCols = range.getWidth();
  
  // data already matches range size
  if ( numDataRows === numEmptyRows && numDataCols === numEmptyCols ) {
    range.setValues( data );
  }
  // resize the array with empty values if range is absolutely bigger than data
  else if ( numDataRows < numEmptyRows && numDataCols < numEmptyCols ) {
    var resizedData = new Array( numEmptyRows );
    for ( var i = 0; i < numEmptyRows; i++ ) {
      resizedData[i] = new Array( numEmptyCols );
      for ( var j = 0; j < numEmptyCols; j++ ) {
        if ( i >= numDataRows || j >= numDataCols ) {
          resizedData[i][j] = '';
        }
        else {
          resizedData[i][j] = data[i][j];
        }
      }
    }
    range.setValues( resizedData );
  }
  // default to resizing range to fit data if range is smaller in either dimension
  else {
    var newRange = range.offset( 0, 0, numDataRows, numDataCols );
    newRange.setValues( data );
  }
  return range;
}


/**********************************************************************************************************************
 * Imports data by value to avoid problems of individual cell edits
 * involved with IMPORTRANGE
 *
 * @param {string} spreadsheet_key String representation of spreadsheet key
 * @param {string} range_string String with sheet name and range, separated by '!'
 */
function importByValue( spreadsheet_key, range_string ) {
  
  var sourceSpreadsheetId = spreadsheet_key;
  // pull out sheet name and import range
  var data = range_string.split( '!' );
  var sourceSheetName = data[0];
  var ranges = data[1].split( ':' );
  var startRange = ranges[0];
  var endRange = ranges[1];
  
  // get source sheet information
  var sourceSheet = SpreadsheetApp.openById( sourceSpreadsheetId ).getSheetByName( sourceSheetName );
  var sourceStartRow = startRange.charAt(1);
  var sourceStartCol = letterToColumn( startRange.charAt(0) );
  var numRows = endRange.slice(1) - sourceStartRow + 1;
  var numCols = letterToColumn( endRange.charAt(0) ) - sourceStartCol + 1;
  var range = sourceSheet.getRange( sourceStartRow, sourceStartCol, numRows, numCols );
  var values = range.getValues();
  
  //  set values in destination sheet
  var destSheet = SpreadsheetApp.getActiveSheet();
  var thisCell = destSheet.getActiveCell();
  // where to start writing
  var destStartRow = thisCell.getRow();
  var destStartCol = thisCell.getColumn();
  // write the data
  for ( var i = 0; i < numRows; i++ ) {
    for ( var j = 0; j < numCols; j++ ) {
      
      thisCell = destSheet.getRange( destStartRow + i, destStartCol + j );
      thisCell.setValue( values[i][j] );
    }
  }
}


/**********************************************************************************************************************
 * Takes the approach of importByValue, but calls from the source sheet
 * (intended to be used onEdit())
 *
 * @param {string} key String representation of destination spreadsheet ID
 * @param {string} sheet String representation of destination sheet name
 * @param {string} cell A1 notation for destination cell
 * @param {string} source Range of the form 'A1:A1'
 */
function exportByValue( key, sheet, cell, range ) {
  
  var destSpreadsheetId = key;
  var destSheetName = sheet;
  var destCell = cell;
  var exportRange = range
  
  // get destination sheet information
  var destSheet = SpreadsheetApp.openById( destSpreadsheetId ).getSheetByName( destSheetName );
  // where to start writing
  var destStartRow = destCell.slice(1);
  var destStartCol = letterToColumn( destCell.charAt(0) );
  // get source sheet information
  var sourceSheet = SpreadsheetApp.getActiveSheet();
  // split source range on ':'
  var exportData = exportRange.split( ':' );
  var exportStartA1 = exportData[0]; // start of source range in A1 notation
  var exportEndA1 = exportData[1]; // end of source range
  var sourceStartRow = exportStartA1.slice(1);
  var sourceStartCol = letterToColumn( exportStartA1.charAt(0) );
  var sourceEndRow = exportEndA1.slice(1);
  var sourceEndCol = letterToColumn( exportEndA1.charAt(0) );
  // determine number of rows and number of columns in source data array
  var numRows = sourceEndRow - sourceStartRow + 1;
  var numCols = sourceEndCol - sourceStartCol + 1;
  var range = sourceSheet.getRange( sourceStartRow, sourceStartCol, numRows, numCols );
  var values = range.getValues();
  
  // write the data
  var thisCell = destSheet.getRange( destStartRow, destStartCol );
  for ( var i = 0; i < numRows; i++ ) {
    for ( var j = 0; j < numCols; j++ ) {
      
      thisCell = destSheet.getRange( +destStartRow + +i, +destStartCol + +j ); // unary '+' forces integer interpretation
      thisCell.setValue( values[i][j] );
    }
  }
}


/**********************************************************************************************************************/
/********************                          SHEETS / NAVIGATION                                 ********************/
/**********************************************************************************************************************/

/**********************************************************************************************************************
 * Sets a sheet to be the active sheet
 *
 * @param {Sheet} destSheet Destination sheet
 */
function navToSheet( destSheet ) {
  var destSheetName = destSheet.getName();
  Logger.log( 'Navigating to ' + destSheet.getName() );
  SpreadsheetApp.setActiveSheet( destSheet );  
}


/**********************************************************************************************************************
 * Actually opens a sheet
 *
 * @param {string} name name of sheet
 */
function showSheetByName(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var destSheet = ss.getSheetByName(name);
  navToSheet(destSheet);   
}


/**********************************************************************************************************************
 * Lock the current sheet to edits from everyone other than current user
 */
function lock() {
  
  var ss = SpreadsheetApp.getActive();
  var thisSheet = ss.getActiveSheet();
  var protection = thisSheet.protect();
  // Ensure the current user is an editor before removing others
  var me = Session.getEffectiveUser();
  protection.addEditor( me );
  protection.removeEditors(protection.getEditors());
  if (protection.canDomainEdit()) {
    protection.setDomainEdit( false );
  }
}


/**********************************************************************************************************************
 * Remove protections, allowing users to edit
 */
function unlock() {
 
  var ss = SpreadsheetApp.getActive();
  var thisSheet = ss.getActiveSheet();
  var protection = thisSheet.getProtections( SpreadsheetApp.ProtectionType.SHEET )[0];
  if ( protection && protection.canEdit() ) {
    protection.remove();
  }
}


/**********************************************************************************************************************/
/********************                                 INTEGRATION                                  ********************/
/**********************************************************************************************************************/

/**********************************************************************************************************************
 * Sends a Slack message with arbitrary message text and channel
 *
 * @param {string} msgText Text of the message
 * @param {string} channel Channel to send message
 * @param {string} username Name to display as message sender
 */
function slackCallout( msgText, channel, username ) {
  
  if ( channel[0] !== '#' ) {
    channel = '#' + channel;
  }

  // Sets body of callout
  var body = 
      {
        'text': msgText,
        'channel': channel,
        'username': username,
        'parse': 'full'
      };
  body = JSON.stringify( body );
  
  // Sets HttpRequest options
  var options =
      {
        'method':'post',
        'payload':body
      };
  
  // Make the callout
  UrlFetchApp.fetch( 'https://hooks.slack.com/services/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', options );
}


/**********************************************************************************************************************/
/********************                                   MATRICES                                   ********************/
/**********************************************************************************************************************/

/**********************************************************************************************************************
 * Multiplies two matrices
 *
 * @param {array[][]} a The first matrix
 * @param {array[][]} b The second matrix
 * @return {array[][]} productMatrix The product of the multiplication
 */
function multiplyMatrices( a, b ) {
  
  var aRows = a.length;
  var aCols = a[0].length;
  var bRows = b.length;
  var bCols = b[0].length;
  
  // check matrix dimensions
  if ( aCols !== bRows ) {
    Logger.log( 'Matrices are of incompatible dimensions :(' );
    return false;
  }
  var productMatrix = new Array( aRows );
  for ( var i = 0; i < aRows; i++ ) {
    productMatrix[i] = new Array( bCols );
  }
  for ( var i = 0; i < aRows; i++ ) {
    for ( var j = 0; j < bCols; j++ ) {
      productMatrix[i][j] = 0;
      for ( var k = 0; k < aCols; k++ ) {
        productMatrix[i][j] += a[i][k] * b[k][j];
      }
    }
  }
  return productMatrix;
}


/**********************************************************************************************************************
 * Performs a lower upper decomposition on an input matrix
 *
 * @param {array[][]} inputMatrix The square matrix to be decomposed. Given as a 2D array.
 * @return {array[][][]} parts A tuple containing the lower and upper matrices.
 */
function luDecomposition( inputMatrix ) {
  
  var n = inputMatrix.length;
  var parts = new Array(2);
  
  /** initialize upper and lower triangle matrices **/
  var lower = createMatrix(n);
  var upper = inputMatrix.slice(0);
  
  /** perform Gaussian elimination to obtain upper **/
  for ( var j = 0; j < n; j++ ) {
    for ( var i = (j+1); i < n; i++ ) {
      
      // multiplier to cancel rows
      var multiplier = upper[i][j] / upper[j][j]; 
      var toSubtract = upper[j].map( function( element ) {
        return element * multiplier;
      });
      // subtract one row from another
      var k = -1;
      upper[i] = upper[i].map( function ( element ) {
        k++;
        return ( element - toSubtract[k] );
      });
      
      /** lower comprises the multipliers from the previous step **/
      lower[i][j] = multiplier;
    }
  }
  
  /** return both matrices **/
  parts[0] = lower;
  parts[1] = upper;
  return parts;
}


/**********************************************************************************************************************
 * Creates a square array of size nxn representing the identity matrix
 *
 * @param {number} n The size of the matrix/array
 * @return {array[][]} arr The array
 */
function createMatrix( n ) {
  
  n = Math.floor(n); // make sure it's an integer
  var arr = new Array(n);
  for ( var i = 0; i < n; i++ ) {
    arr[i] = new Array(n);
    for ( var j = 0; j < n; j++ ) {
      arr[i][j] = ( i === j ) ? 1 : 0;
    }
  }
  return arr;
}


/**********************************************************************************************************************/
/********************                             RANDOM DISTRIBUTIONS                             ********************/
/**********************************************************************************************************************/

/**********************************************************************************************************************
 * Generates a uniform random number between min and max, exclusive
 *
 * @param {number} min The lower bound
 * @param {number} max The upper bound
 * @return {number} uniformRandom The random number
 */
function generateUniform( min, max ) {
  
  var uniformRandom = ( max - min ) * Math.random() + min;
  return uniformRandom;
}


/**********************************************************************************************************************
 * Generates two normally distributed random numbers
 *
 * @return {array[]} A tuple of the two random numbers
 */
function generateNormals() {
  
  // generate u1, u2 independent, identically distributed uniforms (0,1)
  var u1 = generateUniform( 0, 1 );
  var u2 = generateUniform( 0, 1 );
  
  // generate n1, n2 from them
  var n1 = Math.sqrt( (-2) * Math.log( u1 ) ) * Math.cos( 2 * Math.PI * u2 );
  var n2 = Math.sqrt( (-2) * Math.log( u2 ) ) * Math.cos( 2 * Math.PI * u1 );
  return [ n1, n2 ];
}


/**********************************************************************************************************************
 * Generates two numbers according to a gamma distribution
 *
 * @param {number} alpha Param for one gamma
 * @param {number} beta Param for the second gamma
 * @return {array[]} A tuple of the two random numbers
 */
function generateGammas( alpha, beta ) {
 
  var normals = generateNormals();
  var y1 = generateGamma( alpha, normals[0] );
  var y2 = generateGamma( beta, normals[1] );
  return [ y1, y2 ];
}


/**********************************************************************************************************************
 * Generates a random number according to a gamma distribution
 *
 * @param {number} alpha Param for the function
 * @param {number} normal A normal random number (done this way for efficiency)
 * @return {array[]} The random number
 */
function generateGamma( alpha, normal ) {
  
  // set a and b
  var a = alpha - (1/3);
  var b = 1 / Math.sqrt( 9 * a );
  // generate z, u and calculate v
  var z = normal;
  var u = generateUniform( 0, 1 );
  var v = Math.pow( ( 1 + b * z ), 3 );
  
  // regenerate if necessary
  while ( true ) {
    if ( z > ( -1/b ) && Math.log(u) < .5*Math.pow( z, 2 ) + a - a*v + a*Math.log(v) ) {
      return a * v;
    }
    z = generateNormals()[0];
    u = generateUniform( 0, 1 );
    v = Math.pow( ( 1 + b * z ), 3 );
  }
}


/**********************************************************************************************************************
 * Generates a random number according to a beta distribution
 *
 * @return {number} The random number
 */
function generateBeta( alpha, beta ) {
  
  // generate independent gamma ys
  var gammas = generateGammas( alpha, beta );
  var y1 = gammas[0];
  var y2 = gammas[1];
  return y1 / (y1 + y2);
}