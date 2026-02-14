import jwksClient from 'jwks-rsa';

const jwks = jwksClient({
    jwksUri: `${process.env.COGNITO_ISSUER}/.well-known/jwks.json`,
});

export function getCognitoKey(header, callback) {
    jwks.getSigningKey(header.kid, (err, key) => {
        if (err || !key) {
            return callback(err);
        }

        callback(null, key.getPublicKey());
    });
}
