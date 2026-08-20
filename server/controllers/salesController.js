const googleSheetsService = require('../services/googleSheetsService');

// Indian Mobile Number Validator (allowing 10 digits or prefixed with +91/91)
function isValidIndianMobile(mobile) {
  if (!mobile) return false;
  const str = String(mobile).trim().replace(/[\s-]/g, '');
  const pattern = /^(?:\+91|91)?[6-9]\d{9}$/;
  return pattern.test(str);
}

exports.getAllSales = async (req, res) => {
  try {
    const sales = await googleSheetsService.getSales();
    res.json({ success: true, data: sales, isGoogleSheetsConnected: googleSheetsService.isConfigured });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Unable to connect to Google Sheets. ' + err.message });
  }
};

exports.addSale = async (req, res) => {
  try {
    const {
      customerName,
      mobileNumber,
      passName,
      passCategory,
      quantity,
      buyingPrice,
      sellingPrice,
      passGiven,
      passDeliveryMethod,
      dateSold,
      navratriDay,
      notes
    } = req.body;

    // Validate required fields
    if (!customerName || !customerName.trim()) {
      return res.status(400).json({ message: 'Customer Name is required.' });
    }
    if (!mobileNumber || !isValidIndianMobile(mobileNumber)) {
      return res.status(400).json({ message: 'Please provide a valid 10-digit Indian Mobile Number.' });
    }
    if (!passName || !passName.trim()) {
      return res.status(400).json({ message: 'Pass Name is required.' });
    }
    if (!passCategory || !passCategory.trim()) {
      return res.status(400).json({ message: 'Pass Category is required.' });
    }
    const qty = Number(quantity);
    if (isNaN(qty) || qty < 1) {
      return res.status(400).json({ message: 'Quantity must be at least 1.' });
    }
    const buyPrice = Number(buyingPrice);
    if (isNaN(buyPrice) || buyPrice < 0) {
      return res.status(400).json({ message: 'Buying Price cannot be negative.' });
    }
    const sellPrice = Number(sellingPrice);
    if (isNaN(sellPrice) || sellPrice < 0) {
      return res.status(400).json({ message: 'Selling Price cannot be negative.' });
    }
    if (!dateSold) {
      return res.status(400).json({ message: 'Date Sold is required.' });
    }
    if (!navratriDay || !navratriDay.trim()) {
      return res.status(400).json({ message: 'Navratri Day is required.' });
    }

    const saleData = {
      customerName: customerName.trim(),
      mobileNumber: String(mobileNumber).trim(),
      passName: passName.trim(),
      passCategory: passCategory.trim(),
      quantity: qty,
      buyingPrice: buyPrice,
      sellingPrice: sellPrice,
      passGiven: passGiven || 'No',
      passDeliveryMethod: passDeliveryMethod || 'Other',
      dateSold,
      navratriDay: navratriDay.trim(),
      notes: notes ? notes.trim() : ''
    };

    const newSale = await googleSheetsService.addSale(saleData);
    res.status(201).json({
      success: true,
      message: 'Sale added successfully.',
      data: newSale
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Unable to save sale. Please try again. Error: ' + err.message
    });
  }
};

exports.updateSale = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      customerName,
      mobileNumber,
      passName,
      passCategory,
      quantity,
      buyingPrice,
      sellingPrice,
      passGiven,
      passDeliveryMethod,
      dateSold,
      navratriDay,
      notes
    } = req.body;

    if (!customerName || !customerName.trim()) {
      return res.status(400).json({ message: 'Customer Name is required.' });
    }
    if (!mobileNumber || !isValidIndianMobile(mobileNumber)) {
      return res.status(400).json({ message: 'Please provide a valid Indian Mobile Number.' });
    }
    const qty = Number(quantity);
    if (isNaN(qty) || qty < 1) {
      return res.status(400).json({ message: 'Quantity must be at least 1.' });
    }
    const buyPrice = Number(buyingPrice);
    if (isNaN(buyPrice) || buyPrice < 0) {
      return res.status(400).json({ message: 'Buying Price cannot be negative.' });
    }
    const sellPrice = Number(sellingPrice);
    if (isNaN(sellPrice) || sellPrice < 0) {
      return res.status(400).json({ message: 'Selling Price cannot be negative.' });
    }

    const saleData = {
      customerName: customerName.trim(),
      mobileNumber: String(mobileNumber).trim(),
      passName: passName.trim(),
      passCategory: passCategory.trim(),
      quantity: qty,
      buyingPrice: buyPrice,
      sellingPrice: sellPrice,
      passGiven: passGiven || 'No',
      passDeliveryMethod: passDeliveryMethod || 'Other',
      dateSold,
      navratriDay: navratriDay.trim(),
      notes: notes ? notes.trim() : ''
    };

    const updated = await googleSheetsService.updateSale(id, saleData);
    res.json({
      success: true,
      message: 'Sale updated successfully.',
      data: updated
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to update sale. ' + err.message
    });
  }
};

exports.deleteSale = async (req, res) => {
  try {
    const { id } = req.params;
    await googleSheetsService.deleteSale(id);
    res.json({
      success: true,
      message: 'Sale deleted successfully.'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete sale. ' + err.message
    });
  }
};
