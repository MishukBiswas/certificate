// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBKVIy0MUilyz0LGjaxVifXm_iDdIyd9FE",
  authDomain: "certificate-generator-59024.firebaseapp.com",
  projectId: "certificate-generator-59024",
  storageBucket: "certificate-generator-59024.firebasestorage.app",
  messagingSenderId: "566209550951",
  appId: "1:566209550951:web:f8658bc62ee9315bcb52c2",
  measurementId: "G-GYVN526CFP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Event listener for form submission
document.getElementById('certificateForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  // Collect form data
  const name = document.getElementById('name').value;
  const passport = document.getElementById('passport').value;
  const course = document.getElementById('course').value;

  // Generate PDF with jsPDF
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Register Playfair Display font if available
  if (doc.addFileToVFS && doc.addFont) {
    // The PlayfairDisplay-normal.js script should register the font globally
    doc.addFont('PlayfairDisplay-normal.ttf', 'PlayfairDisplay', 'normal');
  }

  // Set up fonts and text styles
  doc.setFont("PlayfairDisplay", "normal");
  doc.setTextColor(0, 0, 128); // Dark blue color
  doc.setFontSize(28);
  doc.text("Certificate of Completion", 105, 48, { align: "center" });

  // Add name, passport number, and course
  doc.setFont("PlayfairDisplay", "normal");
  doc.setFontSize(18);
  doc.setTextColor(0, 0, 0);
  doc.text(`This is to certify that`, 105, 70, { align: "center" });
  doc.setFontSize(20);
  doc.text(name, 105, 82, { align: "center" });
  doc.setFontSize(14);
  doc.text(`Passport No/ DOB: ${passport}`, 105, 96, { align: "center" });
  doc.setFontSize(16);
  doc.text(`has successfully completed the course titled`, 105, 110, { align: "center" });
  doc.setFontSize(18);
  doc.text(course, 105, 122, { align: "center" });

  // Additional description about the course
  doc.setFont("PlayfairDisplay", "normal");
  doc.setFontSize(12);
  let descY = 140;
  doc.text("The course was designed to enhance the participant's knowledge relevant to the field,", 105, descY, { align: "center" });
  descY += 10;
  doc.text(name + " has demonstrated a comprehensive understanding and commitment", 105, descY, { align: "center" });
  descY += 10;
  doc.text(name + " throughout the program.", 105, descY, { align: "center" });
  descY += 10;
  doc.text("We wish him/her continued success in their future endeavors.", 105, descY, { align: "center" });

  // Footer with issuer's name
  doc.setFont("PlayfairDisplay", "normal");
  doc.setFontSize(13);
  doc.text("Issued by: Mishuk", 105, 200, { align: "center" });

  // --- UI Improvements ---
  // Add a refined border for a more professional look
  doc.setDrawColor(44, 62, 80); // Deep navy/dark gray color
  doc.setLineWidth(1.5); // Thinner border
  doc.rect(15, 15, 180, 267, 'S');

  // Add a signature line
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.line(60, 215, 150, 215); // x1, y1, x2, y2
  doc.setFont("PlayfairDisplay", "normal");
  doc.setFontSize(11);
  doc.text("Signature", 105, 222, { align: "center" });

  // Add a seal image (seal.png) at the top right
  doc.addImage('seal.png', 'PNG', 155, 35, 40, 40); // x, y, width, height

  // Store certificate data in Firestore
  try {
    // Save certificate metadata in Firestore (without storing the PDF itself)
    const docRef = await addDoc(collection(db, "certificates"), {
      name: name,
      dob_or_passport: passport,
      course: course,
      issue_date: serverTimestamp(),
      verified: true // Mark certificate as verified
    });

    // Generate the verification URL
    const verificationURL = `${window.location.origin}/verify.html?docId=${docRef.id}`;

    // Generate QR code as a data URL using QRCode.js
    const qrDiv = document.createElement('div');
    new window.QRCode(qrDiv, {
      text: verificationURL,
      width: 80,
      height: 80,
      correctLevel: window.QRCode.CorrectLevel.H
    });

    // Wait for QR code to render, then add to PDF and save
    setTimeout(async () => {
      let qrDataUrl = '';
      const qrImg = qrDiv.querySelector('img');
      if (qrImg) {
        qrDataUrl = qrImg.src;
      } else {
        // fallback for some browsers
        const canvas = qrDiv.querySelector('canvas');
        if (canvas) {
          qrDataUrl = canvas.toDataURL('image/png');
        }
      }

      // Add QR code image to the PDF
      if (qrDataUrl) {
        doc.addImage(qrDataUrl, 'PNG', 90, 245, 30, 30); // x, y, width, height
        doc.setFont("PlayfairDisplay", "normal");
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 128);
        doc.text("Scan to verify certificate", 105, 282, { align: "center" });
      }

      // Optionally, update the Firestore document with the verification URL
      await addDoc(collection(db, "certificates"), {
        certificate_verification_url: verificationURL
      });
      // Save the certificate as a PDF
      doc.save(`${name}_certificate.pdf`);

      // Alert the user that the certificate was created successfully
      alert("Certificate created and stored successfully!");
    }, 150); // 150ms delay to ensure QR code is rendered
  } catch (error) {
    // Handle errors
    alert("Error creating certificate: " + error.message);
  }
});
