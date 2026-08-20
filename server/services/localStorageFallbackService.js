const fs = require('fs');
const path = require('path');

const STORAGE_FILE = path.join(__dirname, '../data_store.json');

const INITIAL_DATA = {
  sales: [
    {
      id: "sale_1",
      customerName: "Rahul Patel",
      mobileNumber: "9876543210",
      passName: "United Way Garba Pass",
      passCategory: "VIP",
      quantity: 2,
      buyingPrice: 700,
      sellingPrice: 999,
      totalBuyingCost: 1400,
      totalSellingAmount: 1998,
      profit: 598,
      passGiven: "Yes",
      passDeliveryMethod: "WhatsApp",
      dateSold: "2026-08-20",
      navratriDay: "Day 1",
      notes: "Friend referral - Paid via UPI"
    },
    {
      id: "sale_2",
      customerName: "Priya Shah",
      mobileNumber: "9123456789",
      passName: "Shankus Dandiya Season Pass",
      passCategory: "Couple",
      quantity: 1,
      buyingPrice: 1200,
      sellingPrice: 1800,
      totalBuyingCost: 1200,
      totalSellingAmount: 1800,
      profit: 600,
      passGiven: "No",
      passDeliveryMethod: "Physical",
      dateSold: "2026-08-20",
      navratriDay: "Day 2",
      notes: "Pending physical pass delivery tomorrow"
    },
    {
      id: "sale_3",
      customerName: "Amit Verma",
      mobileNumber: "9811223344",
      passName: "Falguni Pathak Live Pass",
      passCategory: "General",
      quantity: 4,
      buyingPrice: 500,
      sellingPrice: 750,
      totalBuyingCost: 2000,
      totalSellingAmount: 3000,
      profit: 1000,
      passGiven: "Partially",
      passDeliveryMethod: "Email",
      dateSold: "2026-08-19",
      navratriDay: "Day 3",
      notes: "Delivered 2 passes via email, 2 pending"
    },
    {
      id: "sale_4",
      customerName: "Neha Joshi",
      mobileNumber: "9988776655",
      passName: "Kora Kendra Garba Pass",
      passCategory: "Premium",
      quantity: 2,
      buyingPrice: 1500,
      sellingPrice: 2200,
      totalBuyingCost: 3000,
      totalSellingAmount: 4400,
      profit: 1400,
      passGiven: "Yes",
      passDeliveryMethod: "QR Code",
      dateSold: "2026-08-18",
      navratriDay: "Day 4",
      notes: "QR Code scanned and verified"
    }
  ],
  lists: {
    passNames: [
      "United Way Garba Pass",
      "Shankus Dandiya Season Pass",
      "Falguni Pathak Live Pass",
      "Kora Kendra Garba Pass",
      "Garba Class Special Pass",
      "Dome NSCI Garba Night"
    ],
    passCategories: ["General", "VIP", "Couple", "Group", "Premium", "Other"],
    passGivenStatus: ["Yes", "No", "Partially"],
    passDeliveryMethods: ["WhatsApp", "Email", "Physical", "QR Code", "Other"],
    navratriDays: [
      "Day 1",
      "Day 2",
      "Day 3",
      "Day 4",
      "Day 5",
      "Day 6",
      "Day 7",
      "Day 8",
      "Day 9"
    ]
  }
};

function readData() {
  if (!fs.existsSync(STORAGE_FILE)) {
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(INITIAL_DATA, null, 2), 'utf-8');
    return INITIAL_DATA;
  }
  try {
    const raw = fs.readFileSync(STORAGE_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading fallback storage file, resetting:", err);
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(INITIAL_DATA, null, 2), 'utf-8');
    return INITIAL_DATA;
  }
}

function writeData(data) {
  fs.writeFileSync(STORAGE_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

module.exports = {
  readData,
  writeData
};
