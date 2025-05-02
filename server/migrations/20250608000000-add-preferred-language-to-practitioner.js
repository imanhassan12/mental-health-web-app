module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Practitioners', 'preferredLanguage', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Practitioners', 'preferredLanguage');
  }
}; 