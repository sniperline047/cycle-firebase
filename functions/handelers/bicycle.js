const { admin, db } = require('../utility/admin');

const config = require('../utility/config');

exports.addUserBicycle = (request, response) => {
    const noImg = 'screen.jpg';

    const newBicycle = {
        company: request.body.company,
        model: request.body.model,
        color: request.body.color,
        bicyclefrmNo: request.body.bicyclefrmNo,
        availibility: false,
        leased: false,
        rollNo: request.user.rollNo,
        bicycleUrl: `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${noImg}?alt=media`
    };

    db.doc(`/bicycle/${newBicycle.bicyclefrmNo}`).get()
    .then((doc) => {
        if(doc.exists) {
            return response.status(400).json({error: 'this bicycle is already added'})
        } else {
            return db.doc(`/bicycle/${newBicycle.bicyclefrmNo}`).set(newBicycle)
        }
    })
    .then(() => {
        db.doc(`/users/${request.user.rollNo}`).update({bikes: request.user.bikes + 1});
    })
    .then(() => {
        response.json({ message: `Bicycle added succesfully`});
    })
    .catch((err) => {
        response.status(500).json({ error: 'Something went wrong'});
        console.log(err);
    })
};

exports.getUserBicycle = (request,response) => {
    db.collection('bicycle').where('rollNo', '==', request.user.rollNo)
    .get()
    .then((data) => {
        let bicyle = [];
        data.forEach((doc) => {
            bicyle.push({
                company: doc.data().company,
                model: doc.data().model,
                color: doc.data().color,
                bicyclefrmNo: doc.data().bicyclefrmNo,
                availibility: doc.data().availibility,
                leased: doc.data().leased,
                bicycleUrl: doc.data().bicycleUrl
            });
        });
        return response.json(bicyle);
    })
    .catch((err) => {
        console.log(err);
    })
};

exports.addBicycleAvail = (request,response) => {
    const newBicycleAvail = {
        caption: request.body.caption,
        startTime: request.body.startTime,
        endTime: request.body.endTime,
        price: request.body.price,
        rollNo: request.user.rollNo,
        bicyclefrmNo: request.params.bicyclefrmNo
    };

    db.doc(`/bicycle/${request.params.bicyclefrmNo}`).get()
    .then((doc) => {
        if(!doc.exists) {
            return response.status(404).json({ error: 'Bicycle not found' });
        } else {
            if(doc.data().availibility || doc.data().leased) {
                return response.status(404).json({ error: 'Bicycle already up for lease' });
            }
            return doc.ref.update({ availibility: !doc.data().availibility });
        }
    })
    .then(() => {
        db.doc(`/bicycle-availibility/${newBicycleAvail.bicyclefrmNo}`).set(newBicycleAvail)
    })
    .then(() => {
        response.json({ message: `Bicycle added succesfully for lease`});
    })
    .catch((err) => {
        console.log(err);
        return response.status(500).json({error: 'Something went wrong'});
    });
}

exports.deleteBicycleAvail = (request,response) => {
    db.doc(`/bicycle/${request.params.bicyclefrmNo}`).get() 
    .then((doc) => {
        if(!doc.exists) {
            return response.status(404).json({ error: 'Bicycle not found' });
        } else {
            if(!doc.data().availibility) {
                return response.status(404).json({ error: 'Bicycle is not up for lease' });
            } else {
                return doc.ref.update({ availibility: !doc.data().availibility });
            }
        }
    })
    .then(() => {
        db.doc(`/bicycle-availibility/${request.params.bicyclefrmNo}`).delete()
    })
    .then(() => {
        response.json({ message: `Bicycle removed succesfully from lease`});
    })
    .catch((err) => {
        console.log(err);
        return response.status(500).json({error: 'Something went wrong, try again!'});
    });
}

exports.getBicycleAvail = (request,response) => {
    db.collection('bicycle-availibility')
    .orderBy('startTime', 'desc')
    .get()
    .then((data) => {
        let bicycle = [];
        data.forEach((doc) => {
            bicycle.push({   
                bicyclefrmNo: doc.id,
                caption: doc.data().caption,
                startTime: doc.data().startTime,
                endTime: doc.data().endTime,
                price: doc.data().price,
                rating: request.user.rating,
                rollNo: request.user.rollNo            
            });
        });
        return response.json(bicycle);
    })
    .catch((err) => {
        console.log(err);
        return res.status(400).json({error: 'Something went wrong'});
    })
}

exports.getBicycleInfo = (request,response) => {
    let bicycle = [];
    db.collection('bicycle')
    .where('bicyclefrmNo', '=', request.params.bicyclefrmNo)
    .get()
    .then((data) => {
        bicycle.push({   
            bicyclefrmNo: data.docs[0].data().bicyclefrmNo,
            company: data.docs[0].data().company,
            color: data.docs[0].data().color,
            bicycleUrl: data.docs[0].data().bicycleUrl,
            model: data.docs[0].data().model,
            rollNo: data.docs[0].data().rollNo            
        });
    })
    .then(() => {
        db.collection('users')
        .where('rollNo', '=', bicycle[0].rollNo)
        .get()
        .then((data) => {
            bicycle.push({
                mobile: data.docs[0].data().mobileNo,
                name: data.docs[0].data().firstName + ' ' + data.docs[0].data().lastName,
                email: data.docs[0].data().email,
                rating: data.docs[0].data().rating + '/' + data.docs[0].data().ratingCount,
            })
            return response.json(bicycle);
        });
    })
    .catch((err) => {
        console.log(err);
        return res.status(400).json({error: 'Something went wrong'});
    })
}


exports.addBicycleImage = (request,response) => {
    const BusBoy = require('busboy');
    const path = require('path');
    const os = require('os');
    const fs = require('fs');

    const busboy = new BusBoy({ headers: request.headers });

    let imageToBeUploaded = {};
    let imageFileName;
    let bicycleUrl
  
    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
        if (mimetype !== 'image/jpeg' && mimetype !== 'image/png') {
            return response.status(400).json({ error: 'Wrong file type submitted' });
        }
        
        const imageExtension = filename.split('.')[filename.split('.').length - 1];
        imageFileName = `${(request.user.rollNo + '-' + request.user.bikes + 1).toString()}.${imageExtension}`;
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
            bicycleUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFileName}?alt=media`;
            return db.doc(`/bicycle/${request.params.bicyclefrmNo}`).update({ bicycleUrl });
        })
        .then(() => {
            return response.json({ message: 'Image uploaded successfully' });
        })
        .catch((err) => {
            console.error(err);
            return response.status(500).json({ error: 'something went wrong', url: bicycleUrl });
        });
    }); 
    busboy.end(request.rawBody);
}
