/**********************************************************************************************************************/
/********************                             MISC. FUNCITONALITY                              ********************/
/**********************************************************************************************************************/

/**********************************************************************************************************************
 * Returns a formatted version of the date and time for logging
 *
 * @return {string} datetime The date and time
 */
function getDate() {
  
  var currentdate = new Date(); 
  var datetime = currentdate.getDate() + "/"
               + (currentdate.getMonth()+1)  + "/" 
               + currentdate.getFullYear() + " @ "  
               + currentdate.getHours() + ":"  
               + currentdate.getMinutes() + ":" 
               + currentdate.getSeconds();
  return datetime;
}


/**********************************************************************************************************************
 * Format the date for comparison
 *
 * @param {Date} date A date object to be formatted
 * @return {string} The formatted date and time
 */
function formatDate( date ) { 
  return Utilities.formatDate( date, "GMT", "YYYY-MM-DD HH:MM:SS" );
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


/**********************************************************************************************************************/
/********************                              RANGE INTERACTION                               ********************/
/**********************************************************************************************************************/

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
  var range = sheet.getRange( startCell + ":" + column );
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


/**********************************************************************************************************************/
/********************                          DATA IMPORT / EXPORT                                ********************/
/**********************************************************************************************************************/

/**********************************************************************************************************************
 * Sets the values of a range without the stupid default gSheet requirement
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
  // resize the array with empty values
  else {
    var resizedData = new Array( numEmptyRows );
    for ( var i = 0; i < numEmptyRows; i++ ) {
      resizedData[i] = new Array( numEmptyCols );
      for ( var j = 0; j < numEmptyCols; j++ ) {
        if ( i >= numDataRows || j >= numDataCols ) {
          resizedData[i][j] = "";
        }
        else {
          resizedData[i][j] = data[i][j];
        }
      }
    }
    range.setValues( resizedData );
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
  var data = range_string.split( "!" );
  var sourceSheetName = data[0];
  var ranges = data[1].split( ":" );
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
 * @param {string} source Range of the form "A1:A1"
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
  // split source range on ":"
  var exportData = exportRange.split( ":" );
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
  Logger.log( "Navigating to " + destSheet.getName() );
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
 */
function slackCallout( msgText, channel ) {
  
  // Sets body of callout
  var body = 
      {
        "text":msgText,
        "channel":channel,
        "username":"Reminder Bot",
        "parse":"full"
      };
  body = JSON.stringify( body );
  
  // Sets HttpRequest options
  var options =
      {
        "method":"post",
        "payload":body
      };
  
  // Make the callout
  UrlFetchApp.fetch( "https://hooks.slack.com/services/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", options );
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
    Logger.log( "Matrices are of incompatible dimensions :(" );
    return false;
  }
  var productMatrix = new Array( aRows );
  for ( var i = 0; i < aRows; i++ ) {
    productMatrix[i] = new Array( bCols );
  }
  for ( var i = 0; i < aCols; i++ ) {
    for ( var j = 0; j < bRows; j++ ) {
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
 
  // initialize as and bs
  var a1 = alpha - (1/3);
  var b1 = 1 / Math.sqrt( 9 * a1 );
  var a2 = beta - (1/3);
  var b2 = 1 / Math.sqrt( 9 * a2 );
  
  // generate normal zs and uniform us
  var normals = generateNormals();
  var z1 = normals[0];
  var u1 = generateUniform( 0, 1 );
  var z2 = normals[1];
  var u2 = generateUniform( 0, 1 );
  
  // continue to regenerate if necessary
  var v1 = Math.pow( ( 1 + b1 * z1 ), 3 );
  var firstCondition = z1 <= (-1 / b1);
  var secondCondition = Math.log( u1 ) >= ( .5 * Math.pow( z1, 2 ) + a1 - a1 * v1 + a1 * Math.log( v1 ) );
  
  while ( firstCondition || secondCondition ) {
    
    z1 = normals[0];
    u1 = generateUniform( 0, 1 );
    v1 = Math.pow( ( 1 + b1 * z1 ), 3 );
    firstCondition = z1 < (-1 / b1);
    secondCondition = Math.log( u1 ) > ( .5 * Math.pow( z1, 2 ) + a1 - a1 * v1 + a1 * Math.log( v1 ) );
  }
  var y1 = a1 * v1;
  
  var v2 = Math.pow( ( 1 + b2 * z2 ), 3 );
  firstCondition = z2 <= (-1 / b2);
  secondCondition = Math.log( u2 ) >= ( .5 * Math.pow( z2, 2 ) + a2 - a2 * v2 + a2 * Math.log( v2 ) );
  
  while ( firstCondition || secondCondition ) {
    
    z2 = normals[0];
    u2 = generateUniform( 0, 1 );
    v2 = Math.pow( ( 1 + b2 * z2 ), 3 );
    firstCondition = z2 < (-1 / b2);
    secondCondition = Math.log( u2 ) > ( .5 * Math.pow( z2, 2 ) + a2 - a2 * v2 + a2 * Math.log( v2 ) );
  }
  var y2 = a2 * v2;
  return [ y1, y2 ];
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