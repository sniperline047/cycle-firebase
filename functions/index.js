const functions = require('firebase-functions');
const app = require('express')();
const FBauth = require('./utility/FBauth');
const cors = require('cors');

app.use(cors());

const { 
    addUserBicycle,  
    addBicycleImage, 
    getUserBicycle,
    getBicycleInfo, 
    addBicycleAvail,
    deleteBicycleAvail, 
    getBicycleAvail,
} = require('./handelers/bicycle');

const {
    register,
    login,
    userProfile,
    uploadImage,
} = require('./handelers/users');

//bicycle-ROUTES
app.post('/addBicycle', FBauth, addUserBicycle); //for user to add his bikes
app.post('/addBicycleImage/:bicyclefrmNo', FBauth, addBicycleImage); //for user to add bicycle image for a bike
app.get('/getBicycle', FBauth, getUserBicycle); //to get all users bike
app.get('/getSingleBike/:bicyclefrmNo', FBauth, getBicycleInfo); //to mail bicycle info after approval
app.post('/addBicycleAvail/:bicyclefrmNo', FBauth, addBicycleAvail); //to add bicycle for lease
app.post('/deleteBicycleAvail/:bicyclefrmNo', deleteBicycleAvail); //to remove bicycle from lease
app.get('/getBicycleAvail', FBauth, getBicycleAvail); //to get all available bicycles

//users-ROUTES
app.post('/register', register);
app.post('/login', login);
app.get('/profile', FBauth, userProfile);
app.post('/users/image', FBauth, uploadImage);

exports.api = functions.https.onRequest(app);
