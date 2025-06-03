const { google } = require("googleapis");
const crypto = require("crypto");

const { get } = require("mongoose");
const path = require("path");
const sheets = google.sheets("v4");
const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);


const auth = new google.auth.GoogleAuth({
  credentials, // Downloaded JSON file from Google Cloud
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});
// const auth = new google.auth.GoogleAuth({
//   keyFile: path.join(__dirname, "credentials.json"), // Downloaded JSON file from Google Cloud
//   scopes: ["https://www.googleapis.com/auth/spreadsheets"],
// });

const SPREADSHEET_ID = "1rVsVtOHIjF-qpogmw7R0B30ev_Ziy46Og0o93m1SmVs"; // Replace with your actual Google Sheet ID

async function getAuthClient() {
  return await auth.getClient();
}



const headerToKeyMap = {
  Name: "name",
  College: "college",
  "Reason To Select": "reasonToSelect",
  "12th Percentage": "12thPercentage",
  Gender: "gender",
  "Mobile Number": "mobileNumber",
  "Whatsapp Number": "whatsappNumber",
  "Parent Contact Number": "parentContactNumber",
  Age: "age",
  City: "city",
  Email: "email",
  Course: "course",
  "Interest Areas": "interestAreas",
  "Has Laptop": "hasLaptop",
  "Work From Home City": "workFromHomeCity",
  Experience: "experience",
  "Job Interest": "jobInterest",
  Purpose: "purpose",
  Reference: "reference",
  "Internship Type": "internshipType",
  "Profile Picture": "profilePicture",
  "Created At": "createdAt",
  "Payment Verification": "paymentVerification",
};

const flattenValue = (val) => {
  if (val && typeof val === "object") {
    return val.value || JSON.stringify(val);
  }
  return val || "";
};

async function appendApplicationData(data) {
  const client = await getAuthClient();
  const sheet = google.sheets({ version: "v4", auth: client });

  let payment;
  try {
    payment =
      typeof data.paymentVerification === "string"
        ? JSON.parse(data.paymentVerification)
        : data.paymentVerification;
  } catch {
    throw new Error("Invalid paymentVerification format");
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    payment;

  // Verify signature using your Razorpay key secret
  const generatedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET) // make sure your secret is in env vars
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (generatedSignature !== razorpay_signature) {
    throw new Error("Payment verification failed: signature mismatch");
  }

  // 1. Read the headers from the first row
  const headerRes = await sheet.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "Applications!1:1", // First row
  });

  const headers = headerRes.data.values[0]; // Array of header names

  console.log("headers of sheet", headers);
  console.log("datfor create new user", data);

  

  // 2. Create a mapping from header to value
  const valueMap = {
    name: flattenValue(data.name),
    college: flattenValue(data.college),
    reasonToSelect: flattenValue(data.reasonToSelect),
    "12thPercentage": flattenValue(data["12thPercentage"]),
    gender: flattenValue(data.gender),
    mobileNumber: flattenValue(data.mobileNumber),
    whatsappNumber: flattenValue(data.whatsappNumber),
    parentContactNumber: flattenValue(data.parentContactNumber),
    age: flattenValue(data.age),
    city: flattenValue(data.city),
    email: flattenValue(data.email),
    course: flattenValue(data.course),
    interestAreas: flattenValue(
      Array.isArray(data.interestAreas)
        ? data.interestAreas.join(", ")
        : data.interestAreas
    ),
    hasLaptop: flattenValue(data.hasLaptop),
    workFromHomeCity: flattenValue(data.workFromHomeCity),
    experience: flattenValue(data.experience),
    jobInterest: flattenValue(data.jobInterest),
    purpose: flattenValue(data.purpose),
    reference: flattenValue(data.reference),
    internshipType: flattenValue(data.internshipType),
    profilePicture: data.profilePicture || "",
    paymentVerification: razorpay_payment_id, // empty for now
    createdAt: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
  };

  // 3. Create the final row based on header order
  const formattedValues = headers.map((header) => {
    const key = headerToKeyMap[header]; // map header to key
    return valueMap[key] ?? ""; // get value or fallback to empty string
  });

  console.log("formattedValues", formattedValues);

  // 4. Append the row
  await sheet.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: "Applications!A1",
    valueInputOption: "USER_ENTERED",
    resource: {
      values: [formattedValues],
    },
  });
}

async function getColleges() {
  try{

    const client = await getAuthClient();
    const sheet = google.sheets({ version: "v4", auth: client });
  
    const response = await sheet.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "Colleges!A2:C",
    });
  
    return response.data.values.map(([name, priceDual, priceSingle]) => ({
      name,
      priceDual: parseInt(priceDual) || 499,
      priceSingle: parseInt(priceSingle) || 299,
    }));
  } catch (error) {
    console.error("Error fetching colleges:", error);
  }
}

async function getCourses() {
  const client = await getAuthClient();
  const sheet = google.sheets({ version: "v4", auth: client });

  const response = await sheet.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "Courses!A2:A",
  });

  return response.data.values.map(([course]) => course);
}
async function interestAreas() {
  const client = await getAuthClient();
  const sheet = google.sheets({ version: "v4", auth: client });

  const response = await sheet.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "Area Of Interest!A2:A",
  });

  return response.data.values.map(([interest]) => interest);
}
async function references() {
  const client = await getAuthClient();
  const sheet = google.sheets({ version: "v4", auth: client });

  const response = await sheet.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "References!A2:A",
  });

  return response.data.values.map(([reference]) => reference);
}

module.exports = {
  appendApplicationData,
  getColleges,
  getCourses,
  interestAreas,
  references,
};
