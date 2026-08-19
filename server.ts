import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Increase payload limit for passport image base64 uploads
  app.use(express.json({ limit: "25mb" }));

  // Helper to initialize GenAI client lazy with server-side environment key
  const getAI = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not defined in server environment.");
    }
    return new GoogleGenAI({
      apiKey: apiKey || "",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  };

  // Helper to run GenAI generation with fallback models and quota protection
  const generateWithFallback = async (ai: GoogleGenAI, requestConfig: any) => {
    const models = ["gemini-3.6-flash", "gemini-flash-latest", "gemini-3.1-pro-preview", "gemini-3.1-flash-lite"];
    let lastError: any = null;

    for (const model of models) {
      try {
        const response = await ai.models.generateContent({
          ...requestConfig,
          model,
        });
        return response;
      } catch (err: any) {
        lastError = err;
        const errStr = String(err?.message || err);
        const isRetryable = 
          errStr.includes("429") || 
          errStr.includes("503") || 
          errStr.includes("500") || 
          errStr.includes("502") || 
          errStr.includes("504") || 
          errStr.includes("UNAVAILABLE") || 
          errStr.includes("high demand") || 
          errStr.includes("demand") || 
          errStr.includes("overloaded") || 
          errStr.includes("RESOURCE_EXHAUSTED") || 
          errStr.includes("quota") || 
          errStr.includes("Quota") ||
          errStr.includes("404") ||
          errStr.includes("NOT_FOUND") ||
          errStr.includes("no longer available") ||
          errStr.includes("deprecated");
        
        console.warn(`Model ${model} failed (${errStr}). Trying next model...`);
        if (!isRetryable) {
          // If it's a structural schema or validation error, don't keep trying other models
          throw err;
        }
      }
    }

    throw lastError || new Error("AI service unavailable across models.");
  };

  // API Route to parse passport image or visa document
  app.post("/api/parse-passport", async (req, res) => {
    try {
      const { image, mimeType } = req.body;
      if (!image) {
        return res.status(400).json({ error: "No image data provided" });
      }

      // Clean base64 string
      const cleanBase64 = image.replace(/^data:[^;]+;base64,/, "");
      const finalMimeType = mimeType || "image/jpeg";

      const ai = getAI();
      const prompt = `You are an expert immigration document OCR scanner and AI processor specialized in UAE Visas, Entry Permits, E-Visas, Extension Approvals, Passports, and Emirates IDs.
Analyze the attached document/image carefully and extract all travel and visa details accurately.

CRITICAL INSTRUCTION FOR VISA VALIDITY EXPIRY:
- Prioritize extracting the VISA VALIDITY EXPIRY DATE into "expiryDate" (formatted DD/MM/YYYY). Look for text like "Valid Until", "Expiry Date", "Permit Expiry", "Visa Validity", "Exit Before", "Last Date of Stay", or "Valid To".
- If Entry Date and Visa Duration (e.g. 60 Days, 30 Days) are visible, calculate or confirm the Visa Expiry Date = Entry Date + Duration.
- Extract Passport Expiry Date into "passportExpiry" ONLY if clearly present on a passport page; otherwise leave it blank.

Extraction Rules:
1. Extract Surname / Last Name into "lastName" in ALL CAPS.
2. Extract Given Names / First Name into "firstName" in ALL CAPS.
3. Extract Passport Number into "passportNo" in ALL CAPS (e.g. N1234567, P0220820).
4. Extract Visa Validity Expiry Date into "expiryDate" strictly formatted as DD/MM/YYYY (e.g. 08/08/2025).
5. Extract Entry Date into "entryDate" formatted as DD/MM/YYYY if visible (e.g. arrival stamp date or entry permit date).
6. Extract Passport Expiry Date into "passportExpiry" formatted as DD/MM/YYYY if visible.
7. Extract Nationality / Country of Citizenship into "nationality" in ALL CAPS (e.g. SRI LANKAN, INDIAN, PAKISTANI).
8. Extract Date of Birth into "dateOfBirth" formatted as DD/MM/YYYY (e.g. 15/08/1992).
9. Extract UAE Unified Number / UID Number / UDB Number into "unifiedNumber" if present (e.g. 123456789 or 9-digit number).
10. Extract ICP Application No / Visa File Number / Entry Permit No into "icpFileNo" if present (e.g. 201/2025/1/1234567).
11. Extract Visa Category into "visaCategory" if visible (e.g. 60 Days (P), 30 Days (P), Umrah Visa).
12. Extract Visa Processing Country / Destination into "destinationCountry" if visible e.g. "United Arab Emirates (UAE)", "Saudi Arabia", "Qatar".
13. Extract Visa Status into "status" if visible (e.g. In Process, Posted, Documents Required, Approved, Extended, Used).

Format all dates as DD/MM/YYYY. If any field is not visible or unreadable, return an empty string for that field.`;

      const response = await generateWithFallback(ai, {
        contents: {
          parts: [
            {
              inlineData: {
                data: cleanBase64,
                mimeType: finalMimeType,
              },
            },
            {
              text: prompt,
            },
          ],
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              lastName: { type: Type.STRING, description: "Surname / Last Name in UPPERCASE" },
              firstName: { type: Type.STRING, description: "Given Names / First Name in UPPERCASE" },
              passportNo: { type: Type.STRING, description: "Passport Number in UPPERCASE" },
              passportExpiry: { type: Type.STRING, description: "Passport Expiry Date in DD/MM/YYYY format" },
              nationality: { type: Type.STRING, description: "Country of Citizenship in UPPERCASE" },
              destinationCountry: { type: Type.STRING, description: "Destination / Visa Processing Country" },
              dateOfBirth: { type: Type.STRING, description: "Date of Birth in DD/MM/YYYY format" },
              unifiedNumber: { type: Type.STRING, description: "UAE Unified Number / UID / UDB Number" },
              icpFileNo: { type: Type.STRING, description: "ICP Visa File / Application Number" },
              entryDate: { type: Type.STRING, description: "Entry Date in DD/MM/YYYY format" },
              expiryDate: { type: Type.STRING, description: "Visa Expiry Date in DD/MM/YYYY format" },
              visaCategory: { type: Type.STRING, description: "Visa duration or category" },
              status: { type: Type.STRING, description: "Visa status e.g. In Process, Posted, Documents Required, Approved, Extended, Used" },
            },
            required: ["lastName", "firstName", "passportNo"],
          },
        },
      });

      const text = response.text || "{}";
      const parsedData = JSON.parse(text);

      res.json({
        success: true,
        data: parsedData,
      });
    } catch (error: any) {
      console.error("Passport Parsing Error:", error);
      const errStr = String(error?.message || error);
      const isQuota = errStr.includes("429") || errStr.includes("RESOURCE_EXHAUSTED") || errStr.includes("quota") || errStr.includes("Quota");
      res.status(isQuota ? 429 : 500).json({
        success: false,
        isQuotaExceeded: isQuota,
        error: isQuota
          ? "AI daily API rate limit / quota reached. Document attached successfully! Please fill in details manually."
          : (error.message || "Failed to process document image"),
      });
    }
  });

  // API Route to parse air ticket / e-ticket document
  app.post("/api/parse-ticket", async (req, res) => {
    try {
      const { image, mimeType } = req.body;
      if (!image) {
        return res.status(400).json({ error: "No image or document data provided" });
      }

      const cleanBase64 = image.replace(/^data:[^;]+;base64,/, "");
      const finalMimeType = mimeType || "image/jpeg";

      const ai = getAI();
      const prompt = `You are an expert travel agent OCR and e-ticket document parser.
Analyze the attached air ticket, e-ticket receipt, PDF, or boarding pass image carefully and extract all flight reservation details.

Extraction Rules:
1. Extract Ticket Number(s) as an array of strings e.g. ["1572134128637"] or ["0742134128901"]. If multiple passengers or tickets, list all ticket numbers found.
2. Extract PNR / Booking Reference into "pnr" in UPPERCASE e.g. "DCYMLG", "EY265".
3. Extract Primary Passenger / Traveler Full Name into "travelerName" in UPPERCASE e.g. "MRS ARUMAKSAYAKKARALAGE / RASIKA".
4. Extract Airline Name into "airline" e.g. "SriLankan Airlines", "Emirates", "Etihad Airways", "Flydubai", "Air Arabia", "Gulf Air".
5. Extract Flight Number into "flightNo" e.g. "UL 225", "EK 651".
6. Extract Departure Origin City/Airport into "departureLocation" e.g. "Colombo (CMB)", "Dubai (DXB)", "Abu Dhabi (AUH)".
7. Extract Arrival Destination City/Airport into "arrivalLocation" e.g. "Dubai (DXB)", "Doha (DOH)", "Male (MLE)".
8. Extract Departure/Fly Date into "flyDate" formatted strictly as DD/MM/YYYY e.g. "25/08/2026".
9. Extract Flight Departure Time into "departureTime" (e.g. "10:30 AM", "18:45") and Arrival Time into "arrivalTime" (e.g. "02:45 PM", "22:30").
10. If Round Trip, extract Return Flight Number into "returnFlightNo" (e.g. "UL 226"), Return Departure Time into "returnDepartureTime" (e.g. "14:20"), and Return Arrival Time into "returnArrivalTime" (e.g. "20:45").
11. Extract Return Date into "returnDate" formatted strictly as DD/MM/YYYY if round-trip; otherwise return "N/A".
12. Extract Trip Type into "tripType" as "One Way", "Round Trip", or "Multi-City".
13. Extract Cabin Class into "cabinClass" as "Economy", "Premium Economy", "Business", or "First".
14. Extract Baggage Allowance into "baggageAllowance" e.g. "30 Kg", "20 Kg", "2 PCs".
15. Extract Total Price / Refundable Amount / Ticket Fare in numbers into "totalAmount" e.g. 125000.
16. Extract Issuing Travel Agency / Supplier Name into "supplier" if visible e.g. "Mercy Travels", "AeroConnect Ltd".
17. Extract Reissue or Fare Category into "reissueCategory" e.g. "Standard Reissue", "Issued / Confirmed", "Original Issue".
18. Determine if this document is a Group Booking / Multi-passenger booking into "isGroupBooking" (boolean: set to true if multiple passengers or ticket numbers are listed under the same PNR reference, otherwise false).

Format dates as DD/MM/YYYY. If any field is missing or unreadable, return empty string or 0 for totalAmount.`;

      const response = await generateWithFallback(ai, {
        contents: {
          parts: [
            {
              inlineData: {
                data: cleanBase64,
                mimeType: finalMimeType,
              },
            },
            {
              text: prompt,
            },
          ],
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              tickets: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of ticket numbers" },
              pnr: { type: Type.STRING, description: "PNR / Booking Reference code" },
              travelerName: { type: Type.STRING, description: "Passenger / Traveler Full Name" },
              airline: { type: Type.STRING, description: "Airline name" },
              flightNo: { type: Type.STRING, description: "Flight number e.g. UL 225" },
              departureTime: { type: Type.STRING, description: "Flight Departure Time e.g. 10:30 AM" },
              arrivalTime: { type: Type.STRING, description: "Flight Arrival Time e.g. 02:45 PM" },
              returnFlightNo: { type: Type.STRING, description: "Return Flight number e.g. UL 226" },
              returnDepartureTime: { type: Type.STRING, description: "Return Departure Time e.g. 14:20" },
              returnArrivalTime: { type: Type.STRING, description: "Return Arrival Time e.g. 20:45" },
              departureLocation: { type: Type.STRING, description: "Departure Origin e.g. Colombo (CMB)" },
              arrivalLocation: { type: Type.STRING, description: "Arrival Destination e.g. Dubai (DXB)" },
              flyDate: { type: Type.STRING, description: "Fly Date in DD/MM/YYYY" },
              returnDate: { type: Type.STRING, description: "Return Date in DD/MM/YYYY or N/A" },
              tripType: { type: Type.STRING, description: "Trip Type: One Way, Round Trip, or Multi-City" },
              cabinClass: { type: Type.STRING, description: "Cabin Class e.g. Economy, Business" },
              baggageAllowance: { type: Type.STRING, description: "Baggage allowance e.g. 30 Kg" },
              totalAmount: { type: Type.NUMBER, description: "Total ticket price or fare" },
              supplier: { type: Type.STRING, description: "Supplier or issuing agency" },
              reissueCategory: { type: Type.STRING, description: "Reissue category or status" },
              isGroupBooking: { type: Type.BOOLEAN, description: "True if multiple passengers/tickets share the same PNR" },
            },
            required: ["pnr", "travelerName", "airline"],
          },
        },
      });

      const text = response.text || "{}";
      const parsedData = JSON.parse(text);

      res.json({
        success: true,
        data: parsedData,
      });
    } catch (error: any) {
      console.error("Air Ticket Parsing Error:", error);
      const errStr = String(error?.message || error);
      const isQuota = errStr.includes("429") || errStr.includes("RESOURCE_EXHAUSTED") || errStr.includes("quota") || errStr.includes("Quota");
      res.status(isQuota ? 429 : 500).json({
        success: false,
        isQuotaExceeded: isQuota,
        error: isQuota
          ? "AI daily API rate limit / quota reached. Ticket attached successfully! Please fill in details manually."
          : (error.message || "Failed to process air ticket document"),
      });
    }
  });

  // API Route to verify visa status against UAE ICP immigration rules
  app.post("/api/check-visa-status", async (req, res) => {
    try {
      const { passportNo, passportExpiry, visaCategory, entryDate, expiryDate, currentStatus, icpFileNo, unifiedNumber, dob, nationality } = req.body;

      const ai = getAI();
      const prompt = `You are an immigration & visa compliance assistant specializing in UAE ICP (Federal Authority for Identity, Citizenship, Customs and Port Security) and GDRFA visa validity standards.

Evaluate the following visa application details:
- Passport Number: ${passportNo || "N/A"}
- Passport Expiry: ${passportExpiry || "N/A"}
- Nationality: ${nationality || "N/A"}
- Date of Birth: ${dob || "N/A"}
- UAE Unified Number (UID/UDB): ${unifiedNumber || "N/A"}
- Visa Category: ${visaCategory || "N/A"}
- Entry Date: ${entryDate || "N/A"}
- Recorded Visa Expiry Date: ${expiryDate || "N/A"}
- Current Status: ${currentStatus || "N/A"}
- ICP Application/File No: ${icpFileNo || "N/A"}

Current Date: ${new Date().toISOString().split("T")[0]}

Tasks:
1. Verify if the passport has at least 6 months validity remaining from today.
2. Compute the exact Visa Expiry Date (formatted DD/MM/YYYY):
   - If Entry Date is provided (e.g. 09/06/2025) and Visa Category is e.g. 60 Days, calculate Entry Date + 60 days = exact Expiry Date (e.g. 08/08/2025).
   - If 30 Days, calculate Entry Date + 30 days.
   - If 30 Days Extension, add 30 days to the previous expiry date.
   - If Expiry Date was explicitly provided or on visa, confirm or correct it.
   - If no Entry Date is provided, leave calculatedEntryDate empty and compute validity window from approval date if known.
3. Determine if the visa is Active/Valid, Extended, Used, Expired/Overdue, or Needs Action.
4. Recommend the exact updated status among: ["Posted", "Approved", "Rejected", "Cancelled", "Used", "Extended", "Closed", "OutPass"].
   - If current date is past expiry date and traveler is still inside UAE, mark "Extended" or "Overdue/Action Needed".
   - If entry date is present and valid, mark "Approved" or "Extended" or "Used" depending on usage.
5. Detail the two ICP File Validity search methods:
   - Option 1 (By Visa / UID): File Type = Visa, Search By = UID Number (${unifiedNumber || 'N/A'}), DOB (${dob || 'N/A'}), Nationality (${nationality || 'SRI LANKAN'})
   - Option 2 (By Passport): File Type = Visa, Search By = Passport Information, Passport No (${passportNo || 'N/A'}), Expiry (${passportExpiry || 'N/A'}), Nationality (${nationality || 'SRI LANKAN'})
6. Provide concise verification analysis.`;

      const response = await generateWithFallback(ai, {
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              recommendedStatus: { type: Type.STRING, description: "Suggested status e.g. Approved, Extended, Used" },
              calculatedExpiryDate: { type: Type.STRING, description: "Exact computed or verified visa expiry date in DD/MM/YYYY" },
              calculatedEntryDate: { type: Type.STRING, description: "Verified entry date in DD/MM/YYYY" },
              isValid: { type: Type.BOOLEAN, description: "Whether visa/passport is valid" },
              daysRemaining: { type: Type.INTEGER, description: "Days remaining before expiry (negative if expired)" },
              passportValidMonths: { type: Type.NUMBER, description: "Months remaining on passport" },
              notes: { type: Type.STRING, description: "Summary analysis & compliance advice" },
              icpQueryLink: { type: Type.STRING, description: "Official ICP portal URL" },
            },
            required: ["recommendedStatus", "calculatedExpiryDate", "isValid", "daysRemaining", "notes"],
          },
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      res.json({
        success: true,
        checkedAt: new Date().toLocaleDateString("en-GB") + " " + new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
        data: parsed,
        portalUrl: "https://smartservices.icp.gov.ae/echannels/web/client/default.html#/fileValidity",
      });
    } catch (error: any) {
      console.error("Status Check Error:", error);
      const errStr = String(error?.message || error);
      const isQuota = errStr.includes("429") || errStr.includes("RESOURCE_EXHAUSTED") || errStr.includes("quota") || errStr.includes("Quota");
      res.status(isQuota ? 429 : 500).json({
        success: false,
        isQuotaExceeded: isQuota,
        error: isQuota
          ? "AI daily rate limit reached. You can verify on ICP portal directly."
          : (error.message || "Failed to check visa status"),
      });
    }
  });

  // Vite middleware for development vs static for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
