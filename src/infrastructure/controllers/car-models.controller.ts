import { Controller, Get, Param, SetMetadata, UseGuards } from '@nestjs/common'
import { ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger'
import {
  CarModelDetailQueryModel,
  GetCarModelDetailQueryHandler
} from '../../application/queries/get-car-model-detail.query.handler.db'
import {
  CarModelListQueryModel,
  GetCarModelListQueryHandler
} from '../../application/queries/get-car-model-list.query.handler.db'
import {
  ApiKeyAccessLevel,
  ApiKeyAuthGuard,
  METADATA_IDENTIFIER_API_KEY_ACCESS_LEVEL
} from '../../utils/auth/api-key.auth-guard'
import { handleResult } from '../../utils/result/result.handler'

@UseGuards(ApiKeyAuthGuard)
@ApiSecurity('api_key')
@Controller('car-models')
@ApiTags('Car Models')
export class CarModelsController {
  constructor(
    private readonly getCarModelListQueryHandler: GetCarModelListQueryHandler,
    private readonly getCarModelDetailQueryHandler: GetCarModelDetailQueryHandler
  ) {}

  @SetMetadata(METADATA_IDENTIFIER_API_KEY_ACCESS_LEVEL, ApiKeyAccessLevel.USER)
  @Get('/makes/:makeId/models')
  @ApiResponse({
    type: CarModelListQueryModel
  })
  async getCarModelList(
    @Param('makeId') makeId: string
  ): Promise<CarModelListQueryModel> {
    const result = await this.getCarModelListQueryHandler.execute({
      makeId
    })
    return handleResult(result)
  }

  @SetMetadata(METADATA_IDENTIFIER_API_KEY_ACCESS_LEVEL, ApiKeyAccessLevel.USER)
  @Get('/models/:modelId')
  @ApiResponse({
    type: CarModelDetailQueryModel
  })
  async getCarModelDetail(
    @Param('modelId') modelId: string
  ): Promise<CarModelDetailQueryModel> {
    const result = await this.getCarModelDetailQueryHandler.execute({
      modelId
    })
    return handleResult(result)
  }
}
