import { TicketFollowup, VisaFollowup, ActivityComment } from '../types';

export function getRelativeDateStr(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export const INITIAL_TICKETS: TicketFollowup[] = [
  {
    "returnDate": "11/09/2026",
    "departureLocation": "Colombo (CMB)",
    "timeline": [
      {
        "date": "18/08/2026",
        "id": "tm-1",
        "completed": true,
        "title": "ISSUED"
      },
      {
        "completed": false,
        "title": "FLOWN / COMPLETED",
        "id": "tm-2",
        "date": "03/09/2026"
      }
    ],
    "quote": "LKR 124,500",
    "id": "tkt-1787054995896",
    "currency": "LKR",
    "customer": "Deen Academy",
    "status": "Issued / Confirmed",
    "travelers": [
      {
        "id": "trv-1787054995896",
        "ticketNo": "1769292564964",
        "name": "HIMIHAMI MUDIYANSELAGE/IRANGANI MENIKEMRS"
      }
    ],
    "serviceFee": 0,
    "branch": "Negombo",
    "arrivalTime": "21:35",
    "flyDate": "03/09/2026",
    "returnFlightNo": "EK 0652",
    "baggageAllowance": "30 KG",
    "refundAmount": 124500,
    "customerType": "Agency",
    "tripType": "Round Trip",
    "pnr": "S6TYRX",
    "newBooking": "S6TYRX",
    "itinerary": [
      {
        "id": "itin-1787054995896",
        "flightNo": "EK 0653",
        "route": "Colombo (CMB) → Male (MLE)",
        "dateTime": "03/09/2026 10:00"
      }
    ],
    "refundReason": "New Flight Ticket Issued",
    "returnDepartureTime": "16:30",
    "reissueCategory": "HK",
    "supplier": "SEAGUL global",
    "comment": "E-ticket confirmed and sent to passenger",
    "totalRefundable": 124500,
    "tickets": [
      "1769292564964"
    ],
    "outcome": "Ticket Active & Tracked",
    "isGroupBooking": false,
    "returnArrivalTime": "18:30",
    "cabinClass": "Economy",
    "airline": "Emirates",
    "createdAt": "2026-08-18T12:09:55.896Z",
    "requestDate": "18/08/2026",
    "departureTime": "20:35",
    "arrivalLocation": "Male (MLE)",
    "flightNo": "EK 0653"
  },
  {
    "currency": "LKR",
    "itinerary": [
      {
        "id": "itin-1787055218821",
        "dateTime": "03/09/2026 10:00",
        "route": "Colombo (CMB) → Male (MLE)",
        "flightNo": "EK 0653"
      }
    ],
    "serviceFee": 0,
    "timeline": [
      {
        "title": "ISSUED",
        "completed": true,
        "date": "18/08/2026",
        "id": "tm-1"
      },
      {
        "date": "03/09/2026",
        "id": "tm-2",
        "title": "FLOWN / COMPLETED",
        "completed": false
      }
    ],
    "refundReason": "New Flight Ticket Issued",
    "pnr": "S6TYRX",
    "returnDate": "11/09/2026",
    "requestDate": "18/08/2026",
    "createdAt": "2026-08-18T12:13:38.821Z",
    "customer": "Deen Academy",
    "airline": "Emirates",
    "outcome": "Ticket Active & Tracked",
    "returnDepartureTime": "16:30",
    "id": "tkt-1787055218820",
    "newBooking": "S6TYRX",
    "comment": "E-ticket confirmed and sent to passenger",
    "tickets": [
      "1769292564963"
    ],
    "departureLocation": "Colombo (CMB)",
    "isGroupBooking": true,
    "tripType": "Round Trip",
    "cabinClass": "Economy",
    "supplier": "SEAGUL global",
    "returnFlightNo": "EK 0652",
    "travelers": [
      {
        "name": "GANESHAN/LASHAYINIMRS",
        "id": "trv-1787055218821",
        "ticketNo": "1769292564963"
      }
    ],
    "departureTime": "20:35",
    "arrivalLocation": "Male (MLE)",
    "arrivalTime": "21:35",
    "flyDate": "03/09/2026",
    "flightNo": "EK 0653",
    "returnArrivalTime": "18:30",
    "status": "Issued / Confirmed",
    "branch": "Negombo",
    "quote": "LKR 124,500",
    "reissueCategory": "Standard Reissue",
    "baggageAllowance": "30 KG",
    "refundAmount": 124500,
    "customerType": "Agency",
    "totalRefundable": 124500
  },
  {
    "sellingPrice": 141666,
    "serviceFee": 0,
    "returnDepartureTime": "18:45",
    "profitMargin": 0.8,
    "tickets": [
      "1769292567759"
    ],
    "createdAt": "2026-09-06T12:48:54.857Z",
    "outcome": "Ticket Active & Tracked",
    "returnFlightNo": "EK 2040",
    "totalRefundable": 141666,
    "pnr": "6X2P3W",
    "arrivalLocation": "Dubai (DXB)",
    "id": "tkt-1788698934857",
    "refundReason": "New Flight Ticket Issued",
    "travelers": [
      {
        "id": "trv-1788698934857",
        "sellingPrice": 141666,
        "ticketNo": "1769292567759",
        "costPrice": 140568,
        "name": "TUPPIMUDALIGE DON/ONAL NANDIL SIRIWARDANAMSTR"
      }
    ],
    "cabinClass": "Economy",
    "flightNo": "EK 0651",
    "customerType": "Customer",
    "quote": "LKR 141,666",
    "flyDate": "12/12/2026",
    "isGroupBooking": true,
    "supplier": "SEAGUL global",
    "arrivalTime": "12:55",
    "returnArrivalTime": "00:45",
    "groupSize": 1,
    "departureTime": "09:55",
    "costPrice": 140568,
    "groupName": "Group Booking",
    "comment": "E-ticket confirmed and sent to passenger",
    "baggageAllowance": "40 KG",
    "sellingPerPax": 141666,
    "paymentStatus": "Pending",
    "itinerary": [
      {
        "dateTime": "12/12/2026 10:00",
        "id": "itin-1788698934857",
        "route": "Colombo (CMB) → Dubai (DXB)",
        "flightNo": "EK 0651"
      }
    ],
    "tripType": "Round Trip",
    "status": "Issued / Confirmed",
    "reissueCategory": "Issued / Confirmed",
    "branch": "Negombo",
    "airline": "Emirates",
    "returnDate": "18/12/2026",
    "timeline": [
      {
        "title": "ISSUED",
        "id": "tm-1",
        "completed": true,
        "date": "06/09/2026"
      },
      {
        "date": "12/12/2026",
        "completed": false,
        "title": "FLOWN / COMPLETED",
        "id": "tm-2"
      }
    ],
    "newBooking": "6X2P3W",
    "currency": "LKR",
    "requestDate": "06/09/2026",
    "customer": "MR NISHANTHA",
    "departureLocation": "Colombo (CMB)",
    "profitPerPax": 1098,
    "profit": 1098,
    "refundAmount": 141666,
    "pricingMode": "per_pax",
    "costPerPax": 140568
  },
  {
    "costPerPax": 140568,
    "profitPerPax": 1098,
    "arrivalTime": "12:55",
    "status": "Issued / Confirmed",
    "refundAmount": 141666,
    "branch": "Negombo",
    "isGroupBooking": true,
    "flyDate": "12/12/2026",
    "tripType": "Round Trip",
    "totalRefundable": 141666,
    "baggageAllowance": "40 KG",
    "profit": 1098,
    "tickets": [
      "1769292567758"
    ],
    "newBooking": "6X2P3W",
    "outcome": "Ticket Active & Tracked",
    "returnFlightNo": "EK 2040",
    "groupName": "Group Booking",
    "customer": "MR NISHANTHA",
    "arrivalLocation": "Dubai (DXB)",
    "returnDate": "18/12/2026",
    "costPrice": 140568,
    "timeline": [
      {
        "id": "tm-1",
        "date": "06/09/2026",
        "completed": true,
        "title": "ISSUED"
      },
      {
        "id": "tm-2",
        "completed": false,
        "date": "12/12/2026",
        "title": "FLOWN / COMPLETED"
      }
    ],
    "pnr": "6X2P3W",
    "itinerary": [
      {
        "dateTime": "12/12/2026 10:00",
        "flightNo": "EK 0651",
        "id": "itin-1788699004202",
        "route": "Colombo (CMB) → Dubai (DXB)"
      }
    ],
    "currency": "LKR",
    "returnArrivalTime": "00:45",
    "quote": "LKR 141,666",
    "returnDepartureTime": "18:45",
    "groupSize": 1,
    "customerType": "Customer",
    "flightNo": "EK 0651",
    "pricingMode": "per_pax",
    "departureLocation": "Colombo (CMB)",
    "travelers": [
      {
        "sellingPrice": 141666,
        "costPrice": 140568,
        "name": "TUPPIMUDALIGE DON/NISHANTHA SIRIWARDANAMR",
        "ticketNo": "1769292567758",
        "id": "trv-1788699004202"
      }
    ],
    "supplier": "SEAGUL global",
    "cabinClass": "Economy",
    "reissueCategory": "Standard Reissue",
    "comment": "E-ticket confirmed and sent to passenger",
    "profitMargin": 0.8,
    "sellingPrice": 141666,
    "requestDate": "06/09/2026",
    "airline": "Emirates",
    "createdAt": "2026-09-06T12:50:04.202Z",
    "departureTime": "09:55",
    "paymentStatus": "Pending",
    "sellingPerPax": 141666,
    "id": "tkt-1788699004200",
    "serviceFee": 0,
    "refundReason": "New Flight Ticket Issued"
  },
  {
    "comment": "E-ticket confirmed and sent to passenger",
    "flightNo": "EK 0651",
    "tickets": [
      "1769292567757"
    ],
    "arrivalLocation": "Dubai (DXB)",
    "outcome": "Ticket Active & Tracked",
    "profitMargin": 0.8,
    "status": "Issued / Confirmed",
    "sellingPrice": 141666,
    "branch": "Negombo",
    "pnr": "6X2P3W",
    "costPerPax": 140568,
    "airline": "Emirates",
    "departureTime": "09:55",
    "costPrice": 140568,
    "baggageAllowance": "40 KG",
    "supplier": "SEAGUL global",
    "cabinClass": "Economy",
    "paymentStatus": "Pending",
    "createdAt": "2026-09-06T12:51:04.359Z",
    "isGroupBooking": false,
    "sellingPerPax": 141666,
    "refundReason": "New Flight Ticket Issued",
    "itinerary": [
      {
        "flightNo": "EK 0651",
        "dateTime": "12/12/2026 10:00",
        "id": "itin-1788699064359",
        "route": "Colombo (CMB) → Dubai (DXB)"
      }
    ],
    "departureLocation": "Colombo (CMB)",
    "reissueCategory": "Issued / Confirmed",
    "requestDate": "06/09/2026",
    "totalRefundable": 141666,
    "refundAmount": 141666,
    "customerType": "Customer",
    "newBooking": "6X2P3W",
    "profit": 1098,
    "tripType": "Round Trip",
    "profitPerPax": 1098,
    "id": "tkt-1788699064359",
    "returnFlightNo": "EK 2040",
    "groupSize": 1,
    "returnDepartureTime": "18:45",
    "serviceFee": 0,
    "timeline": [
      {
        "date": "06/09/2026",
        "completed": true,
        "id": "tm-1",
        "title": "ISSUED"
      },
      {
        "date": "12/12/2026",
        "completed": false,
        "id": "tm-2",
        "title": "FLOWN / COMPLETED"
      }
    ],
    "returnArrivalTime": "00:45",
    "travelers": [
      {
        "id": "trv-1788699064359",
        "costPrice": 140568,
        "name": "BULATHWALAGE/NADEEKA GAYATHRIMRS",
        "sellingPrice": 141666,
        "ticketNo": "1769292567757"
      }
    ],
    "flyDate": "12/12/2026",
    "quote": "LKR 141,666",
    "currency": "LKR",
    "customer": "MR NISHANTHA",
    "arrivalTime": "12:55",
    "returnDate": "18/12/2026"
  },
  {
    "isGroupBooking": true,
    "pricingMode": "total",
    "profitPerPax": 763,
    "arrivalLocation": "Doha (DOH)",
    "serviceFee": 0,
    "groupSize": 2,
    "supplier": "SEAGUL global",
    "profit": 1526,
    "returnDate": "N/A",
    "customerType": "Agency",
    "refundAmount": 123000,
    "baggageAllowance": "25 K",
    "departureLocation": "Colombo (CMB)",
    "pnr": "J2JBCM",
    "totalRefundable": 123000,
    "reissueCategory": "Standard Reissue",
    "comment": "E-ticket confirmed and sent to passenger",
    "newBooking": "J2JBCM",
    "flightNo": "QR 663",
    "tickets": [
      "1572140446858",
      "1572140446859"
    ],
    "outcome": "Ticket Active & Tracked",
    "arrivalTime": "05:55",
    "travelers": [
      {
        "sellingPrice": 61500,
        "name": "MOHAMED PAHAD MOHAMAD IJAS",
        "ticketNo": "1572140446858",
        "costPrice": 60737,
        "id": "trv-1789372895157-1"
      },
      {
        "costPrice": 60737,
        "ticketNo": "1572140446859",
        "name": "BASEERA UMMA NOORDEEN",
        "id": "trv-1789373072443-2",
        "sellingPrice": 61500
      }
    ],
    "id": "tkt-1789373209015",
    "airline": "Qatar Airways",
    "profitMargin": 1.2,
    "timeline": [
      {
        "date": "14/09/2026",
        "completed": true,
        "title": "ISSUED",
        "id": "tm-1"
      },
      {
        "title": "FLOWN / COMPLETED",
        "id": "tm-2",
        "completed": false,
        "date": "06/10/2026"
      }
    ],
    "cabinClass": "Economy",
    "sellingPrice": 123000,
    "flyDate": "06/10/2026",
    "currency": "LKR",
    "customer": "FAAHIM UNCLE",
    "status": "Issued / Confirmed",
    "branch": "Negombo",
    "itinerary": [
      {
        "flightNo": "QR 663",
        "id": "itin-1789373209015",
        "route": "Colombo (CMB) → Doha (DOH)",
        "dateTime": "06/10/2026 10:00"
      }
    ],
    "quote": "LKR 123,000",
    "tripType": "One Way",
    "requestDate": "14/09/2026",
    "costPerPax": 60737,
    "paymentStatus": "Pending",
    "sellingPerPax": 61500,
    "costPrice": 121474,
    "groupName": "FAAHIM UNCLE",
    "departureTime": "03:35",
    "createdAt": "2026-09-14T08:06:49.015Z",
    "refundReason": "New Flight Ticket Issued"
  },
  {
    "baggageAllowance": "40 KG",
    "costPrice": 142693,
    "profitPerPax": 5300,
    "supplier": "SEAGUL global",
    "createdAt": "2026-09-15T07:23:49.838Z",
    "quote": "LKR 147,993",
    "itinerary": [
      {
        "dateTime": "27/09/2026 10:00",
        "id": "itin-1789457029838",
        "route": "Colombo (CMB) → Dubai (DXB)",
        "flightNo": "EK 0651"
      }
    ],
    "newBooking": "67BM2W",
    "refundAmount": 147993,
    "customerType": "Customer",
    "returnArrivalTime": "16:50",
    "flyDate": "27/09/2026",
    "pnr": "67BM2W",
    "flightNo": "EK 0651",
    "returnDate": "03/10/2026",
    "isGroupBooking": false,
    "profit": 5300,
    "requestDate": "15/09/2026",
    "serviceFee": 0,
    "tickets": [
      "1769292569405"
    ],
    "timeline": [
      {
        "title": "ISSUED",
        "date": "15/09/2026",
        "completed": true,
        "id": "tm-1"
      },
      {
        "completed": false,
        "date": "27/09/2026",
        "id": "tm-2",
        "title": "FLOWN / COMPLETED"
      }
    ],
    "travelers": [
      {
        "costPrice": 142693,
        "name": "MOHAMED NIZAM/MOHAMED MUNAFERMR",
        "ticketNo": "1769292569405",
        "sellingPrice": 147993,
        "id": "trv-1789457029837"
      }
    ],
    "arrivalLocation": "Dubai (DXB)",
    "comment": "E-ticket confirmed and sent to passenger",
    "returnFlightNo": "EK 0654",
    "profitMargin": 3.6,
    "sellingPrice": 147993,
    "currency": "LKR",
    "costPerPax": 142693,
    "airline": "Emirates",
    "id": "tkt-1789457029837",
    "customer": "MUNAFER",
    "outcome": "Ticket Active & Tracked",
    "totalRefundable": 147993,
    "branch": "Negombo",
    "reissueCategory": "Standard Reissue",
    "status": "Issued / Confirmed",
    "departureLocation": "Colombo (CMB)",
    "paymentStatus": "Paid",
    "arrivalTime": "12:55",
    "tripType": "Round Trip",
    "refundReason": "New Flight Ticket Issued",
    "sellingPerPax": 147993,
    "groupSize": 1,
    "departureTime": "10:05",
    "cabinClass": "Economy",
    "returnDepartureTime": "10:45"
  }
];

export const INITIAL_VISAS: VisaFollowup[] = [
  {
    "customer": "Ashfaq Naseem",
    "branch": "Negombo",
    "submissionDate": "12/08/2026",
    "currency": "LKR",
    "icpFileNo": "301/2026/114/0177406",
    "status": "Closed",
    "lastName": "THAMBI",
    "id": "v-1786538324881",
    "dob": "03/11/2001",
    "passportNo": "P1113145",
    "destinationCountry": "United Arab Emirates (UAE)",
    "passportExpiry": "N/A",
    "createdAt": "2026-08-12T12:38:44.881Z",
    "expiryDate": "14/09/2026",
    "firstName": "MUHAMMAMADU NIKAB PAKKEER",
    "unifiedNumber": "89640920",
    "entryDate": "15/08/2026",
    "nationality": "SRI LANKA",
    "visaCategory": "30 Days (P)",
    "customerType": "Agency",
    "remarks": ""
  },
  {
    "branch": "Negombo",
    "passportExpiry": "N/A",
    "status": "Extended",
    "entryDate": "18/08/2026",
    "createdAt": "2026-08-12T12:41:21.308Z",
    "firstName": "SESHAN UDARA",
    "paymentStatus": "Paid",
    "unifiedNumber": "89642110",
    "icpFileNo": "301/2026/114/0177846",
    "destinationCountry": "United Arab Emirates (UAE)",
    "remarks": "",
    "expiryDate": "17/10/2026",
    "nationality": "SRI LANKA",
    "passportNo": "P1144431",
    "customer": "Inzam",
    "submissionDate": "12/08/2026",
    "lastName": "KEERTHISINGHE",
    "currency": "LKR",
    "supplier": "Happy Land Travel",
    "dob": "09/01/2002",
    "id": "v-1786538481308",
    "customerType": "Agency",
    "visaCategory": "Tourist visa - single trip - 60 days"
  },
  {
    "visaFileName": "P0422211.pdf",
    "icpFileNo": "301/2026/114/0177838",
    "passportExpiry": "N/A",
    "paymentStatus": "Paid",
    "status": "Closed",
    "supplier": "CONQUER TRAVEL",
    "branch": "Negombo",
    "visaCategory": "Tourist visa - single trip - 60 days",
    "remarks": "",
    "entryDate": "19/06/2026",
    "firstName": "IMAN GUNATHILAKE LIYANA",
    "customer": "Inzam",
    "id": "v-1786538659356",
    "currency": "LKR",
    "unifiedNumber": "89642102",
    "dob": "29/12/1999",
    "lastName": "ARACHCHIGE",
    "destinationCountry": "United Arab Emirates (UAE)",
    "nationality": "SRI LANKA",
    "customerType": "Agency",
    "expiryDate": "24/08/2026",
    "passportNo": "P0422211",
    "createdAt": "2026-08-12T12:44:19.356Z",
    "submissionDate": "12/08/2026"
  },
  {
    "firstName": "LASITHA CHERITH",
    "createdAt": "2026-08-12T12:54:04.339Z",
    "passportExpiry": "N/A",
    "remarks": "",
    "entryDate": "N/A",
    "dob": "08/10/1987",
    "status": "Closed",
    "id": "v-1786539244338",
    "nationality": "SRI LANKA",
    "submissionDate": "12/08/2026",
    "branch": "Negombo",
    "lastName": "WALGAMA WALGAMGE",
    "visaFileName": "0001.pdf",
    "currency": "LKR",
    "customerType": "Agency",
    "destinationCountry": "United Arab Emirates (UAE)",
    "unifiedNumber": "260850667",
    "expiryDate": "20/08/2026",
    "icpFileNo": "201/2026/11400576860",
    "visaCategory": "Tourism - Single - 60 Days",
    "customer": "shifan",
    "passportNo": "N8649731"
  },
  {
    "currency": "LKR",
    "supplier": "Musafir B2B",
    "lastName": "MEEGAMAWAGE",
    "passportExpiry": "N/A",
    "paymentStatus": "Pending",
    "createdAt": "2026-08-12T12:57:21.111Z",
    "remarks": "",
    "unifiedNumber": "260850689",
    "firstName": "MALSHI PUNSARA WAIDYARATHNA",
    "expiryDate": "20/08/2026",
    "entryDate": "N/A",
    "passportNo": "N9350294",
    "customer": "shifan",
    "isGroup": false,
    "nationality": "SRI LANKA",
    "dob": "06/01/1999",
    "id": "v-1786539441111",
    "submissionDate": "12/08/2026",
    "branch": "Negombo",
    "visaCategory": "Tourism - Single - 60 Days",
    "customerType": "Agency",
    "icpFileNo": "201/2026/11400576861",
    "status": "Closed",
    "destinationCountry": "United Arab Emirates (UAE)"
  },
  {
    "lastName": "SHAIK",
    "nationality": "INDIA",
    "remarks": "",
    "currency": "LKR",
    "submissionDate": "12/08/2026",
    "icpFileNo": "204/2026/87340113",
    "dob": "10/06/1985",
    "passportNo": "U3284953",
    "expiryDate": "21/08/2026",
    "customer": "Ahaln Travel",
    "id": "v-1786539696011",
    "unifiedNumber": "75923038",
    "status": "Closed",
    "entryDate": "22/06/2026",
    "branch": "Negombo",
    "passportExpiry": "N/A",
    "customerType": "Agency",
    "visaCategory": "60 Days (P)",
    "createdAt": "2026-08-12T13:01:36.012Z",
    "firstName": "KHAJA MASTAN SHAIK HUSSAIN SAHEB"
  },
  {
    "remarks": "",
    "createdAt": "2026-08-12T13:06:44.146Z",
    "id": "v-1786540004146",
    "firstName": "SURESH VIJAY",
    "destinationCountry": "United Arab Emirates (UAE)",
    "dob": "06/06/1988",
    "expiryDate": "28/09/2026",
    "passportNo": "AK405807",
    "passportExpiry": "N/A",
    "entryDate": "30/07/2026",
    "unifiedNumber": "260864097",
    "status": "Closed",
    "paymentStatus": "Paid",
    "branch": "Negombo",
    "customer": "Dream Travenza (Nufais)",
    "submissionDate": "12/08/2026",
    "icpFileNo": "201/2026/11400582810",
    "visaCategory": "Tourism - Single - 60 Days",
    "lastName": "VIJAY",
    "customerType": "Agency",
    "currency": "LKR",
    "supplier": "Musafir B2B",
    "nationality": "INDIA"
  },
  {
    "unifiedNumber": "260873902",
    "entryDate": "N/A",
    "lastName": "DAWOOD",
    "id": "v-1786540553627",
    "currency": "LKR",
    "passportExpiry": "N/A",
    "expiryDate": "N/A",
    "customer": "Dream Travenza (Nufais)",
    "createdAt": "2026-08-12T13:15:53.627Z",
    "firstName": "KATHIJA BEE SHEIK",
    "passportNo": "R7407959",
    "branch": "Negombo",
    "icpFileNo": "201/2026/11400586105",
    "status": "Closed",
    "remarks": "",
    "submissionDate": "12/08/2026",
    "visaCategory": "Tourism - Single - 60 Days",
    "dob": "08/11/1981",
    "nationality": "INDIA",
    "customerType": "Agency"
  },
  {
    "passportExpiry": "N/A",
    "customerType": "Agency",
    "visaCategory": "60 Days",
    "expiryDate": "24/09/2026",
    "remarks": "",
    "id": "v-1786544234144",
    "dob": "02/09/1990",
    "unifiedNumber": "42152304",
    "passportNo": "N8960998",
    "icpFileNo": "301/2026/114/0195169",
    "status": "Closed",
    "firstName": "MOHAMED RIFAS HAMEEDU",
    "lastName": "SIDDIQUE",
    "branch": "Negombo",
    "currency": "LKR",
    "createdAt": "2026-08-12T14:17:14.144Z",
    "entryDate": "26/07/2026",
    "customer": "Vizatickz Travel",
    "submissionDate": "12/08/2026",
    "nationality": "SRI LANKA"
  },
  {
    "lastName": "LATHEEF",
    "currency": "LKR",
    "remarks": "",
    "dob": "24/02/1973",
    "icpFileNo": "201/2026/11400586104",
    "visaCategory": "Tourism - Single - 60 Days",
    "submissionDate": "14/08/2026",
    "unifiedNumber": "260873729",
    "customerType": "Agency",
    "paymentStatus": "Paid",
    "customer": "Jahid Sir",
    "branch": "Negombo",
    "id": "v-1786711030749",
    "createdAt": "2026-08-14T12:37:10.749Z",
    "status": "Closed",
    "passportExpiry": "N/A",
    "firstName": "MALIHA UMMA",
    "expiryDate": "30/08/2026",
    "nationality": "SRI LANKA",
    "entryDate": "31/06/2026",
    "passportNo": "N9239688",
    "destinationCountry": "United Arab Emirates (UAE)"
  }
];

export const INITIAL_COMMENTS: ActivityComment[] = [];
