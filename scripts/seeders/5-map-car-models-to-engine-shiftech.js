const { Sequelize, QueryTypes } = require('sequelize')
require('dotenv').config({ path: '../../.environment' })

const fs = require('fs').promises
const path = require('path')
const resultFile = path.join(__dirname, 'matching.json')
fs.writeFile(resultFile, JSON.stringify([], null, 2), 'utf8')

let countMatchedModels = 0
let countMatchedEngines = 0

async function addDataToJson(filePath, newData) {
  const data = await fs.readFile(filePath, 'utf8')
  newData.potentialModels.forEach((model, index) => {
    if (data.includes(model.id)) {
      newData.potentialModels[index].repeated = true
    }
  })

  let json = JSON.parse(data)
  json.push(newData)
  await fs.writeFile(filePath, JSON.stringify(json, null, 2), 'utf8')
}
function intervalsIntersect(start1, end1, start2, end2) {
  if (start1 > end1 || start2 > end2) return false

  if (start1 == end1) {
    if (end1 == start2) return true
    if (start1 == end2) return true
  }
  if (start2 == end2) {
    if (end2 == start1) return true
    if (start2 == end1) return true
  }
  if (end1 <= start2) return false
  if (end2 <= start1) return false

  return true
  //return (start1 <= end2 && end1 > start2) || (start2 < end1 && end2 >= start1)
}

const databaseUrl = process.env.DATABASE_URL

const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres'
})

sequelize.transaction(async transaction => {
  const enginesRaw = await sequelize.query(`SELECT * FROM car_engine`, {
    transaction
  })

  for (const carEngine of enginesRaw[0]) {
    console.log(
      'CURRENT ' +
        carEngine.id +
        ' ' +
        carEngine.make_id +
        ' ' +
        carEngine.model
    )

    const matchingModels = await sequelize.query(
      `SELECT * FROM car_model WHERE
        make_id = ? AND
        SIMILARITY(fuel::text, ?) > 0.4 AND
        (SIMILARITY(model, ?) > 0.2 OR POSITION(? IN model) > 0 OR POSITION(model IN ?) > 0)
      `,
      {
        replacements: [
          carEngine.make_id,
          carEngine.fuel,
          carEngine.model,
          carEngine.model,
          carEngine.model
        ],
        type: QueryTypes.SELECT,
        transaction
      }
    )

    // const found = matchingModels.find(
    //   model => model.id === '25cca80b-3d98-4d2e-888c-37547d89a2df'
    // )
    // if (!found) {
    //   continue
    // }
    // await new Promise(resolve => setTimeout(resolve, 5000))

    if (matchingModels?.length && matchingModels.length > 0) {
      const potentialModels = matchingModels
        .filter(matchingModel => {
          console.log(
            matchingModel.id +
              ' ' +
              matchingModel.make_id +
              ' ' +
              matchingModel.model
          )

          if (matchingModel.hp && carEngine.hp) {
            if (Math.abs(matchingModel.hp - carEngine.hp) > 10) {
              console.log('failing hp')
              return false
            }
          }
          if (matchingModel.torque && carEngine.torque) {
            if (Math.abs(matchingModel.torque - carEngine.torque) > 25) {
              console.log('failing torque')
              return false
            }
          }
          if (carEngine.cylinder && matchingModel.cylinder) {
            if (
              Math.abs(
                Number(carEngine.cylinder) - Number(matchingModel.cylinder)
              ) > 0.21
            ) {
              console.log('failing cyl')
              return false
            }
          }

          const startYearEngine = carEngine.from_year
          const startYearModel = matchingModel.from_year
          const endYearModel = matchingModel.to_year

          const isMatchingYears =
            Math.abs(startYearEngine - startYearModel) <= 3 &&
            startYearEngine <= endYearModel

          if (!isMatchingYears) {
            console.log('failing years')
            return false
          }

          return true
        })
        .map(matchingModel => {
          delete matchingModel.engine_detail
          delete matchingModel.engine_type
          delete matchingModel.displacement
          delete matchingModel.body
          delete matchingModel.hp_detail
          delete matchingModel.torque_detail
          delete matchingModel.electric_hp
          delete matchingModel.acceleration
          delete matchingModel.top_speed
          delete matchingModel.fuel_system
          delete matchingModel.fuel_capacity
          delete matchingModel.fuel_highway
          delete matchingModel.fuel_urban
          delete matchingModel.fuel_combined
          delete matchingModel.drive_type
          delete matchingModel.gearbox
          delete matchingModel.front_brakes
          delete matchingModel.rear_brakes
          delete matchingModel.tire_size
          delete matchingModel.length
          delete matchingModel.width
          delete matchingModel.height
          delete matchingModel.wheelbase
          delete matchingModel.cargo_volume
          delete matchingModel.ground_clearance
          delete matchingModel.weight
          delete matchingModel.weight_limit
          delete matchingModel.updated_at
          return matchingModel
        })

      if (potentialModels.length) {
        delete carEngine.hp_stage1
        delete carEngine.hp_stage2
        delete carEngine.torque_stage1
        delete carEngine.torque_stage2
        delete carEngine.url_source_brperf
        delete carEngine.url_source_shiftech
        delete carEngine.updated_at
        await addDataToJson(resultFile, { carEngine, potentialModels })

        countMatchedModels += potentialModels.length
        countMatchedEngines++
        for (const model of potentialModels) {
          await sequelize.query(
            `INSERT INTO car_engine_model_association (car_engine_id, car_model_id) VALUES (?, ?) ON CONFLICT (car_engine_id, car_model_id) DO NOTHING`,
            {
              replacements: [carEngine.id, model.id],
              transaction
            }
          )
        }
      }
    }

    console.log(
      'Matched Models ' +
        countMatchedModels +
        ' Matched engines ' +
        countMatchedEngines
    )
    //await new Promise(resolve => setTimeout(resolve, 25000))
  }
})
