const admin = require('firebase-admin');
//var serviceAccount = require("../../../cycle-it-be434-firebase-adminsdk-7az2m-bb54a7f519.json");
// {
//     credential: admin.credential.cert(serviceAccount),
//     databaseURL: "https://cycle-it-be434.firebaseio.com",
//     storageBucket: "cycle-it-be434.appspot.com"
// }
admin.initializeApp();

const db = admin.firestore();

module.exports = { admin, db };
