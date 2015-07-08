/*
== Deprecated Util Functions ==
These functions have been deprecated. Probably don't use them unless you really want to.
*/


/**********************************************************************************************************************
 * Performs the multiplication of one row and one column of two matrices.
 * Returns a number if all inputs are known, and a string of concatenated
 * numbers and variables if not.
 *
 * REASON FOR DEPRECATION: This function is stupid and was mostly for my (Sam)
 * own visualization purposes
 *
 * @param {array[][]} matrixA The first matrix
 * @param {number} rowNum The row number of the first matrix
 * @param {array[][]} matrixB The second matrix
 * @param {number} columnNum The column number of the second matrix
 * @return {string/number} product The result of the multiplication
 */
function multiplyRowColumn( matrixA, rowNum, matrixB, columnNum ) {
  
  var row = matrixA[rowNum];
  var len = matrixB.length;
  var column = new Array( len );
  var product = 0;
  var toAdd = [];
  for ( var i = 0; i < len; i++ ) {
    column[i] = matrixB[i][columnNum];
    if ( !isNaN( row[i] ) && !isNaN( column[i] ) ) {
      toAdd.push( row[i] * column[i] );
    }
    else {
      var temp = " ";
      temp += isNaN( row[i] ) ? " X" + rowNum + i : row[i];
      temp += isNaN( column[i] ) ? "*X" + i + columnNum + " " : " *" + column[i];
      toAdd.push( temp );
    }
  }
  var nans = [];
  for ( var i = 0; i < toAdd.length; i++ ) {
    product += ( !isNaN( toAdd[i] ) ) ? toAdd[i] : 0;
    if ( isNaN( toAdd[i] ) ) {
      nans.push(i);
    }
  }
  for ( var i = 0; i < nans.length; i++ ) {
    product += " + " + toAdd[i];
  }
  return product;
}


/**********************************************************************************************************************
 * Gets the dimensions of an A1 range
 *
 * REASON FOR DEPRECATION: Range class already has getWidth() and getHeight()
 *
 * @param {string} range The range
 * @return {array} The dimensions in the form [height, width]
 */
function getRangeDimensions( range ) {
  
  var cells = range.split( ":" );
  var startCell = splitCell( cells[0] );
  var endCell = splitCell( cells[1] );
  var height = endCell[1] - startCell[1] + 1;
  var width = letterToColumn( endCell[0] ) - letterToColumn( startCell[0] ) + 1;
  return [ height, width ];
}