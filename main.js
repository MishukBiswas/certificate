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

  // Set up fonts and text styles
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0); // Default black text color
  
  // Draw border around the certificate (simple rectangle)
  doc.setLineWidth(1);
  doc.rect(10, 10, 190, 277); // x, y, width, height

  // Title of the certificate
  doc.setFontSize(24);
  doc.setTextColor(0, 0, 128); // Dark blue color
  doc.text("Certificate of Completion", 105, 40, { align: "center" });

  // Add name, passport number, and course
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0); // Black color for the body text
  doc.text(`This is to certify that ${name}`, 105, 60, { align: "center" });
  doc.text(`Passport No/ DOB: ${passport}`, 105, 70, { align: "center" });
  doc.text(`has successfully completed the course titled ${course}.`, 105, 80, { align: "center" });

  // Additional description about the course
  doc.setFontSize(12);
  doc.text("The course was designed to enhance the participant's knowledge relevant to the field,", 105, 100, { align: "center" });
  doc.text(name + " has demonstrated a comprehensive understanding and commitment ", 105, 110, { align: "center" });
  doc.text(name + "throughout the program.", 105, 120, { align: "center" });
  doc.text("We wish him/her continued success in their future endeavors.", 105, 130, { align: "center" });

  // Footer with issuer's name
  doc.text("Issued by: Mishuk", 105, 160, { align: "center" });
  
  // Add Verification URL to the certificate
  doc.setFontSize(5);
  doc.setTextColor(0, 0, 255); // Blue color for the verification link
  doc.text("Certificate Verification: ", 105, 275, { align: "center" });
  


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

    // Update the certificate URL with the verification link
    const verificationURL = `${window.location.origin}/verify.html?docId=${docRef.id}`;
    doc.text(verificationURL, 105, 280, { align: "center" });

    // Optionally, update the Firestore document with the verification URL
    await addDoc(collection(db, "certificates"), {
      certificate_verification_url: verificationURL
    });
      // Save the certificate as a PDF
    doc.save(`${name}_certificate.pdf`);


    // Alert the user that the certificate was created successfully
    alert("Certificate created and stored successfully!");
  } catch (error) {
    // Handle errors
    alert("Error creating certificate: " + error.message);
  }
});
