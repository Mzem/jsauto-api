import {
  Column,
  DataType,
  Model,
  PrimaryKey,
  Table
} from 'sequelize-typescript'

export class CarMakeDto extends Model {
  @PrimaryKey
  @Column({ field: 'id' })
  id: string

  @Column({ field: 'name', type: DataType.STRING })
  name: string

  @Column({ field: 'logo_url', type: DataType.STRING })
  logoUrl: string | null
}

@Table({ timestamps: false, tableName: 'car_make' })
export class CarMakeSqlModel extends CarMakeDto {}
