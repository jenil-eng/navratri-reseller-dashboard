const googleSheetsService = require('../services/googleSheetsService');

exports.getLists = async (req, res) => {
  try {
    const lists = await googleSheetsService.getLists();
    res.json({ success: true, data: lists });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch dropdown lists: ' + err.message });
  }
};

exports.updateLists = async (req, res) => {
  try {
    const { passNames, passCategories, passGivenStatus, passDeliveryMethods, navratriDays } = req.body;

    const currentLists = await googleSheetsService.getLists();

    const updatedLists = {
      passNames: Array.isArray(passNames) ? passNames : currentLists.passNames,
      passCategories: Array.isArray(passCategories) ? passCategories : currentLists.passCategories,
      passGivenStatus: Array.isArray(passGivenStatus) ? passGivenStatus : currentLists.passGivenStatus,
      passDeliveryMethods: Array.isArray(passDeliveryMethods) ? passDeliveryMethods : currentLists.passDeliveryMethods,
      navratriDays: Array.isArray(navratriDays) ? navratriDays : currentLists.navratriDays
    };

    const saved = await googleSheetsService.updateEntireLists(updatedLists);
    res.json({
      success: true,
      message: 'Dropdown options updated successfully.',
      data: saved
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update dropdown lists: ' + err.message });
  }
};
