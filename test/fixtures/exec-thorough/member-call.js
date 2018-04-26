// Case: Ensures member expressions do not lose the value of `this` on member expressions

'musefan42'.toUpperCase();
'musefan42'.toUpperCase('hey');
'musefan42'.toUpperCase('hey').slice(0);
