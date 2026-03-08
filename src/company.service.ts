import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom, catchError } from 'rxjs';

@Injectable()
export class CompanyService {
    private readonly companyUrl: string;
    private readonly logger = new Logger(CompanyService.name);

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
    ) {
        this.companyUrl = this.configService.get<string>('COMPANY_SERVICE_URL')!;
    }

    async getCompanyProfile(): Promise<any> {
        const { data } = await firstValueFrom(
            this.httpService.get(`${this.companyUrl}/company`).pipe(
                catchError((error) => {
                    this.logger.error(`Error fetching company profile: ${error.message}`);
                    throw new HttpException(
                        'Cannot fetch company profile at this time',
                        HttpStatus.SERVICE_UNAVAILABLE,
                    );
                }),
            ),
        );
        return data;
    }
}
