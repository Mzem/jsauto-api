import { Injectable } from '@nestjs/common'
import { ApiProperty } from '@nestjs/swagger'
import { QueryHandler } from '../types/query-handler'
import { CarMakeSqlModel } from '../../infrastructure/sequelize/models/car-make.sql-model'
import { Result, success } from '../../utils/result/result'
import { mapMakeSQLToQueryModel } from './mappers'

export class CarMakeQueryModel {
  @ApiProperty()
  id: string

  @ApiProperty()
  name: string

  @ApiProperty({ required: false })
  category?: string

  @ApiProperty()
  remap: boolean
}

@Injectable()
export class GetCarMakesQueryHandler extends QueryHandler<
  void,
  CarMakeQueryModel[]
> {
  constructor() {
    super('GetCarMakesQueryHandler')
  }

  async handle(): Promise<Result<CarMakeQueryModel[]>> {
    const sqlModels = await CarMakeSqlModel.findAll({ order: ['name'] })
    return success(
      sqlModels.filter(sql => sql.category).map(mapMakeSQLToQueryModel)
    )
  }
}
