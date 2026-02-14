import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import {
  CognitoIdentityProviderClient,
  AdminInitiateAuthCommand,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { createHmac } from 'crypto';
import jwksClient from 'jwks-rsa';
import * as jwt from 'jsonwebtoken';
import { getCognitoKey } from './utils/helpers.aws';


@Injectable()
export class AuthService {
  private client = new CognitoIdentityProviderClient({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    }
  });

  // Función para calcular el SECRET_HASH
  private calculateSecretHash(username: string): string {
    const clientId = process.env.COGNITO_CLIENT_ID!;
    const clientSecret = process.env.COGNITO_CLIENT_SECRET!;

    const message = username + clientId;
    const hmac = createHmac('sha256', clientSecret);
    hmac.update(message);
    return hmac.digest('base64');
  }

  async login(email: string, password: string) {
    try {
      const command = new AdminInitiateAuthCommand({
        UserPoolId: process.env.COGNITO_USER_POOL_ID!,
        ClientId: process.env.COGNITO_CLIENT_ID!,
        AuthFlow: 'ADMIN_USER_PASSWORD_AUTH',
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password,
          SECRET_HASH: this.calculateSecretHash(email),
        },
      });

      const result = await this.client.send(command);
      return result.AuthenticationResult!;

    } catch (error) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
  }

  async me(accessToken: string) {
    if (!accessToken) {
      throw new UnauthorizedException('No autenticado');
    }

    const result = new Promise((resolve, reject) => {
      jwt.verify(
        accessToken,
        getCognitoKey,
        {
          issuer: process.env.COGNITO_ISSUER,
          algorithms: ['RS256'],
        },
        (err, decoded: any) => {
          if (err) {
            return reject(new UnauthorizedException('Sesión inválida'));
          }

          resolve({
            id: decoded.sub,          // user id
            email: decoded.email,     // si lo tienes en Cognito
            name: decoded.name,       // si lo guardaste como atributo
          });
        },
      );
    });
    console.log('Decoded user info:', result);
    return result;
  }


  async register(email: string, password: string, name: string) {
    try {
      console.log('Iniciando registro para:', email, name, password);
      const createUserCommand = new AdminCreateUserCommand({
        UserPoolId: process.env.COGNITO_USER_POOL_ID!,
        Username: email, // Usamos email como username
        TemporaryPassword: password, // Contraseña inicial
        MessageAction: 'SUPPRESS', // Suprime el email automático de Cognito
        UserAttributes: [
          { Name: 'email', Value: email },
          { Name: 'email_verified', Value: 'true' }, // Verificado por defecto
          { Name: 'name', Value: name }, // Atributo personalizado "name"
        ],
        DesiredDeliveryMediums: [], // No enviar email de bienvenida
      });

      const userResult = await this.client.send(createUserCommand);

      const setPasswordCommand = new AdminSetUserPasswordCommand({
        UserPoolId: process.env.COGNITO_USER_POOL_ID!,
        Username: email,
        Password: password,
        Permanent: true,
      });

      await this.client.send(setPasswordCommand);

      return {
        success: true,
        userId: userResult.User?.Username,
        message: 'Usuario registrado exitosamente'
      };

    } catch (error: any) {
      console.error('Error en registro:', error);

      // Manejo de errores específicos de Cognito
      if (error.name === 'UsernameExistsException') {
        throw new BadRequestException('El usuario ya existe');
      }
      if (error.name === 'InvalidPasswordException') {
        throw new BadRequestException('La contraseña no cumple los requisitos');
      }
      if (error.name === 'InvalidParameterException') {
        throw new BadRequestException('Datos de registro inválidos');
      }

      throw new BadRequestException('Error al crear el usuario');
    }
  }
}