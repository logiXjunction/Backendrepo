'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('transporters');

    if (!table.cin_number) {
      await queryInterface.addColumn('transporters', 'cin_number', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('transporters');

    if (table.cin_number) {
      await queryInterface.removeColumn('transporters', 'cin_number');
    }
  },
};
