import {
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

const client = jwksClient({
  jwksUri: `${process.env.COGNITO_ISSUER}/.well-known/jwks.json`,
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err || !key) {
      return callback(err || new Error('Signing key not found'));
    }

    callback(null, key.getPublicKey());
  });

}

export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const token = req.cookies['access_token'];

    if (!token) throw new UnauthorizedException();

    return new Promise((resolve, reject) => {
      jwt.verify(
        token,
        getKey,
        {
          issuer: process.env.COGNITO_ISSUER,
          algorithms: ['RS256'],
        },
        (err, decoded) => {
          if (err) reject(new UnauthorizedException());
          req.user = decoded;
          resolve(true);
        },
      );
    });
  }
}
