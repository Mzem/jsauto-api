import { HttpModule } from '@nestjs/axios'
import {
  MiddlewareConsumer,
  Module,
  ModuleMetadata,
  NestModule,
  Provider,
  RequestMethod
} from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TerminusModule } from '@nestjs/terminus'
import { FakeJobHandler } from './application/jobs/fake.job.handler'
import { FindCarRegQueryHandler } from './application/queries/find-car-reg.query.handler.db'
import { GetCarMakesQueryHandler } from './application/queries/get-car-makes.query.handler.db'
import { GetCarModelDetailQueryHandler } from './application/queries/get-car-model-detail.query.handler.db'
import { GetCarModelListQueryHandler } from './application/queries/get-car-model-list.query.handler.db'
import { GetMissingRSCarRegsQueryHandler } from './application/queries/scrap-regs/get-missing-car-regs.query.handler.db'
import { GetPostCarRegNullQueryHandler } from './application/queries/scrap-regs/get-post-car-reg-null.query.handler.db'
import { GetPostCarRegQueryHandler } from './application/queries/scrap-regs/get-post-car-reg.query.handler.db'
import configuration from './config/configuration'
import { AppController } from './infrastructure/controllers/app.controller'
import { CarMakesController } from './infrastructure/controllers/car-makes.controller'
import { CarModelsController } from './infrastructure/controllers/car-models.controller'
import { CarRegsController } from './infrastructure/controllers/car-regs.controller'
import { databaseProviders } from './infrastructure/sequelize/providers'
import { ApiKeyAuthGuard } from './utils/auth/api-key.auth-guard'
import { configureLoggerModule } from './utils/monitoring/logger.module'
import { CacheControlMiddleware } from './utils/middleware/cache-control.middleware'
import {
  JobPlannerRepositoryToken,
  JobPlannerService
} from './domain/job-planner'
import { JobPlannerRedisRepository } from './infrastructure/repositories/job-planner-redis.repository.db'
import { DateService } from './utils/date.service'
import { TaskService } from './application/task.service'
import { WorkerService } from './application/worker.service.db'
import { CleanJobsJobHandler } from './application/jobs/clean-jobs.job.handler'
import { InitCronsCommandHandler } from './application/tasks/init-crons'
import { PlanCronExecutionCommandHandler } from './application/tasks/plan-cron-execution'
import { UpdateCarEnginesJobHandler } from './application/jobs/update-car-engines.job.handler'

export const buildModuleMetadata = (): ModuleMetadata => ({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.environment',
      cache: true,
      load: [configuration]
    }),
    HttpModule.register({
      timeout: 5000
    }),
    TerminusModule,
    configureLoggerModule()
  ],
  controllers: [
    CarRegsController,
    CarMakesController,
    CarModelsController,
    AppController
  ],
  providers: [
    ...buildQueryCommandsProviders(),
    ...buildJobHandlerProviders(),
    WorkerService,
    TaskService,
    DateService,
    ApiKeyAuthGuard,
    {
      provide: JobPlannerRepositoryToken,
      useClass: JobPlannerRedisRepository
    },
    ...databaseProviders
  ],
  exports: [...databaseProviders]
})

export function buildQueryCommandsProviders(): Provider[] {
  return [
    GetCarMakesQueryHandler,
    GetCarModelListQueryHandler,
    GetCarModelDetailQueryHandler,
    FindCarRegQueryHandler,
    GetPostCarRegQueryHandler,
    GetPostCarRegNullQueryHandler,
    GetMissingRSCarRegsQueryHandler,
    JobPlannerService,
    InitCronsCommandHandler,
    PlanCronExecutionCommandHandler
  ]
}

export function buildJobHandlerProviders(): Provider[] {
  return JobHandlerProviders
}

export const JobHandlerProviders = [
  FakeJobHandler,
  CleanJobsJobHandler,
  UpdateCarEnginesJobHandler
]

@Module(buildModuleMetadata())
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(CacheControlMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.GET })
  }
}
