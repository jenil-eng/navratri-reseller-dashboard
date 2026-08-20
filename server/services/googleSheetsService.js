const { google } = require('googleapis');
const { readData, writeData } = require('./localStorageFallbackService');

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;

// Handle private key formatted with escaped newlines
let PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY;
if (PRIVATE_KEY) {
  PRIVATE_KEY = PRIVATE_KEY.replace(/\\n/g, '\n');
}

const isConfigured = Boolean(SPREADSHEET_ID && SERVICE_ACCOUNT_EMAIL && PRIVATE_KEY);

let sheetsApi = null;

if (isConfigured) {
  try {
    const auth = new google.auth.JWT({
      email: SERVICE_ACCOUNT_EMAIL,
      key: PRIVATE_KEY,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
    sheetsApi = google.sheets({ version: 'v4', auth });
    console.log('[GoogleSheetsService] Initialized Google Sheets Client successfully.');
  } catch (err) {
    console.error('[GoogleSheetsService] Failed to initialize Google Auth client:', err.message);
  }
} else {
  console.log('[GoogleSheetsService] Google Sheets API credentials not set or incomplete. Operating in persistent local storage mode.');
}

/**
 * Ensures header row exists on Google Sheets if empty
 */
async function ensureSheetsInitialized() {
  if (!isConfigured || !sheetsApi) return;
  try {
    // Check SALES headers
    const salesRes = await sheetsApi.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'SALES!A1:O1',
    });
    if (!salesRes.data.values || salesRes.data.values.length === 0) {
      const salesHeaders = [
        'Customer Name',
        'Mobile Number',
        'Pass Name',
        'Pass Category',
        'Quantity',
        'Buying Price / Pass',
        'Selling Price / Pass',
        'Total Buying Cost',
        'Total Selling Amount',
        'Profit',
        'Pass Given?',
        'Pass Delivery Method',
        'Date Sold',
        'Navratri Day',
        'Notes'
      ];
      await sheetsApi.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: 'SALES!A1:O1',
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [salesHeaders] }
      });
      console.log('[GoogleSheetsService] Formatted SALES header row.');
    }

    // Check LISTS headers
    const listsRes = await sheetsApi.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'LISTS!A1:E1',
    });
    if (!listsRes.data.values || listsRes.data.values.length === 0) {
      const listsHeaders = [
        'PASS NAMES',
        'PASS CATEGORIES',
        'PASS GIVEN STATUS',
        'PASS DELIVERY METHODS',
        'NAVARATRI DAYS'
      ];
      await sheetsApi.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: 'LISTS!A1:E1',
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [listsHeaders] }
      });
      console.log('[GoogleSheetsService] Formatted LISTS header row.');
    }
  } catch (err) {
    console.error('[GoogleSheetsService] Error during ensureSheetsInitialized:', err.message);
  }
}

// Helper to parse numbers from strings with currency symbols (e.g. ₹2,500.00 -> 2500)
function parseNumber(val) {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (val === null || val === undefined) return 0;
  const cleaned = String(val).replace(/[^0-9.-]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

// Map sales object to 15-column array
function saleToObject(row, index) {
  const rowIndex = index + 2;
  const qty = parseNumber(row[4]);
  const buying = parseNumber(row[5]);
  const selling = parseNumber(row[6]);
  
  // If Total Buying Cost, Total Selling Amount, or Profit in sheet are formulas / text / empty, compute them
  const totalBuyingCost = row[7] && !String(row[7]).includes('#REF') ? parseNumber(row[7]) : qty * buying;
  const totalSellingAmount = row[8] && !String(row[8]).includes('#REF') ? parseNumber(row[8]) : qty * selling;
  const profit = row[9] && !String(row[9]).includes('#REF') ? parseNumber(row[9]) : totalSellingAmount - totalBuyingCost;

  return {
    id: row[15] || `row_${rowIndex}`, // hidden or computed ID fallback
    rowIndex: rowIndex,
    customerName: row[0] || '',
    mobileNumber: row[1] || '',
    passName: row[2] || '',
    passCategory: row[3] || '',
    quantity: qty,
    buyingPrice: buying,
    sellingPrice: selling,
    totalBuyingCost: totalBuyingCost,
    totalSellingAmount: totalSellingAmount,
    profit: profit,
    passGiven: row[10] || 'No',
    passDeliveryMethod: row[11] || '',
    dateSold: row[12] || '',
    navratriDay: row[13] || '',
    notes: row[14] || ''
  };
}

function objectToSaleRow(sale) {
  const qty = parseNumber(sale.quantity);
  const buying = parseNumber(sale.buyingPrice);
  const selling = parseNumber(sale.sellingPrice);
  const totalBuyingCost = parseNumber(sale.totalBuyingCost) || (qty * buying);
  const totalSellingAmount = parseNumber(sale.totalSellingAmount) || (qty * selling);
  const profit = parseNumber(sale.profit) || (totalSellingAmount - totalBuyingCost);

  return [
    sale.customerName || '',
    sale.mobileNumber || '',
    sale.passName || '',
    sale.passCategory || '',
    qty,
    buying,
    selling,
    totalBuyingCost,
    totalSellingAmount,
    profit,
    sale.passGiven || 'No',
    sale.passDeliveryMethod || '',
    sale.dateSold || '',
    sale.navratriDay || '',
    sale.notes || ''
  ];
}

// ----------------------------------------------------
// SALES SERVICE METHODS
// ----------------------------------------------------

async function getSales() {
  if (!isConfigured || !sheetsApi) {
    const data = readData();
    return data.sales;
  }

  try {
    await ensureSheetsInitialized();
    const res = await sheetsApi.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'SALES!A6:O1000',
    });

    const rows = res.data.values || [];
    const validSales = [];
    
    rows.forEach((row, idx) => {
      // Row 6 is idx 0, so actual sheet row index is idx + 6
      const sheetRowIndex = idx + 6;
      const hasCustomer = row[0] && String(row[0]).trim().length > 0;
      const hasPass = row[2] && String(row[2]).trim().length > 0;
      const hasQty = row[4] && Number(row[4]) > 0;

      if (hasCustomer || hasPass || hasQty) {
        const sale = saleToObject(row, sheetRowIndex - 2); // saleToObject adds 2 to convert 0-index to row, so pass (sheetRowIndex - 2)
        sale.rowIndex = sheetRowIndex;
        validSales.push(sale);
      }
    });

    return validSales;
  } catch (err) {
    console.error('[GoogleSheetsService] Error reading sales from Google Sheets:', err.message);
    throw new Error(`Google Sheets Error: ${err.message}`);
  }
}

async function addSale(saleData) {
  // Compute totals
  const qty = Number(saleData.quantity) || 0;
  const buying = Number(saleData.buyingPrice) || 0;
  const selling = Number(saleData.sellingPrice) || 0;
  const totalBuyingCost = qty * buying;
  const totalSellingAmount = qty * selling;
  const profit = totalSellingAmount - totalBuyingCost;

  const newSale = {
    ...saleData,
    quantity: qty,
    buyingPrice: buying,
    sellingPrice: selling,
    totalBuyingCost,
    totalSellingAmount,
    profit
  };

  if (!isConfigured || !sheetsApi) {
    const data = readData();
    newSale.id = `sale_${Date.now()}`;
    data.sales.unshift(newSale);
    writeData(data);
    return newSale;
  }

  try {
    const rowValues = objectToSaleRow(newSale);
    
    // Read existing rows starting at row 6 to find the first blank row (where Customer Name / Pass Name is empty)
    const getRes = await sheetsApi.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'SALES!A6:O1000',
    });

    const existingRows = getRes.data.values || [];
    let targetRowIndex = 6 + existingRows.length; // fallback to end if none blank

    // Find first row where customer name (col 0) or pass name (col 2) is missing/empty
    for (let i = 0; i < existingRows.length; i++) {
      const row = existingRows[i];
      const hasCustomer = row[0] && String(row[0]).trim().length > 0;
      const hasPass = row[2] && String(row[2]).trim().length > 0;
      if (!hasCustomer && !hasPass) {
        targetRowIndex = 6 + i;
        break;
      }
    }

    const range = `SALES!A${targetRowIndex}:O${targetRowIndex}`;
    await sheetsApi.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [rowValues]
      }
    });

    newSale.rowIndex = targetRowIndex;
    return newSale;
  } catch (err) {
    console.error('[GoogleSheetsService] Error adding sale to Google Sheets:', err.message);
    throw new Error(`Google Sheets Append Error: ${err.message}`);
  }
}

async function updateSale(saleIdOrRowIndex, saleData) {
  const qty = Number(saleData.quantity) || 0;
  const buying = Number(saleData.buyingPrice) || 0;
  const selling = Number(saleData.sellingPrice) || 0;
  const totalBuyingCost = qty * buying;
  const totalSellingAmount = qty * selling;
  const profit = totalSellingAmount - totalBuyingCost;

  const updatedSale = {
    ...saleData,
    quantity: qty,
    buyingPrice: buying,
    sellingPrice: selling,
    totalBuyingCost,
    totalSellingAmount,
    profit
  };

  if (!isConfigured || !sheetsApi) {
    const data = readData();
    const idx = data.sales.findIndex(s => s.id === saleIdOrRowIndex || String(s.rowIndex) === String(saleIdOrRowIndex));
    if (idx === -1) {
      throw new Error('Sale not found');
    }
    data.sales[idx] = { ...data.sales[idx], ...updatedSale };
    writeData(data);
    return data.sales[idx];
  }

  try {
    // Determine row index in Google Sheets
    let rowIndex = Number(saleIdOrRowIndex);
    if (isNaN(rowIndex)) {
      // Find row index by reading sales
      const sales = await getSales();
      const match = sales.find(s => s.id === saleIdOrRowIndex);
      if (!match) throw new Error('Sale record not found in sheet');
      rowIndex = match.rowIndex;
    }

    const rowValues = objectToSaleRow(updatedSale);
    const range = `SALES!A${rowIndex}:O${rowIndex}`;

    await sheetsApi.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [rowValues]
      }
    });

    return { ...updatedSale, rowIndex };
  } catch (err) {
    console.error('[GoogleSheetsService] Error updating sale in Google Sheets:', err.message);
    throw new Error(`Google Sheets Update Error: ${err.message}`);
  }
}

async function deleteSale(saleIdOrRowIndex) {
  if (!isConfigured || !sheetsApi) {
    const data = readData();
    const initialLen = data.sales.length;
    data.sales = data.sales.filter(s => s.id !== saleIdOrRowIndex && String(s.rowIndex) !== String(saleIdOrRowIndex));
    if (data.sales.length === initialLen) {
      throw new Error('Sale not found');
    }
    writeData(data);
    return { success: true };
  }

  try {
    let rowIndex = Number(saleIdOrRowIndex);
    if (isNaN(rowIndex)) {
      const sales = await getSales();
      const match = sales.find(s => s.id === saleIdOrRowIndex);
      if (!match) throw new Error('Sale record not found in sheet');
      rowIndex = match.rowIndex;
    }

    // To delete row in Google Sheets API, clear the values or batchUpdate deleteDimension
    // Clearing the range A:O for that row clears the data
    const range = `SALES!A${rowIndex}:O${rowIndex}`;
    await sheetsApi.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range
    });

    return { success: true, rowIndex };
  } catch (err) {
    console.error('[GoogleSheetsService] Error deleting sale from Google Sheets:', err.message);
    throw new Error(`Google Sheets Delete Error: ${err.message}`);
  }
}

// ----------------------------------------------------
// LISTS SERVICE METHODS
// ----------------------------------------------------

async function getLists() {
  if (!isConfigured || !sheetsApi) {
    const data = readData();
    return data.lists;
  }

  try {
    await ensureSheetsInitialized();
    const res = await sheetsApi.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'LISTS!A2:E',
    });

    const rows = res.data.values || [];
    
    const passNames = [];
    const passCategories = [];
    const passGivenStatus = [];
    const passDeliveryMethods = [];
    const navratriDays = [];

    rows.forEach(r => {
      if (r[0] && r[0].trim()) passNames.push(r[0].trim());
      if (r[1] && r[1].trim()) passCategories.push(r[1].trim());
      if (r[2] && r[2].trim()) passGivenStatus.push(r[2].trim());
      if (r[3] && r[3].trim()) passDeliveryMethods.push(r[3].trim());
      if (r[4] && r[4].trim()) navratriDays.push(r[4].trim());
    });

    // Provide default lists if sheet columns are empty
    return {
      passNames: passNames.length ? passNames : ["United Way Garba Pass", "Shankus Dandiya Pass"],
      passCategories: passCategories.length ? passCategories : ["General", "VIP", "Couple", "Group", "Premium", "Other"],
      passGivenStatus: passGivenStatus.length ? passGivenStatus : ["Yes", "No", "Partially"],
      passDeliveryMethods: passDeliveryMethods.length ? passDeliveryMethods : ["WhatsApp", "Email", "Physical", "QR Code", "Other"],
      navratriDays: navratriDays.length ? navratriDays : ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6", "Day 7", "Day 8", "Day 9"]
    };
  } catch (err) {
    console.error('[GoogleSheetsService] Error getting lists from Google Sheets:', err.message);
    // Return fallback lists on error
    const fallback = readData();
    return fallback.lists;
  }
}

async function updateEntireLists(listsObj) {
  if (!isConfigured || !sheetsApi) {
    const data = readData();
    data.lists = listsObj;
    writeData(data);
    return data.lists;
  }

  try {
    const maxLen = Math.max(
      (listsObj.passNames || []).length,
      (listsObj.passCategories || []).length,
      (listsObj.passGivenStatus || []).length,
      (listsObj.passDeliveryMethods || []).length,
      (listsObj.navratriDays || []).length
    );

    const rows = [];
    for (let i = 0; i < maxLen; i++) {
      rows.push([
        (listsObj.passNames && listsObj.passNames[i]) || '',
        (listsObj.passCategories && listsObj.passCategories[i]) || '',
        (listsObj.passGivenStatus && listsObj.passGivenStatus[i]) || '',
        (listsObj.passDeliveryMethods && listsObj.passDeliveryMethods[i]) || '',
        (listsObj.navratriDays && listsObj.navratriDays[i]) || ''
      ]);
    }

    // First clear existing A2:E range
    await sheetsApi.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range: 'LISTS!A2:E'
    });

    if (rows.length > 0) {
      await sheetsApi.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `LISTS!A2:E${rows.length + 1}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: rows }
      });
    }

    return listsObj;
  } catch (err) {
    console.error('[GoogleSheetsService] Error updating lists in Google Sheets:', err.message);
    throw new Error(`Google Sheets Lists Update Error: ${err.message}`);
  }
}

module.exports = {
  isConfigured,
  getSales,
  addSale,
  updateSale,
  deleteSale,
  getLists,
  updateEntireLists
};
