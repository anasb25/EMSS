import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AuthModule } from './auth/auth.module';
import { CustomersModule } from './customers/customers.module';
import { DatabaseModule } from './database/database.module';
import { runPreSyncCleanup } from './database/run-pre-sync-cleanup';
import { InvoicesModule } from './invoices/invoices.module';
import { BillsModule } from './bills/bills.module';
import { PayablesModule } from './payables/payables.module';
import { ExpensesModule } from './expenses/expenses.module';
import { BankModule } from './bank/bank.module';
import { CashModule } from './cash/cash.module';
import { SalesModule } from './sales/sales.module';
import { ReceiptVouchersModule } from './receipt-vouchers/receipt-vouchers.module';
import { ReceivablesModule } from './receivables/receivables.module';
import { VendorsModule } from './vendors/vendors.module';
import { JobCardsModule } from './job-cards/job-cards.module';
import { ProductsModule } from './products/products.module';
import { ReportsModule } from './reports/reports.module';
import { LedgerAccountsModule } from './ledger-accounts/ledger-accounts.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const databaseUrl = config.get<string>('DATABASE_URL');
        const isProduction = config.get<string>('NODE_ENV') === 'production';

        if (databaseUrl) {
          return {
            type: 'postgres' as const,
            url: databaseUrl,
            autoLoadEntities: true,
            synchronize: !isProduction,
            ssl: isProduction ? { rejectUnauthorized: false } : undefined,
          };
        }

        return {
          type: 'postgres' as const,
          host: config.get<string>('DB_HOST', 'localhost'),
          port: config.get<number>('DB_PORT', 5432),
          username: config.get<string>('DB_USERNAME', 'emss'),
          password: config.get<string>('DB_PASSWORD', 'emss_password'),
          database: config.get<string>('DB_NAME', 'emss_db'),
          autoLoadEntities: true,
          synchronize: !isProduction,
        };
      },
      dataSourceFactory: async (options) => {
        if (!options) {
          throw new Error('Database options are required.');
        }

        const postgresOptions = options as {
          synchronize?: boolean;
          url?: string;
          host?: string;
          port?: number;
          username?: string;
          password?: string;
          database?: string;
        };

        if (postgresOptions.synchronize && !postgresOptions.url) {
          await runPreSyncCleanup({
            host: postgresOptions.host,
            port: postgresOptions.port,
            username: postgresOptions.username,
            password: postgresOptions.password,
            database: postgresOptions.database,
          });
        }

        return new DataSource(options).initialize();
      },
    }),
    AuthModule,
    CustomersModule,
    ProductsModule,
    JobCardsModule,
    InvoicesModule,
    ReceivablesModule,
    CashModule,
    BankModule,
    SalesModule,
    ExpensesModule,
    ReceiptVouchersModule,
    BillsModule,
    PayablesModule,
    ReportsModule,
    LedgerAccountsModule,
    VendorsModule,
    DatabaseModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
