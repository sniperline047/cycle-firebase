const { admin, db } = require('../utility/admin');

const config = require('../utility/config');

const firebase = require('firebase');
firebase.initializeApp(config);

const { validateSignUpData, validateLoginData } = require('../utility/validators');

exports.register = (request,response) => {
    const newUser = {
        email: request.body.email,
        password: request.body.password,
        rollNo: request.body.rollNo
    };

    const { valid, errors } = validateSignUpData(newUser);

    if(!valid) return response.status(400).json(errors);

    const noImg = 'no-user-img.jpeg'

    db.doc(`/users/${newUser.rollNo}`).get()
    .then((doc) => {
        if(doc.exists) {
            return response.status(400).json({info: 'This roll number is already registered'})
        } else {
            return firebase.auth()
            .createUserWithEmailAndPassword(newUser.email, newUser.password);
        }
    })
    .then((data) => {
        const userCredentials = {
            firstName: request.body.firstName,
            lastName: request.body.lastName,
            mobileNo: request.body.mobileNo,
            email: request.body.email,
            rollNo: request.body.rollNo,
            imageUrl: `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${noImg}?alt=media`,
            rating: 0,
            ratingCount: 0,
            bikes: 0,
            userId: data.user.uid
        };
        return db.doc(`/users/${newUser.rollNo}`).set(userCredentials);
    })
    .then(() => {
        response.status(201).json({message: 'User registered succesfully'});
    }) 
    .catch((err) => {
        console.log(err);
        if(err.code === 'auth/email-already-in-use') {
            return response.status(400).json({email: 'Email already in use'});
        } else {
            return response.status(500).json({error: err.code});
        }
    })
};

exports.login = (request,response) => {
    const user = {
        email: request.body.email,
        password: request.body.password
    };

    const { valid, errors } = validateLoginData(user);

    if(!valid) return response.status(400).json(errors);

    firebase.auth()
    .signInWithEmailAndPassword(user.email, user.password)
    .then((data) => {
        return data.user.getIdToken();
    })
    .then((token) => {
        return response.json({token});
    })
    .catch((err) => {
        console.log(err);
        if(err.code === 'auth/wrong-password') {
            return response.status(403).json({error: 'Wrong credentials, please try again'});
        }
        else if(err.code === 'auth/network-request-failed') {
            return response.status(500).json({error: 'Not connected to internet'});
        }
        else {
            return response.status(500).json({error: err.code});
        }
    })
};

exports.userProfile = (request,response) => {
    const userInfo = {
        firstName: request.user.firstName,
        lastName: request.user.lastName,
        mobileNo: request.user.mobileNo,
        email: request.user.email,
        rating: request.user.rating,
        ratingCount: request.user.ratingCount,
        imageUrl: request.user.imageUrl
    }
    return response.status(201).json(userInfo);
};

exports.uploadImage = (request,response) => {
    const BusBoy = require('busboy');
    const path = require('path');
    const os = require('os');
    const fs = require('fs');

    const busboy = new BusBoy({ headers: request.headers });

    let imageToBeUploaded = {};
    let imageFileName;
    let imageUrl;
  
    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
        console.log(fieldname, file, filename, encoding, mimetype);

        if (mimetype !== 'image/jpeg' && mimetype !== 'image/png') {
            return response.status(400).json({ error: 'Wrong file type submitted' });
        }
        
        const imageExtension = filename.split('.')[filename.split('.').length - 1];
        imageFileName = `${Math.round(Math.random() * 1000000000000).toString()}.${imageExtension}`;
        const filepath = path.join(os.tmpdir(), imageFileName);
        imageToBeUploaded = { filepath, mimetype };
        file.pipe(fs.createWriteStream(filepath));
    });

    busboy.on('finish', () => {
        admin.storage().bucket().upload(imageToBeUploaded.filepath, {
            resumable: false,
            metadata: {
                metadata: {
                    contentType: imageToBeUploaded.mimetype
                }
            }
        })
        .then(() => {
            imageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFileName}?alt=media`;
            return db.doc(`/users/${request.user.rollNo}`).update({ imageUrl });
        })
        .then(() => {
            return response.json({ message: 'Image uploaded successfully', url: imageUrl });
        })
        .catch((err) => {
            console.error(err);
            return response.status(500).json({ error: 'something went wrong' });
        });
    }); 
    busboy.end(request.rawBody);
};
