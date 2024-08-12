module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(
      { isolationLevel: Sequelize.Transaction.SERIALIZABLE },
      async transaction => {
        await queryInterface.createTable(
          'car_make',
          {
            id: {
              primaryKey: true,
              type: Sequelize.STRING(20),
              allowNull: false
            },
            name: {
              type: Sequelize.STRING(20),
              allowNull: false
            },
            logo_url: {
              type: Sequelize.STRING,
              allowNull: true
            },
            info_url: {
              type: Sequelize.STRING,
              allowNull: true
            }
          },
          { transaction }
        )
      }
    )
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(
      { isolationLevel: Sequelize.Transaction.SERIALIZABLE },
      async transaction => {
        await queryInterface.dropTable('car_make', { transaction })
      }
    )
  }
}
