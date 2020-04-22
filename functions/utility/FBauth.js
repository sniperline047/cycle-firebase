const { db, admin } = require('./admin');

module.exports = (req, res, next) => {
    let idToken;
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        idToken = req.headers.authorization.split('Bearer ')[1];
    } else {
        console.log('No token found')
        return res.status(403).json({ error: 'Unauthorized'});
    }

    admin.auth().verifyIdToken(idToken)
    .then(decodeToken => {
        req.user = decodeToken;
        return db.collection('users')
            .where('userId', '==', req.user.uid)
            .limit(1)
            .get();
    })		
    .then(data => {
        req.user.firstName = data.docs[0].data().firstName;
        req.user.lastName = data.docs[0].data().lastName;
        req.user.email = data.docs[0].data().email;
        req.user.rollNo = data.docs[0].data().rollNo;
        req.user.mobileNo = data.docs[0].data().mobileNo;
        req.user.rating = data.docs[0].data().rating;
        req.user.ratingCount = data.docs[0].data().ratingCount;
        req.user.bikes = data.docs[0].data().bikes;
        req.user.imageUrl = data.docs[0].data().imageUrl;
        return next();
    })
    .catch(err => {
        console.log('Error while verifying token', err);
        return res.status(400).json(err);
    })
};
