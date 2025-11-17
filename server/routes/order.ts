import { RequestHandler } from "express";
import nodemailer from "nodemailer";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

interface OrderItem {
  name: string;
  strength: string;
  quantity: number;
}

interface OrderRequest {
  orderNumber: string;
  customerName: string;
  storeName: string;
  email: string;
  phone: string;
  items: OrderItem[];
  timestamp: string;
}

export const handleOrderPDF: RequestHandler = async (req, res) => {
  try {
    console.log("Order PDF request received");
    const {
      orderNumber,
      customerName,
      storeName,
      email,
      phone,
      items,
      timestamp,
    } = req.body as OrderRequest;

    // Validate required fields
    if (
      !orderNumber ||
      !customerName ||
      !storeName ||
      !email ||
      !phone ||
      !items ||
      !timestamp
    ) {
      console.error("Missing required fields:", {
        orderNumber,
        customerName,
        storeName,
        email,
        phone,
        items,
        timestamp,
      });
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    console.log(`Generating PDF for order ${orderNumber}`);

    // Create invoices directory if it doesn't exist
    const invoicesDir = path.join(process.cwd(), "invoices");
    if (!fs.existsSync(invoicesDir)) {
      fs.mkdirSync(invoicesDir, { recursive: true });
    }

    // Create PDF with order number as filename
    const filePath = path.join(invoicesDir, `${orderNumber}.pdf`);
    const doc = new PDFDocument();

    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    // PDF Header
    doc.fontSize(24).text("ORDER INVOICE", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(12).text(`Order Number: ${orderNumber}`, { align: "center" });
    doc.moveDown(1);

    // Customer Information
    doc.fontSize(12).font("Helvetica-Bold").text("Customer Information");
    doc.font("Helvetica");
    doc.text(`Name: ${customerName}`);
    doc.text(`Store Name: ${storeName}`);
    doc.text(`Email: ${email}`);
    doc.text(`Phone: ${phone}`);
    doc.text(`Date: ${timestamp}`);
    doc.moveDown(1);

    // Order Items
    doc.fontSize(12).font("Helvetica-Bold").text("Order Items");
    doc.font("Helvetica");
    doc.moveDown(0.3);

    items.forEach((item) => {
      doc.text(
        `• ${item.name} (${item.strength}) - Quantity: ${item.quantity}`,
        {
          indent: 20,
        },
      );
    });

    doc.moveDown(1);
    doc.fontSize(10).text("Thank you for your order!", { align: "center" });

    doc.end();

    // Wait for the PDF to be fully written
    await new Promise<void>((resolve, reject) => {
      const handleFinish = () => {
        writeStream.removeListener("error", handleError);
        doc.removeListener("error", handleError);
        resolve();
      };
      const handleError = (err: Error) => {
        writeStream.removeListener("finish", handleFinish);
        doc.removeListener("finish", handleFinish);
        reject(err);
      };
      writeStream.on("finish", handleFinish);
      writeStream.on("error", handleError);
      doc.on("error", handleError);
    });

    console.log(`PDF created successfully at ${filePath}`);

    // Send email
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn("Email credentials not configured, skipping email");
      res.json({
        success: true,
        message:
          "Invoice generated successfully! (Email sending is not configured)",
        orderNumber,
      });
      return;
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: [email, "nexpointdistributions@outlook.com"],
      subject: `Order Confirmation - ${orderNumber}`,
      text: `Hi ${customerName},\n\nThank you for your order from Nexpoint! Please find your invoice attached.\n\nOrder Number: ${orderNumber}\n\nBest regards,\nNEXPOINT Team`,
      attachments: [
        {
          filename: `${orderNumber}.pdf`,
          path: filePath,
        },
      ],
    };

    const emailResult = await transporter.sendMail(mailOptions);
    console.log(
      `Email sent successfully for order ${orderNumber}:`,
      emailResult.messageId,
    );

    res.json({
      success: true,
      message: "Invoice generated and sent successfully!",
      orderNumber,
    });
  } catch (error) {
    console.error("Error generating PDF or sending email:", error);
    res.status(500).json({
      error: "Failed to generate invoice or send email",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
