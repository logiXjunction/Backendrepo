module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('transporters', 'cin_number', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('transporters', 'cin_number');
  },
};
