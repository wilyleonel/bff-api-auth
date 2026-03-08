import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom, catchError } from 'rxjs';

@Injectable()
export class ProductsService {
    private readonly productsUrl: string;
    private readonly logger = new Logger(ProductsService.name);

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
    ) {
        this.productsUrl = this.configService.get<string>('PRODUCTS_SERVICE_URL')!;
    }

    async getProducts(): Promise<any> {
        const { data } = await firstValueFrom(
            this.httpService.get(`${this.productsUrl}/products`).pipe(
                catchError((error) => {
                    this.logger.error(`Error fetching products: ${error.message}`);
                    throw new HttpException(
                        'Cannot fetch products at this time',
                        HttpStatus.SERVICE_UNAVAILABLE,
                    );
                }),
            ),
        );
        return data;
    }

    async getProductById(id: string): Promise<any> {
        const { data } = await firstValueFrom(
            this.httpService.get(`${this.productsUrl}/products/${id}`).pipe(
                catchError((error) => {
                    this.logger.error(`Error fetching product ${id}: ${error.message}`);
                    throw new HttpException(
                        'Product not found or service unavailable',
                        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
                    );
                }),
            ),
        );
        return data;
    }
}
