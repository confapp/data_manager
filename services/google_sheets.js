app.factory('GoogleSheetsService', GoogleSheetsService);

GoogleSheetsService.$inject=['$q', '$rootScope', '$cookies', 'APIServices'];
function GoogleSheetsService($q, $rootScope, $cookies, APIServices) {
    var provider = new firebase.auth.GoogleAuthProvider();

    firebase.auth().signInWithPopup(provider).then(function(result) {
        // This gives you a Google Access Token. You can use it to access the Google API.
        var token = result.credential.accessToken;
        // The signed-in user info.
        var user = result.user;
        // ...
    }).catch(function(error) {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        // The email of the user's account used.
        var email = error.email;
        // The firebase.auth.AuthCredential type that was used.
        var credential = error.credential;
        // ...
    });
}
// Your Client ID can be retrieved from your project in the Google
// Developer Console, https://console.developers.google.com
var CLIENT_ID = '551899241610-ei30p9kfjj2sbi18rlrfl271vqa9h3f3.apps.googleusercontent.com';

var SCOPES = ["https://www.googleapis.com/auth/spreadsheets.readonly"];

/**
* Check if current user has authorized this application.
*/
function checkAuth() {
    gapi.auth.authorize({
        'client_id': CLIENT_ID,
        'scope': SCOPES.join(' '),
        'immediate': true
    }, handleAuthResult);
}

/**
* Handle response from authorization server.
*
* @param {Object} authResult Authorization result.
*/
function handleAuthResult(authResult) {
    console.log(authResult);
    var authorizeDiv = document.getElementById('authorize-div');
    if (authResult && !authResult.error) {
        // Hide auth UI, then load client library.
        authorizeDiv.style.display = 'none';
        loadSheetsApi();
    } else {
        // Show auth UI, allowing the user to initiate authorization by
        // clicking authorize button.
        authorizeDiv.style.display = 'inline';
    }
}
/*

gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
    range: 'Class Data!A2:E',
}).then(function(response) {
    var range = response.result;

    if (range.values.length > 0) {
        appendPre('Name, Major:');
        for (i = 0; i < range.values.length; i++) {
            var row = range.values[i];
            // Print columns A and E, which correspond to indices 0 and 4.
            appendPre(row[0] + ', ' + row[4]);
        }
    } else {
        appendPre('No data found.');
    }
}, function(response) {
    appendPre('Error: ' + response.result.error.message);
});
*/
